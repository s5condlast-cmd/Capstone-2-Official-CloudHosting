'use client';

import * as React from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
} from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setBlockProperty } from '@/src/components/editor/editor-commands';
import { ToolbarButton } from './toolbar';

const items = [
  { icon: AlignLeft, value: 'left', label: 'Align Left' },
  { icon: AlignCenter, value: 'center', label: 'Align Center' },
  { icon: AlignRight, value: 'right', label: 'Align Right' },
  { icon: AlignJustify, value: 'justify', label: 'Justify' },
];

export function AlignToolbarButton(props: any) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value =
    useSelectionFragmentProp({
      defaultValue: 'left',
      getProp: (node: any) => node?.align || 'left',
    }) ?? 'left';

  const IconValue = items.find((item) => item.value === value)?.icon ?? AlignLeft;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          <IconValue className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-44 p-1.5 shadow-lg border border-zinc-200 dark:border-zinc-800" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(val) => {
            setBlockProperty(editor, 'align', val);
            editor?.tf?.focus?.();
          }}
        >
          {items.map(({ icon: Icon, value: itemValue, label }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              value={itemValue}
            >
              <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0" />
              <span className="flex-1 text-zinc-800 dark:text-zinc-200">{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

