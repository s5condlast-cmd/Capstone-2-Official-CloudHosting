/**
 * fixed-toolbar-buttons.tsx
 * Full button suite matching the user's reference screenshot (media_1789455979370.png)
 * and official Plate.js v53 registry specifications (https://platejs.org/r/).
 *
 * All dropdowns and popovers use React Portals rendered directly to document.body,
 * guaranteeing they are NEVER clipped by toolbar overflow or parent wrappers,
 * and ensuring large, easy-to-spot, accessible click targets.
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type,
  Minus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Baseline,
  PaintBucket,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  ListCollapse,
  Link2,
  Table as TableIcon,
  Smile,
  Image as ImageIcon,
  Film,
  AudioLines,
  FileUp,
  Mic,
  WrapText,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  MoreHorizontal,
  Highlighter,
  ChevronDown,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Quote,
  FileCode,
  Superscript,
  Subscript,
  Keyboard,
  Eraser,
  X,
  MessageSquareText,
  Pencil,
  Eye,
  PenLine,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  ToolbarGroup,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';

// ─── Slate / Plate Transform Helpers ──────────────────────────────────────────

function toggleMark(editor: any, key: string) {
  try {
    if (editor?.tf?.toggleMark) {
      editor.tf.toggleMark(key);
    } else if (editor?.toggleMark) {
      editor.toggleMark(key);
    }
  } catch { /* non-fatal */ }
}

function addMark(editor: any, key: string, value: any) {
  try {
    if (editor?.tf?.addMarks) {
      editor.tf.addMarks({ [key]: value });
    }
  } catch { /* non-fatal */ }
}

function removeMark(editor: any, key: string) {
  try {
    if (editor?.tf?.removeMarks) {
      editor.tf.removeMarks(key);
    }
  } catch { /* non-fatal */ }
}

function isMarkActive(editor: any, key: string): boolean {
  try {
    if (editor?.api?.marks) {
      const marks = editor.api.marks();
      return !!marks?.[key];
    }
    return false;
  } catch {
    return false;
  }
}

