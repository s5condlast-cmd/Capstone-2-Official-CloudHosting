import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  BookOpen as BookOpenIcon,
  ClipboardCheck as ClipboardCheckIcon,
  ArrowRight as ArrowRightIcon,
  User as UserIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircle2,
  Users as UsersIcon,
  Clock as ClockIcon,
  Lock as LockIcon,
  UserCheck as UserCheckIcon,
  ClipboardList as ClipboardListIcon,
  Award as AwardIcon,
  Building2 as BuildingIcon,
  MapPin as MapPinIcon,
  Sparkles,
  CheckCheck,
  Plus,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface RequirementItem {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  status: 'done' | 'pending' | 'progress' | 'empty' | 'locked';
  link: string;
}

const beforeOJTRequirements: RequirementItem[] = [
  { label: 'Application Letter', value: 'Approved', icon: UserIcon, status: 'done', link: '/student/application-letter' },
  { label: 'Consent Forms', value: 'Not Started', icon: UserCheckIcon, status: 'empty', link: '/student/consent' },
  { label: 'MOA Template', value: 'Approved', icon: UsersIcon, status: 'done', link: '/student/moa' },
  { label: 'Endorsement Letter', value: 'Pending Approval', icon: ClipboardCheckIcon, status: 'pending', link: '/student/endorsement' },
];

const inOJTRequirements: RequirementItem[] = [
  { label: 'Weekly Journal', value: 'Prelim Phase', icon: BookOpenIcon, status: 'progress', link: '/student/journal' },
  { label: 'DTR Form', value: 'Not Started', icon: CalendarIcon, status: 'empty', link: '/student/dtr' },
  { label: 'Training Plan Form', value: 'Not Started', icon: ClipboardListIcon, status: 'empty', link: '/student/training-plan' },
];

const finalRequirements: RequirementItem[] = [
  { label: 'Performance Appraisal', value: 'Locked', icon: CheckCircleIcon, status: 'locked', link: '/student/evaluation' },
  { label: 'Integration Paper', value: 'Locked', icon: AwardIcon, status: 'locked', link: '/student/completion' },
  { label: 'Clearance Sign-off', value: 'Locked', icon: AwardIcon, status: 'locked', link: '/student/completion' },
];

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  link?: string;
}

const INITIAL_TODOS: TodoItem[] = [
  { id: '1', text: 'Upload Endorsement Letter (Signed by coordinator)', done: false, link: '/student/endorsement' },
  { id: '2', text: 'Log DTR hours for today (8 hrs remaining)', done: false, link: '/student/dtr' },
  { id: '3', text: 'Revise section 2 on Weekly Journal #4', done: false, link: '/student/journal' },
  { id: '4', text: 'Submit Parent Consent Form (With Fee)', done: true, link: '/student/consent' },
];

interface CompletedTaskItem {
  id: string;
  title: string;
  tag: string;
  desc: string;
  link?: string;
}

const COMPLETED_TASKS: CompletedTaskItem[] = [
  {
    id: 'c1',
    title: 'Student Application Letter',
    tag: 'Before OJT',
    desc: 'Approved by Dr. Sarah Johnson · Placement clearance cleared.',
    link: '/student/application-letter',
  },
  {
    id: 'c2',
    title: 'MOA Template Document',
    tag: 'Before OJT',
    desc: 'Verified agreement with InnoTech Labs Inc. (Pasig City).',
    link: '/student/moa',
  },
  {
    id: 'c3',
    title: 'Parent Consent Form (With Fee)',
    tag: 'Consent',
    desc: 'Uploaded and signed by parent/legal guardian.',
    link: '/student/consent',
  },
  {
    id: 'c4',
    title: 'Company Internship Placement',
    tag: 'Deployment',
    desc: 'Assigned under Engr. Paolo Reyes (Frontend Dev Intern).',
    link: '/student/dtr',
  },
];

