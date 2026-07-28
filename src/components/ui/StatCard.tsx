import React from 'react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, className }) => {
  return (
    <div className={cn(
      'bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-3.5 px-4 rounded-xl flex items-center justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all',
      className
    )}>
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{value}</h3>
          {trend && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700 truncate">
              {trend}
            </span>
          )}
        </div>
      </div>

      {icon && (
        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0 ml-3">
          {icon}
        </div>
      )}
    </div>
  );
};
