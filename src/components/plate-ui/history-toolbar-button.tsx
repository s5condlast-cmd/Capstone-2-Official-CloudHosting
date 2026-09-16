'use client';

import * as React from 'react';
import { Redo2, Undo2 } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { ToolbarButton } from './toolbar';

export function RedoToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const disabled = useEditorSelector(
    (ed: any) => (ed.history?.redos ? ed.history.redos.length === 0 : false),
    []
  );

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => {
        try {
          const ed = editor as any;
          if (ed?.redo) ed.redo();
          else if (ed?.api?.redo) ed.api.redo();
          else if (ed?.tf?.redo) ed.tf.redo();
          editor?.tf?.focus?.();
        } catch { /* non-fatal */ }
      }}
      onMouseDown={(e) => e.preventDefault()}
      tooltip="Redo (Ctrl+Y)"
      aria-label="Redo"
    >
      <Redo2 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
    </ToolbarButton>
  );
}

export function UndoToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const disabled = useEditorSelector(
    (ed: any) => (ed.history?.undos ? ed.history.undos.length === 0 : false),
    []
  );

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => {
        try {
          const ed = editor as any;
          if (ed?.undo) ed.undo();
          else if (ed?.api?.undo) ed.api.undo();
          else if (ed?.tf?.undo) ed.tf.undo();
          editor?.tf?.focus?.();
        } catch { /* non-fatal */ }
      }}
      onMouseDown={(e) => e.preventDefault()}
      tooltip="Undo (Ctrl+Z)"
      aria-label="Undo"
    >
      <Undo2 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
    </ToolbarButton>
  );
}
