'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';

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
    <PlateElement
      element={element}
      style={elementStyle}
      className={cn('relative m-0 px-0 py-0.5 leading-normal', className)}
      {...props}
    >
      {children}
    </PlateElement>
  );
}

