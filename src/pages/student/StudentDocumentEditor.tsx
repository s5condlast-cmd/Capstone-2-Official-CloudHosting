/**
 * StudentDocumentEditor.tsx
 * Phase 6: Full document editor page — /student/editor
 *
 * Features (per Plan.md):
 * - Back to Repository, editable title, document switcher, New Blank Document
 * - Saved/Saving/Offline/Conflict/Multi-tab telemetry strip + word count
 * - Export Word, Export PDF, Save Version, History drawer, Submit
 * - Read-only locked state after verified submission
 * - Duplicate as New Draft post-submission
 * - Submission sequence: flush → generate → upload → create row → lock draft
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, Save, Download, Clock, Send, Copy,
  AlertTriangle, CheckCircle, Wifi, WifiOff, Loader2,
  History, FileText, Users, ShieldCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { DocumentHistoryDrawer } from '@/src/components/editor/DocumentHistoryDrawer';
import { SidebarContext, SidebarTrigger } from '@/components/ui/sidebar';
import PlateEditor, { type PlateEditorRef } from '@/src/components/editor/plate-editor';
import {
  type EditorComment,
  type EditorMode,
} from '@/src/components/plate-ui/fixed-toolbar-buttons';
import {
  downloadDocx,
  printToPdf,
  serializeToDocx,
  type DocumentHeaderFooterOptions,
} from '@/src/components/editor/serializers/docxSerializer';
import {
  DocumentHistoryStorage,
  DraftState,
  SyncStatus,
  countWords,
  registerDraftInIndex,
  unwrapContentEnvelope,
  wrapContentEnvelope,
} from '@/src/lib/documentHistoryStorage';
import { submissionStorage } from '@/src/lib/submissionStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalDraft {
  id: string;
  title: string;
  content: object[];
  headerFooter?: DocumentHeaderFooterOptions;
  wordCount: number;
  revision: number;
  status: 'draft' | 'submitted' | 'locked';
  submissionId: string | null;
  templateId: string | null;
  templateName: string | null;
  phase: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentDocumentEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draft');
  const printOnLoad = searchParams.get('print') === '1';
  const { user } = useAuth();

  // ── Draft state ──────────────────────────────────────────────────────────
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Editor state ─────────────────────────────────────────────────────────
  const editorRef = useRef<PlateEditorRef | null>(null);
  const [title, setTitle] = useState('Untitled Document');
  const [wordCount, setWordCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');

  // ── UI state ─────────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [showConflictBanner, setShowConflictBanner] = useState(false);
  const [conflictLocal, setConflictLocal] = useState<DraftState | null>(null);
  const [conflictRemote, setConflictRemote] = useState<DraftState | null>(null);
  const [showMultiTabWarning, setShowMultiTabWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);

  // ── Multi-Role Reviewer Detection & Mode ─────────────────────────────────
  const isReviewer = user?.role === 'adviser' || user?.role === 'supervisor' || user?.role === 'admin' || searchParams.get('mode') === 'review';
  const [editorMode, setEditorMode] = useState<EditorMode>(() => isReviewer ? 'suggestion' : 'editing');

  // ── Comments State & Local Synchronization ──────────────────────────────
  const [comments, setComments] = useState<EditorComment[]>(() => {
    if (!draftIdParam) return [];
    try {
      const stored = localStorage.getItem(`comments_${draftIdParam}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleAddComment = useCallback((text: string, selectedText?: string) => {
    const newComment: EditorComment = {
      id: crypto.randomUUID(),
      author: user?.name || (user as any)?.full_name || (isReviewer ? 'Reviewer' : 'Student'),
      authorRole: (user?.role as any) || 'student',
      text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedText,
      resolved: false,
    };
    setComments((prev) => {
      const updated = [newComment, ...prev];
      if (draftIdParam || draft?.id) {
        localStorage.setItem(`comments_${draftIdParam || draft?.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    toast.success('Comment added');
  }, [user, isReviewer, draftIdParam, draft?.id]);

  const handleResolveComment = useCallback((id: string) => {
    setComments((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, resolved: true } : c));
      if (draftIdParam || draft?.id) {
        localStorage.setItem(`comments_${draftIdParam || draft?.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    toast.success('Comment resolved');
  }, [draftIdParam, draft?.id]);

  const handleUnresolveComment = useCallback((id: string) => {
    setComments((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, resolved: false } : c));
      if (draftIdParam || draft?.id) {
        localStorage.setItem(`comments_${draftIdParam || draft?.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [draftIdParam, draft?.id]);

  const handleDeleteComment = useCallback((id: string) => {
    setComments((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (draftIdParam || draft?.id) {
        localStorage.setItem(`comments_${draftIdParam || draft?.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    toast.success('Comment deleted');
  }, [draftIdParam, draft?.id]);

  // ── Storage engine ───────────────────────────────────────────────────────
  const storageRef = useRef<DocumentHistoryStorage | null>(null);

  // ── Auto-collapse sidebar on enter (once) to maximize editing width ──────
  const sidebar = React.useContext(SidebarContext);
  const sidebarRef = useRef(sidebar);
  sidebarRef.current = sidebar;

  useEffect(() => {
    // Only collapse once on initial page load; does not lock the sidebar
    sidebarRef.current?.setOpen(false);

    return () => {
      // Re-open sidebar when leaving editor so portal navigation is accessible
      sidebarRef.current?.setOpen(true);
    };
  }, []); // Strictly empty dependency array so user manual toggles are never overridden

  // ── Initialize: load or create draft ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        let loadedDraft: LocalDraft | null = null;

        if (draftIdParam) {
          // Load existing draft from Supabase
          const { data, error } = await supabase
            .from('editor_drafts')
            .select('*')
            .eq('id', draftIdParam)
            .eq('user_id', user.id)
            .single();

          if (error || !data) throw new Error('Draft not found or access denied.');
          const row = data as any;
          const { content: unwrappedContent, headerFooter: unwrappedHF } = unwrapContentEnvelope(row.content);
          loadedDraft = {
            id: row.id,
            title: row.title,
            content: unwrappedContent,
            headerFooter: unwrappedHF,
            wordCount: row.word_count,
            revision: row.revision,
            status: row.status,
            submissionId: row.submission_id,
            templateId: row.template_id,
            templateName: row.template_name,
            phase: row.phase,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        } else {
          // Create a new blank draft
          const newId = crypto.randomUUID();
          const initialContent = [{ type: 'p', children: [{ text: '' }] }];
          const { data, error } = await supabase.rpc('create_editor_draft', {
            p_id: newId,
            p_title: 'Untitled Document',
            p_template_id: null,
            p_template_name: null,
            p_phase: null,
            p_content: initialContent,
            p_word_count: 0,
          });
          if (error) throw new Error(error.message);
          const row = data as any;
          loadedDraft = {
            id: newId,
            title: 'Untitled Document',
            content: initialContent,
            wordCount: 0,
            revision: 1,
            status: 'draft',
            submissionId: null,
            templateId: null,
            templateName: null,
            phase: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          // Update URL without full navigation
          window.history.replaceState(null, '', `/student/editor?draft=${newId}`);
        }

        setDraft(loadedDraft);
        setTitle(loadedDraft.title);
        setWordCount(loadedDraft.wordCount);

        // Register in IDB index for cleanup on logout
        await registerDraftInIndex(user.id, loadedDraft.id);

        // Initialize storage engine
        const storage = new DocumentHistoryStorage(user.id, loadedDraft.id, {
          onStatusChange: setSyncStatus,
          onConflict: (local, remote) => {
            setConflictLocal(local);
            setConflictRemote(remote);
            setShowConflictBanner(true);
          },
          onMultiTabConflict: () => setShowMultiTabWarning(true),
          onSaved: (saved) => {
            setDraft((current) => current
              ? { ...current, revision: saved.revision, updatedAt: saved.updatedAt }
              : current
            );
          },
        });
        await storage.load(loadedDraft.revision);
        storageRef.current = storage;

        // Print on load if requested
        if (printOnLoad) {
          setTimeout(() => printToPdf(), 800);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load the document.');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      storageRef.current?.destroy();
      storageRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, draftIdParam]);

  // ── Editor content change ────────────────────────────────────────────────
  const handleEditorChange = useCallback(
    (content: object[], wc: number) => {
      if (!draft || !storageRef.current) return;
      setWordCount(wc);
      const updatedState: DraftState = {
        id: draft.id,
        userId: user!.id,
        title,
        templateId: draft.templateId ?? undefined,
        templateName: draft.templateName ?? undefined,
        phase: draft.phase ?? undefined,
        content,
        headerFooter: draft.headerFooter,
        wordCount: wc,
        revision: draft.revision,
        status: draft.status,
        submissionId: draft.submissionId,
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
      };
      storageRef.current.onChange(updatedState);
    },
    [draft, title, user]
  );

  // ── Header/Footer change ──────────────────────────────────────────────────
  const handleHeaderFooterChange = useCallback(
    (hf: DocumentHeaderFooterOptions) => {
      if (!draft || !storageRef.current) return;
      const content = editorRef.current?.getContent() ?? draft.content;
      const updatedState: DraftState = {
        id: draft.id,
        userId: user!.id,
        title,
        templateId: draft.templateId ?? undefined,
        templateName: draft.templateName ?? undefined,
        phase: draft.phase ?? undefined,
        content,
        headerFooter: hf,
        wordCount: editorRef.current?.getWordCount() ?? draft.wordCount,
        revision: draft.revision,
        status: draft.status,
        submissionId: draft.submissionId,
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
      };
      setDraft(prev => prev ? { ...prev, headerFooter: hf } : prev);
      storageRef.current.onChange(updatedState);
    },
    [draft, title, user]
  );

  // ── Title change ─────────────────────────────────────────────────────────
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (!draft || !storageRef.current || !editorRef.current) return;
      const content = editorRef.current.getContent();
      const updatedState: DraftState = {
        id: draft.id,
        userId: user!.id,
        title: newTitle,
        templateId: draft.templateId ?? undefined,
        templateName: draft.templateName ?? undefined,
        phase: draft.phase ?? undefined,
        content,
        headerFooter: draft.headerFooter,
        wordCount: editorRef.current.getWordCount(),
        revision: draft.revision,
        status: draft.status,
        submissionId: draft.submissionId,
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
      };
      storageRef.current.onChange(updatedState);
    },
    [draft, user]
  );

  // ── Save version ─────────────────────────────────────────────────────────
  const handleSaveVersion = useCallback(async () => {
    if (!storageRef.current) return;
    const label = window.prompt('Enter a label for this version (optional):') ?? 'Manual save';
    try {
      await storageRef.current.saveVersion(label);
      toast.success('Version saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save version.');
    }
  }, []);

  // ── Restore from history ─────────────────────────────────────────────────
  const handleRestoreComplete = useCallback(
    (newContent: object[], newRevision: number, newTitle: string, newHeaderFooter?: DocumentHeaderFooterOptions) => {
      if (!draft) return;
      setDraft(prev => prev ? {
        ...prev,
        content: newContent,
        headerFooter: newHeaderFooter ?? prev.headerFooter,
        revision: newRevision,
        title: newTitle
      } : prev);
      setTitle(newTitle);
      storageRef.current?.setCloudRevision(newRevision);
      setEditorEpoch((value) => value + 1);
    },
    [draft]
  );

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExportDocx = useCallback(async () => {
    const content = editorRef.current?.getContent() ?? draft?.content ?? [];
    const headerFooter = editorRef.current?.getHeaderFooter?.() ?? draft?.headerFooter;
    try {
      await downloadDocx(content as any[], title, headerFooter);
    } catch {
      toast.error('Export failed. Please try again.');
    }
  }, [draft?.content, draft?.headerFooter, title]);

  const handleExportPdf = useCallback(() => {
    printToPdf();
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!draft || !user || submitting) return;
    if (draft.status === 'locked') {
      toast.error('This document has already been submitted.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Flush pending draft revision
      const savedDraft = storageRef.current
        ? await storageRef.current.flushNow()
        : null;
      const expectedRevision = savedDraft?.revision
        ?? storageRef.current?.getCloudRevision()
        ?? draft.revision;

      // 2. Generate DOCX artifact with complete header/footer options
      const content = editorRef.current?.getContent() ?? draft.content;
      const headerFooter = editorRef.current?.getHeaderFooter?.() ?? draft.headerFooter;
      const blob = await serializeToDocx(content as any, title, headerFooter);
      const file = new File([blob], `${title}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // 3. Upload to student_submissions and create student_documents row
      const submissionDoc = await submissionStorage.uploadSubmission(file, '', '', draft.templateName ?? title);

      // 4. Lock the draft using the trusted server function
      const { error: lockError } = await supabase.rpc('lock_editor_draft_for_submission', {
        p_draft_id: draft.id,
        p_submission_id: submissionDoc.id,
        p_expected_revision: expectedRevision,
      });

      if (lockError) {
        toast.error('Document uploaded but could not lock draft. Retry or contact support.', { duration: 8000 });
        return;
      }

      setDraft(prev => prev ? {
        ...prev,
        revision: expectedRevision,
        status: 'locked',
        submissionId: submissionDoc.id,
      } : prev);
      toast.success('Document submitted successfully! Your adviser has been notified.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  }, [draft, submitting, title, user]);

  // ── Duplicate as new draft ───────────────────────────────────────────────
  const handleDuplicate = useCallback(async () => {
    if (!draft || !user) return;
    const newId = crypto.randomUUID();
    const content = editorRef.current?.getContent() ?? draft.content;
    const headerFooter = editorRef.current?.getHeaderFooter?.() ?? draft.headerFooter;
    const payloadContent = headerFooter
      ? wrapContentEnvelope(content, headerFooter, countWords(content))
      : content;
    try {
      const { error } = await supabase.rpc('create_editor_draft', {
        p_id: newId,
        p_title: `[Copy] ${title}`,
        p_template_id: draft.templateId,
        p_template_name: draft.templateName,
        p_phase: draft.phase,
        p_content: payloadContent,
        p_word_count: countWords(content),
      });
      if (error) throw new Error(error.message);
      toast.success('Duplicated as a new draft.');
      navigate(`/student/editor?draft=${newId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not duplicate draft.');
    }
  }, [draft, navigate, title, user]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading document…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-zinc-600 dark:text-zinc-400">{loadError}</p>
        <button
          onClick={() => navigate('/student/documents')}
          className="text-sm text-primary underline underline-offset-4"
        >
          Back to Repository
        </button>
      </div>
    );
  }

  const isLocked = draft?.status === 'locked';

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <PlateEditor
        key={`${draft?.id ?? 'new'}:${editorEpoch}`}
        ref={editorRef}
        topBar={
          <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
            <button
              onClick={() => navigate('/student/documents')}
              className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer" />

            <div className="flex-1 min-w-0">
              {titleEditing ? (
                <input
                  autoFocus
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  onBlur={() => setTitleEditing(false)}
                  onKeyDown={e => { if (e.key === 'Enter') setTitleEditing(false); }}
                  className="w-full text-base font-semibold bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none focus:border-primary text-zinc-900 dark:text-zinc-100 py-0.5"
                  maxLength={120}
                />
              ) : (
                <button
                  onClick={() => !isLocked && setTitleEditing(true)}
                  className={cn(
                    'text-base font-semibold text-zinc-900 dark:text-zinc-100 text-left truncate w-full',
                    !isLocked && 'hover:text-primary cursor-text'
                  )}
                  title={isLocked ? undefined : 'Click to rename'}
                >
                  {title}
                </button>
              )}
            </div>

            {/* Telemetry */}
            <TelemetryStrip syncStatus={syncStatus} wordCount={wordCount} isLocked={isLocked} />

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isLocked && (
                <>
                  <button
                    onClick={handleSaveVersion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Version
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    History
                  </button>
                </>
              )}
              <button
                onClick={handleExportDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Word
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
              {isLocked ? (
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate as Draft
                </button>
              ) : (
                <button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit
                </button>
              )}
            </div>
          </div>
        }
        initialContent={draft?.content ?? [{ type: 'p', children: [{ text: '' }] }]}
        headerFooter={draft?.headerFooter}
        onHeaderFooterChange={handleHeaderFooterChange}
        onChange={handleEditorChange}
        readOnly={isLocked && !isReviewer}
        placeholder="Start writing your document..."
        mode={editorMode}
        onModeChange={setEditorMode}
        comments={comments}
        onAddComment={handleAddComment}
        onResolveComment={handleResolveComment}
        onUnresolveComment={handleUnresolveComment}
        onDeleteComment={handleDeleteComment}
        currentUserRole={(user?.role as any) || 'student'}
        currentUserName={user?.name || (user as any)?.full_name || 'User'}
        syncStatus={syncStatus}
        documentTitle={title}
        onSaveVersion={handleSaveVersion}
        onShowHistory={() => setShowHistory(true)}
        onExportDocx={handleExportDocx}
        onExportPdf={handleExportPdf}
        onDuplicate={handleDuplicate}
        onRename={() => setTitleEditing(true)}
      />

      {/* History drawer */}
      {showHistory && draft && (
        <DocumentHistoryDrawer
          draftId={draft.id}
          currentRevision={storageRef.current?.getCloudRevision() ?? draft.revision}
          onBeforeRestore={async () => {
            const saved = await storageRef.current?.flushNow();
            return saved?.revision
              ?? storageRef.current?.getCloudRevision()
              ?? draft.revision;
          }}
          onClose={() => setShowHistory(false)}
          onRestoreComplete={handleRestoreComplete}
        />
      )}
    </div>
  );
}

