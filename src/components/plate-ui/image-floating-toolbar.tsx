'use client';

import * as React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Check,
  ChevronDown,
  MessageSquarePlus,
  SmilePlus,
  Crop,
  Paintbrush,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';

export type ImageWrapMode = 'inline' | 'wrap' | 'break' | 'behind' | 'front';

// ─── Authentic Google Docs Text Wrapping SVG Icons (matching media_1789889872645.png) ───

export function InLineWrapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
    >
      {/* Top text line */}
      <line x1="3" y1="5" x2="21" y2="5" />
      {/* Inline image box */}
      <rect x="7" y="9" width="10" height="6" rx="0.75" fill="currentColor" fillOpacity="0.12" />
      {/* Text entering from left & right on baseline */}
      <line x1="3" y1="12" x2="5.5" y2="12" />
      <line x1="18.5" y1="12" x2="21" y2="12" />
      {/* Bottom text line */}
      <line x1="3" y1="19" x2="21" y2="19" />
    </svg>
  );
}

export function WrapTextIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
    >
      <line x1="3" y1="5" x2="21" y2="5" />
      <rect x="3" y="9" width="8" height="6" rx="0.75" fill="currentColor" fillOpacity="0.12" />
      <line x1="13" y1="9" x2="21" y2="9" />
      <line x1="13" y1="12" x2="21" y2="12" />
      <line x1="13" y1="15" x2="21" y2="15" />
      <line x1="3" y1="19" x2="21" y2="19" />
    </svg>
  );
}

export function BreakTextIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
    >
      <line x1="3" y1="4" x2="21" y2="4" />
      <line x1="3" y1="7" x2="21" y2="7" />
      <rect x="6" y="10" width="12" height="5" rx="0.75" fill="currentColor" fillOpacity="0.12" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  );
}

export function BehindTextIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
    >
      <rect x="5.5" y="6" width="13" height="12" rx="0.75" strokeDasharray="2 2" fill="currentColor" fillOpacity="0.1" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="16" x2="21" y2="16" />
    </svg>
  );
}

export function InFrontTextIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
    >
      <line x1="3" y1="8" x2="6" y2="8" />
      <line x1="18" y1="8" x2="21" y2="8" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
      <line x1="3" y1="16" x2="6" y2="16" />
      <line x1="18" y1="16" x2="21" y2="16" />
      <rect x="6" y="6" width="12" height="12" rx="0.75" fill="white" className="dark:fill-zinc-900" />
      <rect x="6" y="6" width="12" height="12" rx="0.75" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

export const WRAP_OPTIONS: { id: ImageWrapMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inline', label: 'In line', icon: InLineWrapIcon },
  { id: 'wrap', label: 'Wrap text', icon: WrapTextIcon },
  { id: 'break', label: 'Break text', icon: BreakTextIcon },
  { id: 'behind', label: 'Behind text', icon: BehindTextIcon },
  { id: 'front', label: 'In front of text', icon: InFrontTextIcon },
];

export interface ImageFloatingToolbarProps {
  align?: 'left' | 'center' | 'right';
  wrap?: ImageWrapMode;
  onAlignChange?: (align: 'left' | 'center' | 'right') => void;
  onWrapChange: (wrap: ImageWrapMode) => void;
  onRemove?: () => void;
  onCrop?: () => void;
  onAddComment?: () => void;
  className?: string;
  side?: 'top' | 'bottom';
}

export function ImageFloatingToolbar({
  align = 'center',
  wrap = 'inline',
  onAlignChange,
  onWrapChange,
  onRemove,
  onCrop,
  onAddComment,
  className,
  side = 'bottom',
}: ImageFloatingToolbarProps) {
  const [wrapOpen, setWrapOpen] = React.useState(false);
  const currentWrap = WRAP_OPTIONS.find((o) => o.id === wrap) || WRAP_OPTIONS[0];
  const WrapIcon = currentWrap.icon;

  return (
    <div
      data-image-floating-toolbar
      contentEditable={false}
      className={cn(
        'absolute left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 rounded-xl',
        'bg-white/95 dark:bg-zinc-900/95 shadow-xl border border-zinc-200/90 dark:border-zinc-800',
        'backdrop-blur-xs print:hidden select-none animate-in fade-in zoom-in-95 duration-100',
        side === 'bottom' ? '-bottom-12' : '-top-12',
        className
      )}
    >
      {/* 1. Text Wrap Dropdown matching Google Docs style (media_1789889872645.png) */}
      <DropdownMenu open={wrapOpen} onOpenChange={setWrapOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Image text wrapping"
            aria-label="Image text wrapping"
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
              wrapOpen && 'bg-zinc-100 dark:bg-zinc-800'
            )}
          >
            <WrapIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-200 shrink-0" />
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={side === 'bottom' ? 'top' : 'bottom'}
          align="start"
          sideOffset={6}
          className="w-48 p-1.5 shadow-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-[160]"
        >
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
                  'flex items-center gap-3 px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors select-none',
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-950 dark:text-white'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                )}
              >
                <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span className="flex-1 text-[13px]">{opt.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[2.5] ml-auto shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />

      {/* 2. Image Options / Crop Button */}
      {onCrop ? (
        <button
          type="button"
          title="Crop image"
          aria-label="Crop image"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCrop();
          }}
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <Crop className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          title="Image options"
          aria-label="Image options"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <Paintbrush className="w-4 h-4" />
        </button>
      )}

      {/* 3. Add Comment Button */}
      <button
        type="button"
        title="Add comment"
        aria-label="Add comment"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddComment?.();
        }}
        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <MessageSquarePlus className="w-4 h-4" />
      </button>

      {/* 4. Add Reaction / Emoji Button */}
      <button
        type="button"
        title="Add emoji reaction"
        aria-label="Add emoji reaction"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <SmilePlus className="w-4 h-4" />
      </button>

      {/* 5. Optional Alignment Buttons */}
      {onAlignChange && (
        <>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
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
              'p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
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
              'p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
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
              'p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors',
              align === 'right' && 'bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
            )}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* 6. Delete Button */}
      {onRemove && (
        <>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
          <button
            type="button"
            title="Delete Image"
            aria-label="Delete Image"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