function getMarkValue(editor: any, key: string): any {
  try {
    if (editor?.api?.marks) {
      const marks = editor.api.marks();
      return marks?.[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function getActiveBlock(editor: any): any {
  try {
    if (editor?.api?.block) {
      const [node] = editor.api.block() || [];
      return node;
    }
    return null;
  } catch {
    return null;
  }
}

function getActiveBlockType(editor: any): string {
  const block = getActiveBlock(editor);
  return block?.type || 'p';
}

function setBlockType(editor: any, type: string) {
  try {
    if (editor?.tf?.setNodes) {
      editor.tf.setNodes(
        { type },
        { match: (n: any) => (editor.api?.isBlock ? editor.api.isBlock(n) : true) }
      );
    }
  } catch { /* non-fatal */ }
}

function setBlockProperty(editor: any, prop: string, value: any) {
  try {
    if (editor?.tf?.setNodes) {
      editor.tf.setNodes(
        { [prop]: value },
        { match: (n: any) => (editor.api?.isBlock ? editor.api.isBlock(n) : true) }
      );
    }
  } catch { /* non-fatal */ }
}

// ─── Universal Portal Popover (Never Clipped by Toolbar Overflow) ──────────────

interface PortalPopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

function PortalPopover({
  anchorRef,
  open,
  onClose,
  children,
  className,
  align = 'start',
}: PortalPopoverProps) {
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    let left = rect.left;
    if (align === 'center') {
      left = rect.left + rect.width / 2;
    } else if (align === 'end') {
      left = rect.right;
    }

    // Keep dropdown fully inside the viewport
    const viewportWidth = window.innerWidth;
    const estimatedWidth = 280;
    if (left + estimatedWidth > viewportWidth) {
      left = Math.max(12, viewportWidth - estimatedWidth - 12);
    }

    setCoords({
      top: rect.bottom + 6,
      left: Math.max(12, left),
    });
  }, [anchorRef, align]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, onClose, anchorRef]);

  if (!open || !coords || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        zIndex: 99999,
      }}
      className={cn(
        'rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1.5 text-zinc-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100',
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

// ─── Default 70-Color Palette (10x7 Grid from Plate registry) ──────────────────

export const DEFAULT_COLORS = [
  // Row 1: Grayscale
  { name: 'Black', value: '#000000' },
  { name: 'Dark Grey 4', value: '#434343' },
  { name: 'Dark Grey 3', value: '#666666' },
  { name: 'Dark Grey 2', value: '#999999' },
  { name: 'Dark Grey 1', value: '#B7B7B7' },
  { name: 'Grey', value: '#CCCCCC' },
  { name: 'Light Grey 1', value: '#D9D9D9' },
  { name: 'Light Grey 2', value: '#EFEFEF' },
  { name: 'Light Grey 3', value: '#F3F3F3' },
  { name: 'White', value: '#FFFFFF' },

  // Row 2: Primaries & Accents
  { name: 'Red Berry', value: '#980100' },
  { name: 'Red', value: '#FE0000' },
  { name: 'Orange', value: '#FE9900' },
  { name: 'Yellow', value: '#FEFF00' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Cornflower Blue', value: '#4B85E8' },
  { name: 'Blue', value: '#1300FF' },
  { name: 'Purple', value: '#9900FF' },
  { name: 'Magenta', value: '#FF00FF' },

  // Row 3: Light Tint 1
  { name: 'Light Red Berry 3', value: '#E6B8AF' },
  { name: 'Light Red 3', value: '#F4CCCC' },
  { name: 'Light Orange 3', value: '#FCE4CD' },
  { name: 'Light Yellow 3', value: '#FFF2CC' },
  { name: 'Light Green 3', value: '#D9EAD3' },
  { name: 'Light Cyan 3', value: '#D0DFE3' },
  { name: 'Light Cornflower Blue 3', value: '#C9DAF8' },
  { name: 'Light Blue 3', value: '#CFE1F3' },
  { name: 'Light Purple 3', value: '#D9D2E9' },
  { name: 'Light Magenta 3', value: '#EAD1DB' },

  // Row 4: Light Tint 2
  { name: 'Light Red Berry 2', value: '#DC7E6B' },
  { name: 'Light Red 2', value: '#EA9999' },
  { name: 'Light Orange 2', value: '#F9CB9C' },
  { name: 'Light Yellow 2', value: '#FFE598' },
  { name: 'Light Green 2', value: '#B7D6A8' },
  { name: 'Light Cyan 2', value: '#A1C4C9' },
  { name: 'Light Cornflower Blue 2', value: '#A4C2F4' },
  { name: 'Light Blue 2', value: '#9FC5E8' },
  { name: 'Light Purple 2', value: '#B5A7D5' },
  { name: 'Light Magenta 2', value: '#D5A6BD' },

  // Row 5: Medium Tint
  { name: 'Light Red Berry 1', value: '#CC4125' },
  { name: 'Light Red 1', value: '#E06666' },
  { name: 'Light Orange 1', value: '#F6B26B' },
  { name: 'Light Yellow 1', value: '#FFD966' },
  { name: 'Light Green 1', value: '#93C47D' },
  { name: 'Light Cyan 1', value: '#76A5AE' },
  { name: 'Light Cornflower Blue 1', value: '#6C9EEB' },
  { name: 'Light Blue 1', value: '#6FA8DC' },
  { name: 'Light Purple 1', value: '#8D7CC3' },
  { name: 'Light Magenta 1', value: '#C27BA0' },

  // Row 6: Dark Shade 1
  { name: 'Dark Red Berry 1', value: '#A61B00' },
  { name: 'Dark Red 1', value: '#CC0000' },
  { name: 'Dark Orange 1', value: '#E59138' },
  { name: 'Dark Yellow 1', value: '#F1C231' },
  { name: 'Dark Green 1', value: '#6AA74F' },
  { name: 'Dark Cyan 1', value: '#45818E' },
  { name: 'Dark Cornflower Blue 1', value: '#3B78D8' },
  { name: 'Dark Blue 1', value: '#3E84C6' },
  { name: 'Dark Purple 1', value: '#664EA6' },
  { name: 'Dark Magenta 1', value: '#A64D78' },

  // Row 7: Dark Shade 2
  { name: 'Dark Red Berry 2', value: '#5B0F00' },
  { name: 'Dark Red 2', value: '#660000' },
  { name: 'Dark Orange 2', value: '#783F04' },
  { name: 'Dark Yellow 2', value: '#7E6000' },
  { name: 'Dark Green 2', value: '#274E12' },
  { name: 'Dark Cyan 2', value: '#0D343D' },
  { name: 'Dark Cornflower Blue 2', value: '#1B4487' },
  { name: 'Dark Blue 2', value: '#083763' },
  { name: 'Dark Purple 2', value: '#1F124D' },
  { name: 'Dark Magenta 2', value: '#4C1130' },
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];

// ─── 1. Insert Toolbar Button (+ v) ───────────────────────────────────────────

interface InsertGroup {
  group: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    action: (editor: any) => void;
  }[];
}

function InsertToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const groups: InsertGroup[] = [
    {
      group: 'Basic blocks',
      items: [
        { icon: Type, label: 'Paragraph', action: (ed) => setBlockType(ed, 'p') },
        { icon: Heading1, label: 'Heading 1', action: (ed) => setBlockType(ed, 'h1') },
        { icon: Heading2, label: 'Heading 2', action: (ed) => setBlockType(ed, 'h2') },
        { icon: Heading3, label: 'Heading 3', action: (ed) => setBlockType(ed, 'h3') },
        {
          icon: TableIcon,
          label: 'Table',
          action: (ed) => {
            const table = {
              type: 'table',
              children: [
                {
                  type: 'tr',
                  children: [
                    { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
                    { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
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
            };
            ed?.tf?.insertNodes?.([table]);
          },
        },
        { icon: FileCode, label: 'Code', action: (ed) => toggleMark(ed, 'code') },
        { icon: Quote, label: 'Quote', action: (ed) => setBlockType(ed, 'blockquote') },
        {
          icon: Minus,
          label: 'Divider',
          action: (ed) => ed?.tf?.insertNodes?.([{ type: 'hr', children: [{ text: '' }] }]),
        },
      ],
    },
    {
      group: 'Lists',
      items: [
        { icon: List, label: 'Bulleted list', action: (ed) => setBlockType(ed, 'ul') },
        { icon: ListOrdered, label: 'Numbered list', action: (ed) => setBlockType(ed, 'ol') },
        { icon: ListTodo, label: 'To-do list', action: (ed) => setBlockType(ed, 'todo') },
        { icon: ListCollapse, label: 'Toggle list', action: (ed) => setBlockType(ed, 'toggle') },
      ],
    },
    {
      group: 'Inline',
      items: [
        {
          icon: Link2,
          label: 'Link',
          action: (ed) => {
            let selectedText = '';
            try {
              if (ed?.selection && ed?.api?.string) {
                selectedText = ed.api.string(ed.selection);
              }
            } catch { /* non-fatal */ }
            ed?.tf?.insertNodes?.([
              { type: 'a', url: 'https://', children: [{ text: selectedText || 'https://' }] },
            ]);
            ed?.tf?.focus?.();
          },
        },
        {
          icon: Calendar,
          label: 'Date',
          action: (ed) => {
            const today = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            ed?.tf?.insertNodes?.([{ type: 'p', children: [{ text: `Date: ${today}` }] }]);
          },
        },
      ],
    },
  ];

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Insert block or element"
        className="px-2.5 h-8.5 font-medium gap-1"
      >
        <Plus className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-56 max-h-96 overflow-y-auto p-1.5"
      >
        {groups.map(({ group, items }) => (
          <div key={group} className="py-1">
            <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {group}
            </div>
            {items.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  action(editor);
                  setOpen(false);
                  editor?.tf?.focus?.();
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Icon className="w-4 h-4 text-zinc-500" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </PortalPopover>
    </div>
  );
}

// ─── 2. Turn Into Toolbar Button (Heading 1 v) ─────────────────────────────────

const TURN_INTO_OPTIONS = [
  { id: 'p', label: 'Text', icon: Type },
  { id: 'h1', label: 'Heading 1', icon: Heading1 },
  { id: 'h2', label: 'Heading 2', icon: Heading2 },
  { id: 'h3', label: 'Heading 3', icon: Heading3 },
  { id: 'h4', label: 'Heading 4', icon: Heading4 },
  { id: 'h5', label: 'Heading 5', icon: Heading5 },
  { id: 'h6', label: 'Heading 6', icon: Heading6 },
  { id: 'ul', label: 'Bulleted list', icon: List },
  { id: 'ol', label: 'Numbered list', icon: ListOrdered },
  { id: 'todo', label: 'To-do list', icon: ListTodo },
  { id: 'toggle', label: 'Toggle list', icon: ListCollapse },
  { id: 'blockquote', label: 'Quote', icon: Quote },
];

function TurnIntoToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const activeType = getActiveBlockType(editor);
  const currentOption = TURN_INTO_OPTIONS.find((o) => o.id === activeType) || TURN_INTO_OPTIONS[0];

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Turn into"
        className="px-2.5 h-8.5 font-medium min-w-[110px] justify-between gap-1.5"
      >
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          {currentOption.label}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-52 max-h-80 overflow-y-auto p-1.5"
      >
        <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Turn into
        </div>
        {TURN_INTO_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = activeType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setBlockType(editor, opt.id);
                setOpen(false);
                editor?.tf?.focus?.();
              }}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
                isSelected
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          );
        })}
      </PortalPopover>
    </div>
  );
}

// ─── 3. Font Size Toolbar Button ([- | 12 | +]) ────────────────────────────────

function FontSizeToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const markVal = getMarkValue(editor, 'fontSize');
  let currentSize = 12;
  if (typeof markVal === 'string') {
    const num = parseInt(markVal, 10);
    if (!isNaN(num) && num > 0) currentSize = num;
  } else if (typeof markVal === 'number' && markVal > 0) {
    currentSize = markVal;
  }

  const applySize = (size: number) => {
    addMark(editor, 'fontSize', `${size}pt`);
    editor?.tf?.focus?.();
  };

  const handleStep = (delta: number) => {
    const next = Math.max(6, Math.min(120, currentSize + delta));
    applySize(next);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center h-8.5 rounded-md border border-zinc-300/80 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 p-0.5"
    >
      <button
        type="button"
        title="Decrease font size"
        onMouseDown={(e) => {
          e.preventDefault();
          handleStep(-1);
        }}
        className="w-6 h-7.5 flex items-center justify-center text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-700 rounded transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Choose font size"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        className="px-2 h-7.5 flex items-center justify-center text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 rounded transition-colors min-w-[32px]"
      >
        {currentSize}
      </button>

      <button
        type="button"
        title="Increase font size"
        onMouseDown={(e) => {
          e.preventDefault();
          handleStep(1);
        }}
        className="w-6 h-7.5 flex items-center justify-center text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-700 rounded transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <PortalPopover
        anchorRef={containerRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-24 max-h-64 overflow-y-auto p-1.5"
      >
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applySize(size);
              setOpen(false);
            }}
            className={cn(
              'w-full py-1.5 text-center text-xs font-semibold rounded-md transition-colors',
              currentSize === size
                ? 'bg-primary/15 text-primary'
                : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            {size} pt
          </button>
        ))}
      </PortalPopover>
    </div>
  );
}