// ─── TelemetryStrip ───────────────────────────────────────────────────────────

function TelemetryStrip({
  syncStatus,
  wordCount,
  isLocked,
}: {
  syncStatus: SyncStatus;
  wordCount: number;
  isLocked: boolean;
}) {
  const statusConfig = {
    saved:    { icon: CheckCircle, label: 'Saved', color: 'text-green-500' },
    saving:   { icon: Loader2,     label: 'Saving…', color: 'text-zinc-400', spin: true },
    offline:  { icon: WifiOff,     label: 'Offline', color: 'text-amber-500' },
    conflict: { icon: AlertTriangle, label: 'Conflict', color: 'text-red-500' },
    error:    { icon: AlertTriangle, label: 'Error', color: 'text-red-500' },
  };

  const cfg = statusConfig[syncStatus];
  const Icon = cfg.icon;

  if (isLocked) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
        <span>Submitted</span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>
    );
  }

  return (
    <div
      data-editor-telemetry
      className="flex items-center gap-1.5 text-xs text-zinc-500"
    >
      <Icon className={cn('w-3.5 h-3.5', cfg.color, (cfg as any).spin && 'animate-spin')} />
      <span className={cfg.color}>{cfg.label}</span>
      <span className="text-zinc-300 dark:text-zinc-700">·</span>
      <span>{wordCount.toLocaleString()} words</span>
    </div>
  );
}

