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
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Eye,
  Image as ImageIcon,
  ChevronDown,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Plus,
  Minus,
  Hash,
  Move,
  Crop,
  PanelLeftOpen,
} from 'lucide-react';
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
import { DocumentMenuBar } from './DocumentMenuBar';
import { DocumentOutline } from './DocumentOutline';
import { DocumentCommentsRail } from './DocumentCommentsRail';
import { CommentsDrawer } from './CommentsDrawer';
import { DocumentRuler } from './DocumentRuler';
import { DocumentHeaderZone } from './DocumentHeaderZone';
import { DocumentFooterZone } from './DocumentFooterZone';
import { DocumentStatusBar } from './DocumentStatusBar';
import {
  type DocumentHeaderFooterOptions,
  type HeaderFooterItem,
} from './serializers/docxSerializer';
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
  /** Optional document header and footer configuration */
  headerFooter?: DocumentHeaderFooterOptions;
  /** Header & Footer change callback */
  onHeaderFooterChange?: (headerFooter: DocumentHeaderFooterOptions) => void;
  /** Optional cloud sync status for bottom telemetry bar */
  syncStatus?: 'saved' | 'saving' | 'offline' | 'conflict' | 'error';
  /** Optional document title for export */
  documentTitle?: string;
  /** Actions and callbacks */
  onSaveVersion?: () => void;
  onShowHistory?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  /** Top Document Identity / Action Bar slot (can accept a render function passing menuBar, isFullscreen, onToggleFullscreen) */
  topBar?:
    | React.ReactNode
    | ((props: {
        menuBar: React.ReactNode;
        isFullscreen?: boolean;
        onToggleFullscreen?: () => void;
      }) => React.ReactNode);
  /** Whether to show the bottom telemetry status bar (default: false) */
  showStatusBar?: boolean;
  /** Whether to show the horizontal document ruler (default: false) */
  showRuler?: boolean;
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
  getHeaderFooter: () => DocumentHeaderFooterOptions;
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
      headerFooter: externalHeaderFooter,
      onHeaderFooterChange,
      syncStatus = 'saved',
      documentTitle,
      onSaveVersion,
      onShowHistory,
      onExportDocx,
      onExportPdf,
      onDuplicate,
      onRename,
      topBar,
      showStatusBar = false,
      showRuler: initialShowRuler = false,
    },
    ref
  ) {
    const [plateReady, setPlateReady] = useState(false);
    const [PlateComp, setPlateComp] = useState<React.ComponentType<any> | null>(null);
    const [createEditorFn, setCreateEditorFn] = useState<((opts: any) => any) | null>(null);

    // View mode, fullscreen, zoom, outline, ruler, and comments state
    const [internalMode, setInternalMode] = useState<EditorMode>('editing');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [internalComments, setInternalComments] = useState<EditorComment[]>([]);
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);
    const [showCommentsRail, setShowCommentsRail] = useState(() => (comments && comments.length > 0) || false);
    const [showOutline, setShowOutline] = useState(false);
    const [showRuler, setShowRuler] = useState(initialShowRuler);
    const [drawerQuote, setDrawerQuote] = useState('');
    const [currentWordCount, setCurrentWordCount] = useState(() => countWordsInContent(initialContent));

    // Google Docs style Header & Footer editing state
    const [activeHeaderFooter, setActiveHeaderFooter] = useState<'header' | 'footer' | null>(null);
    const [headerState, setHeaderState] = useState<HeaderFooterItem>(() => ({
      image: externalHeaderFooter?.header?.image || null,
      text: externalHeaderFooter?.header?.text || '',
      textAlign: externalHeaderFooter?.header?.textAlign || 'center',
      scope: externalHeaderFooter?.header?.scope || 'every_page',
    }));
    const [footerState, setFooterState] = useState<HeaderFooterItem>(() => ({
      image: externalHeaderFooter?.footer?.image || null,
      text: externalHeaderFooter?.footer?.text || '',
      pageNumber: externalHeaderFooter?.footer?.pageNumber ?? false,
      textAlign: externalHeaderFooter?.footer?.textAlign || 'center',
      scope: externalHeaderFooter?.footer?.scope || 'every_page',
    }));

    const handleFormatHeaderFooter = useCallback((format: Partial<HeaderFooterItem>) => {
      if (activeHeaderFooter === 'header') {
        setHeaderState((prev) => ({ ...prev, ...format }));
      } else if (activeHeaderFooter === 'footer') {
        setFooterState((prev) => ({ ...prev, ...format }));
      }
    }, [activeHeaderFooter]);

    // ── Google Docs Header / Footer Escape Key Listener ─────────────────────
    useEffect(() => {
      if (!activeHeaderFooter) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setActiveHeaderFooter(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeHeaderFooter]);

    const headerFooterRef = useRef<DocumentHeaderFooterOptions>({
      header: headerState,
      footer: footerState,
    });

    const onHeaderFooterChangeRef = useRef(onHeaderFooterChange);
    useEffect(() => {
      onHeaderFooterChangeRef.current = onHeaderFooterChange;
    }, [onHeaderFooterChange]);

    const isFirstMountRef = useRef(true);
    useEffect(() => {
      headerFooterRef.current = { header: headerState, footer: footerState };
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      onHeaderFooterChangeRef.current?.({ header: headerState, footer: footerState });
    }, [headerState, footerState]);

    const activeMode: EditorMode = readOnly ? 'viewing' : (mode ?? internalMode);
    const isEffectivelyReadOnly = readOnly || activeMode === 'viewing';

    const editorRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<object[]>(initialContent);
    const editorInstanceRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const zoomTimerRef = useRef<any>(null);

    // ── Fullscreen Escape Listener & Ancestor Scroll Lock ───────────────────
    useEffect(() => {
      if (!isFullscreen) {
        document.body.removeAttribute('data-editor-fullscreen');
        return;
      }

      document.body.setAttribute('data-editor-fullscreen', 'true');

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (activeHeaderFooter) {
            // Handled by header/footer escape listener, preserve fullscreen
            return;
          }
          setIsFullscreen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Collect and lock all ancestor scroll containers (removes "the big one" native scrollbar)
      const scrollParents: { el: HTMLElement; overflowY: string }[] = [];
      let el: HTMLElement | null = wrapperRef.current?.parentElement ?? null;
      while (el && el !== document.body) {
        const computed = window.getComputedStyle(el);
        if (computed.overflowY === 'auto' || computed.overflowY === 'scroll') {
          scrollParents.push({ el, overflowY: el.style.overflowY });
          el.style.overflowY = 'hidden';
        }
        el = el.parentElement;
      }

      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.removeAttribute('data-editor-fullscreen');
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        scrollParents.forEach(({ el, overflowY }) => {
          el.style.overflowY = overflowY;
        });
      };
    }, [isFullscreen]);

    // ── Mousewheel scroll zoom inside canvas ─────────────────────────────────
    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;

      const handleWheel = (e: WheelEvent) => {
        // Zoom strictly if Ctrl/Cmd is held (like Google Docs / Word Online)
        const isCtrl = e.ctrlKey || e.metaKey;

        if (isCtrl) {
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
        getHeaderFooter: () => headerFooterRef.current,
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
                } else if (block.type === 'todo') {
                  e.preventDefault();
                  ed.tf.splitNodes({ always: true });
                  ed.tf.setNodes({ checked: false }, { match: (n: any) => n.type === 'todo' });
                  return;
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
        const count = countWordsInContent(value);
        setCurrentWordCount(count);
        onChange?.(value, count);
      },
      [onChange]
    );

    const headerInputRef = useRef<HTMLInputElement>(null);
    const footerInputRef = useRef<HTMLInputElement>(null);

    const handleHeaderImageUpload = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const img = new Image();
          img.onload = () => {
            const naturalW = img.naturalWidth || 240;
            const naturalH = img.naturalHeight || 60;
            const maxW = 816;
            const maxH = 200;
            let initialWidth = naturalW;
            let initialHeight = naturalH;

            // Only scale down proportionally if exceeding printable track or max height
            if (initialWidth > maxW) {
              const ratio = maxW / initialWidth;
              initialWidth = maxW;
              initialHeight = Math.round(initialHeight * ratio);
            }
            if (initialHeight > maxH) {
              const ratio = maxH / initialHeight;
              initialHeight = maxH;
              initialWidth = Math.round(initialWidth * ratio);
            }

            setHeaderState((prev) => ({
              ...prev,
              image: {
                url: dataUrl,
                originalUrl: dataUrl,
                name: file.name,
                align: prev.image?.align || 'left',
                width: initialWidth,
                height: initialHeight,
                offsetPercent: prev.image?.offsetPercent ?? 0,
              },
            }));
          };
          img.onerror = () => {
            setHeaderState((prev) => ({
              ...prev,
              image: {
                url: dataUrl,
                originalUrl: dataUrl,
                name: file.name,
                align: prev.image?.align || 'left',
                width: prev.image?.width || 320,
                height: prev.image?.height || 80,
                offsetPercent: prev.image?.offsetPercent ?? 0,
              },
            }));
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      },
      []
    );

    const handleFooterImageUpload = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const img = new Image();
          img.onload = () => {
            const naturalW = img.naturalWidth || 200;
            const naturalH = img.naturalHeight || 48;
            const maxW = 816;
            const maxH = 140;
            let initialWidth = naturalW;
            let initialHeight = naturalH;

            // Only scale down proportionally if exceeding printable track or max height
            if (initialWidth > maxW) {
              const ratio = maxW / initialWidth;
              initialWidth = maxW;
              initialHeight = Math.round(initialHeight * ratio);
            }
            if (initialHeight > maxH) {
              const ratio = maxH / initialHeight;
              initialHeight = maxH;
              initialWidth = Math.round(initialWidth * ratio);
            }

            setFooterState((prev) => ({
              ...prev,
              image: {
                url: dataUrl,
                originalUrl: dataUrl,
                name: file.name,
                align: prev.image?.align || 'left',
                width: initialWidth,
                height: initialHeight,
                offsetPercent: prev.image?.offsetPercent ?? 0,
              },
            }));
          };
          img.onerror = () => {
            setFooterState((prev) => ({
              ...prev,
              image: {
                url: dataUrl,
                originalUrl: dataUrl,
                name: file.name,
                align: prev.image?.align || 'left',
                width: prev.image?.width || 240,
                height: prev.image?.height || 60,
                offsetPercent: prev.image?.offsetPercent ?? 0,
              },
            }));
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      },
      []
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
          ref={wrapperRef}
          data-editor-fullscreen={isFullscreen ? 'true' : 'false'}
          className={cn(
            'plate-editor-wrapper relative flex flex-col rounded-xl overflow-hidden shadow-xs transition-all border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900',
            isFullscreen
              ? '!fixed !inset-0 !z-[100] !w-full !h-full !max-w-none !max-h-none rounded-none bg-zinc-100 dark:bg-zinc-950 border-none m-0'
              : 'flex-1 min-h-0 h-full max-h-full',
            className,
            isFullscreen && '!fixed !inset-0 !z-[100] !w-full !h-full !max-w-none !max-h-none'
          )}
        >
          {/* Top Document Identity / Menu Bar Row */}
          {(() => {
            const menuBarElement = (
              <DocumentMenuBar
                editor={editor}
                documentTitle={documentTitle || 'Untitled Document'}
                isLocked={isEffectivelyReadOnly}
                isReviewer={currentUserRole !== 'student'}
                mode={activeMode}
                onModeChange={(m) => {
                  setInternalMode(m);
                  onModeChange?.(m);
                }}
                showOutline={showOutline}
                onToggleOutline={() => setShowOutline((prev) => !prev)}
                showComments={showCommentsRail}
                onToggleComments={() => setShowCommentsRail((prev) => !prev)}
                showRuler={showRuler}
                onToggleRuler={() => setShowRuler((prev) => !prev)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                wordCount={currentWordCount}
                onSaveVersion={onSaveVersion}
                onShowHistory={onShowHistory}
                onExportDocx={onExportDocx}
                onExportPdf={onExportPdf}
                onDuplicate={onDuplicate}
                onRename={onRename}
                onOpenHeaderFooter={(type) => setActiveHeaderFooter(type)}
                onOpenImagePicker={() => {
                  const url = window.prompt('Enter image URL:');
                  if (url) {
                    editor?.tf?.insertNodes?.([{ type: 'img', url, children: [{ text: '' }] }]);
                  }
                }}
              />
            );

            if (typeof topBar === 'function') {
              return topBar({
                menuBar: menuBarElement,
                isFullscreen,
                onToggleFullscreen: () => setIsFullscreen((prev) => !prev),
              });
            }

            return (
              <>
                {topBar}
                <div className="w-full px-4 py-0.5 bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60 shrink-0">
                  {menuBarElement}
                </div>
              </>
            );
          })()}

          {/* Google Docs Full-Width Formatting Toolbar Bar */}
          <div className="w-full bg-[#f9fbfd] dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800/80 px-3 py-1 flex items-center shrink-0">
            <FixedToolbar className="w-full">
              <FixedToolbarButtons
                editor={editor}
                mode={activeMode}
                onModeChange={(m) => {
                  setInternalMode(m);
                  onModeChange?.(m);
                }}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                comments={comments ?? internalComments}
                onOpenComments={() => setShowCommentsRail((prev) => !prev)}
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
                documentTitle={documentTitle}
                headerFooter={{ header: headerState, footer: footerState }}
                activeHeaderFooter={activeHeaderFooter}
                onFormatHeaderFooter={handleFormatHeaderFooter}
                onUploadHeaderFooterImage={() => {
                  if (activeHeaderFooter === 'header') {
                    headerInputRef.current?.click();
                  } else if (activeHeaderFooter === 'footer') {
                    footerInputRef.current?.click();
                  }
                }}
              />
            </FixedToolbar>
          </div>

          {/* Mode banner indicator */}
          {(activeMode === 'suggesting' || activeMode === 'suggestion') && (
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

          {/* ─── Google Docs Workspace (Outline + Paper Canvas + Comments Rail) ─── */}
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
            {/* Left Collapsible Outline */}
            <DocumentOutline
              content={contentRef.current}
              documentTitle={documentTitle || 'Untitled Document'}
              isOpen={showOutline}
              onClose={() => setShowOutline(false)}
            />

            {/* Subtle button to reopen outline if closed */}
            {!showOutline && (
              <button
                type="button"
                onClick={() => setShowOutline(true)}
                title="Show document outline"
                aria-label="Show document outline"
                className="absolute top-3 left-3 z-30 p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable canvas containing the paper document sheet */}
            <div
              ref={canvasRef}
              data-editor-canvas="true"
              className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950"
            >
              <EditorContainer
                data-editor-paper-scroll="true"
                variant="default"
                className={cn(
                  'flex-1 min-h-0 overflow-y-auto editor-scrollbar bg-[#f0f4f9] dark:bg-zinc-950 p-4 md:p-8 pb-28 md:pb-36',
                  zoomLevel > 100 && 'overflow-x-auto'
                )}
              >
              <div
                data-paper-zoom-stage="true"
                style={{
                  transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                  transformOrigin: 'top center',
                  transition: 'transform 0.1s ease-out',
                  width: zoomLevel > 100 ? `${zoomLevel}%` : '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* ─── Google Docs Horizontal Ruler ──────────────────────────── */}
                {showRuler && (
                  <DocumentRuler
                    width={1008}
                    leftMargin={96}
                    rightMargin={96}
                    zoom={zoomLevel}
                    className="mb-0"
                  />
                )}

                {/* ─── Authentic 10.5" × 11" Paper Sheet (+2 inches width expansion) ─── */}
                <div
                  className={cn(
                    'plate-paper-sheet w-[1008px] max-w-[1008px] min-h-[1056px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_1px_4px_rgba(0,0,0,0.12),0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_36px_rgba(0,0,0,0.7)] rounded-[2px] px-[96px] pt-0 pb-0 flex flex-col relative transition-all print:bg-white print:text-black print:border-none print:shadow-none',
                    activeHeaderFooter && 'ring-1 ring-primary/40 shadow-md'
                  )}
                >
                  {/* Hidden Header & Footer File Inputs */}
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeaderImageUpload}
                  />
                  <input
                    ref={footerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFooterImageUpload}
                  />

                  {/* ─── Google Docs Permanent 1-inch Header Zone ────────────── */}
                  <DocumentHeaderZone
                    headerState={headerState}
                    setHeaderState={setHeaderState}
                    footerState={footerState}
                    setFooterState={setFooterState}
                    isActive={activeHeaderFooter === 'header'}
                    onToggleActive={(active) => setActiveHeaderFooter(active ? 'header' : null)}
                    isReadOnly={isEffectivelyReadOnly}
                    headerInputRef={headerInputRef}
                  />

                  {/* ─── Slate Document Body (Seamlessly Inside Paper Sheet) ──────── */}
                  <div
                    onClick={() => {
                      if (activeHeaderFooter) {
                        setActiveHeaderFooter(null);
                      }
                    }}
                    className={cn(
                      'flex-1 flex flex-col',
                      activeHeaderFooter && 'opacity-60 transition-opacity cursor-pointer'
                    )}
                  >
                    <Editor
                      ref={editorRef}
                      variant="none"
                      placeholder={placeholder}
                      readOnly={isEffectivelyReadOnly}
                      spellCheck
                      autoFocus={!isEffectivelyReadOnly}
                      onKeyDown={handleKeyDown}
                      className="flex-1 w-full min-h-[768px] p-0 border-0 shadow-none rounded-none focus-visible:outline-none text-zinc-900 dark:text-zinc-100 selection:bg-primary/20 selection:text-zinc-900 dark:selection:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  {/* ─── Google Docs Permanent 1-inch Footer Zone ────────────── */}
                  <DocumentFooterZone
                    footerState={footerState}
                    setFooterState={setFooterState}
                    headerState={headerState}
                    setHeaderState={setHeaderState}
                    isActive={activeHeaderFooter === 'footer'}
                    onToggleActive={(active) => setActiveHeaderFooter(active ? 'footer' : null)}
                    isReadOnly={isEffectivelyReadOnly}
                    footerInputRef={footerInputRef}
                  />
                </div>
              </div>
            </EditorContainer>

            {/* ─── Bottom Telemetry Status Bar (Optional, disabled by default) ── */}
            {showStatusBar && (
              <DocumentStatusBar
                pageCount={Math.max(1, Math.ceil(currentWordCount / 350))}
                currentPage={1}
                wordCount={currentWordCount}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                syncStatus={syncStatus}
                isReadOnly={isEffectivelyReadOnly}
              />
            )}

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

            {/* Right Docked Comments Rail */}
            <DocumentCommentsRail
              open={showCommentsRail}
              onClose={() => {
                setShowCommentsRail(false);
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

          {/* Floating formatting toolbar on text selection */}
          {!isEffectivelyReadOnly && (
            <FloatingToolbar
              editor={editor}
              onAddComment={(selectedText) => {
                setDrawerQuote(selectedText);
                setShowCommentsRail(true);
              }}
            />
          )}
        </div>
      </PlateComp>
    );
  }
);

PlateEditor.displayName = 'PlateEditor';

export default PlateEditor;
