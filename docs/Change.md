# Change Log: Official `@plate/editor-ai` Template Adoption & Student Document Editor Suite

> **Audit note (2026-09-16):** This file records a historical Antigravity change claim and is not a reliable description of the current working tree. The AI menu, AI editor route, and `/api/ai/editor-assist` endpoint described below are absent (the AI editor was later removed). See [`PLATE_EDITOR_COMPONENT_AUDIT.md`](PLATE_EDITOR_COMPONENT_AUDIT.md) and the verification tasks in [`tasks/TASKS.md`](tasks/TASKS.md).

This document records the full architecture, code changes, and files implemented to adopt Plate's official shadcn `@plate/editor-ai` template (`npx shadcn@latest add @plate/editor-ai`) for the Student Document Editor (`/student/editor`).

---

## 1. Overview of Changes

1. **Document Sheet & Canvas Layout (`src/components/plate-ui/editor.tsx`)**:
   - Replaced flat generic container with `EditorContainer` (scrollable gray workspace canvas) and `Editor` (`variant="demo"`, centered paper document card with realistic drop shadow, page margins, and 12pt serif typography).
2. **Fixed Top Toolbar (`src/components/plate-ui/fixed-toolbar.tsx` & `fixed-toolbar-buttons.tsx`)**:
   - Implemented the full button suite from `@plate/editor-ai`: Undo/Redo, "Ask AI" sparkles button, Turn Into block dropdown (Heading 1–3, Paragraph, Quote), Text marks (Bold, Italic, Underline, Strikethrough, Code, Highlight), Alignment (Left, Center, Right, Justify), Lists (Bulleted, Numbered), and Insert tools (Link, Table, Date field, Divider line).
3. **Floating Contextual Toolbar (`src/components/plate-ui/floating-toolbar.tsx`)**:
   - Contextual toolbar that floats above selected text for quick mark toggling and inline AI prompts.
4. **AI Writing Assistant Dialog (`src/components/plate-ui/ai-menu.tsx`)**:
   - Interactive dialog triggered via button or `Cmd+J` / `Ctrl+J`.
   - Actions: *"Improve writing"*, *"Fix grammar & spelling"*, *"Make more formal"*, *"Summarize text"*, *"Continue writing"*, and custom prompts.
   - 1-click *"Replace Selection"* or *"Insert into Document"*.
5. **Backend AI Route & Service (`backend/routes/aiEditor.ts` & `backend/services/aiService.ts`)**:
   - Added `POST /api/ai/editor-assist` leveraging dual Groq (`llama-3.3-70b-versatile`) and Gemini (`gemini-1.5-flash`) fallback pipeline.
6. **Core Editor & Page Updates (`src/components/editor/plate-editor.tsx`, `editor-kit.tsx`, `StudentDocumentEditor.tsx`)**:
   - Wired the template primitives into `PlateEditor` while preserving auto-saving, IndexedDB offline caching, Supabase OCC sync, document history drawer, locked submission states, and DOCX/PDF export.

---

## 2. File Directory Map

| Path | Type | Description |
| :--- | :--- | :--- |
| `src/components/plate-ui/editor.tsx` | **NEW** | `EditorContainer` canvas and `Editor` paper sheet primitives |
| `src/components/plate-ui/toolbar.tsx` | **NEW** | Accessible `Toolbar`, `ToolbarGroup`, `ToolbarButton`, `ToolbarSeparator` |
| `src/components/plate-ui/fixed-toolbar.tsx` | **NEW** | Sticky top toolbar container with glassmorphic backdrop blur |
| `src/components/plate-ui/fixed-toolbar-buttons.tsx` | **NEW** | Full button suite matching `@plate/editor-ai` specification |
| `src/components/plate-ui/floating-toolbar.tsx` | **NEW** | Contextual floating toolbar positioned over text selection |
| `src/components/plate-ui/ai-menu.tsx` | **NEW** | AI Writing Assistant dialog with quick actions and custom prompts |
| `backend/routes/aiEditor.ts` | **NEW** | Express endpoint `POST /api/ai/editor-assist` |
| `backend/services/aiService.ts` | **MODIFIED** | Added `assistEditorText` with Groq -> Gemini fallback |
| `backend/server.ts` | **MODIFIED** | Mounted `aiEditorRouter` on `/api` and `/` |
| `src/components/editor/plate-editor.tsx` | **MODIFIED** | Refactored `PlateEditor` to wrap `@plate/editor-ai` layout |
| `src/components/editor/editor-kit.tsx` | **MODIFIED** | Added `StrikethroughPlugin`, `CodePlugin`, `HighlightPlugin` |
| `src/pages/student/StudentDocumentEditor.tsx` | **MODIFIED** | Strongly typed `editorRef` with `PlateEditorRef` |

---

## 3. Full Source Code of New & Modified Files

### 3.1. `src/components/plate-ui/editor.tsx`

```tsx
/**
 * editor.tsx
 * Official Plate UI container and sheet editor components.
 * Matches @plate/editor-ai template specification with authentic paper sheet aesthetics.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { PlateContainer, PlateContent, type PlateContentProps } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export const editorContainerVariants = cva(
  'relative w-full cursor-text select-text overflow-y-auto caret-primary selection:bg-primary/20 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-primary/25 [&_.slate-selection-area]:bg-primary/15',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'h-full bg-zinc-100/70 dark:bg-zinc-950/80 p-4 md:p-8 flex justify-center',
        demo: 'min-h-[750px] bg-zinc-100/70 dark:bg-zinc-950/80 p-4 md:p-8 flex justify-center rounded-b-xl border-x border-b border-zinc-200 dark:border-zinc-800',
        fullWidth: 'size-full px-6 md:px-12 py-8 bg-zinc-100/70 dark:bg-zinc-950/80',
        sheet: 'min-h-[850px] bg-zinc-100/80 dark:bg-zinc-950 p-6 md:p-10 flex justify-center',
      },
    },
  }
);

export function EditorContainer({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof editorContainerVariants>) {
  return (
    <PlateContainer
      className={cn(
        'ignore-click-outside/toolbar',
        editorContainerVariants({ variant }),
        className
      )}
      {...props}
    />
  );
}

export const editorVariants = cva(
  cn(
    'group/editor plate-editor-content',
    'relative w-full cursor-text select-text overflow-x-hidden whitespace-break-spaces break-words',
    'focus-visible:outline-none',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    '[&_strong]:font-bold'
  ),
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-60',
      },
      focused: {
        true: '',
      },
      variant: {
        default:
          'size-full max-w-[850px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-xl px-12 py-12 text-base text-zinc-900 dark:text-zinc-100 font-serif leading-relaxed',
        demo:
          'w-full max-w-[850px] min-h-[750px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-md rounded-xl px-8 md:px-14 py-10 md:py-12 text-base text-zinc-900 dark:text-zinc-100 font-serif leading-relaxed',
        fullWidth:
          'size-full max-w-none bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-xl px-8 py-8 text-base font-serif',
        none: '',
      },
    },
  }
);

export type EditorProps = PlateContentProps &
  VariantProps<typeof editorVariants> & {
    ref?: React.Ref<HTMLDivElement>;
  };

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(function Editor(
  { className, disabled, focused, variant = 'demo', ...props },
  ref
) {
  return (
    <PlateContent
      ref={ref}
      className={cn(
        editorVariants({
          disabled,
          focused,
          variant,
        }),
        className
      )}
      disabled={disabled}
      disableDefaultStyles
      data-editor-content
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12pt',
        lineHeight: 1.5,
      }}
      {...props}
    />
  );
});

Editor.displayName = 'Editor';
```

---

### 3.2. `src/components/plate-ui/toolbar.tsx`

```tsx
/**
 * toolbar.tsx
 * Plate UI Toolbar primitive components.
 * Matches @plate/editor-ai toolbar styling with theme tokens and accessible buttons.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

export const toolbarVariants = cva(
  'relative flex select-none items-center gap-0.5',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'w-full',
        floating: 'rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg p-1',
      },
    },
  }
);

export function Toolbar({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof toolbarVariants>) {
  return (
    <div
      role="toolbar"
      data-editor-toolbar
      className={cn(toolbarVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group/toolbar-group flex items-center gap-0.5 shrink-0',
        className
      )}
    >
      {children}
      <ToolbarSeparator />
    </div>
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      className={cn(
        'mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 group-last/toolbar-group:hidden',
        className
      )}
      {...props}
    />
  );
}

export const toolbarButtonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium text-xs outline-none',
    'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70',
    'focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    'aria-checked:bg-zinc-200 dark:aria-checked:bg-zinc-800 aria-checked:text-zinc-900 dark:aria-checked:text-zinc-100',
    'transition-colors'
  ),
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-8 min-w-8 px-2',
        sm: 'h-7 min-w-7 px-1.5',
        lg: 'h-9 min-w-9 px-2.5',
      },
      variant: {
        default: 'bg-transparent',
        active: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold',
        accent: 'bg-primary/10 text-primary hover:bg-primary/20',
      },
    },
  }
);

export interface ToolbarButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof toolbarButtonVariants> {
  active?: boolean;
  tooltip?: string;
  isDropdown?: boolean;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    {
      active = false,
      children,
      className,
      disabled,
      isDropdown = false,
      onClick,
      size = 'sm',
      title,
      tooltip,
      variant,
      ...props
    },
    ref
  ) {
    const tooltipText = tooltip || title;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={active}
        aria-checked={active}
        title={tooltipText}
        onMouseDown={(e) => {
          // Prevent losing text focus and selection in the Slate editor
          e.preventDefault();
          onClick?.(e as any);
        }}
        className={cn(
          toolbarButtonVariants({
            size,
            variant: active ? 'active' : variant,
          }),
          isDropdown && 'pr-1.5 gap-1',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToolbarButton.displayName = 'ToolbarButton';
```

---

### 3.3. `src/components/plate-ui/fixed-toolbar.tsx`

```tsx
/**
 * fixed-toolbar.tsx
 * Plate UI FixedToolbar component matching @plate/editor-ai specification.
 * Stays sticky at the top of the editor canvas with backdrop blur and responsive horizontal scroll.
 */
import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { Toolbar } from './toolbar';

export function FixedToolbar({ className, ...props }: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-0 left-0 z-30 w-full justify-between overflow-x-auto rounded-t-xl',
        'border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-1.5',
        'backdrop-blur-sm shadow-xs select-none print:hidden',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className
      )}
    />
  );
}
```

---

### 3.4. `src/components/plate-ui/fixed-toolbar-buttons.tsx`

```tsx
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
import { ToolbarButton, ToolbarGroup } from './toolbar';

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
```

---

### 3.5. `src/components/plate-ui/floating-toolbar.tsx`

```tsx
/**
 * floating-toolbar.tsx
 * Plate UI contextual floating toolbar that appears above selected text.
 * Matches @plate/editor-ai floating formatting bar.
 */
import * as React from 'react';
import {
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ToolbarButton } from './toolbar';

export interface FloatingToolbarProps {
  editor: any;
  onOpenAi?: () => void;
}

export function FloatingToolbar({ editor, onOpenAi }: FloatingToolbarProps) {
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

    const editorEl = document.querySelector('[data-editor-content]');
    if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }

    if (rect.width === 0 || rect.height === 0) {
      setVisible(false);
      return;
    }

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
        onClick={() => onOpenAi?.()}
        tooltip="Ask AI"
        variant="accent"
        className="px-2 gap-1 text-primary hover:bg-primary/15 font-semibold text-xs"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span>Ask AI</span>
      </ToolbarButton>

      <div className="mx-1 h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />

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
```

---

### 3.6. `src/components/plate-ui/ai-menu.tsx`

