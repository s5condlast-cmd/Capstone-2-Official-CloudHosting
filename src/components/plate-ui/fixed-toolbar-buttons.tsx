/**
 * fixed-toolbar-buttons.tsx
 * Full button layout matching @plate/editor-ai template specification.
 * Includes History, AI Assistant, Turn Into Block dropdown, Marks, Alignment, Lists, Table, and Inserts.
 */
import * as React from 'react';
import {
  Undo,
  Redo,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Type,
  ChevronDown,
  Table as TableIcon,
  Link as LinkIcon,
  Calendar,
  Minus,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ToolbarButton, ToolbarGroup, ToolbarSeparator } from './toolbar';

// ─── Helpers for Plate Transforms ─────────────────────────────────────────────

function toggleMark(editor: any, key: string) {
  try {
    if (editor?.tf?.toggle?.mark) {
      editor.tf.toggle.mark({ key });
    } else if (editor?.toggleMark) {
      editor.toggleMark(key);
    }
  } catch { /* non-fatal */ }
}

function isMarkActive(editor: any, key: string): boolean {
  try {
    if (editor?.api?.marks?.isActive) return editor.api.marks.isActive(key);
    if (editor?.isMarkActive) return editor.isMarkActive(key);
    return false;
  } catch {
    return false;
  }
}

function setBlock(editor: any, type: string) {
  try {
    if (editor?.tf?.toggle?.block) {
      editor.tf.toggle.block({ type });
    } else if (editor?.setBlockType) {
      editor.setBlockType(type);
    }
  } catch { /* non-fatal */ }
}

function getActiveBlock(editor: any): string {
  try {
    if (editor?.api?.block?.getType) return editor.api.block.getType() ?? 'p';
    return 'p';
  } catch {
    return 'p';
  }
}

function setAlignment(editor: any, align: string) {
  try {
    if (editor?.tf?.align?.set) {
      editor.tf.align.set({ value: align });
    } else if (editor?.setAlignment) {
      editor.setAlignment(align);
    }
  } catch { /* non-fatal */ }
}

function getActiveAlignment(editor: any): string {
  try {
    if (editor?.api?.block?.getAlign) return editor.api.block.getAlign() ?? 'left';
    return 'left';
  } catch {
    return 'left';
  }
}

// ─── Turn Into Block Dropdown ──────────────────────────────────────────────────

const BLOCK_OPTIONS = [
  { id: 'p', label: 'Paragraph', icon: Type },
  { id: 'h1', label: 'Heading 1', icon: Heading1 },
  { id: 'h2', label: 'Heading 2', icon: Heading2 },
  { id: 'h3', label: 'Heading 3', icon: Heading3 },
  { id: 'blockquote', label: 'Quote', icon: Quote },
];

