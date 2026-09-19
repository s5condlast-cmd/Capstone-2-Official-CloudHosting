'use client';

import * as React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Crop,
  Trash2,
  WrapText,
  Check,
  ChevronDown,
  BringToFront,
  SendToBack,
  SeparatorHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';

export type ImageWrapMode = 'inline' | 'wrap' | 'break' | 'behind' | 'front';

const WRAP_OPTIONS: { id: ImageWrapMode; label: string; icon: any }[] = [
  { id: 'inline', label: 'In line', icon: AlignLeft },
  { id: 'wrap', label: 'Wrap text', icon: WrapText },
  { id: 'break', label: 'Break text', icon: SeparatorHorizontal },
  { id: 'behind', label: 'Behind text', icon: SendToBack },
  { id: 'front', label: 'In front of text', icon: BringToFront },
];

export interface ImageFloatingToolbarProps {
  align?: 'left' | 'center' | 'right';
  wrap?: ImageWrapMode;
  isCropping?: boolean;
  onAlignChange: (align: 'left' | 'center' | 'right') => void;
  onWrapChange: (wrap: ImageWrapMode) => void;
  onToggleCrop: () => void;
  onRemove: () => void;
}

export function ImageFloatingToolbar({
  align = 'center',
  wrap = 'inline',
  isCropping = false,
  onAlignChange,
  onWrapChange,
  onToggleCrop,
  onRemove,
}: ImageFloatingToolbarProps) {
  const [wrapOpen, setWrapOpen] = React.useState(false);
  const currentWrap = WRAP_OPTIONS.find((o) => o.id === wrap) || WRAP_OPTIONS[0];
  const WrapIcon = currentWrap.icon;

  return (
    <div
      data-image-floating-toolbar
      contentEditable={false}
      className={cn(
        'absolute -top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-lg',
        'bg-white/95 dark:bg-zinc-900/95 shadow-xl border border-zinc-200 dark:border-zinc-800',
        'backdrop-blur-sm print:hidden select-none animate-in fade-in zoom-in-95 duration-100'
      )}
    >
      {/* 1. Text Wrap Dropdown matching Google Docs style */}
      <DropdownMenu open={wrapOpen} onOpenChange={setWrapOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Image text wrapping"
            aria-label="Image text wrapping"
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-700 dark:text-zinc-200',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
              wrapOpen && 'bg-zinc-100 dark:bg-zinc-800'
            )}
          >
            <WrapIcon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
          {WRAP_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = wrap === opt.id;
            return (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => {
                  onWrapChange(opt.id);
                  setWrapOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-colors',
                  isSelected && 'bg-zinc-100 dark:bg-zinc-800 font-semibold'
                )}
              >
                <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0" />
                <span className="flex-1 text-zinc-800 dark:text-zinc-200">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-px bg-zinc-200 dark:border-zinc-800 mx-0.5" />

      {/* 2. Alignment Buttons */}
      <button
        type="button"
        title="Align Left"
        aria-label="Align Left"
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
        title="Align Center"
        aria-label="Align Center"
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
        title="Align Right"
        aria-label="Align Right"
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

      <div className="h-4 w-px bg-zinc-200 dark:border-zinc-800 mx-0.5" />

      {/* 3. Crop Tool Button */}
      <button
        type="button"
        title={isCropping ? 'Exit Crop Mode' : 'Crop Image'}
        aria-label="Crop Image"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleCrop();
        }}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
          isCropping && 'bg-primary/20 text-primary font-bold ring-1 ring-primary'
        )}
      >
        <Crop className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-zinc-200 dark:border-zinc-800 mx-0.5" />

      {/* 4. Delete Button */}
      <button
        type="button"
        title="Delete Image"
        aria-label="Delete Image"
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

