'use client';

import * as React from 'react';
import { Baseline, Paintbrush, Check, X } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';
import { ToolbarButton } from './toolbar';

export const DEFAULT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1155cc', '#0b5394', '#351c75', '#4c1130',
];

export interface FontColorToolbarButtonProps {
  nodeType?: 'color' | 'backgroundColor';
  tooltip?: string;
  children?: React.ReactNode;
}

export function FontColorToolbarButton({
  nodeType = 'color',
  tooltip,
  children,
}: FontColorToolbarButtonProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [customHex, setCustomHex] = React.useState('');

  const currentColor = useEditorSelector((ed) => {
    const marks = ed.api?.marks?.() || {};
    return (marks[nodeType] as string) || '';
  }, [nodeType]);

  const handleSelectColor = (color: string) => {
    try {
      editor?.tf?.addMarks?.({ [nodeType]: color });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const handleClearColor = () => {
    try {
      editor?.tf?.removeMarks?.(nodeType);
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const isBg = nodeType === 'backgroundColor';
  const Icon = isBg ? Paintbrush : Baseline;
  const label = tooltip || (isBg ? 'Background color' : 'Text color');

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip={label}
          aria-label={label}
          className="relative gap-1"
        >
          {children || <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />}
          <div
            className="h-1 w-3.5 rounded-full border border-black/20 dark:border-white/20 mt-[-2px]"
            style={{ backgroundColor: currentColor || (isBg ? 'transparent' : '#000000') }}
          />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-3" align="start">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          <button
            type="button"
            onClick={handleClearColor}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* 10-column color grid */}
        <div className="grid grid-cols-10 gap-1 mb-3">
          {DEFAULT_COLORS.map((hex, i) => (
            <button
              key={`${hex}-${i}`}
              type="button"
              onClick={() => handleSelectColor(hex)}
              className="relative w-5 h-5 rounded-sm border border-zinc-300 dark:border-zinc-700 hover:scale-125 transition-transform cursor-pointer"
              style={{ backgroundColor: hex }}
              title={hex}
            >
              {currentColor?.toLowerCase() === hex.toLowerCase() && (
                <Check
                  className={cn(
                    'w-3 h-3 absolute inset-0 m-auto',
                    hex === '#ffffff' || hex === '#efefef' ? 'text-black' : 'text-white'
                  )}
                />
              )}
            </button>
          ))}
        </div>

        {/* Custom hex input */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <input
            type="text"
            placeholder="#000000"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 font-mono text-zinc-800 dark:text-zinc-200"
          />
          <button
            type="button"
            disabled={!/^#[0-9a-f]{3,6}$/i.test(customHex)}
            onClick={() => handleSelectColor(customHex)}
            className="px-2 py-1 text-xs rounded bg-primary text-primary-fg disabled:opacity-40 font-medium"
          >
            Apply
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

