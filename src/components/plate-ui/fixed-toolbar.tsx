/**
 * fixed-toolbar.tsx
 * Plate UI FixedToolbar component matching @plate/editor-ai specification.
 * Stays sticky at the top of the editor canvas with backdrop blur and responsive horizontal scroll.
 */
import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { Toolbar } from './toolbar';

export function FixedToolbar({ className, onWheel, ...props }: React.ComponentProps<typeof Toolbar>) {
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    onWheel?.(e);
    if (!e.defaultPrevented && Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <Toolbar
      {...props}
      onWheel={handleWheel}
      className={cn(
        'sticky top-0 left-0 z-30 w-full justify-between overflow-x-auto rounded-t-xl',
        'border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-2.5 py-2 min-h-[48px]',
        'backdrop-blur-sm shadow-xs select-none print:hidden scroll-smooth',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className
      )}
    />
  );
}

