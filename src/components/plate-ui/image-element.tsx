'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useEditorRef, usePath, useSelected, useFocused } from 'platejs/react';
import { cn } from '@/src/lib/utils';
import { BlockDraggable } from './block-draggable';
import { ImageFloatingToolbar } from './image-floating-toolbar';

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

  const align = (element as any)?.align || 'center';

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    try {
      if (path && editor?.tf) {
        editor.tf.setNodes({ align: newAlign }, { at: path });
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

  const isFocused = (selected && focused) || showToolbar;

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
          className
        )}
        {...props}
      >
        <div
          contentEditable={false}
          onClick={() => setShowToolbar((prev) => !prev)}
          onDoubleClick={() => setShowToolbar(true)}
          className={cn(
            'relative group/image inline-block max-w-full select-none cursor-pointer rounded-lg transition-all',
            isFocused && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          {/* Floating Alignment & Delete Toolbar */}
          {isFocused && (
            <ImageFloatingToolbar
              align={align}
              onAlignChange={handleAlignChange}
              onRemove={handleRemove}
            />
          )}

          <img
            src={(element as any)?.url}
            alt={(element as any)?.name || ''}
            className="block max-h-96 max-w-full rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs object-cover"
          />

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