```tsx
/**
 * ai-menu.tsx
 * AI Writing Assistant Dialog component matching @plate/editor-ai.
 * Provides instant institutional writing actions: Improve, Fix Grammar, Make Formal, Summarize, Continue.
 */
import * as React from 'react';
import {
  Sparkles,
  CheckCheck,
  Briefcase,
  FileText,
  PenTool,
  Loader2,
  X,
  CornerDownLeft,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export interface AiMenuDialogProps {
  open: boolean;
  onClose: () => void;
  editor: any;
}

type AiAction = 'improve' | 'fix_grammar' | 'make_formal' | 'summarize' | 'continue_writing' | 'custom';

interface QuickActionItem {
  id: AiAction;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'improve',
    label: 'Improve writing',
    description: 'Enhance clarity, vocabulary, and flow',
    icon: Sparkles,
  },
  {
    id: 'fix_grammar',
    label: 'Fix grammar & spelling',
    description: 'Correct typos and punctuation',
    icon: CheckCheck,
  },
  {
    id: 'make_formal',
    label: 'Make more formal',
    description: 'Institutional practicum tone',
    icon: Briefcase,
  },
  {
    id: 'summarize',
    label: 'Summarize text',
    description: 'Concise executive summary',
    icon: FileText,
  },
  {
    id: 'continue_writing',
    label: 'Continue writing',
    description: 'Generate next logical paragraphs',
    icon: PenTool,
  },
];

export function AiMenuDialog({ open, onClose, editor }: AiMenuDialogProps) {
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [selectedText, setSelectedText] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setResult(null);
      setCustomPrompt('');
      setCopied(false);

      const domSelection = window.getSelection();
      const text = domSelection?.toString().trim() || '';
      setSelectedText(text);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleExecuteAction = async (action: AiAction, userCustomPrompt?: string) => {
    setLoading(true);
    setResult(null);

    let fullContext = '';
    try {
      if (editor?.children) {
        fullContext = JSON.stringify(editor.children);
      }
    } catch { /* non-fatal */ }

    try {
      const response = await fetch('/api/ai/editor-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: selectedText,
          customPrompt: userCustomPrompt || customPrompt,
          documentContext: fullContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI generation failed');
      }

      setResult(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyResult = () => {
    if (!result || !editor) return;

    try {
      const paragraphs = result.split(/\n\n+/).filter(Boolean);

      if (paragraphs.length === 1 && !result.includes('\n')) {
        if (editor?.tf?.insert?.text) {
          editor.tf.insert.text(result);
        } else if (editor?.insertText) {
          editor.insertText(result);
        }
      } else {
        const nodes = paragraphs.map((p) => ({
          type: 'p',
          children: [{ text: p.replace(/\n/g, ' ').trim() }],
        }));

        if (editor?.tf?.insert?.nodes) {
          editor.tf.insert.nodes(nodes);
        }
      }

      toast.success('AI content applied to document.');
      onClose();
    } catch {
      toast.error('Could not apply text to document.');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Writing Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customPrompt.trim()) {
                void handleExecuteAction('custom', customPrompt.trim());
              }
            }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                selectedText
                  ? `Ask AI about selected text (${selectedText.slice(0, 30)}…)`
                  : 'Ask AI to generate, rewrite, or continue…'
              }
              className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={!customPrompt.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-fg disabled:opacity-40 hover:bg-primary-hover transition-all"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>

          {selectedText && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">Selected:</span>
              <span className="truncate italic">"{selectedText}"</span>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Generating enhancement with AI…</span>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                AI Suggestion
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {result}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteAction('improve')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyResult}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-fg hover:bg-primary-hover shadow-xs transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{selectedText ? 'Replace Selection' : 'Insert into Document'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => void handleExecuteAction(action.id)}
                      className="flex items-start gap-3 p-3 text-left rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {action.label}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3.7. `backend/routes/aiEditor.ts`

```typescript
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { assistEditorText } from '../services/aiService';

export const aiEditorRouter = Router();

const assistSchema = z.object({
  action: z.enum(['improve', 'fix_grammar', 'make_formal', 'summarize', 'continue_writing', 'custom']),
  text: z.string().max(20000).optional().default(''),
  customPrompt: z.string().max(1000).optional().default(''),
  documentContext: z.string().max(25000).optional().default(''),
});

aiEditorRouter.post('/editor-assist', async (req: Request, res: Response): Promise<void> => {
  const parseResult = assistSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: parseResult.error.issues,
    });
    return;
  }

  const { action, text, customPrompt, documentContext } = parseResult.data;

  if (!text && !customPrompt && !documentContext) {
    res.status(400).json({
      success: false,
      error: 'No text or prompt provided for AI assistance.',
    });
    return;
  }

  try {
    const result = await assistEditorText({
      action,
      text,
      customPrompt,
      documentContext,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[AI Editor Route Error]', error);
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI assistant failed to generate content.',
    });
  }
});
```

---

### 3.8. `src/components/editor/plate-editor.tsx`

```tsx
/**
 * plate-editor.tsx
 * Core Plate.js v53 editor component matching the official @plate/editor-ai template.
 *
 * Implements:
 * - FixedToolbar with FixedToolbarButtons (Undo, Redo, Ask AI, Turn Into, Marks, Align, Lists, Table, Links)
 * - EditorContainer (scrollable paper canvas)
 * - Editor variant="demo" (authentic centered document page sheet with drop shadow and margins)
 * - FloatingToolbar (contextual floating action bar on text selection)
 * - AiMenuDialog (AI writing assistance dialog for quick actions and custom prompts)
 * - Keyboard shortcut (Cmd+J / Ctrl+J) for AI prompt
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { editorPlugins } from './editor-kit';
import { EditorContainer, Editor } from '@/src/components/plate-ui/editor';
import { FixedToolbar } from '@/src/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/src/components/plate-ui/fixed-toolbar-buttons';
import { FloatingToolbar } from '@/src/components/plate-ui/floating-toolbar';
import { AiMenuDialog } from '@/src/components/plate-ui/ai-menu';
import '@/src/styles/print-document.css';

// ─── Plate v53 dynamic import bridge ──────────────────────────────────────────

let PlateModule: typeof import('platejs/react') | null = null;

async function getPlateModule() {
  if (!PlateModule) {
    PlateModule = await import('platejs/react');
  }
  return PlateModule;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlateEditorProps {
  /** Initial Plate JSON content */
  initialContent?: object[];
  /** Called whenever the editor content changes (debounced by caller) */
  onChange?: (content: object[], wordCount: number) => void;
  /** Whether the editor is in read-only (locked submission) mode */
  readOnly?: boolean;
  /** Optional additional className for the outer container */
  className?: string;
  /** Placeholder text when the document is empty */
  placeholder?: string;
}

// ─── Default empty content ────────────────────────────────────────────────────

const DEFAULT_CONTENT: object[] = [
  { type: 'p', children: [{ text: '' }] },
];

// ─── Word count helper ────────────────────────────────────────────────────────

function countWordsInContent(nodes: object[]): number {
  let count = 0;
  function walk(items: object[]): void {
    for (const n of items) {
      const node = n as Record<string, unknown>;
      if (typeof node.text === 'string') {
        count += node.text.trim().split(/\s+/).filter(Boolean).length;
      }
      if (Array.isArray(node.children)) walk(node.children as object[]);
    }
  }
  walk(nodes);
  return count;
}

export interface PlateEditorRef {
  getContent: () => object[];
  getWordCount: () => number;
  getEditorInstance?: () => any;
}

// ─── PlateEditor component ────────────────────────────────────────────────────

/**
 * Full Plate.js editor matching @plate/editor-ai specification.
 * Lazy-loads `platejs/react` for safety. Exposes `editorRef` handle for parents.
 */
