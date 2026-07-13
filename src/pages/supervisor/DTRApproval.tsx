import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  Clock, 
  Calendar,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LogEntry {
  day: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  activities: string;
}

interface RemarkEntry {
  date: string;
  text: string;
  role: 'Supervisor' | 'Adviser';
}

interface WeeklyDTR {
  id: string;
  studentName: string;
  weekNumber: number;
  dateRange: string;
  totalHours: number;
  status: 'Pending' | 'Approved' | 'Returned';
  logs: LogEntry[];
  remarks?: string;
  remarksHistory?: RemarkEntry[];
}

const mockWeeklyDTRs: WeeklyDTR[] = [
  {
    id: 'dtr-1',
    studentName: 'Maria Santos',
    weekNumber: 8,
    dateRange: 'May 4 - May 8, 2026',
    totalHours: 40,
    status: 'Pending',
    logs: [
      { day: 'Monday', date: 'May 4, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Implemented adviser cohort dashboard charts.' },
      { day: 'Tuesday', date: 'May 5, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Integrated Google Gemini AI API in document reviewer.' },
      { day: 'Wednesday', date: 'May 6, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Debugged responsiveness issues on mobile viewports.' },
      { day: 'Thursday', date: 'May 7, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Wrote unit tests for student template parsing helper.' },
      { day: 'Friday', date: 'May 8, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Weekly review meeting and code synchronization.' }
    ],
    remarksHistory: [
      { date: 'May 1, 2026', text: 'Week 7 logs approved. Good efficiency on frontend sprint deliverables.', role: 'Supervisor' }
    ]
  },
  {
    id: 'dtr-2',
    studentName: 'Alice Brown',
    weekNumber: 7,
    dateRange: 'April 27 - May 1, 2026',
    totalHours: 35,
    status: 'Pending',
    logs: [
      { day: 'Monday', date: 'Apr 27, 2026', timeIn: '08:30 AM', timeOut: '05:00 PM', hours: 7.5, activities: 'Created test cases for user profile validations.' },
      { day: 'Tuesday', date: 'Apr 28, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Verified bug fixes on document status badges.' },
      { day: 'Wednesday', date: 'Apr 29, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Assisted in styling the onboarding workflows.' },
      { day: 'Thursday', date: 'Apr 30, 2026', timeIn: '09:00 AM', timeOut: '04:30 PM', hours: 6.5, activities: 'Refactored helper classes and optimized imports.' },
      { day: 'Friday', date: 'May 1, 2026', timeIn: '08:00 AM', timeOut: '01:00 PM', hours: 5, activities: 'Half day, compiled DTR records for submission.' }
    ],
    remarksHistory: [
      { date: 'Apr 24, 2026', text: 'Week 6 logs returned. Missing 2 hours log on Monday morning.', role: 'Supervisor' },
      { date: 'Apr 25, 2026', text: 'Resubmitted hours correct. signed.', role: 'Supervisor' }
    ]
  },
  {
    id: 'dtr-3',
    studentName: 'John Smith',
    weekNumber: 2,
    dateRange: 'April 27 - May 1, 2026',
    totalHours: 40,
    status: 'Approved',
    logs: [
      { day: 'Monday', date: 'Apr 27, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Local development setup and repository exploration.' },
      { day: 'Tuesday', date: 'Apr 28, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Read official STI OJT policy guidelines document.' },
      { day: 'Wednesday', date: 'Apr 29, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Created sample database tables in supabase instance.' },
      { day: 'Thursday', date: 'Apr 30, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Configured local environment variables and verified builds.' },
      { day: 'Friday', date: 'May 1, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Weekly synch and documentation drafting.' }
    ],
    remarksHistory: [
      { date: 'Apr 28, 2026', text: 'Local workspace properly set up. Ready to proceed.', role: 'Supervisor' }
    ]
  }
];

