
import React from 'react';
import Logo from './Logo';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      path: '/',
    },
    {
      id: 'core-pool',
      label: 'Core pool',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5"/>
          <path d="M3 12a9 3 0 0 0 18 0"/>
        </svg>
      ),
      path: '/core-pool',
    },
    {
      id: 'isolated-pools',
      label: 'Isolated pools',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
        </svg>
      ),
      path: '/isolated-pools',
    },
    {
      id: 'vaults',
      label: 'Vaults',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      path: '/vaults',
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-landmark">
          <line x1="3" x2="21" y1="22" y2="22"/>
          <line x1="6" x2="6" y1="18" y2="11"/>
          <line x1="10" x2="10" y1="18" y2="11"/>
          <line x1="14" x2="14" y1="18" y2="11"/>
          <line x1="18" x2="18" y1="18" y2="11"/>
          <polygon points="12 2 20 7 4 7"/>
        </svg>
      ),
      path: '/governance',
    },
    {
      id: 'bridge',
      label: 'Bridge',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bridge">
          <path d="M6 12v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
          <path d="M22 6H2"/>
          <path d="M18 6v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6"/>
          <path d="M6 6v12"/>
          <path d="M18 6v12"/>
        </svg>
      ),
      path: '/bridge',
    },
    {
      id: 'nft',
      label: 'NFT',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      ),
      path: '/nft',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      path: '/admin',
    },
  ];

  return (
    <div className="w-64 bg-[#191E29] h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-6">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center px-6 py-3 cursor-pointer hover:bg-slate-800 transition-colors ${
                location.pathname === item.path ? 'bg-slate-800 border-l-4 border-venus-blue' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="text-slate-400 mr-4">{item.icon}</span>
              <span className={`${location.pathname === item.path ? 'text-white' : 'text-slate-300'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
