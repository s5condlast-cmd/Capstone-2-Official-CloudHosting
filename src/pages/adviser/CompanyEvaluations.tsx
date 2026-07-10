import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { StatCard } from '@/src/components/ui/StatCard';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Star,
  Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const evaluations = [
  {
    id: '1', student: 'Maria Santos', program: 'BSIT 402-401',
    company: 'InnoTech Labs', supervisor: 'Engr. Paolo Reyes',
    hoursCompleted: 310, hoursRequired: 460,
    status: 'reviewed',
    scores: {
      technicalSkills: 4.5, communication: 4.0,
      punctuality: 5.0, initiative: 4.5, teamwork: 4.0
    },
    overallScore: 4.4,
    remarks: 'Excellent initiative. Contributed to 3 major sprint deliverables.',
    submittedDate: 'May 5, 2026'
  },
  {
    id: '2', student: 'Alice Brown', program: 'BSIT 402-401',
    company: 'TechCorp Solutions Inc.', supervisor: 'Mr. James Tan',
    hoursCompleted: 280, hoursRequired: 460,
    status: 'pending',
    scores: {
      technicalSkills: 4.2, communication: 3.8,
      punctuality: 4.5, initiative: 4.0, teamwork: 4.5
    },
    overallScore: 4.2,
    remarks: 'Demonstrates strong problem-solving ability. Needs improvement in documentation.',
    submittedDate: 'May 3, 2026'
  },
  {
    id: '3', student: 'Sarah Lee', program: 'BSIT 402',
    company: 'Pixel Perfect Co.', supervisor: 'Ms. Clara Gomez',
    hoursCompleted: 200, hoursRequired: 460,
    status: 'missing',
    scores: null,
    overallScore: null,
    remarks: null,
    submittedDate: null
  },
  {
    id: '4', student: 'John Smith', program: 'BSIT 402',
    company: 'CloudNet Systems', supervisor: 'Mr. Robert Chang',
    hoursCompleted: 50, hoursRequired: 460,
    status: 'flagged',
    scores: {
      technicalSkills: 3.0, communication: 2.5,
      punctuality: 2.0, initiative: 3.0, teamwork: 3.5
    },
    overallScore: 2.8,
    remarks: 'Struggles with attendance and communication. Needs intervention.',
    submittedDate: 'Apr 28, 2026'
  },
];

export const CompanyEvaluations: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'reviewed' | 'flagged'>('all');
  const [expandedEval, setExpandedEval] = useState<string | null>(null);

  const filtered = evaluations.filter(e => {
    const matchSearch = e.student.toLowerCase().includes(search.toLowerCase()) || e.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || e.status === activeFilter || (activeFilter === 'pending' && e.status === 'missing');
    return matchSearch && matchFilter;
  });

  const renderScoreBar = (score: number) => (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full",
            score >= 4.0 ? "bg-zinc-900 dark:bg-zinc-100" : score >= 3.0 ? "bg-zinc-500" : "bg-red-500"
          )} 
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 w-6 text-right">{score.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col mb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Company Evaluations</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Performance evaluations from host companies</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Received" value="24" icon={<FileCheck size={18} />} />
        <StatCard label="Pending Review" value="8" icon={<AlertTriangle size={18} />} trend="Needs action" />
        <StatCard label="Avg. Cohort Score" value="4.1" trend="/ 5.0" icon={<Star size={18} />} />
      </div>

      {/* Filters */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</span>
            <div className="flex flex-wrap items-center gap-1">
              {(['all', 'pending', 'reviewed', 'flagged'] as const).map(f => (
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
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full xl:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 pl-9 text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" 
              placeholder="Search students or companies..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Evaluations Table */}
      <Card title="Evaluation Records" className="overflow-hidden">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Company</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide min-w-[120px]">Overall Score</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Hours</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filtered.map((e, i) => (
                <React.Fragment key={e.id}>
                  <motion.tr 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => e.scores && setExpandedEval(expandedEval === e.id ? null : e.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{e.student}</span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{e.program}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{e.company}</span>
                    </td>
                    <td className="px-6 py-4">
                      {e.overallScore ? (
                        <div className="flex items-center gap-2">
                          <Star size={14} className={cn(
                            e.overallScore >= 4.0 ? "text-zinc-900 dark:text-zinc-100" :
                            e.overallScore >= 3.0 ? "text-zinc-500 dark:text-zinc-400" : "text-red-500"
                          )} />
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{e.overallScore.toFixed(1)}<span className="text-zinc-400 dark:text-zinc-500 font-medium">/5.0</span></span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{e.hoursCompleted}<span className="text-zinc-400 dark:text-zinc-500 font-normal">/{e.hoursRequired}</span></span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={e.status === 'reviewed' ? 'success' : e.status === 'pending' ? 'warning' : e.status === 'flagged' ? 'error' : 'neutral'}>
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {e.status === 'missing' ? (
                          <Button size="sm" variant="outline" icon={<Bell size={14} />}>Remind</Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            icon={expandedEval === e.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setExpandedEval(expandedEval === e.id ? null : e.id);
                            }}
                          >
                            {expandedEval === e.id ? 'Close' : 'View Detail'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expandable Detail Panel */}
                  <AnimatePresence>
                    {expandedEval === e.id && e.scores && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={6} className="px-6 py-0">
                          <div className="my-4 p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Left: Criteria Breakdown */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Evaluation Criteria</h4>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-xs mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Technical Skills</span>
                                  </div>
                                  {renderScoreBar(e.scores.technicalSkills)}
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Communication</span>
                                  </div>
                                  {renderScoreBar(e.scores.communication)}
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Punctuality</span>
                                  </div>
                                  {renderScoreBar(e.scores.punctuality)}
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Initiative</span>
                                  </div>
                                  {renderScoreBar(e.scores.initiative)}
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Teamwork</span>
                                  </div>
                                  {renderScoreBar(e.scores.teamwork)}
                                </div>
                              </div>
                            </div>

                            {/* Right: Info & Actions */}
                            <div className="space-y-6 flex flex-col justify-between">
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Evaluation Details</h4>
                                <div className="grid grid-cols-2 gap-y-3 text-xs">
                                  <span className="text-zinc-500 font-medium">Supervisor:</span>
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{e.supervisor}</span>
                                  
                                  <span className="text-zinc-500 font-medium">Submitted Date:</span>
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{e.submittedDate}</span>
                                </div>
                                
                                <div className="pt-2">
                                  <span className="text-zinc-500 font-medium text-xs block mb-1">Supervisor Remarks:</span>
                                  <p className="text-sm text-zinc-700 dark:text-zinc-300 italic p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                    "{e.remarks}"
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                {e.status === 'pending' || e.status === 'flagged' ? (
                                  <>
                                    <Button variant="outline" className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20" icon={<AlertTriangle size={14} />}>Flag for Review</Button>
                                    <Button variant="primary" className="flex-1" icon={<CheckCircle2 size={14} />}>Acknowledge</Button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-semibold">
                                    <CheckCircle2 size={16} />
                                    Evaluation Acknowledged
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
