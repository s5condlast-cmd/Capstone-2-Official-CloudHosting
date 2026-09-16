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
import { Sparkles, Eye, Image as ImageIcon, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { editorPlugins } from './editor-kit';
import { EditorContainer, Editor } from '@/src/components/plate-ui/editor';
import { FixedToolbar } from '@/src/components/plate-ui/fixed-toolbar';
import {
  FixedToolbarButtons,
  type EditorMode,
  type EditorComment,
} from '@/src/components/plate-ui/fixed-toolbar-buttons';
import { FloatingToolbar } from '@/src/components/plate-ui/floating-toolbar';
import { CommentsDrawer } from './CommentsDrawer';
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
  /** Comment resolved callback */
  onResolveComment?: (id: string) => void;
  /** Comment un-resolved callback */
  onUnresolveComment?: (id: string) => void;
  /** Comment deleted callback */
  onDeleteComment?: (id: string) => void;
  /** Logged-in user role for comment badge */
  currentUserRole?: 'student' | 'adviser' | 'supervisor' | 'admin';
  /** Logged-in user name for comment author */
  currentUserName?: string;
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
      placeholder = 'Start writing your document...',
      mode,
      onModeChange,
      comments,
      onAddComment,
      onResolveComment,
      onUnresolveComment,
      onDeleteComment,
      currentUserRole = 'student',
      currentUserName = 'Student',
    },
    ref
  ) {
    const [plateReady, setPlateReady] = useState(false);
    const [PlateComp, setPlateComp] = useState<React.ComponentType<any> | null>(null);
    const [createEditorFn, setCreateEditorFn] = useState<((opts: any) => any) | null>(null);

    // View mode, fullscreen, zoom, and comments drawer state
    const [internalMode, setInternalMode] = useState<EditorMode>('editing');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [internalComments, setInternalComments] = useState<EditorComment[]>([]);
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);
    const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
    const [drawerQuote, setDrawerQuote] = useState('');

    // Google Docs style Header & Footer editing state
    const [activeHeaderFooter, setActiveHeaderFooter] = useState<'header' | 'footer' | null>(null);
    const [headerScope, setHeaderScope] = useState<'every_page' | 'first_page_only'>('every_page');
    const [footerScope, setFooterScope] = useState<'every_page' | 'first_page_only'>('every_page');

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

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        // ── ENTER: Exit empty lists/toggles to normal paragraph 'p' ───────
        if (e.key === 'Enter' && !e.shiftKey) {
          const ed = editor;
          if (ed?.selection && ed.api) {
            try {
              const entry = ed.api.block();
              if (entry) {
                const [block, path] = entry;
                const text = ed.api.string(path) || '';

                // 1. If inside an empty list item or empty toggle/todo, exit to normal paragraph 'p'
                if (text.trim() === '') {
                  if (
                    block.type === 'li' ||
                    block.type === 'lic' ||
                    ed.api.above({ match: (n: any) => n.type === 'ul' || n.type === 'ol' })
                  ) {
                    e.preventDefault();
                    ed.tf.unwrapNodes({ match: (n: any) => n.type === 'ul' || n.type === 'ol', split: true });
                    ed.tf.setNodes({ type: 'p' }, { match: (n: any) => n.type === 'li' || n.type === 'lic' });
                    return;
                  }
                  if (block.type === 'toggle' || block.type === 'todo') {
                    e.preventDefault();
                    ed.tf.setNodes({ type: 'p' }, { at: path });
                    if ((block as any).checked !== undefined) {
                      ed.tf.unsetNodes(['checked'], { at: path });
                    }
                    return;
                  }
                } else if (block.type === 'toggle') {
                  // 2. If inside a toggle with text and user presses Enter, create a normal paragraph below it
                  e.preventDefault();
                  ed.tf.insertNodes({ type: 'p', children: [{ text: '' }] });
                  return;
                }
              }
            } catch {
              // non-fatal fallback
            }
          }
        }

        // ── BACKSPACE: First Backspace un-lists to paragraph 'p' on same line; second merges up ──
        if (e.key === 'Backspace' && !e.shiftKey) {
          const ed = editor;
          if (ed?.selection && ed.api) {
            try {
              const { anchor, focus } = ed.selection;
              const isCollapsed =
                anchor.path.join(',') === focus.path.join(',') &&
                anchor.offset === focus.offset;

              if (isCollapsed) {
                const entry = ed.api.block();
                if (entry) {
                  const [block, path] = entry;
                  const text = ed.api.string(path) || '';
                  const isAtStart =
                    anchor.offset === 0 ||
                    text.trim() === '' ||
                    (typeof ed.api.isStart === 'function' && ed.api.isStart(anchor, path));

                  if (isAtStart) {
                    // 1. If at start of a list item, unwrap it to a normal paragraph on this line
                    if (
                      block.type === 'li' ||
                      block.type === 'lic' ||
                      ed.api.above({ match: (n: any) => n.type === 'ul' || n.type === 'ol' })
                    ) {
                      e.preventDefault();
                      ed.tf.unwrapNodes({
                        match: (n: any) => n.type === 'ul' || n.type === 'ol',
                        split: true,
                      });
                      ed.tf.setNodes(
                        { type: 'p' },
                        { match: (n: any) => n.type === 'li' || n.type === 'lic' }
                      );
                      return;
                    }

                    // 2. If at start of a toggle or todo checklist, convert to normal paragraph
                    if (block.type === 'toggle' || block.type === 'todo') {
                      e.preventDefault();
                      ed.tf.setNodes({ type: 'p' }, { at: path });
                      if ((block as any).checked !== undefined) {
                        ed.tf.unsetNodes(['checked'], { at: path });
                      }
                      return;
                    }

                    // 3. If at start of a blockquote, convert to normal paragraph
                    if (block.type === 'blockquote') {
                      e.preventDefault();
                      ed.tf.setNodes({ type: 'p' }, { at: path });
                      return;
                    }
                  }
                }
              }
            } catch {
              // non-fatal fallback
            }
          }
        }
      },
      [editor]
    );

    const handleChange = useCallback(
      ({ value }: { value: object[] }) => {
        contentRef.current = value;
        onChange?.(value, countWordsInContent(value));
      },
      [onChange]
    );

    const headerInputRef = useRef<HTMLInputElement>(null);

    const handleHeaderImageUpload = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          try {
            editor?.tf?.insertNodes?.(
              [
                {
                  type: 'img',
                  url: dataUrl,
                  name: file.name,
                  align: 'center',
                  children: [{ text: '' }],
                },
              ],
              { at: [0] }
            );
            editor?.tf?.focus?.();
          } catch {
            // non-fatal
          }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      },
      [editor]
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
      <PlateComp editor={editor} onValueChange={handleChange} readOnly={isEffectivelyReadOnly}>
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
              onOpenComments={() => setShowCommentsDrawer((prev) => !prev)}
              onAddComment={(t, s) => {
                const newC: EditorComment = {
                  id: crypto.randomUUID(),
                  author: currentUserName || 'Student',
                  authorRole: currentUserRole || 'student',
                  text: t,
                  createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  selectedText: s,
                };
                setInternalComments((prev) => [newC, ...prev]);
                onAddComment?.(t, s);
              }}
              onResolveComment={(id) => {
                setInternalComments((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, resolved: true } : c))
                );
                onResolveComment?.(id);
              }}
            />
          </FixedToolbar>

          {/* Mode banner indicator */}
          {activeMode === 'suggesting' && (
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
                <div className="w-full max-w-[850px] flex flex-col items-center">
                  {/* Hidden Header File Input */}
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeaderImageUpload}
                  />

                  {/* Google Docs Style Header Zone */}
                  {!isEffectivelyReadOnly && (
                    <div
                      onDoubleClick={() => setActiveHeaderFooter((prev) => (prev === 'header' ? null : 'header'))}
                      className={cn(
                        'w-full transition-all select-none',
                        activeHeaderFooter === 'header'
                          ? 'mb-4 border-b-2 border-blue-500 pb-2.5'
                          : 'pt-2 pb-1.5 border-b border-transparent hover:border-dashed hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group/header'
                      )}
                    >
                      {activeHeaderFooter === 'header' ? (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Header
                            </span>
                            <button
                              type="button"
                              onClick={() => headerInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-primary" />
                              <span>+ Add Image / Logo</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Options Dropview: This page only vs Every page */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-xs cursor-pointer"
                                >
                                  <span>{headerScope === 'every_page' ? 'Every page' : 'This page only'}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
                                <DropdownMenuItem
                                  onClick={() => setHeaderScope('every_page')}
                                  className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                                >
                                  <span>Every page</span>
                                  {headerScope === 'every_page' && <Check className="w-3.5 h-3.5 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setHeaderScope('first_page_only')}
                                  className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                                >
                                  <span>This page only (Different first page)</span>
                                  {headerScope === 'first_page_only' && <Check className="w-3.5 h-3.5 text-primary" />}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                              type="button"
                              onClick={() => setActiveHeaderFooter(null)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Close</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 opacity-0 group-hover/header:opacity-100 transition-opacity">
                          <span>Double-click to edit Header</span>
                          <span>{headerScope === 'every_page' ? 'Every page' : 'This page only'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Editor
                    ref={editorRef}
                    variant="demo"
                    placeholder={placeholder}
                    readOnly={isEffectivelyReadOnly}
                    spellCheck
                    autoFocus={!isEffectivelyReadOnly}
                    onKeyDown={handleKeyDown}
                  />

                  {/* Google Docs Style Footer Zone */}
                  {!isEffectivelyReadOnly && (
                    <div
                      onDoubleClick={() => setActiveHeaderFooter((prev) => (prev === 'footer' ? null : 'footer'))}
                      className={cn(
                        'w-full transition-all select-none',
                        activeHeaderFooter === 'footer'
                          ? 'mt-4 border-t-2 border-blue-500 pt-2.5'
                          : 'mt-2 pt-1.5 pb-2 border-t border-transparent hover:border-dashed hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group/footer'
                      )}
                    >
                      {activeHeaderFooter === 'footer' ? (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Footer
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const len = (editor?.children as any[])?.length || 0;
                                editor?.tf?.insertNodes?.(
                                  [{ type: 'p', align: 'center', children: [{ text: 'Page 1 of 1' }] }],
                                  { at: [len] }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors cursor-pointer"
                            >
                              <span>+ Insert Page Number</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Options Dropview: This page only vs Every page */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-xs cursor-pointer"
                                >
                                  <span>{footerScope === 'every_page' ? 'Every page' : 'This page only'}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
                                <DropdownMenuItem
                                  onClick={() => setFooterScope('every_page')}
                                  className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                                >
                                  <span>Every page</span>
                                  {footerScope === 'every_page' && <Check className="w-3.5 h-3.5 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setFooterScope('first_page_only')}
                                  className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                                >
                                  <span>This page only (Different first page)</span>
                                  {footerScope === 'first_page_only' && <Check className="w-3.5 h-3.5 text-primary" />}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                              type="button"
                              onClick={() => setActiveHeaderFooter(null)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Close</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 opacity-0 group-hover/footer:opacity-100 transition-opacity">
                          <span>Double-click to edit Footer</span>
                          <span>{footerScope === 'every_page' ? 'Every page' : 'This page only'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
          {!isEffectivelyReadOnly && (
            <FloatingToolbar
              editor={editor}
              onAddComment={(selectedText) => {
                setDrawerQuote(selectedText);
                setShowCommentsDrawer(true);
              }}
            />
          )}

          {/* Comments and Feedback Side Panel Drawer */}
          <CommentsDrawer
            open={showCommentsDrawer}
            onClose={() => {
              setShowCommentsDrawer(false);
              setDrawerQuote('');
            }}
            comments={comments ?? internalComments}
            onAddComment={(t, s) => {
              const newC: EditorComment = {
                id: crypto.randomUUID(),
                author: currentUserName || 'Student',
                authorRole: currentUserRole || 'student',
                text: t,
                createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                selectedText: s,
              };
              setInternalComments((prev) => [newC, ...prev]);
              onAddComment?.(t, s);
            }}
            onResolveComment={(id) => {
              setInternalComments((prev) =>
                prev.map((c) => (c.id === id ? { ...c, resolved: true } : c))
              );
              onResolveComment?.(id);
            }}
            onUnresolveComment={(id) => {
              setInternalComments((prev) =>
                prev.map((c) => (c.id === id ? { ...c, resolved: false } : c))
              );
              onUnresolveComment?.(id);
            }}
            onDeleteComment={(id) => {
              setInternalComments((prev) => prev.filter((c) => c.id !== id));
              onDeleteComment?.(id);
            }}
            selectedText={drawerQuote}
            onClearSelectedText={() => setDrawerQuote('')}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
          />
        </div>
      </PlateComp>
    );
  }
);

PlateEditor.displayName = 'PlateEditor';

export default PlateEditor;
