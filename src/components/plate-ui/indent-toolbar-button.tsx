'use client';

import * as React from 'react';
import { Indent, Outdent } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { getActiveBlock, setBlockProperty } from '@/src/components/editor/editor-commands';
import { ToolbarButton } from './toolbar';

export function IndentToolbarButton() {
  const editor = useEditorRef();

  const handleIndent = () => {
    const block = getActiveBlock(editor);
    if (!block) return;
    const current = Number((block as any)?.indent || 0);
    setBlockProperty(editor, 'indent', Math.min(8, current + 1));
    editor?.tf?.focus?.();
  };

  return (
    <ToolbarButton
      onClick={handleIndent}
      tooltip="Indent (Tab)"
      aria-label="Indent"
    >
      <Indent className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
    </ToolbarButton>
  );
}

export function OutdentToolbarButton() {
  const editor = useEditorRef();

  const handleOutdent = () => {
    const block = getActiveBlock(editor);
    if (!block) return;
    const current = Number((block as any)?.indent || 0);
    if (current > 0) {
      setBlockProperty(editor, 'indent', current - 1 === 0 ? undefined : current - 1);
      editor?.tf?.focus?.();
    }
  };

  return (
    <ToolbarButton
      onClick={handleOutdent}
      tooltip="Outdent (Shift+Tab)"
      aria-label="Outdent"
    >
      <Outdent className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
    </ToolbarButton>
  );
}

