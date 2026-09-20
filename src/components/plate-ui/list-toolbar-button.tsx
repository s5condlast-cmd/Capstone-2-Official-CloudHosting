'use client';

import * as React from 'react';
import { List, ListOrdered, CheckSquare, ChevronDown } from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { cn } from '@/src/lib/utils';

interface ListGridCardProps {
  items: { prefix: string; indent: number }[];
  selected?: boolean;
  onClick: () => void;
  title: string;
}

/**
 * Authentic Google Docs list style preview card tile.
 * Displays indented lines with grey pill bars and prefix characters.
 */
function ListGridCard({ items, selected, onClick, title }: ListGridCardProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'w-[86px] h-[92px] p-2 bg-white dark:bg-zinc-900 border rounded-xs flex flex-col justify-between cursor-pointer select-none transition-colors text-left',
        selected
          ? 'border-zinc-700 dark:border-zinc-300 ring-1 ring-zinc-700 dark:ring-zinc-300 shadow-xs'
          : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
      )}
    >
      {items.map((row, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 w-full leading-none"
          style={{ paddingLeft: `${row.indent * 12}px` }}
        >
          <span className="text-[10px] font-normal text-zinc-800 dark:text-zinc-200 shrink-0 font-sans select-none">
            {row.prefix}
          </span>
          <div className="h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full flex-1" />
        </div>
      ))}
    </button>
  );
}

// ── 6 Authentic Google Docs Bulleted List Styles (media_1789892247168.png) ─────
const BULLETED_STYLES = [
  {
    id: 'disc',
    title: 'Default disc: ● ○ ■',
    items: [
      { prefix: '●', indent: 0 },
      { prefix: '○', indent: 1 },
      { prefix: '○', indent: 1 },
      { prefix: '■', indent: 2 },
      { prefix: '●', indent: 0 },
    ],
  },
  {
    id: 'diamond',
    title: 'Diamond cluster: ❖ ➢ ■',
    items: [
      { prefix: '❖', indent: 0 },
      { prefix: '➢', indent: 1 },
      { prefix: '➢', indent: 1 },
      { prefix: '■', indent: 2 },
      { prefix: '❖', indent: 0 },
    ],
  },
  {
    id: 'shadow-square',
    title: 'Layered square: ❏ ❏ ❏',
    items: [
      { prefix: '❏', indent: 0 },
      { prefix: '❏', indent: 1 },
      { prefix: '❏', indent: 1 },
      { prefix: '❏', indent: 2 },
      { prefix: '❏', indent: 0 },
    ],
  },
  {
    id: 'arrow',
    title: 'Arrow: ➔ ◆ ●',
    items: [
      { prefix: '➔', indent: 0 },
      { prefix: '◆', indent: 1 },
      { prefix: '◆', indent: 1 },
      { prefix: '●', indent: 2 },
      { prefix: '➔', indent: 0 },
    ],
  },
  {
    id: 'star',
    title: 'Star: ★ ○ ■',
    items: [
      { prefix: '★', indent: 0 },
      { prefix: '○', indent: 1 },
      { prefix: '○', indent: 1 },
      { prefix: '■', indent: 2 },
      { prefix: '★', indent: 0 },
    ],
  },
  {
    id: 'chevron',
    title: 'Arrowhead: ➢ ○ ■',
    items: [
      { prefix: '➢', indent: 0 },
      { prefix: '○', indent: 1 },
      { prefix: '○', indent: 1 },
      { prefix: '■', indent: 2 },
      { prefix: '➢', indent: 0 },
    ],
  },
];

