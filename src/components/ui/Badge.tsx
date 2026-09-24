import React from 'react';
import { cn } from '@/src/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'outline' | 'default' | 'secondary' | 'primary' | 'destructive';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'neutral', 
  children, 
  ...props 
}) => {
  const variants = {
    success: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/35',
    warning: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa] dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/35',
    error: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecdd3] dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/35',
    destructive: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecdd3] dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/35',
    neutral: 'bg-[#f4f4f5] text-[#3f3f46] border-[#e4e4e7] dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/50',
    outline: 'bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
    default: 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe] dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/35',
    secondary: 'bg-[#f4f4f5] text-[#3f3f46] border-[#e4e4e7] dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/50',
    primary: 'bg-primary text-primary-fg border-primary'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
