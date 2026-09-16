/**
 * editor-toolbar.tsx
 * Minimal formatting toolbar for the Plate.js document editor.
 *
 * Uses existing Base UI components and current theme tokens.
 * No transition-all on JS-animated elements (per Plan.md constraint).
 *
 * Marks: Bold, Italic, Underline
 * Blocks: H1, H2, H3, Normal, Blockquote, Divider
 * Alignment: Left, Center, Right, Justify
 * Insert: Link, Date Field
 */
import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Quote,
  Minus,
  Link,
  Calendar,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  /** The Plate editor instance (typed as any for Plate v53 compatibility) */
  editor: any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Toggle a mark on the editor using Plate v53 transforms */
function toggleMark(editor: any, markType: string): void {
  try {
    // Plate v53 — editor.tf.toggle.mark or editor.transforms.toggleMark
    if (editor?.tf?.toggle?.mark) {
      editor.tf.toggle.mark({ key: markType });
    } else if (editor?.toggleMark) {
      editor.toggleMark(markType);
    }
  } catch { /* non-fatal */ }
}

/** Check if a mark is active */
function isMarkActive(editor: any, markType: string): boolean {
  try {
    if (editor?.api?.marks?.isActive) return editor.api.marks.isActive(markType);
    if (editor?.isMarkActive) return editor.isMarkActive(markType);
    return false;
  } catch { return false; }
}

/** Set block type */
function setBlock(editor: any, blockType: string): void {
  try {
    if (editor?.tf?.toggle?.block) {
      editor.tf.toggle.block({ type: blockType });
    } else if (editor?.setBlockType) {
      editor.setBlockType(blockType);
    }
  } catch { /* non-fatal */ }
}

/** Get active block type */
function getActiveBlock(editor: any): string {
  try {
    if (editor?.api?.block?.getType) return editor.api.block.getType() ?? 'p';
    return 'p';
  } catch { return 'p'; }
}

/** Set text alignment */
function setAlignment(editor: any, align: string): void {
  try {
    if (editor?.tf?.align?.set) {
      editor.tf.align.set({ value: align });
    } else if (editor?.setAlignment) {
      editor.setAlignment(align);
    }
  } catch { /* non-fatal */ }
}

/** Get current alignment */
function getActiveAlignment(editor: any): string {
  try {
    if (editor?.api?.block?.getAlign) return editor.api.block.getAlign() ?? 'left';
    return 'left';
  } catch { return 'left'; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent editor blur
        onClick();
      }}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded',
        'text-zinc-600 dark:text-zinc-400',
        // Use opacity transition only (safe — not transform)
        'opacity-90 hover:opacity-100',
        'hover:bg-zinc-100 dark:hover:bg-zinc-800',
        'focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none',
        active && 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return (
    <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
  );
}

// ─── EditorToolbar ────────────────────────────────────────────────────────────

export function EditorToolbar({ editor }: EditorToolbarProps) {
  // Force re-render when editor selection changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    if (!editor?.on) return;
    // Subscribe to selection/change events
    let unsub: (() => void) | undefined;
    try {
      unsub = editor.on?.('change', forceUpdate);
    } catch { /* non-fatal */ }
    return () => { unsub?.(); };
  }, [editor]);

  const isBold = isMarkActive(editor, 'bold');
  const isItalic = isMarkActive(editor, 'italic');
  const isUnderline = isMarkActive(editor, 'underline');
  const activeBlock = getActiveBlock(editor);
  const activeAlign = getActiveAlignment(editor);

  const handleInsertDate = () => {
    try {
      if (editor?.tf?.insert?.nodes) {
        editor.tf.insert.nodes([{ type: 'date', date: new Date().toISOString().split('T')[0], children: [{ text: '' }] }]);
      }
    } catch { /* non-fatal */ }
  };

  const handleInsertLink = () => {
    try {
      const url = window.prompt('Enter URL:');
      if (!url) return;
      if (editor?.tf?.insert?.nodes) {
        editor.tf.insert.nodes([{ type: 'a', url, children: [{ text: url }] }]);
      }
    } catch { /* non-fatal */ }
  };

  return (
    <div
      data-editor-toolbar
      role="toolbar"
      aria-label="Document formatting toolbar"
      className={cn(
        'flex items-center flex-wrap gap-0.5 px-2 py-1.5',
        'bg-zinc-50 dark:bg-zinc-900',
        'border-b border-zinc-200 dark:border-zinc-800',
        'select-none print:hidden'
      )}
    >
      {/* Marks */}
      <ToolbarButton active={isBold} onClick={() => toggleMark(editor, 'bold')} title="Bold (Ctrl+B)">
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={isItalic} onClick={() => toggleMark(editor, 'italic')} title="Italic (Ctrl+I)">
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={isUnderline} onClick={() => toggleMark(editor, 'underline')} title="Underline (Ctrl+U)">
        <Underline className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Block type */}
      <ToolbarButton active={activeBlock === 'h1'} onClick={() => setBlock(editor, 'h1')} title="Heading 1">
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeBlock === 'h2'} onClick={() => setBlock(editor, 'h2')} title="Heading 2">
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeBlock === 'h3'} onClick={() => setBlock(editor, 'h3')} title="Heading 3">
        <Heading3 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeBlock === 'p'} onClick={() => setBlock(editor, 'p')} title="Normal paragraph">
        <Type className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeBlock === 'blockquote'} onClick={() => setBlock(editor, 'blockquote')} title="Blockquote">
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Alignment */}
      <ToolbarButton active={activeAlign === 'left'} onClick={() => setAlignment(editor, 'left')} title="Align left">
        <AlignLeft className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeAlign === 'center'} onClick={() => setAlignment(editor, 'center')} title="Align center">
        <AlignCenter className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeAlign === 'right'} onClick={() => setAlignment(editor, 'right')} title="Align right">
        <AlignRight className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={activeAlign === 'justify'} onClick={() => setAlignment(editor, 'justify')} title="Justify">
        <AlignJustify className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Insert */}
      <ToolbarButton active={false} onClick={handleInsertLink} title="Insert link">
        <Link className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={false} onClick={handleInsertDate} title="Insert date field">
        <Calendar className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton active={false} onClick={() => setBlock(editor, 'hr')} title="Insert divider">
        <Minus className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  );
}

export default EditorToolbar;