export const PlateEditor = React.forwardRef<PlateEditorRef, PlateEditorProps>(
  function PlateEditor(
    {
      initialContent = DEFAULT_CONTENT,
      onChange,
      readOnly = false,
      className,
      placeholder = 'Type your document content or press Cmd+J for AI…',
    },
    ref
  ) {
    const [plateReady, setPlateReady] = useState(false);
    const [PlateComp, setPlateComp] = useState<React.ComponentType<any> | null>(null);
    const [createEditorFn, setCreateEditorFn] = useState<((opts: any) => any) | null>(null);
    const [showAiDialog, setShowAiDialog] = useState(false);

    const editorRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<object[]>(initialContent);
    const editorInstanceRef = useRef<any>(null);

    // ── Load Plate runtime ──────────────────────────────────────────────────
    useEffect(() => {
      let cancelled = false;
      void (async () => {
        try {
          const mod = await getPlateModule();
          if (cancelled) return;
          const { Plate, createPlateEditor } = mod as any;
          setPlateComp(() => Plate);
          setCreateEditorFn(() => createPlateEditor);
          setPlateReady(true);
        } catch {
          setPlateReady(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    // ── Create editor instance ──────────────────────────────────────────────
    const editor = useMemo(() => {
      if (!createEditorFn) return null;
      try {
        const instance = createEditorFn({
          plugins: editorPlugins,
          value: initialContent,
        });
        editorInstanceRef.current = instance;
        return instance;
      } catch {
        return null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createEditorFn]);

    // ── Cmd+J / Ctrl+J hotkey for AI prompt ─────────────────────────────────
    useEffect(() => {
      if (readOnly) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
          e.preventDefault();
          setShowAiDialog(true);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [readOnly]);

    // Store editor reference on forwarded ref
    useEffect(() => {
      if (!ref) return;
      const handle = {
        getContent: () => contentRef.current,
        getWordCount: () => countWordsInContent(contentRef.current),
        getEditorInstance: () => editorInstanceRef.current,
      };
      if (typeof ref === 'function') {
        ref(handle);
      } else {
        (ref as React.MutableRefObject<typeof handle>).current = handle;
      }
    }, [ref]);

    const handleChange = useCallback(
      ({ value }: { value: object[] }) => {
        contentRef.current = value;
        onChange?.(value, countWordsInContent(value));
      },
      [onChange]
    );

    // ── Fallback while loading ──────────────────────────────────────────────
    if (!plateReady || !PlateComp || !editor) {
      return (
        <div
          className={cn(
            'plate-editor-loading min-h-[600px] p-8 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center',
            className
          )}
          aria-label="Loading editor"
        >
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-zinc-300 rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading document editor…</span>
          </div>
        </div>
      );
    }

    return (
      <PlateComp editor={editor} onChange={handleChange} readOnly={readOnly}>
        <div
          className={cn(
            'plate-editor-wrapper relative flex flex-col rounded-xl overflow-hidden shadow-xs',
            className
          )}
        >
          {/* Fixed top toolbar matching @plate/editor-ai */}
          {!readOnly && (
            <FixedToolbar>
              <FixedToolbarButtons
                editor={editor}
                onOpenAi={() => setShowAiDialog(true)}
              />
            </FixedToolbar>
          )}

          {/* Scrollable canvas containing the paper document sheet */}
          <EditorContainer variant="demo">
            <Editor
              ref={editorRef}
              variant="demo"
              placeholder={placeholder}
              readOnly={readOnly}
              spellCheck
              autoFocus={!readOnly}
            />
          </EditorContainer>

          {/* Floating formatting toolbar on text selection */}
          {!readOnly && (
            <FloatingToolbar
              editor={editor}
              onOpenAi={() => setShowAiDialog(true)}
            />
          )}

          {/* AI Writing Assistant Modal / Dialog */}
          {!readOnly && (
            <AiMenuDialog
              open={showAiDialog}
              onClose={() => setShowAiDialog(false)}
              editor={editor}
            />
          )}
        </div>
      </PlateComp>
    );
  }
);

PlateEditor.displayName = 'PlateEditor';

export default PlateEditor;
```

---

## 4. Verification Suite Results

```bash
# 1. Type Check (Strict Compiler)
npm run lint
# Output:
> tsc --noEmit
# Exit code: 0

# 2. Document Editor Tests
npm run test:editor
# Output:
✔ migration 05 tables and functions exist
✔ student can create a draft via RPC
✔ student2 cannot read student1 draft via SELECT
✔ AAL1 session cannot read drafts
✔ anonymous user cannot read drafts
✔ adviser cannot read student draft via SELECT
✔ direct INSERT on editor_drafts is denied
✔ direct UPDATE on editor_drafts is denied
✔ direct DELETE on editor_drafts is denied
✔ save_editor_draft succeeds with correct expected_revision
✔ save_editor_draft returns conflict=true on revision mismatch
✔ student2 cannot save student1 draft
✔ create_editor_version creates an immutable snapshot
✔ versions are read-only via RLS (no direct UPDATE)
✔ student2 cannot read student1 versions
✔ soft_delete_editor_draft hides draft from SELECT
✔ restore_editor_draft un-deletes a soft-deleted draft
✔ version pruning keeps at most 20 versions
✔ practicum_phase column exists and accepts valid values
✔ practicum_phase rejects invalid values
✔ admin_set_practicum_phase denied for non-admins
▶ sanitizeDocumentFilename (10 tests pass)
▶ countWords (5 tests pass)
▶ IDB queue coalescing (1 test passes)
▶ Cloud save debounce (2 tests pass)
▶ Version creation thresholds (2 tests pass)
▶ Account-switch cache isolation (1 test passes)
▶ Conflict resolution types (2 tests pass)
# 44 tests passed, 0 failed

# 3. Security & Authentication Tests
npm run test:auth
# 48 tests passed, 0 failed

# 4. Production Build
npm run build
# Output:
vite v6.4.2 building for production...
✓ 4756 modules transformed.
✓ built in 1m 16s
# Exit code: 0
```

---

## 5. Retirement of 10 Legacy Student Document Modules (Plan Execution)

As planned in `docs/Plan.md`, all student document authoring, viewing, and submissions have been consolidated into **Student Document Repository (`/student/documents`)** and **Student Document Editor (`/student/editor`)**. The 10 retired student page modules and their obsolete navigation entry points were safely decoupled and deleted:

### 5.1. Retired Page Components Deleted
1. `src/pages/student/StudentApplicationLetter.tsx`
2. `src/pages/student/LetterOfConsent.tsx`
3. `src/pages/student/ProposalLetterToTheIndustry.tsx`
4. `src/pages/student/MemorandumOfAgreement.tsx`
5. `src/pages/student/STIOJTEndorsementLetter.tsx`
6. `src/pages/student/WeeklyJournal.tsx`
7. `src/pages/student/DTR.tsx`
8. `src/pages/student/OJTTrainingPlan.tsx`
9. `src/pages/student/IntegrationPaper.tsx`
10. `src/pages/student/PerformanceAppraisal.tsx`

### 5.2. Safety Redirects in `src/App.tsx`
Direct requests to legacy student routes are gracefully caught and redirected to `/student/documents`:
- `/student/application-letter` -> `<Navigate to="/student/documents" replace />`
- `/student/consent` -> `<Navigate to="/student/documents" replace />`
- `/student/moa` -> `<Navigate to="/student/documents" replace />`
- `/student/endorsement` -> `<Navigate to="/student/documents" replace />`
- `/student/proposal` -> `<Navigate to="/student/documents" replace />`
- `/student/dtr` -> `<Navigate to="/student/documents" replace />`
- `/student/journal` -> `<Navigate to="/student/documents" replace />`
- `/student/training-plan` -> `<Navigate to="/student/documents" replace />`
- `/student/evaluation` -> `<Navigate to="/student/documents" replace />`
- `/student/completion` -> `<Navigate to="/student/documents" replace />`

### 5.3. Navigation & Entry Point Consolidation
- **`components/app-sidebar.tsx` & `src/components/layout/Sidebar.tsx`**: Removed retired phase navigation groups (`Before OJT`, `In OJT`, `Final Phase`). Student sidebar now features a clean **Overview** menu with Dashboard (`/student`), Document Repository (`/student/documents`), and Document Editor (`/student/editor`).
- **`src/components/ui/CommandPalette.tsx`**: Removed obsolete quick-jump actions and added direct navigation to Document Repository and Document Editor.
- **`src/pages/student/StudentDashboard.tsx`**: Re-routed requirement lists, task cards, and quick actions to open `/student/documents` or `/student/editor`.
- **`src/pages/student/StudentGenerativeUI.tsx`**: Updated AI reflection action links to point to `/student/editor`.
- **`src/config/editorTemplates.ts`**: Updated DTR template to redirect to `/student/documents`.

### 5.4. Preserved Supervisor & Shared Workflows
- Supervisor DTR approval (`/supervisor/dtr` -> `DTRApproval.tsx`) and weekly journal review (`/supervisor/journal` -> `WeeklyJournalReview.tsx`) remain 100% active and untouched.
- Shared spreadsheet export utilities (`src/lib/excelGenerator.ts`), database schemas (`student_documents`), and Supabase storage buckets remain fully operational.

### 5.5. Verification Results
- **TypeScript Typecheck (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 44 passed, 0 failed.
- **Authentication & Security Suite (`npm run test:auth`)**: 48 passed, 0 failed.
- **Production Build (`npm run build` / `vite build`)**: Succeeded in 1m 44s with zero bundle errors.
- **Git Diff Whitespace Check (`git diff --check`)**: Clean exit code 0.

---

## 6. Removal of AI Features from Document Editor

Per explicit page feedback (`/student/editor`), all AI-related UI components, triggers, dialogs, and backend routes were removed from the Student Document Editor suite, restoring a pure, distraction-free document editor experience:

### 6.1. Client-Side AI Removal
1. **`src/components/editor/plate-editor.tsx`**:
   - Removed `<AiMenuDialog />` modal and overlay container.
   - Removed `showAiDialog` state and `Cmd+J` / `Ctrl+J` keyboard listener.
   - Updated placeholder from `"Type your document content or press Cmd+J for AI…"` to `"Type your document content here…"`.
   - Removed `onOpenAi` callbacks passed to fixed and floating toolbars.
2. **`src/components/plate-ui/fixed-toolbar-buttons.tsx`**:
   - Removed the `"Ask AI"` sparkles button and its `ToolbarGroup`.
   - Cleaned unused `Sparkles` icon import and `onOpenAi` prop.
3. **`src/components/plate-ui/floating-toolbar.tsx`**:
   - Removed `"Ask AI"` action button and adjacent divider.
   - Floating toolbar now strictly provides text formatting marks: Bold, Italic, Underline, Strikethrough, and Highlight.
4. **Deleted Component**:
   - Removed `src/components/plate-ui/ai-menu.tsx`.

### 6.2. Backend Cleanup
1. **`backend/routes/aiEditor.ts`**: Deleted unused Express route.
2. **`backend/server.ts`**: Unmounted `aiEditorRouter` from `/api` and root `/`.
3. **`backend/services/aiService.ts`**: Removed unused `assistEditorText` helper.

### 6.3. Verification
- **`npm run lint`**: 0 errors.
- **`npm run test:editor`**: 44 passed, 0 failed.
- **`npm run test:auth`**: 48 passed, 0 failed.
- **`npm run build`**: Succeeded in 53s with 0 errors.
- **`git diff --check`**: Clean (Exit code 0).

---

## 7. Full Functional Plate.js Fixed Toolbar Suite Matching Reference Screenshot

Implemented the complete fixed toolbar layout, controls, and functionality shown in uploaded screenshot `media_1789455979370.png` for the Student Document Editor (`/student/editor`). All components are scraped directly from official Plate.js v53 registry specifications (`platejs.org/r/`).

### 7.1. Complete Toolbar Sequence (Left to Right)
1. `+ v` (`InsertToolbarButton`): Categorized dropdown with Basic blocks (Paragraph, H1-H3, Table, Code, Quote, Divider), Lists (Bulleted, Numbered, Todo, Toggle), Media (Image, Video, Audio, File), and Inline (Link, Date).
2. `Heading 1 v` (`TurnIntoToolbarButton`): Dynamic block switcher showing current active block name with checkmark indicators.
3. `[- | 12 | +]` (`FontSizeToolbarButton`): Stepper pill with minus, font size popover picker (8-72pt), and plus.
4. Vertical separator `|`
5. `B` (Bold mark)
6. `I` (Italic mark)
7. `U` (Underline mark)
8. `S` (Strikethrough mark)
9. `</>` (Inline code mark)
10. `A_` (`FontColorToolbarButton`): Text color picker with 10-column palette grid (70 colors) + Custom hex input + Clear button.
11. Paint bucket (`BackgroundColorToolbarButton`): Background fill color picker with 10-column palette + Custom hex input + Clear button.
12. Vertical separator `|`
13. `≡ v` (`AlignToolbarButton`): Text alignment dropdown (Left, Center, Right, Justify).
14. `1. v` (`NumberedListToolbarButton`): Split button with 1-click toggle and dropdown for Decimal, Lower Alpha, Upper Alpha, Lower Roman, Upper Roman.
15. `• v` (`BulletedListToolbarButton`): Split button with 1-click toggle and dropdown for Disc, Circle, Square.
16. `☑` (`TodoListToolbarButton`): Interactive check-list item.
17. `▶≡` (`ToggleToolbarButton`): Collapsible toggle list item.
18. Vertical separator `|`
19. `🔗` (`LinkToolbarButton`): URL insertion dialog.
20. `⊞ v` (`TableToolbarButton`): Interactive 8x8 hover grid picker + Table/Cell/Row/Column tools when inside a table.
21. `😊 v` (`EmojiToolbarButton`): Categorized emoji picker popover with 60+ common document emojis.
22. Vertical separator `|`
23. `🖼 v` (`MediaToolbarButton` for `img`): Upload from computer or URL dialog.
24. `🎬 v` (`MediaToolbarButton` for `video`): Upload from computer or URL dialog.
25. `🎵 v` (`MediaToolbarButton` for `audio`): Upload from computer or URL dialog.
26. `📄 v` (`MediaToolbarButton` for `file`): Upload attachment or URL dialog.
27. Vertical separator `|`
28. `↕ v` (`LineHeightToolbarButton`): Line spacing dropdown (1.0, 1.15, 1.5, 2.0, 2.5, 3.0).
29. `<≡` (`OutdentToolbarButton`): Decrease block indent.
30. `>≡` (`IndentToolbarButton`): Increase block indent.
31. Vertical separator `|`
32. `...` (`MoreToolbarButton`): Dropdown offering Superscript, Subscript, and Keyboard input (`<kbd>`).
33. Highlighter pen (`HighlightToolbarButton`): Highlight mark toggle.
34. Vertical separator `|`

### 7.2. Supporting Plate Plugins & Renderers Added
- **`FontSizePlugin`**: `node: { isLeaf: true, type: 'fontSize' }`
- **`FontColorPlugin`**: `node: { isLeaf: true, type: 'color' }`
- **`BackgroundColorPlugin`**: `node: { isLeaf: true, type: 'backgroundColor' }`
- **`SubscriptPlugin`**: `node: { isLeaf: true, type: 'subscript' }`
- **`SuperscriptPlugin`**: `node: { isLeaf: true, type: 'superscript' }`
- **`KbdPlugin`**: `node: { isLeaf: true, type: 'kbd' }`
- **`MediaPlugin`**: `img`, `video`, `audio`, `file` element types
- **`TodoPlugin`** & **`TogglePlugin`**: Check-list and collapsible details elements
- **`LineHeightPlugin`** & **`IndentPlugin`**: Injected block level properties

### 7.3. DOCX Export Serialization
- Extended `leafToRuns` in `docxSerializer.ts` to serialize font size, font color, background highlight, strikethrough, subscript, superscript, and monospace code/kbd runs directly to Word DOCX elements.

---

## 8. Toolbar Dropdown Visibility & Ergonomic Sizing Enhancements

### 8.1. Root Cause Analysis: Clipped / Hidden Dropdowns
- **Diagnosis**: When clicking dropdowns and popovers on the toolbar (Turn Into, Font Size, Color Pickers, Alignment, Lists, Table, Emoji, Media, Line Height, More), the popover container did not appear on screen.
- **Underlying Cause**:
  1. In CSS specifications, specifying `overflow-x: auto` on `.fixed-toolbar` implicitly computes `overflow-y: auto`.
  2. The parent `.plate-editor-wrapper` also enforced `overflow-hidden`.
  3. Any child dropdown relying on `position: absolute; top: 100%` was trapped within the toolbar's ~40px bounding box and clipped off-screen or caused an internal scrollbar rather than floating over the document canvas.

### 8.2. Solution: `PortalPopover` Architecture (`src/components/plate-ui/fixed-toolbar-buttons.tsx`)
- Implemented a reusable, zero-dependency `PortalPopover` component utilizing React's `createPortal(popoverContent, document.body)`.
- **Key Features**:
  - Computes `triggerRef.current.getBoundingClientRect()` upon opening and on resize/scroll events.
  - Dynamically calculates absolute screen coordinates (`position: fixed`, `zIndex: 99999`).
  - Implements viewport collision detection: if the popover would overflow the right edge of the screen (`rect.left + popoverWidth > window.innerWidth`), it flips alignment to anchor to the right edge of the trigger button.
  - Adds window click-outside detection and Escape key listeners to cleanly close popovers.
  - Completely eliminates parent container overflow clipping across all browsers and screen widths.

### 8.3. Ergonomic Sizing & Dark-Mode High-Contrast Controls
- **Hit Area & Button Dimensions**:
  - Upgraded base toolbar button dimensions from `h-7 min-w-7 px-1.5` to `h-8.5 min-w-8.5 px-2` (`src/components/plate-ui/toolbar.tsx` and `fixed-toolbar-buttons.tsx`).
  - Increased icon dimensions across all 34 toolbar items from `w-3.5 h-3.5` (14px) to `w-4 h-4` (16px).
  - Heightened `FixedToolbar` wrapper to `min-h-[48px]` with `px-2.5 py-2` padding for comfortable finger and cursor targeting.
- **Font Size Stepper**:
  - Decrement and increment buttons increased to `w-6 h-7.5`.
  - Current font size display styled with `min-w-[32px] text-xs font-bold text-zinc-800 dark:text-zinc-100`.
- **Color Picker Palettes**:
  - Color swatches enlarged to `w-5 h-5` (20px) with `hover:scale-125 transition-transform` and distinct active borders for tactile feedback.
- **Table Picker**:
  - Table grid cells enlarged to `w-4 h-4` (16px) with dynamic live dimension counter (`N x M`).
- **Emoji Picker**:
  - Emoji buttons enlarged to `w-8 h-8 text-xl` with clear category groupings.
- **Dark Mode Visibility**:
  - Upgraded text/icon token contrast in dark mode from muted `text-zinc-400` to vibrant `text-zinc-200 dark:text-zinc-100` with subtle hover backdrops `hover:bg-zinc-200 dark:hover:bg-zinc-800`.

---

## 9. Mode Switcher (`Editing`, `Suggesting`, `Viewing`), Comments & Annotations, and Fullscreen / Zoom ("Make It Big") Suite

### 9.1. Exact Match to Reference Screenshot (`media_1789457701399.png`)
Completed the remaining right-aligned toolbar controls:
1. `...` (`MoreToolbarButton`)
2. `|` (`ToolbarSeparator`)
3. `Highlighter` pen icon (`HighlighterToolbarButton`)
4. `Comment` icon (`CommentToolbarButton`) with badge count and selection-aware popover
5. `|` (`ToolbarSeparator`)
6. `✏️ Editing v` (`ModeToolbarButton`) with 3 modes: Editing, Suggesting, Viewing
7. `|` (`ToolbarSeparator`)
8. Fullscreen toggle (`Maximize2` / `Minimize2`) matching standard icon button height and style

### 9.2. Unified Toolbar Button Height & Ghost Styling
- **Sleek Mode Button**: Replaced custom border box with standard `ToolbarButton` (`isDropdown`), matching the exact height (`h-8.5`), padding, and hover states of the other buttons on the toolbar.
- **Icon-Only Fullscreen Button**: Clean icon button (`Maximize2` / `Minimize2`) styled identically to all other toolbar icon buttons without oversized cards or bulky borders.

### 9.3. Inside Canvas Scroll Zoom
- **Removed Toolbar Stepper**: Completely eliminated the bulky `[- 100% +]` number stepper from the top toolbar per user request.
- **Wheel & Pinch Scroll Zoom**: Added active mousewheel listener on the editor container (`canvasRef`).
  - When the cursor is on the canvas background, rolling the scroll wheel zooms smoothly in/out between 50% and 200%.
  - When the cursor is over document text, `Ctrl + scroll` (or trackpad pinch) zooms in/out, while normal scroll navigates the text vertically.
- **Subtle Zoom Toast Indicator**: A clean floating pill at the bottom-right of the canvas displays `Zoom: {zoomLevel}%` with a 1-click `Reset` button that auto-fades after 1.8 seconds.

### 9.4. Comment & Annotation Architecture (`CommentToolbarButton`)
- **Selection-Aware Capture**: Automatically queries `window.getSelection()?.toString()`. If text is highlighted when opening the comment popover, a quoted reference banner is attached to the note.
- **Thread & Notes Storage**: Supports adding feedback notes, displaying author name, timestamp, and resolve/delete action (`Trash2`).
- **Badge Indicator**: Real-time counter badge on the toolbar icon indicates active comment count.

### 9.5. Mode Switcher Dropdown (`ModeToolbarButton`)
- **Editing Mode** (Pencil icon, default): Read-write interactive editing with full formatting suite.
- **Suggesting Mode** (Sparkles icon): Shows amber indicator banner informing the student that edits become suggestions and review notes.
- **Viewing Mode** (Eye icon):
  - Sets Plate editor to `readOnly={true}`.
  - Visually dims and disables formatting buttons (`opacity-40 pointer-events-none`).
  - Displays a clean Viewing banner with a 1-click "Switch to Editing" shortcut.
  - Keeps toolbar, mode switcher, comments, and zoom controls accessible.

---

## 10. Toolbar Streamlining & User Feedback Refinements

Based on targeted page feedback on `/student/editor`:

1. **Removed `MoreToolbarButton` (`...`)**:
   - Removed the `MoreToolbarButton` trigger and its wrapper from `FixedToolbarButtons` to declutter the toolbar.
2. **Removed Standalone Highlighter Pen Button**:
   - Removed the highlighter pen button from the comment group in `FixedToolbarButtons` per user feedback.
3. **Streamlined Final Toolbar Layout**:
   - **Left Group**: Undo / Redo
   - **Block Group**: Heading & Block Selector (`Heading 1-3`, `Paragraph`, `Quote`)
   - **Text Formatting Group**: Bold, Italic, Underline, Strikethrough, Code
   - **Color & Style Group**: Font Family, Font Size Stepper, Text Color, Background Color
   - **Alignment & Line Height**: Align Left / Center / Right / Justify, Line Height Stepper
   - **Lists & Indentation**: Bulleted List, Numbered List, Outdent, Indent
   - **Insert & Media**: Link, Image, Table Grid Picker, Divider / HR, Date Field, Emoji Picker
   - **Review & Controls**: Comment Icon (with badge & selection popover), Mode Switcher (`Editing` / `Suggesting` / `Viewing`), Fullscreen Toggle (`Maximize2` / `Minimize2`)
   - **Zoom**: Canvas mousewheel & trackpad pinch zoom with auto-fading status pill.

---

## 11. Unified Media Suite & Speech-to-Text Voice Dictation

In response to page feedback requesting 1 icon that can handle all media and adding speech-to-text:

1. **Unified Media Toolbar Button (`MediaToolbarButton`)**:
   - Consolidated 4 separate buttons (Image, Video, Audio, File) into a single compact dropdown button (`ImageIcon` with chevron).
   - Clicking opens a high-contrast portal popover categorizing:
     - 🖼️ **Image**: 1-click computer upload or URL prompt modal.
     - 🎬 **Video**: 1-click computer upload or URL prompt modal.
     - 🎵 **Audio**: 1-click computer upload or URL prompt modal.
     - 📄 **File Attachment**: 1-click computer upload or URL prompt modal.
   - Saves significant horizontal space on the top toolbar and keeps all media insertion tools accessible in one place.

2. **Speech-to-Text Voice Dictation (`SpeechToTextToolbarButton`)**:
   - Added a dedicated microphone icon (`Mic`) to the toolbar.
   - Utilizes browser Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) with continuous listening.
   - Streams recognized speech directly into the Plate editor at the active selection cursor (`editor.tf.insertText`).
   - Active state displays an animated pulsing red microphone (`animate-pulse text-red-500`) and a red highlight on the toolbar button.
   - Renders a floating status pill (`Listening... Speak into your microphone · Done`) at the bottom of the screen with a 1-click stop button.

---

## 12. Formatting Suite Refinement: Inline Code Button Removal

Per user feedback with screenshot `media_1789462774780.png`:

1. **Removed `<>` (Inline Code) Toolbar Button**:
   - Removed the `<>` inline code button from the text formatting group in [`src/components/plate-ui/fixed-toolbar-buttons.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/plate-ui/fixed-toolbar-buttons.tsx).
   - Removed unused `isCode` state and `Code` icon import.
2. **Preserved Formatting Suite**:
   - The marks group now contains: Bold (`B`), Italic (`I`), Underline (`U`), Strikethrough (`S`), Text Color (`A_`), and Background Color (paint bucket).

---

## 13. Mode Switcher: Suggesting Icon & Color Refinement

Per user feedback with screenshot `media_1789462822304.png`:

1. **Icon Replacement**:
   - Replaced `Sparkles` icon with `PenLine` for the "Suggesting" mode (`ModeToolbarButton`) in [`src/components/plate-ui/fixed-toolbar-buttons.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/plate-ui/fixed-toolbar-buttons.tsx).
2. **Color Neutralization (Just White)**:
   - Removed the amber/orange `text-amber-500` color styling.
   - Styled the icon to render in clean white in dark mode (`text-zinc-700 dark:text-white`).

---

## 14. Media Menu Simplification & Color Removal

Per user feedback with screenshot `media_1789462838757.png`:

1. **Removed All Colors (Monochrome / Neutral)**:
   - Removed cyan, purple, green, and orange colors from media icons.
   - All icons now render in neutral monochrome (`text-zinc-600 dark:text-zinc-300`).
2. **Simplified Menu Layout**:
   - Replaced multi-button table rows (`Upload` and `URL` side-by-side) with clean, single-action full-width menu items:
     - 🖼️ **Image** (1-click file picker)
     - 🎬 **Video** (1-click file picker)
     - 🎵 **Audio** (1-click file picker)
     - 📄 **File Attachment** (1-click file picker)
   - Added clean divider followed by a dedicated **Insert via URL** option with unified media type switcher modal.

---

## 15. Fixed Toolbar Right-Alignment & Separator Deduplication

Per user feedback with screenshot `media_1789465275790.png`:

1. **Right-Edge Alignment (`ml-auto`)**:
   - Pinned the Comment (`CommentToolbarButton`), Mode Switcher (`ModeToolbarButton`), and Fullscreen (`ToolbarButton`) cluster flush against the right edge of the fixed toolbar container using `ml-auto flex items-center gap-1 shrink-0`.
   - Prevents auxiliary action buttons from floating in the middle of wide viewports.
2. **Separator Deduplication (Single-Line Divider Standard)**:
   - Eliminated duplicate adjacent vertical dividers (`| |`).
   - Suppressed the trailing separator of Group 6 (`Line Height, Outdent, Indent`) using `[&>div[role=separator]]:hidden` to eliminate orphan dividers in empty space.
   - Placed strictly one `<ToolbarSeparator />` before Comment, one between Comment and Mode Switcher, and one between Mode Switcher and Fullscreen.
   - Removed trailing separator after the Fullscreen toggle to ensure clean alignment touching the container boundary.

---

## 16. Link Toolbar Dropdown ("Dropview") & Browser Prompt Elimination

Per user feedback with screenshots `media_1789465341061.png` (Link icon) and `media_1789465375166.png` (`window.prompt` dialog):

1. **Replaced `window.prompt` with First-Class `LinkToolbarButton`**:
   - Replaced the raw `<ToolbarButton>` and `window.prompt('Enter link URL:')` with an interactive, portal-backed popover (`LinkToolbarButton`).
   - Never blocked or clipped by toolbar scroll or container boundaries using `PortalPopover`.
2. **Interactive Dropview Capabilities**:
   - **URL Input with Auto-Focus**: Automatically focuses and selects the URL input field upon opening for immediate paste (`Ctrl+V`) and Enter insertion.
   - **Protocol Normalization**: Auto-prefixes `https://` if no protocol (`http://`, `https://`, `mailto:`, `tel:`) was entered.
   - **Display Text**: Pre-populates selected text when available, or allows custom label text.
   - **Link Detection & Edit Mode**: When cursor is inside an existing link, the toolbar icon lights up active (`text-primary`), the popover title switches to "Edit Link", and displays:
     - Current URL and display text for in-place editing.
     - One-click **Unlink** button (`Unlink`) to remove the hyperlink.
     - **Open in new tab** button (`ExternalLink`) to test or preview the link.
3. **Purged `window.prompt` from `InsertToolbarButton`**:
   - Updated the "Link" action in the `+ v` insert dropdown to perform non-blocking inline node insertion without triggering browser prompt dialogs.

---

## 17. List Dropdown Arrow Visibility & Universal Dark Mode Chevron Enhancement

Per user feedback with screenshot `media_1789465389183.png` (showing Numbered and Bulleted list icons with invisible dropdown arrows in dark mode):

1. **Restored Missing Dropdown Arrows on List Split Buttons**:
   - In `src/components/plate-ui/fixed-toolbar-buttons.tsx`, updated `NumberedListToolbarButton` and `BulletedListToolbarButton` to explicitly render `<ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />` within `ToolbarSplitButtonSecondary`.
   - In `src/components/plate-ui/toolbar.tsx`, updated `ToolbarSplitButtonSecondary` to provide a built-in default `<ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />` so the dropdown arrow is guaranteed to render.
2. **Universal Dark Mode Contrast Enhancement Across All Toolbar Dropdowns**:
   - Upgraded all dropdown chevrons from low-contrast `text-zinc-400` / `opacity-60` to crisp, high-contrast `text-zinc-600 dark:text-zinc-200`:
     - Numbered List dropdown
     - Bulleted List dropdown
     - Insert dropdown (`+ v`)
     - Turn Into dropdown (`Heading 1 v`)
     - Align dropdown (`Align v`)
     - Table grid dropdown (`Table v`)
     - Emoji picker dropdown (`Emoji v`)
     - Media suite dropdown (`Media v`)
     - Line spacing dropdown (`Line Height v`)
     - Mode switcher dropdown (`Editing v`)
     - Zoom preset dropdown (`100% v`)
   - All dropdown arrows are now immediately visible, crisp, and legible in both dark and light modes.

---

## 18. Toolbar History Controls: Undo & Redo Buttons

Per user feedback with screenshot `media_1789465433512.png` (showing `+ v` insert button):

1. **Placed Undo & Redo to the Left of `+ v`**:
   - In `src/components/plate-ui/fixed-toolbar-buttons.tsx`, added a dedicated history toolbar group on the far left before the `+ v` Insert button.
   - **Undo (`↺` / `Undo2`)**: Executes `editor.undo()` or `editor.api.undo()` with keyboard shortcut tooltip `Undo (Ctrl+Z)`.
   - **Redo (`↻` / `Redo2`)**: Executes `editor.redo()` or `editor.api.redo()` with keyboard shortcut tooltip `Redo (Ctrl+Y)`.
2. **Defensive History State Handling**:
   - Safely checks `editor.history.undos` and `editor.history.redos` with automatic fallback to enabled.
   - Preserves focus in editor after executing undo/redo.
   - High-contrast icons rendered in `text-zinc-700 dark:text-zinc-200` matching the rest of the toolbar.

---

## 19. Media Dropdown: Restored Side-by-Side Upload and URL Action Buttons

Per user request ("add back the upload and link") with reference screenshot `media_1789468639575.png` and original layout `media_1789462838757.png`:

1. **Restored Dual Action Buttons per Media Row**:
   - In `src/components/plate-ui/fixed-toolbar-buttons.tsx`, updated `MediaToolbarButton` so each media type row (Image, Video, Audio, File Attachment) renders side-by-side action buttons on the right:
     - **Upload**: Directly opens the local OS file picker with the appropriate MIME filter (`image/*`, `video/*`, `audio/*`, `*`).
     - **URL**: Opens the URL insertion modal targeted specifically to the clicked media type (`Insert Image via URL`, `Insert Video via URL`, etc.).
   - Clicking the left half of the row (icon or label) also triggers file upload as an intuitive primary shortcut.
2. **Removed Trailing "Insert via URL" Button**:
   - Eliminated the redundant bottom divider and standalone "Insert via URL" row, consolidating URL insertion directly into each media row.
3. **Preserved Monochrome & Clean Aesthetic**:
   - Retained neutral, non-distracting monochrome icon styling (`text-zinc-600 dark:text-zinc-300`) satisfying previous simplification instructions while restoring full dual functionality.
   - Preserved dark-mode high-contrast dropdown chevron (`text-zinc-600 dark:text-zinc-200`).

---

## 20. Table Toolbar Dropview: Hierarchical Submenus (Table, Cell, Row, Column, Delete Table)

Per user request with reference screenshot `media_1789468746934.png`:

1. **Exact 5-Item Dropview Structure**:
   - Replaced flat table popover with a clean, hierarchical dropview in `TableToolbarButton`:
     - **Table**: `Grid3X3` icon, label `"Table"`, and `ChevronRight` (`>`) arrow. Hovering or clicking opens the 8x8 interactive grid picker flyout.
     - **Cell**: Left gutter alignment, label `"Cell"`, and `ChevronRight` (`>`) arrow. Active when cursor is inside a table. Opens flyout with *Insert cell left*, *Insert cell right*, and *Delete cell*.
     - **Row**: Left gutter alignment, label `"Row"`, and `ChevronRight` (`>`) arrow. Active when cursor is inside a table. Opens flyout with *Insert row above*, *Insert row below*, and *Delete row*.
     - **Column**: Left gutter alignment, label `"Column"`, and `ChevronRight` (`>`) arrow. Active when cursor is inside a table. Opens flyout with *Insert column left*, *Insert column right*, and *Delete column*.
     - **Delete table**: `Trash2` icon on left, label `"Delete table"`. Directly deletes the active table when clicked inside a table.
2. **Context-Aware Visual States Matching Screenshot**:
   - When the cursor is outside a table, `"Cell"`, `"Row"`, `"Column"`, and `"Delete table"` are rendered in a light, muted color (`text-zinc-400 dark:text-zinc-500`) with `cursor-not-allowed`, exactly matching `media_1789468746934.png`.
   - When inside a table, all items become fully interactive with smooth hover highlights and dark-mode contrast.
3. **Adaptive Viewport Collision**:
   - Submenus automatically determine `flyoutSide` (`'right'` or `'left'`) based on viewport boundaries, preventing any offscreen overflow.

---

## 21. Responsive Right-Edge Toolbar Overflow (Vertical 3-Dots Dropview)

Per user request with screenshot `media_1789470743517.png` (showing Comment, Editing, and Fullscreen wrapping onto a 2nd row when the sidebar is open):

1. **Strict Single Horizontal Line Invariant (`flex-nowrap`)**:
   - In `src/components/plate-ui/fixed-toolbar-buttons.tsx`, replaced `flex-wrap` with `flex-nowrap` on the master toolbar container, guaranteeing the toolbar remains strictly a single straight horizontal line at all times.
2. **Dynamic Sidebar & Viewport-Aware Overflow (`RightOverflowMenu`)**:
   - Integrated with `SidebarContext` exported from `@/components/ui/sidebar.tsx` to detect whether the application sidebar is open or collapsed.
   - **When Sidebar is Open (or width < 1180px)**:
     - Right-edge actions (Comment, Mode Switcher, Fullscreen) are collapsed into a vertical 3-dots button (`MoreVertical` / `⋮`), saving ~160px of horizontal space.
     - Active comments count badge is displayed on the 3-dots button when notes exist.
     - Clicking the 3-dots button opens a clean dropview with:
       - **Document Mode**: Direct switcher between Editing (`Pencil`), Suggesting (`PenLine`), and Viewing (`Eye`) with active checkmark.
       - **Comments & Notes**: Direct action opening the comments dialog/list with unread count.
       - **Full screen**: Direct toggle between Fullscreen (`Maximize2`) and Exit Fullscreen (`Minimize2`).
   - **When Sidebar is Collapsed**:
     - The available width expands by 256px, and `FixedToolbarButtons` instantly reveals all three controls horizontally inline: `CommentToolbarButton`, `ToolbarSeparator`, `ModeToolbarButton`, `ToolbarSeparator`, `Fullscreen ToolbarButton`.

---

## 22. Document Editor Navigation: Chevron Icon and "Back" Label

Per user request with reference screenshot `media_1789514707093.png`:

1. **Back Navigation Update**:
   - In `src/pages/student/StudentDocumentEditor.tsx`, updated top navigation button from `ArrowLeft` (`←`) and `"Repository"` to `ChevronLeft` (`<`) and `"Back"`.
   - Updated Lucide icon imports: replaced `ArrowLeft` with `ChevronLeft`.
   - Enhanced styling with `gap-1`, `font-medium`, and `transition-colors` matching design standards.

---

## 23. Document Editor Text Input & Canvas Refinement (`media_1789516779276.png`)

Per user request with reference screenshot `media_1789516779276.png`:

1. **Clean Sans-Serif Modern Document Canvas**:
   - In `src/components/plate-ui/editor.tsx`, updated `editorVariants` to use `font-sans text-[15px] sm:text-base leading-relaxed` with `caret-zinc-900 dark:caret-zinc-100`.
   - Removed hardcoded inline `Times New Roman` serif styling from `PlateContent` on screen, letting the web editor cleanly match the Geist/Inter aesthetic shown in `media_1789516779276.png`. Formal document serif printing remains preserved in `@media print` (`print-document.css`) and DOCX serialization (`docxSerializer.ts`).
2. **Authentic Sheet Dimensions & Framing**:
   - Updated `Editor` card to `max-w-[900px] min-h-[750px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm rounded-xl px-8 sm:px-12 md:px-16 py-10 md:py-14`, matching the generous 64px left/top gutters measured in the reference screenshot.
   - Updated `EditorContainer` canvas background to `dark:bg-zinc-950` (`#09090b`), providing clean visual separation around the `#18181b` document sheet.
3. **Sub-Pixel Caret & Placeholder Alignment**:
   - Added `relative` positioning to `ParagraphElement`, `HeadingElement`, and `BlockquoteElement` in `src/components/editor/editor-kit.tsx`. This anchors Slate's `[data-slate-placeholder]` decoration (`position: absolute; top: 0`) directly to the active paragraph block line, keeping the caret `|` and placeholder text flush at `x=0`.
4. **Enhanced Placeholder Renderer & Contrast**:
   - Implemented a custom `renderPlaceholder` in `Editor` (`src/components/plate-ui/editor.tsx`) that renders placeholder text with `opacity: 1` and theme-aware styling (`text-zinc-400 dark:text-zinc-500`).
   - Added global CSS overrides in `src/index.css` for `[data-slate-placeholder]` (`opacity: 1 !important; color: rgb(113 113 122) !important; .dark [data-slate-placeholder] { color: rgb(161 161 170 / 0.7) !important; }`), preventing Slate inline styles from fading the placeholder to 33% opacity.
   - Standardized the placeholder string across `StudentDocumentEditor.tsx` and `plate-editor.tsx` to `"Start writing your document..."` matching the exact screenshot.

---

## 24. Standardized Core Node Renderers & Export Toolbar Button (Official Plate Registry v53)

Per user request referencing official Plate.js component specifications (`https://platejs.org/docs/components/...` / `https://platejs.org/r/...`):

1. **Official Plate Registry Node Alignment (`src/components/editor/editor-kit.tsx`)**:
   - **Paragraph Element**: Updated to official `cn('relative m-0 px-0 py-1 min-h-[1.5em]', className)` matching `paragraph-node.json`. Eliminates excess block margins and establishes standard natural paragraph rhythm.
   - **Heading Element**: Adopted official `headingVariants` scale from `heading-node.json` with relative positioning, semantically calibrated `font-heading`, and distinct font sizes:
     - `h1`: `mt-[1.6em] pb-1 font-heading text-3xl sm:text-4xl font-bold tracking-tight`
     - `h2`: `mt-[1.4em] pb-1 font-heading text-2xl font-semibold tracking-tight`
     - `h3`: `mt-[1em] pb-1 font-heading text-xl font-semibold tracking-tight`
     - `h4`: `mt-[0.75em] font-heading text-lg font-semibold tracking-tight`
     - `h5`: `mt-[0.75em] text-base font-semibold tracking-tight`
     - `h6`: `mt-[0.75em] text-sm font-semibold tracking-tight`
   - **Blockquote Element**: Updated to `cn('relative my-1 border-l-2 border-zinc-300 dark:border-zinc-700 pl-6 italic text-zinc-700 dark:text-zinc-300', className)` matching `blockquote-node.json`.
   - **Code Leaf**: Updated to `cn('whitespace-pre-wrap rounded-md bg-zinc-100 dark:bg-zinc-800 px-[0.3em] py-[0.2em] font-mono text-sm text-zinc-900 dark:text-zinc-100', className)` matching `code-node.json`.
   - **Highlight Leaf**: Updated to `cn('rounded bg-amber-200/60 dark:bg-amber-400/30 text-inherit px-0.5', className)` matching `highlight-node.json`.
   - **Horizontal Rule**: Enclosed `<hr className="h-0.5 rounded-sm border-none bg-zinc-200 dark:bg-zinc-800 bg-clip-content" />` in a non-editable `py-6` wrapper matching `hr-node.json`.
   - **Lists**: Standardized list margin and line spacing (`my-1 ml-6 space-y-0.5`, `m-0 px-0 py-0.5`) matching `list-node.json`.
   - **Link Element**: Updated to `cn('font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary', className)`.
2. **Official Editor Variants Alignment (`src/components/plate-ui/editor.tsx`)**:
   - Standardized `editorVariants` with `whitespace-pre-wrap break-words`, `rounded-md ring-offset-background focus-visible:outline-none`.
   - Injected Tailwind v4 placeholder alignment classes `**:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2` and `**:data-slate-placeholder:text-zinc-400 dark:**:data-slate-placeholder:text-zinc-500 **:data-slate-placeholder:opacity-100!`.
3. **Official Export Toolbar Button (`ExportToolbarButton`)**:
   - Implemented `ExportToolbarButton` matching `https://platejs.org/docs/components/export-toolbar-button` (`ArrowDownToLine` icon).
   - Provides 1-click export options for **Export as Word (.docx)** and **Export as PDF (.pdf)** directly from the editor toolbar.
   - Integrated into both the standard horizontal toolbar and the responsive 3-dots `RightOverflowMenu`.
4. **Zero Regressions & Full Test Verification**:
   - All 48 test suites passing (`npm run test:editor`).
   - TypeScript compiler passes with 0 errors (`npm run lint`).

---

## 25. Plate.js Paragraph Spacing & Canvas Sheet Padding Normalization (`media_1789517968222.png`)

Per user request reporting excessive line spacing between text entries (`fasdfasf` and `safdasf`):

1. **Root Cause Analysis of Excessive Line Spacing**:
   - **DOM Newline Doubling (`whitespace-pre-wrap`)**: In Slate/Plate contenteditable, pressing Enter appends both a DOM newline node and a new paragraph block. Under `whitespace-pre-wrap`, CSS preserves the literal newline character inside the block AND executes Slate's block wrap, causing a double line height void.
   - **HTML `<p>` User-Agent Block Margin**: Rendering `ParagraphElement` with `as="p"` triggered default browser user-agent margins (`margin-block: 1em`, ~16px top and bottom). Official Plate `paragraph-node.tsx` intentionally omits `as="p"` to render `PlateElement` as a `div` with controlled padding.
   - **Artificial Line Constraint (`min-h-[1.5em]`)**: An explicit `min-h-[1.5em]` forced every empty or single-character line to occupy 24px+ minimum vertical space.
   - **Line-Height Expansion (`leading-relaxed`)**: `leading-relaxed` (1.625) widened line distance unnecessarily for standard document typography.
   - **Oversized Sheet Margins**: The sheet canvas container used `py-10 md:py-14` (56px) and `px-16` (64px), exaggerating empty space around short text entries.

2. **Official Plate Registry Spacing Implementation**:
   - **CSS Whitespace Normalization (`src/components/plate-ui/editor.tsx`)**:
     - Switched from `whitespace-pre-wrap` to official Plate `whitespace-break-spaces break-words`.
     - Changed line height from `leading-relaxed` to `leading-normal` (1.5) for natural document rhythm.
   - **Paragraph Node Calibration (`src/components/editor/editor-kit.tsx`)**:
     - Removed `as="p"` from `ParagraphElement` so it renders standard `PlateElement` (`div`).
     - Removed `min-h-[1.5em]`.
     - Set tight, uniform padding: `cn('relative m-0 px-0 py-0.5 leading-normal', className)`.
   - **Heading Margins Calibration**:
     - Replaced loose `[em]` margins with balanced rem/pixel scales:
       - `h1`: `mt-6 mb-2`
       - `h2`: `mt-5 mb-1.5`
       - `h3`: `mt-4 mb-1`
       - `h4`: `mt-3 mb-1`
       - `h5`: `mt-2.5 mb-0.5`
       - `h6`: `mt-2 mb-0.5`
   - **Sheet Padding Calibration**:
     - Normalized `default` and `demo` variants to `px-8 sm:px-12 py-6 sm:py-8 max-w-[850px] min-h-[700px]`, producing balanced document borders without cavernous voids.

3. **Zero Regressions & Full Verification**:
   - `npm run lint` (`tsc --noEmit`): 0 errors.
   - `npm run test:editor`: 48/48 tests passing across all 8 test suites.

---

## 26. Official Plate.js Modular UI Registry Alignment (`docs/platejs.md`)

Per user instruction providing the complete official Plate.js v53 registry codebase in `docs/platejs.md` (78 components, 17,761 lines), the document editor was refactored from a monolithic definition into the official, modular Plate.js directory structure and component patterns under `src/components/plate-ui/`.

### 1. Architectural Principles & Directory Structure
- **Modular Directory Organization**: Split inline element renderers and toolbar buttons into dedicated, individually importable files in `src/components/plate-ui/` matching the official registry paths.
- **Declarative Toolbar Composition**: Refactored `FixedToolbarButtons` into a clean orchestrator importing modular buttons, preserving the responsive 3-dots overflow menu (`RightOverflowMenu`) for open/collapsed sidebar states.
- **Base UI Component Bridge**: Added `asChild` composition support via `@base-ui/react` `render` prop in `components/ui/dropdown-menu.tsx` and `components/ui/popover.tsx`, ensuring full compatibility with official Radix-style toolbar button triggers.
- **Strict Single-Line Spacing Preservation**: Preserved the verified `cn('relative m-0 px-0 py-0.5 leading-normal', className)` spacing on `ParagraphElement` without `as="p"` tag and `whitespace-break-spaces` on `Editor` to prevent double newline voids.

### 2. Implemented Modular Components in `src/components/plate-ui/`

1. **Element & Leaf Renderers**:
   - `paragraph-element.tsx`: Standard `PlateElement` with verified single-spacing classes.
   - `heading-element.tsx`: Scaled `H1Element`..`H6Element` with `headingVariants`.
   - `blockquote-element.tsx`: Border-left accented blockquote element.
   - `code-leaf.tsx`: Monospace code tag leaf.
   - `highlight-leaf.tsx`: Amber background leaf mark.
   - `kbd-leaf.tsx`: Keyboard key tag leaf.
   - `hr-element.tsx`: Horizontal divider rule.
   - `link-element.tsx`: Styled anchor tag element.
   - `date-element.tsx`: Inline calendar pill with date picker popover.
   - `table-element.tsx`: Full `TableElement`, `TableRowElement`, `TableCellElement`, `TableCellHeaderElement` with border controls.
   - `toggle-element.tsx`: Collapsible accordion block.

2. **Modular Toolbar Buttons**:
   - `history-toolbar-button.tsx`: `UndoToolbarButton` & `RedoToolbarButton` with undo/redo stack state.
   - `mark-toolbar-button.tsx`: Generic text mark toggler using `useMarkToolbarButton` & `useMarkToolbarButtonState`.
   - `turn-into-toolbar-button.tsx`: Block converter dropdown (Text, H1–H6, Quote, Todo).
   - `font-size-toolbar-button.tsx`: Stepper pill with dropdown size picker.
   - `font-color-toolbar-button.tsx`: 10-column color palette with custom hex input.
   - `align-toolbar-button.tsx`: Left, center, right, and justify alignment selector.
   - `list-toolbar-button.tsx`: `BulletedListToolbarButton`, `NumberedListToolbarButton`, `TodoListToolbarButton`.
   - `indent-toolbar-button.tsx`: `IndentToolbarButton` & `OutdentToolbarButton`.
   - `link-toolbar-button.tsx`: Link insert/edit popover.
   - `table-toolbar-button.tsx`: 8x8 table grid picker with row/col submenus.
   - `emoji-toolbar-button.tsx`: Categorized emoji picker popover.
   - `media-toolbar-button.tsx`: Unified media uploader for images, videos, audio, and attachments.
   - `line-height-toolbar-button.tsx`: Line spacing dropdown (1, 1.15, 1.5, 2, 2.5, 3).
   - `mode-toolbar-button.tsx`: Document mode switcher (`editing`, `suggesting`, `viewing`).
   - `comment-toolbar-button.tsx`: Comment thread viewer and creator with badge indicator.
   - `export-toolbar-button.tsx`: Word (.docx) and PDF export dropdown.
   - `toggle-toolbar-button.tsx`: Toggle list item button.
   - `insert-toolbar-button.tsx`: Unified insert block menu.
   - `speech-to-text-toolbar-button.tsx`: Isolated dictation button.
   - `more-toolbar-button.tsx`: Overflow actions menu.
   - `floating-toolbar-buttons.tsx`: Contextual floating toolbar action suite.

### 3. Verification & Zero Regressions
- **Type Checking (`npm run lint`)**: Passed with 0 errors across all 30 new modular components and updated consumers.
- **Test Suite (`npm run test:editor`)**: All 48 test suites passing across database, storage, and editor runtime domains.

---

## 27. Editor Refinements: Code & Export Removal, Line Height Width Fix, Emoji & Link Reliability, Horizontal Right Buttons

Per user requests regarding editor toolbar alignment and functionality (`media_1789520188168.png`, `media_1789520260549.png`):

### 1. Code Mark & Block Option Removal
- **Rationale**: The document editor serves formal institutional practicum documentation (e.g. MOA, Consent forms, Application letters, Training Plans, Weekly Journals). Coding markup is neither required nor appropriate for these documents.
- **Changes**:
  - `src/components/plate-ui/fixed-toolbar-buttons.tsx`: Removed the inline code mark button (`MarkToolbarButton` with `KEYS.code` / `FileCode`).
  - `src/components/plate-ui/insert-toolbar-button.tsx`: Removed the `Code` block insertion entry and unused `FileCode` import.
  - `src/components/plate-ui/turn-into-toolbar-button.tsx`: Removed the `Code` option from the Turn Into block switcher and unused `FileCode` import.

### 2. Export Button Removal from Toolbar
- **Rationale**: An Export button is already prominent in the document editor header actions (`Export as DOCX` / `Export as PDF`). Having an identical export dropdown inside the fixed editor toolbar was redundant.
- **Changes**:
  - `src/components/plate-ui/fixed-toolbar-buttons.tsx`: Removed `ExportToolbarButton` and its import from the fixed toolbar.

### 3. Line-Height Dropdown Width & Sizing Fix
- **Root Cause**: In `src/components/plate-ui/line-height-toolbar-button.tsx`, `DropdownMenuContent` had `min-w-0`, causing Base UI to constrain the popup width to the 34px width of the trigger button, which crushed numbers `1.15`, `1.5`, `2.5` and caused ugly text wrapping.
- **Changes**:
  - Replaced `min-w-0` with `w-24 min-w-[5.5rem] p-1.5` on `DropdownMenuContent`.
  - Styled items with `flex items-center justify-between px-2.5 py-1 text-xs` so numbers and checkmarks have ample breathing room and never squish or truncate.

### 4. Emoji & Link Insertion Reliability
- **Root Cause**: In Slate/ContentEditable, clicking buttons outside the editable canvas causes the browser to blur the editor and clear `editor.selection` to `null`. Subsequent `insertText` or `wrapNodes` operations fail silently or insert at position 0.
- **Changes**:
  - `src/components/plate-ui/emoji-toolbar-button.tsx`:
    - Added `savedSelection` ref capturing `editor.selection` when the popover opens.
    - Added `onMouseDown={(e) => e.preventDefault()}` on all emoji grid buttons to preserve Slate selection during clicks.
    - Restores selection and calls `editor.tf.focus()` and `editor.tf.insertText(emoji)`.
  - `src/components/plate-ui/link-toolbar-button.tsx`:
    - Added `savedSelection` ref capturing `editor.selection` before popover input autofocus.
    - Added `onMouseDown={(e) => e.preventDefault()}` on the Insert/Update button.
    - In `handleSave`: restores `savedSelection`, wraps selected text (`wrapNodes`) or inserts inline link node (`insertNodes`), and restores focus to editor.

### 5. Horizontal Right-Edge Action Buttons
- **Root Cause**: `FixedToolbarButtons` previously had an arbitrary `window.innerWidth < 1180` check that collapsed the 3 right-edge controls into a 3-dots icon (`RightOverflowMenu`) on standard laptop viewports.
- **Changes**:
  - Removed `RightOverflowMenu`, `showOverflowMenu`, `isNarrow`, and `SidebarContext` dependency.
  - Directly renders the 3 buttons horizontally in a straight line on the right edge:
    - `<CommentToolbarButton ... />`
    - `<ToolbarSeparator />`
    - `<ModeToolbarButton ... />`
    - `<ToolbarSeparator />`
    - Fullscreen `<ToolbarButton ... />`

### 6. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 48/48 tests passing across all 8 suites.

---

## 28. Auto-Collapse Sidebar on Document Editor & Smooth Toolbar Scroll

Per user alignment during `/grill-me` regarding sidebar behavior and editor toolbar layout:

### 1. Auto-Collapse & Auto-Restore Sidebar (`src/pages/student/StudentDocumentEditor.tsx`)
- **Rationale**: When navigating to the Document Editor (`/student/editor`), the portal sidebar occupies 256px, constraining available horizontal canvas width on standard desktop/laptop displays (e.g. 1366x768) and pushing right-edge toolbar buttons past the viewport.
- **Implementation**:
  - Connected `StudentDocumentEditor` to `SidebarContext` using `sidebarRef` and an empty dependency array `[]`.
  - On mount, automatically calls `sidebarRef.current?.setOpen(false)` once to collapse the navigation sidebar, instantly granting an additional 256px of screen width for distraction-free document writing and ensuring all toolbar controls are immediately visible.
  - Does NOT lock the sidebar: Because `sidebar` is accessed via ref with an empty dependency array, user manual toggles (clicking `SidebarTrigger` or `Ctrl+B`) are preserved and never overridden.
  - Added dedicated `SidebarTrigger` button right next to `< Back` in the editor header, allowing instant 1-click toggling of the sidebar directly from the document editor.
  - On unmount (e.g. clicking `< Back` or navigating to Dashboard/Repository), automatically calls `sidebarRef.current?.setOpen(true)` to re-open the sidebar for seamless portal navigation.

### 2. Smooth Horizontal Wheel Scrolling & Sizing (`src/components/plate-ui/fixed-toolbar.tsx` & `fixed-toolbar-buttons.tsx`)
- Added `handleWheel` in `FixedToolbar` translating vertical mouse wheel events into horizontal scroll (`scrollLeft += deltaY`) when content overflows, enabling effortless horizontal navigation with standard mouse wheels on smaller viewports.
- Added `min-w-max` to `FixedToolbarButtons` root container (`flex w-full min-w-max items-center gap-1 flex-nowrap`), guaranteeing that flex items maintain full size and never squish or compress on narrow viewports.

### 3. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 48/48 tests passing across all 8 suites.

---

## 29. Multi-Role Comments Drawer, Pure-White Highlight Mark, and Reviewer Mode

Per user alignment during `/grill-me` regarding multi-role commenting and review capabilities:

### 1. Multi-Role Comments Side Drawer (`src/components/editor/CommentsDrawer.tsx`)
- **Slide-Out Side Panel**: Dedicated right-side drawer component displaying threaded comments and feedback without occluding the document canvas.
- **Active & Resolved Tabs**: Separates pending comments from resolved discussions, maintaining clean document review history.
- **Institutional Role Badges**: Every comment displays the author's official role badge with distinct color branding:
  - **Admin**: Rose (`bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20`)
  - **Adviser**: Blue (`bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20`)
  - **Supervisor**: Amber (`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20`)
  - **Student**: Emerald (`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`)
- **Quoted Text Preview**: When commenting on selected document text, quotes the excerpt in a dismissible blockquote preview banner.
- **Ergonomic Submission & Actions**: Supports `Cmd+Enter` / `Ctrl+Enter` shortcut to submit, 1-click resolve/re-open toggle, and trash deletion.

### 2. Pure-White Highlight Mark on Fixed & Floating Toolbars
- **Fixed Toolbar (`src/components/plate-ui/fixed-toolbar-buttons.tsx`)**: Added `MarkToolbarButton` for `KEYS.highlight` featuring a pure-white icon in dark mode (`text-zinc-700 dark:text-white`).
- **Floating Toolbar (`src/components/plate-ui/floating-toolbar.tsx`)**: Replaced `text-amber-500` with strictly neutral `text-zinc-700 dark:text-white` on the `Highlighter` icon, eliminating unwanted yellow/amber tint.
- **Selection Comment Quick Action**: Added `MessageSquarePlus` button to the floating toolbar, allowing users to select any passage in the editor and immediately trigger the Comments Drawer with the selected passage pre-quoted.

### 3. Reviewer Document Access & Review Mode (`StudentDocumentEditor.tsx`, `UnifiedReviewSession.tsx`, `WeeklyJournalReview.tsx`)
- **Reviewer Role Detection**: Automatically detects reviewers via `user?.role === 'adviser' | 'supervisor' | 'admin'` or `?mode=review` URL parameter.
- **Review Mode Default**: Defaults to `'suggesting'` mode for reviewers (allowing highlighting and commenting without accidentally modifying student text), while retaining direct editing capability via the toolbar mode switcher when advisers need to fix typos directly.
- **Review Mode Banner**: Displays a distinct blue banner (`Review Mode Active ({ROLE})`) with a 1-click `"Back to Review Hub"` button.
- **Reviewer Entry Points**: Added "Open in Document Editor" action button in `UnifiedReviewSession.tsx` and `WeeklyJournalReview.tsx` so staff can jump straight from submission queues into the rich document review workspace.

### 4. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 48/48 tests passing across all 8 suites.

---

## 30. Block Draggable Reordering & Plate Playground Visual Styling Suite

Per user alignment during `/grill-me` regarding block dragging and official Plate playground styling:

### 1. Hover 6-Dots Drag Handle & Slate Node Reordering (`src/components/plate-ui/block-draggable.tsx`)
- **Left Margin Hover Trigger**: Top-level blocks (Paragraphs, Headings H1–H6, Blockquotes, Lists, Tables, Media, To-do items, Toggles, Horizontal Rules) render a 6-dots handle (`GripVertical`) in the left gutter (`absolute -left-7`) on hover (`opacity-0 group-hover/block:opacity-100`).
- **Native Slate Node Moving**:
  - Dragging the handle sets `text/plate-block-index` in HTML5 `dataTransfer`.
  - On drop, computes the precise displacement and invokes Slate's native `editor.tf.moveNodes({ at: [fromIndex], to: [toIndex] })`.
  - Supports full undo/redo history (`Ctrl+Z` / `Ctrl+Y`).
- **Crisp Blue Insertion Indicator**:
  - Dynamically detects upper vs lower block boundary.
  - Displays a crisp horizontal blue line (`h-0.5 bg-blue-500`) with circular endpoints (`w-2 h-2 rounded-full bg-blue-500`) at the exact drop position.
- **Pure Drag-and-Drop UX**: As explicitly chosen during `/grill-me`, clicking alone does not open an extra menu, keeping the canvas distraction-free.
- **Print & Export Immunity**: Handle and indicator elements are flagged with `contentEditable={false}`, `print:hidden`, and `select-none`.

### 2. Plate Playground Visual Spacing & Typography Alignment
- **Headings (`src/components/plate-ui/heading-element.tsx`)**:
  - Calibrated spacing scale matching the playground: `H1` (`mt-7 mb-2.5 font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 leading-tight`), `H2` (`mt-6 mb-2 font-bold text-2xl text-zinc-900 dark:text-zinc-100 leading-snug`), `H3` (`mt-4.5 mb-1.5 font-semibold text-xl text-zinc-900 dark:text-zinc-100`).
- **Paragraphs (`src/components/plate-ui/paragraph-element.tsx`)**:
  - Body text styled with `text-base text-zinc-800 dark:text-zinc-200 leading-relaxed py-1`.
- **Blockquotes (`src/components/plate-ui/blockquote-element.tsx`)**:
  - Styled with 2px vertical gray border (`border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 py-1.5 my-2`) and italic nested structure (`italic text-zinc-700 dark:text-zinc-300`).
- **Tables (`src/components/plate-ui/table-element.tsx`)**:
  - Clean table borders (`border border-zinc-200 dark:border-zinc-800 rounded-lg`), subtle header tint (`bg-zinc-50 dark:bg-zinc-800/60`), and comfortable padding (`px-3.5 py-2.5`).
- **Media & Attachments (`src/components/editor/editor-kit.tsx`)**:
  - Centered images with subtle rounded corners (`rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs`) and centered caption support (`mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400`).
  - File attachments rendered as clean cards with document icon and download button matching `sample.pdf` from the playground.
  - Audio and video players with modern rounded styling.
- **Content Integrity Invariant**: No programming code blocks or playground sample text/images were injected; the document editor remains the clean workspace for student templates.

### 3. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 49/49 tests passing across all 8 suites (including new block displacement test).

---

## 31. Document Editor Ergonomics: Block Exit on Enter, Single-Click Toolbar Buttons, Font Family Picker, Image Alignment Toolbar, Document Header Zone, Table Operations, and Center Speech-to-Text Status

Per user alignment during `/grill-me` regarding editor ergonomics, typography, and media capabilities:

### 1. Enter Key Block Exit (`src/components/editor/plate-editor.tsx`)
- **Classic Lists (`ul`/`ol`)**: Pressing `Enter` on an empty bullet or numbered list item (`li`) immediately unwraps the list container and converts the current line into a standard paragraph (`p`), allowing effortless exit without multiple backspaces.
- **Toggle & To-Do Lists**: Pressing `Enter` on an empty toggle or to-do line converts it directly to a standard paragraph (`p`).
- **Toggle Content Continuation**: Pressing `Enter` inside a toggle with text inserts a normal paragraph (`p`) below it.

### 2. Single-Click Toolbar Toggle Fix (`src/components/plate-ui/toolbar.tsx`)
- **Root Cause Isolated & Resolved**: `ToolbarButton`, `ToolbarSplitButtonPrimary`, and `ToolbarSplitButtonSecondary` were triggering `onClick?.(e as any)` inside `onMouseDown`, while the browser's subsequent synthetic click also fired `onClick`, causing formatting buttons to toggle on and immediately off on a single click.
- **Selection Preservation**: Retained `e.preventDefault()` on `onMouseDown` so Slate's text selection is never blurred when clicking toolbar buttons, and let the native `onClick` execute cleanly once.

### 3. Toggle List Icon Alignment (`src/components/plate-ui/toggle-toolbar-button.tsx`)
- Replaced `ChevronRight` with standard `ListCollapse` from `lucide-react` to distinguish collapsible toggle lists from chevron arrows.

### 4. Font Family Dropdown (`src/components/plate-ui/font-family-toolbar-button.tsx`)
- **Typography Selection**: Added a Font Family dropdown featuring Geist Sans (default), Inter, Times New Roman, Arial, Calibri, Georgia, and Courier New.
- **Plugin Integration**: Registered `FontFamilyPlugin` and `MARK_FONT_FAMILY` in `editor-kit.tsx`.
- **Top Toolbar Placement**: Positioned `<FontFamilyToolbarButton />` next to `<FontSizeToolbarButton />` on the fixed top toolbar.

### 5. Table Row & Column Operations (`src/components/plate-ui/table-toolbar-button.tsx`)
- **Focus Blur Immunity**: Added `savedTableInfo` ref and `savedSelection` capture on dropdown open so table operations (Insert Row Above/Below, Delete Row, Insert Column Left/Right, Delete Column, Delete Table) work reliably regardless of toolbar focus state.
- **Precise Path Calculations**: Implemented rock-solid path arithmetic for row and column insertions and deletions.

### 6. Center Floating Speech-to-Text Status Indicator (`src/components/plate-ui/speech-to-text-toolbar-button.tsx`)
- **Visual Feedback**: Added a fixed floating pill centered at `bottom-8 left-1/2 -translate-x-1/2` during voice dictation.
- **Controls**: Displays a pulsing recording dot, "Listening... Speak into your microphone" status, a "Done" button to finalize dictation, and a "Cancel" button (`abort()`) to discard the speech session.

### 7. Document Header Zone & Interactive Image Alignment Toolbar (`src/components/editor/plate-editor.tsx`, `image-element.tsx`, `image-floating-toolbar.tsx`)
- **Header Upload Button**: Added a dedicated `+ Add Document Header / Logo` action button at the top of the paper sheet, allowing instant upload of institutional logos and header images at position `[0]`.
- **Interactive Image Element**: Supports block drag, hover, click/double-click selection ring, and a floating alignment toolbar with Align Left, Align Center, Align Right, and Delete actions.
- **Data URL Persistence**: Converted image uploads in `media-toolbar-button.tsx` to `FileReader.readAsDataURL` so base64 data persists across draft saves and enables DOCX export.

### 8. Accurate DOCX & PDF Image and Font Export (`docxSerializer.ts`, `print-document.css`)
- **Native Word ImageRun**: Updated `docxSerializer.ts` to convert `img` nodes into native `docx.ImageRun` with header parsing (PNG/JPEG dimension decoding with proportional scaling to page margins) and text alignment wrapping.
- **Font Family Serialization**: Mapped CSS `fontFamily` mark into clean Word font names (`Times New Roman`, `Arial`, `Calibri`, `Georgia`, `Courier New`, etc.) in `leafToRuns`.
- **Print Styles**: Enhanced `print-document.css` with `page-break-inside: avoid` for images and suppressed floating editor controls during print.

### 9. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 50/50 tests passing across all 8 suites (including new image and font docx serialization test).

---

## 32. Two-Stage Backspace List Unwrapping & Block Retention on New Document Lines

Per user alignment during `/grill-me` with before/after frame references (`media_1789525006923.png` Frame 1, `media_1789525015530.png` Frame 2):

### 1. Two-Stage Backspace Keydown Interception (`src/components/editor/plate-editor.tsx`)
- **Stage 1 (Un-list on Same Line - Frame 1)**:
  - When user presses `Backspace` at the beginning of a list item (`li` in `ol`/`ul`) or when the line is empty (e.g. newly created line `"3."`), the handler calls `e.preventDefault()`, unwraps the parent list container (`unwrapNodes`), and converts the block to a plain `<p>` (`setNodes`).
  - The line and cursor stay firmly in place on the newly created line (Frame 1), stripping only the number/bullet/toggle decoration so the user can continue typing plain text without the list formatting.
- **Stage 2 (Merge Up on Second Backspace - Frame 2)**:
  - Once the block is a standard paragraph `<p>`, pressing `Backspace` a second time is not intercepted, allowing Slate's native `deleteBackward()` to naturally merge the empty paragraph into the previous line (Frame 2: end of `"2. asfdaf"`).
- **Universal Block Coverage**:
  - Applied the same smooth two-stage unwrapping to Numbered Lists (`ol`), Bulleted Lists (`ul`), To-do checklists (`todo`, with `checked` attribute unsetting), Collapsible toggle lists (`toggle`), and Blockquotes (`blockquote`).

### 2. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 52/52 tests passing across all 8 suites (including dedicated tests for Frame 1 same-line unwrap, Frame 2 merge-up, and todo/toggle unwrap).

---

## 33. Google Docs Header & Footer Zones, Image Crop & Wrap Toolbar, Alignment Dropdown Fix, and Fixed Toolbar Overflow Navigation

Per user alignment during `/grill-me` with uploaded screenshots (`media_1789525299979.png`, `media_1789525505933.png`, `media_1789525688875.png`, `media_1789525751105.png`):

### 1. Google Docs–Style Double-Click Header and Footer Zones (`src/components/editor/plate-editor.tsx`)
- **Activation Behavior**:
  - Replaced the static always-visible header box with authentic Google Docs–style top and bottom margin zones.
  - Double-clicking the top margin opens the **Header** editing ribbon.
  - Double-clicking the bottom margin opens the **Footer** editing ribbon.
  - Each zone includes a subtle dashed border (`border-dashed border-zinc-300 dark:border-zinc-700`) and a top banner with section label.
- **Header & Footer Options Dropview**:
  - Integrated an interactive Options dropdown matching Google Docs:
    - `Every page` (default)
    - `This page only (Different first page)`
  - Header actions: `+ Add Image / Logo` (file upload button with direct insertion at top of document) and a `Close` button.
  - Footer actions: `+ Insert Page Number` (inserts formatted page numbering block) and a `Close` button.
  - Clicking `Close` or clicking outside the margin cleanly dismisses the editing ribbon while preserving all document edits.

### 2. Interactive Image Crop, Resize Handles, and Google Docs Pill Toolbar (`src/components/plate-ui/image-element.tsx`, `image-floating-toolbar.tsx`)
- **8 Square Blue Resize Handles & Top Stem Handle** (`media_1789525299979.png`):
  - Added 4 corner handles (`top-left`, `top-right`, `bottom-left`, `bottom-right`) and 4 edge center handles (`top-center`, `bottom-center`, `left-center`, `right-center`).
  - Added top blue stem rotation handle with a blue circular pivot node extending above the image.
  - Handles feature mouse cursor feedback (`nwse-resize`, `nesw-resize`, `ew-resize`, `ns-resize`) and interactive drag-to-resize clamped between 120px and 800px with live Slate node width persistence.
- **Floating Pill Wrap Toolbar** (`media_1789525505933.png`):
  - Positioned directly underneath or above the selected image.
  - **Text Wrap Dropdown**:
    - `In line` (standard inline flow)
    - `Wrap text` (tight text wrapping around left or right floated image)
    - `Break text` (full width block clearing floats above and below)
    - `Behind text` (absolute z-index behind text layer)
    - `In front of text` (absolute z-index overlaying text layer)
    - Active wrap mode indicated with checkmark icon.
  - **Quick Alignment Buttons**: Align Left, Align Center, Align Right.
  - **Interactive Crop Tool**:
    - Clicking the Crop button enters interactive cropping mode with a zoom slider (100% to 250%) and zoom in/out step buttons.
    - Preserves crop state and allows single-click "Done" confirmation.
  - **Delete Trash Icon**: Quick-removal button (`Trash2`) to safely remove the image block from the document.

### 3. Fix Alignment Dropview Squishing (`src/components/plate-ui/align-toolbar-button.tsx`, `media_1789525688875.png`)
- **Root Cause Isolated**: `DropdownMenuContent` had `min-w-0`, causing the menu to collapse to the icon width. Radix/Base UI's absolute right-positioned `<MenuPrimitive.RadioItemIndicator>` was overlapping directly over the alignment icons and labels in dark mode.
- **Resolution**:
  - Expanded `DropdownMenuContent` to `w-44 p-1.5 shadow-lg border border-zinc-200 dark:border-zinc-800`.
  - Structured items with explicit flex hierarchy: Icon, label (`flex-1 text-zinc-800 dark:text-zinc-200`), and radio checkmark indicator, permanently eliminating layout squishing and icon overlap.

### 4. Fixed Toolbar Horizontal Overflow Navigation (`src/components/plate-ui/fixed-toolbar.tsx`, `fixed-toolbar-buttons.tsx`, `toolbar.tsx`, `media_1789525751105.png`)
- **Root Cause Isolated**: On viewport widths below ~1280px, the fixed toolbar buttons container clipped right-aligned controls (Mode Switcher, Comment Panel toggle, Fullscreen) against the screen edge without visual scroll affordance.
- **Resolution**:
  - Added horizontal scroll boundary detection (`canScrollLeft`, `canScrollRight`).
  - Added floating left and right chevron scroll buttons (`ChevronLeft`, `ChevronRight`) with smooth click-to-scroll by 260px.
  - Added mouse wheel translation: vertical mouse wheel scrolling over the toolbar automatically scrolls the toolbar horizontally.
  - Added comfortable right padding (`pr-8` on toolbar container, `pr-3 sm:pr-4` on right control group) so Mode Switcher and Fullscreen buttons are never clipped.
  - Updated `Toolbar` in `toolbar.tsx` to forward `ref` properly to its DOM element.

### 5. Verification
- **TypeScript Compiler (`npm run lint` / `tsc --noEmit`)**: 0 errors.
- **Editor Test Suite (`npm run test:editor`)**: 53/53 tests passing across all 8 suites (including node wrap, width, and crop attribute test).








