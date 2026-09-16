'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function LinkElement({
  className,
  element,
  children,
  ...props
}: PlateElementProps) {
  const url = (element as any)?.url || '#';

  return (
    <PlateElement
      {...props}
      as="a"
      element={element}
      className={cn(
        'font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary cursor-pointer',
        className
      )}
      attributes={{
        ...props.attributes,
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        onClick: (e: any) => {
          if (e.metaKey || e.ctrlKey) {
            window.open(url, '_blank');
          }
        },
      }}
    >
      {children}
    </PlateElement>
  );
}
