/**
 * NeedsAttention.tsx (Attendance Activity & Hours Chart)
 * Bottom-Left Bento Card matching the reference design's "Product view" card:
 * - Time filter dropdown pill ("This week ▾")
 * - Large primary stat ("32.0 hrs")
 * - 7-day visual pill bar chart with today's highlighted active bar & floating tooltip
 * - Quick DTR action button
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ChevronDown, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';
import { WeeklyAttendanceDay, StudentProfileData } from './studentDashboard.types';

interface NeedsAttentionProps {
  profile: StudentProfileData;
  weeklyAttendance: WeeklyAttendanceDay[];
  totalWeeklyHours: number;
}

export const NeedsAttention: React.FC<NeedsAttentionProps> = ({
  profile,
  weeklyAttendance,
  totalWeeklyHours,
}) => {
  const maxHours = 10; // Normal work day ceiling

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* 1. Header with Time Range Dropdown */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            Attendance Activity
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Weekly rendered practicum hours
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/50 text-foreground border border-border/70 shadow-2xs">
            <span>This week</span>
            <ChevronDown size={14} className="opacity-60" />
          </span>
        </div>
      </div>

      {/* 2. Primary Stat & 7-Day Pill Bar Chart (Matching Reference "Product view") */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-2">
        {/* Left Big Highlight Stat */}
        <div className="md:col-span-4 space-y-1.5 pb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Rendered This Week
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
              {totalWeeklyHours.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-muted-foreground">hrs</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium pt-1">
            Target: 40.0 hrs/week · Final clearance: 460.0 hrs
          </p>
        </div>

        {/* Right 7-Day Bar Chart */}
        <div className="md:col-span-8 flex items-end justify-between gap-2.5 sm:gap-4 h-48 sm:h-52 pt-8 px-2 sm:px-4">
          {weeklyAttendance.map((day, idx) => {
            const heightPercent = Math.max(15, Math.min(100, (day.hours / maxHours) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                {/* Floating Tooltip above active day (Matching green dot in reference) */}
                {day.isToday && (
                  <div className="absolute -top-7 z-10 flex flex-col items-center animate-in fade-in duration-200">
                    <div className="bg-foreground text-background text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap">
                      <span>{day.hours > 0 ? `${day.hours.toFixed(1)}h` : 'Today'}</span>
                    </div>
                    <div className="size-2 rounded-full border-2 border-primary bg-background -mt-0.5" />
                  </div>
                )}

                {/* Vertical Pill Bar */}
                <div className="w-full max-w-[42px] h-full flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-2xl transition-all duration-500 cursor-pointer shadow-2xs group-hover:opacity-90",
                      day.isToday
                        ? "bg-primary shadow-xs"
                        : day.isRendered
                        ? "bg-muted-foreground/20 hover:bg-muted-foreground/30"
                        : "bg-muted/40"
                    )}
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.dayShort}: ${day.hours.toFixed(1)} hrs`}
                  />
                </div>

                {/* Day label underneath */}
                <div className="text-center mt-2.5 space-y-0.5">
                  <span className={cn(
                    "text-[11px] font-bold block",
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {day.dayShort}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-medium block">
                    {day.dayNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Milestone Target and Fast Action */}
      <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span>Logged: <strong className="text-foreground">{profile.renderedHours.toFixed(1)} hrs</strong></span>
          <span>·</span>
          <span>Midterm Target: <strong className="text-foreground">230.0 hrs</strong></span>
          <span>·</span>
          <span>Remaining: <strong className="text-foreground">{(profile.targetHours - profile.renderedHours).toFixed(1)} hrs</strong></span>
        </div>

        <Link to="/student/documents?phase=in_ojt">
          <Button variant="default" size="sm" className="font-bold text-xs h-9 px-4 rounded-xl cursor-pointer active:scale-95 shadow-xs">
            <CalendarCheck2 size={14} className="mr-1.5" />
            <span>Log DTR Attendance</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