// ─── 4. Color Pickers (Text Color A_ and Paint Bucket) ─────────────────────────

interface ColorPickerDropdownProps {
  editor: any;
  nodeType: 'color' | 'backgroundColor';
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}

function ColorPickerDropdown({ editor, nodeType, tooltip, icon: Icon }: ColorPickerDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const activeColor = getMarkValue(editor, nodeType);

  const applyColor = (hex: string) => {
    addMark(editor, nodeType, hex);
    setOpen(false);
    editor?.tf?.focus?.();
  };

  const clearColor = () => {
    removeMark(editor, nodeType);
    setOpen(false);
    editor?.tf?.focus?.();
  };

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        onClick={() => setOpen(!open)}
        tooltip={tooltip}
        className="relative px-2 h-8.5"
      >
        <div className="flex flex-col items-center">
          <Icon className="w-4 h-4" />
          <div
            className="w-4 h-1 mt-0.5 rounded-full"
            style={{ backgroundColor: activeColor || (nodeType === 'color' ? '#000000' : 'transparent') }}
          />
        </div>
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-72 p-3.5"
      >
        <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
          {nodeType === 'color' ? 'Text Font Color' : 'Background / Highlight Color'}
        </div>

        {/* 10-column palette grid with large 20px circles */}
        <div className="grid grid-cols-10 gap-2 place-items-center mb-3.5">
          {DEFAULT_COLORS.map(({ name, value }) => {
            const isSelected = activeColor === value;
            return (
              <button
                key={`${name}-${value}`}
                type="button"
                title={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyColor(value);
                }}
                style={{ backgroundColor: value }}
                className={cn(
                  'w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700 transition-transform hover:scale-125 flex items-center justify-center cursor-pointer shadow-xs',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'w-3 h-3',
                      value === '#FFFFFF' || value === '#FEFF00' || value === '#00FFFF'
                        ? 'text-zinc-900'
                        : 'text-white'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2.5 gap-2">
          {/* Custom Color Input */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-7 h-7 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 p-0.5 bg-transparent"
              value={activeColor || '#000000'}
              onChange={(e) => applyColor(e.target.value)}
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Custom HEX</span>
          </div>

          {/* Clear Button */}
          {activeColor && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearColor();
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2.5 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </PortalPopover>
    </div>
  );
}

// ─── 5. Alignment Dropdown ───────────────────────────────────────────────────

const ALIGN_OPTIONS = [
  { id: 'left', label: 'Align Left', icon: AlignLeft },
  { id: 'center', label: 'Align Center', icon: AlignCenter },
  { id: 'right', label: 'Align Right', icon: AlignRight },
  { id: 'justify', label: 'Justify', icon: AlignJustify },
];

function AlignToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const block = getActiveBlock(editor);
  const currentAlign = block?.align || 'left';
  const currentOption = ALIGN_OPTIONS.find((o) => o.id === currentAlign) || ALIGN_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Text Alignment"
        className="px-2 h-8.5"
      >
        <CurrentIcon className="w-4 h-4" />
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-40 p-1.5"
      >
        {ALIGN_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = currentAlign === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setBlockProperty(editor, 'align', opt.id);
                setOpen(false);
                editor?.tf?.focus?.();
              }}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
                isSelected
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          );
        })}
      </PortalPopover>
    </div>
  );
}

// ─── 6. List Split Buttons (Numbered & Bulleted) ──────────────────────────────

const NUMBERED_STYLES = [
  { id: 'decimal', label: 'Decimal (1, 2, 3)' },
  { id: 'lower-alpha', label: 'Lower Alpha (a, b, c)' },
  { id: 'upper-alpha', label: 'Upper Alpha (A, B, C)' },
  { id: 'lower-roman', label: 'Lower Roman (i, ii, iii)' },
  { id: 'upper-roman', label: 'Upper Roman (I, II, III)' },
];

function NumberedListToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const activeType = getActiveBlockType(editor);
  const isNumbered = activeType === 'ol';

  const toggleList = (styleType = 'decimal') => {
    if (isNumbered) {
      setBlockType(editor, 'p');
    } else {
      editor?.tf?.setNodes?.(
        { type: 'ol', listStyleType: styleType },
        { match: (n: any) => (editor.api?.isBlock ? editor.api.isBlock(n) : true) }
      );
    }
    editor?.tf?.focus?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <ToolbarSplitButton pressed={isNumbered}>
        <ToolbarSplitButtonPrimary
          title="Numbered List"
          onClick={() => toggleList('decimal')}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarSplitButtonPrimary>
        <ToolbarSplitButtonSecondary
          onClick={() => setOpen(!open)}
          title="Numbered list options"
        >
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
        </ToolbarSplitButtonSecondary>
      </ToolbarSplitButton>

      <PortalPopover
        anchorRef={containerRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-48 p-1.5"
      >
        <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Numbering Style
        </div>
        {NUMBERED_STYLES.map((st) => (
          <button
            key={st.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleList(st.id);
              setOpen(false);
            }}
            className="flex items-center w-full px-3 py-2 text-xs font-medium rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {st.label}
          </button>
        ))}
      </PortalPopover>
    </div>
  );
}

const BULLET_STYLES = [
  { id: 'disc', label: 'Default (Disc)' },
  { id: 'circle', label: 'Circle' },
  { id: 'square', label: 'Square' },
];

function BulletedListToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const activeType = getActiveBlockType(editor);
  const isBulleted = activeType === 'ul';

  const toggleList = (styleType = 'disc') => {
    if (isBulleted) {
      setBlockType(editor, 'p');
    } else {
      editor?.tf?.setNodes?.(
        { type: 'ul', listStyleType: styleType },
        { match: (n: any) => (editor.api?.isBlock ? editor.api.isBlock(n) : true) }
      );
    }
    editor?.tf?.focus?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <ToolbarSplitButton pressed={isBulleted}>
        <ToolbarSplitButtonPrimary
          title="Bulleted List"
          onClick={() => toggleList('disc')}
        >
          <List className="w-4 h-4" />
        </ToolbarSplitButtonPrimary>
        <ToolbarSplitButtonSecondary
          onClick={() => setOpen(!open)}
          title="Bulleted list options"
        >
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
        </ToolbarSplitButtonSecondary>
      </ToolbarSplitButton>

      <PortalPopover
        anchorRef={containerRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-40 p-1.5"
      >
        <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Bullet Style
        </div>
        {BULLET_STYLES.map((st) => (
          <button
            key={st.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleList(st.id);
              setOpen(false);
            }}
            className="flex items-center w-full px-3 py-2 text-xs font-medium rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {st.label}
          </button>
        ))}
      </PortalPopover>
    </div>
  );
}

// ─── 6.5. Link Toolbar Button (Interactive Dropview / Popover) ────────────────

function LinkToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const [text, setText] = React.useState('');
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const savedSelectionRef = React.useRef<any>(null);

  // Check if cursor/selection is inside an existing link
  const linkEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'a' });
  const isLinkActive = Boolean(linkEntry);

  const handleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }

    // Save current editor selection
    savedSelectionRef.current = editor?.selection;

    // Check if cursor is on an existing link
    const activeLink = editor?.api?.above?.({ match: (n: any) => n.type === 'a' });
    if (activeLink) {
      const [linkNode] = activeLink;
      setUrl(linkNode.url || '');
      const linkText = linkNode.children?.map((c: any) => c.text || '').join('') || '';
      setText(linkText);
    } else {
      // Not on a link - get selected text if any
      let selectedText = '';
      try {
        if (editor?.selection && editor?.api?.string) {
          selectedText = editor.api.string(editor.selection);
        }
      } catch { /* non-fatal */ }
      setText(selectedText);
      setUrl('');
    }

    setOpen(true);
  };

  // Auto-focus URL input when popover opens
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSaveLink = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    // Normalize protocol
    let formattedUrl = cleanUrl;
    if (!/^https?:\/\//i.test(formattedUrl) && !/^mailto:/i.test(formattedUrl) && !/^tel:/i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const displayText = text.trim() || formattedUrl;

    // Restore selection in editor
    if (savedSelectionRef.current && editor?.tf?.select) {
      try {
        editor.tf.select(savedSelectionRef.current);
      } catch { /* non-fatal */ }
    }

    try {
      const activeLink = editor?.api?.above?.({ match: (n: any) => n.type === 'a' });
      if (activeLink) {
        // Update existing link
        const [, path] = activeLink;
        editor?.tf?.setNodes?.({ url: formattedUrl }, { at: path });
        if (text.trim()) {
          editor?.tf?.setNodes?.(
            { text: text.trim() },
            { at: [...path, 0], match: (n: any) => n.text !== undefined }
          );
        }
      } else {
        // Insert new link node
        editor?.tf?.insertNodes?.([
          {
            type: 'a',
            url: formattedUrl,
            children: [{ text: displayText }],
          },
        ]);
      }
      editor?.tf?.focus?.();
    } catch (err) {
      console.error('Failed to insert link:', err);
    }

    setOpen(false);
  };

  const handleRemoveLink = () => {
    if (savedSelectionRef.current && editor?.tf?.select) {
      try {
        editor.tf.select(savedSelectionRef.current);
      } catch { /* non-fatal */ }
    }
    try {
      editor?.tf?.unwrapNodes?.({ match: (n: any) => n.type === 'a' });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const handleOpenLink = () => {
    if (!url) return;
    let target = url.trim();
    if (!/^https?:\/\//i.test(target) && !/^mailto:/i.test(target)) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={anchorRef} className="relative inline-flex">
      <ToolbarButton
        active={open || isLinkActive}
        onClick={handleOpen}
        tooltip={isLinkActive ? 'Edit Link' : 'Insert Link'}
        className="px-2 h-8.5"
      >
        <Link2 className={cn('w-4 h-4', isLinkActive && 'text-primary')} />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-80 p-3.5 flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100">
            <Link2 className="w-3.5 h-3.5 text-primary" />
            <span>{isLinkActive ? 'Edit Link' : 'Insert Link'}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSaveLink} className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Link URL
            </label>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or paste URL…"
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Text to display
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Display text (optional)"
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {isLinkActive ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Remove link"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Unlink</span>
                </button>
                {url && (
                  <button
                    type="button"
                    onClick={handleOpenLink}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Open link in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim()}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {isLinkActive ? 'Save' : 'Insert Link'}
              </button>
            </div>
          </div>
        </form>
      </PortalPopover>
    </div>
  );
}

// ─── 7. Table Toolbar Button (8x8 Grid + Cell/Row/Col tools) ───────────────────

function TableToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const [hoveredSize, setHoveredSize] = React.useState({ rows: 0, cols: 0 });
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const insideTable = Boolean(
    editor?.api?.above?.({ match: (n: any) => n.type === 'table' })
  );

  const insertTable = (rows: number, cols: number) => {
    const tableRows = [];
    for (let r = 0; r < rows; r++) {
      const cells = [];
      for (let c = 0; c < cols; c++) {
        cells.push({
          type: 'td',
          children: [{ type: 'p', children: [{ text: '' }] }],
        });
      }
      tableRows.push({ type: 'tr', children: cells });
    }
    editor?.tf?.insertNodes?.([{ type: 'table', children: tableRows }]);
    setOpen(false);
    editor?.tf?.focus?.();
  };

  const insertRow = (before = false) => {
    const rowEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'tr' });
    if (rowEntry) {
      const [rowNode, rowPath] = rowEntry;
      const colCount = rowNode.children?.length || 2;
      const newCells = Array.from({ length: colCount }, () => ({
        type: 'td',
        children: [{ type: 'p', children: [{ text: '' }] }],
      }));
      const newRow = { type: 'tr', children: newCells };
      const insertPath = before ? rowPath : [rowPath[0], rowPath[1] + 1];
      editor.tf.insertNodes([newRow], { at: insertPath });
    }
    setOpen(false);
  };

  const deleteRow = () => {
    const rowEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'tr' });
    if (rowEntry) editor.tf.removeNodes({ at: rowEntry[1] });
    setOpen(false);
  };

  const insertCol = (before = false) => {
    const cellEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });
    const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
    if (cellEntry && tableEntry) {
      const colIdx = cellEntry[1][cellEntry[1].length - 1];
      const targetIdx = before ? colIdx : colIdx + 1;
      const tablePath = tableEntry[1];
      const tableNode = tableEntry[0];
      for (let r = 0; r < tableNode.children.length; r++) {
        const cellPath = [...tablePath, r, targetIdx];
        const newCell = { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] };
        editor.tf.insertNodes([newCell], { at: cellPath });
      }
    }
    setOpen(false);
  };

  const deleteCol = () => {
    const cellEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });
    const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
    if (cellEntry && tableEntry) {
      const colIdx = cellEntry[1][cellEntry[1].length - 1];
      const tablePath = tableEntry[1];
      const tableNode = tableEntry[0];
      for (let r = 0; r < tableNode.children.length; r++) {
        const cellPath = [...tablePath, r, colIdx];
        editor.tf.removeNodes({ at: cellPath });
      }
    }
    setOpen(false);
  };

  const deleteTable = () => {
    const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
    if (tableEntry) editor.tf.removeNodes({ at: tableEntry[1] });
    setOpen(false);
  };

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Table"
        className="px-2 h-8.5"
      >
        <TableIcon className="w-4 h-4" />
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-60 p-3.5"
      >
        <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
          Insert Table Grid
        </div>

        {/* 8x8 Interactive Grid */}
        <div
          className="grid grid-cols-8 gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800/70 rounded-lg border border-zinc-200 dark:border-zinc-700/80 mb-2.5 cursor-pointer"
          onMouseLeave={() => setHoveredSize({ rows: 0, cols: 0 })}
        >
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((__, c) => {
              const isHighlighted = r < hoveredSize.rows && c < hoveredSize.cols;
              return (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setHoveredSize({ rows: r + 1, cols: c + 1 })}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertTable(r + 1, c + 1);
                  }}
                  className={cn(
                    'w-4 h-4 rounded-xs border transition-colors',
                    isHighlighted
                      ? 'bg-primary border-primary'
                      : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'
                  )}
                />
              );
            })
          )}
        </div>

        <div className="text-center text-xs text-zinc-600 dark:text-zinc-400 font-semibold mb-2">
          {hoveredSize.rows > 0 ? `${hoveredSize.rows} rows × ${hoveredSize.cols} columns` : 'Hover to choose grid size'}
        </div>

        {insideTable && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 space-y-1">
            <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              Table Row & Col Tools
            </div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertRow(true); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Insert row above</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertRow(false); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
              <span>Insert row below</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); deleteRow(); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-zinc-400" />
              <span>Delete row</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertCol(true); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
              <span>Insert column left</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertCol(false); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span>Insert column right</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); deleteCol(); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-zinc-400" />
              <span>Delete column</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); deleteTable(); }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete table</span>
            </button>
          </div>
        )}
      </PortalPopover>
    </div>
  );
}

// ─── 8. Emoji Toolbar Button (😊 v) ───────────────────────────────────────────

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇',
  '🥰', '😍', '🤩', '😘', '😋', '😛', '😜', '🤪', '🤗', '🤔', '🤐', '🤨',
  '😐', '😏', '😌', '😴', '😷', '🤒', '👍', '👎', '👌', '✌️', '🤞', '👏',
  '🙌', '🤝', '🙏', '✍️', '💪', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
  '💯', '✨', '🔥', '⭐', '🌟', '🎉', '📌', '📍', '📎', '📝', '📁', '📄',
];

function EmojiToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const insertEmoji = (emoji: string) => {
    editor?.tf?.insertText?.(emoji);
    setOpen(false);
    editor?.tf?.focus?.();
  };

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Emoji"
        className="px-2 h-8.5"
      >
        <Smile className="w-4 h-4" />
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-72 p-3.5"
      >
        <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
          Insert Emoji
        </div>
        <div className="grid grid-cols-8 gap-1.5 place-items-center max-h-56 overflow-y-auto p-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertEmoji(emoji);
              }}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-transform hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PortalPopover>
    </div>
  );
}

// ─── 9. Unified Media Toolbar Button (Image, Video, Audio, File) ────────────────

const MEDIA_TYPES = [
  { type: 'img' as const, label: 'Image', icon: ImageIcon, accept: 'image/*' },
  { type: 'video' as const, label: 'Video', icon: Film, accept: 'video/*' },
  { type: 'audio' as const, label: 'Audio', icon: AudioLines, accept: 'audio/*' },
  { type: 'file' as const, label: 'File Attachment', icon: FileUp, accept: '*' },
];

function MediaToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const [activeMedia, setActiveMedia] = React.useState<typeof MEDIA_TYPES[number] | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = React.useState(false);
  const [inputUrl, setInputUrl] = React.useState('');
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const insertMedia = (type: 'img' | 'video' | 'audio' | 'file', url: string, name?: string) => {
    editor?.tf?.insertNodes?.([
      {
        type,
        url,
        name: name || url.split('/').pop() || type,
        children: [{ text: '' }],
      },
    ]);
    editor?.tf?.focus?.();
  };

  const handleTriggerUpload = (media: typeof MEDIA_TYPES[number]) => {
    setActiveMedia(media);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = media.accept;
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMedia) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      insertMedia(activeMedia.type, result, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTriggerUrl = (media: typeof MEDIA_TYPES[number]) => {
    setActiveMedia(media);
    setOpen(false);
    setInputUrl('');
    setUrlDialogOpen(true);
  };

  const handleUrlSubmit = () => {
    if (!inputUrl.trim() || !activeMedia) return;
    insertMedia(activeMedia.type, inputUrl.trim());
    setInputUrl('');
    setUrlDialogOpen(false);
  };

  return (
    <div ref={anchorRef} className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
      />

      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Insert Media (Image, Video, Audio, File)"
        className="px-2 h-8.5"
      >
        <ImageIcon className="w-4 h-4" />
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-64 p-2"
      >
        <div className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Insert Media
        </div>
        <div className="space-y-1 mt-1">
          {MEDIA_TYPES.map((media) => {
            const Icon = media.icon;
            return (
              <div
                key={media.type}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
              >
                <div
                  onClick={() => handleTriggerUpload(media)}
                  className="flex items-center gap-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer flex-1"
                >
                  <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  <span>{media.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTriggerUpload(media);
                    }}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTriggerUrl(media);
                    }}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    URL
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PortalPopover>

      {/* URL Input Modal */}
      {urlDialogOpen && activeMedia &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl space-y-4">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Insert {activeMedia.label} via URL
              </div>
              <input
                type="url"
                placeholder="https://..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlSubmit();
                }}
                autoFocus
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUrlDialogOpen(false);
                    setInputUrl('');
                  }}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ─── 9b. Speech to Text Toolbar Button (Voice Dictation) ─────────────────────

function SpeechToTextToolbarButton({ editor, disabled }: { editor: any; disabled?: boolean }) {
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(true);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript?.trim();
          if (text) {
            finalStr += text + ' ';
          }
        }
      }

      if (finalStr && editor) {
        try {
          editor?.tf?.focus?.();
          editor?.tf?.insertText?.(finalStr);
        } catch (err) {
          console.warn('Speech insert text error:', err);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (err) {}
    };
  }, [editor]);

  const toggleListening = () => {
    if (disabled) return;
    if (!isSupported) {
      alert('Speech-to-text is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  return (
    <>
      <ToolbarButton
        active={isListening}
        onClick={toggleListening}
        tooltip={isListening ? 'Listening... Click to stop dictation' : 'Speech to Text (Voice Dictation)'}
        disabled={disabled}
        className={cn(
          isListening && 'bg-red-500/15 text-red-600 dark:text-red-400 font-semibold'
        )}
      >
        <Mic className={cn('w-4 h-4', isListening && 'animate-pulse text-red-500')} />
      </ToolbarButton>

      {/* Floating Status Pill during voice dictation */}
      {isListening &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 shadow-2xl backdrop-blur-md text-xs font-medium border border-zinc-700/50 dark:border-zinc-300/50 animate-in fade-in slide-in-from-bottom-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span>Listening... Speak into your microphone</span>
            <button
              type="button"
              onClick={toggleListening}
              className="ml-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
            >
              Done
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

// ─── 10. Line Height Toolbar Button ───────────────────────────────────────────

const LINE_HEIGHT_OPTIONS = [
  { value: 1, label: 'Single (1.0)' },
  { value: 1.15, label: '1.15' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: 'Double (2.0)' },
  { value: 2.5, label: '2.5' },
  { value: 3, label: '3.0' },
];

function LineHeightToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const block = getActiveBlock(editor);
  const currentHeight = Number(block?.lineHeight) || 1.5;

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        isDropdown
        onClick={() => setOpen(!open)}
        tooltip="Line Spacing"
        className="px-2 h-8.5"
      >
        <WrapText className="w-4 h-4" />
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-44 p-1.5"
      >
        <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Line Spacing
        </div>
        {LINE_HEIGHT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setBlockProperty(editor, 'lineHeight', opt.value);
              setOpen(false);
              editor?.tf?.focus?.();
            }}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
              currentHeight === opt.value
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <span>{opt.label}</span>
            {currentHeight === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        ))}
      </PortalPopover>
    </div>
  );
}

// ─── 11. More Formatting Dropdown (...) ────────────────────────────────────────

function MoreToolbarButton({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const isSub = isMarkActive(editor, 'subscript');
  const isSup = isMarkActive(editor, 'superscript');
  const isKbd = isMarkActive(editor, 'kbd');

  return (
    <div ref={anchorRef} className="relative">
      <ToolbarButton
        onClick={() => setOpen(!open)}
        tooltip="More formatting"
        className="px-2 h-8.5"
      >
        <MoreHorizontal className="w-4 h-4" />
      </ToolbarButton>

      <PortalPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="w-48 p-1.5"
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark(editor, 'superscript');
            removeMark(editor, 'subscript');
            setOpen(false);
            editor?.tf?.focus?.();
          }}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
            isSup
              ? 'bg-primary/15 text-primary font-semibold'
              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Superscript className="w-4 h-4" />
            <span>Superscript</span>
          </div>
          {isSup && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark(editor, 'subscript');
            removeMark(editor, 'superscript');
            setOpen(false);
            editor?.tf?.focus?.();
          }}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
            isSub
              ? 'bg-primary/15 text-primary font-semibold'
              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Subscript className="w-4 h-4" />
            <span>Subscript</span>
          </div>
          {isSub && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark(editor, 'kbd');
            setOpen(false);
            editor?.tf?.focus?.();
          }}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
            isKbd
              ? 'bg-primary/15 text-primary font-semibold'
              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4" />
            <span>Keyboard input</span>
          </div>
          {isKbd && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>
      </PortalPopover>
    </div>
  );
}

// ─── Comment & Annotation Toolbar Button ──────────────────────────────────────

export interface EditorComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  selectedText?: string;
  resolved?: boolean;
}

interface CommentToolbarButtonProps {
  editor: any;
  comments?: EditorComment[];
  onAddComment?: (text: string, selectedText?: string) => void;
  onResolveComment?: (id: string) => void;
}

