/**
 * fixed-toolbar.tsx
 * Plate UI FixedToolbar component matching @plate/editor-ai specification.
 * Stays sticky at the top of the editor canvas with backdrop blur and responsive horizontal scroll.
 */
import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Toolbar } from './toolbar';

export function FixedToolbar({ className, children, onWheel, ...props }: React.ComponentProps<typeof Toolbar>) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = toolbarRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Re-check scroll after content renders
  React.useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [children, checkScroll]);

  const handleScrollLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    toolbarRef.current?.scrollBy({ left: -260, behavior: 'smooth' });
  };

  const handleScrollRight = (e: React.MouseEvent) => {
    e.preventDefault();
    toolbarRef.current?.scrollBy({ left: 260, behavior: 'smooth' });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    onWheel?.(e);
    if (
      !e.defaultPrevented &&
      Math.abs(e.deltaY) > Math.abs(e.deltaX) &&
      toolbarRef.current &&
      toolbarRef.current.scrollWidth > toolbarRef.current.clientWidth
    ) {
      toolbarRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div className="relative w-full group/fixed-toolbar">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={handleScrollLeft}
          title="Scroll toolbar left"
          aria-label="Scroll toolbar left"
          className={cn(
            'absolute left-1.5 top-1/2 -translate-y-1/2 z-40',
            'flex h-7 w-7 items-center justify-center rounded-full',
            'bg-white/95 dark:bg-zinc-800/95 text-zinc-700 dark:text-zinc-200 shadow-md border border-zinc-200 dark:border-zinc-700',
            'hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer backdrop-blur-xs'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={handleScrollRight}
          title="Scroll toolbar right"
          aria-label="Scroll toolbar right"
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 z-40',
            'flex h-7 w-7 items-center justify-center rounded-full',
            'bg-white/95 dark:bg-zinc-800/95 text-zinc-700 dark:text-zinc-200 shadow-md border border-zinc-200 dark:border-zinc-700',
            'hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer backdrop-blur-xs'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <Toolbar
        ref={toolbarRef}
        {...props}
        onWheel={handleWheel}
        className={cn(
          'sticky top-0 left-0 z-30 w-full justify-between overflow-x-auto rounded-full',
          'border border-zinc-200/90 dark:border-zinc-700/80 bg-[#edf2fa]/95 dark:bg-zinc-800/95 px-3 py-1 min-h-[44px]',
          'backdrop-blur-sm shadow-xs select-none print:hidden scroll-smooth',
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          className
        )}
      >
        {children}
      </Toolbar>
    </div>
  );
}

