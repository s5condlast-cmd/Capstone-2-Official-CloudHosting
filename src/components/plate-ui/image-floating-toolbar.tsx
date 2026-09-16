'use client';

import * as React from 'react';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ImageFloatingToolbarProps {
  align?: 'left' | 'center' | 'right';
  onAlignChange: (align: 'left' | 'center' | 'right') => void;
  onRemove: () => void;
}

export function ImageFloatingToolbar({
  align = 'center',
  onAlignChange,
  onRemove,
}: ImageFloatingToolbarProps) {
  return (
    <div
      contentEditable={false}
      className={cn(
        'absolute -top-11 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-lg',
        'bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-zinc-200 dark:border-zinc-800',
        'backdrop-blur-sm print:hidden select-none animate-in fade-in zoom-in-95 duration-100'
      )}
    >
      <button
        type="button"
        title="Move to Left Edge"
        aria-label="Move to Left Edge"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAlignChange('left');
        }}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
          align === 'left' && 'bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
        )}
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Center in Document"
        aria-label="Center in Document"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAlignChange('center');
        }}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
          align === 'center' && 'bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
        )}
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Move to Right Edge"
        aria-label="Move to Right Edge"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAlignChange('right');
        }}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
          align === 'right' && 'bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
        )}
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="mx-0.5 h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />

      <button
        type="button"
        title="Remove Image"
        aria-label="Remove Image"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
