import React from 'react';
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
  Settings
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

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

export const StudentDashboard: React.FC = () => {
  const [activeNotifTab, setActiveNotifTab] = React.useState<'all' | 'verified' | 'revisions'>('revisions');
  const [activePhaseTab, setActivePhaseTab] = React.useState<'before' | 'in' | 'final'>('before');

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
                  {/* Dotted Horizontal Connector Line (Behind step circles) */}
                  {idx < items.length - 1 && (
                    <div
                      className={cn(
                        "hidden sm:block absolute top-4 left-[50%] w-full h-[2px] border-t-2 border-dashed transition-colors z-0",
                        isDone ? "border-emerald-500/60 dark:border-emerald-500/40" : "border-zinc-200 dark:border-zinc-800"
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
                        isPending && "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 ring-4 ring-zinc-100 dark:ring-zinc-900",
                        !isDone && !isPending && !isLocked && "bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400",
                        isLocked && "bg-zinc-100/60 dark:bg-zinc-900/60 border-2 border-zinc-200/80 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 opacity-60"
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
                        isLocked ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100 group-hover:text-primary"
                      )}>
                        {req.label}
                      </h4>
                      <p className={cn(
                        "text-[11px] font-medium leading-normal truncate",
                        isDone && "text-emerald-600 dark:text-emerald-400 font-semibold",
                        isPending && "text-amber-600 dark:text-amber-400 font-semibold",
                        !isDone && !isPending && !isLocked && "text-zinc-400 dark:text-zinc-500",
                        isLocked && "text-zinc-300 dark:text-zinc-700"
                      )}>
                        {req.value}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Mobile vertical connector divider */}
                {idx < items.length - 1 && (
                  <div className="sm:hidden w-[2px] h-6 border-l-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-auto my-1" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Greeting & Company Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            Welcome back, John <Sparkles className="text-zinc-400 dark:text-zinc-650" size={18} />
          </h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            STI Marikina Practicum Portal — Keep track of your requirements and internship hours.
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/60 dark:to-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/80 flex items-center gap-3 rounded-2xl">
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shrink-0">
            <BuildingIcon size={20} />
          </div>
          <div className="space-y-1 text-xs overflow-hidden flex-1">
            <div className="flex justify-between items-center">
              <span className="font-black text-zinc-900 dark:text-zinc-100 truncate">InnoTech Labs</span>
              <Badge variant="secondary">Deployed</Badge>
            </div>
            <div className="flex items-center gap-1 text-zinc-500 font-medium">
              <MapPinIcon size={12} className="shrink-0" />
              <span className="truncate">Pasig City</span>
            </div>
            <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mt-1">Supervisor: Engr. Paolo Reyes</p>
          </div>
        </div>
      </div>

      {/* Tabbed Requirements Card Box */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Header & Phase Swap Tab Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Practicum Requirements Checklist
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Select a phase tab to view and manage required document submissions.
            </p>
          </div>

          {/* Phase Segmented Buttons */}
          <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActivePhaseTab('before')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs",
                activePhaseTab === 'before'
                  ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <span>Before OJT</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums",
                activePhaseTab === 'before' ? "bg-white/20 dark:bg-zinc-950/20 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}>
                4
              </span>
            </button>

            <button
              onClick={() => setActivePhaseTab('in')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs",
                activePhaseTab === 'in'
                  ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <span>In OJT</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums",
                activePhaseTab === 'in' ? "bg-white/20 dark:bg-zinc-950/20 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}>
                3
              </span>
            </button>

            <button
              onClick={() => setActivePhaseTab('final')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs",
                activePhaseTab === 'final'
                  ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <span>Final</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums",
                activePhaseTab === 'final' ? "bg-white/20 dark:bg-zinc-950/20 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}>
                3
              </span>
            </button>
          </div>
        </div>

        {/* Requirements Stepper Timeline matching active selected tab */}
        {activePhaseTab === 'before' && renderStepperSection(beforeOJTRequirements)}
        {activePhaseTab === 'in' && renderStepperSection(inOJTRequirements)}
        {activePhaseTab === 'final' && renderStepperSection(finalRequirements)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Next step Card */}
        <Card className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-md transition-shadow" title="Next Step Checklist">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <FileTextIcon size={22} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Action Required</Badge>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Before OJT Phase</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Upload Endorsement Letter</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                  Ensure you complete each phase of the endorsement process to officially begin logging your training hours.
                </p>
              </div>
            </div>

            {/* Sub-steps process flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              {[
                { label: '1. Download Template', status: 'completed', desc: 'Template retrieved' },
                { label: '2. Faculty Signature', status: 'completed', desc: 'Signed by coordinator' },
                { label: '3. Upload Portal', status: 'active', desc: 'File upload pending' }
              ].map((step, idx) => (
                <div key={idx} className={cn(
                  "p-3 rounded-xl border text-xs",
                  step.status === 'completed' && "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/50 opacity-80",
                  step.status === 'active' && "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                )}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold",
                      step.status === 'completed' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-500 text-white"
                    )}>
                      {step.status === 'completed' ? '✓' : '3'}
                    </span>
                    <span className={step.status === 'completed' ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-900 dark:text-zinc-100"}>
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium pl-6">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Link to="/student/endorsement">
                <Button variant="primary" size="sm" icon={<ArrowRightIcon size={14} />}>Go to Submission</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Right side progress stats & journey timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress / Hours card */}
          <Card className="bg-zinc-900 dark:bg-zinc-950 text-white border-zinc-800 shadow-xl shadow-zinc-950/20">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Practicum Attendance</span>
                  <h4 className="text-sm font-bold text-zinc-300">Rendered Progress</h4>
                </div>
                <Badge className="bg-zinc-800 border-zinc-700 text-zinc-300 text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5">Active Logs</Badge>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight text-white tabular-nums">122</span>
                <span className="text-xs font-bold text-zinc-400">/ 460 hrs completed</span>
              </div>

              <div className="space-y-2">
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full bg-zinc-100 dark:bg-zinc-100 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.round((122 / 460) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 px-0.5">
                  <span className="text-zinc-300">{Math.round((122 / 460) * 100)}% Progress</span>
                  <span>338 hrs remaining</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Internship Journey Timeline */}
          <Card title="Internship Journey Timeline">
            <div className="space-y-5 relative pl-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {[
                { title: 'Internship Deployed', desc: 'Started at InnoTech Labs as Frontend Dev.', date: 'Mar 1, 2026', done: true },
                { title: 'Resume & MOA Verified', desc: 'Approved by Dr. Sarah Johnson.', date: 'Mar 3, 2026', done: true },
                { title: 'DTR Weeks 1 - 5', desc: 'Rendered 200 hours verified by supervisor.', date: 'Apr 10, 2026', done: true },
                { title: 'Performance Appraisal', desc: 'Supervisor evaluation pending final week.', date: 'Pending', done: false, active: true },
                { title: 'OJT Completion Clearance', desc: 'Final academic and supervisor clearance.', date: 'Pending', done: false }
              ].map((item, i) => (
                <div key={i} className="relative flex gap-3 text-xs">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0 border z-10",
                    item.done ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-950" :
                      item.active ? "bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 animate-pulse" :
                        "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                  )}>
                    {item.done ? (
                      <CheckCircleIcon size={10} className="fill-current text-white dark:text-zinc-950" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-bold", item.done ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>{item.title}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold">{item.date}</span>
                    </div>
                    <p className="text-[11px] text-zinc-550 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notifications Card matching exact uploaded image design */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Your notifications
              </h3>
              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                <button title="Mark all as read" className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                  <CheckCheck size={16} />
                </button>
                <button title="Notification Settings" className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Filter Pills Bar */}
            <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveNotifTab('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  activeNotifTab === 'all'
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>View all</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  activeNotifTab === 'all' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  6
                </span>
              </button>

              <button
                onClick={() => setActiveNotifTab('verified')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  activeNotifTab === 'verified'
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>Verified</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  activeNotifTab === 'verified' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  2
                </span>
              </button>

              <button
                onClick={() => setActiveNotifTab('revisions')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeNotifTab === 'revisions'
                    ? "bg-zinc-950 dark:bg-zinc-900 text-white dark:text-white border border-zinc-800 dark:border-zinc-700 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>Revisions</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  activeNotifTab === 'revisions' ? "bg-zinc-800 dark:bg-zinc-800 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  1
                </span>
              </button>
            </div>

            {/* Notification items matching image */}
            <div className="space-y-4 pt-1">
              {(activeNotifTab === 'revisions' || activeNotifTab === 'all') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-xs">
                    {/* Avatar illustration */}
                    <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-2xs">
                      <UserIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        <strong className="text-zinc-900 dark:text-white font-bold">Dr. Sarah Johnson</strong> requested revisions on{' '}
                        <strong className="text-zinc-900 dark:text-white font-bold">Journal #4</strong>
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Thursday 11:30 AM</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5">1 day ago</span>
                  </div>

                  {/* Indented Message Bubble */}
                  <div className="ml-10 p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    Hey <span className="font-semibold text-zinc-950 dark:text-white">@you</span>, please expand section 2 with specific supervisor feedback and detailed daily tasks.
                  </div>
                </div>
              )}

              {(activeNotifTab === 'verified' || activeNotifTab === 'all') && (
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 shadow-2xs">
                      <CheckCircleIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        <strong className="text-zinc-900 dark:text-white font-bold">Dr. Sarah Johnson</strong> verified your{' '}
                        <strong className="text-zinc-900 dark:text-white font-bold">MOA Document</strong>
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Yesterday 3:45 PM</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5">2 days ago</span>
                  </div>

                  <div className="ml-10 p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    Your Memorandum of Agreement with InnoTech Labs has been officially approved. You may begin logging DTR hours.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
