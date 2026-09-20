'use client';

import * as React from 'react';
import { WrapText } from 'lucide-react';
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

const LINE_HEIGHTS = ['1', '1.15', '1.5', '2', '2.5', '3'];

export function LineHeightToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value =
    useSelectionFragmentProp({
      defaultValue: '1.15',
      getProp: (node: any) => String(node?.lineHeight || '1.15'),
    }) || '1.15';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip="Line height"
          aria-label="Line height"
          isDropdown
        >
          <WrapText className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-24 min-w-[5.5rem] p-1.5" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(val) => {
            setBlockProperty(editor, 'lineHeight', val);
            editor?.tf?.focus?.();
          }}
        >
          {LINE_HEIGHTS.map((height) => (
            <DropdownMenuRadioItem
              key={height}
              className="flex items-center justify-between px-2.5 py-1 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded font-medium"
              value={height}
            >
              <span>{height}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
