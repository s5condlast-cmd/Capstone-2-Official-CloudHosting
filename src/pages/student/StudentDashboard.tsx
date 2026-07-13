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
  Sparkles
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
  const allReqs = [...beforeOJTRequirements, ...inOJTRequirements, ...finalRequirements];
  const completedCount = allReqs.filter(r => r.status === 'done').length;
  const progress = Math.round((completedCount / allReqs.length) * 100);

  const renderRequirementCard = (req: RequirementItem) => {
    const Icon = req.icon;
    return (
      <Link key={req.label} to={req.link} className="block">
        <div className={cn(
          "p-4 rounded-2xl border transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-sm",
          req.status === 'done' && "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-650",
          req.status === 'pending' && "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400",
          req.status === 'progress' && "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400",
          req.status === 'empty' && "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400",
          req.status === 'locked' && "bg-zinc-50/30 dark:bg-zinc-950/10 border-dashed border-zinc-200 dark:border-zinc-800/40 opacity-40 hover:opacity-80"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300",
              req.status === 'done' && "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 group-hover:bg-zinc-800 dark:group-hover:bg-zinc-200",
              req.status === 'pending' && "bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-450",
              req.status === 'progress' && "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950",
              req.status === 'empty' && "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500",
              req.status === 'locked' && "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600"
            )}>
              <Icon size={16} />
            </div>
            {req.status === 'done' && <CheckCircleIcon size={14} className="text-zinc-900 dark:text-zinc-100" />}
            {req.status === 'pending' && <ClockIcon size={14} className="text-zinc-400 dark:text-zinc-500 animate-pulse" />}
            {req.status === 'progress' && <ClockIcon size={14} className="text-zinc-900 dark:text-zinc-100" />}
            {req.status === 'locked' && <LockIcon size={14} className="text-zinc-300 dark:text-zinc-700" />}
          </div>
          <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">{req.label}</p>
          <p className={cn(
            "text-xs font-bold truncate",
            req.status === 'done' && "text-zinc-900 dark:text-zinc-100",
            req.status === 'pending' && "text-zinc-500 dark:text-zinc-400",
            req.status === 'progress' && "text-zinc-900 dark:text-zinc-100",
            req.status === 'locked' && "text-zinc-400 dark:text-zinc-700",
            req.status === 'empty' && "text-zinc-500 dark:text-zinc-400"
          )}>{req.value}</p>
        </div>
      </Link>
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

      {/* Progress banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-900 dark:bg-zinc-950 text-white rounded-xl border border-zinc-800/80 shadow-sm">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold tracking-tight">OJT Completion Blueprint</h3>
          <p className="text-[10px] text-zinc-400 font-medium">Verify requirements and log training hours.</p>
        </div>
        <div className="flex items-center gap-4 min-w-[240px] w-full sm:w-auto">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1">
              <span>Overall Progress</span>
              <span className="tabular-nums text-white">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-100 dark:bg-zinc-100 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="h-8 px-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center font-bold text-xs text-zinc-400">
            <span className="text-white font-extrabold">{completedCount}</span>
            <span className="text-[9px] text-zinc-550 ml-0.5">/ 10</span>
          </div>
        </div>
      </div>

      {/* Structured Requirements Shelves */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-650" /> Phase 1: Pre-Deployment Requirements
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {beforeOJTRequirements.map(renderRequirementCard)}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-655" /> Phase 2: Active Internship (In OJT)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {inOJTRequirements.map(renderRequirementCard)}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-650" /> Phase 3: Final Clearances
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {finalRequirements.map(renderRequirementCard)}
          </div>
        </div>
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
        </div>
      </div>
    </div>
  );
};
