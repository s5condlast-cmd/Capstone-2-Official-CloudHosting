/**
 * StudentDashboardView.tsx
 * Master Bento Grid View orchestrating the 4 cards:
 * 1. Overview (Hours, Clearance, Next Action, Team)
 * 2. Active Checklist (Matching Popular Products)
 * 3. Attendance Activity (Matching Product View Bar Chart)
 * 4. Adviser Remarks (Matching Comments Feed)
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentDashboardViewModel } from './studentDashboard.types';
import { DashboardHeader } from './DashboardHeader';
import { StatusSummary } from './StatusSummary';
import { PhaseProgress } from './PhaseProgress';
import { NeedsAttention } from './NeedsAttention';
import { RecentActivity } from './RecentActivity';
import { StudentDashboardSkeleton } from './StudentDashboardSkeleton';

interface StudentDashboardViewProps {
  vm: StudentDashboardViewModel;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ vm }) => {
  if (vm.isLoading) {
    return <StudentDashboardSkeleton />;
  }

  if (vm.error) {
    return (
      <div className="bg-card border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Could not load dashboard data</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{vm.error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void vm.refresh()}
          className="rounded-xl text-xs font-semibold"
        >
          <RefreshCw size={12} className="mr-1.5" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto pb-12">
      {/* 1. Top Greeting Header with Metadata Chips */}
      <DashboardHeader
        profile={vm.profile}
        isLoading={vm.isLoading}
        onRefresh={() => void vm.refresh()}
      />

      {/* 2. Asymmetric Bento Grid (7 cols left, 5 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Practicum Overview + Attendance Bar Chart */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <StatusSummary
            profile={vm.profile}
            activePhaseTab={vm.activePhaseTab}
            onPhaseChange={vm.setActivePhaseTab}
            hoursPercent={vm.hoursPercent}
            totalApproved={vm.totalApproved}
            totalRequirements={vm.totalRequirements}
            totalPending={vm.totalPending}
            totalRevision={vm.totalRevision}
            nextAction={vm.nextAction}
            contacts={vm.contacts}
          />

          <NeedsAttention
            profile={vm.profile}
            weeklyAttendance={vm.weeklyAttendance}
            totalWeeklyHours={vm.weeklyTotalHours}
          />
        </div>

        {/* RIGHT COLUMN (5 cols): Active Checklist + Adviser Remarks Feed */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          <PhaseProgress
            requirements={vm.phaseRequirements}
            activePhase={vm.activePhaseTab}
            totalRequirements={vm.totalRequirements}
          />

          <RecentActivity feedbackList={vm.feedbackList} />
        </div>
      </div>
    </div>
  );
};
