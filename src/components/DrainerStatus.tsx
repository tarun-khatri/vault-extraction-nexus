
import React from 'react';

interface DrainerStatusProps {
  status: string;
  processed: number;
  total: number;
}

const DrainerStatus: React.FC<DrainerStatusProps> = ({ status, processed, total }) => {
  const progress = total > 0 ? (processed / total) * 100 : 0;
  
  return (
    <div className="bg-slate-800 p-4 rounded-lg mt-4 mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-slate-300">{status}</span>
        <span className="text-slate-300">{processed}/{total} complete</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default DrainerStatus;
