import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { toast } from 'sonner';
import { 
  Award, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  FileSignature
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface InternCompletion {
  id: string;
  name: string;
  course: string;
  renderedHours: number;
  requiredHours: number;
  journalsApproved: number;
  totalJournals: number;
  appraisalSubmitted: boolean;
  clearanceSigned: boolean;
  signedDate: string | null;
}

const mockCompletions: InternCompletion[] = [
  {
    id: 'c-1',
    name: 'Maria Santos',
    course: 'BSIT 402',
    renderedHours: 460,
    requiredHours: 460,
    journalsApproved: 8,
    totalJournals: 8,
    appraisalSubmitted: true,
    clearanceSigned: false,
    signedDate: null
  },
  {
    id: 'c-2',
    name: 'Alice Brown',
    course: 'BSIT 402-401',
    renderedHours: 410,
    requiredHours: 460,
    journalsApproved: 7,
    totalJournals: 8,
    appraisalSubmitted: false,
    clearanceSigned: false,
    signedDate: null
  },
  {
    id: 'c-3',
    name: 'John Smith',
    course: 'BSIT 402',
    renderedHours: 50,
    requiredHours: 460,
    journalsApproved: 1,
    totalJournals: 8,
    appraisalSubmitted: false,
    clearanceSigned: false,
    signedDate: null
  }
];

export const InternshipCompletion: React.FC = () => {
  const [completions, setCompletions] = useState<InternCompletion[]>(mockCompletions);
  const [selectedId, setSelectedId] = useState<string>('c-1');

  const currentIntern = completions.find(c => c.id === selectedId) || completions[0];

  const handleSignClearance = (id: string) => {
    // Check if the intern is ready
    if (currentIntern.renderedHours < currentIntern.requiredHours || !currentIntern.appraisalSubmitted) {
      toast.error(`${currentIntern.name} has not met all clearance requirements yet.`);
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    setCompletions(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, clearanceSigned: true, signedDate: today };
      }
      return c;
    }));

    toast.success(`Internship Completion Clearance signed for ${currentIntern.name}!`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Internship Completion & Clearance</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issue official OJT completion clearance for interns who have met their required hours and evaluations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Intern Selection */}
        <div className="space-y-4">
          <Card title="Intern List">
            <div className="space-y-2">
              {completions.map(c => {
                const isReady = c.renderedHours >= c.requiredHours && c.appraisalSubmitted;
                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative",
                      selectedId === c.id
                        ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white text-white dark:text-zinc-950 shadow-md"
                        : "bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={cn("text-sm font-bold tracking-tight", selectedId === c.id ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100")}>
                          {c.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {c.course}
                        </p>
                      </div>
                      <Badge variant={c.clearanceSigned ? 'success' : isReady ? 'warning' : 'neutral'}>
                        {c.clearanceSigned ? 'Completed' : isReady ? 'Ready for Sign' : 'Pending Hours'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-zinc-100/10 dark:border-zinc-800/30">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Hours Rendered</span>
                      <span className="text-sm font-black">{c.renderedHours} / {c.requiredHours}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Side: Clearance Requirements & Details */}
        <div className="lg:col-span-2">
          {currentIntern && (
            <Card 
              title={`Completion Details: ${currentIntern.name}`}
              action={
                currentIntern.clearanceSigned && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-semibold text-xs bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={14} />
                    <span>Clearance Signed</span>
                  </div>
                )
              }
            >
              <div className="space-y-6">
                {/* Requirements Checkbox Checklist */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Completion Requirement Checklists</h4>

                  <div className="space-y-3">
                    {/* Rendered Hours Check */}
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl">
                      <div className="pt-0.5">
                        {currentIntern.renderedHours >= currentIntern.requiredHours ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <CheckCircle size={14} className="fill-current" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                            <Clock size={14} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">460-Hour Rendered Requirement</p>
                        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          Current progress: {currentIntern.renderedHours} of {currentIntern.requiredHours} hours completed.
                        </p>
                      </div>
                    </div>

                    {/* DTR weekly approvals Check */}
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl">
                      <div className="pt-0.5">
                        {currentIntern.journalsApproved >= currentIntern.totalJournals ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <CheckCircle size={14} className="fill-current" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                            <Clock size={14} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Weekly DTR Logs Approval</p>
                        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          Approved: {currentIntern.journalsApproved} of {currentIntern.totalJournals} weekly submissions.
                        </p>
                      </div>
                    </div>

                    {/* Performance Appraisal Check */}
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl">
                      <div className="pt-0.5">
                        {currentIntern.appraisalSubmitted ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <CheckCircle size={14} className="fill-current" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                            <Clock size={14} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Company Performance Appraisal</p>
                        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          {currentIntern.appraisalSubmitted ? 'Performance appraisal has been submitted.' : 'Performance appraisal is still pending submission.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signing Board Action */}
                {!currentIntern.clearanceSigned ? (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>Make sure all checklist requirements are marked complete before signing.</span>
                    </div>
                    <Button 
                      variant="primary"
                      icon={<FileSignature size={14} />}
                      disabled={currentIntern.renderedHours < currentIntern.requiredHours || !currentIntern.appraisalSubmitted}
                      onClick={() => handleSignClearance(currentIntern.id)}
                    >
                      Sign OJT Clearance
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-4">
                      <ShieldCheck size={28} className="text-green-600 dark:text-green-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Clearance Digitally Authenticated</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Signed on: {currentIntern.signedDate} via Host Company Supervisor Credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
