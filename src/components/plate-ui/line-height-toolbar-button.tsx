'use client';

import * as React from 'react';
import { WrapText, Check } from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setBlockProperty } from '@/src/components/editor/editor-commands';
import { CustomSpacingDialog } from '@/src/components/editor/CustomSpacingDialog';
import { ToolbarButton } from './toolbar';
import { cn } from '@/src/lib/utils';

const PRESET_LINE_SPACINGS = [
  { label: 'Single (1.0)', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: 'Double (2.0)', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3' },
];

/**
 * Authentic Google Docs Line & Paragraph Spacing Dropdown (media_1789892384450.png).
 * Exposes single, 1.15, 1.5, double, 2.5, 3.0 presets with active checkmark
 * and opens CustomSpacingDialog (media_1789892399567.png) for fine-grained control.
 */
export function LineHeightToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [customSpacingOpen, setCustomSpacingOpen] = React.useState(false);

  const currentLineHeight =
    useSelectionFragmentProp({
      defaultValue: '1.15',
      getProp: (node: any) => String(node?.lineHeight || '1.15'),
    }) || '1.15';

  const currentSpaceBeforeStr =
    useSelectionFragmentProp({
      defaultValue: '0',
      getProp: (node: any) => String(node?.spaceBefore ?? '0'),
    }) || '0';
  const currentSpaceBefore = Number(currentSpaceBeforeStr) || 0;

  const currentSpaceAfterStr =
    useSelectionFragmentProp({
      defaultValue: '8',
      getProp: (node: any) => String(node?.spaceAfter ?? '8'),
    }) || '8';
  const currentSpaceAfter = Number(currentSpaceAfterStr) || 8;

  const handleSelectPreset = (value: string) => {
    setBlockProperty(editor, 'lineHeight', value);
    editor?.tf?.focus?.();
  };

  const handleApplyCustomSpacing = (values: {
    lineHeight: string;
    spaceBefore: number;
    spaceAfter: number;
  }) => {
    setBlockProperty(editor, 'lineHeight', values.lineHeight);
    setBlockProperty(editor, 'spaceBefore', values.spaceBefore);
    setBlockProperty(editor, 'spaceAfter', values.spaceAfter);
    editor?.tf?.focus?.();
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            pressed={open}
            tooltip="Line & paragraph spacing"
            aria-label="Line & paragraph spacing"
            isDropdown
          >
            <WrapText className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
          </ToolbarButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          data-line-spacing-menu
          className="w-48 p-1.5 shadow-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-[150]"
          align="start"
        >
          {/* Header Label matching media_1789892384450.png */}
          <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
            Line Spacing
          </div>

          {PRESET_LINE_SPACINGS.map((preset) => {
            const isSelected =
              currentLineHeight === preset.value ||
              (preset.value === '1' && currentLineHeight === '1.0') ||
              (preset.value === '2' && currentLineHeight === '2.0') ||
              (preset.value === '3' && currentLineHeight === '3.0');

            return (
              <DropdownMenuItem
                key={preset.value}
                onClick={() => handleSelectPreset(preset.value)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer select-none transition-colors',
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                )}
              >
                <span>{preset.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[2.5] ml-auto shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

          {/* Custom spacing action button */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpen(false);
              setCustomSpacingOpen(true);
            }}
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer select-none transition-colors"
          >
            <span>Custom spacing</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Google Docs Custom Spacing Dialog (media_1789892399567.png) */}
      <CustomSpacingDialog
        isOpen={customSpacingOpen}
        onClose={() => setCustomSpacingOpen(false)}
        initialLineHeight={currentLineHeight}
        initialSpaceBefore={currentSpaceBefore}
        initialSpaceAfter={currentSpaceAfter}
        onApply={handleApplyCustomSpacing}
      />
    </>
  );
}
