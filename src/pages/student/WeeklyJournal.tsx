import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  FileUp,
  Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
export const WeeklyJournal: React.FC = () => {
  const milestones = ['Prelim', 'Midterm', 'Pre-finals', 'Finals'] as const;
  const [activeTab, setActiveTab] = useState<number>(0);

  const history = [
    { term: 'Prelim', date: 'Oct 20, 2024', status: 'Approved' },
    { term: 'Midterm', date: 'Nov 15, 2024', status: 'Pending' },
    { term: 'Pre-finals', date: '—', status: 'Missing' },
    { term: 'Finals', date: '—', status: 'Missing' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor and Document Preview */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <DocumentWorkflow
            title={`Weekly Journal — ${milestones[activeTab]}`}
            docUrl="/templates/FT-CRD-167-00 Weekly Journal Template.docx"
            fields={templateFields[getTemplateFilename("/templates/FT-CRD-167-00 Weekly Journal Template.pdf")] || []}
            useDocxPreview={true}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card
            title={milestones[activeTab]}
            action={
              <div className="flex gap-1.5">
                {milestones.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => setActiveTab(idx)}
                    className={cn(
                      "px-2.5 h-7 rounded-lg flex items-center justify-center text-[10px] font-medium transition-colors whitespace-nowrap",
                      activeTab === idx
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {m.split(' (')[0]}
                  </button>
                ))}
              </div>
            }
          >
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
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Upload Digitized Journal</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PDF preferred · Max 10MB</p>
                <Button variant="secondary" size="sm" aria-label="Select file for Weekly Journal">Select File</Button>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button id="btn-submit-journal" icon={<Send size={14} />}>Submit {milestones[activeTab]} Weekly Journal</Button>
              </div>
            </div>
          </Card>

          <Card title="Submission History">
            <div className="space-y-1">
              {history.map((item, i) => (
                <div key={i} className="p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.term}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{item.date}</p>
                    </div>
                    <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Pending' ? 'warning' : 'neutral'}>
                      {item.status === 'Approved' ? 'Verified' : item.status === 'Pending' ? 'In Review' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                    {item.status === 'Approved' ? <CheckCircle2 size={12} className="text-zinc-500 mt-0.5 shrink-0" /> :
                      item.status === 'Pending' ? <Clock size={12} className="text-zinc-400 mt-0.5 shrink-0" /> :
                        <AlertCircle size={12} className="text-zinc-300 mt-0.5 shrink-0" />}
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.status === 'Approved' ? 'Verification successful.' : item.status === 'Pending' ? 'In review queue.' : 'Awaiting submission.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800" title="Adviser Note">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Journals are locked until you reach the required hour milestones for each entry period.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
