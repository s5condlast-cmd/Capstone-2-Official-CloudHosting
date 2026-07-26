import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Calendar,
  User,
  FileSignature,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePhaseLock } from '@/src/hooks/usePhaseLock';

const students = [
  { 
    id: '1', name: 'Alice Brown', program: 'BSIT401', section: 'A',
    hoursCompleted: 280, hoursRequired: 460, 
    docsPending: 1, docsApproved: 6, docsTotal: 7,
    lastSubmission: '2 hours ago', status: 'on-track', 
    company: 'Tech Solutions Inc.',
    atRisk: false
  },
  { 
    id: '2', name: 'Charlie Davis', program: 'BSIT402', section: 'B',
    hoursCompleted: 120, hoursRequired: 460, 
    docsPending: 3, docsApproved: 4, docsTotal: 7,
    lastSubmission: '5 hours ago', status: 'behind', 
    company: 'DataCorp PH',
    atRisk: false
  },
  { 
    id: '3', name: 'Eva Green', program: 'BSIT401', section: 'A',
    hoursCompleted: 85, hoursRequired: 460, 
    docsPending: 0, docsApproved: 7, docsTotal: 7,
    lastSubmission: '1 day ago', status: 'on-track', 
    company: 'WebWorks Studio',
    atRisk: false
  },
  { 
    id: '4', name: 'John Smith', program: 'BSIT402', section: 'B',
    hoursCompleted: 50, hoursRequired: 460, 
    docsPending: 4, docsApproved: 2, docsTotal: 7,
    lastSubmission: '5 days ago', status: 'at-risk', 
    company: 'CloudNet Systems',
    atRisk: true
  },
  { 
    id: '5', name: 'Maria Santos', program: 'BSIT401', section: 'A',
    hoursCompleted: 310, hoursRequired: 460, 
    docsPending: 0, docsApproved: 7, docsTotal: 7,
    lastSubmission: '3 hours ago', status: 'on-track', 
    company: 'InnoTech Labs',
    atRisk: false
  },
  { 
    id: '6', name: 'Robert Cruz', program: 'BSIT402', section: 'A',
    hoursCompleted: 60, hoursRequired: 460, 
    docsPending: 5, docsApproved: 1, docsTotal: 7,
    lastSubmission: '1 week ago', status: 'at-risk', 
    company: 'DevHouse PH',
    atRisk: true
  },
  { 
    id: '7', name: 'Sarah Lee', program: 'BSIT401', section: 'B',
    hoursCompleted: 200, hoursRequired: 460, 
    docsPending: 2, docsApproved: 5, docsTotal: 7,
    lastSubmission: '1 day ago', status: 'on-track', 
    company: 'Pixel Perfect Co.',
    atRisk: false
  },
  { 
    id: '8', name: 'James Reyes', program: 'BSIT402', section: 'A',
    hoursCompleted: 150, hoursRequired: 460, 
    docsPending: 2, docsApproved: 4, docsTotal: 7,
    lastSubmission: '2 days ago', status: 'behind', 
    company: 'NetSolve Inc.',
    atRisk: false
  },
];

