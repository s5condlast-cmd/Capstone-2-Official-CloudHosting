'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/src/lib/utils';
import { ToolbarButton } from './toolbar';

const DEFAULT_FONT_SIZE = '16';

const FONT_SIZES = [
  '8',
  '9',
  '10',
  '11',
  '12',
  '14',
  '16',
  '18',
  '20',
  '24',
  '30',
  '36',
  '48',
  '60',
  '72',
  '96',
] as const;

function cleanSize(val: unknown): string {
  if (!val) return DEFAULT_FONT_SIZE;
  const s = String(val).replace(/[^0-9]/g, '');
  return s || DEFAULT_FONT_SIZE;
}

export function FontSizeToolbarButton() {
  const editor = useEditorRef();
  const [inputValue, setInputValue] = React.useState(DEFAULT_FONT_SIZE);
  const [isFocused, setIsFocused] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const cursorFontSize = useEditorSelector((ed) => {
    const marks = ed.api?.marks?.() || {};
    return cleanSize(marks.fontSize);
  }, []);

  const setFontSize = (size: string) => {
    try {
      const num = Math.min(120, Math.max(6, parseInt(size, 10) || 16));
      editor?.tf?.addMarks?.({ fontSize: `${num}px` });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
  };

  const handleInputChange = () => {
    setFontSize(inputValue);
    editor?.tf?.focus?.();
  };

  const handleDelta = (delta: number) => {
    const current = parseInt(cursorFontSize, 10) || 16;
    const next = Math.min(120, Math.max(6, current + delta));
    setFontSize(String(next));
  };

  const displayValue = isFocused ? inputValue : cursorFontSize;

  return (
    <div className="flex h-8.5 items-center gap-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-0.5">
      <ToolbarButton
        onClick={() => handleDelta(-1)}
        tooltip="Decrease font size"
        className="h-7 w-6 min-w-0 p-0 text-zinc-600 dark:text-zinc-300"
      >
        <Minus className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'h-7 w-9 shrink-0 rounded bg-transparent px-1 text-center font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors'
            )}
            onClick={() => setOpen(true)}
          >
            {displayValue}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-20 max-h-56 overflow-y-auto p-1 text-center"
          align="center"
        >
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              className={cn(
                'flex h-7 w-full items-center justify-center rounded px-2 font-mono text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer',
                size === displayValue && 'bg-primary/10 text-primary font-bold'
              )}
              onClick={() => {
                setFontSize(size);
                setOpen(false);
              }}
              type="button"
            >
              {size}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <ToolbarButton
        onClick={() => handleDelta(1)}
        tooltip="Increase font size"
        className="h-7 w-6 min-w-0 p-0 text-zinc-600 dark:text-zinc-300"
      >
        <Plus className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  );
}

