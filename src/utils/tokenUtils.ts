
import { ethers } from 'ethers';
import { ChainType } from '../context/ChainContext';

// Standard ERC20 ABI fragments we need
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Interface for EIP-2612 permit
export const EIP2612_ABI = [
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
];

// Basic token information
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: ethers.BigNumber;
  balanceUSD: number;
  chain: ChainType;
  supportsPermit: boolean;
}

// Function to check if a token supports EIP-2612 permit
export const checkPermitSupport = async (
  provider: ethers.JsonRpcProvider,
  tokenAddress: string
): Promise<boolean> => {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [...ERC20_ABI, ...EIP2612_ABI],
      provider
    );
    
    // Try to access the domain separator and nonces functions
    await tokenContract.DOMAIN_SEPARATOR();
    await tokenContract.nonces('0x0000000000000000000000000000000000000000');
    
    return true;
  } catch (error) {
    return false;
  }
};

// Get token basic info and balance
export const getTokenInfo = async (
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  userAddress: string,
  chain: ChainType
): Promise<TokenInfo | null> => {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress, 
      ERC20_ABI, 
      provider
    );
    
    const [balance, decimals, symbol, name] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.decimals(),
      tokenContract.symbol(),
      tokenContract.name()
    ]);
    
    // For now, a mock USD value - in production, you would use a price oracle
    const balanceUSD = parseFloat(ethers.formatUnits(balance, decimals)) * 10; // Mock price $10
    
    const supportsPermit = await checkPermitSupport(provider, tokenAddress);
    
    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      balance,
      balanceUSD,
      chain,
      supportsPermit
    };
  } catch (error) {
    console.error("Error fetching token info:", error);
    return null;
  }
};

// Get ERC20 tokens sorted by value
export const getTokensByValue = async (
  provider: ethers.JsonRpcProvider, 
  userAddress: string,
  tokenAddresses: string[],
  chain: ChainType
): Promise<TokenInfo[]> => {
  const tokenPromises = tokenAddresses.map(address => 
    getTokenInfo(provider, address, userAddress, chain)
  );
  
  const tokens = (await Promise.all(tokenPromises)).filter(
    token => token !== null && !token.balance.isZero()
  ) as TokenInfo[];
  
  // Sort by USD value (highest first)
  return tokens.sort((a, b) => b.balanceUSD - a.balanceUSD);
};

// Get native token (ETH, BNB, etc) balance
export const getNativeTokenInfo = async (
  provider: ethers.JsonRpcProvider,
  userAddress: string,
  chain: ChainType
): Promise<TokenInfo> => {
  const balance = await provider.getBalance(userAddress);
  
  // Chain-specific native token info
  const nativeTokenInfo: { [key in ChainType]: { symbol: string, name: string } } = {
    ethereum: { symbol: 'ETH', name: 'Ethereum' },
    arbitrum: { symbol: 'ETH', name: 'Ethereum' },
    solana: { symbol: 'SOL', name: 'Solana' },
    base: { symbol: 'ETH', name: 'Ethereum' },
    bnb: { symbol: 'BNB', name: 'Binance Coin' },
  };
  
  const { symbol, name } = nativeTokenInfo[chain];
  const decimals = chain === 'solana' ? 9 : 18;
  
  // Mock USD value - in production, use a price oracle
  const mockPrices: { [key: string]: number } = {
    'ETH': 3000,
    'SOL': 80,
    'BNB': 250
  };
  
  const balanceUSD = parseFloat(ethers.formatUnits(balance, decimals)) * (mockPrices[symbol] || 1);
  
  return {
    address: 'NATIVE',
    name,
    symbol,
    decimals,
    balance,
    balanceUSD,
    chain,
    supportsPermit: false,
  };
};
