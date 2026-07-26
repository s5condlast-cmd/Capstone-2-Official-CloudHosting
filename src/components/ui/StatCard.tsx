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
      'bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:p-5 rounded-xl flex flex-col gap-3 shadow-xs transition-shadow hover:shadow-sm group relative overflow-hidden',
      className
    )}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-50/30 dark:bg-zinc-900/30 rounded-bl-3xl -mr-8 -mt-8" />
      
      <div className="flex items-center justify-between relative z-10 gap-2">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/50 truncate max-w-full">
            {trend}
          </span>
        )}
      </div>
      <div className="flex flex-col relative z-10">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</span>
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">{value}</span>
      </div>
    </div>
  );
};
