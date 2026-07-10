import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  FileUp,
  MessageSquare,
  ShieldCheck,
  Clock,
  AlertCircle,
  Upload,
  Info,
  Download,
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { MOAPreview } from '@/src/components/templates/MOAPreview';

export const MOA = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Returned');
  const [isUrgent, setIsUrgent] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Document Preview */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <DocumentWorkflow
            title="Memorandum of Agreement"
            docUrl="/templates/FT-CRD-128-01 Memorandum of Agreement (MOA) Template bet. STI and HTE.docx"
            fields={templateFields[getTemplateFilename("/templates/FT-CRD-128-01 Memorandum of Agreement (MOA) Template bet. STI and HTE.pdf")] || []}
            previewComponent={MOAPreview}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card title="Upload Memorandum of Agreement">
            <div className="space-y-5">
              <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Signed Memorandum of Agreement</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF only · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for Memorandum of Agreement">Select File</Button>
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    isUrgent
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                  )}
                >
                  <AlertCircle size={14} className={cn(isUrgent ? "animate-pulse" : "")} />
                  {isUrgent ? "High Priority Enabled" : "Mark as Urgent"}
                </button>
                <Button icon={<ShieldCheck size={14} />}>Submit for Processing</Button>
              </div>
            </div>
          </Card>

          <Card title="Review Status">
            <div className="space-y-5">
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                status === 'Returned' ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700" :
                  "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  status !== 'Pending' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" :
                    "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                )}>
                  {status === 'Approved' ? <ShieldCheck size={18} /> : status === 'Pending' ? <Clock size={18} /> : <AlertCircle size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {status === 'Approved' ? 'Approved' : status === 'Pending' ? 'Pending Review' : 'Returned'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Updated April 28, 2026</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                  <MessageSquare size={13} />
                  <span className="text-[11px] font-medium">Adviser Feedback</span>
                </div>
                <div className={cn(
                  "p-3 rounded-lg text-sm leading-relaxed",
                  status === 'Returned'
                    ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                )}>
                  {status === 'Approved' && "Legal partnership successfully registered."}
                  {status === 'Pending' && "Waiting for legal team to verify signatures."}
                  {status === 'Returned' && "The signatory must initial every page. Please re-scan with all 6 pages."}
                </div>
              </div>

              {status === 'Returned' && (
                <Button variant="primary" className="w-full" icon={<FileUp size={16} />}>
                  Upload Revised File
                </Button>
              )}
            </div>
          </Card>

          <Card title="Submission Info">
            <div className="space-y-3">
              {[
                { label: 'Required pages', value: '6' },
                { label: 'File type', value: 'PDF' },
                { label: 'Max size', value: '10 MB' },
                { label: 'Attempts', value: '2 of 3' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.label}</span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
