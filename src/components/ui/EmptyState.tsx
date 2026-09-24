import React from 'react';
import { cn } from '@/src/lib/utils';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  image?: string;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  image,
  title,
  description,
  className,
  action
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[300px]", className)}>
      {image ? (
        <img
          src={image}
          alt="State illustration"
          className="w-48 max-w-full h-auto object-contain mx-auto mb-4 pointer-events-none drop-shadow-2xs select-none"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('Unused%20Icons')) {
              target.src = '/images/Unused Icons/undraw_page-not-found_6wni (1).svg';
            }
          }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
          {icon || <FileQuestion size={24} />}
        </div>
      )}
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
