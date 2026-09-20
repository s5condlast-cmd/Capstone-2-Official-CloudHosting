import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  Move,
  Crop,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Hash,
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

export const FOOTER_MIN_HEIGHT = 96;
export const FOOTER_MAX_HEIGHT = 180;
export const FOOTER_IMAGE_MAX_HEIGHT = 140;
export const FOOTER_IMAGE_MAX_WIDTH_WITH_TEXT = 360;
export const FOOTER_CONTENT_WIDTH = 624;

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

/**
 * Authentic Google Docs Footer Zone.
 * - Dynamic height up to 180px with downward natural flow.
 * - Sub-bar with "Footer" on left, "[ ] Different first page" checkbox and "Options ▾" dropdown on right.
 * - Full page width (edge-to-edge) horizontal divider line.
 * - 8-handle free-form resizing for both width and height.
 * - Google Docs interactive image cropping with black L-bracket handles and canvas export.
 * - Direct inline text typing area below the divider line with page number indicator "#" and no placeholder clutter.
 * - Rich formatting support (bold, italic, underline, color, font size, align).
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
  const [resizeLiveHeight, setResizeLiveHeight] = useState<number | null>(null);

  // ── Image Cropping state ──
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const footerTrackRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const currentWidth = Math.min(
    resizeLiveWidth ?? footerState.image?.width ?? 140,
    (footerState.text?.trim() || footerState.pageNumber) ? FOOTER_IMAGE_MAX_WIDTH_WITH_TEXT : FOOTER_CONTENT_WIDTH
  );
  const currentHeight = Math.min(
    resizeLiveHeight ?? footerState.image?.height ?? 48,
    FOOTER_IMAGE_MAX_HEIGHT
  );

  // Focus input when footer activates
  useEffect(() => {
    if (isActive && !isCropping) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  }, [isActive, isCropping]);

  // Click outside to deselect image / cancel crop
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-footer-image-container="true"]')) {
        setSelectedImage(false);
        if (isCropping) {
          setIsCropping(false);
        }
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isCropping]);

  // ── Drag logo handler ──
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isResizingRef.current || isCropping) return;
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
    [footerState.image?.width, isCropping, setFooterState]
  );

  // ── 8-Handle Resize logo handler (width and height enlargement) ──
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;
      setIsResizingImage(true);
      setResizeHandleType(handle);

      const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const initialWidth = footerState.image?.width || 140;
      const initialHeight = footerState.image?.height || 48;
      setResizeLiveWidth(initialWidth);
      setResizeLiveHeight(initialHeight);

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const currentX =
          'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
        const currentY =
          'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        let newWidth = initialWidth;
        let newHeight = initialHeight;

        // Horizontal resizing
        if (handle === 'e' || handle === 'se' || handle === 'ne') {
          newWidth = initialWidth + deltaX;
        } else if (handle === 'w' || handle === 'sw' || handle === 'nw') {
          newWidth = initialWidth - deltaX;
        }

        // Vertical resizing
        if (handle === 's' || handle === 'se' || handle === 'sw') {
          newHeight = initialHeight + deltaY;
        } else if (handle === 'n' || handle === 'ne' || handle === 'nw') {
          newHeight = initialHeight - deltaY;
        }

        const maxAllowedWidth = (footerState.text?.trim() || footerState.pageNumber)
          ? FOOTER_IMAGE_MAX_WIDTH_WITH_TEXT
          : FOOTER_CONTENT_WIDTH;
        const clampedWidth = Math.max(40, Math.min(maxAllowedWidth, Math.round(newWidth)));
        const clampedHeight = Math.max(20, Math.min(FOOTER_IMAGE_MAX_HEIGHT, Math.round(newHeight)));

        setResizeLiveWidth(clampedWidth);
        setResizeLiveHeight(clampedHeight);

        setFooterState((prev) => ({
          ...prev,
          image: prev.image
            ? {
                ...prev.image,
                width: clampedWidth,
                height: clampedHeight,
              }
            : null,
        }));
      };

      const onEnd = () => {
        isResizingRef.current = false;
        setIsResizingImage(false);
        setResizeHandleType(null);
        setResizeLiveWidth(null);
        setResizeLiveHeight(null);
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
    [footerState.image?.width, footerState.image?.height, footerState.text, footerState.pageNumber, setFooterState]
  );

  // ── Crop Mode Handlers ──
  const startCropping = useCallback(() => {
    setCropBox({
      x: 0,
      y: 0,
      width: currentWidth,
      height: currentHeight,
    });
    setIsCropping(true);
  }, [currentWidth, currentHeight]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  const resetCrop = useCallback(() => {
    if (!footerState.image?.originalUrl) {
      setIsCropping(false);
      return;
    }
    const origUrl = footerState.image.originalUrl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      const w = Math.min(FOOTER_IMAGE_MAX_WIDTH_WITH_TEXT, img.naturalWidth);
      const h = Math.min(FOOTER_IMAGE_MAX_HEIGHT, Math.round(w / aspect));
      setFooterState((prev) => ({
        ...prev,
        image: prev.image
          ? {
              ...prev.image,
              url: origUrl,
              width: w,
              height: h,
            }
          : null,
      }));
      setIsCropping(false);
    };
    img.src = origUrl;
  }, [footerState.image, setFooterState]);

  const applyCrop = useCallback(() => {
    if (!footerState.image) return;
    const src = footerState.image.originalUrl || footerState.image.url;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const dispW = currentWidth;
      const dispH = currentHeight;
      const scaleX = img.naturalWidth / dispW;
      const scaleY = img.naturalHeight / dispH;

      const sx = Math.max(0, Math.round(cropBox.x * scaleX));
      const sy = Math.max(0, Math.round(cropBox.y * scaleY));
      const sw = Math.min(img.naturalWidth - sx, Math.round(cropBox.width * scaleX));
      const sh = Math.min(img.naturalHeight - sy, Math.round(cropBox.height * scaleY));

      if (sw <= 0 || sh <= 0) {
        setIsCropping(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const croppedUrl = canvas.toDataURL('image/png');
        const finalW = Math.round(cropBox.width);
        const finalH = Math.round(cropBox.height);

        setFooterState((prev) => ({
          ...prev,
          image: prev.image
            ? {
                ...prev.image,
                url: croppedUrl,
                originalUrl: prev.image.originalUrl || prev.image.url,
                width: finalW,
                height: finalH,
              }
            : null,
        }));
      }
      setIsCropping(false);
    };
    img.src = src;
  }, [footerState.image, currentWidth, currentHeight, cropBox, setFooterState]);

  // Crop keyboard listener (Enter to apply, Esc to cancel)
  useEffect(() => {
    if (!isCropping) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        applyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancelCrop();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isCropping, applyCrop, cancelCrop]);

  // Crop Handle Drag
  const handleCropHandleStart = (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initBox = { ...cropBox };
    const maxW = currentWidth;
    const maxH = currentHeight;

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const curY = 'touches' in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;
      const dx = curX - startX;
      const dy = curY - startY;

      let { x, y, width, height } = initBox;

      if (handle.includes('e')) {
        width = Math.max(24, Math.min(maxW - x, initBox.width + dx));
      }
      if (handle.includes('s')) {
        height = Math.max(20, Math.min(maxH - y, initBox.height + dy));
      }
      if (handle.includes('w')) {
        const newX = Math.max(0, Math.min(initBox.x + initBox.width - 24, initBox.x + dx));
        width = initBox.x + initBox.width - newX;
        x = newX;
      }
      if (handle.includes('n')) {
        const newY = Math.max(0, Math.min(initBox.y + initBox.height - 20, initBox.y + dy));
        height = initBox.y + initBox.height - newY;
        y = newY;
      }

      setCropBox({ x, y, width, height });
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  // Crop Box Move Drag
  const handleCropBoxDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initBox = { ...cropBox };
    const maxW = currentWidth;
    const maxH = currentHeight;

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const curY = 'touches' in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;
      const dx = curX - startX;
      const dy = curY - startY;

      const newX = Math.max(0, Math.min(maxW - initBox.width, initBox.x + dx));
      const newY = Math.max(0, Math.min(maxH - initBox.height, initBox.y + dy));

      setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const textAlign = footerState.textAlign || 'left';

  return (
    <footer
      data-document-footer="true"
      onClick={() => {
        if (!isReadOnly && !isActive) {
          onToggleActive(true);
        }
      }}
      style={{ maxHeight: `${FOOTER_MAX_HEIGHT}px` }}
      className={cn(
        'w-[calc(100%+192px)] -mx-[96px] px-[96px] min-h-[96px] shrink-0 select-none relative transition-all flex flex-col justify-start group/footer',
        isActive
          ? 'pt-1 pb-8 mt-2 bg-transparent'
          : 'pt-1 pb-[48px] cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 rounded-b-[2px]',
        className
      )}
    >
      {/* ── Active State: Authentic Google Docs Footer ── */}
      {isActive ? (
        <div className="w-full flex flex-col">
          {/* Google Docs Horizontal Divider Line 1 (Above Sub-Bar, bordering body) */}
          <div className="-mx-[96px] w-[calc(100%+192px)] border-b border-zinc-300 dark:border-zinc-700 my-1" />
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

                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Text Formatting
                  </div>
                  <DropdownMenuItem
                    onClick={() => setFooterState((prev) => ({ ...prev, bold: !prev.bold }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Bold className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Bold</span>
                    </div>
                    {footerState.bold && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFooterState((prev) => ({ ...prev, italic: !prev.italic }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Italic className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Italic</span>
                    </div>
                    {footerState.italic && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFooterState((prev) => ({ ...prev, underline: !prev.underline }))}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Underline className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Underline</span>
                    </div>
                    {footerState.underline && <Check className="w-3.5 h-3.5 text-blue-600" />}
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
                        bold: false,
                        italic: false,
                        underline: false,
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

          {/* Google Docs Horizontal Divider Line 2 (Below Sub-Bar, separating from footer typing area) */}
          <div className="-mx-[96px] w-[calc(100%+192px)] border-b border-zinc-300 dark:border-zinc-700 my-1" />

          {/* Side-by-Side Image, Text, and Page Number (Inline with typing cursor right next to image) */}
          <div className="w-full max-w-full overflow-visible flex items-center gap-3 relative py-0.5 min-h-[36px]">
            {footerState.image?.url && (
              <div
                data-footer-image-container="true"
                style={{
                  width: `${currentWidth}px`,
                  height: `${currentHeight}px`,
                  maxWidth: '100%',
                }}
                className={cn(
                  'relative shrink-0 select-none transition-shadow',
                  selectedImage && !isCropping && 'ring-2 ring-blue-500 rounded-xs',
                  isCropping && 'ring-2 ring-blue-600 rounded-xs'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(true);
                }}
              >
                {!isCropping ? (
                  <div className="relative w-full h-full overflow-hidden rounded-xs">
                    <img
                      src={footerState.image.url}
                      alt="Footer Logo"
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none select-none block"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full overflow-hidden rounded-xs bg-zinc-900/10 select-none">
                    <img
                      src={footerState.image.originalUrl || footerState.image.url}
                      alt="Footer Logo"
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none select-none block opacity-70"
                    />

                    {/* Dark Mask & Crop Box */}
                    <div
                      style={{
                        left: `${cropBox.x}px`,
                        top: `${cropBox.y}px`,
                        width: `${cropBox.width}px`,
                        height: `${cropBox.height}px`,
                      }}
                      onMouseDown={handleCropBoxDragStart}
                      onTouchStart={handleCropBoxDragStart}
                      className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move select-none"
                    >
                      {/* Rule of Thirds subtle grid */}
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div />
                      </div>

                      {/* Black L-bracket Corner Handles */}
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'nw')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'nw')}
                        className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-black cursor-nwse-resize z-40"
                      />
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'ne')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'ne')}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-black cursor-nesw-resize z-40"
                      />
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'sw')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'sw')}
                        className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-black cursor-nesw-resize z-40"
                      />
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'se')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'se')}
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-black cursor-nwse-resize z-40"
                      />

                      {/* Black Midpoint Edge Handles */}
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'n')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'n')}
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-black cursor-ns-resize z-40"
                      />
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 's')}
                        onTouchStart={(e) => handleCropHandleStart(e, 's')}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-black cursor-ns-resize z-40"
                      />
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'w')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'w')}
                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-[3px] h-4 bg-black cursor-ew-resize z-40"
                      />
                      <div
                        onMouseDown={(e) => handleCropHandleStart(e, 'e')}
                        onTouchStart={(e) => handleCropHandleStart(e, 'e')}
                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-[3px] h-4 bg-black cursor-ew-resize z-40"
                      />
                    </div>
                  </div>
                )}

                {/* Cropping Action Toolbar */}
                {isCropping && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/95 text-zinc-100 text-xs font-medium shadow-lg whitespace-nowrap z-50 backdrop-blur-xs border border-zinc-700">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-300 font-medium pr-1 border-r border-zinc-700">
                      <Crop className="w-3 h-3 text-blue-400" />
                      <span>Crop</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyCrop();
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Done</span>
                    </button>
                    {footerState.image.originalUrl && footerState.image.originalUrl !== footerState.image.url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetCrop();
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 text-[11px] transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelCrop();
                      }}
                      className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                      title="Cancel (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Selected Image Floating Pill (Crop + Dimensions + Reset) */}
                {selectedImage && !isCropping && !isDraggingImage && !isResizingImage && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 text-zinc-100 text-[11px] font-medium shadow-md whitespace-nowrap z-40 backdrop-blur-xs border border-zinc-700/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startCropping();
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-700/80 text-zinc-200 hover:text-white transition-colors"
                      title="Crop image"
                    >
                      <Crop className="w-3 h-3 text-blue-400" />
                      <span>Crop</span>
                    </button>
                    {footerState.image.originalUrl && footerState.image.originalUrl !== footerState.image.url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetCrop();
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-[10px] transition-colors"
                        title="Reset to original"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-[10px] text-zinc-400 border-l border-zinc-700 pl-1.5">
                      {currentWidth} × {currentHeight}px
                    </span>
                  </div>
                )}

                {/* 8 Resize Handles (Corners and Sides for width and height enlargement) */}
                {selectedImage && !isCropping && (
                  <>
                    {/* 4 Corners */}
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

                    {/* 4 Edges (n/s for height, w/e for width) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'n')}
                      onTouchStart={(e) => handleResizeStart(e, 'n')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ns-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 's')}
                      onTouchStart={(e) => handleResizeStart(e, 's')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ns-resize z-30"
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

            {/* Direct Inline Footer Text Input (Sits right next to the image on the same line) */}
            <input
              ref={textInputRef}
              type="text"
              value={footerState.text || ''}
              onChange={(e) => setFooterState((prev) => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onToggleActive(false);
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                  e.preventDefault();
                  setFooterState((prev) => ({ ...prev, bold: !prev.bold }));
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                  e.preventDefault();
                  setFooterState((prev) => ({ ...prev, italic: !prev.italic }));
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                  e.preventDefault();
                  setFooterState((prev) => ({ ...prev, underline: !prev.underline }));
                }
              }}
              style={{
                textAlign: footerState.textAlign || 'left',
                fontWeight: footerState.bold ? 'bold' : 'normal',
                fontStyle: footerState.italic ? 'italic' : 'normal',
                textDecoration: footerState.underline ? 'underline' : 'none',
                color: footerState.color || undefined,
                fontSize: footerState.fontSize ? `${footerState.fontSize}px` : undefined,
                fontFamily: footerState.fontFamily || undefined,
              }}
              className="flex-1 min-w-[60px] bg-transparent px-0 py-0.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none border-none font-normal"
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
        </div>
      ) : (
        /* ── Idle State: Permanent 1-inch physical margin & Google Docs Hover Line ── */
        <div className="flex flex-col gap-1 w-full justify-start h-full">
          {/* Google Docs Hover Guide Cue (hidden when printing) */}
          {!isReadOnly && (
            <div className="opacity-0 group-hover/footer:opacity-100 transition-opacity border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-1 text-[11px] text-zinc-400 flex items-center justify-between select-none print:hidden">
              <span>Footer · Click to edit</span>
              {footerState.scope === 'first_page_only' && (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  Different first page
                </span>
              )}
            </div>
          )}

          {/* Side-by-side Footer preview if text, page number, or image is present */}
          {(footerState.text?.trim() || footerState.pageNumber || footerState.image?.url) && (
            <div className="w-full max-w-full overflow-hidden flex items-center gap-3 select-none mt-0.5">
              {footerState.image?.url && (
                <div
                  style={{
                    width: `${currentWidth}px`,
                    height: `${currentHeight}px`,
                    maxWidth: '100%',
                  }}
                  className="relative shrink-0 select-none max-w-full overflow-hidden"
                >
                  <img
                    src={footerState.image.url}
                    alt="Footer Logo"
                    draggable={false}
                    className="w-full h-full object-contain opacity-90 group-hover/footer:opacity-100 transition-opacity block"
                  />
                </div>
              )}

              {footerState.text?.trim() && (
                <div
                  style={{
                    textAlign: footerState.textAlign || 'left',
                    fontWeight: footerState.bold ? 'bold' : 'normal',
                    fontStyle: footerState.italic ? 'italic' : 'normal',
                    textDecoration: footerState.underline ? 'underline' : 'none',
                    color: footerState.color || undefined,
                    fontSize: footerState.fontSize ? `${footerState.fontSize}px` : undefined,
                    fontFamily: footerState.fontFamily || undefined,
                  }}
                  className={cn(
                    'flex-1 text-xs text-zinc-700 dark:text-zinc-300 tracking-wide',
                    textAlign === 'left' && 'text-left',
                    textAlign === 'center' && 'text-center',
                    textAlign === 'right' && 'text-right'
                  )}
                >
                  {footerState.text}
                </div>
              )}

              {footerState.pageNumber && (
                <span className="text-xs font-mono text-zinc-500 shrink-0">1</span>
              )}
            </div>
          )}
        </div>
      )}
    </footer>
  );
};
