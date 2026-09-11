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
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Editor and Document Preview */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          <div className="flex-1 flex flex-col min-h-0">
            <DocumentWorkflow
              key={`weekly-journal-${milestones[activeTab]}`}
              title={`Weekly Journal — ${milestones[activeTab]}`}
              docUrl=""
              templateId="h5"
              fields={[]}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6">
          <Card
            title={milestones[activeTab]}
            action={
              <div className="flex gap-1.5">
                {milestones.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => setActiveTab(idx)}
                    className={cn(
                      "px-2.5 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all whitespace-nowrap cursor-pointer",
                      activeTab === idx
                        ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-2xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {m.split(' (')[0]}
                  </button>
                ))}
              </div>
            }
          >
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
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">Upload Digitized Journal</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 truncate">PDF preferred · Max 10MB</p>
                <Button variant="secondary" size="sm" className="h-8 text-[11px] font-bold" aria-label="Select file for Weekly Journal">Select File</Button>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <Button variant="primary" id="btn-submit-journal" className="h-8 text-[11px] font-bold" icon={<Send size={13} />}>
                  Submit {milestones[activeTab]} Journal
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
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.term}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{item.date}</p>
                    </div>
                    <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Pending' ? 'warning' : 'neutral'}>
                      {item.status === 'Approved' ? 'Verified' : item.status === 'Pending' ? 'In Review' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                    {item.status === 'Approved' ? <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> :
                      item.status === 'Pending' ? <Clock size={13} className="text-amber-500 mt-0.5 shrink-0" /> :
                        <AlertCircle size={13} className="text-zinc-400 mt-0.5 shrink-0" />}
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                      {item.status === 'Approved' ? 'Verification successful.' : item.status === 'Pending' ? 'In review queue.' : 'Awaiting submission.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Adviser Note Alert Box */}
          <div className="p-3.5 bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold shrink-0">
                <MessageSquare size={12} />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Adviser Note</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8">
              Journals are locked until you reach the required hour milestones for each entry period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
