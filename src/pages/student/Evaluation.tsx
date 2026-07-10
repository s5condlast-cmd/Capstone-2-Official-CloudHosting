import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  FileUp,
  ShieldCheck,
  History,
  AlertCircle,
  Upload,
  Lock,
  BookOpen,
  Clock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { EvaluationPreview } from '@/src/components/templates/EvaluationPreview';

export const Evaluation = () => {
  const [status] = useState<'Locked' | 'Pending' | 'Approved'>('Locked');

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left column - Document Preview */}
        <div className="lg:col-span-2 space-y-6">
          {status === 'Locked' && (
            <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl p-5 shadow-sm flex items-start gap-4">
              <div className="p-2 bg-white/10 dark:bg-black/10 rounded-lg shrink-0">
                <Lock size={20} className="text-white dark:text-zinc-900" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Locked: 460 Verified Hours Required</h3>
                <p className="text-sm text-zinc-300 dark:text-zinc-600">You have completed 122 hours. 338 hours remaining before you can submit the final evaluation.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col h-full">
            <DocumentWorkflow
              title="Performance Appraisal"
              docUrl="/templates/FT-CRD-133-02 Performance Appraisal Template.docx"
              fields={templateFields[getTemplateFilename("/templates/FT-CRD-133-02 Performance Appraisal Template.pdf")] || []}
              previewComponent={EvaluationPreview}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card title="Upload Performance Appraisal">
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <AlertCircle size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  This document is issued by your supervisor at the end of your practicum.
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
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Performance Appraisal</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF only · Max 10MB</p>
                  <Button variant="secondary" size="sm" disabled={status === 'Locked'} aria-label="Select file for Performance Appraisal">Select File</Button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button disabled={status === 'Locked'}>Submit Evaluation</Button>
              </div>
            </div>
          </Card>

          <Card title="Hours Progress">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">122</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">of 460 total hours</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: '26%' }} />
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <p>122 hours required per semester</p>
                <p>Estimated unlock: <span className="font-medium text-zinc-700 dark:text-zinc-300">June 20, 2026</span></p>
              </div>
            </div>
          </Card>

          <Card title="Submission Info">
            <div className="space-y-3">
              {[
                { label: 'File type', value: 'PDF' },
                { label: 'Max size', value: '10 MB' },
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
