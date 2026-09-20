/**
 * NextActionCard.tsx
 * Focused action card highlighting the single authoritative next step.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';
import { NextPriorityAction } from './studentDashboard.types';

interface NextActionCardProps {
  nextAction: NextPriorityAction;
  className?: string;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({ nextAction, className }) => {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5 border shadow-2xs space-y-3 transition-all",
        nextAction.badgeTone === 'rose' && "bg-rose-500/[0.04] border-rose-500/30",
        nextAction.badgeTone === 'sky' && "bg-sky-500/[0.04] border-sky-500/30",
        nextAction.badgeTone === 'primary' && "bg-primary/[0.04] border-primary/30",
        nextAction.badgeTone === 'emerald' && "bg-emerald-500/[0.04] border-emerald-500/30",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border",
              nextAction.badgeTone === 'rose' && "bg-rose-500/10 text-rose-600 border-rose-500/20",
              nextAction.badgeTone === 'sky' && "bg-sky-500/10 text-sky-600 border-sky-500/20",
              nextAction.badgeTone === 'primary' && "bg-primary/10 text-primary border-primary/20",
              nextAction.badgeTone === 'emerald' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            )}
          >
            {nextAction.badgeTone === 'rose' ? (
              <AlertTriangle size={18} />
            ) : nextAction.badgeTone === 'sky' ? (
              <FileText size={18} />
            ) : nextAction.badgeTone === 'emerald' ? (
              <CheckCircle2 size={18} />
            ) : (
              <Sparkles size={18} />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                  nextAction.badgeTone === 'rose' && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
                  nextAction.badgeTone === 'sky' && "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
                  nextAction.badgeTone === 'primary' && "bg-primary/10 text-primary border-primary/20",
                  nextAction.badgeTone === 'emerald' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                )}
              >
                {nextAction.badgeText}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              {nextAction.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {nextAction.description}
            </p>
          </div>
        </div>

        <Link to={nextAction.link} className="shrink-0 self-start sm:self-auto">
          <Button variant="default" size="sm" className="font-bold text-xs h-9 px-4 rounded-xl cursor-pointer active:scale-95 shadow-xs">
            <span>{nextAction.ctaText}</span>
            <ArrowRight size={13} className="ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
