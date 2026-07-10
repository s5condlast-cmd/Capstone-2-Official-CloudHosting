import React from 'react';
import { usePhaseLock, PhaseLocks } from '@/src/hooks/usePhaseLock';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface PhaseGuardProps {
  phase: keyof PhaseLocks;
  children: React.ReactNode;
}

export const PhaseGuard: React.FC<PhaseGuardProps> = ({ phase, children }) => {
  const { locks } = usePhaseLock();
  
  if (locks[phase]) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800">
          <Lock size={28} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Phase Locked</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
          This section is currently locked. You must complete your prior requirements and receive Adviser approval before accessing this module.
        </p>
      </motion.div>
    );
  }

  return <>{children}</>;
};
