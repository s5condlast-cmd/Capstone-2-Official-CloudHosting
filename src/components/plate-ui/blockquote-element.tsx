'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function BlockquoteElement({
  className,
  style,
  element,
  children,
  ...props
}: PlateElementProps) {
  const indent = Math.max(0, Number((element as any)?.indent) || 0);
  const elementStyle: React.CSSProperties = {
    lineHeight: (element as any)?.lineHeight || undefined,
    marginLeft: indent ? `${indent * 1.5}rem` : undefined,
    textAlign: (element as any)?.align || undefined,
    ...style,
  };

  return (
    <PlateElement
      as="blockquote"
      element={element}
      style={elementStyle}
      className={cn(
        'relative my-1 border-l-2 border-zinc-300 dark:border-zinc-700 pl-6 italic text-zinc-700 dark:text-zinc-300',
        className
      )}
      {...props}
    >
      {children}
    </PlateElement>
  );
}
