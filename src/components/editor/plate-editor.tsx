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
import { Sparkles, Eye } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { editorPlugins } from './editor-kit';
import { EditorContainer, Editor } from '@/src/components/plate-ui/editor';
import { FixedToolbar } from '@/src/components/plate-ui/fixed-toolbar';
import {
  FixedToolbarButtons,
  type EditorMode,
  type EditorComment,
} from '@/src/components/plate-ui/fixed-toolbar-buttons';
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
  /** Active editing mode: 'editing', 'viewing', or 'suggestion' */
  mode?: EditorMode;
  /** Mode change callback */
  onModeChange?: (mode: EditorMode) => void;
  /** Comments list */
  comments?: EditorComment[];
  /** Comment added callback */
  onAddComment?: (text: string, selectedText?: string) => void;
  /** Comment resolved/deleted callback */
  onResolveComment?: (id: string) => void;
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
      mode,
      onModeChange,
      comments,
      onAddComment,
      onResolveComment,
    },
    ref
  ) {
    const [plateReady, setPlateReady] = useState(false);
    const [PlateComp, setPlateComp] = useState<React.ComponentType<any> | null>(null);
    const [createEditorFn, setCreateEditorFn] = useState<((opts: any) => any) | null>(null);

    // View mode, fullscreen, and zoom state
    const [internalMode, setInternalMode] = useState<EditorMode>('editing');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [internalComments, setInternalComments] = useState<EditorComment[]>([]);
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);

    const activeMode: EditorMode = readOnly ? 'viewing' : (mode ?? internalMode);
    const isEffectivelyReadOnly = readOnly || activeMode === 'viewing';

    const editorRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<object[]>(initialContent);
    const editorInstanceRef = useRef<any>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const zoomTimerRef = useRef<any>(null);

    // ── Fullscreen Escape Listener ──────────────────────────────────────────
    useEffect(() => {
      if (!isFullscreen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // ── Mousewheel scroll zoom inside canvas ─────────────────────────────────
    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;

      const handleWheel = (e: WheelEvent) => {
        // Zoom if Ctrl/Cmd is held OR if cursor is over the canvas workspace outside editable text
        const isCtrl = e.ctrlKey || e.metaKey;
        const target = e.target as HTMLElement | null;
        const isInsideText = target?.closest?.('[data-editor-content]');

        if (isCtrl || !isInsideText) {
          e.preventDefault();
          const step = 5;
          const delta = e.deltaY > 0 ? -step : step;
          setZoomLevel((prev) => Math.min(200, Math.max(50, Math.round((prev + delta) / step) * step)));

          setShowZoomIndicator(true);
          if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
          zoomTimerRef.current = setTimeout(() => {
            setShowZoomIndicator(false);
          }, 1800);
        }
      };

      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        el.removeEventListener('wheel', handleWheel);
        if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
      };
    }, []);

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
      <PlateComp editor={editor} onChange={handleChange} readOnly={isEffectivelyReadOnly}>
        <div
          className={cn(
            'plate-editor-wrapper relative flex flex-col rounded-xl overflow-hidden shadow-xs transition-all',
            isFullscreen && 'fixed inset-0 z-[100] w-screen h-screen rounded-none bg-zinc-100 dark:bg-zinc-950',
            className
          )}
        >
          {/* Fixed top toolbar matching official Plate layout */}
          <FixedToolbar>
            <FixedToolbarButtons
              editor={editor}
              mode={activeMode}
              onModeChange={(m) => {
                setInternalMode(m);
                onModeChange?.(m);
              }}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              comments={comments ?? internalComments}
              onAddComment={(t, s) => {
                const newC: EditorComment = {
                  id: crypto.randomUUID(),
                  author: 'Student',
                  text: t,
                  createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  selectedText: s,
                };
                setInternalComments((prev) => [newC, ...prev]);
                onAddComment?.(t, s);
              }}
              onResolveComment={(id) => {
                setInternalComments((prev) => prev.filter((c) => c.id !== id));
                onResolveComment?.(id);
              }}
            />
          </FixedToolbar>

          {/* Mode banner indicator */}
          {activeMode === 'suggestion' && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-medium shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggestion Mode: Select text and click the comment icon to suggest changes or leave feedback notes.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInternalMode('editing');
                  onModeChange?.('editing');
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] font-semibold"
              >
                Exit to Editing
              </button>
            </div>
          )}

          {activeMode === 'viewing' && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                <span>Viewing Mode: Document is read-only. Switch mode to make edits.</span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setInternalMode('editing');
                    onModeChange?.('editing');
                  }}
                  className="text-primary hover:underline text-[11px] font-semibold"
                >
                  Switch to Editing
                </button>
              )}
            </div>
          )}

          {/* Scrollable canvas containing the paper document sheet */}
          <div ref={canvasRef} className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            <EditorContainer
              variant={isFullscreen ? 'fullWidth' : 'demo'}
              className={cn(
                'flex-1 overflow-y-auto p-4 md:p-8',
                zoomLevel > 100 && 'overflow-x-auto'
              )}
            >
              <div
                style={{
                  transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                  transformOrigin: 'top center',
                  transition: 'transform 0.1s ease-out',
                  width: zoomLevel > 100 ? `${zoomLevel}%` : '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Editor
                  ref={editorRef}
                  variant="demo"
                  placeholder={placeholder}
                  readOnly={isEffectivelyReadOnly}
                  spellCheck
                  autoFocus={!isEffectivelyReadOnly}
                />
              </div>
            </EditorContainer>

            {/* Floating subtle zoom indicator */}
            {showZoomIndicator && (
              <div
                className={cn(
                  'absolute bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full',
                  'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 shadow-md',
                  'text-xs font-semibold backdrop-blur-sm select-none'
                )}
              >
                <span>Zoom: {zoomLevel}%</span>
                {zoomLevel !== 100 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(100);
                      setShowZoomIndicator(false);
                    }}
                    className="text-[11px] px-1.5 py-0.5 rounded bg-white/20 dark:bg-zinc-900/20 hover:bg-white/30 dark:hover:bg-zinc-900/30 font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Floating formatting toolbar on text selection */}
          {!isEffectivelyReadOnly && <FloatingToolbar editor={editor} />}
        </div>
      </PlateComp>
    );
  }
);

PlateEditor.displayName = 'PlateEditor';

export default PlateEditor;
