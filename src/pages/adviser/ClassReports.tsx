import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { StatCard } from '@/src/components/ui/StatCard';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  FileSignature
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const students = [
  { id: '1', name: 'Maria Santos', program: 'BSIT401', hoursCompleted: 310, hoursRequired: 460, docsApproved: 7, docsTotal: 7, status: 'on-track' },
  { id: '2', name: 'Alice Brown', program: 'BSIT401', hoursCompleted: 280, hoursRequired: 460, docsApproved: 6, docsTotal: 7, status: 'on-track' },
  { id: '3', name: 'Sarah Lee', program: 'BSCS401', hoursCompleted: 200, hoursRequired: 460, docsApproved: 5, docsTotal: 7, status: 'on-track' },
  { id: '4', name: 'James Reyes', program: 'BSIT402', hoursCompleted: 150, hoursRequired: 460, docsApproved: 4, docsTotal: 7, status: 'behind' },
  { id: '5', name: 'Charlie Davis', program: 'BSCS402', hoursCompleted: 120, hoursRequired: 460, docsApproved: 4, docsTotal: 7, status: 'behind' },
  { id: '6', name: 'Eva Green', program: 'SHS-STEM12', hoursCompleted: 85, hoursRequired: 80, docsApproved: 7, docsTotal: 7, status: 'on-track' },
  { id: '7', name: 'Robert Cruz', program: 'BSIT402', hoursCompleted: 60, hoursRequired: 460, docsApproved: 1, docsTotal: 7, status: 'at-risk' },
  { id: '8', name: 'John Smith', program: 'SHS-ICT12', hoursCompleted: 10, hoursRequired: 80, docsApproved: 2, docsTotal: 7, status: 'at-risk' },
];

const documentCompletion = [
  { name: 'Resume', completion: 87 },
  { name: 'Consent', completion: 75 },
  { name: 'MOA', completion: 87 },
  { name: 'Endorsement', completion: 62 },
  { name: 'Journal', completion: 50 },
  { name: 'DTR', completion: 37 },
  { name: 'Training Plan', completion: 25 },
  { name: 'Evaluation', completion: 0 },
];

const hoursDistribution = [
  { range: '0-100h', count: 2, total: 8 },
  { range: '100-200h', count: 3, total: 8 },
  { range: '200-300h', count: 2, total: 8 },
  { range: '300-400h', count: 1, total: 8 },
  { range: '400-460h', count: 0, total: 8 },
];

export const ClassReports: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'All' | 'IT' | 'CS' | 'Senior High'>('All');

  const filteredStudents = students.filter(s => {
    if (activeSection === 'All') return true;
    if (activeSection === 'IT') return s.program.includes('BSIT');
    if (activeSection === 'CS') return s.program.includes('BSCS');
    if (activeSection === 'Senior High') return s.program.includes('SHS');
    return true;
  });

  const atRiskCount = filteredStudents.filter(s => s.status === 'at-risk').length;
  const avgHours = filteredStudents.length > 0 
    ? Math.round(filteredStudents.reduce((acc, s) => acc + s.hoursCompleted, 0) / filteredStudents.length)
    : 0;
  const completionRate = filteredStudents.length > 0
    ? Math.round((filteredStudents.reduce((acc, s) => acc + s.docsApproved, 0) / (filteredStudents.length * 7)) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Class Progress Reports</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cohort performance overview for Batch 2026</p>
        </div>
        <div className="flex gap-2">
          {['All', 'IT', 'CS', 'Senior High'].map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeSection === section 
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              )}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cohort Size" value={filteredStudents.length.toString()} icon={<Users size={18} />} />
        <StatCard label="Avg. Hours" value={avgHours.toString()} trend="/ 460h" icon={<Clock size={18} />} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<CheckCircle2 size={18} />} />
        <StatCard label="At Risk" value={atRiskCount.toString()} icon={<AlertTriangle size={18} />} trend="students" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Completion Matrix */}
        <Card title="Document Completion Matrix">
          <div className="space-y-4">
            {documentCompletion.map((doc, i) => (
              <div key={doc.name} className="flex items-center gap-4">
                <span className="w-24 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">{doc.name}</span>
                <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${doc.completion}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={cn(
                      "h-full rounded-full",
                      doc.completion >= 80 ? "bg-zinc-900 dark:bg-zinc-100" :
                      doc.completion >= 50 ? "bg-zinc-500" : "bg-zinc-300 dark:bg-zinc-600"
                    )}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold text-zinc-900 dark:text-zinc-100">{doc.completion}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Hours Distribution */}
        <Card title="Hours Distribution">
          <div className="space-y-5">
            {hoursDistribution.map((dist, i) => (
              <div key={dist.range} className="flex items-center gap-4">
                <span className="w-16 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">{dist.range}</span>
                <div className="flex-1 h-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dist.count / dist.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={cn(
                      "h-full rounded-md min-w-[4px]",
                      dist.count > 0 ? "bg-zinc-900 dark:bg-zinc-100" : "bg-transparent"
                    )}
                  />
                </div>
                <span className="w-24 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {dist.count} {dist.count === 1 ? 'student' : 'students'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Student Ranking Table */}
      <Card title="Student Progress Ranking" className="overflow-hidden">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide w-16 text-center">Rank</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Hours Completed</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Documents</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Progress</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filteredStudents.sort((a, b) => b.hoursCompleted - a.hoursCompleted).map((s, i) => {
                const progressPct = Math.round((s.hoursCompleted / s.hoursRequired) * 100);
                return (
                  <motion.tr 
                    key={s.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                        i < 3 ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400"
                      )}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{s.name}</span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{s.program}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{s.hoursCompleted}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{s.docsApproved}/{s.docsTotal}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              progressPct >= 70 ? "bg-zinc-900 dark:bg-zinc-100" : progressPct >= 40 ? "bg-zinc-500" : "bg-zinc-400 dark:bg-zinc-500"
                            )} 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 w-8">{progressPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.status === 'on-track' ? 'success' : s.status === 'behind' ? 'warning' : 'error'}>
                        {s.status.replace('-', ' ')}
                      </Badge>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Key Observations Card */}
        <Card title="Key Observations" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <Sparkles size={16} className="text-zinc-900 dark:text-white mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">AI-Generated Cohort Insights</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    2 students are currently classified as "At Risk" due to severe delays in DTR submissions.
                  </li>
                  <li className="flex items-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <span className="w-1 h-1 rounded-full bg-zinc-500 dark:bg-zinc-400 mt-1.5 shrink-0" />
                    Journal completion rate is lagging at 50% compared to earlier document requirements.
                  </li>
                  <li className="flex items-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    75% of the cohort is on track to complete the required 460 hours before the deadline.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Export Options Card */}
        <Card title="Export Options">
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" icon={<Download size={14} />}>
              Export as CSV Data
            </Button>
            <Button variant="outline" className="w-full justify-start" icon={<FileSignature size={14} />}>
              Export as PDF Report
            </Button>
            <Button variant="secondary" className="w-full justify-start" icon={<Printer size={14} />}>
              Print Summary View
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
