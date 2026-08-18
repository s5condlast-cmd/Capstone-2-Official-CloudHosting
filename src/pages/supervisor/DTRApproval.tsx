import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { StatCard } from '@/src/components/ui/StatCard';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  Clock, 
  Calendar,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  UserCheck,
  FileSignature,
  RotateCcw,
  PenTool,
  Sparkles,
  Edit3,
  Coffee,
  Trash2,
  ArrowLeft,
  Eye,
  FileText,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Send
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { generateDTRXlsxBlob, generateDTRFileName, DTREntry, cropCanvasToDataUrl, normalizeSignatureDataUrl } from '@/src/lib/excelGenerator';
import { submissionStorage } from '@/src/lib/submissionStorage';

interface LogEntry {
  day: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  activities: string;
  isDayOff?: boolean;
  signatureUrl?: string;
}

interface RemarkEntry {
  date: string;
  text: string;
  role: 'Supervisor' | 'Adviser';
}

interface WeeklyDTR {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  weekNumber: number;
  dateRange: string;
  totalHours: number;
  submittedDate: string;
  status: 'Pending' | 'Approved' | 'Returned';
  logs: LogEntry[];
  remarks?: string;
  remarksHistory?: RemarkEntry[];
  signatureDataUrl?: string;
}

const mockWeeklyDTRs: WeeklyDTR[] = [
  {
    id: 'dtr-1',
    studentName: 'Maria Santos',
    studentId: '2023-01042',
    course: 'BSIT 402',
    weekNumber: 8,
    dateRange: 'May 4 - May 10, 2026',
    totalHours: 40,
    submittedDate: 'May 10, 2026',
    status: 'Pending',
    logs: [
      { day: 'Monday', date: 'May 4, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Implemented adviser cohort dashboard charts.', isDayOff: false },
      { day: 'Tuesday', date: 'May 5, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Integrated Google Gemini AI API in document reviewer.', isDayOff: false },
      { day: 'Wednesday', date: 'May 6, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Debugged responsiveness issues on mobile viewports.', isDayOff: false },
      { day: 'Thursday', date: 'May 7, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Wrote unit tests for student template parsing helper.', isDayOff: false },
      { day: 'Friday', date: 'May 8, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Weekly review meeting and code synchronization.', isDayOff: false },
      { day: 'Saturday', date: 'May 9, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, activities: 'Weekend Day Off', isDayOff: true },
      { day: 'Sunday', date: 'May 10, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, activities: 'Weekend Day Off', isDayOff: true }
    ],
    remarksHistory: [
      { date: 'May 1, 2026', text: 'Week 7 logs approved. Good efficiency on frontend sprint deliverables.', role: 'Supervisor' }
    ]
  },
  {
    id: 'dtr-2',
    studentName: 'Alice Brown',
    studentId: '2023-01089',
    course: 'BSIT 401',
    weekNumber: 7,
    dateRange: 'April 27 - May 3, 2026',
    totalHours: 35,
    submittedDate: 'May 3, 2026',
    status: 'Pending',
    logs: [
      { day: 'Monday', date: 'Apr 27, 2026', timeIn: '08:30 AM', timeOut: '05:00 PM', hours: 7.5, activities: 'Created test cases for user profile validations.', isDayOff: false },
      { day: 'Tuesday', date: 'Apr 28, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Verified bug fixes on document status badges.', isDayOff: false },
      { day: 'Wednesday', date: 'Apr 29, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Assisted in styling the onboarding workflows.', isDayOff: false },
      { day: 'Thursday', date: 'Apr 30, 2026', timeIn: '09:00 AM', timeOut: '04:30 PM', hours: 6.5, activities: 'Refactored helper classes and optimized imports.', isDayOff: false },
      { day: 'Friday', date: 'May 1, 2026', timeIn: '08:00 AM', timeOut: '01:00 PM', hours: 5, activities: 'Half day, compiled DTR records for submission.', isDayOff: false },
      { day: 'Saturday', date: 'May 2, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, activities: 'Weekend Day Off', isDayOff: true },
      { day: 'Sunday', date: 'May 3, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, activities: 'Weekend Day Off', isDayOff: true }
    ],
    remarksHistory: [
      { date: 'Apr 24, 2026', text: 'Week 6 logs returned. Missing 2 hours log on Monday morning.', role: 'Supervisor' },
      { date: 'Apr 25, 2026', text: 'Resubmitted hours correct. signed.', role: 'Supervisor' }
    ]
  },
  {
    id: 'dtr-3',
    studentName: 'John Smith',
    studentId: '2023-01125',
    course: 'BSIT 402',
    weekNumber: 2,
    dateRange: 'April 27 - May 3, 2026',
    totalHours: 40,
    submittedDate: 'May 3, 2026',
    status: 'Approved',
    logs: [
      { day: 'Monday', date: 'Apr 27, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Local development setup and repository exploration.', isDayOff: false },
      { day: 'Tuesday', date: 'Apr 28, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Read official STI OJT policy guidelines document.', isDayOff: false },
      { day: 'Wednesday', date: 'Apr 29, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Created sample database tables in supabase instance.', isDayOff: false },
      { day: 'Thursday', date: 'Apr 30, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Configured local environment variables and verified builds.', isDayOff: false },
      { day: 'Friday', date: 'May 1, 2026', timeIn: '08:00 AM', timeOut: '05:00 PM', hours: 8, activities: 'Weekly synch and documentation drafting.', isDayOff: false },
      { day: 'Saturday', date: 'May 2, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, activities: 'Weekend Day Off', isDayOff: true },
      { day: 'Sunday', date: 'May 3, 2026', timeIn: 'OFF', timeOut: 'OFF', hours: 0, activities: 'Weekend Day Off', isDayOff: true }
    ],
    remarksHistory: [
      { date: 'Apr 28, 2026', text: 'Local workspace properly set up. Ready to proceed.', role: 'Supervisor' }
    ]
  }
];

export const DTRApproval: React.FC = () => {
  const [dtrs, setDtrs] = useState<WeeklyDTR[]>(mockWeeklyDTRs);
  const [selectedDtrId, setSelectedDtrId] = useState<string>('dtr-1');
  const [viewMode, setViewMode] = useState<'table' | 'review'>('table');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  // Persistent Saved Signature Store (1 master signature in localStorage)
  const [savedSignature, setSavedSignature] = useState<string | null>(() => {
    return localStorage.getItem('supervisor_saved_signature') || null;
  });

  // Auto-upgrade any pre-existing localStorage signature to centered, cropped format
  useEffect(() => {
    const existingSig = localStorage.getItem('supervisor_saved_signature');
    if (existingSig && existingSig.startsWith('data:image')) {
      normalizeSignatureDataUrl(existingSig).then(cleanSig => {
        if (cleanSig && cleanSig !== existingSig) {
          try {
            localStorage.setItem('supervisor_saved_signature', cleanSig);
          } catch (e) {}
          setSavedSignature(cleanSig);
        }
      });
    }
  }, []);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [targetLogIndex, setTargetLogIndex] = useState<number | null>(null);
  const [removeSignatureTargetIndex, setRemoveSignatureTargetIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const selectedDtr = dtrs.find(d => d.id === selectedDtrId) || dtrs[0];

  // Helper to filter DTR records based on active search & tab
  const filteredDtrs = dtrs.filter(dtr => {
    const matchesSearch = dtr.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dtr.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dtr.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' 
      ? true 
      : activeTab === 'pending' 
        ? dtr.status === 'Pending' 
        : dtr.status === 'Approved';
    return matchesSearch && matchesTab;
  });

  const totalSubmissions = dtrs.length;
  const pendingCount = dtrs.filter(d => d.status === 'Pending').length;
  const approvedCount = dtrs.filter(d => d.status === 'Approved').length;

  const handleOpenReview = (id: string) => {
    setSelectedDtrId(id);
    setViewMode('review');
  };

  // Comprehensive helper to parse time strings & compute exact rendered hours
  const computeHours = (timeIn: string, timeOut: string): number => {
    try {
      const parseTime = (t: string): number | null => {
        if (!t || !t.trim()) return null;
        const str = t.trim().toUpperCase();
        
        const match = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
        if (!match) return null;
        
        let [_, hStr, mStr, mod] = match;
        let h = parseInt(hStr, 10);
        let m = mStr ? parseInt(mStr, 10) : 0;
        
        if (mod === 'PM' && h < 12) h += 12;
        if (mod === 'AM' && h === 12) h = 0;
        
        return h * 60 + m;
      };

      const startMin = parseTime(timeIn);
      const endMin = parseTime(timeOut);

      if (startMin === null || endMin === null) return 0;

      let diffMin = endMin - startMin;
      if (diffMin < 0) diffMin += 24 * 60; // Overnight shift handle

      // Standard lunch break deduction if duration > 5 hours
      if (diffMin >= 5 * 60) {
        diffMin -= 60;
      }

      const totalH = Math.max(0, diffMin / 60);
      return Math.round(totalH * 10) / 10;
    } catch {
      return 0;
    }
  };

  // Canvas Drawing Setup & Styling
  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showSignatureModal]);

  // Canvas Drawing Logic with scaled coordinate system
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Single click handler: Applies saved signature ONLY to the clicked day row
  const handleCellClick = (index: number) => {
    const log = selectedDtr.logs[index];

    if (log.isDayOff) {
      toast.info(`${log.day} is marked as Not Work. Switch to Work to add a signature.`);
      return;
    }

    if (log.signatureUrl) {
      toast.info(`Already signed for ${log.day}. Double-click if you wish to remove signature.`, { id: 'dbl-click-hint' });
      return;
    }

    if (savedSignature) {
      setDtrs(prev => prev.map(d => {
        if (d.id === selectedDtrId) {
          const updatedLogs = [...d.logs];
          updatedLogs[index] = { ...updatedLogs[index], signatureUrl: savedSignature };
          return { ...d, logs: updatedLogs, signatureDataUrl: savedSignature };
        }
        return d;
      }));
      toast.success(`Applied signature to ${log.day} (${log.date})!`);
    } else {
      setTargetLogIndex(index);
      setShowSignatureModal(true);
      setHasDrawn(false);
    }
  };

  // Double click handler: Triggers confirmation modal to remove signature
  const handleCellDoubleClick = (index: number) => {
    const log = selectedDtr.logs[index];
    if (log.signatureUrl) {
      setRemoveSignatureTargetIndex(index);
    }
  };

  // Confirmed removal handler
  const handleConfirmRemoveSignature = () => {
    if (removeSignatureTargetIndex === null) return;
    const targetLog = selectedDtr.logs[removeSignatureTargetIndex];

    setDtrs(prev => prev.map(d => {
      if (d.id === selectedDtrId) {
        const updatedLogs = [...d.logs];
        updatedLogs[removeSignatureTargetIndex] = { 
          ...updatedLogs[removeSignatureTargetIndex], 
          signatureUrl: undefined 
        };
        return { ...d, logs: updatedLogs };
      }
      return d;
    }));

    toast.success(`Removed signature from ${targetLog.day} (${targetLog.date}).`);
    setRemoveSignatureTargetIndex(null);
  };

  // Save/Update Master Signature
  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast.error('Please draw a signature before saving.');
      return;
    }
    const signatureUrl = cropCanvasToDataUrl(canvas);

    try {
      localStorage.setItem('supervisor_saved_signature', signatureUrl);
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
    setSavedSignature(signatureUrl);

    if (targetLogIndex !== null) {
      setDtrs(prev => prev.map(d => {
        if (d.id === selectedDtrId) {
          const updatedLogs = [...d.logs];
          updatedLogs[targetLogIndex] = { ...updatedLogs[targetLogIndex], signatureUrl };
          return { ...d, logs: updatedLogs, signatureDataUrl: signatureUrl };
        }
        return d;
      }));
      toast.success(`Signature saved & applied to ${selectedDtr.logs[targetLogIndex].day}!`);
    } else {
      toast.success(`Supervisor signature saved! Click "Apply Signature" on any day row.`);
    }

    setShowSignatureModal(false);
    setTargetLogIndex(null);
    clearCanvas();
  };

  const handleOpenSignatureModal = (logIdx?: number) => {
    setTargetLogIndex(logIdx !== undefined ? logIdx : null);
    setShowSignatureModal(true);
    setHasDrawn(false);
  };

  const handleApprove = async (id: string) => {
    const activeSignature = savedSignature || selectedDtr.signatureDataUrl;
    if (!activeSignature) {
      toast.info('Please draw your signature once to save before approving.');
      handleOpenSignatureModal();
      return;
    }

    setDtrs(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: 'Approved', signatureDataUrl: activeSignature };
      }
      return d;
    }));

    try {
      const dtrEntry: DTREntry = {
        studentName: selectedDtr.studentName,
        studentId: selectedDtr.studentId,
        courseSection: selectedDtr.course,
        companyName: 'InnoTech Solutions Inc.',
        weekNumber: selectedDtr.weekNumber,
        monthYear: selectedDtr.dateRange,
        totalHours: selectedDtr.totalHours,
        status: 'Approved',
        supervisorName: 'Company Supervisor',
        logs: selectedDtr.logs
      };

      const xlsxBlob = await generateDTRXlsxBlob(dtrEntry);
      await submissionStorage.publishSignedDTR(
        selectedDtr.studentName,
        selectedDtr.course,
        selectedDtr.weekNumber,
        xlsxBlob
      );

      toast.success(`DTR Approved & Submitted to Adviser! Signed .xlsx spreadsheet published to Supabase for ${selectedDtr.studentName}.`);
    } catch (err) {
      console.warn('Submission notice:', err);
      toast.success(`DTR for ${selectedDtr.studentName} (Week ${selectedDtr.weekNumber}) approved successfully!`);
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectNotes.trim()) {
      toast.error('Please enter revision remarks before returning the DTR.');
      return;
    }

    setDtrs(prev => prev.map(d => {
      if (d.id === selectedDtrId) {
        const newRemarks: RemarkEntry[] = [
          ...(d.remarksHistory || []),
          { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), text: rejectNotes, role: 'Supervisor' }
        ];
        return { ...d, status: 'Returned', remarks: rejectNotes, remarksHistory: newRemarks };
      }
      return d;
    }));

    toast.success(`DTR returned to ${selectedDtr.studentName} for revision.`);
    setRejectNotes('');
  };

  const handleDayStatusToggle = (index: number) => {
    setDtrs(prev => prev.map(d => {
      if (d.id === selectedDtrId) {
        const updatedLogs = [...d.logs];
        const current = updatedLogs[index];
        const isNowDayOff = !current.isDayOff;

        updatedLogs[index] = {
          ...current,
          isDayOff: isNowDayOff,
          timeIn: isNowDayOff ? 'OFF' : '08:00 AM',
          timeOut: isNowDayOff ? 'OFF' : '05:00 PM',
          hours: isNowDayOff ? 0 : computeHours('08:00 AM', '05:00 PM'),
          activities: isNowDayOff ? 'Weekend Day Off' : current.activities === 'Weekend Day Off' ? 'Daily tasks logged.' : current.activities,
          signatureUrl: isNowDayOff ? undefined : current.signatureUrl
        };

        const newTotal = updatedLogs.reduce((acc, curr) => acc + curr.hours, 0);
        return { ...d, logs: updatedLogs, totalHours: newTotal };
      }
      return d;
    }));
  };

  const handleTimeChange = (index: number, field: 'timeIn' | 'timeOut', val: string) => {
    setDtrs(prev => prev.map(d => {
      if (d.id === selectedDtrId) {
        const updatedLogs = [...d.logs];
        const current = updatedLogs[index];
        const updatedLog = { ...current, [field]: val };
        
        const newHours = computeHours(updatedLog.timeIn, updatedLog.timeOut);
        updatedLog.hours = newHours;
        updatedLogs[index] = updatedLog;

        const newTotal = updatedLogs.reduce((acc, curr) => acc + curr.hours, 0);
        return { ...d, logs: updatedLogs, totalHours: newTotal };
      }
      return d;
    }));
  };

  const handleDownloadExcel = async () => {
    try {
      const dtrEntry: DTREntry = {
        studentName: selectedDtr.studentName,
        studentId: selectedDtr.studentId,
        courseSection: selectedDtr.course,
        companyName: 'InnoTech Solutions Inc.',
        weekNumber: selectedDtr.weekNumber,
        monthYear: selectedDtr.dateRange,
        totalHours: selectedDtr.totalHours,
        status: selectedDtr.status,
        supervisorName: 'Company Supervisor',
        logs: selectedDtr.logs
      };

      const xlsxBlob = await generateDTRXlsxBlob(dtrEntry);

      // Publish directly to Supabase for Adviser & Admin without downloading to supervisor's device
      await submissionStorage.publishSignedDTR(
        selectedDtr.studentName,
        selectedDtr.course,
        selectedDtr.weekNumber,
        xlsxBlob
      );

      const signedCount = selectedDtr.logs.filter(l => l.signatureUrl).length;
      toast.success(`DTR Excel Spreadsheet published to Adviser & Admin for verification! (${signedCount}/${selectedDtr.logs.length} dates signed)`);
    } catch (err: any) {
      console.error("Excel export error:", err);
      toast.error("Failed to publish DTR Excel spreadsheet.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {viewMode === 'review' && (
              <button
                onClick={() => setViewMode('table')}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Back to Submissions Table"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Daily Time Records (DTR) Approval
            </h1>
          </div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {viewMode === 'table' 
              ? 'Select an intern from the table below to verify their submitted Daily Time Records.'
              : `Reviewing Daily Time Record logs for ${selectedDtr.studentName} (Week ${selectedDtr.weekNumber}).`}
          </p>
        </div>

        {/* View Mode Toggle / Filters */}
        <div className="flex items-center gap-2">
          {viewMode === 'review' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
              icon={<ArrowLeft size={14} />}
              className="text-xs font-bold"
            >
              Back to Student List
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
              {(['all', 'pending', 'approved'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
                    activeTab === tab
                      ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  {tab === 'all' ? 'All Submissions' : tab === 'pending' ? 'Pending Approval' : 'Approved'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: STUDENT SUBMISSIONS TABLE OVERVIEW */}
      {viewMode === 'table' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total DTR Submissions" value={totalSubmissions.toString()} icon={<FileText size={18} />} />
            <StatCard label="Pending Verification" value={pendingCount.toString()} icon={<Clock size={18} />} trend={pendingCount > 0 ? "Action required" : undefined} />
            <StatCard label="Approved DTRs" value={approvedCount.toString()} icon={<CheckCircle2 size={18} />} />
          </div>

          {/* Search & Submissions Table */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search student name, ID, or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-primary transition-colors text-zinc-800 dark:text-zinc-200 font-normal"
                />
              </div>

              <div className="text-xs font-semibold text-zinc-500">
                Showing <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredDtrs.length}</span> record(s)
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-4">Student ID / Course</th>
                    <th className="py-3 px-4">Week Period</th>
                    <th className="py-3 px-4">Rendered Hours</th>
                    <th className="py-3 px-4">Date Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredDtrs.map(d => (
                    <tr
                      key={d.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                            {d.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{d.studentName}</p>
                            <p className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">{d.course} · Week {d.weekNumber} DTR</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        <div>{d.studentId}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{d.course}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        <div>Week {d.weekNumber}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{d.dateRange}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {d.totalHours} hrs
                      </td>
                      <td className="py-3.5 px-5 text-xs text-zinc-500 font-normal">
                        {d.submittedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={d.status === 'Approved' ? 'success' : d.status === 'Returned' ? 'error' : 'warning'}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenReview(d.id)}
                          icon={<Eye size={13} />}
                          className="text-xs px-3 py-1.5 h-8 font-bold"
                        >
                          Verify DTR
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredDtrs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400 font-medium">
                        No DTR submissions found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DETAILED DTR VERIFICATION WORKSPACE */}
      {viewMode === 'review' && selectedDtr && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Log breakdown (9 cols - matching WeeklyJournalReview) */}
          <div className="lg:col-span-9 space-y-6">
            <Card 
              title={`${selectedDtr.studentName} - Week ${selectedDtr.weekNumber} Logs`}
              subtitle={selectedDtr.dateRange}
              action={
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadExcel}
                    title="Click to export & download DTR Excel Spreadsheet (.xlsx)"
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs group"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>Export DTR Excel (.xlsx)</span>
                  </button>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    Total: {selectedDtr.totalHours} hrs
                  </span>
                  <Badge variant={selectedDtr.status === 'Approved' ? 'success' : selectedDtr.status === 'Returned' ? 'error' : 'warning'}>
                    {selectedDtr.status}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Saved Signature Active Banner */}
                {savedSignature ? (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <img src={savedSignature} alt="Saved Signature Preview" className="h-5 max-w-full object-contain dark:invert" />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Saved Signature Active</span>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1">
                            <Sparkles size={9} /> 1-Click Active
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          Click "Apply Signature" on any work row to sign. Double-click to remove signature.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5 font-semibold text-zinc-600 dark:text-zinc-300"
                        icon={<RotateCcw size={11} />}
                        onClick={() => handleOpenSignatureModal()}
                      >
                        Redraw
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold">
                        <PenTool size={13} />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">No Signature Created Yet</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Draw your signature once to save and use for 1-click day verification.</p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs h-7 px-2.5 font-bold shrink-0"
                      onClick={() => handleOpenSignatureModal()}
                    >
                      Create Signature
                    </Button>
                  </div>
                )}

                {/* Right-Sized Table of Daily Logs */}
                <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                        <th className="px-3.5 py-2.5">Day / Date</th>
                        <th className="px-2.5 py-2.5 text-center">Day Status</th>
                        <th className="px-2.5 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <span>Time In</span>
                            <Edit3 size={10} className="text-zinc-400" />
                          </div>
                        </th>
                        <th className="px-2.5 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <span>Time Out</span>
                            <Edit3 size={10} className="text-zinc-400" />
                          </div>
                        </th>
                        <th className="px-2.5 py-2.5 text-center">Hours</th>
                        <th className="px-3.5 py-2.5 text-center">Supervisor Signature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {selectedDtr.logs.map((log, idx) => (
                        <tr 
                          key={idx} 
                          className={cn(
                            "h-13 transition-colors",
                            log.isDayOff ? "bg-zinc-50/50 dark:bg-zinc-900/30 opacity-75" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                          )}
                        >
                          {/* 1. Day / Date */}
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{log.day}</div>
                            <div className="text-[10px] text-zinc-400 font-normal">{log.date}</div>
                          </td>

                          {/* 2. Day Status Toggle Pill (Right Sized w-24 h-7) */}
                          <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDayStatusToggle(idx)}
                              title="Click to toggle Work / Not Work status"
                              className={cn(
                                "w-24 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer border inline-flex items-center justify-center gap-1 select-none shrink-0",
                                !log.isDayOff
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-2xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              )}
                            >
                              {!log.isDayOff ? (
                                <>
                                  <Check size={11} />
                                  <span>Work Day</span>
                                </>
                              ) : (
                                <>
                                  <Coffee size={11} className="text-zinc-400" />
                                  <span>Not Work</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* 3. Time In */}
                          <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                            {!log.isDayOff ? (
                              <input
                                type="text"
                                value={log.timeIn}
                                onChange={(e) => handleTimeChange(idx, 'timeIn', e.target.value)}
                                className="w-20 text-center px-1.5 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary transition-colors"
                              />
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic font-medium">OFF</span>
                            )}
                          </td>

                          {/* 4. Time Out */}
                          <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                            {!log.isDayOff ? (
                              <input
                                type="text"
                                value={log.timeOut}
                                onChange={(e) => handleTimeChange(idx, 'timeOut', e.target.value)}
                                className="w-20 text-center px-1.5 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary transition-colors"
                              />
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic font-medium">OFF</span>
                            )}
                          </td>

                          {/* 5. Hours */}
                          <td className="px-2.5 py-2.5 text-center whitespace-nowrap font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {log.hours}
                          </td>

                          {/* 6. Supervisor Signature (Right Sized w-32 h-9, Crisp & Visible) */}
                          <td 
                            className="px-3.5 py-2.5 text-center whitespace-nowrap cursor-pointer select-none"
                            onClick={() => handleCellClick(idx)}
                            onDoubleClick={() => handleCellDoubleClick(idx)}
                            title={log.signatureUrl ? "Double-click to remove signature" : "Click to apply supervisor signature"}
                          >
                            <div className="flex justify-center items-center">
                              {log.signatureUrl ? (
                                <div className="w-32 h-9 inline-flex flex-col items-center justify-center p-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg shadow-2xs group relative">
                                  <img 
                                    src={log.signatureUrl} 
                                    alt="Supervisor Signature" 
                                    className="h-4 max-w-[85px] object-contain dark:invert" 
                                  />
                                  <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 leading-none mt-0.5">
                                    <Check size={8} /> Verified {log.day}
                                  </span>
                                </div>
                              ) : log.isDayOff ? (
                                <div className="w-32 h-9 flex items-center justify-center">
                                  <span className="text-[10px] text-zinc-400 italic">N/A (Not Work)</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="w-32 h-9 rounded-lg text-[10px] font-semibold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-dashed border-zinc-300 dark:border-zinc-700 transition-colors inline-flex flex-col items-center justify-center leading-tight shadow-2xs cursor-pointer"
                                >
                                  <div className="flex items-center gap-1 font-bold text-[10px] text-zinc-800 dark:text-zinc-200">
                                    <Sparkles size={10} className="text-zinc-500" />
                                    <span>Click to Apply</span>
                                  </div>
                                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">Signature</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side: Verification Sidebar (3 cols - matching WeeklyJournalReview) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Student Switcher Card */}
            <Card title="Student DTR Select">
              <div className="space-y-2">
                {dtrs.map(dtr => (
                  <button
                    key={dtr.id}
                    onClick={() => setSelectedDtrId(dtr.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                      selectedDtrId === dtr.id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs"
                        : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="space-y-0.5 min-w-0 pr-1.5">
                      <p className="text-xs font-bold truncate">{dtr.studentName}</p>
                      <p className={cn("text-[10px] truncate font-normal", selectedDtrId === dtr.id ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400")}>
                        {dtr.course} · Week {dtr.weekNumber}
                      </p>
                    </div>
                    <Badge 
                      variant={dtr.status === 'Approved' ? 'success' : dtr.status === 'Returned' ? 'error' : 'warning'}
                      className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0"
                    >
                      {dtr.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* Supervisor Remarks Card */}
            <Card title="Supervisor Verification Remarks">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                    Remarks / Revision Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide specific feedback..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-[11px] outline-none focus:border-primary transition-colors text-zinc-800 dark:text-zinc-200 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Action Toolbar - Compact Equal Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="w-1/2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 text-[11px] h-8 justify-center font-bold"
                    icon={<X size={12} />}
                    onClick={handleRejectSubmit}
                  >
                    Return DTR
                  </Button>
                  <Button 
                    variant="primary"
                    className="w-1/2 text-[11px] h-8 justify-center font-bold gap-1 px-1"
                    icon={<Send size={12} />}
                    onClick={() => handleApprove(selectedDtr.id)}
                  >
                    Approve
                  </Button>
                </div>

                {/* Remarks History */}
                {selectedDtr?.remarksHistory && selectedDtr.remarksHistory.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={11} /> Remarks History
                    </h4>
                    <div className="space-y-1.5">
                      {selectedDtr.remarksHistory.map((rem, idx) => (
                        <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg space-y-0.5">
                          <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400">
                            <span>{rem.role} Comment</span>
                            <span>{rem.date}</span>
                          </div>
                          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium italic">"{rem.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Interactive Signature Canvas Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold">
                  <FileSignature size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {savedSignature ? 'Update Saved Signature' : 'Create Saved Supervisor Signature'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Draw your signature once to use for 1-click verification.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowSignatureModal(false); setTargetLogIndex(null); }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Canvas Box */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Draw signature on pad below</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-zinc-500 hover:text-primary transition-colors cursor-pointer"
                >
                  <RotateCcw size={10} /> Clear Pad
                </button>
              </div>

              <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={160}
                  className="w-full h-40 touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-300 dark:text-zinc-700 text-xs font-semibold italic">
                    Use mouse or touch to draw signature...
                  </div>
                )}
              </div>
            </div>

            {/* Buttons: Cancel & Confirm */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button 
                variant="outline" 
                onClick={() => { setShowSignatureModal(false); setTargetLogIndex(null); }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleConfirmSignature}
                icon={<Check size={14} />}
              >
                Save Signature
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Remove Signature on Double-Click */}
      {removeSignatureTargetIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 shadow-2xs">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Remove Signature?
                  </h3>
                  <p className="text-[11px] font-medium text-zinc-400">Supervisor Signature Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setRemoveSignatureTargetIndex(null)}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Details Highlight Card */}
            <div className="p-3.5 bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-500">Target Day Log:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <Calendar size={12} className="text-zinc-400" />
                  {selectedDtr.logs[removeSignatureTargetIndex]?.day} ({selectedDtr.logs[removeSignatureTargetIndex]?.date})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2">
                <span className="font-medium text-zinc-500">Student Name:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedDtr.studentName}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Removing the supervisor signature will clear verification for this specific day. You can re-apply your signature anytime with 1-click.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <Button 
                variant="outline" 
                className="w-1/2 text-xs font-semibold h-9 justify-center text-zinc-600 dark:text-zinc-300 rounded-xl"
                onClick={() => setRemoveSignatureTargetIndex(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="w-1/2 text-xs h-9 font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-none shadow-xs hover:opacity-90 justify-center rounded-xl"
                onClick={handleConfirmRemoveSignature}
                icon={<Trash2 size={13} />}
              >
                Remove Signature
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
