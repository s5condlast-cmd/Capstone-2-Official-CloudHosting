import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DocumentStatus } from '@/src/lib/submissionStorage';

interface DocumentProgressTimelineProps {
  status: DocumentStatus | 'Draft';
}

export const DocumentProgressTimeline: React.FC<DocumentProgressTimelineProps> = ({ status }) => {
  const isPendingAdviser = status === 'Pending Adviser Review';
  const isPendingAdmin = status === 'Pending Final Approval';
  const isRevision = status === 'Revision Required';
  const isApproved = status === 'Approved';

  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      completed: status !== 'Draft',
      isCurrent: status === 'Draft' // Draft means they haven't submitted yet
    },
    {
      id: 'adviser',
      label: 'Adviser Review',
      completed: isPendingAdmin || isApproved,
      isCurrent: isPendingAdviser || isRevision,
      isError: isRevision
    },
    {
      id: 'admin',
      label: 'Final Approval',
      completed: isApproved,
      isCurrent: isPendingAdmin
    },
    {
      id: 'completed',
      label: 'Completed',
      completed: isApproved,
      isCurrent: isApproved
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Submission Progress</h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white dark:bg-zinc-950 z-10 shrink-0",
              step.completed ? "border-green-500 text-green-500" :
                step.isError ? "border-red-500 text-red-500" :
                step.isCurrent ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100" :
                "border-zinc-300 dark:border-zinc-700 text-zinc-300 dark:text-zinc-700"
            )}>
              {step.completed ? (
                <CheckCircle2 size={12} className="fill-current text-white dark:text-zinc-950" />
              ) : step.isError ? (
                <AlertCircle size={12} className="fill-current text-white dark:text-zinc-950" />
              ) : step.isCurrent ? (
                <Clock size={12} className="animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </div>
            
            <div className={cn(
              "w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border",
              step.completed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50" :
                step.isError ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" :
                step.isCurrent ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm" :
                "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 opacity-60"
            )}>
              <span className={cn(
                "text-xs font-bold block",
                step.completed ? "text-green-700 dark:text-green-400" :
                  step.isError ? "text-red-700 dark:text-red-400" :
                  step.isCurrent ? "text-zinc-900 dark:text-zinc-100" :
                  "text-zinc-500 dark:text-zinc-400"
              )}>
                {step.label}
              </span>
              {step.isError && (
                <span className="text-[10px] text-red-600 dark:text-red-500 mt-1 block">
                  Action Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
