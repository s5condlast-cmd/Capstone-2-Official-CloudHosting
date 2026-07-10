import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Upload, Send, Clock, AlertCircle, MessageSquare, FileUp } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { DTRPreview } from '@/src/components/templates/DTRPreview';
export const DTR: React.FC = () => {


  const history = [
    { period: 'October 2024', date: 'Nov 1, 2024', status: 'Pending', feedback: 'Awaiting adviser review.' },
    { period: 'September 2024', date: 'Oct 15, 2024', status: 'Approved', feedback: 'Signatures verified.' },
    { period: 'August 2024', date: 'Sep 1, 2024', status: 'Returned', feedback: 'Missing supervisor signature on page 2.' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-full">
          <DocumentWorkflow 
            title="Daily Time Record (DTR)" 
            docUrl="/sample-dtr.docx"
            fields={templateFields[getTemplateFilename("/sample-dtr.pdf")] || []}
            previewComponent={DTRPreview}
          />
        </div>
        <div className="space-y-6">
          <Card title="Upload Daily Time Record">
            <div className="space-y-5">
              <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Digitized DTR</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF or high-res image · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for Daily Time Record">Select File</Button>
              </div>
              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button id="btn-submit-dtr" icon={<Send size={14} />}>Submit Monthly DTR</Button>
              </div>
            </div>
          </Card>
          <Card title="Submission History">
            <div className="space-y-1">
              {history.map((item, i) => (
                <div key={i} className="p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.period}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{item.date}</p>
                    </div>
                    <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Returned' ? 'error' : 'warning'}>{item.status}</Badge>
                  </div>
                  <div className={cn("flex items-start gap-2 p-2.5 rounded-lg text-xs", item.status === 'Returned' ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" : "bg-zinc-50 dark:bg-zinc-800/50")}>
                    <MessageSquare size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.feedback}</p>
                  </div>
                  {item.status === 'Returned' && <Button variant="primary" size="sm" className="w-full" icon={<FileUp size={14} />}>Upload Fix</Button>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
