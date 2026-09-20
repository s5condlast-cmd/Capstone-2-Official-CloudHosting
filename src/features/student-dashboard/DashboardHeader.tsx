/**
 * DashboardHeader.tsx
 * Clean, modern greeting header with student metadata chips and primary repository link.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, FolderOpen, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';
import { StudentProfileData } from './studentDashboard.types';

interface DashboardHeaderProps {
  profile: StudentProfileData;
  isLoading: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  profile,
  isLoading,
  onRefresh,
}) => {
  const firstName = profile.name ? profile.name.split(' ')[0] : 'Intern';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {profile.profilePhase === 'before_ojt' ? 'Phase 1: Before OJT' : profile.profilePhase === 'in_ojt' ? 'Phase 2: In OJT' : 'Phase 3: Final Phase'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 text-xs font-medium">
            <span>ID:</span>
            <strong className="text-foreground font-mono font-semibold">{profile.studentId}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 text-xs font-medium">
            <span>Program:</span>
            <strong className="text-foreground font-semibold">{profile.program}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 text-xs font-medium">
            <span>Section:</span>
            <strong className="text-foreground font-semibold">{profile.section}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Placement:</span>
            <strong className="text-foreground font-semibold truncate max-w-[200px]">{profile.companyName}</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh dashboard state"
          className="bg-card border border-border/80 hover:bg-muted/80 rounded-2xl p-2.5 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
        >
          <RotateCw size={16} className={cn(isLoading && "animate-spin text-primary")} />
        </button>

        <Link to="/student/documents">
          <Button variant="default" size="sm" className="font-bold text-xs h-9 px-4 rounded-2xl cursor-pointer active:scale-95 shadow-xs">
            <FolderOpen size={14} className="mr-1.5" />
            <span>Document Repository</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