// ── 6 Authentic Google Docs Numbered List Styles (media_1789892207830.png) ──────
const NUMBERED_STYLES = [
  {
    id: 'decimal',
    title: 'Decimal outline: 1. a. i. 2.',
    items: [
      { prefix: '1.', indent: 0 },
      { prefix: 'a.', indent: 1 },
      { prefix: 'b.', indent: 1 },
      { prefix: 'i.', indent: 2 },
      { prefix: '2.', indent: 0 },
    ],
  },
  {
    id: 'decimal-paren',
    title: 'Parentheses: 1) a) i) 2)',
    items: [
      { prefix: '1)', indent: 0 },
      { prefix: 'a)', indent: 1 },
      { prefix: 'b)', indent: 1 },
      { prefix: 'i)', indent: 2 },
      { prefix: '2)', indent: 0 },
    ],
  },
  {
    id: 'legal',
    title: 'Tiered numbers: 1. 1.1. 1.2.1. 2.',
    items: [
      { prefix: '1.', indent: 0 },
      { prefix: '1.1.', indent: 1 },
      { prefix: '1.2.', indent: 1 },
      { prefix: '1.2.1.', indent: 2 },
      { prefix: '2.', indent: 0 },
    ],
  },
  {
    id: 'upper-alpha',
    title: 'Upper alpha outline: A. a. i. B.',
    items: [
      { prefix: 'A.', indent: 0 },
      { prefix: 'a.', indent: 1 },
      { prefix: 'b.', indent: 1 },
      { prefix: 'i.', indent: 2 },
      { prefix: 'B.', indent: 0 },
    ],
  },
  {
    id: 'upper-roman',
    title: 'Roman outline: I. A. 1. II.',
    items: [
      { prefix: 'I.', indent: 0 },
      { prefix: 'A.', indent: 1 },
      { prefix: 'B.', indent: 1 },
      { prefix: '1.', indent: 2 },
      { prefix: 'II.', indent: 0 },
    ],
  },
  {
    id: 'decimal-leading-zero',
    title: 'Leading zero decimal: 01. a. i. 02.',
    items: [
      { prefix: '01.', indent: 0 },
      { prefix: 'a.', indent: 1 },
      { prefix: 'b.', indent: 1 },
      { prefix: 'i.', indent: 2 },
      { prefix: '02.', indent: 0 },
    ],
  },
];

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

  const activeStyle =
    useSelectionFragmentProp({
      defaultValue: 'disc',
      getProp: (node: any) => (node?.type === 'ul' ? node?.listStyleType || 'disc' : null),
    }) || 'disc';

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
            tooltip="Bulleted list options"
            aria-label="Bulleted list options"
          >
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
          </ToolbarSplitButtonSecondary>
        </DropdownMenuTrigger>
      </ToolbarSplitButton>

      {/* 3×2 Authentic Google Docs Bulleted List Grid (media_1789892247168.png) */}
      <DropdownMenuContent
        className="w-auto p-2 shadow-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-[150]"
        align="start"
      >
        <div className="grid grid-cols-3 gap-2">
          {BULLETED_STYLES.map((st) => (
            <ListGridCard
              key={st.id}
              title={st.title}
              items={st.items}
              selected={active && activeStyle === st.id}
              onClick={() => {
                toggleList(editor, 'ul', st.id);
                setOpen(false);
                editor?.tf?.focus?.();
              }}
            />
          ))}
        </div>
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

  const activeStyle =
    useSelectionFragmentProp({
      defaultValue: 'decimal',
      getProp: (node: any) => (node?.type === 'ol' ? node?.listStyleType || 'decimal' : null),
    }) || 'decimal';

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
            tooltip="Numbered list options"
            aria-label="Numbered list options"
          >
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
          </ToolbarSplitButtonSecondary>
        </DropdownMenuTrigger>
      </ToolbarSplitButton>

      {/* 3×2 Authentic Google Docs Numbered List Grid (media_1789892207830.png) */}
      <DropdownMenuContent
        className="w-auto p-2 shadow-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-[150]"
        align="start"
      >
        <div className="grid grid-cols-3 gap-2">
          {NUMBERED_STYLES.map((st) => (
            <ListGridCard
              key={st.id}
              title={st.title}
              items={st.items}
              selected={active && activeStyle === st.id}
              onClick={() => {
                toggleList(editor, 'ol', st.id);
                setOpen(false);
                editor?.tf?.focus?.();
              }}
            />
          ))}
        </div>
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
