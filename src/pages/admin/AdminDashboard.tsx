import React, { useState, useEffect } from 'react';
import { StatCard } from '@/src/components/ui/StatCard';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { motion, AnimatePresence } from 'motion/react';
import { submissionStorage, StudentDocument } from '@/src/lib/submissionStorage';
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
  Briefcase,
  Search,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pendingDocs, setPendingDocs] = useState<StudentDocument[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const docs = await submissionStorage.getPendingAdminDocuments();
        setPendingDocs(docs);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
        <StatCard label="Pending Legal Docs" value={pendingDocs.length.toString()} icon={<FileText size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deployment Funnel */}
        <Card 
          title="Pending Documents Queue" 
          className="lg:col-span-2"
          action={<Button variant="outline" size="sm" icon={<Search size={12} />}>View All</Button>}
        >
          <div className="space-y-2 mt-2">
            {pendingDocs.length === 0 ? (
              <EmptyState 
                title="No Pending Documents" 
                description="The admin review queue is clear." 
                className="min-h-[200px]"
              />
            ) : (
              pendingDocs.slice(0, 5).map((doc) => (
                <div 
                  key={doc.id}
                  className="flex flex-col xs:flex-row xs:items-center justify-between p-3 hover:bg-zinc-50 dark:bg-zinc-900 rounded-xl transition-all group cursor-pointer border border-transparent hover:border-zinc-100 dark:border-zinc-800/50 gap-3 xs:gap-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shrink-0">
                      {doc.student_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{doc.student_name}</span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{doc.doc_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between xs:justify-end gap-4 border-t border-zinc-50 pt-2 xs:border-0 xs:pt-0">
                    <Badge variant={doc.urgency === 'high' ? 'error' : doc.urgency === 'medium' ? 'warning' : 'neutral'}>
                      {doc.urgency.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase shrink-0">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-900 dark:text-zinc-100 transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Action Items */}
        <div className="space-y-8">
          <Card title="Critical Action Items">
            <div className="space-y-4">
              {pendingDocs.length > 0 ? (
                <div className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                  <div className="mt-0.5 p-1.5 rounded-lg border shrink-0 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100">
                    <FileText size={14} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pending Legal Reviews</span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5 mb-2">
                      {pendingDocs.length} document{pendingDocs.length > 1 ? 's are' : ' is'} awaiting Admin verification.
                    </p>
                    <button className="self-start text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1 group">
                      Review Now <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState 
                  title="No Critical Items" 
                  description="All clear for now." 
                  className="min-h-[100px] p-4"
                />
              )}
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
