import * as React from 'react';
import { ArrowDownToLine, FileText } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToolbarButton } from './toolbar';
import type { DocumentHeaderFooterOptions } from '@/src/components/editor/serializers/docxSerializer';

export interface ExportToolbarButtonProps {
  documentTitle?: string;
  headerFooter?: DocumentHeaderFooterOptions;
  onExportWord?: () => void;
  onExportPdf?: () => void;
}

export function ExportToolbarButton({
  documentTitle,
  headerFooter,
  onExportWord,
  onExportPdf,
}: ExportToolbarButtonProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const handleExportWord = async () => {
    setOpen(false);
    if (onExportWord) {
      onExportWord();
      return;
    }
    try {
      const { downloadDocx } = await import('@/src/components/editor/serializers/docxSerializer');
      const nodes = editor?.children || [];
      await downloadDocx(nodes, documentTitle || 'document', headerFooter);
      toast.success('Word document exported successfully.');
    } catch (e) {
      toast.error('Word export failed. Please try again.');
    }
  };

  const handleExportPdf = async () => {
    setOpen(false);
    if (onExportPdf) {
      onExportPdf();
      return;
    }
    try {
      const { printToPdf } = await import('@/src/components/editor/serializers/docxSerializer');
      printToPdf();
    } catch {
      toast.error('PDF export failed. Please try again.');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip="Export Document"
          aria-label="Export"
          isDropdown
        >
          <ArrowDownToLine className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52 p-1.5 text-xs flex flex-col gap-0.5" align="start">
        <div className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Export Options
        </div>
        <DropdownMenuItem
          onClick={handleExportWord}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Export as Word</span>
            <span className="text-[10px] text-zinc-400">Microsoft Word (.docx)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportPdf}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowDownToLine className="w-4 h-4 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Export as PDF</span>
            <span className="text-[10px] text-zinc-400">Printable Document (.pdf)</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

