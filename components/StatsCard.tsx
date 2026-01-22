
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
      <div className={`${color} p-2.5 rounded-lg text-white`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
        <h3 className="text-lg font-extrabold text-slate-800 truncate">{value}</h3>
      </div>
    </div>
  );
};
