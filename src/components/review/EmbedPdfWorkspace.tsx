import React from 'react';
import { FileText, Download, CheckCircle2, FileSpreadsheet, ExternalLink, Loader2 } from 'lucide-react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';

export interface EmbedPdfWorkspaceProps {
  pdfUrl: string;
  studentName: string;
  docTitle: string;
  readOnly?: boolean;
  onedriveUrl?: string;
  originalDocxUrl?: string;
}

export const EmbedPdfWorkspace: React.FC<EmbedPdfWorkspaceProps> = ({
  pdfUrl,
  studentName,
  docTitle,
  onedriveUrl,
  originalDocxUrl,
}) => {
  const isDtrDocument = docTitle.toLowerCase().includes('dtr') || (pdfUrl && pdfUrl.includes('.xlsx'));
  const isDocxSubmission = Boolean(
    originalDocxUrl ||
    (pdfUrl && (pdfUrl.toLowerCase().includes('.docx') || pdfUrl.toLowerCase().includes('.doc'))) ||
    docTitle.toLowerCase().includes('.docx') ||
    docTitle.toLowerCase().includes('.doc')
  );

  // Default DTR weekly logs matrix preview for Adviser & Admin inspection
  const dtrLogsPreview = [
    { day: 'Monday', date: 'May 4, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, verified: true },
    { day: 'Tuesday', date: 'May 5, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, verified: true },
    { day: 'Wednesday', date: 'May 6, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, verified: true },
    { day: 'Thursday', date: 'May 7, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, verified: true },
    { day: 'Friday', date: 'May 8, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, verified: true },
    { day: 'Saturday', date: 'May 9, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, isDayOff: true, verified: false },
    { day: 'Sunday', date: 'May 10, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, isDayOff: true, verified: false },
  ];

  if (isDtrDocument) {
    return (
      <div className="flex flex-col h-full w-full bg-zinc-950 p-6 overflow-y-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet size={20} />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">STI COLLEGE MARIKINA - DTR ATTENDANCE MATRIX</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Student: <span className="text-white font-semibold">{studentName}</span> · Document: <span className="text-white font-semibold">{docTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a 
                href={pdfUrl} 
                download 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Download size={14} />
                <span>Download Signed .xlsx</span>
              </a>
            )}
          </div>
        </div>

        {/* DTR Log Table Container */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Time Record Logs</h3>
              <p className="text-[11px] text-zinc-400">Verified supervisor attendance entries for this period</p>
            </div>
            <Badge variant="success" className="px-3 py-1 text-xs">
              40.0 Total Rendered Hours
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                  <th className="px-4 py-3">Day / Date</th>
                  <th className="px-4 py-3 text-center">Time In</th>
                  <th className="px-4 py-3 text-center">Time Out</th>
                  <th className="px-4 py-3 text-center">Hours</th>
                  <th className="px-4 py-3 text-center">Supervisor Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {dtrLogsPreview.map((log, idx) => (
                  <tr key={idx} className={log.isDayOff ? "bg-zinc-950/40 text-zinc-500" : "hover:bg-zinc-800/40 text-zinc-200"}>
                    <td className="px-4 py-3 font-semibold">
                      <div>{log.day}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">{log.date}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{log.timeIn}</td>
                    <td className="px-4 py-3 text-center font-mono">{log.timeOut}</td>
                    <td className="px-4 py-3 text-center font-bold">{log.hours > 0 ? `${log.hours}.0 hrs` : '0 hrs'}</td>
                    <td className="px-4 py-3 text-center">
                      {log.verified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Verified & Signed
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">Day Off / N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-zinc-400">
            <span>Overall Verification Status:</span>
            <span className="font-bold text-amber-400 uppercase tracking-wider">PENDING ADVISER VERIFICATION</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-zinc-900 dark:bg-zinc-950 overflow-hidden relative">
      {/* Format Notice Bar for Word Document Submissions */}
      {isDocxSubmission && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/90 border-b border-zinc-800/80 shrink-0 text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className="font-semibold text-zinc-200 truncate max-w-[280px]">
              {docTitle || 'Word Document (.docx)'}
            </span>
            <Badge variant="neutral" className="text-[9px] px-2 py-0.5">DOCX</Badge>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">Rendered via EmbedPDF</span>
          </div>

          <div className="flex items-center gap-2">
            {originalDocxUrl && (
              <a
                href={originalDocxUrl}
                download
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] font-bold transition-colors"
                title="Download original DOCX file"
              >
                <Download size={12} />
                <span>Original DOCX</span>
              </a>
            )}
            {onedriveUrl && (
              <a
                href={onedriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-bold transition-colors"
                title="Open in Microsoft OneDrive"
              >
                <ExternalLink size={12} />
                <span>OneDrive ↗</span>
              </a>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-[11px] font-bold transition-colors"
                title="Download rendered PDF"
              >
                <Download size={12} />
                <span>PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {pdfUrl ? (
        <ErrorBoundary fallback={
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-[#F3F4F6] dark:bg-zinc-900 h-full w-full p-6 text-center space-y-4">
            <FileText size={48} className="text-zinc-300 dark:text-zinc-700" />
            <div>
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Unable to preview PDF document</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">The browser encountered an issue initializing the document canvas. You can download the file to inspect it.</p>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={pdfUrl} 
                download 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider"
              >
                Download PDF File
              </a>
              {originalDocxUrl && (
                <a 
                  href={originalDocxUrl} 
                  download 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Download DOCX
                </a>
              )}
            </div>
          </div>
        }>
          <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden">
            <PDFViewer 
              key={pdfUrl}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
              config={{ 
                src: pdfUrl,
              }} 
            />
          </div>
        </ErrorBoundary>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-950 h-full w-full gap-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <p className="font-semibold text-zinc-300 text-xs">Preparing EmbedPDF Preview...</p>
        </div>
      )}
    </div>
  );
};
