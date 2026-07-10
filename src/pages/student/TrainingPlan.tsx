import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Upload, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { TrainingPlanPreview } from '@/src/components/templates/TrainingPlanPreview';
const TRAINING_PLAN_TEMPLATES = [
  {
    title: "OJT Training Plan (BSIT/BSCS/BSIS/ACT/ITP)",
    pdfUrl: "/templates/FT-CRD-176-00 OJT Training Plan_BSIT-BSCS-BSIS-ACT-ITP.pdf",
    docUrl: "/templates/FT-CRD-176-00 OJT Training Plan_BSIT-BSCS-BSIS-ACT-ITP.docx"
  },
  {
    title: "OJT Training Plan (BSCpE)",
    pdfUrl: "/templates/FT-CRD-175-00 OJT Training Plan_BSCpE (1).pdf",
    docUrl: "/templates/FT-CRD-175-00 OJT Training Plan_BSCpE (1).docx"
  }
];

export const TrainingPlan = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const selectedTemplate = TRAINING_PLAN_TEMPLATES[selectedTemplateIndex];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-full flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Required: Select Training Plan Template</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRAINING_PLAN_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTemplateIndex(idx)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2",
                    selectedTemplateIndex === idx
                      ? "bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-50 shadow-xs"
                      : "bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px]",
                    selectedTemplateIndex === idx
                      ? "border-white dark:border-zinc-950 bg-white/20 dark:bg-zinc-950/20"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}>
                    {selectedTemplateIndex === idx && "✓"}
                  </div>
                  <span className="leading-snug whitespace-nowrap">{template.title}</span>
                </button>
              ))}
            </div>
          </div>

          <DocumentWorkflow
            title={selectedTemplate.title}
            docUrl={selectedTemplate.docUrl}
            fields={templateFields[getTemplateFilename(selectedTemplate.pdfUrl)] || []}
            previewComponent={TrainingPlanPreview}
          />
        </div>
        <div className="space-y-6">
          <Card title="Upload OJT Training Plan">
            <div className="space-y-5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                The Training Plan outlines the tasks, objectives, and expected outcomes of your OJT. It should be prepared in coordination with your company supervisor and approved by your practicum adviser.
              </p>
              <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload OJT Training Plan</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF or DOCX · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for OJT Training Plan">Select File</Button>
              </div>
              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button>Submit for Review</Button>
              </div>
            </div>
          </Card>
          <Card title="Status">
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", status === 'Approved' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400")}>
                  {status === 'Approved' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{status === 'Approved' ? 'Approved' : 'Pending Review'}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">No submission yet</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                  <MessageSquare size={13} />
                  <span className="text-[11px] font-medium">Adviser Feedback</span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Awaiting your submission.</div>
              </div>
            </div>
          </Card>
          <Card title="Submission Info">
            <div className="space-y-3">
              {[{ label: 'File type', value: 'PDF / DOCX' }, { label: 'Max size', value: '10 MB' }, { label: 'Attempts', value: '0 of 3' }, { label: 'Deadline', value: 'May 20, 2026' }].map((item, i) => (
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
