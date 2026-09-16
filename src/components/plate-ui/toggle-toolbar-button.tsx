'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import { ToolbarButton } from './toolbar';

export function ToggleToolbarButton() {
  const editor = useEditorRef();

  const active = Boolean(
    useSelectionFragmentProp({
      defaultValue: false as any,
      getProp: (node: any) => node?.type === 'toggle',
    })
  );

  const handleToggle = () => {
    try {
      editor?.tf?.setNodes?.(
        { type: active ? 'p' : 'toggle', open: true } as any,
        { match: (n: any) => editor?.api?.isBlock?.(n) ?? true }
      );
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
  };

  return (
    <ToolbarButton
      active={active}
      onClick={handleToggle}
      tooltip="Toggle list"
      aria-label="Toggle list"
    >
      <ChevronRight className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
    </ToolbarButton>
  );
}