export function CommentToolbarButton({
  editor,
  comments = [],
  onAddComment,
  onResolveComment,
}: CommentToolbarButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [selectedSnippet, setSelectedSnippet] = React.useState('');
  const buttonRef = React.useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    const sel = typeof window !== 'undefined' ? window.getSelection()?.toString()?.trim() || '' : '';
    setSelectedSnippet(sel);
    setOpen((prev) => !prev);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment?.(text.trim(), selectedSnippet || undefined);
    setText('');
    setSelectedSnippet('');
  };

  const activeComments = comments.filter((c) => !c.resolved);

  return (
    <div ref={buttonRef} className="relative inline-flex">
      <ToolbarButton
        active={open}
        onClick={handleOpen}
        tooltip="Comments & feedback notes"
        className="relative"
      >
        <MessageSquareText className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        {activeComments.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
            {activeComments.length > 9 ? '9+' : activeComments.length}
          </span>
        )}
      </ToolbarButton>

      <PortalPopover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        align="end"
        className="w-80 sm:w-96 p-3 flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Comments & Notes
            </span>
            {activeComments.length > 0 && (
              <span className="text-[11px] font-semibold text-zinc-500">
                ({activeComments.length})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          {selectedSnippet && (
            <div className="flex items-start justify-between gap-1.5 p-2 rounded-md bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
              <div className="flex items-start gap-1.5 overflow-hidden">
                <Quote className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span className="italic text-zinc-600 dark:text-zinc-300 truncate max-w-[240px]">
                  "{selectedSnippet}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnippet('')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Clear selection reference"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedSnippet ? 'Comment on selected text…' : 'Add a document note or comment…'}
            rows={2}
            className="w-full text-xs p-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-zinc-400"
          />

          <div className="flex justify-end gap-1.5">
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Post Comment
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {comments.length === 0 ? (
            <p className="text-center py-4 text-xs text-zinc-400">
              No comments yet. Highlight text or write a note above.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  'p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-colors',
                  comment.resolved
                    ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 shadow-xs'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {comment.createdAt}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onResolveComment?.(comment.id)}
                    className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title={comment.resolved ? 'Delete' : 'Resolve / Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {comment.selectedText && (
                  <div className="pl-2 border-l-2 border-primary/40 text-[11px] italic text-zinc-500 dark:text-zinc-400">
                    "{comment.selectedText}"
                  </div>
                )}

                <p className="text-zinc-700 dark:text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            ))
          )}
        </div>
      </PortalPopover>
    </div>
  );
}

// ─── Mode Switcher Dropdown (Editing, Suggesting, Viewing) ─────────────────────

export type EditorMode = 'editing' | 'viewing' | 'suggestion';

interface ModeToolbarButtonProps {
  mode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
}

export function ModeToolbarButton({
  mode = 'editing',
  onModeChange,
}: ModeToolbarButtonProps) {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  const MODES: { id: EditorMode; label: string; icon: React.ComponentType<any>; desc: string }[] = [
    {
      id: 'editing',
      label: 'Editing',
      icon: Pencil,
      desc: 'Edit document directly',
    },
    {
      id: 'suggestion',
      label: 'Suggesting',
      icon: PenLine,
      desc: 'Edits become suggestions and notes',
    },
    {
      id: 'viewing',
      label: 'Viewing',
      icon: Eye,
      desc: 'Read or print document (read-only)',
    },
  ];

  const currentMode = MODES.find((m) => m.id === mode) || MODES[0];
  const CurrentIcon = currentMode.icon;

  const handleSelect = (newMode: EditorMode) => {
    onModeChange?.(newMode);
    setOpen(false);
  };

  return (
    <div ref={buttonRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-8.5 items-center gap-1.5 px-2 rounded-md text-xs font-semibold',
          'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs',
          'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors'
        )}
        title="Switch document editing mode"
      >
        <CurrentIcon className={cn(
          'w-4 h-4 shrink-0',
          mode === 'editing' && 'text-primary',
          mode === 'suggestion' && 'text-zinc-700 dark:text-white',
          mode === 'viewing' && 'text-zinc-400'
        )} />
        <span>{currentMode.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200 shrink-0" />
      </button>

      <PortalPopover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        align="end"
        className="w-64 p-1.5 flex flex-col gap-1"
      >
        {MODES.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === mode;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={cn(
                'flex items-start gap-2.5 p-2 rounded-md text-left transition-colors w-full',
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0 mt-0.5',
                item.id === 'editing' && 'text-primary',
                item.id === 'suggestion' && 'text-zinc-700 dark:text-white',
                item.id === 'viewing' && 'text-zinc-400'
              )} />
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-bold leading-tight flex items-center justify-between">
                  {item.label}
                  {isActive && <Check className="w-3.5 h-3.5 text-primary ml-2" />}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </PortalPopover>
    </div>
  );
}

// ─── Fullscreen & Zoom "Make It Big" Controls ─────────────────────────────────

interface FullscreenAndZoomButtonsProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

export function FullscreenAndZoomButtons({
  isFullscreen = false,
  onToggleFullscreen,
  zoomLevel = 100,
  onZoomChange,
}: FullscreenAndZoomButtonsProps) {
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const zoomAnchorRef = React.useRef<HTMLDivElement>(null);

  const ZOOM_PRESETS = [50, 75, 100, 125, 150, 175, 200];

  const handleZoomIn = () => {
    const next = ZOOM_PRESETS.find((z) => z > zoomLevel) ?? 200;
    onZoomChange?.(next);
  };

  const handleZoomOut = () => {
    const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoomLevel) ?? 50;
    onZoomChange?.(prev);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Zoom Stepper Pill */}
      <div
        ref={zoomAnchorRef}
        className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs h-8.5"
      >
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 50}
          className="h-full px-1.5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-l-md transition-colors"
          title="Zoom out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setZoomOpen((prev) => !prev)}
          className="h-full px-2 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-1 transition-colors min-w-[50px] justify-center"
          title="Zoom preset"
        >
          <span>{zoomLevel}%</span>
          <ChevronDown className="w-3 h-3 text-zinc-600 dark:text-zinc-200" />
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 200}
          className="h-full px-1.5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-r-md transition-colors"
          title="Zoom in"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <PortalPopover
        anchorRef={zoomAnchorRef}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        align="end"
        className="w-36 p-1 flex flex-col gap-0.5"
      >
        <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400">
          Zoom Level
        </div>
        {ZOOM_PRESETS.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => {
              onZoomChange?.(z);
              setZoomOpen(false);
            }}
            className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium w-full text-left transition-colors',
              zoomLevel === z
                ? 'bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-950 dark:text-white'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
            )}
          >
            <span>{z}%</span>
            {zoomLevel === z && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        ))}
      </PortalPopover>

      {/* Fullscreen / Make Big Toggle */}
      <ToolbarButton
        active={isFullscreen}
        onClick={onToggleFullscreen}
        tooltip={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Make big / Fullscreen'}
        className={cn(
          'h-8.5 px-2.5 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs flex items-center gap-1.5',
          isFullscreen && 'bg-primary/15 text-primary border-primary/30'
        )}
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-4 h-4 text-primary shrink-0" />
            <span className="hidden sm:inline">Exit</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Full screen</span>
          </>
        )}
      </ToolbarButton>
    </div>
  );
}

