
import React from 'react';
import ConnectWalletButton from './ConnectWalletButton';
import ChainSelector from './ChainSelector';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  // Determine the title based on the current path
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/core-pool') return 'Core pool';
    if (path === '/isolated-pools') return 'Isolated pools';
    if (path === '/vaults') return 'Vaults';
    if (path === '/governance') return 'Governance';
    if (path === '/bridge') return 'Bridge';
    if (path === '/nft') return 'NFT';
    if (path === '/admin') return 'Admin Panel';
    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-[#191E29] border-b border-slate-700 flex items-center justify-between px-6">
      <h1 className="text-xl font-medium text-white">{getTitle()}</h1>
      <div className="flex items-center gap-4">
        <ChainSelector />
        <ConnectWalletButton />
      </div>
    </header>
  );
};

export default Header;
