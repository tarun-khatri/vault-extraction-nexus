
import React from 'react';
import StatCard from '../components/StatCard';
import MarketTable from '../components/MarketTable';
import AlertBanner from '../components/AlertBanner';

const CorePool = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Supply" value="$2.19B" />
        <StatCard title="Total Borrow" value="$567.09M" />
        <StatCard title="Available Liquidity" value="$1.63B" />
        <StatCard title="Assets" value="36" />
      </div>

      <AlertBanner message="Supplying tokens to the Core Pool pool will increase your borrow limit for this pool only, effectively enabling you to borrow tokens from this pool only." />

      <div className="bg-[#191E29] rounded-lg shadow-md overflow-hidden">
        <MarketTable />
      </div>
    </div>
  );
};

export default CorePool;
