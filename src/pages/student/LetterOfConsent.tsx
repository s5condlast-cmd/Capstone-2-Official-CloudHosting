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
  AlertCircle,
  UserCheck,
  Download,
  FileText,
  X,
  Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { ConsentPreview } from '@/src/components/templates/ConsentPreview';

const CONSENT_TEMPLATES = [
  {
    title: "Parent Consent Form (Without Training Fee)",
    pdfUrl: "/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf",
    docUrl: "/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.docx",
    description: "Use this form if the student intern is a minor and there is no training fee. A notarized copy should be provided to the APO."
  },
  {
    title: "Parent Consent Form (With Training Fee)",
    pdfUrl: "/templates/FT-CRD-130-00 OJT Parent Consent Form with Training Fee Template.pdf",
    docUrl: "/templates/FT-CRD-130-00 OJT Parent Consent Form with Training Fee Template.docx",
    description: "Consent Form with Training Fee. Use this form if the student intern is a minor. A notarized copy should be provided to the APO."
  },
  {
    title: "Student Consent Form (Without Training Fee)",
    pdfUrl: "/templates/FT-CRD-139-01 Student Consent Form without Training Fee Template.pdf",
    docUrl: "/templates/FT-CRD-139-01 Student Consent Form without Training Fee Template.docx",
    description: "Use this form if the student intern is of legal age and there is no training fee. A copy should be provided to the APO."
  },
  {
    title: "Student Consent Form (With Training Fee)",
    pdfUrl: "/templates/FT-CRD-138-01 Student Consent Form with Training Fee Template.pdf",
    docUrl: "/templates/FT-CRD-138-01 Student Consent Form with Training Fee Template.docx",
    description: "Consent Form with Training Fee. Use this form if the student intern is of legal age. A copy should be provided to the APO."
  }
];

export const LetterOfConsent = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<{ title: string; description: string } | null>(null);

  const selectedTemplate = CONSENT_TEMPLATES[selectedTemplateIndex];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Document Preview */}
        <div className="lg:col-span-2 h-full flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Required: Select Consent Form Template</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONSENT_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedTemplateIndex(idx);
                    if (template.title.includes("With Training Fee")) {
                      setActiveModal({ title: template.title, description: template.description });
                    }
                  }}
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
            previewComponent={ConsentPreview}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          <Card title="Upload Consent Form">
            <div className="space-y-5">
              <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Signed Letter of Consent</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF preferred · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for Consent Form">Select File</Button>
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
                <Button>Submit for Review</Button>
              </div>
            </div>
          </Card>

          <Card title="Status">
            <div className="space-y-5">
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  status === 'Approved' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" :
                    "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                )}>
                  {status === 'Approved' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {status === 'Approved' ? 'Approved' : 'Pending Review'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">No submission yet</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                  <MessageSquare size={13} />
                  <span className="text-[11px] font-medium">Adviser Feedback</span>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Awaiting your submission.
                </div>
              </div>
            </div>
          </Card>

          <Card title="Submission Info">
            <div className="space-y-3">
              {[
                { label: 'File type', value: 'PDF' },
                { label: 'Max size', value: '10 MB' },
                { label: 'Attempts', value: '0 of 3' },
                { label: 'Deadline', value: 'May 10, 2026' },
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

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                  <Info size={16} className="text-zinc-500" />
                  <span>Important Instructions</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">
                    {activeModal.title}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {activeModal.description}
                  </p>
                </div>
                <Button className="w-full" onClick={() => setActiveModal(null)}>
                  Understood
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
