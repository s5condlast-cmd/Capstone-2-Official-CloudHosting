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
  Hash,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type HeaderFooterItem } from './DocumentHeaderZone';

export interface DocumentFooterZoneProps {
  footerState: HeaderFooterItem;
  setFooterState: React.Dispatch<React.SetStateAction<HeaderFooterItem>>;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  isReadOnly?: boolean;
  footerInputRef: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

/**
 * Authentic Google Docs Footer Zone.
 * - Sub-bar with "Footer" on left, "[ ] Different first page" checkbox and "Options ▾" dropdown on right.
 * - Clean horizontal divider line.
 * - Direct inline text typing area below the divider line with page number indicator "#".
 * - Draggable/resizable/croppable logo support when an image exists.
 * - Minimum height of 48px to maintain authentic 1-inch page margins.
 */
export const DocumentFooterZone: React.FC<DocumentFooterZoneProps> = ({
  footerState,
  setFooterState,
  isActive,
  onToggleActive,
  isReadOnly = false,
  footerInputRef,
  className,
}) => {
  const [selectedImage, setSelectedImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<string | null>(null);
  const [resizeLiveWidth, setResizeLiveWidth] = useState<number | null>(null);
  const [isCroppingImage, setIsCroppingImage] = useState(false);
  const [cropZoom, setCropZoom] = useState(footerState.image?.cropZoom ?? 100);

  const footerTrackRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Sync crop zoom
  useEffect(() => {
    if (footerState.image?.cropZoom !== undefined) {
      setCropZoom(footerState.image.cropZoom);
    }
  }, [footerState.image?.cropZoom]);

  // Focus input when footer activates
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
      if (
        !target?.closest('[data-footer-image-container="true"]') &&
        !target?.closest('[data-footer-crop="true"]')
      ) {
        setSelectedImage(false);
        if (isCroppingImage) {
          setIsCroppingImage(false);
        }
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isCroppingImage]);

  // ── Drag logo handler ──
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isResizingRef.current || isCroppingImage) return;
      e.preventDefault();
      e.stopPropagation();
      setSelectedImage(true);
      setIsDraggingImage(true);

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
    [footerState.image?.width, isCroppingImage, setFooterState]
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
      const initialWidth = footerState.image?.width || 140;
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

