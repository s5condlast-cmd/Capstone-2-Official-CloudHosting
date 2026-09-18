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
  /** Top Document Identity / Action Bar slot (can accept a render function passing menuBar) */
  topBar?: React.ReactNode | ((props: { menuBar: React.ReactNode }) => React.ReactNode);
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

    const [selectedFooterImage, setSelectedFooterImage] = useState(false);
    const [isDraggingFooterImage, setIsDraggingFooterImage] = useState(false);
    const [isResizingFooterImage, setIsResizingFooterImage] = useState(false);
    const [isCroppingFooterImage, setIsCroppingFooterImage] = useState(false);
    const [footerCropZoom, setFooterCropZoom] = useState<number>(footerState.image?.cropZoom || 100);
    const footerTrackRef = useRef<HTMLDivElement | null>(null);
    const isResizingFooterRef = useRef(false);

    const headerFooterRef = useRef<DocumentHeaderFooterOptions>({
      header: headerState,
      footer: footerState,
    });

    useEffect(() => {
      headerFooterRef.current = { header: headerState, footer: footerState };
      onHeaderFooterChange?.({ header: headerState, footer: footerState });
    }, [headerState, footerState, onHeaderFooterChange]);

    useEffect(() => {
      if (footerState.image?.cropZoom) {
        setFooterCropZoom(footerState.image.cropZoom);
      }
    }, [footerState.image?.cropZoom]);

    // Click outside to deselect footer image or exit cropping
    useEffect(() => {
      if (!selectedFooterImage && !isCroppingFooterImage) return;
      const handleMouseDown = (e: MouseEvent) => {
        if (isResizingFooterRef.current) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (
          !target.closest('[data-footer-image]') &&
          !target.closest('[data-footer-toolbar]') &&
          !target.closest('[data-footer-crop]')
        ) {
          setSelectedFooterImage(false);
          setIsCroppingFooterImage(false);
        }
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [selectedFooterImage, isCroppingFooterImage]);

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
      if (!isFullscreen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
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
          setHeaderState((prev) => ({
            ...prev,
            image: {
              url: dataUrl,
              name: file.name,
              align: prev.image?.align || 'center',
              width: prev.image?.width || 180,
              offsetPercent: prev.image?.offsetPercent ?? 50,
            },
          }));
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
          setFooterState((prev) => ({
            ...prev,
            image: {
              url: dataUrl,
              name: file.name,
              align: prev.image?.align || 'center',
              width: prev.image?.width || 140,
              offsetPercent: prev.image?.offsetPercent ?? 50,
            },
          }));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      },
      []
    );

    // ── Interactive Drag-to-Resize handler for Footer logo ─────────────────

    const handleFooterResizeStart = useCallback(
      (e: React.MouseEvent | React.TouchEvent, direction: 'e' | 'w' | 'se' | 'sw' | 'ne' | 'nw') => {
        e.preventDefault();
        e.stopPropagation();
        isResizingFooterRef.current = true;
        setIsResizingFooterImage(true);
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const startWidth = footerState.image?.width || 140;

        const onMove = (clientX: number) => {
          if (!isResizingFooterRef.current) return;
          const deltaX = clientX - startX;
          let newW = startWidth;
          if (direction === 'e' || direction === 'se' || direction === 'ne') {
            newW = Math.max(50, Math.min(650, startWidth + deltaX));
          } else {
            newW = Math.max(50, Math.min(650, startWidth - deltaX));
          }
          setFooterState((prev) => ({
            ...prev,
            image: prev.image ? { ...prev.image, width: Math.round(newW) } : null,
          }));
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
          onMove(moveEvent.clientX);
        };

        const onTouchMove = (touchEvent: TouchEvent) => {
          if (touchEvent.touches[0]) {
            onMove(touchEvent.touches[0].clientX);
          }
        };

        const onEnd = () => {
          isResizingFooterRef.current = false;
          setIsResizingFooterImage(false);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onEnd);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', onEnd);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onEnd);
      },
      [footerState.image?.width]
    );

    // ── Draggable positioning handler for Footer logo ──────────────────────

    const handleFooterDragStart = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (isResizingFooterRef.current || isCroppingFooterImage) return;
        e.preventDefault();
        e.stopPropagation();
        setSelectedFooterImage(true);
        setIsDraggingFooterImage(true);

        const updatePosition = (clientX: number) => {
          const track = footerTrackRef.current;
          if (!track) return;
          const rect = track.getBoundingClientRect();
          const imgWidth = footerState.image?.width || 140;
          const availableTrack = Math.max(1, rect.width - imgWidth);
          const mouseX = clientX - rect.left - imgWidth / 2;
          const rawPercent = (mouseX / availableTrack) * 100;
          const clamped = Math.max(0, Math.min(100, Math.round(rawPercent)));
          const newAlign: 'left' | 'center' | 'right' =
            clamped <= 33 ? 'left' : clamped >= 67 ? 'right' : 'center';

          setFooterState((prev) => ({
            ...prev,
            image: prev.image
              ? {
                  ...prev.image,
                  offsetPercent: clamped,
                  align: newAlign,
                }
              : null,
          }));
        };

        const initialClientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        updatePosition(initialClientX);

        const onMouseMove = (moveEvent: MouseEvent) => {
          updatePosition(moveEvent.clientX);
        };

        const onTouchMove = (touchEvent: TouchEvent) => {
          if (touchEvent.touches[0]) {
            updatePosition(touchEvent.touches[0].clientX);
          }
        };

        const onEnd = () => {
          setIsDraggingFooterImage(false);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onEnd);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', onEnd);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onEnd);
      },
      [footerState.image?.width, isCroppingFooterImage]
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
              return topBar({ menuBar: menuBarElement });
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
            <div ref={canvasRef} className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950">
              <EditorContainer
                variant="default"
                className={cn(
                  'flex-1 min-h-0 overflow-y-auto editor-scrollbar bg-[#f0f4f9] dark:bg-zinc-950 p-4 md:p-8',
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
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* ─── Google Docs Horizontal Ruler ──────────────────────────── */}
                {showRuler && (
                  <DocumentRuler
                    width={816}
                    leftMargin={96}
                    rightMargin={96}
                    zoom={zoomLevel}
                    className="mb-0"
                  />
                )}

                {/* ─── Authentic 8.5" × 11" US Letter Paper Sheet ─────────────── */}
                <div
                  className={cn(
                    'plate-paper-sheet w-[816px] max-w-[816px] min-h-[1056px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_1px_4px_rgba(0,0,0,0.12),0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_36px_rgba(0,0,0,0.7)] rounded-[2px] px-[96px] pb-[96px] flex flex-col relative transition-all print:bg-white print:text-black print:border-none print:shadow-none',
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
                    isActive={activeHeaderFooter === 'header'}
                    onToggleActive={(active) => setActiveHeaderFooter(active ? 'header' : null)}
                    isReadOnly={isEffectivelyReadOnly}
                    headerInputRef={headerInputRef}
                  />

                  {/* ─── Slate Document Body (Seamlessly Inside Paper Sheet) ──────── */}
                  <div className={cn('flex-1 flex flex-col', activeHeaderFooter === 'header' && 'opacity-40 pointer-events-none transition-opacity')}>
                    <Editor
                      ref={editorRef}
                      variant="none"
                      placeholder={placeholder}
                      readOnly={isEffectivelyReadOnly}
                      spellCheck
                      autoFocus={!isEffectivelyReadOnly}
                      onKeyDown={handleKeyDown}
                      className="flex-1 w-full min-h-[650px] p-0 border-0 shadow-none rounded-none focus-visible:outline-none text-zinc-900 dark:text-zinc-100 selection:bg-primary/20 selection:text-zinc-900 dark:selection:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Footer boundary line when editing footer */}
                  {activeHeaderFooter === 'footer' && (
                    <div className="flex items-center gap-2 my-2 select-none">
                      <div className="h-px bg-primary/30 flex-1 border-b border-dashed" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Footer Boundary</span>
                      <div className="h-px bg-primary/30 flex-1 border-b border-dashed" />
                    </div>
                  )}

                  {/* ─── Embedded Footer Zone (Inside Paper Sheet) ───────────────── */}
                  {(!isEffectivelyReadOnly || footerState.image?.url || footerState.text?.trim() || footerState.pageNumber) && (
                    <div
                      onDoubleClick={() => {
                        if (!isEffectivelyReadOnly) {
                          setActiveHeaderFooter((prev) => (prev === 'footer' ? null : 'footer'));
                        }
                      }}
                      className={cn(
                        'w-full transition-all select-none print:mt-2 print:border-none',
                        activeHeaderFooter === 'footer'
                          ? 'mt-2 pt-2'
                          : 'mt-2 pt-1.5 pb-1 border-t border-transparent hover:border-dashed hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group/footer'
                      )}
                    >
                      {activeHeaderFooter === 'footer' ? (
                        <div className="flex flex-col gap-2.5 w-full">
                          {/* Footer Control Ribbon */}
                          <div
                            data-footer-toolbar="true"
                            className="header-footer-ribbon flex items-center justify-between px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                Footer
                              </span>
                              <button
                                type="button"
                                onClick={() => footerInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                                <span>{footerState.image?.url ? 'Replace Logo' : '+ Add Logo / Image'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFooterState((prev) => ({ ...prev, pageNumber: !prev.pageNumber }))
                                }
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs transition-colors cursor-pointer',
                                  footerState.pageNumber
                                    ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                                )}
                              >
                                <Hash className="w-3.5 h-3.5" />
                                <span>{footerState.pageNumber ? '✓ Page Number Active' : '+ Insert Page Number'}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Scope Dropview: This page only vs Every page */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-xs cursor-pointer"
                                  >
                                    <span>{footerState.scope === 'every_page' ? 'Every page' : 'This page only'}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
                                  <DropdownMenuItem
                                    onClick={() => setFooterState((prev) => ({ ...prev, scope: 'every_page' }))}
                                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                                  >
                                    <span>Every page</span>
                                    {footerState.scope === 'every_page' && <Check className="w-3.5 h-3.5 text-primary" />}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setFooterState((prev) => ({ ...prev, scope: 'first_page_only' }))}
                                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                                  >
                                    <span>This page only (Different first page)</span>
                                    {footerState.scope === 'first_page_only' && <Check className="w-3.5 h-3.5 text-primary" />}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <button
                                type="button"
                                onClick={() => setActiveHeaderFooter(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded transition-colors cursor-pointer shadow-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </button>
                            </div>
                          </div>

                          {/* Moveable & Draggable Logo Toolbar & Track (if image exists) */}
                          {footerState.image?.url && (
                            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                              {/* Moveable Image Action Bar */}
                              <div
                                data-footer-toolbar="true"
                                className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-zinc-500 mr-1 font-medium">Position:</span>
                                  <button
                                    type="button"
                                    title="Align Left (0%)"
                                    onClick={() =>
                                      setFooterState((prev) => ({
                                        ...prev,
                                        image: prev.image ? { ...prev.image, align: 'left', offsetPercent: 0 } : null,
                                      }))
                                    }
                                    className={cn(
                                      'p-1 rounded cursor-pointer transition-colors',
                                      (footerState.image.offsetPercent !== undefined ? footerState.image.offsetPercent <= 33 : footerState.image.align === 'left')
                                        ? 'bg-primary/15 text-primary font-bold'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    )}
                                  >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Align Center (50%)"
                                    onClick={() =>
                                      setFooterState((prev) => ({
                                        ...prev,
                                        image: prev.image ? { ...prev.image, align: 'center', offsetPercent: 50 } : null,
                                      }))
                                    }
                                    className={cn(
                                      'p-1 rounded cursor-pointer transition-colors',
                                      (footerState.image.offsetPercent !== undefined ? (footerState.image.offsetPercent > 33 && footerState.image.offsetPercent < 67) : (footerState.image.align === 'center' || !footerState.image.align))
                                        ? 'bg-primary/15 text-primary font-bold'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    )}
                                  >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Align Right (100%)"
                                    onClick={() =>
                                      setFooterState((prev) => ({
                                        ...prev,
                                        image: prev.image ? { ...prev.image, align: 'right', offsetPercent: 100 } : null,
                                      }))
                                    }
                                    className={cn(
                                      'p-1 rounded cursor-pointer transition-colors',
                                      (footerState.image.offsetPercent !== undefined ? footerState.image.offsetPercent >= 67 : footerState.image.align === 'right')
                                        ? 'bg-primary/15 text-primary font-bold'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    )}
                                  >
                                    <AlignRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Crop & Remove Action Buttons */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    title="Crop and zoom logo"
                                    onClick={() => {
                                      setSelectedFooterImage(true);
                                      setIsCroppingFooterImage((prev) => !prev);
                                    }}
                                    className={cn(
                                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                                      isCroppingFooterImage
                                        ? 'bg-primary/15 text-primary font-semibold'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                                    )}
                                  >
                                    <Crop className="w-3.5 h-3.5" />
                                    <span>{isCroppingFooterImage ? 'Cropping…' : 'Crop'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    title="Remove Logo"
                                    onClick={() => {
                                      setFooterState((prev) => ({ ...prev, image: null }));
                                      setSelectedFooterImage(false);
                                      setIsCroppingFooterImage(false);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>

                              {/* Interactive Draggable, Resizable & Croppable Footer Logo Track */}
                              <div
                                ref={footerTrackRef}
                                className="relative w-full min-h-[90px] py-2 px-1 border border-dashed border-primary/25 rounded-lg bg-primary/5 select-none overflow-hidden"
                              >
                                <div
                                  data-footer-image="true"
                                  onMouseDown={handleFooterDragStart}
                                  onTouchStart={handleFooterDragStart}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFooterImage(true);
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFooterImage(true);
                                    setIsCroppingFooterImage(true);
                                  }}
                                  style={{
                                    position: 'relative',
                                    marginLeft: `${footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%`,
                                    transform: `translateX(-${footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%)`,
                                    width: `${footerState.image.width || 140}px`,
                                  }}
                                  className={cn(
                                    'relative select-none rounded-md transition-shadow',
                                    !isCroppingFooterImage && 'cursor-grab',
                                    isDraggingFooterImage && 'cursor-grabbing scale-[1.02] shadow-lg',
                                    isResizingFooterImage && 'shadow-lg',
                                    (selectedFooterImage || isCroppingFooterImage) && 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-md'
                                  )}
                                >
                                  {/* Floating drag / resize badge */}
                                  {isResizingFooterImage && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow-md whitespace-nowrap pointer-events-none z-40">
                                      Size: {footerState.image.width || 140}px
                                    </div>
                                  )}
                                  {isDraggingFooterImage && !isResizingFooterImage && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow-md whitespace-nowrap pointer-events-none z-40">
                                      <Move className="w-2.5 h-2.5" />
                                      <span>Drag to position ({footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%)</span>
                                    </div>
                                  )}
                                  {selectedFooterImage && !isDraggingFooterImage && !isResizingFooterImage && !isCroppingFooterImage && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-100 text-[10px] font-medium shadow-md whitespace-nowrap pointer-events-none z-40 backdrop-blur-xs">
                                      <Move className="w-2.5 h-2.5" />
                                      <span>Drag to move · Pull handles to resize · Double-click to crop</span>
                                    </div>
                                  )}

                                  {/* Interactive Crop Framing Controls */}
                                  {isCroppingFooterImage && (
                                    <div
                                      data-footer-crop="true"
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      className="absolute -bottom-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 text-white rounded-lg shadow-xl text-xs backdrop-blur-xs whitespace-nowrap"
                                    >
                                      <span className="font-semibold text-zinc-300">Crop Zoom:</span>
                                      <button
                                        type="button"
                                        title="Zoom out"
                                        onClick={() => {
                                          setFooterCropZoom((z) => {
                                            const next = Math.max(100, z - 10);
                                            setFooterState((prev) => ({
                                              ...prev,
                                              image: prev.image ? { ...prev.image, cropZoom: next } : null,
                                            }));
                                            return next;
                                          });
                                        }}
                                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded font-bold cursor-pointer transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center font-mono font-semibold">{footerCropZoom}%</span>
                                      <button
                                        type="button"
                                        title="Zoom in"
                                        onClick={() => {
                                          setFooterCropZoom((z) => {
                                            const next = Math.min(300, z + 10);
                                            setFooterState((prev) => ({
                                              ...prev,
                                              image: prev.image ? { ...prev.image, cropZoom: next } : null,
                                            }));
                                            return next;
                                          });
                                        }}
                                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded font-bold cursor-pointer transition-colors"
                                      >
                                        +
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsCroppingFooterImage(false);
                                          setFooterState((prev) => ({
                                            ...prev,
                                            image: prev.image ? { ...prev.image, cropZoom: footerCropZoom } : null,
                                          }));
                                        }}
                                        className="ml-1 px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded hover:opacity-90 cursor-pointer text-xs transition-opacity"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  )}

                                  {/* Cropped Image Frame */}
                                  <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700 p-1 bg-white shadow-2xs">
                                    <img
                                      src={footerState.image.url}
                                      alt="Footer Logo"
                                      draggable={false}
                                      style={{
                                        transform: (footerState.image.cropZoom || footerCropZoom) !== 100
                                          ? `scale(${(footerState.image.cropZoom || footerCropZoom) / 100})`
                                          : undefined,
                                        transformOrigin: 'center center',
                                        transition: 'transform 0.1s ease-out',
                                      }}
                                      className="w-full max-h-24 object-contain pointer-events-none select-none"
                                    />
                                  </div>

                                  {/* Interactive Resize Handles (when selected and not cropping) */}
                                  {selectedFooterImage && !isCroppingFooterImage && (
                                    <>
                                      {/* 4 Corners */}
                                      <div
                                        onMouseDown={(e) => handleFooterResizeStart(e, 'nw')}
                                        onTouchStart={(e) => handleFooterResizeStart(e, 'nw')}
                                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary border-2 border-white rounded-2xs shadow-xs cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                                      />
                                      <div
                                        onMouseDown={(e) => handleFooterResizeStart(e, 'ne')}
                                        onTouchStart={(e) => handleFooterResizeStart(e, 'ne')}
                                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary border-2 border-white rounded-2xs shadow-xs cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                                      />
                                      <div
                                        onMouseDown={(e) => handleFooterResizeStart(e, 'sw')}
                                        onTouchStart={(e) => handleFooterResizeStart(e, 'sw')}
                                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary border-2 border-white rounded-2xs shadow-xs cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                                      />
                                      <div
                                        onMouseDown={(e) => handleFooterResizeStart(e, 'se')}
                                        onTouchStart={(e) => handleFooterResizeStart(e, 'se')}
                                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary border-2 border-white rounded-2xs shadow-xs cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                                      />

                                      {/* 2 Edges */}
                                      <div
                                        onMouseDown={(e) => handleFooterResizeStart(e, 'w')}
                                        onTouchStart={(e) => handleFooterResizeStart(e, 'w')}
                                        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-white rounded-2xs shadow-xs cursor-ew-resize z-30 hover:scale-125 transition-transform"
                                      />
                                      <div
                                        onMouseDown={(e) => handleFooterResizeStart(e, 'e')}
                                        onTouchStart={(e) => handleFooterResizeStart(e, 'e')}
                                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-white rounded-2xs shadow-xs cursor-ew-resize z-30 hover:scale-125 transition-transform"
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer Text Input Line & Alignment */}
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                            <input
                              type="text"
                              value={footerState.text || ''}
                              onChange={(e) => setFooterState((prev) => ({ ...prev, text: e.target.value }))}
                              placeholder="Type footer text (e.g. Confidential • STI College Marikina)..."
                              className="flex-1 bg-transparent px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 outline-hidden font-medium placeholder:text-zinc-400"
                              style={{ textAlign: footerState.textAlign || 'center' }}
                            />
                            <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2 shrink-0">
                              <button
                                type="button"
                                title="Align Left"
                                onClick={() => setFooterState((prev) => ({ ...prev, textAlign: 'left' }))}
                                className={cn(
                                  'p-1 rounded cursor-pointer transition-colors',
                                  footerState.textAlign === 'left'
                                    ? 'bg-primary/15 text-primary font-bold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                )}
                              >
                                <AlignLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Align Center"
                                onClick={() => setFooterState((prev) => ({ ...prev, textAlign: 'center' }))}
                                className={cn(
                                  'p-1 rounded cursor-pointer transition-colors',
                                  footerState.textAlign === 'center' || !footerState.textAlign
                                    ? 'bg-primary/15 text-primary font-bold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                )}
                              >
                                <AlignCenter className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Align Right"
                                onClick={() => setFooterState((prev) => ({ ...prev, textAlign: 'right' }))}
                                className={cn(
                                  'p-1 rounded cursor-pointer transition-colors',
                                  footerState.textAlign === 'right'
                                    ? 'bg-primary/15 text-primary font-bold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                )}
                              >
                                <AlignRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Footer Page Number Preview (if active) */}
                          {footerState.pageNumber && (
                            <div
                              className={cn(
                                'text-xs text-zinc-400 font-mono py-0.5 px-2 bg-zinc-50 dark:bg-zinc-800/60 rounded border border-zinc-200/60 dark:border-zinc-700/60',
                                footerState.textAlign === 'left' && 'text-left',
                                (!footerState.textAlign || footerState.textAlign === 'center') && 'text-center',
                                footerState.textAlign === 'right' && 'text-right'
                              )}
                            >
                              Page 1 of 1
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Idle State (Faint Google Docs Style Footer Preview) */
                        <div className="w-full flex flex-col gap-1.5 document-footer-preview">
                          {footerState.image?.url && (
                            <div className="w-full py-1 overflow-hidden select-none">
                              <div
                                style={{
                                  position: 'relative',
                                  marginLeft: `${footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%`,
                                  transform: `translateX(-${footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%)`,
                                  width: `${footerState.image.width || 140}px`,
                                }}
                              >
                                <div className="overflow-hidden rounded p-0.5">
                                  <img
                                    src={footerState.image.url}
                                    alt="Footer Logo"
                                    draggable={false}
                                    style={{
                                      transform: footerState.image.cropZoom && footerState.image.cropZoom !== 100
                                        ? `scale(${footerState.image.cropZoom / 100})`
                                        : undefined,
                                      transformOrigin: 'center center',
                                    }}
                                    className="w-full max-h-20 object-contain opacity-85 group-hover/footer:opacity-100 transition-opacity"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {(footerState.text?.trim() || footerState.pageNumber) && (
                            <div
                              className={cn(
                                'flex items-center gap-2 text-xs text-zinc-500 font-medium',
                                footerState.textAlign === 'left' && 'justify-start text-left',
                                (!footerState.textAlign || footerState.textAlign === 'center') && 'justify-center text-center',
                                footerState.textAlign === 'right' && 'justify-end text-right'
                              )}
                            >
                              {footerState.text?.trim() && <span>{footerState.text}</span>}
                              {footerState.pageNumber && (
                                <span className="font-mono text-zinc-400">
                                  {footerState.text?.trim() ? ' • ' : ''}Page 1 of 1
                                </span>
                              )}
                            </div>
                          )}
                          {!isEffectivelyReadOnly && (
                            <div className="header-footer-prompt flex items-center justify-between text-[11px] text-zinc-400 opacity-0 group-hover/footer:opacity-100 transition-opacity pt-1 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                              <span>Double-click to edit Footer</span>
                              <span>{footerState.scope === 'every_page' ? 'Every page' : 'This page only'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
