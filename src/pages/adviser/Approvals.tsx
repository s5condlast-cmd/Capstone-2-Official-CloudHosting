import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  CheckCircle2, 
  User, 
  Calendar, 
  Clock,
  ExternalLink,
  MessageSquare,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

type DateFilter = 'all' | 'week' | 'month' | 'semester';

const approvedDocs = [
  { id: '101', student: 'Alice Brown', type: 'MOA Document', time: '1 day ago', course: 'BSCS', approvedDate: 'May 3, 2026' },
  { id: '102', student: 'Charlie Davis', type: 'Resume', time: '3 days ago', course: 'BSIT', approvedDate: 'May 1, 2026' },
  { id: '103', student: 'Eva Green', type: 'Endorsement Letter', time: '1 week ago', course: 'BSCS', approvedDate: 'Apr 27, 2026' },
  { id: '104', student: 'John Smith', type: 'DTR Week 1-4', time: '2 weeks ago', course: 'BSIT', approvedDate: 'Apr 20, 2026' },
  { id: '105', student: 'Maria Santos', type: 'Journal #3', time: '3 weeks ago', course: 'BSCS', approvedDate: 'Apr 14, 2026' },
  { id: '106', student: 'Robert Cruz', type: 'Training Plan', time: '1 month ago', course: 'BSIT', approvedDate: 'Apr 4, 2026' },
];

export const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showExportToast, setShowExportToast] = useState(false);

  // Simple simulated filtering
  const filtered = approvedDocs.filter(doc => {
    if (dateFilter === 'all') return true;
    if (dateFilter === 'week') return doc.time.includes('day') || doc.time === '1 week ago';
    if (dateFilter === 'month') return !doc.time.includes('month');
    return true;
  });

  const handleExport = () => {
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Export Toast */}
      {showExportToast && (
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl shadow-2xl"
        >
          <Download size={16} />
          <span className="text-xs font-bold uppercase tracking-wide">Exporting approval records as CSV...</span>
        </motion.div>
      )}

      <Card 
        title="Approved Documents" 
        className="w-full"
        action={<div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mr-2">{filtered.length} Records</span>
           <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={handleExport}>Export CSV</Button>
        </div>}
      >
        {/* Date Range Filter */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit border border-zinc-200/80 dark:border-zinc-800/80">
          {([
            { key: 'all' as const, label: 'All Time' },
            { key: 'week' as const, label: 'This Week' },
            { key: 'month' as const, label: 'This Month' },
            { key: 'semester' as const, label: 'This Semester' },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                dateFilter === f.key
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Submission Details</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Approved Date</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Review Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filtered.map((doc, i) => (
                <motion.tr 
                  key={doc.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-950 transition-colors">
                        <User size={16} className="text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{doc.student}</span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{doc.course}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 mb-1">
                        <span className="text-sm font-semibold">{doc.type}</span>
                        <button className="text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                           <ExternalLink size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                         <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {doc.time}
                         </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      <Calendar size={12} className="text-zinc-400 dark:text-zinc-500" />
                      {doc.approvedDate}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800">
                       <CheckCircle2 size={12} className="mr-1" />
                       APPROVED
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/adviser/review/${doc.id}`)} className="border-black dark:border-white text-black dark:text-zinc-100 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 uppercase font-semibold text-[10px] tracking-wide">
                       View Review
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">No approved documents in this time range</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
