import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  Move,
  Crop,
  Check,
  ChevronDown,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
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
  width?: number;
  align?: 'left' | 'center' | 'right';
  offsetPercent?: number;
  cropZoom?: number;
}

export interface HeaderFooterItem {
  image?: HeaderFooterImage | null;
  text?: string;
  textAlign?: 'left' | 'center' | 'right';
  scope?: 'every_page' | 'first_page_only';
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
 * Google Docs & Microsoft Word style permanent 1-inch Header Zone.
 * - Always maintains physical top margin so text never hugs the top edge.
 * - Displays subtle dashed line on hover with double-click prompt when idle.
 * - Displays Google Docs header ribbon with Options dropdown when active.
 * - Includes draggable/resizable logo, corner handles, crop zoom, and institutional text.
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
  // Dragging, resizing, cropping, and selection state
  const [selectedImage, setSelectedImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const [resizeLiveWidth, setResizeLiveWidth] = useState<number | null>(null);
  const [isCroppingImage, setIsCroppingImage] = useState(false);
  const [cropZoom, setCropZoom] = useState(headerState.image?.cropZoom ?? 100);

  const headerTrackRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);

  // Sync crop zoom if external state changes
  useEffect(() => {
    if (headerState.image?.cropZoom !== undefined) {
      setCropZoom(headerState.image.cropZoom);
    }
  }, [headerState.image?.cropZoom]);