        setFooterState((prev) => ({
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
    [footerState.image?.width, setFooterState]
  );

  const textAlign = footerState.textAlign || 'left';

  return (
    <footer
      data-document-footer="true"
      onDoubleClick={() => {
        if (!isReadOnly) {
          onToggleActive(true);
        }
      }}
      className={cn(
        'w-full min-h-[48px] select-none relative transition-all flex flex-col justify-start group/footer',
        isActive ? 'mt-2' : 'cursor-pointer hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 rounded-xs',
        className
      )}
    >
      {/* ── Active State: Authentic Google Docs Footer ── */}
      {isActive ? (
        <div className="w-full flex flex-col">
          {/* Google Docs Footer Sub-Bar (on top, bordering the body) */}
          <div className="w-full flex items-center justify-between py-1 text-xs select-none">
            <span className="text-zinc-500 dark:text-zinc-400 font-normal">
              Footer
            </span>

            <div className="flex items-center gap-4">
              {/* Different first page checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 select-none">
                <input
                  type="checkbox"
                  checked={footerState.scope === 'first_page_only'}
                  onChange={(e) =>
                    setFooterState((prev) => ({
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
                    onClick={() => setFooterState((prev) => ({ ...prev, textAlign: 'left' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Align left</span>
                    </div>
                    {textAlign === 'left' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFooterState((prev) => ({ ...prev, textAlign: 'center' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <AlignCenter className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Align center</span>
                    </div>
                    {textAlign === 'center' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFooterState((prev) => ({ ...prev, textAlign: 'right' }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <AlignRight className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Align right</span>
                    </div>
                    {textAlign === 'right' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() =>
                      setFooterState((prev) => ({ ...prev, pageNumber: !prev.pageNumber }))
                    }
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Page numbers</span>
                    </div>
                    {footerState.pageNumber && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => footerInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{footerState.image?.url ? 'Replace Logo' : 'Upload Logo'}</span>
                  </DropdownMenuItem>
                  {footerState.image?.url && (
                    <DropdownMenuItem
                      onClick={() => setFooterState((prev) => ({ ...prev, image: null }))}
                      className="flex items-center gap-2 text-xs px-2.5 py-1.5 text-red-600 dark:text-red-400 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      setFooterState({
                        image: null,
                        text: '',
                        pageNumber: false,
                        textAlign: 'left',
                        scope: 'every_page',
                      });
                      onToggleActive(false);
                    }}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 text-red-600 dark:text-red-400 cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Footer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Google Docs Horizontal Divider Line */}
          <div className="w-full border-b border-zinc-300 dark:border-zinc-700 my-1" />

          {/* Direct Inline Footer Text & Page Number Input */}
          <div className="w-full flex items-center gap-2 pt-0.5">
            <input
              ref={textInputRef}
              type="text"
              value={footerState.text || ''}
              onChange={(e) => setFooterState((prev) => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onToggleActive(false);
                }
              }}
              placeholder="Footer"
              style={{ textAlign }}
              className="flex-1 bg-transparent px-0 py-0.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none border-none font-normal"
            />
            {footerState.pageNumber && (
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 select-none cursor-default shrink-0"
                title="Page number active"
              >
                #
              </span>
            )}
          </div>

          {/* Logo Track (when image exists) */}
          {footerState.image?.url && (
            <div className="w-full mt-2">
              <div
                ref={footerTrackRef}
                className="relative w-full h-20 bg-zinc-50/70 dark:bg-zinc-950/40 rounded border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center overflow-hidden"
              >
                <div
                  data-footer-image-container="true"
                  style={{
                    left: `${footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%`,
                    transform: 'translateX(-50%)',
                    width: `${footerState.image.width || 140}px`,
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
                      src={footerState.image.url}
                      alt="Footer Logo"
                      draggable={false}
                      style={{
                        transform: cropZoom !== 100 ? `scale(${cropZoom / 100})` : undefined,
                        transformOrigin: 'center center',
                      }}
                      className="w-full max-h-18 object-contain pointer-events-none"
                    />
                  </div>

                  {/* Resize & Move Tooltip */}
                  {selectedImage && !isDraggingImage && !isResizingImage && !isCroppingImage && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-100 text-[10px] font-medium shadow-md whitespace-nowrap pointer-events-none z-40 backdrop-blur-xs">
                      <Move className="w-2.5 h-2.5" />
                      <span>Drag to move · Handles to resize · Double-click to crop</span>
                    </div>
                  )}

                  {/* Resize Handles */}
                  {selectedImage && !isCroppingImage && (
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
                    </>
                  )}

                  {/* Interactive Crop Zoom Controls */}
                  {isCroppingImage && (
                    <div
                      data-footer-crop="true"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1 bg-zinc-900/95 text-white rounded-md shadow-xl text-xs backdrop-blur-xs whitespace-nowrap"
                    >
                      <span className="font-semibold text-zinc-300 text-[11px]">Crop Zoom:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCropZoom((z) => {
                            const next = Math.max(100, z - 10);
                            setFooterState((prev) => ({
                              ...prev,
                              image: prev.image ? { ...prev.image, cropZoom: next } : null,
                            }));
                            return next;
                          });
                        }}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded font-bold cursor-pointer transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono text-[11px] font-semibold">{cropZoom}%</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCropZoom((z) => {
                            const next = Math.min(300, z + 10);
                            setFooterState((prev) => ({
                              ...prev,
                              image: prev.image ? { ...prev.image, cropZoom: next } : null,
                            }));
                            return next;
                          });
                        }}
                        className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded font-bold cursor-pointer transition-colors"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCroppingImage(false)}
                        className="ml-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Idle State: Permanent 1-inch physical margin & Google Docs Hover Line ── */
        <div className="flex flex-col gap-1 w-full justify-start">
          {/* Google Docs Hover Guide Cue (hidden when printing) */}
          {!isReadOnly && (
            <div className="opacity-0 group-hover/footer:opacity-100 transition-opacity border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-1 text-[11px] text-zinc-400 flex items-center justify-between select-none print:hidden">
              <span>Footer · Double-click to edit</span>
              {footerState.scope === 'first_page_only' && (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  Different first page
                </span>
              )}
            </div>
          )}

          {/* Footer Text and Page Number preview if present */}
          {(footerState.text?.trim() || footerState.pageNumber) && (
            <div
              className={cn(
                'text-xs text-zinc-600 dark:text-zinc-400 font-normal tracking-wide flex items-center gap-2',
                textAlign === 'left' && 'justify-start text-left',
                textAlign === 'center' && 'justify-center text-center',
                textAlign === 'right' && 'justify-end text-right'
              )}
            >
              {footerState.text?.trim() && <span>{footerState.text}</span>}
              {footerState.pageNumber && (
                <span className="font-mono text-zinc-500">1</span>
              )}
            </div>
          )}

          {/* Footer Logo preview if present */}
          {footerState.image?.url && (
            <div className="relative w-full h-16 flex items-center overflow-hidden mt-0.5">
              <div
                style={{
                  left: `${footerState.image.offsetPercent ?? (footerState.image.align === 'left' ? 0 : footerState.image.align === 'right' ? 100 : 50)}%`,
                  transform: 'translateX(-50%)',
                  width: `${footerState.image.width || 140}px`,
                }}
                className="absolute top-1/2 -translate-y-1/2 select-none"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={footerState.image.url}
                    alt="Footer Logo"
                    draggable={false}
                    style={{
                      transform:
                        footerState.image.cropZoom && footerState.image.cropZoom !== 100
                          ? `scale(${footerState.image.cropZoom / 100})`
                          : undefined,
                      transformOrigin: 'center center',
                    }}
                    className="w-full max-h-16 object-contain opacity-90 group-hover/footer:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </footer>
  );
};

