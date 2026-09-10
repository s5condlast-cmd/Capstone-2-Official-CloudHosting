import React, { useState } from 'react';
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
  Sparkles,
  CheckCheck,
  Plus,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  GraduationCap,
  Briefcase,
  X,
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
  description: string;
}

const beforeOJTRequirements: RequirementItem[] = [
  {
    label: 'Student Application Letter',
    value: 'Approved',
    icon: UserIcon,
    status: 'done',
    link: '/student/application-letter',
    description: 'Placement clearance approved by practicum coordinator.',
  },
  {
    label: 'Consent Forms (Parent/Student)',
    value: 'Action Required',
    icon: UserCheckIcon,
    status: 'pending',
    link: '/student/consent',
    description: 'Requires signed legal waiver and guardian consent.',
  },
  {
    label: 'Memorandum of Agreement',
    value: 'Approved',
    icon: UsersIcon,
    status: 'done',
    link: '/student/moa',
    description: 'Verified partnership agreement with InnoTech Labs Inc.',
  },
  {
    label: 'Endorsement Letter',
    value: 'Pending Approval',
    icon: ClipboardCheckIcon,
    status: 'pending',
    link: '/student/endorsement',
    description: 'Awaiting faculty signature to finalize deployment.',
  },
];

const inOJTRequirements: RequirementItem[] = [
  {
    label: 'Weekly Journal Reflection',
    value: 'Prelim Phase',
    icon: BookOpenIcon,
    status: 'progress',
    link: '/student/journal',
    description: 'Log weekly learnings, task reflections, and mentor feedback.',
  },
  {
    label: 'Daily Time Record (DTR)',
    value: 'Active Logging',
    icon: CalendarIcon,
    status: 'progress',
    link: '/student/dtr',
    description: '122 of 460 total practicum hours submitted and tracked.',
  },
  {
    label: 'OJT Training Plan Form',
    value: 'In Progress',
    icon: ClipboardListIcon,
    status: 'pending',
    link: '/student/training-plan',
    description: 'Target learning objectives and corporate competencies.',
  },
];

