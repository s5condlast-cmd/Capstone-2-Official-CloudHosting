'use client';

import * as React from 'react';
import { MoreHorizontal, Superscript, Subscript, Keyboard } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toggleMark } from '@/src/components/editor/editor-commands';
import { ToolbarButton } from './toolbar';

export function MoreToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip="More formatting"
          aria-label="More formatting"
          isDropdown
        >
          <MoreHorizontal className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-44 p-1.5" align="start">
        <DropdownMenuItem
          onClick={() => {
            toggleMark(editor, 'superscript');
            editor?.tf?.focus?.();
          }}
          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Superscript className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span>Superscript</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            toggleMark(editor, 'subscript');
            editor?.tf?.focus?.();
          }}
          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Subscript className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span>Subscript</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            toggleMark(editor, 'kbd');
            editor?.tf?.focus?.();
          }}
          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Keyboard className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span>Keyboard input</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
