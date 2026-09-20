/**
 * StatusSummary.tsx
 * Top-Left Bento Card matching the reference design's "Overview" card:
 * - Phase dropdown filter
 * - Two elevated metric tiles with big numbers and delta pill badges
 * - Next Priority Action callout
 * - Practicum Support Team avatar circles with quick-action button
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ClipboardCheck,
  ArrowRight,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/src/lib/utils';
import {
  PracticumPhase,
  NextPriorityAction,
  PracticumContact,
  StudentProfileData,
} from './studentDashboard.types';

interface StatusSummaryProps {
  profile: StudentProfileData;
  activePhaseTab: PracticumPhase;
  onPhaseChange: (phase: PracticumPhase) => void;
  hoursPercent: number;
  totalApproved: number;
  totalRequirements: number;
  totalPending: number;
  totalRevision: number;
  nextAction: NextPriorityAction;
  contacts: PracticumContact[];
}

export const StatusSummary: React.FC<StatusSummaryProps> = ({
  profile,
  activePhaseTab,
  onPhaseChange,
  hoursPercent,
  totalApproved,
  totalRequirements,
  totalPending,
  totalRevision,
  nextAction,
  contacts,
}) => {
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

  const phaseNames: Record<PracticumPhase, string> = {
    before_ojt: 'Phase 1: Before OJT',
    in_ojt: 'Phase 2: In OJT',
    final: 'Phase 3: Final Phase',
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* 1. Header: Overview Title & Phase Dropdown Pill */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
          Overview
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-muted/50 hover:bg-muted text-foreground border border-border/70 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{phaseNames[activePhaseTab]}</span>
              <ChevronDown size={14} className="opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border border-border bg-card">
            <DropdownMenuItem
              onClick={() => onPhaseChange('before_ojt')}
              className={cn("rounded-xl text-xs font-semibold cursor-pointer", activePhaseTab === 'before_ojt' && "bg-primary/10 text-primary")}
            >
              Phase 1: Before OJT
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPhaseChange('in_ojt')}
              className={cn("rounded-xl text-xs font-semibold cursor-pointer", activePhaseTab === 'in_ojt' && "bg-primary/10 text-primary")}
            >
              Phase 2: In OJT
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPhaseChange('final')}
              className={cn("rounded-xl text-xs font-semibold cursor-pointer", activePhaseTab === 'final' && "bg-primary/10 text-primary")}
            >
              Phase 3: Final Phase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Dual Elevated Metric Tiles (Matching Reference "Customers" & "Balance") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tile 1: Verified Practicum Hours */}
        <div className="bg-muted/30 border border-border/70 rounded-2xl p-5 shadow-2xs hover:border-primary/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                <Clock size={16} />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Rendered Hours
              </span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {hoursPercent}% Completed
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                {profile.renderedHours.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                / {profile.targetHours.toFixed(0)} hrs
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${hoursPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tile 2: Requirements Clearance */}
        <div className="bg-muted/30 border border-border/70 rounded-2xl p-5 shadow-2xs hover:border-primary/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold">
                <ClipboardCheck size={16} />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Clearance
              </span>
            </div>
            {totalRevision > 0 ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {totalRevision} Need Revision
              </span>
            ) : totalPending > 0 ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {totalPending} Under Review
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Up to Date
              </span>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                {totalApproved}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                of {totalRequirements} verified
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(totalApproved / totalRequirements) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(totalPending / totalRequirements) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Next Priority Action Callout Banner */}
      <div
        className={cn(
          "rounded-2xl p-4 sm:p-5 border shadow-2xs space-y-3 transition-all",
          nextAction.badgeTone === 'rose' && "bg-rose-500/[0.04] border-rose-500/30",
          nextAction.badgeTone === 'sky' && "bg-sky-500/[0.04] border-sky-500/30",
          nextAction.badgeTone === 'primary' && "bg-primary/[0.04] border-primary/30",
          nextAction.badgeTone === 'emerald' && "bg-emerald-500/[0.04] border-emerald-500/30"
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

      {/* 4. Support Team Avatars Row (Matching Reference's User Row) */}
      <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-foreground block">
            Practicum Support Team
          </span>
          <span className="text-[11px] text-muted-foreground">
            Adviser, Corporate Mentor & Coordinator
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2.5">
            {contacts.map(c => (
              <div
                key={c.id}
                title={`${c.name} (${c.role})`}
                className="size-9 rounded-full border-2 border-card bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shadow-xs transition-transform hover:scale-110 hover:z-10 cursor-pointer"
                onClick={() => setIsContactsModalOpen(true)}
              >
                {c.initials}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsContactsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer ml-1"
          >
            <span>View team</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Support Contacts Dialog */}
      <Dialog open={isContactsModalOpen} onOpenChange={setIsContactsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Practicum Support Contacts
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct institutional and corporate coordinator details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {contacts.map(c => (
              <div key={c.id} className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                  {c.initials}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground truncate">{c.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {c.role}
                    </span>
                  </div>
                  {c.company && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Building size={12} className="shrink-0 text-muted-foreground/70" />
                      <span className="truncate">{c.company}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
