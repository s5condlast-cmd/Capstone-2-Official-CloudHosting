import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import {
  FileUp,
  ClipboardCheck,
  MessageSquare,
  User,
  Send,
  Upload,
  CheckCircle2,
  Building,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  Pen,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Wand2,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { useDocumentStatus } from '@/src/hooks/useDocumentStatus';
import { DocumentProgressTimeline } from '@/src/components/compose/DocumentProgressTimeline';


const ENDORSEMENT_TEMPLATES = [
  {
    title: "STI OJT Endorsement Letter",
    pdfUrl: "/templates/FT-CRD-135-01 STI OJT Endorsement Letter Template.pdf",
    docUrl: "/templates/FT-CRD-135-01 STI OJT Endorsement Letter Template.docx"
  }
];

export const STIOJTEndorsementLetter = () => {
  const { status, isLoading } = useDocumentStatus('John Dwayne B. Guaniso', 'STI OJT Endorsement Letter');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const selectedTemplate = ENDORSEMENT_TEMPLATES[selectedTemplateIndex];

  const adviserComments = [
    { author: 'Adviser', msg: 'Please make sure your endorsement letter is signed by the company supervisor before submitting.', time: 'April 24, 2026' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-full">
          <DocumentWorkflow
            title={selectedTemplate.title}
            docUrl={selectedTemplate.docUrl}
            fields={templateFields[getTemplateFilename(selectedTemplate.pdfUrl)] || []}
            useDocxPreview={true}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Step 2: Upload Signed - MOVED TO SIDEBAR */}
          <Card title="Step 2 — Submit Signed Letter">
            <div className="space-y-5">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="text-zinc-500 dark:text-zinc-400 mt-0.5 shrink-0" size={13} />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  <strong>Reminder:</strong> We recommend uploading a scanned PDF. Please ensure all signatures are clearly visible and scanned correctly.
                </p>
              </div>

              <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Signed Copy</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for Endorsement Letter">Select File</Button>
              </div>
              <Button className="w-full" icon={<CheckCircle2 size={14} />}>Submit Signed Copy</Button>
            </div>
          </Card>

          {/* Progress Timeline */}
          <Card title="Submission Progress">
            <div className="p-1">
              <DocumentProgressTimeline status={status} />
            </div>
          </Card>



          {/* Adviser Comments */}
          <Card title="Adviser Comments">
            <div className="space-y-3">
              {adviserComments.map((comment, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-lg border text-sm space-y-1.5",
                  i === adviserComments.length - 1
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                )}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{comment.author}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">{comment.time}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{comment.msg}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Submission info */}
          <Card title="Submission Info">
            <div className="space-y-3">
              {[
                { label: 'File type', value: 'PDF' },
                { label: 'Max size', value: '10 MB' },
                { label: 'Status', value: status },
                { label: 'Deadline', value: 'May 15, 2026' },
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
