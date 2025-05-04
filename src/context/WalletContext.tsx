
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

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

  // Mock implementation for connecting wallet
  const connectWallet = async () => {
    try {
      // This is a mock implementation - in production, this would connect to an actual wallet
      setTimeout(() => {
        setIsConnected(true);
        setAddress('0x1234...5678');
        setWalletType('metamask');
        setBalance('1.35 ETH');
        setChainId('0x1');
        toast.success('Wallet connected successfully');
      }, 500);
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setWalletType('none');
    setBalance('0');
    setChainId(null);
    toast.info('Wallet disconnected');
  };

  const switchChain = async (chain: string) => {
    try {
      // Mock implementation for switching chains
      toast.info(`Switching to ${chain}...`);
      setTimeout(() => {
        setChainId(chain);
        toast.success(`Switched to ${chain}`);
      }, 500);
    } catch (error) {
      toast.error(`Failed to switch to ${chain}`);
      console.error('Error switching chain:', error);
    }
  };

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
