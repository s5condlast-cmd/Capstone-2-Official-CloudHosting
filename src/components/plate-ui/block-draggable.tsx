'use client';

import * as React from 'react';
import { useEditorRef, usePath } from 'platejs/react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Global variable tracking the index of the block currently being dragged
let globalDraggingIndex: number | null = null;

export interface BlockDraggableProps {
  children: React.ReactNode;
  element?: any;
  className?: string;
  handleTopOffset?: string;
}

export function BlockDraggable({
  children,
  element,
  className,
  handleTopOffset = 'top-1',
}: BlockDraggableProps) {
  const editor = useEditorRef();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Safely look up the Slate path
  let path: number[] | undefined;
  try {
    path = usePath();
  } catch {
    path = undefined;
  }

  const isTopLevel = Boolean(path && path.length === 1);
  const isReadOnly = Boolean(editor?.readOnly);

  const [dropPosition, setDropPosition] = React.useState<'top' | 'bottom' | null>(null);

  // If not a top-level block or if editor is read-only, render children cleanly without handles
  if (!isTopLevel || isReadOnly) {
    return <>{children}</>;
  }

  const blockIndex = path![0];

  const handleDragStart = (e: React.DragEvent) => {
    globalDraggingIndex = blockIndex;
    e.dataTransfer.setData('text/plate-block-index', String(blockIndex));
    e.dataTransfer.effectAllowed = 'move';

    if (containerRef.current && e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(containerRef.current, 24, 16);
    }
  };

  const handleDragEnd = () => {
    globalDraggingIndex = null;
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (globalDraggingIndex === null || globalDraggingIndex === blockIndex) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isTop = e.clientY - rect.top < rect.height / 2;
    const newPos = isTop ? 'top' : 'bottom';
    if (newPos !== dropPosition) {
      setDropPosition(newPos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData('text/plate-block-index');
    setDropPosition(null);
    globalDraggingIndex = null;

    if (!raw) return;
    const fromIndex = parseInt(raw, 10);
    if (isNaN(fromIndex) || fromIndex === blockIndex) return;

    const isTop = dropPosition === 'top';
    let to = isTop ? blockIndex : blockIndex + 1;
    if (fromIndex < to) to = to - 1;

    if (fromIndex !== to && editor?.tf) {
      editor.tf.moveNodes({ at: [fromIndex], to: [to] });
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn('group/block relative w-full', className)}
    >
      {/* 6-Dots Drag Handle in Left Margin */}
      <div
        contentEditable={false}
        className={cn(
          'absolute -left-7 z-30 flex items-center justify-center',
          'opacity-0 group-hover/block:opacity-100 transition-opacity duration-150',
          'print:hidden select-none',
          handleTopOffset
        )}
      >
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title="Drag to move block"
          aria-label="Drag to move block"
          className="flex h-5 w-4.5 cursor-grab items-center justify-center rounded text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-700 active:cursor-grabbing dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Crisp Blue Drop Indicator Line */}
      {dropPosition === 'top' && (
        <div
          contentEditable={false}
          className="pointer-events-none absolute -top-1 left-0 right-0 z-40 flex items-center print:hidden select-none"
        >
          <div className="-ml-1 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
          <div className="h-0.5 flex-1 bg-blue-500 shadow-sm" />
          <div className="-mr-1 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
        </div>
      )}

      {dropPosition === 'bottom' && (
        <div
          contentEditable={false}
          className="pointer-events-none absolute -bottom-1 left-0 right-0 z-40 flex items-center print:hidden select-none"
        >
          <div className="-ml-1 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
          <div className="h-0.5 flex-1 bg-blue-500 shadow-sm" />
          <div className="-mr-1 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
        </div>
      )}

      {/* Block Content */}
      {children}
    </div>
  );
}
