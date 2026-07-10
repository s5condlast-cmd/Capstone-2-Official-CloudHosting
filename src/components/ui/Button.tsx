import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.4)] border border-zinc-950 dark:border-zinc-200',
      secondary: 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
      outline: 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800',
      danger: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]'
    };

    const sizes = {
      sm: 'py-1.5 px-3 text-[11px]',
      md: 'py-2 px-4 text-xs',
      lg: 'py-2.5 px-5 text-sm',
      xl: 'py-3 px-6 text-base'
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
