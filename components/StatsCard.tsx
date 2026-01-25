
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-4 transition-all hover:shadow-md hover:border-slate-300/80 group">
      <div className={`${color} p-3 rounded-xl text-white shadow-sm transition-transform group-hover:scale-105 duration-200`}>
        {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 truncate">{title}</p>
        <h3 className="text-xl font-extrabold text-slate-900 truncate tracking-tight">{value}</h3>
      </div>
    </div>
  );
};
