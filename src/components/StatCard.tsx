
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard = ({ title, value }: StatCardProps) => {
  return (
    <div className="bg-[#191E29] p-6 rounded-lg shadow-md">
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

export default StatCard;
