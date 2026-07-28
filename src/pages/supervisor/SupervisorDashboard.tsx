import React, { useState } from 'react';
import { StatCard } from '@/src/components/ui/StatCard';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  ArrowRight,
  Building2,
  Play,
  Calendar,
  BookOpen,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export const SupervisorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const pendingActions = [
    { name: 'Maria Santos', type: 'DTR - Week 8 (Pending Approval)', priority: 'High', action: 'Approve DTR', path: '/supervisor/dtr' },
    { name: 'Alice Brown', type: 'DTR - Week 7 (Pending Approval)', priority: 'Medium', action: 'Approve DTR', path: '/supervisor/dtr' },
    { name: 'Alice Brown', type: 'Weekly Journal - Midterm (Pending)', priority: 'High', action: 'Review Journal', path: '/supervisor/journal' },
  ];

  const totalInterns = 3;
  const pendingDtrsCount = pendingActions.filter(a => a.type.includes('DTR')).length;
  const pendingJournalsCount = pendingActions.filter(a => a.type.includes('Journal')).length;
  const completedInternshipsCount = 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl shadow-md border border-zinc-800/80 dark:border-zinc-200/80">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 opacity-80" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Host Company Portal</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">InnoTech Labs Portal</h1>
          <p className="text-xs opacity-80 max-w-xl leading-relaxed">
            Manage your assigned STI Marikina intern records, verify Daily Time Records (DTR), and review weekly journals online.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white dark:bg-zinc-950/10 dark:hover:bg-zinc-950/20 dark:text-zinc-950 border-none text-xs h-8 font-bold px-3.5"
            onClick={() => navigate('/supervisor/interns')}
          >
            View My Interns
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Interns" value={totalInterns.toString()} icon={<Users size={18} />} />
        <StatCard label="Pending DTRs" value={pendingDtrsCount.toString()} icon={<Clock size={18} />} trend={pendingDtrsCount > 0 ? "Action required" : undefined} />
        <StatCard label="Pending Journals" value={pendingJournalsCount.toString()} icon={<BookOpen size={18} />} />
        <StatCard label="Completed Internships" value={completedInternshipsCount.toString()} icon={<CheckSquare size={18} />} />
      </div>

      {/* Main Grid: Pending Actions + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Priority Actions */}
        <Card 
          title="Pending Supervisor Actions" 
          subtitle="Items requiring your review & sign-off"
          className="lg:col-span-2"
          action={
            <Button 
              variant="secondary" 
              size="sm" 
              icon={<Play size={12} />}
              className="text-xs h-8 px-3 font-bold"
              onClick={() => navigate('/supervisor/journal')}
            >
              Review Journals
            </Button>
          }
        >
          <div className="space-y-2">
            {pendingActions.map((item, i) => (
              <div 
                key={i}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl transition-all group cursor-pointer gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                      {item.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'neutral'}>
                    {item.priority}
                  </Badge>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                    <span>{item.action}</span>
                    <ArrowRight size={13} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Sidebar: Today's Summary & Deadlines */}
        <div className="space-y-6">
          <Card title="Today's Action Summary">
            <div className="space-y-2.5">
              {[
                { count: '3 DTR logs', label: 'waiting verification' },
                { count: '2 weekly journals', label: 'journals due for review' },
              ].map((pending, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl">
                  <div className="px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    {pending.count.split(' ')[0]}
                  </div>
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
                    <strong className="font-bold text-zinc-900 dark:text-zinc-100">{pending.count.split(' ').slice(1).join(' ')}</strong> {pending.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Upcoming Deadlines">
            <div className="space-y-2.5">
              {[
                { day: 'Friday', title: 'Verify Weekly Journals', desc: 'Alice Brown midterm journal verification deadline', type: 'urgent' },
                { day: 'Monday', title: 'Weekly Performance Review', desc: 'Review weekly progress log for current cohort', type: 'info' }
              ].map((deadline, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-zinc-950 dark:bg-white" />
                  <div className="p-1.5 bg-white dark:bg-zinc-950 rounded-lg text-center min-w-[50px] shrink-0 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
                    <Calendar size={13} className="text-zinc-400 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase text-zinc-900 dark:text-zinc-100">{deadline.day}</span>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{deadline.title}</h4>
                    <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight">{deadline.desc}</p>
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
