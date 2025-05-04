
import React from 'react';
import StatCard from '../components/StatCard';
import { Button } from '@/components/ui/button';
import { useWallet } from '../context/WalletContext';

const Dashboard = () => {
  const { isConnected } = useWallet();

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Supply" value="$2.19B" />
        <StatCard title="Total Borrow" value="$567.09M" />
        <StatCard title="Available Liquidity" value="$1.63B" />
        <StatCard title="Assets" value="36" />
      </div>

      {!isConnected ? (
        <div className="bg-[#191E29] p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Venus DeFi</h2>
          <p className="text-slate-300 mb-6">Connect your wallet to start using our multi-chain DeFi platform</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Supply Assets</h3>
              <p className="text-slate-400 mb-4">Provide liquidity and earn interest on your crypto assets</p>
              <Button className="w-full bg-venus-primary hover:bg-venus-secondary" disabled={!isConnected}>
                Supply
              </Button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Borrow Assets</h3>
              <p className="text-slate-400 mb-4">Borrow against your supplied collateral</p>
              <Button className="w-full bg-venus-blue hover:bg-blue-600" disabled={!isConnected}>
                Borrow
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Stake Tokens</h3>
              <p className="text-slate-400 mb-4">Earn rewards by staking your tokens</p>
              <Button className="w-full bg-venus-primary hover:bg-venus-secondary" disabled={!isConnected}>
                Stake
              </Button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">NFT Marketplace</h3>
              <p className="text-slate-400 mb-4">Buy, sell and trade NFTs across chains</p>
              <Button className="w-full bg-venus-primary hover:bg-venus-secondary" disabled={!isConnected}>
                Explore NFTs
              </Button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Bridge Assets</h3>
              <p className="text-slate-400 mb-4">Move your assets between supported chains</p>
              <Button className="w-full bg-venus-primary hover:bg-venus-secondary" disabled={!isConnected}>
                Bridge
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#191E29] p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Your DeFi Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Your Supply</h3>
              <p className="text-3xl font-bold mb-2">$0.00</p>
              <p className="text-slate-400">No assets supplied</p>
              <div className="mt-4">
                <Button className="w-full bg-venus-primary hover:bg-venus-secondary">
                  Supply Assets
                </Button>
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Your Borrowings</h3>
              <p className="text-3xl font-bold mb-2">$0.00</p>
              <p className="text-slate-400">No assets borrowed</p>
              <div className="mt-4">
                <Button className="w-full bg-venus-blue hover:bg-blue-600">
                  Borrow Assets
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Your Staked Tokens</h3>
              <p className="text-xl font-bold mb-2">$0.00</p>
              <p className="text-slate-400 text-sm mb-4">No tokens staked</p>
              <Button size="sm" className="w-full bg-venus-primary hover:bg-venus-secondary">
                Stake Tokens
              </Button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Your NFTs</h3>
              <p className="text-xl font-bold mb-2">0</p>
              <p className="text-slate-400 text-sm mb-4">No NFTs owned</p>
              <Button size="sm" className="w-full bg-venus-primary hover:bg-venus-secondary">
                Browse NFT Market
              </Button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
              <p className="text-slate-400 text-sm mb-4">No recent transactions</p>
              <Button size="sm" className="w-full bg-venus-primary hover:bg-venus-secondary">
                View Transaction History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
