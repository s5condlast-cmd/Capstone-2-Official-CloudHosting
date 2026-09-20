/**
 * PhaseProgress.tsx
 * Top-Right Bento Card matching the reference design's "Popular products" card:
 * - List of key current-phase requirements with square thumbnails and status pills
 * - Full-width "View all 13 requirements" pill button
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Building,
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { RequirementItem, PracticumPhase } from './studentDashboard.types';

interface PhaseProgressProps {
  requirements: RequirementItem[];
  activePhase: PracticumPhase;
  totalRequirements: number;
}

export const PhaseProgress: React.FC<PhaseProgressProps> = ({
  requirements,
  activePhase,
  totalRequirements,
}) => {
  // Show the top 5 most relevant requirements for current phase tab
  const displayItems = requirements.slice(0, 5);

  const getThumbnailIcon = (id: string) => {
    if (id.includes('consent')) return ShieldCheck;
    if (id.includes('moa')) return Users;
    if (id.includes('proposal') || id.includes('endorsement')) return Building;
    if (id.includes('journal')) return BookOpen;
    if (id.includes('dtr')) return Calendar;
    if (id.includes('paper') || id.includes('appraisal')) return Award;
    return FileText;
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              Active Checklist
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Current milestone requirements
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {displayItems.filter(i => i.status === 'done').length}/{displayItems.length} Done
          </span>
        </div>

        {/* Requirements List (matching "Popular products" stacked rows) */}
        <div className="space-y-2">
          {displayItems.map(req => {
            const IconComponent = getThumbnailIcon(req.id);
            const isDone = req.status === 'done';
            const isRevision = req.status === 'revision' || req.status === 'returned';
            const isPending = req.status === 'pending';
            const isDraft = req.status === 'draft';
            const isLocked = req.status === 'locked';

            return (
              <Link
                key={req.id}
                to={req.link}
                className={cn(
                  "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs group select-none cursor-pointer",
                  isDone && "bg-muted/20 border-border/60 hover:bg-muted/40",
                  isRevision && "bg-rose-500/[0.03] border-rose-500/20 hover:bg-rose-500/[0.06]",
                  isPending && "bg-amber-500/[0.03] border-amber-500/20 hover:bg-amber-500/[0.06]",
                  isDraft && "bg-sky-500/[0.03] border-sky-500/20 hover:bg-sky-500/[0.06]",
                  req.status === 'not_started' && "bg-muted/20 border-border/60 hover:bg-muted/40",
                  isLocked && "opacity-60 bg-muted/10 border-dashed border-border/60 cursor-not-allowed pointer-events-none"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Square thumbnail with icon */}
                  <div
                    className={cn(
                      "size-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                      isDone && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                      isRevision && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                      isPending && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      isDraft && "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                      req.status === 'not_started' && "bg-muted/60 text-muted-foreground border-border/70",
                      isLocked && "bg-muted/40 text-muted-foreground/60 border-border/50"
                    )}
                  >
                    {isLocked ? <Lock size={16} /> : <IconComponent size={18} />}
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-bold text-foreground text-xs sm:text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                      {req.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {req.feedback ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">Remarks: {req.feedback}</span>
                      ) : (
                        req.description
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Status Badge */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {isDone && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Approved
                    </span>
                  )}
                  {isRevision && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                      Revision
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      In Review
                    </span>
                  )}
                  {isDraft && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      Draft
                    </span>
                  )}
                  {req.status === 'not_started' && (
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/70">
                      Start
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground/60 border border-border/60">
                      Locked
                    </span>
                  )}
                  <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Action: All Requirements Button */}
      <div className="pt-2">
        <Link to="/student/documents" className="block w-full">
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-full border border-border/80 hover:bg-muted/50 text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <span>View all {totalRequirements} requirements</span>
            <ArrowRight size={13} />
          </button>
        </Link>
      </div>
    </div>
  );
};
