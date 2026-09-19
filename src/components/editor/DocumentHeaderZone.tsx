import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  Move,
  Crop,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface HeaderFooterImage {
  url: string;
  name?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  offsetPercent?: number;
  cropZoom?: number;
}

export interface HeaderFooterItem {
  image?: HeaderFooterImage | null;
  text?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  scope?: 'every_page' | 'first_page_only';
  pageNumber?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface DocumentHeaderZoneProps {
  headerState: HeaderFooterItem;
  setHeaderState: React.Dispatch<React.SetStateAction<HeaderFooterItem>>;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  isReadOnly?: boolean;
  headerInputRef: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

/**
 * Authentic Google Docs Header Zone.
 * - Borderless direct text typing without placeholder clutter.
 * - Rich formatting support (bold, italic, underline, color, font size, align).
 * - Full page width (edge-to-edge) horizontal divider line.
 * - Sub-bar with "Header" on left, "[ ] Different first page" checkbox and "Options ▾" on right.
 * - Free-form borderless image positioning and resizing (no dashed container box).
 */
export const DocumentHeaderZone: React.FC<DocumentHeaderZoneProps> = ({
  headerState,
  setHeaderState,
  isActive,
  onToggleActive,
  isReadOnly = false,
  headerInputRef,
  className,
}) => {
  const [selectedImage, setSelectedImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const [resizeLiveWidth, setResizeLiveWidth] = useState<number | null>(null);

  const headerTrackRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when header activates
  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  }, [isActive]);

  // Click outside to deselect image
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-header-image-container="true"]')) {
        setSelectedImage(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Drag logo handler ──
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isResizingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      setSelectedImage(true);
      setIsDraggingImage(true);

      const updatePosition = (clientX: number) => {
        const track = headerTrackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const imgWidth = headerState.image?.width || 180;
        const availableTrack = Math.max(1, rect.width - imgWidth);
        const mouseX = clientX - rect.left - imgWidth / 2;
        const rawPercent = (mouseX / availableTrack) * 100;
        const clamped = Math.max(0, Math.min(100, Math.round(rawPercent)));
        const newAlign: 'left' | 'center' | 'right' =
          clamped <= 33 ? 'left' : clamped >= 67 ? 'right' : 'center';

        setHeaderState((prev) => ({
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
        setIsDraggingImage(false);
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
    [headerState.image?.width, setHeaderState]
  );

  // ── Resize logo handler ──
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, handle: 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e') => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;
      setIsResizingImage(true);
      setResizeHandleType(handle);

      const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const initialWidth = headerState.image?.width || 180;
      setResizeLiveWidth(initialWidth);

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const currentX =
          'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
        const deltaX = currentX - startX;

        let newWidth = initialWidth;
        if (handle === 'se' || handle === 'ne' || handle === 'e') {
          newWidth = initialWidth + deltaX;
        } else if (handle === 'sw' || handle === 'nw' || handle === 'w') {
          newWidth = initialWidth - deltaX;
        }

        // Auto-bound image width: if text exists, leave space so text + gap doesn't push past right margin
        const maxAllowedWidth = headerState.text?.trim() ? 544 : 624;
        const clamped = Math.max(40, Math.min(maxAllowedWidth, Math.round(newWidth)));
        setResizeLiveWidth(clamped);

        setHeaderState((prev) => ({
          ...prev,
          image: prev.image ? { ...prev.image, width: clamped } : null,
        }));
      };

      const onEnd = () => {
        isResizingRef.current = false;
        setIsResizingImage(false);
        setResizeHandleType(null);
        setResizeLiveWidth(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onEnd);
    },
    [headerState.image?.width, headerState.text, setHeaderState]
  );

  const textAlign = headerState.textAlign || 'left';

  return (
    <header
      data-document-header="true"
      onClick={() => {
        if (!isReadOnly && !isActive) {
          onToggleActive(true);
        }
      }}
      className={cn(
        'w-[calc(100%+192px)] -mx-[96px] px-[96px] min-h-[96px] select-none relative transition-all flex flex-col justify-end group/header',
        isActive
          ? 'pt-8 pb-1 mb-2 bg-transparent'
          : 'pt-[48px] pb-1 cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 rounded-t-[2px]',
        className
      )}
    >
      {/* ── Active State: Authentic Google Docs Header ── */}
      {isActive ? (
        <div className="w-full flex flex-col">
          {/* Side-by-Side Image and Header Text Input (Inline with typing cursor right next to image) */}
          <div className="w-full max-w-full overflow-hidden flex items-center gap-3 relative py-0.5 min-h-[36px]">
            {headerState.image?.url && (
              <div
                data-header-image-container="true"
                style={{
                  width: `${Math.min(headerState.image.width || 140, headerState.text?.trim() ? 544 : 624)}px`,
                  maxWidth: '100%',
                }}
                className={cn(
                  'relative shrink-0 select-none max-w-full transition-shadow',
                  selectedImage && 'ring-2 ring-blue-500 rounded-xs'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(true);
                }}
              >
                <div className="relative w-full overflow-hidden rounded-xs">
                  <img
                    src={headerState.image.url}
                    alt="Header Logo"
                    draggable={false}
                    className="w-full h-auto object-contain pointer-events-none select-none block"
                  />
                </div>

                {/* Resize & Move Tooltip */}
                {selectedImage && !isDraggingImage && !isResizingImage && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-100 text-[10px] font-medium shadow-md whitespace-nowrap pointer-events-none z-40 backdrop-blur-xs">
                    <Move className="w-2.5 h-2.5" />
                    <span>Pull handles to resize</span>
                  </div>
                )}

                {/* Resize Handles (Corners and Sides) */}
                {selectedImage && (
                  <>
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'nw')}
                      onTouchStart={(e) => handleResizeStart(e, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nwse-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'ne')}
                      onTouchStart={(e) => handleResizeStart(e, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nesw-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'sw')}
                      onTouchStart={(e) => handleResizeStart(e, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nesw-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'se')}
                      onTouchStart={(e) => handleResizeStart(e, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nwse-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'w')}
                      onTouchStart={(e) => handleResizeStart(e, 'w')}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ew-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'e')}
                      onTouchStart={(e) => handleResizeStart(e, 'e')}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ew-resize z-30"
                    />
                  </>
                )}
              </div>
            )}

