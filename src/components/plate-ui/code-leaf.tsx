'use client';

import * as React from 'react';
import type { PlateLeafProps } from 'platejs/react';
import { PlateLeaf } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function CodeLeaf({ className, children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      as="code"
      className={cn(
        'whitespace-pre-wrap rounded-md bg-zinc-100 dark:bg-zinc-800 px-[0.3em] py-[0.2em] font-mono text-sm text-zinc-900 dark:text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </PlateLeaf>
  );
}

