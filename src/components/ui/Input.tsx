import React from 'react';
import { cn } from '@/src/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  as?: 'input' | 'textarea';
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, type = 'text', as = 'input', ...props }, ref) => {
    const Component = as;
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <Component
          ref={ref as any}
          type={type}
          className={cn(
            'w-full bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3 font-medium transition-all shadow-xs focus:border-zinc-950 dark:focus:border-zinc-200 focus:ring-4 focus:ring-zinc-950/10 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm text-zinc-950 dark:text-white',
            as === 'textarea' && 'min-h-[120px] resize-none',
            className
          )}
          {...props as any}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