export const DTRApproval: React.FC = () => {
  const [dtrs, setDtrs] = useState<WeeklyDTR[]>(mockWeeklyDTRs);
  const [selectedDtrId, setSelectedDtrId] = useState<string>('dtr-1');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const selectedDtr = dtrs.find(d => d.id === selectedDtrId) || dtrs[0];

  const handleApprove = (id: string) => {
    setDtrs(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: 'Approved' };
      }
      return d;
    }));
    toast.success(`DTR for ${selectedDtr.studentName} (Week ${selectedDtr.weekNumber}) has been approved successfully!`);
  };

  const handleRejectSubmit = () => {
    if (!rejectNotes.trim()) {
      toast.error("Please enter a reason for rejecting the DTR.");
      return;
    }
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    setDtrs(prev => prev.map(d => {
      if (d.id === selectedDtrId) {
        const history = d.remarksHistory || [];
        return { 
          ...d, 
          status: 'Returned', 
          remarks: rejectNotes,
          remarksHistory: [...history, { date: today, text: rejectNotes, role: 'Supervisor' }]
        };
      }
      return d;
    }));
    toast.success(`DTR for ${selectedDtr.studentName} (Week ${selectedDtr.weekNumber}) has been sent back for revisions.`);
    setShowRejectModal(false);
    setRejectNotes('');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Daily Time Records (DTR) Approval</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Review and verify weekly rendered hours submitted by your interns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Submissions list */}
        <div className="space-y-4">
          <Card title="Submitted DTR Weeks">
            <div className="space-y-2">
              {dtrs.map(dtr => (
                <div 
                  key={dtr.id}
                  onClick={() => setSelectedDtrId(dtr.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative",
                    selectedDtrId === dtr.id
                      ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white text-white dark:text-zinc-950 shadow-md"
                      : "bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={cn("text-sm font-bold tracking-tight", selectedDtrId === dtr.id ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100")}>
                        {dtr.studentName}
                      </h4>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", selectedDtrId === dtr.id ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500")}>
                        Week {dtr.weekNumber}
                      </p>
                    </div>
                    <Badge variant={dtr.status === 'Approved' ? 'success' : dtr.status === 'Returned' ? 'error' : 'warning'}>
                      {dtr.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-zinc-100/10 dark:border-zinc-800/30">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Total Rendered</span>
                    <span className="text-sm font-black">{dtr.totalHours} hrs</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Log breakdown & action */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDtr && (
            <Card 
              title={`Week ${selectedDtr.weekNumber} Time Logs`}
              subtitle={selectedDtr.dateRange}
              action={
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status:</span>
                  <Badge variant={selectedDtr.status === 'Approved' ? 'success' : selectedDtr.status === 'Returned' ? 'error' : 'warning'}>
                    {selectedDtr.status}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-6">
                {/* Table of Daily Logs */}
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                        <th className="px-6 py-2.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Day / Date</th>
                        <th className="px-6 py-2.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">Time In</th>
                        <th className="px-6 py-2.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">Time Out</th>
                        <th className="px-6 py-2.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">Hours</th>
                        <th className="px-6 py-2.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Activities / Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
                      {selectedDtr.logs.map((log, index) => (
                        <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{log.day}</span>
                              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">{log.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">{log.timeIn}</td>
                          <td className="px-6 py-3.5 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">{log.timeOut}</td>
                          <td className="px-6 py-3.5 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">{log.hours}</td>
                          <td className="px-6 py-3.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[200px] truncate" title={log.activities}>{log.activities}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Show Rejection Remarks if Returned */}
                {selectedDtr.status === 'Returned' && selectedDtr.remarks && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400 text-xs font-bold">
                      <AlertCircle size={14} />
                      <span>Returned with Remarks</span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium italic">
                      "{selectedDtr.remarks}"
                    </p>
                  </div>
                )}

                {/* Remarks / Comments History */}
                {selectedDtr.remarksHistory && selectedDtr.remarksHistory.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={12} /> Remarks History
                    </h4>
                    <div className="space-y-2">
                      {selectedDtr.remarksHistory.map((rem, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                            <span>{rem.role} Comment</span>
                            <span>{rem.date}</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium italic">"{rem.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approvals Action Toolbar */}
                {selectedDtr.status === 'Pending' && (
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Please audit carefully. Once approved, rendered hours are finalized.</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-950 dark:hover:bg-red-950/20"
                        icon={<X size={14} />}
                        onClick={() => setShowRejectModal(true)}
                      >
                        Return to Intern
                      </Button>
                      <Button 
                        variant="primary"
                        icon={<Check size={14} />}
                        onClick={() => handleApprove(selectedDtr.id)}
                      >
                        Approve DTR
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reject/Return Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Return DTR for Revision</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Maria Santos · Week {selectedDtr?.weekNumber}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Reason / Feedback</label>
              <textarea 
                rows={4}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none font-medium"
                placeholder="Explain what needs to be fixed (e.g., incorrect logged hours, missing output descriptions)..."
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowRejectModal(false); setRejectNotes(''); }}>Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-red-600 hover:bg-red-700 text-white border-none"
                onClick={handleRejectSubmit}
              >
                Send Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
