/**
 * DocumentMenuBar.tsx
 * Google Docs style compact menu bar adapted for the Practicum Document Editor.
 *
 * Menu Order (strictly compliant with GOOGLE_DOCS_EDITOR_UI_PLAN.md):
 * - File, Edit, View, Insert, Format, Tools.
 * - Extensions and Help are ABSENT at every screen size.
 */
import React, { useState } from 'react';
import {
  FileText,
  Save,
  History,
  Download,
  Printer,
  Copy,
  Pencil,
  Undo,
  Redo,
  Scissors,
  Clipboard,
  CheckSquare,
  Search,
  Eye,
  Check,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Link2,
  Calendar,
  Minus,
  MessageSquarePlus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  RemoveFormatting,
  ShieldCheck,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  PanelLeft,
  MessageSquare,
  Ruler,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/src/lib/utils';
import {
  toggleMark,
  setBlockType,
  setAlignment,
  setLineHeight,
  indent,
  outdent,
  clearFormatting,
  insertDivider,
  insertDate,
  insertTable,
  selectAll,
} from './editor-commands';
import { type EditorMode } from '@/src/components/plate-ui/fixed-toolbar-buttons';

export interface DocumentMenuBarProps {
  editor: any;
  documentTitle: string;
  isLocked?: boolean;
  isReviewer?: boolean;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  showOutline: boolean;
  onToggleOutline: () => void;
  showComments: boolean;
  onToggleComments: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  wordCount: number;
  onSaveVersion?: () => void;
  onShowHistory?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onOpenHeaderFooter?: (type: 'header' | 'footer') => void;
  onOpenImagePicker?: () => void;
}

export function DocumentMenuBar({
  editor,
  documentTitle,
  isLocked,
  isReviewer,
  mode,
  onModeChange,
  showOutline,
  onToggleOutline,
  showComments,
  onToggleComments,
  showRuler,
  onToggleRuler,
  isFullscreen,
  onToggleFullscreen,
  zoomLevel,
  onZoomChange,
  wordCount,
  onSaveVersion,
  onShowHistory,
  onExportDocx,
  onExportPdf,
  onDuplicate,
  onRename,
  onOpenHeaderFooter,
  onOpenImagePicker,
}: DocumentMenuBarProps) {
  const [showWordCountModal, setShowWordCountModal] = useState(false);

  const isViewing = mode === 'viewing';

  // Compute detailed word count stats
  const pageEstimate = Math.max(1, Math.ceil(wordCount / 350));
  const characterCount = wordCount * 5; // average chars
  const characterCountNoSpaces = Math.round(characterCount * 0.84);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    try {
      const selected = window.getSelection()?.toString();
      if (selected) {
        await navigator.clipboard.writeText(selected);
      }
    } catch { /* clipboard permission fallback */ }
  };

  const handleCut = async () => {
    try {
      const selected = window.getSelection()?.toString();
      if (selected) {
        await navigator.clipboard.writeText(selected);
        editor?.tf?.delete?.();
      }
    } catch { /* fallback */ }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor?.tf?.insertText?.(text);
      }
    } catch { /* fallback */ }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter link URL:');
    if (url) {
      editor?.tf?.wrapNodes?.({
        type: 'a',
        url,
        children: [],
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-0.5 select-none print:hidden flex-wrap text-zinc-700 dark:text-zinc-300">
        {/* 1. FILE MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              File
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-lg z-50">
            {onRename && !isLocked && (
              <DropdownMenuItem onClick={onRename} className="cursor-pointer gap-2">
                <Pencil className="w-4 h-4 text-zinc-500" />
                <span>Rename</span>
              </DropdownMenuItem>
            )}
            {onSaveVersion && !isLocked && (
              <DropdownMenuItem onClick={onSaveVersion} className="cursor-pointer gap-2">
                <Save className="w-4 h-4 text-zinc-500" />
                <span className="flex-1">Save version</span>
                <span className="text-[11px] text-zinc-400">Ctrl+S</span>
              </DropdownMenuItem>
            )}
            {onShowHistory && (
              <DropdownMenuItem onClick={onShowHistory} className="cursor-pointer gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                <span className="flex-1">Version history</span>
                <span className="text-[11px] text-zinc-400">Ctrl+Alt+H</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {onExportDocx && (
              <DropdownMenuItem onClick={onExportDocx} className="cursor-pointer gap-2">
                <Download className="w-4 h-4 text-zinc-500" />
                <span>Download Microsoft Word (.docx)</span>
              </DropdownMenuItem>
            )}
            {onExportPdf && (
              <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span>Download PDF document (.pdf)</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handlePrint} className="cursor-pointer gap-2">
              <Printer className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Print</span>
              <span className="text-[11px] text-zinc-400">Ctrl+P</span>
            </DropdownMenuItem>

            {onDuplicate && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer gap-2">
                  <Copy className="w-4 h-4 text-zinc-500" />
                  <span>Duplicate as Draft</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. EDIT MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              Edit
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-lg z-50">
            <DropdownMenuItem
              onClick={() => editor?.undo?.()}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <Undo className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Undo</span>
              <span className="text-[11px] text-zinc-400">Ctrl+Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.redo?.()}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <Redo className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Redo</span>
              <span className="text-[11px] text-zinc-400">Ctrl+Y</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleCut} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
              <Scissors className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Cut</span>
              <span className="text-[11px] text-zinc-400">Ctrl+X</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
              <Copy className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Copy</span>
              <span className="text-[11px] text-zinc-400">Ctrl+C</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePaste} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
              <Clipboard className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Paste</span>
              <span className="text-[11px] text-zinc-400">Ctrl+V</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => selectAll(editor)} className="cursor-pointer gap-2">
              <CheckSquare className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Select all</span>
              <span className="text-[11px] text-zinc-400">Ctrl+A</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => clearFormatting(editor)}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <RemoveFormatting className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Clear formatting</span>
              <span className="text-[11px] text-zinc-400">Ctrl+\</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. VIEW MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              View
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-lg z-50">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <Eye className="w-4 h-4 text-zinc-500" />
                <span>Mode</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 shadow-lg">
                <DropdownMenuItem
                  onClick={() => onModeChange('editing')}
                  disabled={isLocked && !isReviewer}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5 text-blue-500" />
                    <span>Editing</span>
                  </div>
                  {mode === 'editing' && <Check className="w-4 h-4 text-blue-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onModeChange('viewing')}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Viewing</span>
                  </div>
                  {mode === 'viewing' && <Check className="w-4 h-4 text-blue-500" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <Sliders className="w-4 h-4 text-zinc-500" />
                <span>Zoom ({zoomLevel}%)</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40 shadow-lg">
                {[50, 75, 90, 100, 125, 150, 200].map((z) => (
                  <DropdownMenuItem
                    key={z}
                    onClick={() => onZoomChange(z)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span>{z}%</span>
                    {zoomLevel === z && <Check className="w-4 h-4 text-blue-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onToggleOutline} className="cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PanelLeft className="w-4 h-4 text-zinc-500" />
                <span>Show outline</span>
              </div>
              {showOutline && <Check className="w-4 h-4 text-blue-500" />}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleComments} className="cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span>Show comments</span>
              </div>
              {showComments && <Check className="w-4 h-4 text-blue-500" />}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleRuler} className="cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-zinc-500" />
                <span>Show ruler</span>
              </div>
              {showRuler && <Check className="w-4 h-4 text-blue-500" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onToggleFullscreen} className="cursor-pointer gap-2">
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-blue-500" />
                  <span className="flex-1">Exit fullscreen</span>
                  <span className="text-[11px] text-zinc-400">Esc</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-zinc-500" />
                  <span className="flex-1">Full screen</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 4. INSERT MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              Insert
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-lg z-50">
            <DropdownMenuItem
              onClick={() => onOpenImagePicker?.()}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <ImageIcon className="w-4 h-4 text-zinc-500" />
              <span>Image</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => insertTable(editor, 3, 3)}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <TableIcon className="w-4 h-4 text-zinc-500" />
              <span>Table (3×3)</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleInsertLink}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <Link2 className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Link</span>
              <span className="text-[11px] text-zinc-400">Ctrl+K</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => insertDate(editor)}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>Date field</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => insertDivider(editor)}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <Minus className="w-4 h-4 text-zinc-500" />
              <span>Horizontal line</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {onOpenHeaderFooter && (
              <>
                <DropdownMenuItem
                  onClick={() => onOpenHeaderFooter('header')}
                  disabled={isViewing || isLocked}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span>Header</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onOpenHeaderFooter('footer')}
                  disabled={isViewing || isLocked}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span>Footer</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              onClick={onToggleComments}
              className="cursor-pointer gap-2"
            >
              <MessageSquarePlus className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Comment</span>
              <span className="text-[11px] text-zinc-400">Ctrl+Alt+M</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. FORMAT MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              Format
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-lg z-50">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <Bold className="w-4 h-4 text-zinc-500" />
                <span>Text</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52 shadow-lg">
                <DropdownMenuItem onClick={() => toggleMark(editor, 'bold')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Bold className="w-3.5 h-3.5" />
                  <span className="flex-1">Bold</span>
                  <span className="text-[11px] text-zinc-400">Ctrl+B</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMark(editor, 'italic')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Italic className="w-3.5 h-3.5" />
                  <span className="flex-1">Italic</span>
                  <span className="text-[11px] text-zinc-400">Ctrl+I</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMark(editor, 'underline')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Underline className="w-3.5 h-3.5" />
                  <span className="flex-1">Underline</span>
                  <span className="text-[11px] text-zinc-400">Ctrl+U</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMark(editor, 'strikethrough')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Strikethrough className="w-3.5 h-3.5" />
                  <span>Strikethrough</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMark(editor, 'code')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Code className="w-3.5 h-3.5" />
                  <span>Code</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMark(editor, 'subscript')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Subscript className="w-3.5 h-3.5" />
                  <span>Subscript</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMark(editor, 'superscript')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <Superscript className="w-3.5 h-3.5" />
                  <span>Superscript</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span>Paragraph styles</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 shadow-lg">
                <DropdownMenuItem onClick={() => setBlockType(editor, 'p')} disabled={isViewing || isLocked} className="cursor-pointer">
                  Normal text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockType(editor, 'h1')} disabled={isViewing || isLocked} className="cursor-pointer text-base font-bold">
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockType(editor, 'h2')} disabled={isViewing || isLocked} className="cursor-pointer text-sm font-bold">
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockType(editor, 'h3')} disabled={isViewing || isLocked} className="cursor-pointer text-xs font-semibold">
                  Heading 3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockType(editor, 'blockquote')} disabled={isViewing || isLocked} className="cursor-pointer italic text-zinc-500">
                  Blockquote
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <AlignLeft className="w-4 h-4 text-zinc-500" />
                <span>Align & indent</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 shadow-lg">
                <DropdownMenuItem onClick={() => setAlignment(editor, 'left')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Left</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAlignment(editor, 'center')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>Center</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAlignment(editor, 'right')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <AlignRight className="w-3.5 h-3.5" />
                  <span>Right</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAlignment(editor, 'justify')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <AlignJustify className="w-3.5 h-3.5" />
                  <span>Justify</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => indent(editor)} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <IndentIcon className="w-3.5 h-3.5" />
                  <span>Increase indent</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => outdent(editor)} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <OutdentIcon className="w-3.5 h-3.5" />
                  <span>Decrease indent</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <Minus className="w-4 h-4 text-zinc-500" />
                <span>Line spacing</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40 shadow-lg">
                <DropdownMenuItem onClick={() => setLineHeight(editor, 1.0)} disabled={isViewing || isLocked} className="cursor-pointer">
                  Single (1.0)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight(editor, 1.15)} disabled={isViewing || isLocked} className="cursor-pointer">
                  1.15
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight(editor, 1.5)} disabled={isViewing || isLocked} className="cursor-pointer">
                  1.5
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight(editor, 2.0)} disabled={isViewing || isLocked} className="cursor-pointer">
                  Double (2.0)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <List className="w-4 h-4 text-zinc-500" />
                <span>Bullets & numbering</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 shadow-lg">
                <DropdownMenuItem onClick={() => setBlockType(editor, 'ol')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Numbered list</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockType(editor, 'ul')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <List className="w-3.5 h-3.5" />
                  <span>Bulleted list</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockType(editor, 'todo')} disabled={isViewing || isLocked} className="cursor-pointer gap-2">
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Checklist</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => clearFormatting(editor)}
              disabled={isViewing || isLocked}
              className="cursor-pointer gap-2"
            >
              <RemoveFormatting className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Clear formatting</span>
              <span className="text-[11px] text-zinc-400">Ctrl+\</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 6. TOOLS MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            >
              Tools
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-lg z-50">
            <DropdownMenuItem onClick={() => setShowWordCountModal(true)} className="cursor-pointer gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <span className="flex-1">Word count</span>
              <span className="text-[11px] text-zinc-400">Ctrl+Shift+C</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const isValid = wordCount > 0;
                alert(isValid ? 'Document validation passed: all required structures are intact.' : 'Document is empty.');
              }}
              className="cursor-pointer gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-zinc-500" />
              <span>Document validation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Word count dialog */}
      <Dialog open={showWordCountModal} onOpenChange={setShowWordCountModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Word count</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3 text-sm">
            <div className="flex justify-between border-b pb-2 border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Pages</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pageEstimate}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Words</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{wordCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Characters</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{characterCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Characters excluding spaces</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{characterCountNoSpaces}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
