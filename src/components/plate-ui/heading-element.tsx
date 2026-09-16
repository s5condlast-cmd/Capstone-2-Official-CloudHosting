'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';
import { BlockDraggable } from './block-draggable';

export const headingVariants = cva(
  'relative tracking-tight font-heading',
  {
    variants: {
      variant: {
        h1: 'mt-7 mb-2.5 font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 leading-tight',
        h2: 'mt-6 mb-2 font-bold text-2xl text-zinc-900 dark:text-zinc-100 leading-snug',
        h3: 'mt-4.5 mb-1.5 font-semibold text-xl text-zinc-900 dark:text-zinc-100',
        h4: 'mt-3.5 mb-1 font-semibold text-lg text-zinc-900 dark:text-zinc-100',
        h5: 'mt-2.5 mb-0.5 font-semibold text-base text-zinc-900 dark:text-zinc-100',
        h6: 'mt-2 mb-0.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100',
      },
    },
    defaultVariants: {
      variant: 'h1',
    },
  }
);

const handleOffsetMap: Record<string, string> = {
  h1: 'top-2 sm:top-2.5',
  h2: 'top-1.5',
  h3: 'top-1',
  h4: 'top-1',
  h5: 'top-0.5',
  h6: 'top-0.5',
};

export function HeadingElement({
  variant = 'h1',
  className,
  style,
  element,
  children,
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  const indent = Math.max(0, Number((element as any)?.indent) || 0);
  const elementStyle: React.CSSProperties = {
    lineHeight: (element as any)?.lineHeight || undefined,
    marginLeft: indent ? `${indent * 1.5}rem` : undefined,
    textAlign: (element as any)?.align || undefined,
    ...style,
  };

  const handleOffset = handleOffsetMap[variant || 'h1'] || 'top-1';

  return (
    <BlockDraggable element={element} handleTopOffset={handleOffset}>
      <PlateElement
        as={variant!}
        element={element}
        style={elementStyle}
        className={cn(headingVariants({ variant }), className)}
        {...props}
      >
        {children}
      </PlateElement>
    </BlockDraggable>
  );
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
