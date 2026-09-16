/**
 * floating-toolbar.tsx
 * Plate UI contextual floating toolbar that appears above selected text.
 * Matches @plate/editor-ai floating formatting bar.
 */
import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ToolbarButton } from './toolbar';

export interface FloatingToolbarProps {
  editor: any;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
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
    const top = rect.top + window.scrollY - 44;
    const left = rect.left + window.scrollX + rect.width / 2;

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

  const toggleMark = (key: string) => {
    try {
      if (editor?.tf?.toggle?.mark) {
        editor.tf.toggle.mark({ key });
      } else if (editor?.toggleMark) {
        editor.toggleMark(key);
      }
    } catch { /* non-fatal */ }
  };

  const isMarkActive = (key: string) => {
    try {
      if (editor?.api?.marks?.isActive) return editor.api.marks.isActive(key);
      if (editor?.isMarkActive) return editor.isMarkActive(key);
      return false;
    } catch {
      return false;
    }
  };

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
        'absolute z-50 flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800',
        'bg-white/95 dark:bg-zinc-900/95 p-1 shadow-lg backdrop-blur-sm',
        'animate-in fade-in-50 zoom-in-95 duration-100 print:hidden'
      )}
    >

      <ToolbarButton
        active={isMarkActive('bold')}
        onClick={() => toggleMark('bold')}
        tooltip="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive('italic')}
        onClick={() => toggleMark('italic')}
        tooltip="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive('underline')}
        onClick={() => toggleMark('underline')}
        tooltip="Underline"
      >
        <Underline className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive('strikethrough')}
        onClick={() => toggleMark('strikethrough')}
        tooltip="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive('highlight')}
        onClick={() => toggleMark('highlight')}
        tooltip="Highlight"
      >
        <Highlighter className="w-3.5 h-3.5 text-amber-500" />
      </ToolbarButton>
    </div>
  );
}

