import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  FileCheck, 
  Activity, 
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  GraduationCap,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const Monitoring: React.FC = () => {
  const atRisk = [
    { name: 'Alice Brown', issue: 'Missing DTR (2 weeks)', course: 'BSIT401', due: '2026-05-01' },
    { name: 'Bob White', issue: 'Returned MOA (Pending)', course: 'BSIT402', due: '2026-05-05' },
    { name: 'Charlie Green', issue: 'Incomplete Journal', course: 'BSIT401', due: '2026-04-30' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Compliance Health" className="lg:col-span-1">
           <div className="space-y-6">
              {[
                { label: 'MOA Completion', val: 92, color: 'bg-zinc-900 dark:bg-zinc-100' },
                { label: 'DTR Submissions', val: 64, color: 'bg-zinc-700' },
                { label: 'Journal Updates', val: 31, color: 'bg-black dark:bg-white' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-zinc-500 dark:text-zinc-400">{stat.label}</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{stat.val}%</span>
                   </div>
                   <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.val}%` }}
                        className={cn("h-full rounded-full", stat.color)}
                      />
                   </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Activity size={14} className="text-zinc-400 dark:text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Global Status</span>
                 </div>
                 <Badge variant="success">stable</Badge>
              </div>
           </div>
        </Card>

        <Card 
          title="At-Risk Student Monitoring" 
          className="lg:col-span-2"
          action={<div className="flex gap-2"><Button variant="outline" size="sm" icon={<Filter size={12} />}>Filters</Button></div>}
        >
           <div className="space-y-1">
              {atRisk.map((student, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-100 dark:border-zinc-800/50 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                         {student.name[0]}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{student.name}</span>
                         <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{student.course}</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end">
                         <Badge variant="error" className="mb-1">{student.issue}</Badge>
                         <span className="text-[10px] font-bold text-zinc-300 uppercase">Deadline: {student.due}</span>
                      </div>
                      <button className="p-2 text-zinc-300 hover:text-zinc-900 dark:text-zinc-100 transition-colors">
                         <ChevronRight size={18} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <Card title="Active Faculty Load">
            <div className="space-y-4">
               {[
                 { name: 'Dr. Sarah Johnson', count: 15, status: 'Overloaded' },
                 { name: 'Prof. Mike Ross', count: 8, status: 'Normal' },
                 { name: 'Dr. Emily Blunt', count: 12, status: 'Normal' },
               ].map((fac, i) => (
                 <div key={i} className="flex justify-between items-center p-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 transition-colors">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">{fac.name}</span>
                       <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mt-1">{fac.count} Students</span>
                    </div>
                    <Badge variant={fac.status === 'Overloaded' ? 'warning' : 'neutral'} className="lowercase">{fac.status}</Badge>
                 </div>
               ))}
            </div>
         </Card>
         
         <Card title="Recent Alerts" footer={<Button variant="outline" size="sm" className="w-full">View System Log</Button>}>
            <div className="space-y-4">
               <div className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-l-4 border-l-zinc-900 dark:border-l-zinc-100 border border-zinc-100 dark:border-zinc-800/50">
                  <div className="mt-1 p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-black dark:text-zinc-100 shrink-0">
                     <AlertTriangle size={12} />
                  </div>
                  <div className="flex flex-col flex-1">
                     <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">MOA Breach Detected</span>
                     <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal mb-2">5 students missed the mandatory insurance filing deadline for Cycle B.</p>
                     <button className="self-start flex items-center gap-1 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide hover:underline group">
                       View Students <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                     </button>
                  </div>
               </div>
               <div className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-l-4 border-l-zinc-300 dark:border-l-zinc-600 border border-zinc-100 dark:border-zinc-800/50">
                  <div className="mt-1 p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-400 shrink-0">
                     <GraduationCap size={12} />
                  </div>
                  <div className="flex flex-col flex-1">
                     <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">Adviser Request</span>
                     <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal mb-2">Prof Mike Ross requested an extension for review deadlines.</p>
                     <div className="flex gap-2">
                       <button className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wide hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">Respond</button>
                       <button className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Dismiss</button>
                     </div>
                  </div>
               </div>
            </div>
         </Card>

         <Card title="Quick Search">
             <div className="flex flex-col gap-4">
                <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                   <input className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg p-2.5 pl-9 text-xs font-medium placeholder:text-zinc-400 dark:text-zinc-500 outline-none" placeholder="Search students, faculty..." />
                </div>
                <div className="flex flex-wrap gap-2">
                   {['BSIT401', 'BSIT402', 'Batch 2026', 'Late DTR'].map((tag, i) => (
                      <button key={i} className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-950 transition-all">{tag}</button>
                   ))}
                </div>
             </div>
         </Card>
      </div>
    </div>
  );
};
