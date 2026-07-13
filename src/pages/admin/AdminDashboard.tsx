import React, { useState, useEffect } from 'react';
import { StatCard } from '@/src/components/ui/StatCard';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  UserPlus, 
  ChevronRight, 
  ShieldCheck, 
  History,
  Building,
  Users,
  Clock,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200); // Simulate network latency
    return () => clearTimeout(timer);
  }, []);

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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
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
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
                <Skeleton className="h-16 w-full mt-8" />
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
          {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard label="Students Deployed" value="142" icon={<Briefcase size={18} />} trend="↑ 12%" />
        <StatCard label="Seeking Company" value="38" icon={<GraduationCap size={18} />} />
        <StatCard label="Active Advisers" value="8" icon={<Users size={18} />} />
        <StatCard label="Company Supervisors" value="12" icon={<Building size={18} />} />
        <StatCard label="Pending Legal Docs" value="14" icon={<FileText size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deployment Funnel */}
        <Card 
          title="Batch 2025 Deployment Funnel" 
          className="lg:col-span-2"
          action={<Button variant="outline" size="sm" icon={<Users size={12} />}>View Roster</Button>}
        >
          <div className="space-y-8 mt-2">
            {[
              { 
                stage: '1. Pre-OJT (Processing Documents)', 
                desc: 'Students preparing Resume, Consent, MOA, and Endorsement.',
                count: 38, 
                total: 180, 
                color: 'bg-zinc-300 dark:bg-zinc-600' 
              },
              { 
                stage: '2. Deployed (Logging Hours)', 
                desc: 'Students actively working and submitting DTRs / Journals.',
                count: 115, 
                total: 180, 
                color: 'bg-zinc-600 dark:bg-zinc-400' 
              },
              { 
                stage: '3. Completed (Pending Final Evaluation)', 
                desc: 'Students who reached 460 hours and submitted final docs.',
                count: 27, 
                total: 180, 
                color: 'bg-zinc-900 dark:bg-zinc-100' 
              },
            ].map((step, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{step.stage}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{step.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{step.count}</span>
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 ml-1">/ {step.total}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step.count / step.total) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.2 }}
                    className={cn("h-full rounded-full", step.color)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-3 mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm">
            <TrendingUp size={16} className="text-zinc-900 dark:text-zinc-100 shrink-0" />
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Deployment rate is <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">15% ahead</strong> compared to last semester. Most delays are concentrated in MOA processing.
            </p>
          </div>
        </Card>

        {/* Action Items */}
        <div className="space-y-8">
          <Card title="Critical Action Items">
            <div className="space-y-4">
              {[
                { 
                  title: 'Adviser Overload', 
                  desc: 'Dr. Sarah Johnson has 45 assigned students (Limit is 30).',
                  type: 'warning',
                  icon: Users,
                  action: 'Rebalance'
                },
                { 
                  title: 'Pending Legal Reviews', 
                  desc: '14 MOAs are awaiting Admin verification.',
                  type: 'urgent',
                  icon: FileText,
                  action: 'Review Now'
                },
                { 
                  title: 'Missing Evaluations', 
                  desc: '5 deployed students have passed 460 hours without final evaluation.',
                  type: 'alert',
                  icon: Clock,
                  action: 'Send Reminder'
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                  <div className={cn(
                    "mt-0.5 p-1.5 rounded-lg border shrink-0",
                    item.type === 'urgent' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100" :
                    item.type === 'warning' ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600" :
                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  )}>
                    <item.icon size={14} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.title}</span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5 mb-2">{item.desc}</p>
                    <button className="self-start text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1 group">
                      {item.action} <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Quick Management">
            <div className="flex flex-col gap-2">
              {[
                { label: 'Register New Student', icon: UserPlus },
                { label: 'Upload New Template', icon: FileText },
                { label: 'Audit System Logs', icon: ShieldCheck },
              ].map((action, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                      <action.icon size={16} className="text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{action.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                </button>
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
