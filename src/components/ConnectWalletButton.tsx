
import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ConnectWalletButton = () => {
  const { isConnected, connectWallet, disconnectWallet, address, balance } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connectWallet();
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
            {address && `${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
          <DropdownMenuItem className="text-slate-300">
            Balance: {balance}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={disconnectWallet} className="text-red-400 cursor-pointer">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      className="bg-venus-blue hover:bg-blue-600 text-white" 
      onClick={handleConnect} 
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : "Connect wallet"}
    </Button>
  );
};

export default ConnectWalletButton;
