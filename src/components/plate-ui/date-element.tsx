'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useReadOnly } from 'platejs/react';
import { Calendar } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function DateElement({
  className,
  element,
  children,
  ...props
}: PlateElementProps) {
  const readOnly = useReadOnly();
  const dateValue = (element as any)?.date || new Date().toISOString().slice(0, 10);

  return (
    <PlateElement
      {...props}
      element={element}
      className={cn('inline-block my-0.5', className)}
    >
      <span
        contentEditable={false}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs',
          'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200',
          !readOnly && 'cursor-pointer select-none hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors'
        )}
      >
        <Calendar className="w-3 h-3 text-primary shrink-0" />
        <span>{dateValue}</span>
      </span>
      {children}
    </PlateElement>
  );
}
