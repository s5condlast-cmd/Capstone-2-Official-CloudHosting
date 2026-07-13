import React, { useState, useEffect } from 'react';
import { StatCard } from '@/src/components/ui/StatCard';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileSignature,
  Building2,
  Play,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export const SupervisorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200); // Simulate network latency
    return () => clearTimeout(timer);
  }, []);

  const pendingActions = [
    { name: 'Maria Santos', type: 'DTR - Week 8 (Pending Approval)', priority: 'High', action: 'Approve DTR', path: '/supervisor/dtr' },
    { name: 'Alice Brown', type: 'DTR - Week 7 (Pending Approval)', priority: 'Medium', action: 'Approve DTR', path: '/supervisor/dtr' },
    { name: 'Alice Brown', type: 'Performance Appraisal (Pending)', priority: 'High', action: 'Evaluate Now', path: '/supervisor/evaluate' },
    { name: 'John Smith', type: 'OJT Completion Clearance', priority: 'Low', action: 'Confirm Hours', path: '/supervisor/completion' },
  ];

  const totalInterns = 3;
  const pendingDtrsCount = pendingActions.filter(a => a.type.includes('DTR')).length;
  const pendingAppraisalsCount = pendingActions.filter(a => a.type.includes('Appraisal')).length;
  const completedInternshipsCount = 1;

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-8 pb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900 rounded-2xl">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mb-2 bg-zinc-700" />
              <Skeleton className="h-8 w-48 bg-zinc-700" />
              <Skeleton className="h-3 w-64 bg-zinc-700" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-8">
                <Skeleton className="h-6 w-48 mb-8" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-8">
              <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-4">
                <Skeleton className="h-6 w-40 mb-6" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8 pb-12"
        >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl shadow-xl shadow-zinc-950/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 opacity-80" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Host Company Panel</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">InnoTech Labs Portal</h1>
          <p className="text-xs opacity-80 max-w-md">Manage your assigned STI Marikina intern records, verify Daily Time Records (DTR), and submit performance appraisals online.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white dark:bg-zinc-950/10 dark:hover:bg-zinc-950/20 dark:text-zinc-950 border-none"
            onClick={() => navigate('/supervisor/interns')}
          >
            View My Interns
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Assigned Interns" value={totalInterns.toString()} icon={<Users size={18} />} />
        <StatCard label="Pending DTRs" value={pendingDtrsCount.toString()} icon={<Clock size={18} />} trend={pendingDtrsCount > 0 ? "Action required" : undefined} />
        <StatCard label="Pending Appraisals" value={pendingAppraisalsCount.toString()} icon={<FileSignature size={18} />} />
        <StatCard label="Completed Internships" value={completedInternshipsCount.toString()} icon={<CheckSquare size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Actions */}
        <Card 
          title="Pending Supervisor Actions" 
          className="lg:col-span-2"
          action={
            <Button 
              variant="secondary" 
              size="sm" 
              icon={<Play size={12} />}
              onClick={() => navigate('/supervisor/dtr')}
            >
              Start Approvals
            </Button>
          }
        >
          <div className="space-y-2">
            {pendingActions.map((item, i) => (
              <div 
                key={i}
                onClick={() => navigate(item.path)}
                className="flex flex-col xs:flex-row xs:items-center justify-between p-3 hover:bg-zinc-50 dark:bg-zinc-900 rounded-xl transition-all group cursor-pointer border border-transparent hover:border-zinc-100 dark:border-zinc-800/50 gap-3 xs:gap-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shrink-0">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{item.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{item.type}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between xs:justify-end gap-4 border-t border-zinc-50 pt-2 xs:border-0 xs:pt-0">
                  <Badge variant={item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'neutral'}>
                    {item.priority}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase shrink-0 hover:underline">{item.action}</span>
                    <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-900 dark:text-zinc-100 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Sidebar: Today's Pending Actions & Upcoming Deadlines */}
        <div className="space-y-8">
          <Card title="Today's Pending Actions">
            <div className="space-y-3">
              {[
                { count: '3 DTR logs', label: 'waiting verification', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' },
                { count: '2 evaluations', label: 'appraisals due soon', color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
                { count: '1 clearance', label: 'waiting digital signature', color: 'text-zinc-900 bg-zinc-100 dark:bg-zinc-800' }
              ].map((pending, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl">
                  <div className={cn("px-2 py-1 rounded text-xs font-black", pending.color)}>
                    {pending.count.split(' ')[0]}
                  </div>
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <strong className="text-zinc-900 dark:text-zinc-100">{pending.count.split(' ').slice(1).join(' ')}</strong> {pending.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Upcoming Deadlines">
            <div className="space-y-3">
              {[
                { day: 'Friday', title: 'Submit Appraisals', desc: 'Maria Santos performance review deadline', type: 'urgent' },
                { day: 'Monday', title: 'Intern Clearances', desc: 'Final sign-off for graduating cohort', type: 'info' }
              ].map((deadline, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl relative overflow-hidden">
                  {deadline.type === 'urgent' && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500" />
                  )}
                  <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg text-center min-w-[56px] shrink-0 border border-zinc-200/60 dark:border-zinc-800">
                    <Calendar size={14} className="mx-auto mb-1 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase text-zinc-900 dark:text-zinc-100">{deadline.day}</span>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{deadline.title}</h4>
                    <p className="text-[10px] font-semibold text-zinc-500 leading-relaxed">{deadline.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