export const MyStudents: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'on-track' | 'behind' | 'at-risk'>('all');
  const [activeProgram, setActiveProgram] = useState<'all' | 'BSIT401' | 'BSIT402'>('all');
  const [issueDocumentModal, setIssueDocumentModal] = useState<typeof students[0] | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const { locks, toggleLock } = usePhaseLock();

  const handleIssueDocument = () => {
    setIsIssuing(true);
    setTimeout(() => {
      setIsIssuing(false);
      setIssueDocumentModal(null);
    }, 1500);
  };

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || s.status === activeFilter;
    const matchProgram = activeProgram === 'all' || s.program === activeProgram;
    return matchSearch && matchFilter && matchProgram;
  });

  const atRiskCount = students.filter(s => s.status === 'at-risk').length;
  const behindCount = students.filter(s => s.status === 'behind').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Total Students</span>
            <GraduationCap size={14} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tighter">{students.length}</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Avg. Hours</span>
            <Clock size={14} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tighter">
            {Math.round(students.reduce((sum, s) => sum + s.hoursCompleted, 0) / students.length)}
            <span className="text-lg text-zinc-400 dark:text-zinc-500">/460</span>
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Pending Docs</span>
            <FileText size={14} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tighter">
            {students.reduce((sum, s) => sum + s.docsPending, 0)}
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={cn(
            "p-5 rounded-xl border",
            atRiskCount > 0 
              ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100" 
              : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={cn("text-[10px] font-bold uppercase tracking-wide", atRiskCount > 0 ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500")}>At Risk</span>
            <AlertTriangle size={14} className={cn(atRiskCount > 0 ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500")} />
          </div>
          <span className={cn("text-3xl font-semibold tracking-tighter", atRiskCount > 0 ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-zinc-100")}>
            {atRiskCount}
            <span className={cn("text-lg ml-1", atRiskCount > 0 ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500")}>students</span>
          </span>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          
          {/* Left Side: Filter Groups */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            
            {/* Status Group */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</span>
              <div className="flex flex-wrap items-center gap-1">
                {(['all', 'on-track', 'behind', 'at-risk'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                      activeFilter === f
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{f === 'all' ? 'All' : f.replace('-', ' ')}</span>
                      {f === 'at-risk' && atRiskCount > 0 && (
                        <span className={cn("px-1.5 py-0.5 rounded-full text-[9px]", activeFilter === f ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}>{atRiskCount}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Program Group */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Program</span>
              <div className="flex flex-wrap items-center gap-1">
                {(['all', 'BSIT401', 'BSIT402'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setActiveProgram(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                      activeProgram === p
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    {p === 'all' ? 'All' : p}
                  </button>
                ))}
              </div>
            </div>
            
          </div>

          {/* Right Side: Search */}
          <div className="relative w-full xl:w-56 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 pl-9 text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" 
              placeholder="Search students..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Student List */}
      <Card 
        title={`Student Progress (${filtered.length})`}
        className="overflow-hidden"
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Hours Progress</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Documents</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Last Submission</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filtered.map((s, i) => {
                const progressPct = Math.round((s.hoursCompleted / s.hoursRequired) * 100);
                return (
                  <motion.tr 
                    key={s.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/adviser/review/${s.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-all",
                          s.atRisk 
                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100" 
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 group-hover:border-zinc-900 dark:group-hover:border-zinc-100"
                        )}>
                          {s.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{s.name}</span>
                            {s.atRisk && <AlertTriangle size={12} className="text-zinc-500 dark:text-zinc-400" />}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{s.program} · {s.company}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-zinc-500 dark:text-zinc-400">{s.hoursCompleted}h / {s.hoursRequired}h</span>
                          <span className="text-zinc-900 dark:text-zinc-100">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className={cn(
                              "h-full rounded-full",
                              progressPct >= 70 ? "bg-zinc-900 dark:bg-zinc-100" : progressPct >= 40 ? "bg-zinc-500" : "bg-zinc-400 dark:bg-zinc-500"
                            )} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.docsApproved}<span className="text-zinc-400 dark:text-zinc-500">/{s.docsTotal}</span></span>
                        {s.docsPending > 0 && (
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                            {s.docsPending} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        <Clock size={11} />
                        {s.lastSubmission}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        s.status === 'on-track' ? 'success' : s.status === 'behind' ? 'warning' : 'error'
                      }>
                        {s.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIssueDocumentModal(s);
                          }}
                          icon={<FileSignature size={14} />}
                        >
                          Issue Document
                        </Button>
                        <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all group-hover:translate-x-1 hidden sm:block" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <User size={32} className="text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">No students match your filters</p>
          </div>
        )}
      </Card>

      {/* Issue Document Modal */}
      <AnimatePresence>
        {issueDocumentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <FileSignature size={18} className="text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Student Actions</h3>
                    <p className="text-xs font-medium text-zinc-500">Manage documents and phase access</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIssueDocumentModal(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Student</label>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{issueDocumentModal.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Program</label>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{issueDocumentModal.program}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Assigned Company</label>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{issueDocumentModal.company}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Issue Template</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow text-zinc-900 dark:text-zinc-100">
                    <option>Standard Endorsement - IT</option>
                    <option>Standard Endorsement - CS</option>
                    <option>Accelerated Track Endorsement</option>
                  </select>
                </div>

                {/* Phase Access Controls */}
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">Phase Access Controls</label>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", locks.inOjt ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400")}>
                        {locks.inOjt ? <Lock size={16} /> : <Unlock size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">In OJT Phase</p>
                        <p className="text-[10px] text-zinc-500">Journal, DTR, Training Plan</p>
                      </div>
                    </div>
                    <Button size="sm" variant={locks.inOjt ? "primary" : "outline"} onClick={() => toggleLock('inOjt')}>
                      {locks.inOjt ? 'Unlock Phase' : 'Lock Phase'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", locks.finals ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400")}>
                        {locks.finals ? <Lock size={16} /> : <Unlock size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Finals Phase</p>
                        <p className="text-[10px] text-zinc-500">Evaluation, Completion Form</p>
                      </div>
                    </div>
                    <Button size="sm" variant={locks.finals ? "primary" : "outline"} onClick={() => toggleLock('finals')}>
                      {locks.finals ? 'Unlock Phase' : 'Lock Phase'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIssueDocumentModal(null)} disabled={isIssuing}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={handleIssueDocument} 
                  disabled={isIssuing}
                  className="bg-black dark:bg-white text-white dark:text-black font-semibold"
                >
                  {isIssuing ? 'Issuing...' : 'Generate & Issue to Student'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
