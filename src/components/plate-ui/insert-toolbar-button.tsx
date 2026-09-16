'use client';

import * as React from 'react';
import {
  Plus,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Table,
  FileCode,
  Quote,
  Minus,
  List,
  ListOrdered,
  Square,
  ChevronRight,
  Calendar,
  Link2,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setBlockType, toggleList } from '@/src/components/editor/editor-commands';
import { ToolbarButton } from './toolbar';

interface InsertItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  action: (editor: any) => void;
}

interface InsertGroup {
  group: string;
  items: InsertItem[];
}

export function InsertToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const groups: InsertGroup[] = [
    {
      group: 'Basic blocks',
      items: [
        {
          icon: Pilcrow,
          label: 'Paragraph',
          value: KEYS.p,
          action: (ed) => setBlockType(ed, KEYS.p),
        },
        {
          icon: Heading1,
          label: 'Heading 1',
          value: KEYS.h1,
          action: (ed) => setBlockType(ed, KEYS.h1),
        },
        {
          icon: Heading2,
          label: 'Heading 2',
          value: KEYS.h2,
          action: (ed) => setBlockType(ed, KEYS.h2),
        },
        {
          icon: Heading3,
          label: 'Heading 3',
          value: KEYS.h3,
          action: (ed) => setBlockType(ed, KEYS.h3),
        },
        {
          icon: Table,
          label: 'Table',
          value: KEYS.table,
          action: (ed) => {
            ed?.tf?.insertNodes?.([
              {
                type: 'table',
                children: [
                  {
                    type: 'tr',
                    children: [
                      { type: 'th', children: [{ type: 'p', children: [{ text: '' }] }] },
                      { type: 'th', children: [{ type: 'p', children: [{ text: '' }] }] },
                    ],
                  },
                  {
                    type: 'tr',
                    children: [
                      { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
                      { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
                    ],
                  },
                ],
              },
            ]);
          },
        },
        {
          icon: FileCode,
          label: 'Code',
          value: KEYS.codeBlock,
          action: (ed) => setBlockType(ed, KEYS.codeBlock),
        },
        {
          icon: Quote,
          label: 'Quote',
          value: KEYS.blockquote,
          action: (ed) => setBlockType(ed, KEYS.blockquote),
        },
        {
          icon: Minus,
          label: 'Divider',
          value: KEYS.hr,
          action: (ed) => {
            ed?.tf?.insertNodes?.([
              { type: KEYS.hr, children: [{ text: '' }] },
              { type: KEYS.p, children: [{ text: '' }] },
            ]);
          },
        },
      ],
    },
    {
      group: 'Lists',
      items: [
        {
          icon: List,
          label: 'Bulleted list',
          value: KEYS.ul,
          action: (ed) => toggleList(ed, 'ul'),
        },
        {
          icon: ListOrdered,
          label: 'Numbered list',
          value: KEYS.ol,
          action: (ed) => toggleList(ed, 'ol'),
        },
        {
          icon: Square,
          label: 'To-do list',
          value: KEYS.listTodo,
          action: (ed) => {
            ed?.tf?.setNodes?.(
              { type: 'todo' } as any,
              { match: (n: any) => ed?.api?.isBlock?.(n) ?? true }
            );
          },
        },
        {
          icon: ChevronRight,
          label: 'Toggle list',
          value: KEYS.toggle,
          action: (ed) => {
            ed?.tf?.setNodes?.(
              { type: 'toggle', open: true } as any,
              { match: (n: any) => ed?.api?.isBlock?.(n) ?? true }
            );
          },
        },
      ],
    },
    {
      group: 'Inline elements',
      items: [
        {
          icon: Link2,
          label: 'Link',
          value: 'link',
          action: (ed) => {
            const url = window.prompt('Enter link URL:');
            if (!url) return;
            ed?.tf?.insertNodes?.([{ type: 'a', url, children: [{ text: url }] }]);
          },
        },
        {
          icon: Calendar,
          label: 'Date',
          value: 'date',
          action: (ed) => {
            const today = new Date().toISOString().slice(0, 10);
            ed?.tf?.insertNodes?.([
              { type: 'date', date: today, children: [{ text: '' }] },
              { text: ' ' },
            ]);
          },
        },
      ],
    },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip="Insert Elements"
          aria-label="Insert Elements"
          isDropdown
        >
          <Plus className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto p-1.5" align="start">
        {groups.map((grp) => (
          <div key={grp.group} className="mb-2 last:mb-0">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {grp.group}
            </div>
            {grp.items.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => {
                    item.action(editor);
                    editor?.tf?.focus?.();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" />
                  <span className="text-zinc-800 dark:text-zinc-200">{item.label}</span>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
