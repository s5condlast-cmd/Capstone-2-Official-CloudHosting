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
          <Badge variant="success" className="gap-1.5 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </Badge>
        );
      case 'supervisor_approved':
        return (
          <Badge variant="warning" className="gap-1.5 py-0.5 text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Supervisor Approved
          </Badge>
        );
      case 'submitted_to_supervisor':
        return (
          <Badge variant="outline" className="gap-1.5 py-0.5 text-[11px] font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
            <Clock className="w-3.5 h-3.5" /> Needs Supervisor
          </Badge>
        );
      case 'submitted_to_adviser':
        return (
          <Badge variant="outline" className="gap-1.5 py-0.5 text-[11px] font-semibold border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
            <Clock className="w-3.5 h-3.5" /> Needs Adviser
          </Badge>
        );
      case 'supervisor_revision_required':
      case 'adviser_revision_required':
        return (
          <Badge variant="danger" className="gap-1.5 py-0.5 text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Revision Required
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[11px]">{stage}</Badge>;
    }
  };

  const activeRevision = caseDetails?.revisions.find((r) => r.revision_number === selectedRevisionNumber);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full gap-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Document Review Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize font-semibold">
                {role} Portal
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspect submitted practicum documents, review remarks across revision cycles, and collaborate with reviewers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {role === 'student' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/documents')}
              className="h-8 text-xs gap-1.5 cursor-pointer rounded-lg border-border hover:bg-muted/80"
            >
              <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Document Repository</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => { void loadInbox(); }}
            className="h-8 text-xs gap-1.5 cursor-pointer rounded-lg border-border hover:bg-muted/80"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingCases && "animate-spin text-primary")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

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
          Notes & History
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {cases.length} {cases.length === 1 ? 'case' : 'cases'}
              </span>
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
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 custom-scrollbar">
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
                      ? 'Cases will appear here once official documents are submitted.'
                      : `No cases currently match the "${filter.replace('_', ' ')}" filter.`}
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
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCase(c.id)}
                    className={cn(
                      "w-full text-left p-3.5 transition-all cursor-pointer flex flex-col gap-2 relative group",
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-muted/40 border-l-4 border-l-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                          {c.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border/80">
                        Rev {c.current_revision_number || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <User className="w-3 h-3 shrink-0 opacity-70" />
                      <span className="truncate font-medium">{c.student_name}</span>
                      <span className="opacity-40">•</span>
                      <span className="truncate">{c.student_course}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {getStageBadge(c.stage)}
                      <span className="text-[10px] text-muted-foreground font-mono">
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
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-2xs">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Document Preview Workspace
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                Select any review case from your inbox on the left to inspect submitted PDF or Word pages, view sequential revisions, and examine institutional remarks side-by-side.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left max-w-md w-full">
                <div className="p-2.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[11px] font-semibold text-foreground block">Multi-Version</span>
                  <span className="text-[10px] text-muted-foreground">Rev 1, Rev 2, Rev 3...</span>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[11px] font-semibold text-foreground block">Signatures</span>
                  <span className="text-[10px] text-muted-foreground">Digital validation</span>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card text-center">
                  <span className="text-[11px] font-semibold text-foreground block">Audit Trail</span>
                  <span className="text-[10px] text-muted-foreground">Append-only history</span>
                </div>
              </div>
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
            "w-full lg:w-96 xl:w-[420px] shrink-0 bg-card flex flex-col overflow-hidden",
            activeMobileTab !== 'conversation' && "hidden lg:flex"
          )}
        >
          {caseDetails ? (
            <>
              {/* Review Case Header */}
              <div className="p-4 border-b border-border shrink-0 space-y-2.5 bg-muted/10">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
                    {caseDetails.caseRecord.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getStageBadge(caseDetails.caseRecord.stage)}
                  <span className="text-[11px] text-muted-foreground">
                    Route: <span className="font-medium text-foreground">{caseDetails.caseRecord.review_route === 'supervisor_then_adviser' ? 'Supervisor → Adviser' : 'Adviser Only'}</span>
                  </span>
                </div>

                {/* Submitter details card */}
                <div className="text-xs bg-muted/40 border border-border/80 p-2.5 rounded-xl space-y-1.5">
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
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-border bg-card">
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('comments')}
                  className={cn(
                    "text-xs font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                    activeDetailsTab === 'comments'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                    {caseDetails.comments.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('audit')}
                  className={cn(
                    "text-xs font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                    activeDetailsTab === 'audit'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
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
                    caseDetails.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            {comment.author_name}
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize border border-primary/20">
                              {comment.author_role}
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {comment.message}
                        </p>
                      </div>
                    ))
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
              <form onSubmit={handlePostComment} className="p-3 border-t border-border bg-card flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type a note or reply…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || isPostingComment}
                  className="h-8 px-3 text-xs gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-lg shrink-0"
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
                <p className="text-xs font-bold text-foreground">Review Details & Notes</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto leading-relaxed">
                  Select a document from your inbox to inspect feedback remarks and upload revisions.
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
                  Select File (PDF, DOCX, XLSX — max 10MB)
                </label>
                <input
                  type="file"
                  ref={revisionFileInputRef}
                  accept=".pdf,.docx,.xlsx"
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
