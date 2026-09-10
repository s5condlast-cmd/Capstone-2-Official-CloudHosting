import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Upload, Send, Clock, AlertCircle, MessageSquare, FileUp, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';

export const DTR: React.FC = () => {
  const history = [
    { period: 'October 2024', date: 'Nov 1, 2024', status: 'Pending', feedback: 'Awaiting adviser review.' },
    { period: 'September 2024', date: 'Oct 15, 2024', status: 'Approved', feedback: 'Signatures verified.' },
    { period: 'August 2024', date: 'Sep 1, 2024', status: 'Returned', feedback: 'Missing supervisor signature on page 2.' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          <div className="flex-1 flex flex-col min-h-0">
            <DocumentWorkflow
              title="Daily Time Record (DTR)"
              docUrl="/sample-dtr.docx"
              templateId="h6"
              fields={templateFields[getTemplateFilename("/sample-dtr.pdf")] || []}
            />
          </div>
        </div>
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6">
          <Card title="Upload Daily Time Record">
            <div className="space-y-4">
              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5">
                <Info className="text-zinc-500 dark:text-zinc-400 mt-0.5 shrink-0" size={14} />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  We recommend uploading a scanned PDF. Please ensure all signatures are clearly visible.
                </p>
              </div>

              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/40 hover:bg-zinc-50/80 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/50 rounded-xl p-4 sm:p-5 text-center transition-all cursor-pointer group">
                <div className="w-11 h-11 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                  <Upload size={20} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">Upload Digitized DTR</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 truncate">PDF or high-res image · Max 10MB</p>
                <Button variant="secondary" size="sm" className="h-8 text-[11px] font-bold" aria-label="Select file for Daily Time Record">Select File</Button>
              </div>
              <div className="flex justify-end pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <Button variant="primary" id="btn-submit-dtr" className="h-8 text-[11px] font-bold" icon={<Send size={13} />}>
                  Submit Monthly DTR
                </Button>
              </div>
            </div>
          </Card>
          <Card title="Submission History">
            <div className="space-y-2.5">
              {history.map((item, i) => (
                <div key={i} className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.period}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{item.date}</p>
                    </div>
                    <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Returned' ? 'error' : 'warning'}>{item.status}</Badge>
                  </div>
                  <div className={cn(
                    "flex items-start gap-2 p-2 rounded-lg text-xs border transition-all",
                    item.status === 'Returned'
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 border-l-3 border-l-amber-500"
                      : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400"
                  )}>
                    <MessageSquare size={13} className={cn("shrink-0 mt-0.5", item.status === 'Returned' ? "text-amber-600" : "text-zinc-400")} />
                    <p className="leading-relaxed text-[11px]">{item.feedback}</p>
                  </div>
                  {item.status === 'Returned' && (
                    <Button variant="primary" size="sm" className="w-full h-8 text-[11px] font-bold justify-center" icon={<FileUp size={13} />}>
                      Upload Fix
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
