// Fetch all ERC20 token contract addresses for a user using Moralis API
// This file is now browser-compatible and only exports the Moralis fetch function

/**
 * Fetch all ERC20 token contract addresses for a user using Moralis API
 * @param {string} userAddress - The wallet address to scan
 * @param {string} chain - Moralis chain name (e.g., 'sepolia', 'arbitrum-sepolia', 'base-sepolia', 'bsc-testnet', 'holesky')
 * @param {string} apiKey - Your Moralis API key
 * @returns {Promise<string[]>} - Array of token contract addresses
 */
export async function fetchAllUserTokenAddressesMoralis(userAddress: string, chain: string, apiKey: string): Promise<string[]> {
  const url = `https://deep-index.moralis.io/api/v2.2/${userAddress}/erc20?chain=${chain}`;
  const res = await fetch(url, {
    headers: {
      'X-API-Key': apiKey
    }
  });
  if (!res.ok) throw new Error(`Moralis API error: ${res.status}`);
  const data = await res.json();
  // Add a delay to avoid hitting Infura/Moralis rate limits
  await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 seconds delay
  if (!Array.isArray(data)) return [];
  // Filter for tokens with a nonzero balance
  const tokenAddresses = data
    .filter((item: any) => item.token_address && item.balance && item.balance !== '0')
    .map((item: any) => item.token_address.toLowerCase());

  // Remove the hardcoded test permit token address logic
  return tokenAddresses;
}
