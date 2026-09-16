'use client';

import * as React from 'react';
import type { PlateLeafProps } from 'platejs/react';
import { PlateLeaf } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function HighlightLeaf({ className, children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      as="mark"
      className={cn(
        'rounded bg-amber-200/60 dark:bg-amber-400/30 text-inherit px-0.5',
        className
      )}
      {...props}
    >
      {children}
    </PlateLeaf>
  );
}

