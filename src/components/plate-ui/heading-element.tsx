'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export const headingVariants = cva(
  'relative tracking-tight font-heading',
  {
    variants: {
      variant: {
        h1: 'mt-6 mb-2 font-bold text-3xl sm:text-4xl',
        h2: 'mt-5 mb-1.5 font-semibold text-2xl',
        h3: 'mt-4 mb-1 font-semibold text-xl',
        h4: 'mt-3 mb-1 font-semibold text-lg',
        h5: 'mt-2.5 mb-0.5 font-semibold text-base',
        h6: 'mt-2 mb-0.5 font-semibold text-sm',
      },
    },
    defaultVariants: {
      variant: 'h1',
    },
  }
);

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

  return (
    <PlateElement
      as={variant!}
      element={element}
      style={elementStyle}
      className={cn(headingVariants({ variant }), className)}
      {...props}
    >
      {children}
    </PlateElement>
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
