import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmbedPdfWorkspace } from '@/src/components/review/EmbedPdfWorkspace';
import { toast } from 'sonner';
import {
  Send,
  Download,
  Upload,
  BookOpen,
  Clock,
  RefreshCw,
  FileCheck,
  Search,
  ArrowLeft,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSignature,
  RotateCcw,
  Sparkles,
  Check,
  X,
  PenTool
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface JournalSubmission {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  milestone: 'Prelim' | 'Midterm' | 'Pre-Finals' | 'Finals';
  period: string;
  hoursLogged: number;
  submittedDate: string;
  status: 'Pending Review' | 'Approved' | 'Revision Required';
  pdfUrl: string;
  supervisorRemarks?: string;
  reviewedPdfUrl?: string;
  signatureUrl?: string;
}

const mockJournalSubmissions: JournalSubmission[] = [
  {
    id: 'j-1',
    studentName: 'Maria Santos',
    studentId: '2023-01042',
    course: 'BSIT 402',
    milestone: 'Prelim',
    period: 'Week 1 - Week 4',
    hoursLogged: 120,
    submittedDate: 'Jul 20, 2026',
    status: 'Pending Review',
    pdfUrl: '/templates/FT-CRD-167-00 Weekly Journal Template.pdf',
    supervisorRemarks: ''
  },
  {
    id: 'j-1-m',
    studentName: 'Maria Santos',
    studentId: '2023-01042',
    course: 'BSIT 402',
    milestone: 'Midterm',
    period: 'Week 5 - Week 8',
    hoursLogged: 120,
    submittedDate: 'Jul 24, 2026',
    status: 'Pending Review',
    pdfUrl: '/templates/FT-CRD-167-00 Weekly Journal Template.pdf',
    supervisorRemarks: ''
  },
  {
    id: 'j-2',
    studentName: 'Alice Brown',
    studentId: '2023-01089',
    course: 'BSIT 401',
    milestone: 'Midterm',
    period: 'Week 5 - Week 8',
    hoursLogged: 120,
    submittedDate: 'Jul 22, 2026',
    status: 'Pending Review',
    pdfUrl: '/templates/FT-CRD-167-00 Weekly Journal Template.pdf',
    supervisorRemarks: ''
  },
  {
    id: 'j-3',
    studentName: 'John Smith',
    studentId: '2023-01125',
    course: 'BSIT 402',
    milestone: 'Prelim',
    period: 'Week 1 - Week 4',
    hoursLogged: 120,
    submittedDate: 'Jul 15, 2026',
    status: 'Approved',
    pdfUrl: '/templates/FT-CRD-167-00 Weekly Journal Template.pdf',
    supervisorRemarks: 'Well-documented daily entries and clear learning reflections. Approved.'
  }
];

export const WeeklyJournalReview: React.FC = () => {
  const [journals, setJournals] = useState<JournalSubmission[]>(mockJournalSubmissions);
  const [selectedId, setSelectedId] = useState<string>('j-1');
  const [viewMode, setViewMode] = useState<'table' | 'review'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistent Saved Signature Store (stored in localStorage)
  const [savedSignature, setSavedSignature] = useState<string | null>(() => {
    return localStorage.getItem('supervisor_saved_signature') || null;
  });
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Dynamic Height Measurement for Left Card to match Right Column bottom line
  const rightRef = useRef<HTMLDivElement>(null);
  const [rightHeight, setRightHeight] = useState<number>(0);

  const selectedJournal = journals.find(j => j.id === selectedId) || journals[0];

  const filteredJournals = journals.filter(j => {
    const matchesSearch = 
      j.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.course.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'pending') return j.status === 'Pending Review';
    if (activeTab === 'approved') return j.status === 'Approved' || j.status === 'Revision Required';
    return true;
  });

  // Filter submissions for the currently selected student ONLY during inspection mode
  const currentStudentSubmissions = journals.filter(j => j.studentId === selectedJournal.studentId);

  useLayoutEffect(() => {
    if (viewMode !== 'review' || !rightRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target) {
          setRightHeight(entry.target.clientHeight);
        }
      }
    });
    observer.observe(rightRef.current);
    return () => observer.disconnect();
  }, [viewMode, selectedId, activeTab, uploadedFile, currentStudentSubmissions.length, savedSignature, journals]);

  // Signature canvas setup
  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showSignatureModal]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
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
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
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

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast.error('Please draw a signature before saving.');
      return;
    }
    const signatureUrl = canvas.toDataURL('image/png');

    try {
      localStorage.setItem('supervisor_saved_signature', signatureUrl);
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
    setSavedSignature(signatureUrl);

    setJournals(prev => prev.map(j => {
      if (j.id === selectedId) {
        return { ...j, signatureUrl };
      }
      return j;
    }));

    toast.success(`Supervisor signature saved permanently! Attached to ${selectedJournal.studentName}'s journal.`);
    setShowSignatureModal(false);
    clearCanvas();
  };

  const handleApplySignatureToJournal = () => {
    if (!savedSignature) {
      setShowSignatureModal(true);
      setHasDrawn(false);
      return;
    }

    setJournals(prev => prev.map(j => {
      if (j.id === selectedId) {
        return { ...j, signatureUrl: savedSignature };
      }
      return j;
    }));

    toast.success(`Applied saved supervisor signature to ${selectedJournal.studentName}'s ${selectedJournal.milestone} Journal!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      toast.success(`Attached reviewed document: ${file.name}`);
    }
  };

  const handleReviewAction = (newStatus: 'Approved' | 'Revision Required') => {
    if (newStatus === 'Revision Required' && !remarks.trim()) {
      toast.error('Please enter revision instructions before returning to the student.');
      return;
    }

    const activeSignature = savedSignature || selectedJournal.signatureUrl;

    setJournals(prev =>
      prev.map(j => {
        if (j.id === selectedId) {
          return {
            ...j,
            status: newStatus,
            signatureUrl: newStatus === 'Approved' ? (j.signatureUrl || activeSignature || undefined) : j.signatureUrl,
            supervisorRemarks: remarks || (newStatus === 'Approved' ? 'Weekly journal reviewed and approved.' : remarks),
            reviewedPdfUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : j.reviewedPdfUrl
          };
        }
        return j;
      })
    );

    if (newStatus === 'Approved') {
      const attachedText = uploadedFile ? ' with signed/reviewed PDF attachment' : '';
      toast.success(`Approved weekly journal for ${selectedJournal.studentName}${attachedText} and returned to student.`);
    } else {
      toast.warning(`Requested revisions for ${selectedJournal.studentName}'s weekly journal.`);
    }

    setRemarks('');
    setUploadedFile(null);
  };

  const handleOpenReview = (id: string) => {
    const journal = journals.find(j => j.id === id);
    if (journal) {
      setSelectedId(id);
      setRemarks(journal.supervisorRemarks || '');
      setUploadedFile(null);
      setViewMode('review');
    }
  };

  const totalSubmissions = journals.length;
  const pendingCount = journals.filter(j => j.status === 'Pending Review').length;
  const approvedCount = journals.filter(j => j.status === 'Approved').length;

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
              <BookOpen className="w-5 h-5 text-primary" />
              Weekly Journal Verification
            </h1>
          </div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {viewMode === 'table' 
              ? 'Select an intern from the table below to inspect their submitted digitized PDF weekly journal and issue reviews.'
              : `Reviewing digitized PDF weekly learning log for ${selectedJournal.studentName}.`}
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
              className="text-xs font-semibold"
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
                    "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                    activeTab === tab
                      ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  {tab === 'all' ? 'All Submissions' : tab === 'pending' ? 'Pending Review' : 'Completed'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: STUDENT SUBMISSIONS TABLE OVERVIEW */}
      {viewMode === 'table' && (
        <div className="space-y-6">
          {/* Default Theme Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Submissions</p>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{totalSubmissions}</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <FileText size={18} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending Review</p>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{pendingCount}</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <AlertCircle size={18} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Approved Reports</p>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{approvedCount}</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          {/* Search Bar & Submissions Table Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  placeholder="Search student name, ID, or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-primary transition-colors text-zinc-800 dark:text-zinc-200 font-normal"
                />
              </div>

              <div className="text-xs font-semibold text-zinc-500">
                Showing <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredJournals.length}</span> record(s)
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-4">Student ID / Course</th>
                    <th className="py-3 px-4">Milestone / Period</th>
                    <th className="py-3 px-4">Logged Hours</th>
                    <th className="py-3 px-4">Date Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredJournals.map(j => (
                    <tr
                      key={j.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                            {j.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{j.studentName}</p>
                            <p className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">{j.course} · {j.milestone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        <div>{j.studentId}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{j.course}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        <div>{j.milestone}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{j.period}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {j.hoursLogged} hrs
                      </td>
                      <td className="py-3.5 px-5 text-xs text-zinc-500 font-normal">
                        {j.submittedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={j.status === 'Approved' ? 'success' : j.status === 'Revision Required' ? 'error' : 'warning'}>
                          {j.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenReview(j.id)}
                          icon={<Eye size={13} />}
                          className="text-xs px-3 py-1.5 h-8 font-bold"
                        >
                          Review Journal
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredJournals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400 font-medium">
                        No journal submissions found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DIGITIZED PDF VERIFICATION WORKSPACE */}
      {viewMode === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: EmbedPDF Viewer Workspace Container */}
          <div className="lg:col-span-9 flex flex-col">
            <div 
              className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl flex flex-col shadow-xs overflow-hidden transition-[height] duration-150"
              style={rightHeight > 0 ? { height: `${rightHeight}px` } : undefined}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-3 border-b border-zinc-200/60 dark:border-zinc-800 shrink-0">
                <div>
                  <h3 className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Journal Preview: {selectedJournal.studentName} ({selectedJournal.milestone})
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                    Inspecting digitized PDF weekly journal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedJournal.pdfUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 text-xs font-bold transition-colors"
                  >
                    <Download size={13} /> Download PDF
                  </a>
                </div>
              </div>

              {/* EmbedPDF Workspace Canvas */}
              <div className="flex-1 w-full min-h-0 overflow-hidden relative bg-zinc-900">
                <EmbedPdfWorkspace
                  pdfUrl={selectedJournal.pdfUrl}
                  studentName={selectedJournal.studentName}
                  docTitle={selectedJournal.milestone}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Pipeline, Verification & Details */}
          <div ref={rightRef} className="lg:col-span-3 space-y-4">
            {/* 1. Supervisor Signature & Quick Verification Card */}
            <Card title="Supervisor Signature" subtitle="Attach e-signature to journal">
              <div className="space-y-3">
                {savedSignature || selectedJournal.signatureUrl ? (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles size={10} /> Active Supervisor Signature
                      </span>
                      <button
                        onClick={() => { setShowSignatureModal(true); setHasDrawn(false); }}
                        className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium underline"
                      >
                        Redraw
                      </button>
                    </div>
                    <div className="h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 flex items-center justify-center">
                      <img
                        src={selectedJournal.signatureUrl || savedSignature!}
                        alt="Supervisor Signature"
                        className="h-8 max-w-full object-contain dark:invert"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full text-xs h-7 justify-center font-bold"
                      icon={<Check size={12} />}
                      onClick={handleApplySignatureToJournal}
                    >
                      Attach Signature to Journal
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center space-y-2 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No Signature Saved</p>
                    <p className="text-[10px] text-zinc-400">Draw your signature once to use across all journal reviews.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-7 justify-center font-semibold"
                      icon={<PenTool size={12} />}
                      onClick={() => { setShowSignatureModal(true); setHasDrawn(false); }}
                    >
                      Draw Saved Signature
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* 2. Supervisor Verification & Feedback Card */}
            <Card title="Verification & Feedback">
              <div className="space-y-2.5">
                {/* Upload Reviewed / Signed PDF */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                    Attach Signed / Reviewed PDF
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs">
                      <div className="flex items-center gap-2 min-w-0 text-emerald-700 dark:text-emerald-300 font-medium">
                        <FileCheck size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate font-bold">{uploadedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group bg-zinc-50/50 dark:bg-zinc-950/50"
                    >
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                        <Upload size={16} className="text-zinc-500 dark:text-zinc-400" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-0.5">Upload Reviewed PDF</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2">PDF preferred · Max 10MB</p>
                      <Button variant="secondary" size="sm" className="h-6 text-[10px] px-3">Select File</Button>
                    </div>
                  )}
                </div>

                {/* Remarks Textarea */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                    Remarks / Revision Notes
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Enter notes for student..."
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-[11px] outline-none focus:border-primary transition-colors text-zinc-800 dark:text-zinc-200 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 justify-center text-[11px] px-2 py-1 h-8"
                    onClick={() => handleReviewAction('Approved')}
                    icon={<Send size={12} />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center text-[11px] px-2 py-1 h-8 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    onClick={() => handleReviewAction('Revision Required')}
                    icon={<RefreshCw size={12} />}
                  >
                    Revision
                  </Button>
                </div>
              </div>
            </Card>

            {/* 3. Student Submissions List (Filtered to Selected Student Only) */}
            <Card title={`${selectedJournal.studentName}'s Submissions`} subtitle={`${currentStudentSubmissions.length} record(s)`}>
              <div className="space-y-1.5">
                {currentStudentSubmissions.map(j => (
                  <div
                    key={j.id}
                    onClick={() => {
                      setSelectedId(j.id);
                      setRemarks(j.supervisorRemarks || '');
                      setUploadedFile(null);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative",
                      selectedId === j.id
                        ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white text-white dark:text-zinc-950 shadow-md"
                        : "bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0">
                        <h4 className={cn("text-xs font-bold tracking-tight truncate", selectedId === j.id ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100")}>
                          {j.studentName}
                        </h4>
                        <p className="text-[10px] font-medium opacity-70 truncate">
                          {j.course} · {j.milestone}
                        </p>
                      </div>
                      <Badge variant={j.status === 'Approved' ? 'success' : j.status === 'Revision Required' ? 'error' : 'warning'}>
                        {j.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-zinc-100/10 dark:border-zinc-800/30 opacity-80">
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {j.submittedDate}
                      </span>
                      <span className="font-bold">{j.hoursLogged}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Student & Milestone Details Card */}
            {selectedJournal && (
              <Card title="Submission Details">
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-medium">Student</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-right">{selectedJournal.studentName}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-medium">ID</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 text-right">{selectedJournal.studentId}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-medium">Period</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-right">{selectedJournal.milestone} ({selectedJournal.period})</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-medium">Hours</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedJournal.hoursLogged} Hours</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-zinc-500 font-medium">Submitted</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedJournal.submittedDate}</span>
                  </div>
                </div>
              </Card>
            )}
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
                    Draw your signature once to use for 1-click verification across weekly journals and DTRs.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSignatureModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
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
                onClick={() => setShowSignatureModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleConfirmSignature}
                icon={<Check size={14} />}
              >
                Save & Attach Signature
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
