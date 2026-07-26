import { useState, useEffect } from 'react';

export interface PhaseLocks {
  beforeOjt: boolean;
  inOjt: boolean;
  finals: boolean;
}

const defaultLocks: PhaseLocks = {
  beforeOjt: false, // Always unlocked for now
  inOjt: false,     // Unlocked for user testing
  finals: false     // Unlocked for user testing
};

export const usePhaseLock = () => {
  const [locks, setLocks] = useState<PhaseLocks>(defaultLocks);

  useEffect(() => {
    try {
      // Force unlock all phases, overriding any cached locks
      setLocks(defaultLocks);
      localStorage.setItem('practicum_phase_locks', JSON.stringify(defaultLocks));
    } catch (e) {
      console.error('Failed to load phase locks', e);
    }
  }, []);

  const toggleLock = (phase: keyof PhaseLocks) => {
    setLocks(prev => {
      const newLocks = { ...prev, [phase]: !prev[phase] };
      localStorage.setItem('practicum_phase_locks', JSON.stringify(newLocks));
      return newLocks;
    });
  };

  return { locks, toggleLock };
};
