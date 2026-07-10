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
  Award as AwardIcon
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

const requirements = [
  // Before OJT
  { label: 'Resume', value: 'Approved', icon: UserIcon, status: 'done', link: '/student/resume', phase: 'Before OJT' },
  { label: 'Consent', value: 'Not Started', icon: UserCheckIcon, status: 'empty', link: '/student/consent', phase: 'Before OJT' },
  { label: 'MOA', value: 'Approved', icon: UsersIcon, status: 'done', link: '/student/moa', phase: 'Before OJT' },
  { label: 'Endorsement', value: 'Pending', icon: ClipboardCheckIcon, status: 'pending', link: '/student/endorsement', phase: 'Before OJT' },
  // In OJT
  { label: 'Journal', value: 'Prelim', icon: BookOpenIcon, status: 'progress', link: '/student/journal', phase: 'In OJT' },
  { label: 'DTR', value: 'Not Started', icon: CalendarIcon, status: 'empty', link: '/student/dtr', phase: 'In OJT' },
  { label: 'Training Plan', value: 'Not Started', icon: ClipboardListIcon, status: 'empty', link: '/student/training-plan', phase: 'In OJT' },
  // Final
  { label: 'Evaluation', value: 'Locked', icon: CheckCircleIcon, status: 'locked', link: '/student/evaluation', phase: 'Final' },
  { label: 'Recognition', value: 'Locked', icon: AwardIcon, status: 'locked', link: '/student/completion', phase: 'Final' },
  { label: 'Certification', value: 'Locked', icon: AwardIcon, status: 'locked', link: '/student/completion', phase: 'Final' },
];

const timeline = [
  { action: 'Resume approved by Dr. Smith', time: '2 days ago', done: true },
  { action: 'MOA document verified', time: '3 days ago', done: true },
  { action: 'Endorsement letter submitted', time: '5 days ago', done: false },
  { action: 'Account created', time: '2 weeks ago', done: true },
];

export const StudentDashboard: React.FC = () => {
  const completedCount = requirements.filter(r => r.status === 'done').length;
  const progress = Math.round((completedCount / requirements.length) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Welcome back, John Dwayne</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here's where you left off on your practicum requirements.</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Overall completion</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Requirements grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {requirements.map((req) => {
          const Icon = req.icon;
          return (
            <Link key={req.label} to={req.link}>
              <div className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-sm",
                "bg-white dark:bg-zinc-900",
                req.status === 'locked' && "border-dashed border-zinc-200 dark:border-zinc-800 opacity-50",
                req.status !== 'locked' && "border-zinc-200/80 dark:border-zinc-800",
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    req.status === 'done' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" :
                      "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  )}>
                    <Icon size={16} />
                  </div>
                  {req.status === 'done' && <CheckCircleIcon size={14} className="text-zinc-900 dark:text-zinc-100" />}
                  {req.status === 'pending' && <ClockIcon size={14} className="text-zinc-400" />}
                  {req.status === 'locked' && <LockIcon size={14} className="text-zinc-300 dark:text-zinc-600" />}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{req.label}</p>
                <p className={cn(
                  "text-sm font-semibold",
                  req.status === 'done' ? "text-zinc-900 dark:text-zinc-100" :
                    req.status === 'locked' ? "text-zinc-400 dark:text-zinc-600" :
                      "text-zinc-700 dark:text-zinc-300"
                )}>{req.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Next step */}
        <Card className="lg:col-span-3" title="Next Step">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <FileTextIcon size={22} />
            </div>
            <div className="flex-1 space-y-2">
              <Badge variant="warning">Action Required</Badge>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Upload Endorsement Letter</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Download the template, fill out your company details, have it signed by the practicum coordinator, and upload it back.
              </p>
              <div className="pt-1">
                <Link to="/student/endorsement">
                  <Button variant="primary" size="sm" icon={<ArrowRightIcon size={14} />}>Go to Submission</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Activity + Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress card */}
          <Card className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-800 dark:border-zinc-200">
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Progress</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 dark:bg-zinc-950/10 rounded-full overflow-hidden">
                <div className="h-full bg-white dark:bg-zinc-950 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{completedCount} of {requirements.length} verified</p>
            </div>
          </Card>

          {/* Recent activity */}
          <Card title="Recent Activity">
            <div className="space-y-0.5">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    item.done ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{item.action}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{item.time}</p>
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
