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
  Wand2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { ProposalPreview } from '@/src/components/templates/ProposalPreview';

const PROPOSAL_TEMPLATES = [
  {
    title: "Proposal Letter to the Industry",
    pdfUrl: "/templates/FT-CRD-134-01 Proposal Letter to the Industry Template.pdf",
    docUrl: "/templates/FT-CRD-134-01 Proposal Letter to the Industry Template.docx"
  }
];

export const Proposal = () => {
  const [status] = useState<'Draft' | 'Submitted' | 'Letter Issued' | 'Signed Submitted' | 'Approved'>('Letter Issued');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const selectedTemplate = PROPOSAL_TEMPLATES[selectedTemplateIndex];

  const adminComments = [
    { author: 'Admin Office', msg: 'Proposal request received. Processing within 2-3 business days.', time: 'April 25, 2026' },
    { author: 'Admin Office', msg: 'Reminder: Please claim your letter before May 5.', time: 'April 30, 2026' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-full">
          <DocumentWorkflow
            title={selectedTemplate.title}
            docUrl={selectedTemplate.docUrl}
            fields={templateFields[getTemplateFilename(selectedTemplate.pdfUrl)] || []}
            previewComponent={ProposalPreview}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Step 2: Upload Signed - MOVED TO SIDEBAR */}
          <Card title="Step 2 — Submit Signed Letter">
            <div className="space-y-5">
              <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Signed Copy</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for Proposal Letter">Select File</Button>
              </div>
              <Button className="w-full" icon={<CheckCircle2 size={14} />}>Submit Signed Copy</Button>
            </div>
          </Card>

          {/* Status tracking */}
          <Card title="Tracking">
            <div className="space-y-4">


              {/* Progress steps */}
              <div className="space-y-0">
                {[
                  { label: 'Request submitted', done: true },
                  { label: 'Admin review', done: true },
                  { label: 'Letter issued', done: status === 'Letter Issued' || status === 'Signed Submitted' || status === 'Approved' },
                  { label: 'Signed copy uploaded', done: status === 'Signed Submitted' || status === 'Approved' },
                  { label: 'Final approval', done: status === 'Approved' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-xs",
                      step.done
                        ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-950"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    )}>
                      {step.done && '✓'}
                    </div>
                    <span className={cn(
                      "text-xs",
                      step.done ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"
                    )}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>



          {/* Admin / Office Comments */}
          <Card title="Admin Comments">
            <div className="space-y-3">
              {adminComments.map((comment, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-lg border text-sm space-y-1.5",
                  i === adminComments.length - 1
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
