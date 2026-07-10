import React from 'react';
import { cn } from '@/src/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'neutral', 
  children, 
  ...props 
}) => {
  const variants = {
    success: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800',
    warning: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
    error: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900',
    neutral: 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800/50',
    outline: 'bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
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
