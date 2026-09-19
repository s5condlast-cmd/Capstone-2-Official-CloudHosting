'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';
import { BlockDraggable } from './block-draggable';

export function TableElement({
  className,
  children,
  element,
  ...props
}: PlateElementProps) {
  return (
    <BlockDraggable element={element} handleTopOffset="top-3">
      <PlateElement
        {...props}
        element={element}
        as="div"
        className={cn('my-4 overflow-x-auto', className)}
      >
        <table className="w-full table-fixed border-collapse border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-2xs">
          <tbody>{children}</tbody>
        </table>
      </PlateElement>
    </BlockDraggable>
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
      className={cn('border-b border-zinc-200 dark:border-zinc-800 transition-colors', className)}
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
        'relative min-w-24 border border-zinc-200 dark:border-zinc-700/80 px-3.5 py-2.5 align-top dark:text-zinc-200',
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
        'relative min-w-24 border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-left font-semibold dark:text-zinc-100 align-top',
        className
      )}
    >
      {children}
    </PlateElement>
  );
}
