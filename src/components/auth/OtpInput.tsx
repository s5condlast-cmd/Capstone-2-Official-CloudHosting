import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (newValues: string[]) => void;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  hasError = false,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (index: number, val: string) => {
      if (disabled) return;

      const digitsOnly = val.replace(/\D/g, '');
      const newVals = [...value];

      if (!digitsOnly && !val) {
        // Backspace / clear
        newVals[index] = '';
        onChange(newVals);
        if (index > 0) inputRefs.current[index - 1]?.focus();
        return;
      }

      const chars = digitsOnly.split('');

      // Support multi-character entry / paste
      chars.forEach((char, i) => {
        if (index + i < length) {
          newVals[index + i] = char;
        }
      });

      onChange(newVals);

      // Advance focus to next empty input or last box
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [value, length, onChange, disabled]
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const newVals = [...value];
      newVals[index - 1] = '';
      onChange(newVals);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newVals = Array(length).fill('');
    pasted.split('').forEach((char, i) => {
      newVals[i] = char;
    });

    onChange(newVals);

    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => {
        const val = value[idx] || '';
        return (
          <motion.input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={val}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onFocus={(e) => e.target.select()}
            className={cn(
              'w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2',
              'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
              'outline-none transition-all duration-200 select-all shadow-2xs',
              val
                ? 'border-zinc-950 dark:border-zinc-100 bg-zinc-50/50 dark:bg-zinc-800/50'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500',
              'focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-4 focus:ring-zinc-950/10 dark:focus:ring-zinc-100/10',
              hasError && 'border-red-500 dark:border-red-500 focus:border-red-500 text-red-600 dark:text-red-400 animate-shake',
              disabled && 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800'
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.18 }}
          />
        );
      })}
    </div>
  );
};
