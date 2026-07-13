import React, { useState, useEffect } from 'react';
import { StatCard } from '@/src/components/ui/StatCard';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Search
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const AdviserDashboard: React.FC = () => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Students Assigned" value="15" icon={<GraduationCap size={18} />} />
        <StatCard label="Avg. Progress" value="68%" icon={<TrendingUp size={18} />} />
        <StatCard label="Pending Review" value="8" icon={<Clock size={18} />} trend="+3 today" />
        <StatCard label="Total Resolved" value="42" icon={<CheckCircle size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Queue */}
        <Card 
          title="Priority Queue" 
          className="lg:col-span-2"
          action={<Button variant="secondary" size="sm" icon={<Search size={14} />}>Review All</Button>}
        >
          <div className="space-y-2">
            {[
              { name: 'Alice Brown', type: 'MOA Submission', status: 'Urgent', time: '2h ago' },
              { name: 'Charlie Davis', type: 'DTR - Week 5', status: 'Pending', time: '5h ago' },
              { name: 'Eva Green', type: 'Journal #4', status: 'In Review', time: 'Yesterday' },
              { name: 'John Smith', type: 'Final Evaluation', status: 'Pending', time: '2 days ago' },
            ].map((item, i) => (
              <div 
                key={i}
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
                  <Badge variant={item.status === 'Urgent' ? 'error' : item.status === 'In Review' ? 'neutral' : 'warning'}>
                    {item.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase shrink-0">{item.time}</span>
                    <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-900 dark:text-zinc-100 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Adviser Insights */}
        <div className="space-y-8">
          <Card title="Adviser Insights">
            <div className="space-y-4">
              <div className="p-4 bg-zinc-100/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-zinc-200 rounded">
                    <AlertCircle size={14} className="text-zinc-800" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wide">Trend Alert</span>
                </div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">3 students have missed DTR deadlines for two consecutive weeks.</p>
              </div>
              <div className="p-4 bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 text-white dark:text-zinc-950 rounded-xl shadow-lg shadow-zinc-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-zinc-400 dark:text-zinc-500" />
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Performance</span>
                </div>
                <p className="text-xs font-medium leading-relaxed opacity-90">80% of your current cohort has submitted their industry documents. Excellent progress.</p>
              </div>
            </div>
          </Card>

          <Card title="Recent Notifications">
            <div className="space-y-1">
              {[
                { label: 'System update completed', time: '10m ago' },
                { label: 'Cohort data exported', time: '1h ago' },
                { label: 'New student assigned', time: '3h ago' },
              ].map((n, i) => (
                <div key={i} className="flex flex-col p-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 transition-colors cursor-pointer">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{n.label}</span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">{n.time}</span>
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
