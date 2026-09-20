/**
 * DocumentReviewCenter.tsx
 * Shared Centralized Document Review Center workspace for Student, Supervisor,
 * Adviser, and Admin roles.
 *
 * Aligned with STI Practicum System Design:
 * - Top Metrics Strip (Total Cases, Under Review, Revisions Needed, Approved)
 * - 3-Card Workspace Architecture (Inbox, Preview, Details & Conversation)
 * - Matching Student Dashboard card styles, borders, and spacing
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Send,
  Upload,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  User,
  ArrowRight,
  FolderOpen,
  FileCheck,
  Loader2,
  X,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmbedPdfWorkspace } from '@/src/components/review/EmbedPdfWorkspace';
import { useAuth } from '@/src/contexts/AuthContext';
import { Role } from '@/src/types';
import {
  ReviewCase,
  ReviewCaseDetails,
  ReviewInboxFilter,
  ReviewDecision,
  ReviewStage,
} from '@/src/types/documentReview';
import { documentReviewService } from '@/src/lib/documentReviewService';
import { validateDocumentUpload, formatDocumentFileSize } from '@/src/config/documentUploadPolicy';
import { getSupervisorSignature } from '@/src/lib/signatureStorage';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

interface DocumentReviewCenterProps {
  role: Role;
  baseRoute: string;
}

export const DocumentReviewCenter: React.FC<DocumentReviewCenterProps> = ({ role, baseRoute }) => {
  const { id: routeCaseId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Inbox State ──
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(routeCaseId || null);
  const [filter, setFilter] = useState<ReviewInboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  // ── Active Case Detail State ──
  const [caseDetails, setCaseDetails] = useState<ReviewCaseDetails | null>(null);
  const [selectedRevisionNumber, setSelectedRevisionNumber] = useState<number>(1);
  const [activeFileUrl, setActiveFileUrl] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // ── Mobile/Tablet Tab State ──
  const [activeMobileTab, setActiveMobileTab] = useState<'inbox' | 'preview' | 'conversation'>('inbox');

  // ── Conversation & Decision State ──
  const [activeDetailsTab, setActiveDetailsTab] = useState<'comments' | 'audit'>('comments');
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // ── Student Revision Upload State ──
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  // ── Metrics Calculation ──
  const pendingCount = useMemo(() => {
    return cases.filter((c) =>
      c.stage === 'submitted_to_supervisor' ||
      c.stage === 'submitted_to_adviser' ||
      c.stage === 'supervisor_approved'
    ).length;
  }, [cases]);

  const revisionCount = useMemo(() => {
    return cases.filter((c) =>
      c.stage === 'supervisor_revision_required' ||
      c.stage === 'adviser_revision_required' ||
      c.stage === 'returned'
    ).length;
  }, [cases]);

  const approvedCount = useMemo(() => {
    return cases.filter((c) => c.stage === 'approved').length;
  }, [cases]);

  // ── Load Inbox Cases ──
  const loadInbox = async () => {
    setIsLoadingCases(true);
    try {
      const list = await documentReviewService.listCases(role, filter, searchQuery);
      setCases(list);
      if (!selectedCaseId && list.length > 0) {
        setSelectedCaseId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load inbox cases:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    void loadInbox();
  }, [role, filter]);

  // Sync route param
  useEffect(() => {
    if (routeCaseId && routeCaseId !== selectedCaseId) {
      setSelectedCaseId(routeCaseId);
    }
  }, [routeCaseId]);

  // ── Load Active Case Details ──
  useEffect(() => {
    if (!selectedCaseId) {
      setCaseDetails(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    const fetchDetails = async () => {
      try {
        const details = await documentReviewService.getCaseDetails(selectedCaseId);
        if (!isMounted) return;
        setCaseDetails(details);

        if (details && details.revisions.length > 0) {
          const currentRev = details.revisions[0];
          setSelectedRevisionNumber(currentRev.revision_number);
          const url = await documentReviewService.getFileUrl(currentRev.file_path);
          if (isMounted) setActiveFileUrl(url);
        } else {
          setActiveFileUrl('');
        }
      } catch (err) {
        console.error('Failed to load case details:', err);
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    };

    void fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedCaseId]);

  // ── Switch Active Revision Preview ──
  const handleSelectRevision = async (revNumber: number) => {
    setSelectedRevisionNumber(revNumber);
    const targetRev = caseDetails?.revisions.find((r) => r.revision_number === revNumber);
    if (targetRev) {
      try {
        const url = await documentReviewService.getFileUrl(targetRev.file_path);
        setActiveFileUrl(url);
      } catch (err) {
        toast.error('Could not load file for this revision.');
      }
    }
  };

  // ── Select Case from Inbox ──
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    navigate(`${baseRoute}/${caseId}`);
    setActiveMobileTab('preview');
  };

  // ── Post Comment ──
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !commentText.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      const activeRev = caseDetails?.revisions.find((r) => r.revision_number === selectedRevisionNumber);
      await documentReviewService.addComment(
        selectedCaseId,
        commentText.trim(),
        activeRev?.id
      );
      toast.success('Comment posted.');
      setCommentText('');
      const updated = await documentReviewService.getCaseDetails(selectedCaseId);
      setCaseDetails(updated);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // ── Review Decision (Approve / Request Revision) ──
  const handleDecision = async (decision: ReviewDecision) => {
    if (!selectedCaseId || !caseDetails || isSubmittingDecision) return;

    const isRevision = decision.includes('request_revision');
    if (isRevision && !decisionRemarks.trim()) {
      toast.error('Please specify feedback remarks when requesting revisions.');
      return;
    }

    setIsSubmittingDecision(true);
    try {
      let sigBlob: Blob | undefined;
      if (role === 'supervisor' && decision === 'supervisor_approve') {
        const sigUrl = getSupervisorSignature(user?.id);
        if (sigUrl) {
          const res = await fetch(sigUrl);
          sigBlob = await res.blob();
        }
      }

      await documentReviewService.submitDecision(
        selectedCaseId,
        caseDetails.caseRecord.stage,
        decision,
        decisionRemarks.trim(),
        sigBlob
      );

      toast.success(
        decision.includes('approve')
          ? 'Document review approved!'
          : 'Revision requested from student.'
      );
      setDecisionRemarks('');

      const updated = await documentReviewService.getCaseDetails(selectedCaseId);
      setCaseDetails(updated);
      void loadInbox();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // ── Student Revision Upload ──
  const handleUploadRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = revisionFileInputRef.current?.files?.[0];
    if (!file || !selectedCaseId || !caseDetails) {
      toast.error('Please choose a file to upload.');
      return;
    }

    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploadingRevision(true);
    try {
      const currentRevNumber = caseDetails.caseRecord.current_revision_number || 1;
      await documentReviewService.uploadRevision(
        selectedCaseId,
        currentRevNumber,
        file,
        revisionRemarks.trim() || undefined
      );

      toast.success(`Revision ${currentRevNumber + 1} uploaded successfully!`);
      setShowRevisionModal(false);
      setRevisionRemarks('');
      if (revisionFileInputRef.current) revisionFileInputRef.current.value = '';

      const updated = await documentReviewService.getCaseDetails(selectedCaseId);
      setCaseDetails(updated);
      void loadInbox();
    } catch (err: any) {
      toast.error(err?.message || 'Revision upload failed.');
    } finally {
      setIsUploadingRevision(false);
    }
  };

  // Helper stage badges
  const getStageBadge = (stage: ReviewStage) => {
    switch (stage) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> Approved
          </span>
        );
      case 'supervisor_approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ShieldCheck className="w-3 h-3 shrink-0" /> Supervisor Approved
          </span>
        );
      case 'submitted_to_supervisor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 shrink-0" /> Needs Supervisor
          </span>
        );
      case 'submitted_to_adviser':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3 shrink-0" /> Needs Adviser
          </span>
        );
      case 'supervisor_revision_required':
      case 'adviser_revision_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3 shrink-0" /> Revision Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {stage}
          </span>
        );
    }
  };

  const activeRevision = caseDetails?.revisions.find((r) => r.revision_number === selectedRevisionNumber);

  return (
    <div className="space-y-5 pb-12">
      {/* ── 1. Header (Aligned with Student Dashboard) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Document Review Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80">
              {role} Portal
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
            <span>Student ID: <strong className="text-foreground">{user?.studentId || user?.id?.substring(0, 8) || '2023-010482'}</strong></span>
            <span>·</span>
            <span>Program: <strong className="text-foreground">{user?.course || 'BSIT 402'}</strong></span>
            <span>·</span>
            <span>Section: <strong className="text-foreground">{user?.section || 'BSIT 402'}</strong></span>
            <span>·</span>
            <span>Submissions: <strong className="text-foreground">{cases.length} Review Cases</strong></span>
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => { void loadInbox(); }}
            disabled={isLoadingCases}
            title="Refresh review cases"
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw size={14} className={cn(isLoadingCases && "animate-spin text-primary")} />
          </button>

          {role === 'student' && (
            <button
              type="button"
              onClick={() => navigate('/student/documents')}
              className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <FolderOpen size={14} className="text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">Document Repository</span>
              <ArrowRight size={12} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Top Pulse Metrics Strip: 4 Sleek Stat Cards (Exact Dashboard Pattern) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Total Review Cases */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Submissions
            </span>
            <FileText size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">{cases.length}</h3>
              <span className="text-xs text-muted-foreground font-medium">Cases</span>
              <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                Tracked
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {cases.length > 0 ? `${cases.length} review entities active` : 'No submissions recorded'}
            </p>
          </div>
        </div>

        {/* Stat 2: In Review */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Under Review
            </span>
            <Clock size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">{pendingCount}</h3>
              <span className="text-xs text-muted-foreground font-medium">Pending</span>
              <span className={cn(
                "ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded",
                pendingCount > 0
                  ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              )}>
                {pendingCount > 0 ? 'Evaluating' : 'Up to Date'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              Awaiting adviser or supervisor clearance
            </p>
          </div>
        </div>

        {/* Stat 3: Revisions Required */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Revisions Required
            </span>
            <AlertTriangle size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">{revisionCount}</h3>
              <span className="text-xs text-muted-foreground font-medium">Action</span>
              <span className={cn(
                "ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded",
                revisionCount > 0
                  ? "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              )}>
                {revisionCount > 0 ? 'Requires Update' : 'All Clear'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {revisionCount > 0 ? 'Reviewer feedback pending action' : 'No revisions currently pending'}
            </p>
          </div>
        </div>

        {/* Stat 4: Approved */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Verified & Cleared
            </span>
            <ShieldCheck size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">{approvedCount}</h3>
              <span className="text-xs text-muted-foreground font-medium">Approved</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                Verified
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              Cleared institutional endorsements
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile Tab Navigation (< lg) ── */}
      <div className="lg:hidden flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setActiveMobileTab('inbox')}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
            activeMobileTab === 'inbox'
              ? "bg-white dark:bg-zinc-950 text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Inbox ({cases.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('preview')}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
            activeMobileTab === 'preview'
              ? "bg-white dark:bg-zinc-950 text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Document Preview
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('conversation')}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
            activeMobileTab === 'conversation'
              ? "bg-white dark:bg-zinc-950 text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Review Details
        </button>
      </div>

      {/* ── 3. Main Review Workspace: 3 Dedicated Cards with System Spacing (gap-5) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ════════════════════════════════════════════════════════════════
            CARD 1: REVIEW INBOX (lg:col-span-4 xl:col-span-3)
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "lg:col-span-4 xl:col-span-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xs flex flex-col h-[740px] overflow-hidden",
            activeMobileTab !== 'inbox' && "hidden lg:flex"
          )}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 space-y-3 bg-zinc-50/60 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Inbox size={13} className="text-primary" />
                Review Inbox
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {cases.length} {cases.length === 1 ? 'case' : 'cases'}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents or students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void loadInbox(); }}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); void loadInbox(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs (Matching Dashboard Phase Tabs) */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-1 rounded-xl">
              {[
                { key: 'all', label: 'All' },
                { key: 'needs_action', label: 'In Review' },
                { key: 'revision_required', label: 'Revisions' },
                { key: 'approved', label: 'Approved' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as ReviewInboxFilter)}
                  className={cn(
                    "flex-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg shrink-0 transition-all text-center cursor-pointer",
                    filter === key
                      ? "bg-white dark:bg-zinc-950 text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {isLoadingCases ? (
              <div className="p-10 flex flex-col items-center justify-center gap-2.5 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading inbox cases…</span>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3 h-full">
                <div className="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center text-muted-foreground">
                  <Inbox className="w-6 h-6 opacity-60" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">No review cases found</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                    {filter === 'all'
                      ? 'Cases will appear here once official documents are submitted.'
                      : `No cases match the "${filter.replace('_', ' ')}" filter.`}
                  </p>
                </div>
                {role === 'student' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/student/documents')}
                    className="text-xs h-7 gap-1 mt-1 rounded-lg"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>View Repository</span>
                  </Button>
                )}
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative select-none",
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-primary/60 dark:border-primary/60 shadow-2xs"
                        : "bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 border-zinc-200/60 dark:border-zinc-800/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                          <FileText size={14} />
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">
                          {c.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-muted-foreground shrink-0 border border-zinc-200/80 dark:border-zinc-700/80">
                        Rev {c.current_revision_number || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-9">
                      <User size={12} className="opacity-70 shrink-0" />
                      <span className="truncate font-medium">{c.student_name}</span>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{c.student_course}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40">
                      {getStageBadge(c.stage)}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            CARD 2: DOCUMENT PREVIEW (lg:col-span-5 xl:col-span-6)
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "lg:col-span-5 xl:col-span-6 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xs flex flex-col h-[740px] overflow-hidden",
            activeMobileTab !== 'preview' && "hidden lg:flex"
          )}
        >
          {isLoadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">Loading document preview…</span>
            </div>
          ) : !caseDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/30 dark:bg-zinc-900/20">
              <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-2xs">
                <FileCheck size={28} />
              </div>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Document Preview
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                Select a document from the inbox to preview its content and track revisions.
              </p>
            </div>
          ) : (
            <>
              {/* Revision Selector Bar */}
              <div className="p-3 bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px] shrink-0">
                    Revisions:
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {caseDetails.revisions.map((rev) => {
                      const isSelected = rev.revision_number === selectedRevisionNumber;
                      const isLatest = rev.revision_number === caseDetails.caseRecord.current_revision_number;
                      return (
                        <button
                          key={rev.id}
                          type="button"
                          onClick={() => void handleSelectRevision(rev.revision_number)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-fg shadow-2xs"
                              : "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground border border-zinc-200/80 dark:border-zinc-800/80"
                          )}
                        >
                          <span>Rev {rev.revision_number}</span>
                          {isLatest && (
                            <span className={cn(
                              "text-[9px] px-1 rounded font-bold uppercase",
                              isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                            )}>
                              Latest
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeFileUrl && (
                    <a
                      href={activeFileUrl}
                      download={activeRevision?.original_filename || 'document.pdf'}
                      className="bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Download official file copy"
                    >
                      <Download size={13} className="text-muted-foreground" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Document Canvas Preview */}
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-950/60 overflow-hidden relative">
                {activeFileUrl ? (
                  <EmbedPdfWorkspace
                    pdfUrl={activeFileUrl}
                    studentName={caseDetails.caseRecord.student_name}
                    docTitle={caseDetails.caseRecord.title}
                    readOnly={true}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground">Document file not available for this revision</p>
                  </div>
                )}
              </div>

              {/* Bottom Metadata Strip */}
              {activeRevision && (
                <div className="p-2.5 bg-zinc-50/70 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-muted-foreground flex items-center justify-between shrink-0 font-mono">
                  <span className="truncate max-w-[240px] font-medium" title={activeRevision.original_filename}>
                    {activeRevision.original_filename}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>{formatDocumentFileSize(activeRevision.byte_size || 0)}</span>
                    <span>·</span>
                    <span>{new Date(activeRevision.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            CARD 3: REVIEW DETAILS & CONVERSATION (lg:col-span-3 xl:col-span-3)
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "lg:col-span-3 xl:col-span-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xs flex flex-col h-[740px] overflow-hidden",
            activeMobileTab !== 'conversation' && "hidden lg:flex"
          )}
        >
          {caseDetails ? (
            <>
              {/* Review Case Header */}
              <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0 space-y-2.5 bg-zinc-50/60 dark:bg-zinc-900/40">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
                    {caseDetails.caseRecord.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getStageBadge(caseDetails.caseRecord.stage)}
                  <span className="text-[11px] text-muted-foreground">
                    Route: <span className="font-semibold text-foreground">{caseDetails.caseRecord.review_route === 'supervisor_then_adviser' ? 'Supervisor → Adviser' : 'Adviser Only'}</span>
                  </span>
                </div>

                {/* Submitter details card */}
                <div className="text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 p-2.5 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-semibold text-foreground">{caseDetails.caseRecord.student_name}</span>
                  </div>
                  {caseDetails.caseRecord.assigned_supervisor_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Supervisor:</span>
                      <span className="font-medium text-foreground">{caseDetails.caseRecord.assigned_supervisor_name}</span>
                    </div>
                  )}
                  {caseDetails.caseRecord.assigned_adviser_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Adviser:</span>
                      <span className="font-medium text-foreground">{caseDetails.caseRecord.assigned_adviser_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Action Bar (Role-Specific) */}
              <div className="p-3 bg-zinc-50/30 dark:bg-zinc-900/20 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                {/* Supervisor Actions */}
                {role === 'supervisor' && caseDetails.caseRecord.stage === 'submitted_to_supervisor' && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Enter review remarks or required revisions…"
                      value={decisionRemarks}
                      onChange={(e) => setDecisionRemarks(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision('supervisor_approve')}
                        disabled={isSubmittingDecision}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer font-bold rounded-lg"
                      >
                        Approve & Forward
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDecision('supervisor_request_revision')}
                        disabled={isSubmittingDecision || !decisionRemarks.trim()}
                        className="text-xs h-8 cursor-pointer font-bold rounded-lg"
                      >
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {/* Adviser Actions */}
                {role === 'adviser' && caseDetails.caseRecord.stage === 'submitted_to_adviser' && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Enter review remarks or required revisions…"
                      value={decisionRemarks}
                      onChange={(e) => setDecisionRemarks(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision('adviser_approve')}
                        disabled={isSubmittingDecision}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer font-bold rounded-lg"
                      >
                        Final Institutional Approval
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDecision('adviser_request_revision')}
                        disabled={isSubmittingDecision || !decisionRemarks.trim()}
                        className="text-xs h-8 cursor-pointer font-bold rounded-lg"
                      >
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {/* Student Actions */}
                {role === 'student' && (caseDetails.caseRecord.stage === 'supervisor_revision_required' || caseDetails.caseRecord.stage === 'adviser_revision_required') && (
                  <div className="flex flex-col gap-2 p-1">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Action Required: Revision requested by reviewer</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowRevisionModal(true)}
                      className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-fg cursor-pointer font-bold rounded-lg w-full"
                    >
                      <Upload size={13} />
                      Submit Revised Document
                    </Button>
                  </div>
                )}

                {/* Approved Status Notice */}
                {caseDetails.caseRecord.stage === 'approved' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold py-1">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>This document has received final institutional approval.</span>
                  </div>
                )}
              </div>

              {/* Tab Selector: Discussion vs Audit Trail */}
              <div className="px-4 pt-3 pb-1 flex items-center gap-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('comments')}
                  className={cn(
                    "text-xs font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                    activeDetailsTab === 'comments'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare size={13} />
                  <span>Discussion</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                    {caseDetails.comments.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('audit')}
                  className={cn(
                    "text-xs font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                    activeDetailsTab === 'audit'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock size={13} />
                  <span>Audit Trail</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                    {caseDetails.events.length}
                  </span>
                </button>
              </div>

              {/* Discussion & Audit Content Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {activeDetailsTab === 'comments' ? (
                  caseDetails.comments.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                      <MessageSquare className="w-8 h-8 text-muted-foreground opacity-40" />
                      <p className="text-xs font-bold text-foreground">No discussion comments yet</p>
                      <p className="text-[11px] text-muted-foreground max-w-[220px]">
                        Type a message below to leave notes for your adviser or supervisor.
                      </p>
                    </div>
                  ) : (
                    caseDetails.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 text-xs space-y-1.5 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            {comment.author_name}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize border border-primary/20">
                              {comment.author_role}
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-[11px]">
                          {comment.message}
                        </p>
                      </div>
                    ))
                  )
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Audit Trail
                    </span>
                    {caseDetails.events.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No audit events recorded yet
                      </div>
                    ) : (
                      caseDetails.events.map((event) => (
                        <div key={event.id} className="flex items-start gap-2.5 text-xs p-2 rounded-xl bg-zinc-50/40 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60">
                          <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Clock size={11} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-foreground truncate">{event.actor_name}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                {new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {event.remarks || event.action}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Comment Input Footer */}
              <form onSubmit={handlePostComment} className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type a note or reply…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || isPostingComment}
                  className="h-8 px-3 text-xs gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-fg font-bold rounded-lg shrink-0"
                >
                  <Send size={13} />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3 bg-zinc-50/30 dark:bg-zinc-900/20">
              <div className="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center text-muted-foreground">
                <MessageSquare size={22} className="opacity-60" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Review Details</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto leading-relaxed">
                  Select a document from the inbox to view reviewer feedback and submit revisions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Revision Upload Modal (Student only) ── */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Upload Revised Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select File (PDF, DOCX, XLSX — max 10MB)
                </label>
                <input
                  type="file"
                  ref={revisionFileInputRef}
                  accept=".pdf,.docx,.xlsx"
                  required
                  className="w-full text-xs text-muted-foreground file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/90 cursor-pointer border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2 bg-zinc-50 dark:bg-zinc-900/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Revision Notes (Optional)
                </label>
                <textarea
                  placeholder="Explain what changes were made according to the reviewer's feedback…"
                  value={revisionRemarks}
                  onChange={(e) => setRevisionRemarks(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevisionModal(false)}
                  className="text-xs h-8 cursor-pointer rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploadingRevision}
                  className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-fg cursor-pointer font-bold rounded-lg"
                >
                  {isUploadingRevision ? 'Uploading…' : 'Submit Revision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentReviewCenter;
