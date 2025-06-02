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
  balance: bigint;
  balanceUSD: number;
  chain: ChainType;
  supportsPermit: boolean;
}

// Improved: Stricter check for EIP-2612 support. Now also checks that the permit function exists and is callable using low-level call.
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
    // Try to check if permit function exists using low-level call
    const iface = tokenContract.interface;
    const data = iface.encodeFunctionData('permit', [
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      0,
      Math.floor(Date.now() / 1000) + 3600,
      27,
      ethers.ZeroHash,
      ethers.ZeroHash
    ]);
    try {
      await provider.call({ to: tokenAddress, data });
      // If it doesn't revert, it's definitely present
      console.log(`[PERMIT DETECTION] ${tokenAddress} supports permit: true (call succeeded)`);
      return true;
    } catch (e: any) {
      // If the error is 'function not found' or similar, it's not present
      const msg = (e?.message || '').toLowerCase();
      if (
        msg.includes('function does not exist') ||
        msg.includes('invalid selector') ||
        msg.includes('function not found') ||
        msg.includes('unknown function') ||
        msg.includes('missing revert data') // ethers v6
      ) {
        console.log(`[PERMIT DETECTION] ${tokenAddress} supports permit: false (permit function not found or invalid selector)`, e);
        return false;
      }
      // Any other revert (including custom error, revert reason, etc) means the function exists!
      console.log(`[PERMIT DETECTION] ${tokenAddress} supports permit: true (revert, but function exists)`, e);
      return true;
    }
  } catch (error) {
    console.log(`[PERMIT DETECTION] ${tokenAddress} supports permit: false (error: ${error})`);
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
  let attempts = 0;
  while (attempts < 3) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress, 
        ERC20_ABI, 
        provider
      );
      let balance, decimals, symbol, name;
      [balance, decimals, symbol, name] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name()
      ]);
      // For now, a mock USD value - in production, you would use a price oracle
      const balanceUSD = parseFloat(ethers.formatUnits(balance, decimals)) * 10; // Mock price $10
      const supportsPermit = await checkPermitSupport(provider, tokenAddress);
      console.log(`[TOKEN INFO] ${symbol} (${tokenAddress}) supportsPermit: ${supportsPermit}`);
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
    } catch (tokenMetaError) {
      attempts++;
      if (attempts >= 3) {
        console.warn(`Skipping token ${tokenAddress}: could not fetch metadata after 3 attempts.`, tokenMetaError);
        return null;
      }
      await new Promise(res => setTimeout(res, 1000)); // wait 1s before retry
    }
  }
  return null;
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
  
  // Log all tokens and their balances for debugging
  const allTokens = await Promise.all(tokenPromises);
  allTokens.forEach(token => {
    if (token) {
      console.log(`[DEBUG] Token: ${token.symbol} (${token.address}), Balance: ${token.balance.toString()}`);
    } else {
      console.log('[DEBUG] Token: null (failed to fetch metadata)');
    }
  });
  // Only keep tokens with positive balance
  const tokens = allTokens.filter(
    token => token !== null && token.balance > 0n
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
    holesky: { symbol: 'ETH', name: 'Ethereum' },
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
