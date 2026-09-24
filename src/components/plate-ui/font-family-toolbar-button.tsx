'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';

export const FONT_FAMILIES = [
  { label: 'Geist Sans', value: 'Geist, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
];

export function FontFamilyToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const activeFont = useEditorSelector((ed) => {
    const marks = ed.api?.marks?.() || {};
    return marks.fontFamily as string | undefined;
  }, []);

  const currentFamily = FONT_FAMILIES.find((f) => f.value === activeFont) || FONT_FAMILIES[0];

  const handleSelect = (value: string) => {
    try {
      if (value === FONT_FAMILIES[0].value) {
        editor?.tf?.removeMarks?.('fontFamily');
      } else {
        editor?.tf?.addMarks?.({ fontFamily: value });
      }
      editor?.tf?.focus?.();
    } catch {
      // non-fatal
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Font Family"
          aria-label="Font Family"
          className={cn(
            'flex h-8.5 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors',
            'border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60',
            'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60',
            'max-w-[130px] sm:max-w-[150px]'
          )}
        >
          <span className="truncate font-medium text-[13px]" style={{ fontFamily: currentFamily.value }}>{currentFamily.label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48 p-1 shadow-xl border border-zinc-200/90 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900"
      >
        <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
          Fonts
        </div>
        <div className="space-y-0.5">
          {FONT_FAMILIES.map((font) => {
            const isSelected = activeFont ? activeFont === font.value : font.value === FONT_FAMILIES[0].value;
            return (
              <DropdownMenuItem
                key={font.label}
                onClick={() => handleSelect(font.value)}
                className={cn(
                  'flex items-center justify-between px-2.5 py-1 text-[13px] font-medium rounded-md cursor-pointer transition-colors leading-tight',
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
                    : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
                )}
              >
                <span style={{ fontFamily: font.value }} className="truncate">{font.label}</span>
                {isSelected && <Check className="w-4 h-4 stroke-[2.5] text-zinc-900 dark:text-zinc-100 shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