function TurnIntoDropdown({ editor, activeBlock }: { editor: any; activeBlock: string }) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  const currentOption = BLOCK_OPTIONS.find((o) => o.id === activeBlock) || BLOCK_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={dropdownRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Turn into..."
        className="px-2 w-auto font-normal gap-1.5"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
        <span className="text-xs font-medium">{currentOption.label}</span>
        <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
      </ToolbarButton>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Turn into
          </div>
          {BLOCK_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activeBlock === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setBlock(editor, opt.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left transition-colors',
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FixedToolbarButtons Component ───────────────────────────────────────────

export interface FixedToolbarButtonsProps {
  editor: any;
  onOpenAi?: () => void;
}

export function FixedToolbarButtons({ editor, onOpenAi }: FixedToolbarButtonsProps) {
  // Trigger update when editor state changes
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (!editor?.on) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = editor.on('change', forceUpdate);
    } catch { /* non-fatal */ }
    return () => {
      unsub?.();
    };
  }, [editor]);

  const isBold = isMarkActive(editor, 'bold');
  const isItalic = isMarkActive(editor, 'italic');
  const isUnderline = isMarkActive(editor, 'underline');
  const isStrikethrough = isMarkActive(editor, 'strikethrough');
  const isCode = isMarkActive(editor, 'code');
  const isHighlight = isMarkActive(editor, 'highlight');

  const activeBlock = getActiveBlock(editor);
  const activeAlign = getActiveAlignment(editor);

  const handleUndo = () => {
    try { editor?.undo?.(); } catch { /* non-fatal */ }
  };

  const handleRedo = () => {
    try { editor?.redo?.(); } catch { /* non-fatal */ }
  };

  const handleInsertDate = () => {
    try {
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (editor?.tf?.insert?.nodes) {
        editor.tf.insert.nodes([{ type: 'p', children: [{ text: `Date: ${today}` }] }]);
      }
    } catch { /* non-fatal */ }
  };

  const handleInsertLink = () => {
    try {
      const url = window.prompt('Enter link URL:');
      if (!url) return;
      if (editor?.tf?.insert?.nodes) {
        editor.tf.insert.nodes([{ type: 'a', url, children: [{ text: url }] }]);
      }
    } catch { /* non-fatal */ }
  };

  const handleInsertTable = () => {
    try {
      if (editor?.tf?.insert?.nodes) {
        editor.tf.insert.nodes([
          {
            type: 'table',
            children: [
              {
                type: 'tr',
                children: [
                  { type: 'td', children: [{ type: 'p', children: [{ text: 'Header 1' }] }] },
                  { type: 'td', children: [{ type: 'p', children: [{ text: 'Header 2' }] }] },
                ],
              },
              {
                type: 'tr',
                children: [
                  { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
                  { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
                ],
              },
            ],
          },
        ]);
      }
    } catch { /* non-fatal */ }
  };

  return (
    <div className="flex w-full items-center justify-between gap-1 flex-wrap">
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* History Group */}
        <ToolbarGroup>
          <ToolbarButton onClick={handleUndo} tooltip="Undo (Ctrl+Z)">
            <Undo className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={handleRedo} tooltip="Redo (Ctrl+Y)">
            <Redo className="w-3.5 h-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* AI Assistant Group */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => onOpenAi?.()}
            tooltip="AI Writing Assistant (Cmd+J)"
            variant="accent"
            className="px-2 gap-1.5 font-medium text-primary border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide">Ask AI</span>
          </ToolbarButton>
        </ToolbarGroup>

        {/* Turn Into Block Dropdown */}
        <ToolbarGroup>
          <TurnIntoDropdown editor={editor} activeBlock={activeBlock} />
        </ToolbarGroup>

        {/* Text Marks Group */}
        <ToolbarGroup>
          <ToolbarButton
            active={isBold}
            onClick={() => toggleMark(editor, 'bold')}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={isItalic}
            onClick={() => toggleMark(editor, 'italic')}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={isUnderline}
            onClick={() => toggleMark(editor, 'underline')}
            tooltip="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={isStrikethrough}
            onClick={() => toggleMark(editor, 'strikethrough')}
            tooltip="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={isCode}
            onClick={() => toggleMark(editor, 'code')}
            tooltip="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={isHighlight}
            onClick={() => toggleMark(editor, 'highlight')}
            tooltip="Highlight"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Alignment Group */}
        <ToolbarGroup>
          <ToolbarButton
            active={activeAlign === 'left'}
            onClick={() => setAlignment(editor, 'left')}
            tooltip="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={activeAlign === 'center'}
            onClick={() => setAlignment(editor, 'center')}
            tooltip="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={activeAlign === 'right'}
            onClick={() => setAlignment(editor, 'right')}
            tooltip="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={activeAlign === 'justify'}
            onClick={() => setAlignment(editor, 'justify')}
            tooltip="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Lists Group */}
        <ToolbarGroup>
          <ToolbarButton
            active={activeBlock === 'ul'}
            onClick={() => setBlock(editor, 'ul')}
            tooltip="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={activeBlock === 'ol'}
            onClick={() => setBlock(editor, 'ol')}
            tooltip="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Insert Elements */}
        <ToolbarGroup>
          <ToolbarButton onClick={handleInsertLink} tooltip="Insert Link">
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={handleInsertTable} tooltip="Insert Table">
            <TableIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={handleInsertDate} tooltip="Insert Date">
            <Calendar className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setBlock(editor, 'hr')} tooltip="Divider Line">
            <Minus className="w-3.5 h-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>
    </div>
  );
}

