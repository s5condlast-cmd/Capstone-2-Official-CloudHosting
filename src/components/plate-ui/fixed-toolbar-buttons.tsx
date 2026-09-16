'use client';

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useEditorReadOnly } from 'platejs/react';
import { cn } from '@/src/lib/utils';

import { ToolbarGroup, ToolbarSeparator, ToolbarButton } from './toolbar';
import { UndoToolbarButton, RedoToolbarButton } from './history-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
import { FontFamilyToolbarButton } from './font-family-toolbar-button';
import { FontSizeToolbarButton } from './font-size-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { FontColorToolbarButton } from './font-color-toolbar-button';
import { AlignToolbarButton } from './align-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from './list-toolbar-button';
import { ToggleToolbarButton } from './toggle-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { TableToolbarButton } from './table-toolbar-button';
import { EmojiToolbarButton } from './emoji-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { LineHeightToolbarButton } from './line-height-toolbar-button';
import { OutdentToolbarButton, IndentToolbarButton } from './indent-toolbar-button';
import { SpeechToTextToolbarButton } from './speech-to-text-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { ModeToolbarButton } from './mode-toolbar-button';

export type EditorMode = 'editing' | 'suggesting' | 'viewing';

export interface EditorComment {
  id: string;
  author: string;
  authorRole?: 'student' | 'adviser' | 'supervisor' | 'admin';
  text: string;
  createdAt: string;
  selectedText?: string;
  resolved?: boolean;
}

export interface FixedToolbarButtonsProps {
  editor?: any;
  mode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  comments?: EditorComment[];
  onOpenComments?: () => void;
  onAddComment?: (text: string, selectedText?: string) => void;
  onResolveComment?: (id: string) => void;
}

export function FixedToolbarButtons({
  editor: propEditor,
  mode = 'editing',
  onModeChange,
  isFullscreen = false,
  onToggleFullscreen,
  comments = [],
  onOpenComments,
  onAddComment,
  onResolveComment,
}: FixedToolbarButtonsProps) {
  const defaultEditor = useEditorRef();
  const editor = propEditor || defaultEditor;
  const readOnly = useEditorReadOnly();

  const isViewing = mode === 'viewing' || readOnly;

  return (
    <div className="flex w-full min-w-max items-center gap-1 flex-nowrap">
      {/* 0. History: Undo & Redo */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <UndoToolbarButton />
        <RedoToolbarButton />
      </ToolbarGroup>

      {/* 1. Insert (+ v), Turn Into (Heading 1 v), Font Family, Font Size ([- 16 +]) */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <InsertToolbarButton />
        <TurnIntoToolbarButton />
        <FontFamilyToolbarButton />
        <FontSizeToolbarButton />
      </ToolbarGroup>

      {/* 2. Text Marks: Bold, Italic, Underline, Strikethrough, Code */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (Ctrl+B)">
          <Bold className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (Ctrl+I)">
          <Italic className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (Ctrl+U)">
          <Underline className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Strikethrough">
          <Strikethrough className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.highlight} tooltip="Highlight">
          <Highlighter className="w-4 h-4 text-zinc-700 dark:text-white" />
        </MarkToolbarButton>

        {/* Text Color & Background Color */}
        <FontColorToolbarButton nodeType="color" tooltip="Text color" />
        <FontColorToolbarButton nodeType="backgroundColor" tooltip="Background color" />
      </ToolbarGroup>

      {/* 3. Alignment & Lists */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <AlignToolbarButton />
        <NumberedListToolbarButton />
        <BulletedListToolbarButton />
        <TodoListToolbarButton />
        <ToggleToolbarButton />
      </ToolbarGroup>

      {/* 4. Link, Table, Emoji */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <LinkToolbarButton />
        <TableToolbarButton />
        <EmojiToolbarButton />
      </ToolbarGroup>

      {/* 5. Unified Media Dropdown (Image, Video, Audio, File) */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <MediaToolbarButton />
      </ToolbarGroup>

      {/* 6. Line Height & Indentation */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <LineHeightToolbarButton />
        <OutdentToolbarButton />
        <IndentToolbarButton />
        <SpeechToTextToolbarButton />
      </ToolbarGroup>

      {/* 7. Right-Aligned Edge Controls: Comment, Mode, Fullscreen */}
      <div className="ml-auto flex items-center gap-1 shrink-0 pr-3 sm:pr-4">
        <ToolbarSeparator />
        <CommentToolbarButton
          comments={comments}
          onOpenDrawer={onOpenComments}
          onAddComment={(item) => onAddComment?.(item.text, item.selectedText)}
          onResolveComment={onResolveComment}
        />
        <ToolbarSeparator />
        <ModeToolbarButton
          mode={mode}
          onModeChange={onModeChange}
        />
        <ToolbarSeparator />
        <ToolbarButton
          active={isFullscreen}
          onClick={onToggleFullscreen}
          tooltip={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          aria-label="Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-primary" />
          ) : (
            <Maximize2 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
          )}
        </ToolbarButton>
      </div>
    </div>
  );
}
