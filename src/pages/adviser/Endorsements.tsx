import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { StatCard } from '@/src/components/ui/StatCard';
import { 
  Search, 
  ChevronRight, 
  Clock, 
  FileSignature,
  Download,
  Eye,
  History,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const endorsements = [
  { id: '1', student: 'Alice Brown', program: 'BSIT 402-401', company: 'TechCorp Solutions Inc.',
    template: 'Standard Endorsement - IT', status: 'issued', issuedDate: 'May 1, 2026',
    expiresDate: 'Nov 1, 2026' },
  { id: '2', student: 'Charlie Davis', program: 'BSIT 402', company: 'DataCorp PH',
    template: 'Standard Endorsement - CS', status: 'pending', issuedDate: null,
    expiresDate: null },
  { id: '3', student: 'Eva Green', program: 'BSIT 402-401', company: 'WebWorks Studio',
    template: 'Standard Endorsement - IT', status: 'issued', issuedDate: 'Apr 20, 2026',
    expiresDate: 'Oct 20, 2026' },
  { id: '4', student: 'John Smith', program: 'BSIT 402', company: 'CloudNet Systems',
    template: null, status: 'missing', issuedDate: null, expiresDate: null },
  { id: '5', student: 'Maria Santos', program: 'BSIT 402-401', company: 'InnoTech Labs',
    template: 'Standard Endorsement - IT', status: 'issued', issuedDate: 'May 5, 2026',
    expiresDate: 'Nov 5, 2026' },
];

const activityLog = [
  { id: '1', action: 'Issued Endorsement', target: 'Alice Brown', time: '2 days ago', type: 'success' },
  { id: '2', action: 'Requested Endorsement', target: 'Charlie Davis', time: '5 hours ago', type: 'warning' },
  { id: '3', action: 'Template Updated', target: 'Standard IT', time: '1 week ago', type: 'info' },
  { id: '4', action: 'Issued Endorsement', target: 'Maria Santos', time: 'Yesterday', type: 'success' },
];

export const Endorsements: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'issued' | 'pending' | 'missing'>('all');
  const [issueModal, setIssueModal] = useState<typeof endorsements[0] | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleIssueEndorsement = () => {
    setIsIssuing(true);
    setTimeout(() => {
      setIsIssuing(false);
      setIssueModal(null);
      // In a real app, update the state here
    }, 1500);
  };

  const filtered = endorsements.filter(e => {
    const matchSearch = e.student.toLowerCase().includes(search.toLowerCase()) || e.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || e.status === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Issued" value="142" icon={<FileSignature size={18} />} />
        <StatCard label="Pending Requests" value="8" icon={<Clock size={18} />} trend="+3 today" />
        <StatCard label="Issued This Week" value="12" icon={<CheckCircle size={18} />} />
        <StatCard label="Avg. Processing Time" value="1.2" trend="days" icon={<History size={18} />} />
      </div>

      {/* Filters */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</span>
            <div className="flex flex-wrap items-center gap-1">
              {(['all', 'issued', 'pending', 'missing'] as const).map(f => (
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

      {/* Endorsement Tracker Table */}
      <Card title="Endorsement Tracker" className="overflow-hidden">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Company</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Template</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Issued Date</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filtered.map((e, i) => (
                <motion.tr 
                  key={e.id}
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
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
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {e.template || <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={e.status === 'issued' ? 'success' : e.status === 'pending' ? 'warning' : 'neutral'}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {e.issuedDate ? (
                        <>
                          <Clock size={11} />
                          {e.issuedDate}
                        </>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {e.status === 'issued' ? (
                        <>
                          <Button size="sm" variant="outline" icon={<Eye size={14} />}>View</Button>
                          <Button size="sm" variant="outline" icon={<Download size={14} />} />
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="primary" 
                          icon={<FileSignature size={14} />}
                          onClick={() => setIssueModal(e)}
                        >
                          Issue
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Issue Card */}
        <Card title="Quick Issue">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Select Student</label>
              <select 
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow text-zinc-900 dark:text-zinc-100"
              >
                <option value="">-- Choose Student --</option>
                {endorsements.filter(e => e.status !== 'issued').map(e => (
                  <option key={e.id} value={e.id}>{e.student} ({e.company})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Select Template</label>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow text-zinc-900 dark:text-zinc-100"
              >
                <option value="">-- Choose Template --</option>
                <option value="it">Standard Endorsement - IT</option>
                <option value="cs">Standard Endorsement - CS</option>
                <option value="accelerated">Accelerated Track Endorsement</option>
              </select>
            </div>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button 
                variant="primary" 
                icon={<FileSignature size={14} />}
                disabled={!selectedStudentId || !selectedTemplate}
                onClick={() => {
                  const student = endorsements.find(e => e.id === selectedStudentId);
                  if (student) setIssueModal(student);
                }}
              >
                Generate & Issue
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card title="Recent Activity">
          <div className="space-y-4">
            {activityLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  log.type === 'success' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" :
                  log.type === 'warning' ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300" :
                  "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                )}>
                  {log.type === 'success' ? <CheckCircle size={14} /> : log.type === 'warning' ? <Clock size={14} /> : <History size={14} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {log.action} <span className="font-normal text-zinc-500 dark:text-zinc-400">· {log.target}</span>
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Issue Endorsement Modal */}
      <AnimatePresence>
        {issueModal && (
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
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Issue Endorsement</h3>
                    <p className="text-xs font-medium text-zinc-500">Generate from approved template</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIssueModal(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <AlertTriangle size={18} className="opacity-0" /> {/* Spacer */}
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Student</label>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{issueModal.student}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Program</label>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{issueModal.program}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Assigned Company</label>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{issueModal.company}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Select Template</label>
                  <select 
                    defaultValue={issueModal.template || ""}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="" disabled>-- Choose Template --</option>
                    <option value="Standard Endorsement - IT">Standard Endorsement - IT</option>
                    <option value="Standard Endorsement - CS">Standard Endorsement - CS</option>
                    <option value="Accelerated Track Endorsement">Accelerated Track Endorsement</option>
                  </select>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIssueModal(null)} disabled={isIssuing}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={handleIssueEndorsement} 
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
