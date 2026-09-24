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
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  BookOpen,
  Download,
  Send,
  Upload,
  RefreshCw,
  Eye,
  MessageSquare,
  ShieldCheck,
  History,
  User,
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileCheck,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox,
  FolderOpen,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
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
import { resetExampleCases } from '@/src/data/exampleReviewCases';
import { validateDocumentUpload, formatDocumentFileSize } from '@/src/config/documentUploadPolicy';
import { validatePdfFileBytes } from '@/src/config/reviewPdfPolicy';
import { submitReviewRevision } from '@/src/lib/reviewSubmissionService';
import { getSupervisorSignature } from '@/src/lib/signatureStorage';
import { getUserAvatar } from '@/src/lib/avatarHelper';
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

    const validation = await validatePdfFileBytes(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Revisions must be valid PDF documents (max 15 MB).');
      return;
    }

    setIsUploadingRevision(true);
    try {
      const currentRevNumber = caseDetails.caseRecord.current_revision_number || 1;
      await submitReviewRevision({
        caseId: selectedCaseId,
        expectedRevision: currentRevNumber,
        pdfFile: file,
        filename: file.name,
        remarks: revisionRemarks.trim() || undefined,
      });

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

  // Helper stage badges aligned to system design tokens
  const getStageBadge = (stage: ReviewStage) => {
    const badgeContainerClass = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-900 text-foreground border border-zinc-200 dark:border-zinc-700 shadow-2xs";

    switch (stage) {
      case 'approved':
        return (
          <span className={badgeContainerClass}>
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            Approved
          </span>
        );
      case 'supervisor_approved':
        return (
          <span className={badgeContainerClass}>
            <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
            Supervisor Approved
          </span>
        );
      case 'submitted_to_supervisor':
        return (
          <span className={badgeContainerClass}>
            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
            Needs Supervisor
          </span>
        );
      case 'submitted_to_adviser':
        return (
          <span className={badgeContainerClass}>
            <span className="size-1.5 rounded-full bg-purple-500 shrink-0" />
            Needs Adviser
          </span>
        );
      case 'supervisor_revision_required':
      case 'adviser_revision_required':
        return (
          <span className={badgeContainerClass}>
            <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
            Revision Required
          </span>
        );
      default:
        return (
          <span className={badgeContainerClass}>
            <span className="size-1.5 rounded-full bg-zinc-400 shrink-0" />
            {stage}
          </span>
        );
    }
  };

  const activeRevision = caseDetails?.revisions.find((r) => r.revision_number === selectedRevisionNumber);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full gap-4">
      {/* ── Mobile Tab Navigation (< lg) ── */}
      <div className="lg:hidden flex items-center bg-muted/70 p-1 rounded-xl border border-border shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab('inbox')}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
            activeMobileTab === 'inbox'
              ? "bg-card text-foreground shadow-2xs"
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
              ? "bg-card text-foreground shadow-2xs"
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
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Review Details
        </button>
      </div>

      {/* ── 3-Column Unified Workspace Card ── */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-xs overflow-hidden flex flex-col lg:flex-row">
        
        {/* ════════════════════════════════════════════════════════════════
            COLUMN 1: REVIEW INBOX
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "w-full lg:w-80 xl:w-92 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden",
            activeMobileTab !== 'inbox' && "hidden lg:flex"
          )}
        >
          {/* Inbox Header & Search */}
          <div className="p-3.5 border-b border-border space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-primary" />
                Review Inbox
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {cases.length} {cases.length === 1 ? 'case' : 'cases'}
                </span>
                <button
                  type="button"
                  onClick={() => { void loadInbox(); }}
                  disabled={isLoadingCases}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh inbox"
                >
                  <RefreshCw className={cn("w-3 h-3", isLoadingCases && "animate-spin text-primary")} />
                </button>
              </div>
            </div>

            {/* Search Input with Clear Button */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents or students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void loadInbox(); }}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

            {/* Filter Segmented Control */}
            <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
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
                    "flex-1 text-[11px] font-medium py-1 px-2 rounded-lg shrink-0 transition-all text-center cursor-pointer",
                    filter === key
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {isLoadingCases ? (
              <div className="p-10 flex flex-col items-center justify-center gap-2.5 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading inbox cases…</span>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3 h-full">
                <div className="w-12 h-12 rounded-2xl bg-muted/80 border border-border flex items-center justify-center text-muted-foreground">
                  <Inbox className="w-6 h-6 opacity-60" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">No review cases found</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                    {filter === 'all'
                      ? 'No review cases currently available.'
                      : `No cases currently match the "${filter.replace('_', ' ')}" filter.`}
                  </p>
                </div>
                {role === 'student' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/student/documents')}
                    className="text-xs h-7 gap-1 rounded-lg text-muted-foreground hover:text-foreground mt-1"
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
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCase(c.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col gap-2 border overflow-hidden",
                      isSelected
                        ? "bg-muted/60 dark:bg-muted/30 border-border shadow-xs"
                        : "bg-card hover:bg-muted/40 border-border/60 hover:border-border hover:shadow-2xs"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <BookOpen
                          className={cn(
                            "size-4 shrink-0 transition-colors mt-0.5",
                            isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs sm:text-[13px] font-semibold line-clamp-1 leading-snug tracking-tight transition-colors",
                            isSelected ? "text-primary font-bold" : "text-foreground group-hover:text-primary"
                          )}
                          title={c.title}
                        >
                          {c.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/80">
                          Rev {c.current_revision_number || 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6.5">
                      <div className="size-4 rounded-full overflow-hidden border border-border/80 bg-muted flex items-center justify-center shrink-0 shadow-2xs select-none">
                        <img
                          src={getUserAvatar({ name: c.student_name, role: 'student' })}
                          alt={c.student_name}
                          className="size-full object-cover"
                        />
                      </div>
                      <span className="truncate font-medium text-foreground/85">{c.student_name}</span>
                      <span className="opacity-40">•</span>
                      <span className="truncate text-muted-foreground/80">{c.student_course}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5 pl-6.5">
                      {getStageBadge(c.stage)}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono font-medium">
                        <Calendar className="size-3 shrink-0 opacity-60" />
                        <span>{new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLUMN 2: ACTIVE FILE PREVIEW
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "flex-1 min-w-0 bg-muted/20 border-r border-border flex flex-col overflow-hidden relative",
            activeMobileTab !== 'preview' && "hidden lg:flex"
          )}
        >
          {isLoadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">Loading document preview…</span>
            </div>
          ) : !caseDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/40">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-2xs">
                <FileCheck className="w-8 h-8" />
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
              <div className="p-2.5 bg-card border-b border-border flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">Revision:</span>
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
                              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-muted hover:bg-accent text-foreground transition-colors border border-border cursor-pointer"
                      title="Download official file copy"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
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
                <div className="p-2.5 bg-card border-t border-border text-[11px] text-muted-foreground flex items-center justify-between shrink-0 font-mono">
                  <span className="truncate max-w-[240px] font-medium" title={activeRevision.original_filename}>
                    {activeRevision.original_filename}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>{formatDocumentFileSize(activeRevision.byte_size || 0)}</span>
                    <span>•</span>
                    <span>{new Date(activeRevision.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLUMN 3: CONVERSATION & DECISIONS
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "w-full lg:w-80 xl:w-[340px] shrink-0 bg-card flex flex-col overflow-hidden",
            activeMobileTab !== 'conversation' && "hidden lg:flex"
          )}
        >
          {caseDetails ? (
            <>
              {/* Review Case Header */}
              <div className="p-4 border-b border-border shrink-0 space-y-2.5 bg-muted/10 font-sans">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground line-clamp-1 leading-snug">
                    {caseDetails.caseRecord.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getStageBadge(caseDetails.caseRecord.stage)}
                  <span className="text-[11px] text-muted-foreground font-sans">
                    Route: <span className="font-medium text-foreground">{caseDetails.caseRecord.review_route === 'supervisor_then_adviser' ? 'Supervisor → Adviser' : 'Adviser Only'}</span>
                  </span>
                </div>

                {/* Submitter details card */}
                <div className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl space-y-2 font-sans shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                      <div className="size-5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-2xs select-none">
                        <img
                          src={getUserAvatar({ name: caseDetails.caseRecord.student_name, role: 'student' })}
                          alt="Student"
                          className="size-full object-cover"
                        />
                      </div>
                      <span>Student:</span>
                    </div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300 tracking-tight truncate">{caseDetails.caseRecord.student_name}</span>
                  </div>
                  {caseDetails.caseRecord.assigned_supervisor_name && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                        <div className="size-5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-2xs select-none">
                          <img
                            src={getUserAvatar({ name: caseDetails.caseRecord.assigned_supervisor_name, role: 'supervisor' })}
                            alt="Supervisor"
                            className="size-full object-cover"
                          />
                        </div>
                        <span>Supervisor:</span>
                      </div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 tracking-tight truncate">{caseDetails.caseRecord.assigned_supervisor_name}</span>
                    </div>
                  )}
                  {caseDetails.caseRecord.assigned_adviser_name && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                        <div className="size-5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-2xs select-none">
                          <img
                            src={getUserAvatar({ name: caseDetails.caseRecord.assigned_adviser_name, role: 'adviser' })}
                            alt="Adviser"
                            className="size-full object-cover"
                          />
                        </div>
                        <span>Adviser:</span>
                      </div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 tracking-tight truncate">{caseDetails.caseRecord.assigned_adviser_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Action Bar (Role-Specific) */}
              <div className="p-3 bg-muted/30 border-b border-border shrink-0">
                {/* Supervisor Actions */}
                {role === 'supervisor' && caseDetails.caseRecord.stage === 'submitted_to_supervisor' && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Enter review remarks or required revisions…"
                      value={decisionRemarks}
                      onChange={(e) => setDecisionRemarks(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision('supervisor_approve')}
                        disabled={isSubmittingDecision}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer font-semibold rounded-lg"
                      >
                        Approve & Forward
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDecision('supervisor_request_revision')}
                        disabled={isSubmittingDecision || !decisionRemarks.trim()}
                        className="text-xs h-8 cursor-pointer font-semibold rounded-lg"
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
                      className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision('adviser_approve')}
                        disabled={isSubmittingDecision}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer font-semibold rounded-lg"
                      >
                        Final Institutional Approval
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDecision('adviser_request_revision')}
                        disabled={isSubmittingDecision || !decisionRemarks.trim()}
                        className="text-xs h-8 cursor-pointer font-semibold rounded-lg"
                      >
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {/* Student Actions */}
                {role === 'student' && (caseDetails.caseRecord.stage === 'supervisor_revision_required' || caseDetails.caseRecord.stage === 'adviser_revision_required') && (
                  <div className="flex flex-col gap-2 p-1">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Action Required: Revision requested by reviewer</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowRevisionModal(true)}
                      className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-fg cursor-pointer font-semibold rounded-lg w-full"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Revised Document
                    </Button>
                  </div>
                )}

                {/* Approved Status Notice */}
                {caseDetails.caseRecord.stage === 'approved' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>This document has received final institutional approval.</span>
                  </div>
                )}
              </div>

              {/* Tab Selector: Discussion vs Audit Trail */}
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-border bg-card font-sans">
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('comments')}
                  className={cn(
                    "text-xs font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer font-sans",
                    activeDetailsTab === 'comments'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                    {caseDetails.comments.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('audit')}
                  className={cn(
                    "text-xs font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer font-sans",
                    activeDetailsTab === 'audit'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                    {caseDetails.events.length}
                  </span>
                </button>
              </div>

              {/* Discussion & Audit Content Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeDetailsTab === 'comments' ? (
                  caseDetails.comments.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                      <MessageSquare className="w-8 h-8 text-muted-foreground opacity-40" />
                      <p className="text-xs font-semibold text-foreground">No discussion comments yet</p>
                      <p className="text-[11px] text-muted-foreground max-w-[220px]">
                        Type a message below to leave notes for your adviser or supervisor.
                      </p>
                    </div>
                  ) : (
                    caseDetails.comments.map((comment) => {
                      const isStudent = comment.author_role === 'student';
                      const isAdviser = comment.author_role === 'adviser';
                      const isSupervisor = comment.author_role === 'supervisor';
                      return (
                        <div
                          key={comment.id}
                          className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-border text-xs space-y-2.5 transition-all shadow-2xs font-sans"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Real User Avatar */}
                              <div className="size-7 rounded-full overflow-hidden border border-border/80 bg-muted flex items-center justify-center shrink-0 shadow-2xs select-none">
                                <img
                                  src={getUserAvatar({ name: comment.author_name, role: comment.author_role })}
                                  alt={comment.author_name}
                                  className="size-full object-cover"
                                />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200 tracking-tight truncate text-xs sm:text-[13px]">
                                  {comment.author_name}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-2xs shrink-0 capitalize">
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full shrink-0",
                                      isStudent && "bg-emerald-500",
                                      isAdviser && "bg-blue-500",
                                      isSupervisor && "bg-amber-500",
                                      !isStudent && !isAdviser && !isSupervisor && "bg-zinc-400"
                                    )}
                                  />
                                  {comment.author_role}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono font-medium shrink-0">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-foreground/90 font-sans text-xs sm:text-[12.5px] leading-relaxed whitespace-pre-wrap pl-9.5">
                            {comment.message}
                          </p>
                        </div>
                      );
                    })
                  )
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Audit Trail
                    </span>
                    {caseDetails.events.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No audit events recorded yet
                      </div>
                    ) : (
                      caseDetails.events.map((event) => (
                        <div key={event.id} className="flex items-start gap-2.5 text-xs p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-foreground truncate">{event.actor_name}</span>
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
              <form onSubmit={handlePostComment} className="p-3 border-t border-border bg-card flex items-center gap-2 shrink-0 font-sans">
                <input
                  type="text"
                  placeholder="Type a note or reply…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || isPostingComment}
                  className="h-8 px-3.5 text-xs gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-lg shrink-0 font-sans shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/80 border border-border flex items-center justify-center text-muted-foreground">
                <MessageSquare className="w-6 h-6 opacity-60" />
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
          <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Upload Revised Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Select PDF Revision File (max 15 MB)
                </label>
                <input
                  type="file"
                  ref={revisionFileInputRef}
                  accept="application/pdf,.pdf"
                  required
                  className="w-full text-xs text-muted-foreground file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/90 cursor-pointer border border-border rounded-xl p-2 bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Revision Notes (Optional)
                </label>
                <textarea
                  placeholder="Explain what changes were made according to the reviewer's feedback…"
                  value={revisionRemarks}
                  onChange={(e) => setRevisionRemarks(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
                  className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-fg cursor-pointer font-semibold rounded-lg"
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
