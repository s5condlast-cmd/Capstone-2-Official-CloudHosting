/**
 * fixed-toolbar.tsx
 * Plate UI FixedToolbar component matching @plate/editor-ai specification.
 * Stays sticky at the top of the editor canvas with backdrop blur and responsive horizontal scroll.
 */
import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { Toolbar } from './toolbar';

export function FixedToolbar({ className, children, ...props }: React.ComponentProps<typeof Toolbar>) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full group/fixed-toolbar flex items-center">
      <Toolbar
        ref={toolbarRef}
        {...props}
        className={cn(
          'sticky top-0 left-0 z-30 w-full justify-between',
          'border-0 bg-transparent px-1 py-0.5 min-h-[38px] max-h-[42px]',
          'select-none print:hidden overflow-hidden',
          className
        )}
      >
        {children}
      </Toolbar>
    </div>
  );
}

