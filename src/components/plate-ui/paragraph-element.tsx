'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';
import { BlockDraggable } from './block-draggable';

export function ParagraphElement({
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
    <BlockDraggable element={element} handleTopOffset="top-1">
      <PlateElement
        element={element}
        style={elementStyle}
        className={cn('relative m-0 px-0 py-1 leading-relaxed text-zinc-800 dark:text-zinc-200', className)}
        {...props}
      >
        {children}
      </PlateElement>
    </BlockDraggable>
  );
}
