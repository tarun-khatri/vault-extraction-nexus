
import React from 'react';

interface Token {
  id: string;
  icon: React.ReactNode;
  name: string;
  totalSupply: string;
  supplyApy: string;
  totalBorrow: string;
  borrowApy: string;
  liquidity: string;
}

const MarketTable = () => {
  const tokens: Token[] = [
    {
      id: 'the',
      icon: <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">T</div>,
      name: 'THE',
      totalSupply: '10.36M THE\n$2.61M',
      supplyApy: '4.42%',
      totalBorrow: '4.37M THE\n$1.1M',
      borrowApy: '1.96%',
      liquidity: '5.99M THE\n$1.51M',
    },
    {
      id: 'dai',
      icon: <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white">D</div>,
      name: 'DAI',
      totalSupply: '3.31M DAI\n$3.31M',
      supplyApy: '4.38%',
      totalBorrow: '1.73M DAI\n$1.73M',
      borrowApy: '9.55%',
      liquidity: '1.58M DAI\n$1.58M',
    },
    {
      id: 'tusd',
      icon: <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">T</div>,
      name: 'TUSD',
      totalSupply: '94.55K TUSD\n$94.37K',
      supplyApy: '4.17%',
      totalBorrow: '48.23K TUSD\n$48.14K',
      borrowApy: '9.31%',
      liquidity: '46.31K TUSD\n$46.23K',
    },
    {
      id: 'lisusd',
      icon: <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">L</div>,
      name: 'lisUSD',
      totalSupply: '1.07M lisUSD\n$1.07M',
      supplyApy: '3.92%',
      totalBorrow: '706.88K lisUSD\n$706.29K',
      borrowApy: '6.75%',
      liquidity: '371.98K lisUSD\n$371.67K',
    },
  ];

  const formatTokenValue = (value: string) => {
    const lines = value.split('\n');
    return (
      <>
        <div>{lines[0]}</div>
        <div className="text-slate-400 text-xs">{lines[1]}</div>
      </>
    );
  };

  const formatApy = (apy: string, positive: boolean = true) => {
    return (
      <div className={`flex items-center ${positive ? 'text-green-400' : 'text-red-400'}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`mr-1 ${positive ? 'rotate-0' : 'rotate-180'}`}
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
        {apy}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead>
          <tr className="text-left text-xs text-slate-400">
            <th className="px-6 py-3">Asset</th>
            <th className="px-6 py-3">
              Total supply
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block ml-1"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </th>
            <th className="px-6 py-3">
              Supply APY
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block ml-1"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </th>
            <th className="px-6 py-3">
              Total borrow
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block ml-1"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </th>
            <th className="px-6 py-3">
              Borrow APY
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block ml-1"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </th>
            <th className="px-6 py-3">
              Liquidity
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block ml-1"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {tokens.map((token) => (
            <tr key={token.id} className="hover:bg-slate-800">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  {token.icon}
                  <span className="ml-2 font-medium text-white">{token.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">{formatTokenValue(token.totalSupply)}</td>
              <td className="px-6 py-4">{formatApy(token.supplyApy)}</td>
              <td className="px-6 py-4">{formatTokenValue(token.totalBorrow)}</td>
              <td className="px-6 py-4">{formatApy(token.borrowApy, false)}</td>
              <td className="px-6 py-4">{formatTokenValue(token.liquidity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketTable;
