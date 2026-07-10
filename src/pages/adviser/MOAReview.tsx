import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { StatCard } from '@/src/components/ui/StatCard';
import { 
  Users, 
  CheckSquare, 
  FileSignature, 
  AlertTriangle,
  Eye,
  FileCheck,
  Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const moaRecords = [
  { id: '1', student: 'Alice Brown', program: 'BSIT 402-401',
    company: 'TechCorp Solutions Inc.', pages: '6/6', status: 'approved',
    submittedDate: 'Apr 15, 2026', reviewedDate: 'Apr 18, 2026',
    notes: 'All signatures verified.' },
  { id: '2', student: 'Charlie Davis', program: 'BSIT 402',
    company: 'DataCorp PH', pages: '5/6', status: 'returned',
    submittedDate: 'Apr 20, 2026', reviewedDate: 'Apr 22, 2026',
    notes: 'Missing page 4 — insurance clause.' },
  { id: '3', student: 'Eva Green', program: 'BSIT 402-401',
    company: 'WebWorks Studio', pages: '6/6', status: 'pending',
    submittedDate: 'Apr 25, 2026', reviewedDate: null, notes: null },
  { id: '4', student: 'John Smith', program: 'BSIT 402',
    company: 'CloudNet Systems', pages: '—', status: 'missing',
    submittedDate: null, reviewedDate: null, notes: null },
  { id: '5', student: 'Maria Santos', program: 'BSIT 402-401',
    company: 'InnoTech Labs', pages: '6/6', status: 'approved',
    submittedDate: 'Apr 10, 2026', reviewedDate: 'Apr 12, 2026',
    notes: 'Approved without issues.' },
];

export const MOAReview: React.FC = () => {
  const [search, setSearch] = useState('');
  
  const filtered = moaRecords.filter(r => 
    r.student.toLowerCase().includes(search.toLowerCase()) || 
    r.company.toLowerCase().includes(search.toLowerCase())
  );

  const complianceRate = Math.round(
    (moaRecords.filter(r => r.status === 'approved').length / moaRecords.length) * 100
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col mb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">MOA Oversight</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Memorandum of Agreement tracking for assigned students</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total MOAs Tracked" value={moaRecords.length.toString()} icon={<Users size={18} />} />
        <StatCard label="Verified & Approved" value={moaRecords.filter(r => r.status === 'approved').length.toString()} icon={<FileCheck size={18} />} />
        <StatCard label="Pending Verification" value={moaRecords.filter(r => r.status === 'pending').length.toString()} trend="Requires review" icon={<AlertTriangle size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Table Column */}
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">MOA Status List</h3>
            <input 
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium placeholder:text-zinc-400 outline-none w-48" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Company</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Pages</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
                {filtered.map((r, i) => (
                  <motion.tr 
                    key={r.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.student}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{r.company}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{r.pages}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : r.status === 'returned' ? 'error' : 'neutral'}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {r.status === 'approved' ? (
                        <Button size="sm" variant="outline" icon={<Eye size={14} />}>View PDF</Button>
                      ) : r.status === 'missing' ? (
                        <Button size="sm" variant="outline" icon={<Bell size={14} />}>Remind</Button>
                      ) : (
                        <Button size="sm" variant="primary" icon={<FileSignature size={14} />}>Review</Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          <Card title="Compliance Summary">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Overall Compliance</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{complianceRate}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${complianceRate}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                  />
                </div>
              </div>
              <ul className="space-y-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <li className="flex justify-between">
                  <span>Submitted MOAs:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">{moaRecords.filter(r => r.status !== 'missing').length}/{moaRecords.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Verified & Approved:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">{moaRecords.filter(r => r.status === 'approved').length}/{moaRecords.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Returned for Revision:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">{moaRecords.filter(r => r.status === 'returned').length}</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card title="MOA Checklist">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Verification Requirements</p>
            <ul className="space-y-3">
              {[
                { label: 'All 6 pages present', checked: true },
                { label: 'Company signatory name & title', checked: true },
                { label: 'School signatory name & title', checked: true },
                { label: 'Insurance clause included', checked: false },
                { label: 'Start/End dates match OJT timeline', checked: true },
                { label: 'Notarization stamp visible', checked: false },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    item.checked 
                      ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900" 
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-transparent"
                  )}>
                    <CheckSquare size={12} className={cn(!item.checked && "opacity-0")} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    item.checked ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
                  )}>{item.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

      </div>
    </div>
  );
};
