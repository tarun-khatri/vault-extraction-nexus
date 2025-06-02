import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define chains we support
export type ChainType = 'ethereum' | 'arbitrum' | 'solana' | 'base' | 'bnb' | 'holesky';

// Chain configuration
interface ChainConfig {
  name: string;
  id: string;
  icon: string;
  symbol: string;
  explorerUrl: string;
  rpcUrl: string;
  isEVM: boolean;
  tokenListUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
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
    isEVM: true,
    tokenListUrl: 'https://tokens.coingecko.com/ethereum/all.json',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  arbitrum: {
    name: 'Arbitrum',
    id: '0xa4b1',
    icon: '🔵',
    symbol: 'ARB',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    isEVM: true,
    tokenListUrl: 'https://tokens.coingecko.com/arbitrum-one/all.json',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  solana: {
    name: 'Solana',
    id: 'solana-mainnet',
    icon: '🟣',
    symbol: 'SOL',
    explorerUrl: 'https://explorer.solana.com',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    isEVM: false,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    }
  },
  base: {
    name: 'Base',
    id: '0x2105',
    icon: '🔶',
    symbol: 'ETH',
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
    isEVM: true,
    tokenListUrl: 'https://raw.githubusercontent.com/base-org/token-list/main/tokens/mainnet.json',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  bnb: {
    name: 'BNB Chain',
    id: '0x38',
    icon: '🟡',
    symbol: 'BNB',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    isEVM: true,
    tokenListUrl: 'https://tokens.coingecko.com/binance-smart-chain/all.json',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  },
  holesky: {
    name: 'Holesky',
    id: '0x4268',
    icon: '🟦',
    symbol: 'ETH',
    explorerUrl: 'https://holesky.etherscan.io',
    rpcUrl: 'https://ethereum-holesky.publicnode.com',
    isEVM: true,
    tokenListUrl: '',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
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
  const chains: ChainType[] = ['ethereum', 'arbitrum', 'solana', 'base', 'bnb', 'holesky'];

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
