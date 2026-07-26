import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { StatCard } from '@/src/components/ui/StatCard';
import { 
  Star, 
  Users, 
  ChevronRight, 
  TrendingUp, 
  Scale, 
  MessageCircle,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface CriteriaComparison {
  label: string;
  supervisor: number;
  adviser: number;
}

interface StudentComparisonRecord {
  id: string;
  name: string;
  course: string;
  company: string;
  supervisorName: string;
  adviserName: string;
  criteria: CriteriaComparison[];
  supervisorRemarks: string;
  adviserRemarks: string;
}

const mockComparisons: StudentComparisonRecord[] = [
  {
    id: 'comp-1',
    name: 'Maria Santos',
    course: 'BSIT 402-401',
    company: 'InnoTech Labs',
    supervisorName: 'Engr. Paolo Reyes',
    adviserName: 'Dr. Sarah Johnson',
    criteria: [
      { label: 'Technical Skills', supervisor: 4.5, adviser: 4.0 },
      { label: 'Communication', supervisor: 4.0, adviser: 3.8 },
      { label: 'Punctuality', supervisor: 5.0, adviser: 4.5 },
      { label: 'Initiative', supervisor: 4.5, adviser: 4.0 },
      { label: 'Teamwork', supervisor: 4.0, adviser: 4.2 }
    ],
    supervisorRemarks: 'Excellent initiative. Contributed to 3 major sprint deliverables.',
    adviserRemarks: 'Maria consistently submits high-quality weekly journals and maintains a stellar focus on academic guidelines.'
  },
  {
    id: 'comp-2',
    name: 'Alice Brown',
    course: 'BSIT 402-401',
    company: 'TechCorp Solutions Inc.',
    supervisorName: 'Mr. James Tan',
    adviserName: 'Prof. Mike Ross',
    criteria: [
      { label: 'Technical Skills', supervisor: 4.2, adviser: 4.5 },
      { label: 'Communication', supervisor: 3.8, adviser: 4.0 },
      { label: 'Punctuality', supervisor: 4.5, adviser: 4.0 },
      { label: 'Initiative', supervisor: 4.0, adviser: 3.5 },
      { label: 'Teamwork', supervisor: 4.5, adviser: 4.5 }
    ],
    supervisorRemarks: 'Demonstrates strong problem-solving ability. Needs improvement in documentation.',
    adviserRemarks: 'Alice has excellent logical thinking. However, weekly reports are occasionally submitted 1 day late.'
  },
  {
    id: 'comp-3',
    name: 'John Smith',
    course: 'BSIT 402',
    company: 'CloudNet Systems',
    supervisorName: 'Mr. Robert Chang',
    adviserName: 'Dr. Sarah Johnson',
    criteria: [
      { label: 'Technical Skills', supervisor: 3.0, adviser: 3.5 },
      { label: 'Communication', supervisor: 2.5, adviser: 3.0 },
      { label: 'Punctuality', supervisor: 2.0, adviser: 2.5 },
      { label: 'Initiative', supervisor: 3.0, adviser: 3.0 },
      { label: 'Teamwork', supervisor: 3.5, adviser: 3.5 }
    ],
    supervisorRemarks: 'Struggles with attendance and communication. Needs intervention.',
    adviserRemarks: 'Log entries indicate poor DTR consistency. We scheduled an intervention meeting.'
  }
];

export const AdviserComparison: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('comp-1');

  const currentRecord = mockComparisons.find(r => r.id === selectedStudentId) || mockComparisons[0];

  const computeAverage = (ratings: number[]) => {
    const sum = ratings.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  };

  const supervisorAvg = computeAverage(currentRecord.criteria.map(c => c.supervisor));
  const adviserAvg = computeAverage(currentRecord.criteria.map(c => c.adviser));
  const variance = Math.round((supervisorAvg - adviserAvg) * 10) / 10;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Appraisal Rating Comparison</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Compare supervisor assessments with adviser verification ratings to identify performance variance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Student selection list */}
        <div className="space-y-4">
          <Card title="Student Roster">
            <div className="space-y-2">
              {mockComparisons.map(rec => (
                <div 
                  key={rec.id}
                  onClick={() => setSelectedStudentId(rec.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5",
                    selectedStudentId === rec.id
                      ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white text-white dark:text-zinc-950 shadow-md"
                      : "bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={cn("text-sm font-bold tracking-tight", selectedStudentId === rec.id ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100")}>
                        {rec.name}
                      </h4>
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                        {rec.course}
                      </p>
                    </div>
                    <ChevronRight size={14} className="opacity-60" />
                  </div>
                  <div className="text-[10px] mt-1 font-semibold flex items-center justify-between opacity-80 border-t border-zinc-100/10 pt-1.5">
                    <span>{rec.company}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Detailed Comparison Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Supervisor Avg" value={`${supervisorAvg.toFixed(1)} / 5.0`} icon={<UserCheck size={16} />} />
            <StatCard label="Adviser Avg" value={`${adviserAvg.toFixed(1)} / 5.0`} icon={<Star size={16} />} />
            <StatCard 
              label="Appraisal Variance" 
              value={variance >= 0 ? `+${variance.toFixed(1)}` : `${variance.toFixed(1)}`} 
              icon={<Scale size={16} />} 
              trend={variance === 0 ? "Perfect Match" : variance > 0 ? "Supervisor Rated Higher" : "Adviser Rated Higher"} 
            />
          </div>

          <Card title={`Assessment Breakdown: ${currentRecord.name}`}>
            <div className="space-y-6">
              {/* Table / Bar breakdown */}
              <div className="space-y-4">
                {currentRecord.criteria.map((c, i) => {
                  const diff = Math.round((c.supervisor - c.adviser) * 10) / 10;
                  return (
                    <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-900 dark:text-zinc-100">{c.label}</span>
                        <Badge variant={diff === 0 ? 'neutral' : diff > 0 ? 'success' : 'error'}>
                          {diff === 0 ? 'Match' : diff > 0 ? `+${diff.toFixed(1)} Diff` : `${diff.toFixed(1)} Diff`}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {/* Supervisor row */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                            <span>Supervisor ({currentRecord.supervisorName})</span>
                            <span>{c.supervisor.toFixed(1)}</span>
                          </div>
                          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.supervisor / 5) * 100}%` }}
                              className="h-full bg-zinc-900 dark:bg-white rounded-full"
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </div>

                        {/* Adviser row */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                            <span>Adviser ({currentRecord.adviserName})</span>
                            <span>{c.adviser.toFixed(1)}</span>
                          </div>
                          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.adviser / 5) * 100}%` }}
                              className="h-full bg-zinc-500 rounded-full"
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Qualitative side-by-side remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                    <MessageCircle size={12} /> Supervisor Remarks
                  </span>
                  <p className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs italic text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[80px]">
                    "{currentRecord.supervisorRemarks}"
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                    <MessageCircle size={12} /> Adviser Notes
                  </span>
                  <p className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs italic text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[80px]">
                    "{currentRecord.adviserRemarks}"
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
