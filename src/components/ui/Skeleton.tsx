import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.5,
        ease: "easeInOut"
      }}
      className={cn("bg-zinc-200 dark:bg-zinc-800 rounded-md", className)}
      {...props}
    />
  );
};
