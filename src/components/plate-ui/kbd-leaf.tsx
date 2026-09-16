'use client';

import * as React from 'react';
import type { PlateLeafProps } from 'platejs/react';
import { PlateLeaf } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function KbdLeaf({ className, children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      as="kbd"
      className={cn(
        'rounded-md border border-b-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.8em] font-semibold text-zinc-600 dark:text-zinc-300 shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </PlateLeaf>
  );
}

