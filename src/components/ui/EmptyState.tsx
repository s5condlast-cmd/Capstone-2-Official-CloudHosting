import React from 'react';
import { cn } from '@/src/lib/utils';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  className,
  action
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[300px]", className)}>
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
        {icon || <FileQuestion size={24} />}
      </div>
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs font-medium text-zinc-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