const finalRequirements: RequirementItem[] = [
  {
    label: 'Performance Appraisal',
    value: 'Locked',
    icon: CheckCircleIcon,
    status: 'locked',
    link: '/student/evaluation',
    description: 'Formal intern evaluation by corporate supervisor.',
  },
  {
    label: 'Integration Paper',
    value: 'Locked',
    icon: AwardIcon,
    status: 'locked',
    link: '/student/completion',
    description: 'Comprehensive practicum synthesis and exit defense report.',
  },
  {
    label: 'Clearance Sign-off',
    value: 'Locked',
    icon: GraduationCap,
    status: 'locked',
    link: '/student/completion',
    description: 'Final academic and institutional clearance approval.',
  },
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

  // Requirements phase tab
  const [activePhaseTab, setActivePhaseTab] = useState<'before' | 'in' | 'final'>('before');

  // Right sidebar widget states
  const [isCalendarHidden, setIsCalendarHidden] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 8, 1)); // September 2026

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      done: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setNewTodoText('');
    setIsAddingTodo(false);
  };

  // Mini calendar calculation (Sep 2026: 30 days, starts Tue Sep 1)
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const monthName = calendarMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const miniDays: { day: number; currentMonth: boolean; isToday: boolean; hasEvent?: boolean }[] = [];
  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    miniDays.push({ day: prevMonthDays - i, currentMonth: false, isToday: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = calYear === 2026 && calMonth === 8 && d === 2;
    // Highlight days with submissions or DTR logs
    const hasEvent = [2, 5, 12, 19, 26].includes(d) && calMonth === 8;
    miniDays.push({ day: d, currentMonth: true, isToday, hasEvent });
  }
  // Remaining to fill 35 cells
  const remainingCells = 35 - miniDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    miniDays.push({ day: d, currentMonth: false, isToday: false });
  }

  // Active items based on selected tab
  const currentRequirementItems =
    activePhaseTab === 'before'
      ? beforeOJTRequirements
      : activePhaseTab === 'in'
      ? inOJTRequirements
      : finalRequirements;

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-300">
      {/* 1. Top Header: Simple, Clean & Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Practicum Overview
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Track your internship hours, requirements, and deployment status.
          </p>
        </div>

        {/* Compact Completed Tasks Trigger */}
        <button
          type="button"
          onClick={() => setIsCompletedModalOpen(true)}
          className="bg-card border border-border/80 hover:border-border rounded-xl px-3 py-1.5 shadow-2xs flex items-center gap-2 shrink-0 transition-all cursor-pointer group select-none self-start sm:self-auto hover:bg-muted/40"
        >
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground">Completed Tasks</span>
          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            {COMPLETED_TASKS.length + todos.filter((t) => t.done).length} Done
          </span>
          <ArrowRightIcon size={12} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 2. Top Pulse Metrics Strip: 4 Sleek Compact Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Hours Rendered */}
        <div className="bg-card border border-border/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Practicum Hours
            </span>
            <ClockIcon size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">122</h3>
              <span className="text-xs text-muted-foreground font-medium">/ 460 hrs</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                26.5%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '26.5%' }} />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              338 hrs remaining
            </p>
          </div>
        </div>

        {/* Metric 2: Requirements */}
        <div className="bg-card border border-border/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Requirements
            </span>
            <ClipboardCheckIcon size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">3 of 10</h3>
              <span className="text-xs text-muted-foreground font-medium">Verified</span>
              <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                1 Pending
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '30%' }} />
              <div className="bg-amber-500 h-full" style={{ width: '10%' }} />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              Endorsement upload pending
            </p>
          </div>
        </div>

        {/* Metric 3: Current Phase */}
        <div className="bg-card border border-border/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Current Stage
            </span>
            <Sparkles size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-foreground tracking-tight">Before OJT</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                Phase 1
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Company clearance & endorsement
            </p>
          </div>
        </div>

        {/* Metric 4: Placement */}
        <div className="bg-card border border-border/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Placement
            </span>
            <BuildingIcon size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                InnoTech Labs Inc.
              </h3>
              <CheckCheck size={13} className="text-emerald-500 shrink-0" />
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Pasig City · Frontend Intern
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Standard 9:3 Ratio (lg:col-span-9 and lg:col-span-3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Main Practicum Workflows (9 cols) */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* Active Deployment & Attendance Tracker Banner */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Briefcase size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Active Deployment
                    </span>
                    <span className="text-muted-foreground text-[10px]">·</span>
                    <span className="text-xs font-semibold text-foreground">InnoTech Labs Inc.</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Supervisor: <span className="font-semibold text-foreground">Engr. Paolo Reyes</span> · Frontend Intern
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Link to="/student/dtr">
                  <Button variant="primary" size="sm" className="font-bold text-xs h-8 px-3 rounded-lg cursor-pointer">
                    <ClockIcon size={13} className="mr-1" />
                    Log Today's DTR
                  </Button>
                </Link>
                <Link to="/student/journal">
                  <Button variant="outline" size="sm" className="font-bold text-xs h-8 px-2.5 rounded-lg cursor-pointer">
                    <BookOpenIcon size={13} className="mr-1" />
                    Journal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hours Progress and Milestones */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  Logged: <span className="text-foreground font-bold">122.0 / 460.0 Hours</span>
                </span>
                <span className="text-primary font-bold">26.5% Rendered</span>
              </div>

              <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: '26.5%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                <span>Phase: Prelim Logging</span>
                <span>Midterm Target: 230 hrs</span>
                <span>Final Target: 460 hrs</span>
              </div>
            </div>
          </div>

          {/* Practicum Requirements Checklist */}
          <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-4.5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <ClipboardListIcon size={16} className="text-primary" />
                  <span>Practicum Requirements</span>
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Institutional documents required across all 3 practicum phases.
                </p>
              </div>

              {/* Phase Segmented Buttons */}
              <div className="bg-muted/60 border border-border/80 rounded-lg p-0.5 flex items-center gap-0.5 text-xs self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePhaseTab('before')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                    activePhaseTab === 'before'
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Before OJT</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums",
                      activePhaseTab === 'before' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                    )}
                  >
                    4
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('in')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                    activePhaseTab === 'in'
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>In OJT</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums",
                      activePhaseTab === 'in' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                    )}
                  >
                    3
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('final')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                    activePhaseTab === 'final'
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Final Phase</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums",
                      activePhaseTab === 'final' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                    )}
                  >
                    3
                  </span>
                </button>
              </div>
            </div>

            {/* High-Level 3-Stage Progress Indicator */}
            <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    activePhaseTab === 'before'
                      ? "bg-card border-primary/40 shadow-2xs"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <span className="size-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black">
                      ✓
                    </span>
                    <span className="text-foreground">1. Before OJT</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">2 of 4 Done</span>
                </div>

                <div
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    activePhaseTab === 'in'
                      ? "bg-card border-primary/40 shadow-2xs"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <span className="size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-black">
                      2
                    </span>
                    <span className="text-foreground">2. In OJT</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">Active Logging</span>
                </div>

                <div
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    activePhaseTab === 'final'
                      ? "bg-card border-primary/40 shadow-2xs"
                      : "border-transparent text-muted-foreground opacity-60"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <span className="size-3.5 rounded-full bg-muted-foreground/30 text-muted-foreground flex items-center justify-center text-[8px] font-black">
                      <LockIcon size={7} />
                    </span>
                    <span>3. Final Phase</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">Post-Deployment</span>
                </div>
              </div>
            </div>

            {/* Stable Requirement Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentRequirementItems.map((req, idx) => {
                const isDone = req.status === 'done';
                const isPending = req.status === 'pending';
                const isProgress = req.status === 'progress';
                const isLocked = req.status === 'locked';
                const IconComponent = req.icon;

                return (
                  <div
                    key={req.label}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 bg-card hover:border-border",
                      isDone && "border-emerald-500/30 bg-emerald-500/[0.02]",
                      isPending && "border-amber-500/30 bg-amber-500/[0.02]",
                      isProgress && "border-primary/30 bg-primary/[0.02]",
                      isLocked && "opacity-60 border-border/60 bg-muted/20"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={cn(
                              "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                              isDone && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                              isPending && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                              isProgress && "bg-primary/10 border-primary/20 text-primary",
                              isLocked && "bg-muted border-border text-muted-foreground"
                            )}
                          >
                            <IconComponent size={14} />
                          </div>
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                            Item {idx + 1}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isDone && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Action Required
                          </span>
                        )}
                        {isProgress && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20">
                            In Progress
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground border border-border">
                            Locked
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-foreground tracking-tight line-clamp-1">
                          {req.label}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                          {req.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-1.5 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {req.value}
                      </span>
                      {isLocked ? (
                        <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 font-semibold">
                          <LockIcon size={10} />
                          <span>Locked</span>
                        </span>
                      ) : (
                        <Link
                          to={req.link}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline group cursor-pointer"
                        >
                          <span>{isDone ? 'View' : 'Open'}</span>
                          <ArrowRightIcon size={11} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Step Checklist Card */}
          <div className="bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex gap-3 items-start">
              <div className="size-9 shrink-0 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                <FileTextIcon size={16} />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-bold text-[9px] h-4 px-1.5">
                    Action Required
                  </Badge>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Before OJT Phase
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">
                  Upload Endorsement Letter
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ensure coordinator signature is secured to finalize your verified company endorsement.
                </p>
              </div>
            </div>

            {/* Sub-steps flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/60">
              {[
                { label: '1. Download Template', status: 'completed', desc: 'Template retrieved' },
                { label: '2. Faculty Signature', status: 'completed', desc: 'Signed by coordinator' },
                { label: '3. Upload Portal', status: 'active', desc: 'File upload pending' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2 rounded-lg border text-xs transition-colors",
                    step.status === 'completed' && "bg-muted/40 border-border/60 opacity-85",
                    step.status === 'active' && "bg-card border-primary/40 shadow-2xs"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <span
                      className={cn(
                        "size-3.5 rounded-full flex items-center justify-center text-[8px] font-extrabold",
                        step.status === 'completed' ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
                      )}
                    >
                      {step.status === 'completed' ? '✓' : '3'}
                    </span>
                    <span className="text-foreground text-[11px] font-bold">{step.label}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium pl-5">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Target: <span className="text-foreground font-semibold">Friday, 5:00 PM</span>
              </span>
              <Link to="/student/endorsement">
                <Button variant="primary" size="sm" icon={<ArrowRightIcon size={13} />} className="font-bold text-xs h-7.5 px-3 rounded-lg cursor-pointer">
                  Go to Submission
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Companion Sidebar Widgets (3 cols) */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Widget 1: Mini Calendar */}
          {!isCalendarHidden ? (
            <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                  <CalendarIcon className="size-3.5 text-primary" />
                  <span>Calendar</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                    className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                    title="Previous month"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="tracking-tight text-xs font-bold">{monthName}</span>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                    className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                    title="Next month"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Day headers: S M T W T F S */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground/75 select-none py-0.5 border-b border-border/50">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days cells */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
                {miniDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center justify-center h-6.5">
                    <span
                      className={cn(
                        "size-5.5 flex items-center justify-center rounded-full text-[11px] font-semibold select-none transition-colors",
                        d.isToday
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : d.currentMonth
                          ? "text-foreground hover:bg-muted/70 cursor-pointer"
                          : "text-muted-foreground/25"
                      )}
                    >
                      {d.day}
                    </span>
                    {d.hasEvent && !d.isToday && (
                      <span className="size-1 bg-primary rounded-full -mt-0.5" />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer Links: 'full calendar' on left, 'hide' on right */}
              <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-[11px] font-semibold px-0.5">
                <Link
                  to="/student/calendar"
                  className="text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Full calendar</span>
                  <ExternalLink size={9} />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsCalendarHidden(true)}
                  className="text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors text-[11px]"
                >
                  Hide
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-xs">Calendar hidden</span>
              <button
                type="button"
                onClick={() => setIsCalendarHidden(false)}
                className="text-primary font-bold hover:underline cursor-pointer text-xs"
              >
                Show
              </button>
            </div>
          )}

          {/* Widget 2: Interactive To-Do List */}
          <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>To-do Checklist</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                  {todos.filter((t) => !t.done).length} Pending
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsAddingTodo((prev) => !prev)}
                  title={isAddingTodo ? "Cancel" : "Add task"}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  {isAddingTodo ? <X size={12} /> : <Plus size={12} />}
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {isAddingTodo && (
              <form onSubmit={handleAddTodo} className="space-y-1.5 pt-0.5 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Type new task..."
                  autoFocus
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border focus:outline-none focus:border-primary text-foreground"
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingTodo(false);
                      setNewTodoText('');
                    }}
                    className="h-6 text-[10px] px-2 rounded-md"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newTodoText.trim()}
                    className="h-6 text-[10px] px-2 rounded-md font-bold"
                  >
                    Add Task
                  </Button>
                </div>
              </form>
            )}

            {/* Todo Items */}
            <div className="space-y-1.5 pt-0.5 max-h-[260px] overflow-y-auto pr-0.5">
              {todos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleTodo(item.id)}
                  className={cn(
                    "flex items-start gap-2 p-2 px-2.5 rounded-lg border transition-all cursor-pointer group text-xs",
                    item.done
                      ? "bg-muted/20 border-border/40 opacity-60"
                      : "bg-muted/30 border-border/70 hover:bg-muted/60 hover:border-border"
                  )}
                >
                  <div
                    className={cn(
                      "size-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      item.done
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/50 group-hover:border-foreground"
                    )}
                  >
                    {item.done && <Check size={9} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-medium text-xs leading-snug transition-colors",
                        item.done ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {item.text}
                    </p>
                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline mt-0.5"
                      >
                        <span>Open requirement</span>
                        <ExternalLink size={8} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Practicum Announcements */}
          <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                <Megaphone className="size-3.5 text-primary" />
                <span>Announcements</span>
              </div>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                1 New
              </Badge>
            </div>

            {/* Announcement Bulletin */}
            <div className="space-y-1.5 pt-0.5">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/70 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Practicum Midterm Cutoff</span>
                  <span className="text-[9px] text-muted-foreground font-medium">2h ago</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Midterm journal cutoff is scheduled for Friday at 5:00 PM. Please ensure your supervisor signs your DTR logs.
                </p>
              </div>

              <div className="text-center pt-0.5">
                <Link
                  to="/student/notifications"
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View all notifications</span>
                  <ArrowRightIcon size={10} />
                </Link>
              </div>
            </div>
          </div>

          {/* Widget 4: Practicum Support & Contacts Card */}
          <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-foreground font-bold text-xs px-0.5">
              <UsersIcon className="size-3.5 text-primary" />
              <span>Practicum Support</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/60">
                <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  SJ
                </div>
                <div className="min-w-0 flex-1 space-y-0.2">
                  <p className="font-bold text-foreground truncate text-xs">Dr. Sarah Johnson</p>
                  <p className="text-[10px] text-muted-foreground">Practicum Adviser · STI Marikina</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/60">
                <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  PR
                </div>
                <div className="min-w-0 flex-1 space-y-0.2">
                  <p className="font-bold text-foreground truncate text-xs">Engr. Paolo Reyes</p>
                  <p className="text-[10px] text-muted-foreground">Supervisor · InnoTech Labs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Tasks Modal */}
      <Dialog open={isCompletedModalOpen} onOpenChange={setIsCompletedModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6 bg-card border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Completed Tasks & Requirements
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  All practicum requirements and checklist milestones you have successfully accomplished.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 py-2">
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
                    className="text-primary hover:underline font-bold text-[11px] shrink-0 self-center"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}

            {/* Any to-do marked done */}
            {todos
              .filter((t) => t.done)
              .map((item) => (
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
                        <span className="font-bold text-foreground truncate line-through opacity-80">
                          {item.text}
                        </span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] h-4 px-1.5 font-bold">
                          To-do
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Marked as finished from your daily checklist.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
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
export default StudentDashboard;
