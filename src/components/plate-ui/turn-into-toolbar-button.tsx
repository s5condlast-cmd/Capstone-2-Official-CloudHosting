'use client';

import * as React from 'react';
import {
  ChevronRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Square,
  FileCode,
  Check,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setBlockType, getActiveBlockType } from '@/src/components/editor/editor-commands';
import { ToolbarButton } from './toolbar';

export const turnIntoItems = [
  {
    icon: <Pilcrow className="w-4 h-4" />,
    label: 'Text',
    value: KEYS.p,
  },
  {
    icon: <Heading1 className="w-4 h-4" />,
    label: 'Heading 1',
    value: KEYS.h1,
  },
  {
    icon: <Heading2 className="w-4 h-4" />,
    label: 'Heading 2',
    value: KEYS.h2,
  },
  {
    icon: <Heading3 className="w-4 h-4" />,
    label: 'Heading 3',
    value: KEYS.h3,
  },
  {
    icon: <Heading4 className="w-4 h-4" />,
    label: 'Heading 4',
    value: KEYS.h4,
  },
  {
    icon: <Heading5 className="w-4 h-4" />,
    label: 'Heading 5',
    value: KEYS.h5,
  },
  {
    icon: <Heading6 className="w-4 h-4" />,
    label: 'Heading 6',
    value: KEYS.h6,
  },
  {
    icon: <List className="w-4 h-4" />,
    label: 'Bulleted list',
    value: KEYS.ul,
  },
  {
    icon: <ListOrdered className="w-4 h-4" />,
    label: 'Numbered list',
    value: KEYS.ol,
  },
  {
    icon: <Square className="w-4 h-4" />,
    label: 'To-do list',
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRight className="w-4 h-4" />,
    label: 'Toggle list',
    value: KEYS.toggle,
  },
  {
    icon: <Quote className="w-4 h-4" />,
    label: 'Quote',
    value: KEYS.blockquote,
  },
  {
    icon: <FileCode className="w-4 h-4" />,
    label: 'Code',
    value: KEYS.codeBlock,
  },
];

export function TurnIntoToolbarButton(props: any) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value =
    useSelectionFragmentProp({
      defaultValue: KEYS.p,
      getProp: (node: any) => node?.type || KEYS.p,
    }) || getActiveBlockType(editor);

  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px] justify-between"
          pressed={open}
          tooltip="Turn into"
          isDropdown
        >
          <span className="truncate">{selectedItem.label}</span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-[190px] p-1.5"
        align="start"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
            editor?.tf?.focus?.();
          }}
        >
          <DropdownMenuLabel className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
            Turn into
          </DropdownMenuLabel>
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              value={itemValue}
            >
              <div className="text-zinc-600 dark:text-zinc-300 shrink-0">{icon}</div>
              <span className="flex-1 text-zinc-800 dark:text-zinc-200">{label}</span>
              {value === itemValue && (
                <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
