/**
 * floating-toolbar.tsx
 * Plate UI contextual floating toolbar that appears above selected text.
 * Matches @plate/editor-ai floating formatting bar.
 */
import * as React from 'react';
import { useEditorVersion, useSelectionVersion } from 'platejs/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { isMarkActive, toggleMark } from '@/src/components/editor/editor-commands';
import { ToolbarButton } from './toolbar';

export interface FloatingToolbarProps {
  editor: any;
  onAddComment?: (selectedText: string) => void;
}

export function FloatingToolbar({ editor, onAddComment }: FloatingToolbarProps) {
  useEditorVersion();
  useSelectionVersion();

  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = React.useState(false);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!editor) return;

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.isCollapsed || domSelection.rangeCount === 0) {
      setVisible(false);
      return;
    }

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Check if selection is within the editor
    const editorEl = document.querySelector('[data-editor-content]');
    if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }

    if (rect.width === 0 || rect.height === 0) {
      setVisible(false);
      return;
    }

    // Position above selection
    const top = rect.top - 44;
    const left = rect.left + rect.width / 2;

    setPosition({ top: Math.max(10, top), left });
    setVisible(true);
  }, [editor]);

  React.useEffect(() => {
    document.addEventListener('selectionchange', updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('selectionchange', updatePosition);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  if (!visible || !position) return null;

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      data-floating-toolbar
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
      className={cn(
        'fixed z-[120] flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800',
        'bg-white/95 dark:bg-zinc-900/95 p-1 shadow-lg backdrop-blur-sm',
        'animate-in fade-in-50 zoom-in-95 duration-100 print:hidden'
      )}
    >

      <ToolbarButton
        active={isMarkActive(editor, 'bold')}
        onClick={() => toggleMark(editor, 'bold')}
        tooltip="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive(editor, 'italic')}
        onClick={() => toggleMark(editor, 'italic')}
        tooltip="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive(editor, 'underline')}
        onClick={() => toggleMark(editor, 'underline')}
        tooltip="Underline"
      >
        <Underline className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive(editor, 'strikethrough')}
        onClick={() => toggleMark(editor, 'strikethrough')}
        tooltip="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive(editor, 'highlight')}
        onClick={() => toggleMark(editor, 'highlight')}
        tooltip="Highlight"
      >
        <Highlighter className="w-3.5 h-3.5 text-zinc-700 dark:text-white" />
      </ToolbarButton>
    </div>
  );
}
