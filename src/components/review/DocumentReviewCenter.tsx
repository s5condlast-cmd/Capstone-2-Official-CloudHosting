/**
 * DocumentReviewCenter.tsx
 * Shared Centralized Document Review Center workspace for Student, Supervisor,
 * Adviser, and Admin roles.
 *
 * 3-Column Layout:
 * 1. Review Inbox (Search, Filters: Needs Action, Waiting, Revision Required, Approved, All)
 * 2. Active File Preview (EmbedPdfWorkspace, Version selector, Metadata, Download)
 * 3. Conversation & History (Revision-anchored comments, Decision card, Activity timeline)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Send,
  Upload,
  RefreshCw,
  Eye,
  MessageSquare,
  ShieldCheck,
  History,
  ChevronDown,
  User,
  Paperclip,
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  Loader2,
  X,
  Building,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { EmbedPdfWorkspace } from '@/src/components/review/EmbedPdfWorkspace';
import { useAuth } from '@/src/contexts/AuthContext';
import { Role } from '@/src/types';
import {
  ReviewCase,
  ReviewCaseDetails,
  DocumentRevision,
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
  baseRoute: string; // e.g. '/student/reviews' or '/adviser/reviews'
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
  const [activeMobileTab, setActiveMobileTab] = useState<'preview' | 'conversation' | 'activity'>('preview');

  // ── Conversation & Decision State ──
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // ── Student Revision Upload State ──
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

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
      // Reload details to show comment
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
      // Optional signature for supervisor approval
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

      // Refresh data
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

      // Reload
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
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'supervisor_approved':
        return <Badge variant="warning" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"><ShieldCheck className="w-3 h-3" /> Supervisor Approved</Badge>;
      case 'submitted_to_supervisor':
        return <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300"><Clock className="w-3 h-3" /> Needs Supervisor Review</Badge>;
      case 'submitted_to_adviser':
        return <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300"><Clock className="w-3 h-3" /> Needs Adviser Review</Badge>;
      case 'supervisor_revision_required':
      case 'adviser_revision_required':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Revision Required</Badge>;
      default:
        return <Badge variant="secondary">{stage}</Badge>;
    }
  };

  const activeRevision = caseDetails?.revisions.find((r) => r.revision_number === selectedRevisionNumber);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Top Header ── */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Document Review Center
          </h1>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize font-medium">
            {role} Portal
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { void loadInbox(); }}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingCases && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── 3-Column Main Workspace ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ════════════════════════════════════════════════════════════════
            COLUMN 1: INBOX (lg:col-span-3)
            ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents or students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void loadInbox(); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-0.5 no-scrollbar">
              {(['all', 'needs_action', 'waiting', 'revision_required', 'approved'] as ReviewInboxFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-[11px] font-medium px-2 py-1 rounded-md shrink-0 transition-colors cursor-pointer capitalize",
                    filter === f
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {isLoadingCases ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-zinc-400">Loading cases…</span>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No review cases found</p>
                <p className="text-[11px] text-zinc-400 mt-1">Cases will appear as documents are submitted</p>
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCase(c.id)}
                    className={cn(
                      "w-full text-left p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5",
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-l-3 border-primary"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {c.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        Rev {c.current_revision_number || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <User className="w-3 h-3 shrink-0 text-zinc-400" />
                      <span className="truncate">{c.student_name}</span>
                      <span>•</span>
                      <span className="truncate">{c.student_course}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      {getStageBadge(c.stage)}
                      <span className="text-[10px] text-zinc-400">
                        {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLUMN 2: ACTIVE FILE PREVIEW (lg:col-span-5)
            ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          {isLoadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-zinc-500">Loading document preview…</span>
            </div>
          ) : !caseDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select a review case</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Pick a document from the inbox to inspect revisions, feedback, and audit history.
              </p>
            </div>
          ) : (
            <>
              {/* Revision Selector Bar */}
              <div className="p-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Revision:</span>
                  <select
                    value={selectedRevisionNumber}
                    onChange={(e) => void handleSelectRevision(Number(e.target.value))}
                    aria-label="Select document revision"
                    className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                  >
                    {caseDetails.revisions.map((rev) => (
                      <option key={rev.id} value={rev.revision_number}>
                        Rev {rev.revision_number} {rev.revision_number === caseDetails.caseRecord.current_revision_number ? '(Latest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeFileUrl && (
                    <a
                      href={activeFileUrl}
                      download={activeRevision?.original_filename || 'document.pdf'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-md transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Document Canvas Preview */}
              <div className="flex-1 bg-zinc-200 dark:bg-zinc-900/60 overflow-hidden relative">
                {activeFileUrl ? (
                  <EmbedPdfWorkspace
                    pdfUrl={activeFileUrl}
                    studentName={caseDetails.caseRecord.student_name || 'Student'}
                    docTitle={caseDetails.caseRecord.title}
                    readOnly={true}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="w-10 h-10 text-zinc-400 mb-2" />
                    <p className="text-xs text-zinc-500">Preview not available for this revision file</p>
                  </div>
                )}
              </div>

              {/* Metadata strip */}
              {activeRevision && (
                <div className="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between shrink-0">
                  <span className="truncate max-w-[200px]" title={activeRevision.original_filename}>
                    {activeRevision.original_filename}
                  </span>
                  <span>{formatDocumentFileSize(activeRevision.byte_size || 0)}</span>
                  <span>{new Date(activeRevision.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLUMN 3: CONVERSATION & DECISIONS (lg:col-span-4)
            ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          {caseDetails ? (
            <>
              {/* Review Case Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {caseDetails.caseRecord.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {getStageBadge(caseDetails.caseRecord.stage)}
                  <span className="text-xs text-zinc-500">
                    Route: {caseDetails.caseRecord.review_route === 'supervisor_then_adviser' ? 'Supervisor → Adviser' : 'Adviser Only'}
                  </span>
                </div>

                {/* Submitter details */}
                <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Student:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{caseDetails.caseRecord.student_name}</span>
                  </div>
                  {caseDetails.caseRecord.assigned_supervisor_name && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Supervisor:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{caseDetails.caseRecord.assigned_supervisor_name}</span>
                    </div>
                  )}
                  {caseDetails.caseRecord.assigned_adviser_name && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Adviser:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{caseDetails.caseRecord.assigned_adviser_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Action Bar (Role-Specific) */}
              <div className="p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                {/* Supervisor Actions */}
                {role === 'supervisor' && caseDetails.caseRecord.stage === 'submitted_to_supervisor' && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Enter review remarks or required revisions…"
                      value={decisionRemarks}
                      onChange={(e) => setDecisionRemarks(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision('supervisor_approve')}
                        disabled={isSubmittingDecision}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer"
                      >
                        Approve & Forward to Adviser
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDecision('supervisor_request_revision')}
                        disabled={isSubmittingDecision || !decisionRemarks.trim()}
                        className="text-xs h-8 cursor-pointer"
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
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision('adviser_approve')}
                        disabled={isSubmittingDecision}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer"
                      >
                        Final Approval
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDecision('adviser_request_revision')}
                        disabled={isSubmittingDecision || !decisionRemarks.trim()}
                        className="text-xs h-8 cursor-pointer"
                      >
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {/* Student Actions */}
                {role === 'student' && (caseDetails.caseRecord.stage === 'supervisor_revision_required' || caseDetails.caseRecord.stage === 'adviser_revision_required') && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-red-600 font-medium">Revision required by reviewer</span>
                    <Button
                      size="sm"
                      onClick={() => setShowRevisionModal(true)}
                      className="text-xs h-8 gap-1.5 bg-primary text-white cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Revised Document
                    </Button>
                  </div>
                )}

                {/* Approved status notice */}
                {caseDetails.caseRecord.stage === 'approved' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>This document has received final institutional approval.</span>
                  </div>
                )}
              </div>

              {/* Discussion & Audit Events Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Discussion & History
                </h3>

                {caseDetails.comments.length === 0 && caseDetails.events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-zinc-400">No comments or activity yet</p>
                  </div>
                ) : (
                  <>
                    {caseDetails.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                            {comment.author_name}
                            <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 capitalize">
                              {comment.author_role}
                            </span>
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {comment.message}
                        </p>
                      </div>
                    ))}

                    {/* Timeline Events */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Audit Trail
                      </span>
                      {caseDetails.events.map((event) => (
                        <div key={event.id} className="flex items-start gap-2 text-[11px] text-zinc-500">
                          <Clock className="w-3 h-3 mt-0.5 text-zinc-400 shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{event.actor_name}:</span>{' '}
                            <span>{event.remarks || event.action}</span>
                            <span className="text-[10px] text-zinc-400 block">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Comment Input Footer */}
              <form onSubmit={handlePostComment} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type a message or note…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || isPostingComment}
                  className="h-8 px-3 text-xs gap-1 cursor-pointer bg-primary text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-zinc-400">
              No case active
            </div>
          )}
        </div>
      </div>

      {/* ── Revision Upload Modal (Student only) ── */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Upload Revised Document
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadRevisionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Select File (PDF or DOCX, max 10MB)
                </label>
                <input
                  type="file"
                  ref={revisionFileInputRef}
                  accept=".pdf,.docx,.xlsx"
                  required
                  className="w-full text-xs text-zinc-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Revision Remarks (Optional)
                </label>
                <textarea
                  placeholder="Explain what changes were made according to the reviewer's feedback…"
                  value={revisionRemarks}
                  onChange={(e) => setRevisionRemarks(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevisionModal(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploadingRevision}
                  className="text-xs h-8 bg-primary text-white cursor-pointer"
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