// ─── ConflictBanner ───────────────────────────────────────────────────────────

function ConflictBanner({
  local,
  remote,
  storage,
  onResolved,
  draftId,
}: {
  local: DraftState;
  remote: DraftState;
  storage: DocumentHistoryStorage | null;
  onResolved: () => void;
  draftId: string;
}) {
  const [resolving, setResolving] = useState(false);

  const resolve = useCallback(
    async (type: 'keep_local' | 'accept_cloud' | 'fork_local') => {
      if (!storage || resolving) return;
      setResolving(true);
      try {
        const newId = crypto.randomUUID();
        await storage.resolveConflict(
          type === 'fork_local'
            ? { type: 'fork_local', newDraftId: newId }
            : type === 'accept_cloud'
            ? { type: 'accept_cloud', cloudDraft: remote }
            : { type: 'keep_local' },
          local,
          remote.revision
        );
        toast.success(
          type === 'keep_local'   ? 'Your local changes are now saved.' :
          type === 'accept_cloud' ? 'Cloud version accepted.' :
          'Forked as a new offline copy.'
        );
        onResolved();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Resolution failed.');
      } finally {
        setResolving(false);
      }
    },
    [local, onResolved, remote, resolving, storage]
  );

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm font-medium text-red-700 dark:text-red-400">Edit conflict detected</p>
      </div>
      <p className="text-xs text-red-600 dark:text-red-500">
        Your local changes conflict with a newer cloud version (Rev {remote.revision}). Choose how to resolve:
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => void resolve('keep_local')}
          disabled={resolving}
          className="px-3 py-1.5 text-xs rounded-md bg-red-700 text-white hover:opacity-90 disabled:opacity-50"
        >
          Keep My Changes
        </button>
        <button
          onClick={() => void resolve('accept_cloud')}
          disabled={resolving}
          className="px-3 py-1.5 text-xs rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:opacity-90 disabled:opacity-50"
        >
          Accept Cloud Version
        </button>
        <button
          onClick={() => void resolve('fork_local')}
          disabled={resolving}
          className="px-3 py-1.5 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:opacity-90 disabled:opacity-50"
        >
          Fork as Offline Copy
        </button>
      </div>
    </div>
  );
}

export default StudentDocumentEditor;
