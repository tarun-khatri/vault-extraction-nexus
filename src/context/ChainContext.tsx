
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define chains we support
export type ChainType = 'ethereum' | 'arbitrum' | 'solana' | 'base' | 'bnb';

// Chain configuration
interface ChainConfig {
  name: string;
  id: string;
  icon: string;
  symbol: string;
  explorerUrl: string;
  rpcUrl: string;
}

// Chain maps
const chainConfigs: Record<ChainType, ChainConfig> = {
  ethereum: {
    name: 'Ethereum',
    id: '0x1',
    icon: '🔷',
    symbol: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/',
  },
  arbitrum: {
    name: 'Arbitrum',
    id: '0xa4b1',
    icon: '🔵',
    symbol: 'ARB',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  solana: {
    name: 'Solana',
    id: 'solana-mainnet',
    icon: '🟣',
    symbol: 'SOL',
    explorerUrl: 'https://explorer.solana.com',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
  base: {
    name: 'Base',
    id: '0x2105',
    icon: '🔶',
    symbol: 'ETH',
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
  },
  bnb: {
    name: 'BNB Chain',
    id: '0x38',
    icon: '🟡',
    symbol: 'BNB',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.binance.org',
  },
};

// Context type
interface ChainContextType {
  currentChain: ChainType;
  chains: ChainType[];
  chainConfigs: Record<ChainType, ChainConfig>;
  setChain: (chain: ChainType) => void;
  getChainConfig: (chain: ChainType) => ChainConfig;
}

// Create context
const ChainContext = createContext<ChainContextType | undefined>(undefined);

// Provider component
export const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [currentChain, setCurrentChain] = useState<ChainType>('ethereum');
  const chains: ChainType[] = ['ethereum', 'arbitrum', 'solana', 'base', 'bnb'];

  const setChain = (chain: ChainType) => {
    setCurrentChain(chain);
  };

  const getChainConfig = (chain: ChainType) => {
    return chainConfigs[chain];
  };

  // Value object
  const value = {
    currentChain,
    chains,
    chainConfigs,
    setChain,
    getChainConfig,
  };

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
};

// Custom hook for using the chain context
export const useChain = () => {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};
