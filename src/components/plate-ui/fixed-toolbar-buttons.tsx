'use client';

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Maximize2,
  Minimize2,
  MoreVertical,
  FileText,
  ArrowDownToLine,
  Pencil,
  PenLine,
  Eye,
  Check,
  MessageSquareText,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useEditorReadOnly } from 'platejs/react';
import { SidebarContext } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';

import { ToolbarGroup, ToolbarSeparator, ToolbarButton } from './toolbar';
import { UndoToolbarButton, RedoToolbarButton } from './history-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
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
import { ExportToolbarButton } from './export-toolbar-button';
import { CommentToolbarButton, type CommentItem } from './comment-toolbar-button';
import { ModeToolbarButton } from './mode-toolbar-button';

export type EditorMode = 'editing' | 'suggesting' | 'viewing';

export interface EditorComment {
  id: string;
  author: string;
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
  onAddComment,
  onResolveComment,
}: FixedToolbarButtonsProps) {
  const defaultEditor = useEditorRef();
  const editor = propEditor || defaultEditor;
  const readOnly = useEditorReadOnly();

  const sidebar = React.useContext(SidebarContext);
  const isSidebarOpen = sidebar ? sidebar.open : false;

  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 1180);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showOverflowMenu = isSidebarOpen || isNarrow;
  const isViewing = mode === 'viewing' || readOnly;

  return (
    <div className="flex w-full items-center gap-1 flex-nowrap">
      {/* 0. History: Undo & Redo */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <UndoToolbarButton />
        <RedoToolbarButton />
      </ToolbarGroup>

      {/* 1. Insert (+ v), Turn Into (Heading 1 v), Font Size ([- 16 +]) */}
      <ToolbarGroup className={cn(isViewing && 'opacity-40 pointer-events-none')}>
        <InsertToolbarButton />
        <TurnIntoToolbarButton />
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

        <MarkToolbarButton nodeType={KEYS.code} tooltip="Inline Code">
          <Code className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
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

      {/* 7. Right-Aligned Edge Controls */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        {showOverflowMenu ? (
          <>
            <ToolbarSeparator />
            <RightOverflowMenu
              editor={editor}
              mode={mode}
              onModeChange={onModeChange}
              isFullscreen={isFullscreen}
              onToggleFullscreen={onToggleFullscreen}
              comments={comments}
              onAddComment={onAddComment}
              onResolveComment={onResolveComment}
            />
          </>
        ) : (
          <>
            <ToolbarSeparator />
            <ExportToolbarButton />
            <ToolbarSeparator />
            <CommentToolbarButton
              comments={comments}
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
          </>
        )}
      </div>
    </div>
  );
}

interface RightOverflowMenuProps {
  editor: any;
  mode: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen?: () => void;
  comments?: EditorComment[];
  onAddComment?: (text: string, selectedText?: string) => void;
  onResolveComment?: (id: string) => void;
}

function RightOverflowMenu({
  editor,
  mode,
  onModeChange,
  isFullscreen,
  onToggleFullscreen,
  comments = [],
  onAddComment,
  onResolveComment,
}: RightOverflowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const activeComments = comments.filter((c) => !c.resolved);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip="More actions"
          aria-label="More actions"
          className="relative"
        >
          <MoreVertical className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
          {activeComments.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-fg">
              {activeComments.length}
            </span>
          )}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 text-xs">
        <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Document Mode
        </div>
        <DropdownMenuItem
          onClick={() => onModeChange?.('editing')}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Pencil className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span className="flex-1 text-zinc-800 dark:text-zinc-200">Editing</span>
          {mode === 'editing' && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onModeChange?.('suggesting')}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <PenLine className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span className="flex-1 text-zinc-800 dark:text-zinc-200">Suggesting</span>
          {mode === 'suggesting' && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onModeChange?.('viewing')}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span className="flex-1 text-zinc-800 dark:text-zinc-200">Viewing</span>
          {mode === 'viewing' && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Export
        </div>
        <DropdownMenuItem
          onClick={async () => {
            const { downloadDocx } = await import('@/src/components/editor/serializers/docxSerializer');
            await downloadDocx(editor?.children || [], 'document.docx');
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Export Word (.docx)</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async () => {
            const { printToPdf } = await import('@/src/components/editor/serializers/docxSerializer');
            printToPdf();
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowDownToLine className="w-3.5 h-3.5 text-primary" />
          <span>Export PDF (.pdf)</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onToggleFullscreen}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
          <span>{isFullscreen ? 'Exit full screen' : 'Full screen'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
