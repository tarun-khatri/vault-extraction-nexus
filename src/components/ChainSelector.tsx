
import React from 'react';
import { useChain, ChainType } from '../context/ChainContext';
import { useWallet } from '../context/WalletContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const ChainSelector = () => {
  const { currentChain, chains, setChain, chainConfigs } = useChain();
  const { switchChain, isConnected } = useWallet();

  const handleChainChange = async (chain: ChainType) => {
    setChain(chain);
    if (isConnected) {
      await switchChain(chainConfigs[chain].id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
          <span className="mr-2">{chainConfigs[currentChain].icon}</span>
          {chainConfigs[currentChain].name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
        {chains.map((chain) => (
          <DropdownMenuItem 
            key={chain} 
            onClick={() => handleChainChange(chain)}
            className={`cursor-pointer hover:bg-slate-700 ${currentChain === chain ? 'bg-slate-700' : ''}`}
          >
            <span className="mr-2">{chainConfigs[chain].icon}</span>
            <span className="text-white">{chainConfigs[chain].name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChainSelector;