  // Click outside to deselect image
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-header-image-container="true"]') && !target?.closest('[data-header-crop="true"]')) {
        setSelectedImage(false);
        if (isCroppingImage) {
          setIsCroppingImage(false);
        }
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isCroppingImage]);

  // ── Drag to align / position handler ──
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isResizingRef.current || isCroppingImage) return;
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
    [headerState.image?.width, isCroppingImage, setHeaderState]
  );

  // ── Resize handles handler ──
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

        const clamped = Math.max(50, Math.min(624, Math.round(newWidth)));
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
    [headerState.image?.width, setHeaderState]
  );

  const hasContent = Boolean(headerState.image?.url || headerState.text?.trim());

  return (
    <header
      data-document-header="true"
      onDoubleClick={() => {
        if (!isReadOnly) {
          onToggleActive(true);
        }
      }}
      className={cn(
        'w-full select-none transition-all relative pt-4 pb-2 group/header',
        isActive ? 'mb-4' : 'cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 rounded-xs',
        className
      )}
    >
      {/* ── Active State: Google Docs Header Ribbon ── */}
      {isActive ? (
        <div className="flex flex-col gap-3 w-full">
          <div
            data-header-toolbar="true"
            className="header-footer-ribbon flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-900/80 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Header
              </span>
              <button
                type="button"
                onClick={() => headerInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span>{headerState.image?.url ? 'Replace Logo' : '+ Add Logo / Image'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Google Docs Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs cursor-pointer"
                  >
                    <span>Options</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, scope: 'every_page' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <span>Every page</span>
                    {headerState.scope === 'every_page' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHeaderState((prev) => ({ ...prev, scope: 'first_page_only' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <span>Different first page (This page only)</span>
                    {headerState.scope === 'first_page_only' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => headerInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{headerState.image?.url ? 'Replace Logo' : 'Upload Logo'}</span>
                  </DropdownMenuItem>
                  {hasContent && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setHeaderState({
                            image: null,
                            text: '',
                            textAlign: 'center',
                            scope: 'every_page',
                          })
                        }
                        className="flex items-center gap-2 text-xs px-2.5 py-1.5 text-red-600 dark:text-red-400 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Header</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Close / Done Button */}
              <button
                type="button"
                onClick={() => onToggleActive(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Draggable Logo Track (when image exists) */}
          {headerState.image?.url && (
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Header Logo:</span>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded">
                    <button
                      type="button"
                      title="Align Left"
                      onClick={() =>
                        setHeaderState((prev) => ({
                          ...prev,
                          image: prev.image ? { ...prev.image, align: 'left', offsetPercent: 0 } : null,
                        }))
                      }
                      className={cn(
                        'p-1 rounded cursor-pointer transition-colors',
                        headerState.image.align === 'left'
                          ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      )}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Align Center"
                      onClick={() =>
                        setHeaderState((prev) => ({
                          ...prev,
                          image: prev.image ? { ...prev.image, align: 'center', offsetPercent: 50 } : null,
                        }))
                      }
                      className={cn(
                        'p-1 rounded cursor-pointer transition-colors',
                        headerState.image.align === 'center'
                          ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      )}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Align Right"
                      onClick={() =>
                        setHeaderState((prev) => ({
                          ...prev,
                          image: prev.image ? { ...prev.image, align: 'right', offsetPercent: 100 } : null,
                        }))
                      }
                      className={cn(
                        'p-1 rounded cursor-pointer transition-colors',
                        headerState.image.align === 'right'
                          ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      )}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCroppingImage((prev) => !prev)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border cursor-pointer transition-colors',
                      isCroppingImage
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    )}
                  >
                    <Crop className="w-3 h-3" />
                    <span>{isCroppingImage ? 'Done Cropping' : 'Crop'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderState((prev) => ({ ...prev, image: null }))}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded cursor-pointer"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Free Move Track */}
              <div
                ref={headerTrackRef}
                className="relative w-full h-28 bg-zinc-50 dark:bg-zinc-950/60 rounded-md border border-dashed border-zinc-300 dark:border-zinc-800 flex items-center overflow-hidden"
              >
                <div
                  data-header-image-container="true"
                  style={{
                    left: `${headerState.image.offsetPercent ?? (headerState.image.align === 'left' ? 0 : headerState.image.align === 'right' ? 100 : 50)}%`,
                    transform: 'translateX(-50%)',
                    width: `${headerState.image.width || 180}px`,
                  }}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(true);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsCroppingImage(true);
                  }}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none group/img transition-shadow',
                    selectedImage && 'ring-2 ring-blue-500 rounded-xs'
                  )}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-xs">
                    <img
                      src={headerState.image.url}
                      alt="Header Logo"
                      draggable={false}
                      style={{
                        transform: cropZoom !== 100 ? `scale(${cropZoom / 100})` : undefined,
                        transformOrigin: 'center center',
                      }}
                      className="w-full max-h-24 object-contain pointer-events-none"
                    />
                  </div>

                  {/* Resize & Move Tooltip */}
                  {selectedImage && !isDraggingImage && !isResizingImage && !isCroppingImage && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-100 text-[10px] font-medium shadow-md whitespace-nowrap pointer-events-none z-40 backdrop-blur-xs">
                      <Move className="w-2.5 h-2.5" />
                      <span>Drag to move · Corner handles to resize · Double-click to crop</span>
                    </div>
                  )}

                  {/* Resize Handles */}
                  {selectedImage && !isCroppingImage && (
                    <>
                      {/* 4 Corners */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                        onTouchStart={(e) => handleResizeStart(e, 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-2xs shadow-xs cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                        onTouchStart={(e) => handleResizeStart(e, 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-2xs shadow-xs cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                        onTouchStart={(e) => handleResizeStart(e, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-2xs shadow-xs cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                        onTouchStart={(e) => handleResizeStart(e, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-2xs shadow-xs cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                      />
                      {/* 2 Edges */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'w')}
                        onTouchStart={(e) => handleResizeStart(e, 'w')}
                        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-600 border-2 border-white rounded-2xs shadow-xs cursor-ew-resize z-30 hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'e')}
                        onTouchStart={(e) => handleResizeStart(e, 'e')}
                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-600 border-2 border-white rounded-2xs shadow-xs cursor-ew-resize z-30 hover:scale-125 transition-transform"
                      />
                    </>
                  )}

                  {/* Interactive Crop Zoom Controls */}
                  {isCroppingImage && (
                    <div
                      data-header-crop="true"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -bottom-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 text-white rounded-lg shadow-xl text-xs backdrop-blur-xs whitespace-nowrap"
                    >
                      <span className="font-semibold text-zinc-300">Crop Zoom:</span>
                      <button
                        type="button"
                        title="Zoom out"
                        onClick={() => {
                          setCropZoom((z) => {
                            const next = Math.max(100, z - 10);
                            setHeaderState((prev) => ({
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
                      <span className="w-10 text-center font-mono font-semibold">{cropZoom}%</span>
                      <button
                        type="button"
                        title="Zoom in"
                        onClick={() => {
                          setCropZoom((z) => {
                            const next = Math.min(300, z + 10);
                            setHeaderState((prev) => ({
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
                        onClick={() => setIsCroppingImage(false)}
                        className="ml-1 px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Institutional Header Text Field */}
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <input
              type="text"
              value={headerState.text || ''}
              onChange={(e) => setHeaderState((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="Type institutional header text (e.g. STI College Marikina • Practicum Department)..."
              className="flex-1 bg-transparent px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 outline-hidden font-medium placeholder:text-zinc-400"
              style={{ textAlign: headerState.textAlign || 'center' }}
            />
            <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2 shrink-0">
              <button
                type="button"
                title="Align Left"
                onClick={() => setHeaderState((prev) => ({ ...prev, textAlign: 'left' }))}
                className={cn(
                  'p-1 rounded cursor-pointer transition-colors',
                  headerState.textAlign === 'left'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Align Center"
                onClick={() => setHeaderState((prev) => ({ ...prev, textAlign: 'center' }))}
                className={cn(
                  'p-1 rounded cursor-pointer transition-colors',
                  (!headerState.textAlign || headerState.textAlign === 'center')
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Align Right"
                onClick={() => setHeaderState((prev) => ({ ...prev, textAlign: 'right' }))}
                className={cn(
                  'p-1 rounded cursor-pointer transition-colors',
                  headerState.textAlign === 'right'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Idle State: Permanent 1-inch physical margin & Google Docs Hover Line ── */
        <div className="flex flex-col gap-1.5 w-full">
          {/* Render Header Logo if present */}
          {headerState.image?.url && (
            <div className="relative w-full h-20 flex items-center overflow-hidden">
              <div
                style={{
                  left: `${headerState.image.offsetPercent ?? (headerState.image.align === 'left' ? 0 : headerState.image.align === 'right' ? 100 : 50)}%`,
                  transform: 'translateX(-50%)',
                  width: `${headerState.image.width || 180}px`,
                }}
                className="absolute top-1/2 -translate-y-1/2 select-none"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={headerState.image.url}
                    alt="Header Logo"
                    draggable={false}
                    style={{
                      transform: headerState.image.cropZoom && headerState.image.cropZoom !== 100
                        ? `scale(${headerState.image.cropZoom / 100})`
                        : undefined,
                      transformOrigin: 'center center',
                    }}
                    className="w-full max-h-20 object-contain opacity-90 group-hover/header:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Render Header Text if present */}
          {headerState.text?.trim() && (
            <div
              className={cn(
                'text-xs text-zinc-500 font-semibold tracking-wide',
                headerState.textAlign === 'left' && 'text-left',
                (!headerState.textAlign || headerState.textAlign === 'center') && 'text-center',
                headerState.textAlign === 'right' && 'text-right'
              )}
            >
              {headerState.text}
            </div>
          )}

          {/* Google Docs Hover Guide Cue */}
          {!isReadOnly && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 opacity-0 group-hover/header:opacity-100 transition-opacity pt-1 border-t border-dashed border-zinc-300 dark:border-zinc-700 select-none">
              <span>Header · Double-click to edit</span>
              <span>{headerState.scope === 'every_page' ? 'Every page' : 'This page only'}</span>
            </div>
          )}
        </div>
      )}

      {/* Google Docs Header Boundary Line across full page */}
      {isActive && (
        <div className="flex items-center gap-2 my-2 select-none">
          <div className="h-px bg-blue-400 dark:bg-blue-600 flex-1 border-b border-dashed" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            Header Boundary
          </span>
          <div className="h-px bg-blue-400 dark:bg-blue-600 flex-1 border-b border-dashed" />
        </div>
      )}
    </header>
  );
};
