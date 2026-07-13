import React from 'react';
import { FileText } from 'lucide-react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';

export interface EmbedPdfWorkspaceProps {
  pdfUrl: string;
  studentName: string;
  docTitle: string;
  readOnly?: boolean;
}

export const EmbedPdfWorkspace: React.FC<EmbedPdfWorkspaceProps> = ({
  pdfUrl,
  docTitle,
}) => {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950 overflow-hidden relative">
      {pdfUrl ? (
        <ErrorBoundary fallback={
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-[#F3F4F6] dark:bg-zinc-900 h-full w-full p-6 text-center space-y-4">
            <FileText size={48} className="text-zinc-300 dark:text-zinc-700" />
            <div>
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Unable to preview PDF document</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">The browser was unable to initialize the PDF viewer canvas. You can download the document to view it locally.</p>
            </div>
            <a 
              href={pdfUrl} 
              download 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider"
            >
              Download PDF File
            </a>
          </div>
        }>
          <PDFViewer 
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            config={{ 
              src: pdfUrl,
            }} 
          />
        </ErrorBoundary>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-[#F3F4F6] dark:bg-zinc-900 h-full w-full">
          <FileText size={48} className="mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="font-semibold text-zinc-500">No Document Uploaded</p>
          <p className="text-sm mt-1">Please upload a document to view.</p>
        </div>
      )}
    </div>
  );
};
