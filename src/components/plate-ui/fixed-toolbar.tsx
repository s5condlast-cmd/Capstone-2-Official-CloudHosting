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
    <div className="relative w-full group/fixed-toolbar flex justify-center">
      <Toolbar
        ref={toolbarRef}
        {...props}
        className={cn(
          'sticky top-0 left-0 z-30 w-full justify-between rounded-full',
          'border border-zinc-200/90 dark:border-zinc-700/80 bg-[#edf2fa]/95 dark:bg-zinc-800/95 px-2.5 py-1 min-h-[42px] max-h-[44px]',
          'backdrop-blur-sm shadow-xs select-none print:hidden overflow-hidden',
          className
        )}
      >
        {children}
      </Toolbar>
    </div>
  );
}

