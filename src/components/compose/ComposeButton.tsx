import React from 'react';
import { motion } from 'motion/react';
import { PenLine } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ComposeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const ComposeButton: React.FC<ComposeButtonProps> = ({
  onClick,
  disabled = false,
  className,
  label = "Compose"
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors border",
        disabled 
          ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border-zinc-200 dark:border-zinc-800" 
          : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 border-zinc-900 dark:border-white shadow-sm",
        className
      )}
    >
      <PenLine size={16} />
      {label}
    </motion.button>
  );
};
