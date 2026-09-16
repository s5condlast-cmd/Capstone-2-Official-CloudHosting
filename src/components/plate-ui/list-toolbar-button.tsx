'use client';

import * as React from 'react';
import { List, ListOrdered, CheckSquare, ChevronDown } from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  toggleList,
  isListActive,
} from '@/src/components/editor/editor-commands';
import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
  ToolbarButton,
} from './toolbar';

export function BulletedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const selectionActive = Boolean(
    useSelectionFragmentProp({
      defaultValue: false as any,
      getProp: (node: any) => node?.type === 'ul',
    })
  );
  const active = selectionActive || Boolean(isListActive(editor, 'ul'));

  const listStyles = [
    { label: 'Default (Disc)', style: 'disc' },
    { label: 'Circle', style: 'circle' },
    { label: 'Square', style: 'square' },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <ToolbarSplitButton>
        <ToolbarSplitButtonPrimary
          active={active}
          onClick={() => {
            toggleList(editor, 'ul');
            editor?.tf?.focus?.();
          }}
          tooltip="Bulleted List"
          aria-label="Bulleted List"
        >
          <List className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarSplitButtonPrimary>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary
            active={open}
            tooltip="List style options"
            aria-label="List style options"
          >
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
          </ToolbarSplitButtonSecondary>
        </DropdownMenuTrigger>
      </ToolbarSplitButton>

      <DropdownMenuContent className="w-40 p-1" align="start">
        {listStyles.map((item) => (
          <DropdownMenuItem
            key={item.style}
            onClick={() => {
              toggleList(editor, 'ul', item.style);
              editor?.tf?.focus?.();
            }}
            className="text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-2 py-1.5"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NumberedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const selectionActive = Boolean(
    useSelectionFragmentProp({
      defaultValue: false as any,
      getProp: (node: any) => node?.type === 'ol',
    })
  );
  const active = selectionActive || Boolean(isListActive(editor, 'ol'));

  const listStyles = [
    { label: '1, 2, 3 (Decimal)', style: 'decimal' },
    { label: 'a, b, c (Lower Alpha)', style: 'lower-alpha' },
    { label: 'A, B, C (Upper Alpha)', style: 'upper-alpha' },
    { label: 'i, ii, iii (Lower Roman)', style: 'lower-roman' },
    { label: 'I, II, III (Upper Roman)', style: 'upper-roman' },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <ToolbarSplitButton>
        <ToolbarSplitButtonPrimary
          active={active}
          onClick={() => {
            toggleList(editor, 'ol');
            editor?.tf?.focus?.();
          }}
          tooltip="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarSplitButtonPrimary>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary
            active={open}
            tooltip="Numbering style options"
            aria-label="Numbering style options"
          >
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
          </ToolbarSplitButtonSecondary>
        </DropdownMenuTrigger>
      </ToolbarSplitButton>

      <DropdownMenuContent className="w-48 p-1" align="start">
        {listStyles.map((item) => (
          <DropdownMenuItem
            key={item.style}
            onClick={() => {
              toggleList(editor, 'ol', item.style);
              editor?.tf?.focus?.();
            }}
            className="text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-2 py-1.5"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TodoListToolbarButton() {
  const editor = useEditorRef();

  const active = Boolean(
    useSelectionFragmentProp({
      defaultValue: false as any,
      getProp: (node: any) => node?.type === 'todo',
    })
  );

  const handleToggleTodo = () => {
    try {
      editor?.tf?.setNodes?.(
        { type: active ? 'p' : 'todo' } as any,
        { match: (n: any) => editor?.api?.isBlock?.(n) ?? true }
      );
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
  };

  return (
    <ToolbarButton
      active={active}
      onClick={handleToggleTodo}
      tooltip="To-do list"
      aria-label="To-do list"
    >
      <CheckSquare className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
    </ToolbarButton>
  );
}
