'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useEditorRef, usePath, useSelected, useFocused } from 'platejs/react';
import { cn } from '@/src/lib/utils';
import { BlockDraggable } from './block-draggable';
import { ImageFloatingToolbar, type ImageWrapMode } from './image-floating-toolbar';

export function ImageElement({
  className,
  element,
  children,
  ...props
}: PlateElementProps) {
  const editor = useEditorRef();
  const path = usePath();
  const selected = useSelected();
  const focused = useFocused();
  const [showToolbar, setShowToolbar] = React.useState(false);
  const [isCropping, setIsCropping] = React.useState(false);

  const align = (element as any)?.align || 'center';
  const wrap: ImageWrapMode = (element as any)?.wrap || 'break';
  const nodeWidth = Number((element as any)?.width) || 420;
  const cropZoom = Number((element as any)?.cropZoom) || 100;

  const [width, setWidth] = React.useState<number>(nodeWidth);
  const [zoom, setZoom] = React.useState<number>(cropZoom);
  const isResizingRef = React.useRef(false);

  React.useEffect(() => {
    if ((element as any)?.width) {
      setWidth(Number((element as any).width));
    }
  }, [(element as any)?.width]);

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    try {
      if (path && editor?.tf) {
        editor.tf.setNodes({ align: newAlign }, { at: path });
      }
    } catch {
      // non-fatal
    }
  };

  const handleWrapChange = (newWrap: ImageWrapMode) => {
    try {
      if (path && editor?.tf) {
        editor.tf.setNodes({ wrap: newWrap }, { at: path });
      }
    } catch {
      // non-fatal
    }
  };

  const handleRemove = () => {
    try {
      if (path && editor?.tf) {
        editor.tf.removeNodes({ at: path });
      }
    } catch {
      // non-fatal
    }
  };

  // ── Drag-to-resize handles ───────────────────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent, direction: 'e' | 'w' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = moveEvent.clientX - startX;
      let newW = startWidth;
      if (direction === 'e' || direction === 'se') {
        newW = Math.max(120, Math.min(800, startWidth + deltaX));
      } else {
        newW = Math.max(120, Math.min(800, startWidth - deltaX));
      }
      setWidth(Math.round(newW));
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      try {
        if (path && editor?.tf) {
          editor.tf.setNodes({ width }, { at: path });
        }
      } catch {
        // non-fatal
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleApplyCrop = () => {
    setIsCropping(false);
    try {
      if (path && editor?.tf) {
        editor.tf.setNodes({ cropZoom: zoom }, { at: path });
      }
    } catch {
      // non-fatal
    }
  };

  const isFocused = (selected && focused) || showToolbar || isCropping;

  return (
    <BlockDraggable element={element} handleTopOffset="top-3">
      <PlateElement
        as="div"
        element={element}
        className={cn(
          'relative my-4 w-full flex',
          align === 'left' && 'justify-start',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end',
          wrap === 'wrap' && align === 'left' && 'float-left mr-4 clear-none',
          wrap === 'wrap' && align === 'right' && 'float-right ml-4 clear-none',
          wrap === 'behind' && 'absolute opacity-75 pointer-events-auto',
          wrap === 'front' && 'relative z-20',
          className
        )}
        {...props}
      >
        <div
          contentEditable={false}
          onClick={() => setShowToolbar(true)}
          onDoubleClick={() => setShowToolbar(true)}
          style={{ width: `${width}px` }}
          className={cn(
            'relative group/image inline-block select-none cursor-pointer rounded-lg transition-shadow',
            isFocused && 'ring-2 ring-blue-500'
          )}
        >
          {/* Floating Alignment, Wrap & Crop Toolbar */}
          {isFocused && (
            <ImageFloatingToolbar
              align={align}
              wrap={wrap}
              isCropping={isCropping}
              onAlignChange={handleAlignChange}
              onWrapChange={handleWrapChange}
              onToggleCrop={() => setIsCropping((prev) => !prev)}
              onRemove={handleRemove}
            />
          )}

          {/* 8 Blue Resize Handles & Top Stem Handle (matching media_1789525299979.png) */}
          {isFocused && !isCropping && (
            <>
              {/* Top Rotation Stem */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-500 pointer-events-none" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow-xs cursor-grab" />

              {/* 4 Corners */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
                className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nwse-resize z-30"
              />
              <div
                onMouseDown={(e) => handleResizeStart(e, 'se')}
                className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nesw-resize z-30"
              />
              <div
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
                className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nesw-resize z-30"
              />
              <div
                onMouseDown={(e) => handleResizeStart(e, 'se')}
                className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-nwse-resize z-30"
              />

              {/* 4 Edges */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ns-resize z-30" />
              <div
                onMouseDown={(e) => handleResizeStart(e, 'w')}
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ew-resize z-30"
              />
              <div
                onMouseDown={(e) => handleResizeStart(e, 'e')}
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ew-resize z-30"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-2xs shadow-xs cursor-ns-resize z-30" />
            </>
          )}

          {/* Interactive Crop Framing Controls */}
          {isCropping && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 text-white rounded-lg shadow-xl text-xs backdrop-blur-xs">
              <span className="font-semibold text-zinc-300">Crop Zoom:</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(100, z - 10))}
                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded font-bold"
              >
                -
              </button>
              <span className="w-10 text-center font-mono">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(250, z + 10))}
                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="ml-2 px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}

          {/* Image Canvas with Cropping/Zoom */}
          <div className="overflow-hidden rounded-lg">
            <img
              src={(element as any)?.url}
              alt={(element as any)?.name || ''}
              style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out',
              }}
              className="block w-full max-h-[500px] border border-zinc-200 dark:border-zinc-800 shadow-xs object-cover"
            />
          </div>

          {(element as any)?.caption && (
            <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400 font-normal select-text">
              {(element as any).caption}
            </p>
          )}
        </div>
        {children}
      </PlateElement>
    </BlockDraggable>
  );
}