// ─── FixedToolbarButtons Master Component ─────────────────────────────────────

export interface FixedToolbarButtonsProps {
  editor: any;
  mode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  comments?: EditorComment[];
  onAddComment?: (text: string, selectedText?: string) => void;
  onResolveComment?: (id: string) => void;
}

export function FixedToolbarButtons({
  editor,
  mode = 'editing',
  onModeChange,
  isFullscreen = false,
  onToggleFullscreen,
  zoomLevel = 100,
  onZoomChange,
  comments = [],
  onAddComment,
  onResolveComment,
}: FixedToolbarButtonsProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (!editor?.on) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = editor.on('change', forceUpdate);
    } catch { /* non-fatal */ }
    return () => unsub?.();
  }, [editor]);

  const isViewing = mode === 'viewing';

  // Marks state
  const isBold = isMarkActive(editor, 'bold');
  const isItalic = isMarkActive(editor, 'italic');
  const isUnderline = isMarkActive(editor, 'underline');
  const isStrikethrough = isMarkActive(editor, 'strikethrough');

  // Block state
  const activeType = getActiveBlockType(editor);
  const isTodo = activeType === 'todo';
  const isToggle = activeType === 'toggle';

  const handleOutdent = () => {
    if (isViewing) return;
    const block = getActiveBlock(editor);
    const currentIndent = Number(block?.indent) || 0;
    if (currentIndent > 0) {
      setBlockProperty(editor, 'indent', currentIndent - 1);
    }
  };

  const handleIndent = () => {
    if (isViewing) return;
    const block = getActiveBlock(editor);
    const currentIndent = Number(block?.indent) || 0;
    if (currentIndent < 10) {
      setBlockProperty(editor, 'indent', currentIndent + 1);
    }
  };

  const handleUndo = () => {
    if (isViewing) return;
    try {
      if (editor?.undo) {
        editor.undo();
      } else if (editor?.api?.undo) {
        editor.api.undo();
      } else if (editor?.tf?.undo) {
        editor.tf.undo();
      }
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
  };

  const handleRedo = () => {
    if (isViewing) return;
    try {
      if (editor?.redo) {
        editor.redo();
      } else if (editor?.api?.redo) {
        editor.api.redo();
      } else if (editor?.tf?.redo) {
        editor.tf.redo();
      }
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
  };

  const canUndo = editor?.history?.undos ? editor.history.undos.length > 0 : true;
  const canRedo = editor?.history?.redos ? editor.history.redos.length > 0 : true;

  return (
    <div className="flex w-full items-center gap-1 flex-wrap">
      {/* 0. History: Undo & Redo */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <ToolbarButton
          disabled={isViewing || !canUndo}
          onClick={handleUndo}
          tooltip="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>

        <ToolbarButton
          disabled={isViewing || !canRedo}
          onClick={handleRedo}
          tooltip="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 1. Insert (+ v), Turn Into (Heading 1 v), Font Size ([- 12 +]) */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <InsertToolbarButton editor={editor} />
        <TurnIntoToolbarButton editor={editor} />
        <FontSizeToolbarButton editor={editor} />
      </ToolbarGroup>

      {/* 2. Marks: Bold, Italic, Underline, Strikethrough, Inline Code, Text Color, Background Color */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <ToolbarButton
          active={isBold}
          onClick={() => toggleMark(editor, 'bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isItalic}
          onClick={() => toggleMark(editor, 'italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isUnderline}
          onClick={() => toggleMark(editor, 'underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isStrikethrough}
          onClick={() => toggleMark(editor, 'strikethrough')}
          tooltip="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ColorPickerDropdown
          editor={editor}
          nodeType="color"
          icon={Baseline}
          tooltip="Text Color"
        />

        <ColorPickerDropdown
          editor={editor}
          nodeType="backgroundColor"
          icon={PaintBucket}
          tooltip="Background Color"
        />
      </ToolbarGroup>

      {/* 3. Alignment, Numbered List, Bulleted List, To-do list, Toggle list */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <AlignToolbarButton editor={editor} />
        <NumberedListToolbarButton editor={editor} />
        <BulletedListToolbarButton editor={editor} />

        <ToolbarButton
          active={isTodo}
          onClick={() => setBlockType(editor, isTodo ? 'p' : 'todo')}
          tooltip="To-do checklist"
        >
          <ListTodo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isToggle}
          onClick={() => setBlockType(editor, isToggle ? 'p' : 'toggle')}
          tooltip="Toggle list"
        >
          <ListCollapse className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 4. Link, Table, Emoji */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <LinkToolbarButton editor={editor} />
        <TableToolbarButton editor={editor} />
        <EmojiToolbarButton editor={editor} />
      </ToolbarGroup>

      {/* 5. Unified Media Suite & Speech to Text */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <MediaToolbarButton editor={editor} />
        <SpeechToTextToolbarButton editor={editor} disabled={isViewing} />
      </ToolbarGroup>

      {/* 6. Line Height, Outdent, Indent */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none', '[&>div[role=separator]]:hidden')}>
        <LineHeightToolbarButton editor={editor} />

        <ToolbarButton onClick={handleOutdent} tooltip="Decrease Indent">
          <OutdentIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleIndent} tooltip="Increase Indent">
          <IndentIcon className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 7. Right-Aligned Actions (Comment, Mode, Fullscreen) touching container edge */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        <ToolbarSeparator />
        <CommentToolbarButton
          editor={editor}
          comments={comments}
          onAddComment={onAddComment}
          onResolveComment={onResolveComment}
        />
        <ToolbarSeparator />
        <ModeToolbarButton
          mode={mode}
          onModeChange={onModeChange}
        />
        <ToolbarSeparator />
        <ToolbarButton
          active={isFullscreen}
          onClick={onToggleFullscreen}
          tooltip={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-primary" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </ToolbarButton>
      </div>
    </div>
  );
}
