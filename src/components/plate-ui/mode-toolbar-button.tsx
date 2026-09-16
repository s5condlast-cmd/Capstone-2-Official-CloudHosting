'use client';

import * as React from 'react';
import { Pencil, PenLine, Eye, Check } from 'lucide-react';
import { useEditorRef, useEditorReadOnly } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToolbarButton } from './toolbar';

export interface ModeToolbarButtonProps {
  mode?: 'editing' | 'suggesting' | 'viewing';
  onModeChange?: (mode: 'editing' | 'suggesting' | 'viewing') => void;
}

export function ModeToolbarButton({
  mode: controlledMode,
  onModeChange,
}: ModeToolbarButtonProps) {
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();
  const [open, setOpen] = React.useState(false);

  let currentMode: 'editing' | 'suggesting' | 'viewing' = controlledMode || (readOnly ? 'viewing' : 'editing');

  const items = {
    editing: {
      icon: <Pencil className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />,
      label: 'Editing',
      desc: 'Direct document changes',
    },
    suggesting: {
      icon: <PenLine className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />,
      label: 'Suggesting',
      desc: 'Track and review notes',
    },
    viewing: {
      icon: <Eye className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />,
      label: 'Viewing',
      desc: 'Read-only review',
    },
  };

  const handleModeSelect = (newMode: string) => {
    const validMode = newMode as 'editing' | 'suggesting' | 'viewing';
    onModeChange?.(validMode);

    if (validMode === 'viewing') {
      try {
        editor?.store?.setReadOnly?.(true);
      } catch { /* non-fatal */ }
    } else {
      try {
        editor?.store?.setReadOnly?.(false);
      } catch { /* non-fatal */ }
      if (validMode === 'editing') {
        editor?.tf?.focus?.();
      }
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip={`Document Mode: ${items[currentMode].label}`}
          aria-label="Document Mode"
          isDropdown
          className="gap-1.5"
        >
          {items[currentMode].icon}
          <span className="hidden sm:inline text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {items[currentMode].label}
          </span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 p-1.5">
        <DropdownMenuRadioGroup
          value={currentMode}
          onValueChange={handleModeSelect}
        >
          {(['editing', 'suggesting', 'viewing'] as const).map((modeKey) => (
            <DropdownMenuRadioItem
              key={modeKey}
              value={modeKey}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="shrink-0">{items[modeKey].icon}</div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {items[modeKey].label}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {items[modeKey].desc}
                </span>
              </div>
              {currentMode === modeKey && (
                <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