            {/* Direct Inline Header Text Input (Sits right next to the image on the same line) */}
            <input
              ref={textInputRef}
              type="text"
              value={headerState.text || ''}
              onChange={(e) => setHeaderState((prev) => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onToggleActive(false);
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                  e.preventDefault();
                  setHeaderState((prev) => ({ ...prev, bold: !prev.bold }));
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                  e.preventDefault();
                  setHeaderState((prev) => ({ ...prev, italic: !prev.italic }));
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                  e.preventDefault();
                  setHeaderState((prev) => ({ ...prev, underline: !prev.underline }));
                }
              }}
              style={{
                textAlign: headerState.textAlign || 'left',
                fontWeight: headerState.bold ? 'bold' : 'normal',
                fontStyle: headerState.italic ? 'italic' : 'normal',
                textDecoration: headerState.underline ? 'underline' : 'none',
                color: headerState.color || undefined,
                fontSize: headerState.fontSize ? `${headerState.fontSize}px` : undefined,
                fontFamily: headerState.fontFamily || undefined,
              }}
              className="flex-1 min-w-[60px] bg-transparent px-0 py-0.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none border-none font-normal"
            />
          </div>

          {/* Google Docs Horizontal Divider Line 1 (Above Sub-Bar) */}
          <div className="-mx-[96px] w-[calc(100%+192px)] border-b border-zinc-300 dark:border-zinc-700 my-1" />

          {/* Google Docs Header Sub-Bar (Inside margins) */}
          <div className="w-full flex items-center justify-between py-1 text-xs select-none">
            <span className="text-zinc-500 dark:text-zinc-400 font-normal">
              Header
            </span>

            <div className="flex items-center gap-4">
              {/* Different first page checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 select-none">
                <input
                  type="checkbox"
                  checked={headerState.scope === 'first_page_only'}
                  onChange={(e) =>
                    setHeaderState((prev) => ({
                      ...prev,
                      scope: e.target.checked ? 'first_page_only' : 'every_page',
                    }))
                  }
                  className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs">Different first page</span>
              </label>

              {/* Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1 cursor-pointer select-none text-xs"
                  >
                    <span>Options</span>
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 10 6">
                      <path d="M0 0l5 5 5-5z" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Alignment
                  </div>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, textAlign: 'left' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Align left</span>
                    </div>
                    {textAlign === 'left' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, textAlign: 'center' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <AlignCenter className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Align center</span>
                    </div>
                    {textAlign === 'center' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, textAlign: 'right' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <AlignRight className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Align right</span>
                    </div>
                    {textAlign === 'right' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Text Formatting
                  </div>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, bold: !prev.bold }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Bold className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Bold</span>
                    </div>
                    {headerState.bold && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, italic: !prev.italic }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Italic className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Italic</span>
                    </div>
                    {headerState.italic && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, underline: !prev.underline }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Underline className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Underline</span>
                    </div>
                    {headerState.underline && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => headerInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{headerState.image?.url ? 'Replace Logo' : 'Upload Logo'}</span>
                  </DropdownMenuItem>
                  {headerState.image?.url && (
                    <DropdownMenuItem
                      onClick={() => setHeaderState((prev) => ({ ...prev, image: null }))}
                      className="flex items-center gap-2 text-xs px-2.5 py-1.5 text-red-600 dark:text-red-400 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      setHeaderState({
                        image: null,
                        text: '',
                        textAlign: 'left',
                        scope: 'every_page',
                        bold: false,
                        italic: false,
                        underline: false,
                      });
                      onToggleActive(false);
                    }}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 text-red-600 dark:text-red-400 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Header</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Google Docs Horizontal Divider Line 2 (Below Sub-Bar, separating from body) */}
          <div className="-mx-[96px] w-[calc(100%+192px)] border-b border-zinc-300 dark:border-zinc-700 my-1" />
        </div>
      ) : (
        /* ── Idle State: Permanent 1-inch physical margin & Google Docs Hover Line ── */
        <div className="flex flex-col gap-1 w-full justify-end">
          {/* Side-by-side image & text preview */}
          <div className="w-full max-w-full overflow-hidden flex items-center gap-3 select-none">
            {headerState.image?.url && (
              <div
                style={{
                  width: `${Math.min(headerState.image.width || 140, headerState.text?.trim() ? 544 : 624)}px`,
                  maxWidth: '100%',
                }}
                className="relative shrink-0 select-none max-w-full overflow-hidden"
              >
                <img
                  src={headerState.image.url}
                  alt="Header Logo"
                  draggable={false}
                  className="w-full h-auto object-contain opacity-90 group-hover/header:opacity-100 transition-opacity block"
                />
              </div>
            )}

            {headerState.text?.trim() && (
              <div
                style={{
                  textAlign: headerState.textAlign || 'left',
                  fontWeight: headerState.bold ? 'bold' : 'normal',
                  fontStyle: headerState.italic ? 'italic' : 'normal',
                  textDecoration: headerState.underline ? 'underline' : 'none',
                  color: headerState.color || undefined,
                  fontSize: headerState.fontSize ? `${headerState.fontSize}px` : undefined,
                  fontFamily: headerState.fontFamily || undefined,
                }}
                className={cn(
                  'flex-1 text-sm text-zinc-700 dark:text-zinc-300 tracking-wide',
                  textAlign === 'left' && 'text-left',
                  textAlign === 'center' && 'text-center',
                  textAlign === 'right' && 'text-right'
                )}
              >
                {headerState.text}
              </div>
            )}
          </div>

          {/* Google Docs Hover Guide Cue (hidden when printing) */}
          {!isReadOnly && (
            <div className="opacity-0 group-hover/header:opacity-100 transition-opacity border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-1 text-[11px] text-zinc-400 flex items-center justify-between select-none print:hidden">
              <span>Header · Click to edit</span>
              {headerState.scope === 'first_page_only' && (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  Different first page
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