export const StudentDashboard: React.FC = () => {
  // Completed tasks modal state
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  // Requirements tab
  const [activePhaseTab, setActivePhaseTab] = useState<'before' | 'in' | 'final'>('before');

  // Right sidebar widget states
  const [isCalendarHidden, setIsCalendarHidden] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 8, 1)); // September 2026

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // Mini calendar calculation (Sep 2026: 30 days, starts Tue Sep 1)
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const monthName = calendarMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const miniDays: { day: number; currentMonth: boolean; isToday: boolean }[] = [];
  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    miniDays.push({ day: prevMonthDays - i, currentMonth: false, isToday: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    // Sep 2, 2026 is highlighted as today matching reference
    const isToday = calYear === 2026 && calMonth === 8 && d === 2;
    miniDays.push({ day: d, currentMonth: true, isToday });
  }
  // Remaining to fill 35 cells
  const remainingCells = 35 - miniDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    miniDays.push({ day: d, currentMonth: false, isToday: false });
  }

  const renderStepperSection = (items: RequirementItem[]) => {
    return (
      <div className="relative pt-3 pb-2 px-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-6 sm:gap-2 relative">
          {items.map((req, idx) => {
            const isDone = req.status === 'done';
            const isPending = req.status === 'pending' || req.status === 'progress';
            const isLocked = req.status === 'locked';

            return (
              <React.Fragment key={req.label}>
                <div className="flex-1 flex flex-col items-center text-center relative group min-w-0">
                  {/* Dotted Horizontal Connector Line */}
                  {idx < items.length - 1 && (
                    <div
                      className={cn(
                        "hidden sm:block absolute top-4 left-[50%] w-full h-[2px] border-t-2 border-dashed transition-colors z-0",
                        isDone ? "border-emerald-500/60 dark:border-emerald-500/40" : "border-border"
                      )}
                    />
                  )}

                  <Link
                    to={req.link}
                    className="relative z-10 flex flex-col items-center text-center w-full group cursor-pointer"
                  >
                    {/* Step Circle */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 shadow-2xs group-hover:scale-110",
                        isDone && "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-600/20",
                        isPending && "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 ring-4 ring-muted",
                        !isDone && !isPending && !isLocked && "bg-card border-2 border-border text-muted-foreground",
                        isLocked && "bg-muted/60 border-2 border-border/80 text-muted-foreground/40 opacity-60"
                      )}
                    >
                      {isDone ? (
                        <CheckCheck size={16} strokeWidth={3} />
                      ) : isLocked ? (
                        <LockIcon size={12} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div className="mt-3 space-y-0.5 max-w-[170px]">
                      <h4 className={cn(
                        "text-xs sm:text-sm font-bold tracking-tight transition-colors leading-tight",
                        isLocked ? "text-muted-foreground/50" : "text-foreground group-hover:text-primary"
                      )}>
                        {req.label}
                      </h4>
                      <p className={cn(
                        "text-[11px] font-medium leading-normal truncate",
                        isDone && "text-emerald-600 dark:text-emerald-400 font-semibold",
                        isPending && "text-amber-600 dark:text-amber-400 font-semibold",
                        !isDone && !isPending && !isLocked && "text-muted-foreground",
                        isLocked && "text-muted-foreground/40"
                      )}>
                        {req.value}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Mobile vertical divider */}
                {idx < items.length - 1 && (
                  <div className="sm:hidden w-[2px] h-6 border-l-2 border-dashed border-border mx-auto my-1" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header: Greeting + Completed Tasks Card Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Greeting text saying hi to the user */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>Hi John, welcome back!</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            STI Marikina Practicum Portal — Keep track of your requirements and internship hours.
          </p>
        </div>

        {/* Right Side: Card box where they can view completed tasks */}
        <div
          onClick={() => setIsCompletedModalOpen(true)}
          className="bg-card border border-border/80 hover:border-border rounded-2xl p-3 sm:p-3.5 shadow-xs flex items-center gap-3.5 shrink-0 transition-all cursor-pointer group select-none hover:shadow-sm"
        >
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 size={20} />
          </div>
          <div className="space-y-0.5 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">Completed Tasks</span>
              <Badge className="bg-emerald-600 text-white dark:bg-emerald-500 border-none text-[10px] h-4.5 px-1.5 font-bold">
                {COMPLETED_TASKS.length + todos.filter((t) => t.done).length} Done
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Click to view finished items
            </p>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-muted/60 group-hover:bg-muted text-foreground font-bold text-xs transition-colors flex items-center gap-1">
            <span>View</span>
            <ArrowRightIcon size={12} />
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout: 9 cols main, 3 cols sidebar (Matches DTRApproval, CalendarPage & WeeklyJournalReview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Column (9 cols) */}
        <div className="lg:col-span-9 space-y-6 min-w-0">
          {/* Main Hero Card: Practicum Requirements Checklist */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <span>Practicum Requirements Checklist</span>
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Select a phase tab to track and manage your official OJT document submissions.
                </p>
              </div>

              {/* Phase Segmented Buttons */}
              <div className="bg-muted/60 border border-border rounded-xl p-1 flex items-center gap-1 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActivePhaseTab('before')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs",
                    activePhaseTab === 'before'
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Before OJT</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums",
                    activePhaseTab === 'before' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  )}>
                    4
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('in')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs",
                    activePhaseTab === 'in'
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>In OJT</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums",
                    activePhaseTab === 'in' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  )}>
                    3
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('final')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs",
                    activePhaseTab === 'final'
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Final</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums",
                    activePhaseTab === 'final' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  )}>
                    3
                  </span>
                </button>
              </div>
            </div>

            {/* Stepper Timeline matching selected phase */}
            <div className="py-2">
              {activePhaseTab === 'before' && renderStepperSection(beforeOJTRequirements)}
              {activePhaseTab === 'in' && renderStepperSection(inOJTRequirements)}
              {activePhaseTab === 'final' && renderStepperSection(finalRequirements)}
            </div>
          </div>

          {/* Active Deployment & Attendance Summary Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border border-zinc-800 text-white rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="p-2.5 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <BuildingIcon size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#0092c7] text-white border-none font-bold text-[10px] px-2 py-0.5">
                    Active Deployment
                  </Badge>
                  <span className="text-xs text-zinc-400 font-medium">InnoTech Labs Inc. · Pasig City</span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Supervisor: Engr. Paolo Reyes
                </h4>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium pt-0.5">
                  <span className="font-bold text-white">122 / 460 Hours</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold">26.5% Rendered</span>
                  <span>·</span>
                  <span className="text-zinc-400">338 hrs remaining</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
              <Link to="/student/dtr" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#0092c7] hover:bg-[#0092c7]/90 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer">
                  <ClockIcon size={14} className="mr-1.5" />
                  Log Today's DTR
                </Button>
              </Link>
            </div>
          </div>

          {/* Next Step Checklist Card */}
          <Card className="border-border hover:shadow-md transition-shadow" title="Next Step Checklist">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground">
                  <FileTextIcon size={20} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Action Required</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Before OJT Phase</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">Upload Endorsement Letter</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    Ensure coordinator signature is secured to finalize your verified company endorsement.
                  </p>
                </div>
              </div>

              {/* Sub-steps flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
                {[
                  { label: '1. Download Template', status: 'completed', desc: 'Template retrieved' },
                  { label: '2. Faculty Signature', status: 'completed', desc: 'Signed by coordinator' },
                  { label: '3. Upload Portal', status: 'active', desc: 'File upload pending' }
                ].map((step, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-xl border text-xs",
                    step.status === 'completed' && "bg-muted/40 border-border/60 opacity-80",
                    step.status === 'active' && "bg-muted/80 border-border"
                  )}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <span className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold",
                        step.status === 'completed' ? "bg-foreground text-background" : "bg-muted-foreground text-background"
                      )}>
                        {step.status === 'completed' ? '✓' : '3'}
                      </span>
                      <span className="text-foreground">{step.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium pl-6">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Link to="/student/endorsement">
                  <Button variant="primary" size="sm" icon={<ArrowRightIcon size={14} />}>
                    Go to Submission
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 3 Widgets (Calendar, To-do, Announcements) - 3 cols (Standard Compact Sidebar, Not Wide) */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Widget 1: Mini Calendar (Standard Size Matching System Sidebars) */}
          {!isCalendarHidden ? (
            <div className="bg-card border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-foreground font-bold text-xs sm:text-[13px]">
                  <CalendarIcon className="size-3.5 text-[#0092c7]" />
                  <span>Calendar</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                    className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="tracking-tight text-xs">{monthName}</span>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                    className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Day headers: S M T W T F S */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground/70 select-none py-0.5">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Days cells */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
                {miniDays.map((d, i) => (
                  <div key={i} className="flex items-center justify-center h-6.5">
                    <span
                      className={cn(
                        "size-6 flex items-center justify-center rounded-full text-[11px] font-semibold select-none transition-colors",
                        d.isToday
                          ? "bg-[#0092c7] text-white font-bold shadow-xs"
                          : d.currentMonth
                          ? "text-foreground hover:bg-muted/60 cursor-pointer"
                          : "text-muted-foreground/25"
                      )}
                    >
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Links: 'full calendar' on left, 'hide' on right */}
              <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-[11px] font-semibold px-0.5">
                <Link
                  to="/student/calendar"
                  className="text-[#0092c7] hover:underline cursor-pointer"
                >
                  full calendar
                </Link>
                <button
                  type="button"
                  onClick={() => setIsCalendarHidden(true)}
                  className="text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors"
                >
                  hide
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-2xl p-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-xs">Calendar widget is hidden</span>
              <button
                type="button"
                onClick={() => setIsCalendarHidden(false)}
                className="text-[#0092c7] font-bold hover:underline cursor-pointer text-xs"
              >
                show
              </button>
            </div>
          )}

          {/* Widget 2: To-do (Matches Reference Image) */}
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold text-xs sm:text-[13px]">
                <CheckCircle2 className="size-3.5 text-[#0092c7]" />
                <span>To-do</span>
              </div>
              <button
                type="button"
                title="Add task"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Todo Items */}
            <div className="space-y-1.5 pt-0.5">
              {todos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleTodo(item.id)}
                  className={cn(
                    "flex items-start gap-2 p-2 px-2.5 rounded-xl border transition-all cursor-pointer group text-xs",
                    item.done
                      ? "bg-muted/20 border-border/40 opacity-60"
                      : "bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border"
                  )}
                >
                  <div
                    className={cn(
                      "size-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      item.done
                        ? "bg-[#0092c7] border-[#0092c7] text-white"
                        : "border-muted-foreground/50 group-hover:border-foreground"
                    )}
                  >
                    {item.done && <Check size={9} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "font-semibold text-xs leading-snug transition-colors",
                      item.done ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary"
                    )}>
                      {item.text}
                    </p>
                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] text-[#0092c7] font-bold hover:underline mt-0.5"
                      >
                        <span>Open requirement</span>
                        <ExternalLink size={9} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Announcements (Matches Reference Image) */}
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold text-xs sm:text-[13px]">
                <Megaphone className="size-3.5 text-[#0092c7]" />
                <span>Announcements</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-semibold">
                1 New
              </Badge>
            </div>

            {/* Announcements List */}
            <div className="space-y-2 pt-0.5">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Practicum Faculty Orientation</span>
                  <span className="text-[10px] text-muted-foreground font-medium">2h ago</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Midterm journal cutoff is scheduled for Friday at 5:00 PM. Attach supervisor signature.
                </p>
              </div>

              <div className="text-center py-0.5">
                <Link
                  to="/student/notifications"
                  className="text-[11px] font-semibold text-[#0092c7] hover:underline cursor-pointer"
                >
                  View all campus news →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Tasks Modal */}
      <Dialog open={isCompletedModalOpen} onOpenChange={setIsCompletedModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6 bg-card border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Completed Tasks & Requirements
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Requirements and practicum milestones you have successfully accomplished.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 py-2">
            {/* System verified requirements */}
            {COMPLETED_TASKS.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground truncate">{task.title}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold">
                        {task.tag}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{task.desc}</p>
                  </div>
                </div>
                {task.link && (
                  <Link
                    to={task.link}
                    onClick={() => setIsCompletedModalOpen(false)}
                    className="text-[#0092c7] hover:underline font-bold text-[11px] shrink-0 self-center"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}

            {/* Any to-do marked done */}
            {todos.filter((t) => t.done).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground truncate line-through opacity-80">{item.text}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] h-4 px-1.5 font-bold">
                        To-do
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Marked as finished from your daily checklist.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompletedModalOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
