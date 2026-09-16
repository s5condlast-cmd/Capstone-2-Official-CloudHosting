'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useEditorRef } from 'platejs/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function ToggleElement({
  className,
  element,
  children,
  ...props
}: PlateElementProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(Boolean((element as any)?.open ?? true));

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    try {
      editor?.tf?.setNodes?.({ open: next } as any, { at: [] });
    } catch {
      // non-fatal
    }
  };

  return (
    <PlateElement
      {...props}
      element={element}
      className={cn('relative pl-6 my-1', className)}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="-left-0.5 absolute top-0.5 size-5 cursor-pointer select-none inline-flex items-center justify-center rounded p-0 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        contentEditable={false}
      >
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-100',
            open ? 'rotate-90' : 'rotate-0'
          )}
        />
      </button>
      <div className={cn(!open && 'hidden')}>
        {children}
      </div>
    </PlateElement>
  );
}
