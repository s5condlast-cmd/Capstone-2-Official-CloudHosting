import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  title, 
  action, 
  footer, 
  children, 
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl flex flex-col shadow-xs transition-shadow hover:shadow-sm',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-3.5 border-b border-zinc-200/60 dark:border-zinc-800 rounded-t-xl">
          {title && <h3 className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h3>}
          <div className="flex items-center gap-2">
            {action}
          </div>
        </div>
      )}
      <div className="flex-1 p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-zinc-50/30 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};
