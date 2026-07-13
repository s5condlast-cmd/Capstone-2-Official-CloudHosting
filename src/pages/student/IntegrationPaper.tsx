import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  Upload, 
  FileUp, 
  MessageSquare, 
  Clock,
  CheckCircle2,
  Award,
  Lock,
  FileText,
  Download,
  Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';

export const IntegrationPaper = () => {
  const [status] = useState<'Locked' | 'Pending' | 'Approved'>('Pending');

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left column - Document Preview */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <DocumentWorkflow
            title="Integration Paper"
            docUrl="/templates/FT-CRD-127-01 Integration Paper Template.docx"
            fields={templateFields[getTemplateFilename("/templates/FT-CRD-127-01 Integration Paper Template.pdf")] || []}
            useDocxPreview={true}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Letter of Recognition Upload */}
          <Card title="Upload Integration Paper">
            <div className="space-y-5">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="text-zinc-500 dark:text-zinc-400 mt-0.5 shrink-0" size={13} />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  <strong>Reminder:</strong> We recommend uploading a scanned PDF. Please ensure all signatures are clearly visible and scanned correctly.
                </p>
              </div>

              <div className={cn(
                "border border-dashed rounded-xl p-6 text-center transition-colors relative overflow-hidden",
                status === 'Locked' 
                  ? "border-zinc-200 dark:border-zinc-800 cursor-not-allowed" 
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer group"
              )}>
                {status === 'Locked' && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[1px]">
                    <Lock size={24} className="text-zinc-300 dark:text-zinc-600 mb-2" />
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Unlocks at 460 hours</span>
                  </div>
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Integration Paper</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF only · Max 10MB</p>
                  <Button variant="secondary" size="sm" disabled={status === 'Locked'} aria-label="Select file for Integration Paper">Select File</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Submission Info">
            <div className="space-y-3">
              {[
                { label: 'File type', value: 'PDF' },
                { label: 'Max size', value: '10 MB each' },
                { label: 'Status', value: 'Locked' },
                { label: 'Prerequisite', value: '460 hours' },
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
