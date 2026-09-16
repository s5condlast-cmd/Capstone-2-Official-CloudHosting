'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function TableElement({
  className,
  children,
  ...props
}: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="div"
      className={cn('my-4 overflow-x-auto', className)}
    >
      <table className="w-full table-fixed border-collapse border border-zinc-200 dark:border-zinc-800">
        <tbody>{children}</tbody>
      </table>
    </PlateElement>
  );
}

export function TableRowElement({
  className,
  children,
  ...props
}: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="tr"
      className={cn('border-b border-zinc-200 dark:border-zinc-800', className)}
    >
      {children}
    </PlateElement>
  );
}

export function TableCellElement({
  className,
  children,
  element,
  ...props
}: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="td"
      element={element}
      className={cn(
        'relative min-w-24 border border-zinc-200 dark:border-zinc-700/80 px-3 py-2 align-top text-sm',
        className
      )}
    >
      {children}
    </PlateElement>
  );
}

export function TableCellHeaderElement({
  className,
  children,
  element,
  ...props
}: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="th"
      element={element}
      className={cn(
        'relative min-w-24 border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-left font-semibold text-sm text-zinc-900 dark:text-zinc-100 align-top',
        className
      )}
    >
      {children}
    </PlateElement>
  );
}
