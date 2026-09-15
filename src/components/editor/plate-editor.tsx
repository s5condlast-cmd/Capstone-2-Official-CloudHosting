/**
 * plate-editor.tsx
 * Core Plate.js v53 editor component matching the official Plate template layout.
 *
 * Implements:
 * - FixedToolbar with FixedToolbarButtons (Undo, Redo, Turn Into, Marks, Align, Lists, Table, Links)
 * - EditorContainer (scrollable paper canvas)
 * - Editor variant="demo" (authentic centered document page sheet with drop shadow and margins)
 * - FloatingToolbar (contextual floating action bar on text selection)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { editorPlugins } from './editor-kit';
import { EditorContainer, Editor } from '@/src/components/plate-ui/editor';
import { FixedToolbar } from '@/src/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/src/components/plate-ui/fixed-toolbar-buttons';
import { FloatingToolbar } from '@/src/components/plate-ui/floating-toolbar';
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
    placeholder = 'Type your document content here…',
  },
  ref
) {
  const [plateReady, setPlateReady] = useState(false);
  const [PlateComp, setPlateComp] = useState<React.ComponentType<any> | null>(null);
  const [createEditorFn, setCreateEditorFn] = useState<((opts: any) => any) | null>(null);

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
        {/* Fixed top toolbar matching official Plate layout */}
        {!readOnly && (
          <FixedToolbar>
            <FixedToolbarButtons editor={editor} />
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
        {!readOnly && <FloatingToolbar editor={editor} />}
      </div>
    </PlateComp>
  );
});

PlateEditor.displayName = 'PlateEditor';

export default PlateEditor;
