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
  ChevronLeft, ChevronDown, Save, Download, Clock, Send, Copy,
  AlertTriangle, CheckCircle, Wifi, WifiOff, Loader2,
  History, FileText, Users, ShieldCheck, ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { DocumentHistoryDrawer } from '@/src/components/editor/DocumentHistoryDrawer';
import PlateEditor, { type PlateEditorRef } from '@/src/components/editor/plate-editor';
import {
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
import { getEditorTemplate } from '@/src/config/editorTemplates';

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
  const templateParam = searchParams.get('template');
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
  const [submitting, setSubmitting] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);

  // ── Fullscreen Tracking & Safe Navigation ────────────────────────────────
  const isFullscreenRef = useRef(false);
  const exitFullscreenRef = useRef<(() => void) | null>(null);

  const getReturnRoute = useCallback(() => {
    const returnUrlParam = searchParams.get('returnUrl');
    if (returnUrlParam) return returnUrlParam;

    const phaseParam = draft?.phase ? `?phase=${draft.phase}` : '';
    switch (user?.role) {
      case 'admin': return '/admin/documents';
      case 'adviser': return '/adviser/review';
      case 'supervisor': return '/supervisor/interns';
      case 'student': default: return `/student/documents${phaseParam}`;
    }
  }, [user?.role, searchParams, draft?.phase]);

  const handleSafeNavigate = useCallback(
    async (to: string) => {
      try {
        if (storageRef.current) {
          await Promise.race([
            storageRef.current.flushNow(1000),
            new Promise((resolve) => setTimeout(resolve, 400)),
          ]);
        }
      } catch (err) {
        console.warn('Storage flush error during navigation:', err);
      }
      if (isFullscreenRef.current && exitFullscreenRef.current) {
        exitFullscreenRef.current();
      }
      navigate(to);
    },
    [navigate]
  );

  // ── Multi-Role Reviewer Detection & Mode ─────────────────────────────────
  const isReviewer = user?.role === 'adviser' || user?.role === 'supervisor' || user?.role === 'admin' || searchParams.get('mode') === 'review';
  const [editorMode, setEditorMode] = useState<EditorMode>(() => isReviewer ? 'suggestion' : 'editing');


  // ── Storage engine ───────────────────────────────────────────────────────
  const storageRef = useRef<DocumentHistoryStorage | null>(null);

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
        } else if (templateParam) {
          // 1. Check if user already has an active, unsubmitted draft for this template
          const { data: existingDraft } = await supabase
            .from('editor_drafts')
            .select('*')
            .eq('user_id', user.id)
            .eq('template_id', templateParam)
            .is('deleted_at', null)
            .neq('status', 'locked')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingDraft) {
            const row = existingDraft as any;
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
            window.history.replaceState(null, '', `/student/editor?draft=${row.id}`);
          } else {
            // Create a single draft from the template
            const template = getEditorTemplate(templateParam);
            const newId = crypto.randomUUID();
            const initialContent = template?.seedContent ?? [{ type: 'p', children: [{ text: '' }] }];
            const draftTitle = template?.name ?? 'Untitled Document';
            const { error } = await supabase.rpc('create_editor_draft', {
              p_id: newId,
              p_title: draftTitle,
              p_template_id: template?.id ?? templateParam,
              p_template_name: template?.name ?? null,
              p_phase: template?.phase ?? null,
              p_content: initialContent,
              p_word_count: 0,
            });
            if (error) throw new Error(error.message);
            loadedDraft = {
              id: newId,
              title: draftTitle,
              content: initialContent,
              wordCount: 0,
              revision: 1,
              status: 'draft',
              submissionId: null,
              templateId: template?.id ?? templateParam,
              templateName: template?.name ?? null,
              phase: template?.phase ?? null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            window.history.replaceState(null, '', `/student/editor?draft=${newId}`);
          }
        } else {
          // Direct visit to /student/editor without draft or template param:
          // Check if user already has an active, unsubmitted blank draft
          const { data: existingBlank } = await supabase
            .from('editor_drafts')
            .select('*')
            .eq('user_id', user.id)
            .is('template_id', null)
            .is('deleted_at', null)
            .neq('status', 'locked')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingBlank) {
            const row = existingBlank as any;
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
              templateId: null,
              templateName: null,
              phase: null,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };
            window.history.replaceState(null, '', `/student/editor?draft=${row.id}`);
          } else {
            // Create a single new blank draft
            const newId = crypto.randomUUID();
            const initialContent = [{ type: 'p', children: [{ text: '' }] }];
            const { error } = await supabase.rpc('create_editor_draft', {
              p_id: newId,
              p_title: 'Untitled Document',
              p_template_id: null,
              p_template_name: null,
              p_phase: null,
              p_content: initialContent,
              p_word_count: 0,
            });
            if (error) throw new Error(error.message);
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
            window.history.replaceState(null, '', `/student/editor?draft=${newId}`);
          }
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
  }, [user?.id, draftIdParam, templateParam]);

  const draftRef = useRef<LocalDraft | null>(null);
  draftRef.current = draft;
  const titleRef = useRef(title);
  titleRef.current = title;

  // ── Conflict resolution handler ──────────────────────────────────────────
  const handleConflictResolved = useCallback(
    (type: 'keep_local' | 'accept_cloud' | 'fork_local', newDraftId?: string) => {
      if (type === 'accept_cloud' && conflictRemote) {
        setDraft(prev => prev ? {
          ...prev,
          content: conflictRemote.content,
          headerFooter: conflictRemote.headerFooter ?? prev.headerFooter,
          revision: conflictRemote.revision,
          title: conflictRemote.title,
          wordCount: conflictRemote.wordCount,
        } : prev);
        setTitle(conflictRemote.title);
        setWordCount(conflictRemote.wordCount);
        setEditorEpoch(v => v + 1);
      } else if (type === 'keep_local' && conflictRemote) {
        setDraft(prev => prev ? {
          ...prev,
          revision: conflictRemote.revision + 1,
        } : prev);
      } else if (type === 'fork_local' && newDraftId) {
        navigate(`/student/editor?draft=${newDraftId}`);
      }

      setShowConflictBanner(false);
      setConflictLocal(null);
      setConflictRemote(null);
      setSyncStatus('saved');
    },
    [conflictRemote, navigate]
  );

  // ── Editor content change ────────────────────────────────────────────────
  const handleEditorChange = useCallback(
    (content: object[], wc: number) => {
      if (!draftRef.current || !storageRef.current || !user) return;
      const currentDraft = draftRef.current;
      setWordCount(wc);
      const updatedState: DraftState = {
        id: currentDraft.id,
        userId: user.id,
        title: titleRef.current,
        templateId: currentDraft.templateId ?? undefined,
        templateName: currentDraft.templateName ?? undefined,
        phase: currentDraft.phase ?? undefined,
        content,
        headerFooter: currentDraft.headerFooter,
        wordCount: wc,
        revision: currentDraft.revision,
        status: currentDraft.status,
        submissionId: currentDraft.submissionId,
        createdAt: currentDraft.createdAt,
        updatedAt: new Date().toISOString(),
      };
      storageRef.current.onChange(updatedState);
    },
    [user]
  );

  // ── Header/Footer change ──────────────────────────────────────────────────
  const handleHeaderFooterChange = useCallback(
    (hf: DocumentHeaderFooterOptions) => {
      if (!draftRef.current || !storageRef.current || !user) return;
      const currentDraft = draftRef.current;
      const content = editorRef.current?.getContent() ?? currentDraft.content;
      const updatedState: DraftState = {
        id: currentDraft.id,
        userId: user.id,
        title: titleRef.current,
        templateId: currentDraft.templateId ?? undefined,
        templateName: currentDraft.templateName ?? undefined,
        phase: currentDraft.phase ?? undefined,
        content,
        headerFooter: hf,
        wordCount: editorRef.current?.getWordCount() ?? currentDraft.wordCount,
        revision: currentDraft.revision,
        status: currentDraft.status,
        submissionId: currentDraft.submissionId,
        createdAt: currentDraft.createdAt,
        updatedAt: new Date().toISOString(),
      };
      setDraft(prev => {
        if (!prev) return prev;
        if (JSON.stringify(prev.headerFooter) === JSON.stringify(hf)) return prev;
        return { ...prev, headerFooter: hf };
      });
      storageRef.current.onChange(updatedState);
    },
    [user]
  );

  // ── Title change ─────────────────────────────────────────────────────────
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (!draftRef.current || !storageRef.current || !editorRef.current || !user) return;
      const currentDraft = draftRef.current;
      const content = editorRef.current.getContent();
      const updatedState: DraftState = {
        id: currentDraft.id,
        userId: user.id,
        title: newTitle,
        templateId: currentDraft.templateId ?? undefined,
        templateName: currentDraft.templateName ?? undefined,
        phase: currentDraft.phase ?? undefined,
        content,
        headerFooter: currentDraft.headerFooter,
        wordCount: editorRef.current.getWordCount(),
        revision: currentDraft.revision,
        status: currentDraft.status,
        submissionId: currentDraft.submissionId,
        createdAt: currentDraft.createdAt,
        updatedAt: new Date().toISOString(),
      };
      storageRef.current.onChange(updatedState);
    },
    [user]
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
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading document…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-muted-foreground">{loadError}</p>
        <button
          onClick={() => void handleSafeNavigate(getReturnRoute())}
          className="text-sm text-primary underline underline-offset-4"
        >
          Back to Repository
        </button>
      </div>
    );
  }

  const isLocked = draft?.status === 'locked';

  return (
    <div data-editor-page="true" className="flex-1 flex flex-col min-h-0 h-full max-h-full">
      {/* Top bar */}
      <PlateEditor
        key={`${draft?.id ?? 'new'}:${editorEpoch}`}
        ref={editorRef}
        className="flex-1 min-h-0 h-full"
        topBar={({ menuBar, isFullscreen = false, onToggleFullscreen }) => {
          isFullscreenRef.current = isFullscreen;
          exitFullscreenRef.current = onToggleFullscreen ? () => { if (isFullscreen) onToggleFullscreen(); } : null;

          return (
            <div className="flex flex-col shrink-0 select-none">
              <div className="flex items-center justify-between gap-4 px-3 pt-3 sm:pt-3.5 pb-2 sm:pb-2.5 bg-card border-b border-border shrink-0">
                {/* Left: Document Return Button + 2-Row Stack (Title on top, MenuBar below) */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Document Return Button */}
                  <button
                    type="button"
                    onClick={() => void handleSafeNavigate(getReturnRoute())}
                    className="group relative flex items-center justify-center p-1 rounded-xl text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer shadow-none border-0 bg-transparent active:scale-95"
                    title={draft?.templateName ? `Back to ${draft.templateName} in Repository` : "Back to Documents"}
                    aria-label={draft?.templateName ? `Back to ${draft.templateName} in Repository` : "Back to Documents"}
                  >
                  <div className="relative flex items-center justify-center w-10 h-[46px] transition-transform group-hover:scale-105">
                    <FileText size={46} className="w-10 h-[46px] text-muted-foreground group-hover:opacity-0 transition-opacity" />
                    <ArrowLeft size={22} className="w-5.5 h-5.5 text-foreground absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity stroke-[2.2]" />
                  </div>
                </button>

                {/* Stacked 2-row block directly beside the document icon */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  {/* Row 1: Document Title + Telemetry */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {titleEditing ? (
                      <input
                        autoFocus
                        value={title}
                        onChange={e => handleTitleChange(e.target.value)}
                        onBlur={() => setTitleEditing(false)}
                        onKeyDown={e => { if (e.key === 'Enter') setTitleEditing(false); }}
                        className="text-base font-bold leading-tight bg-transparent border-b border-primary focus:outline-none text-foreground py-0.5 px-0.5 min-w-[180px] max-w-[480px] shrink-0"
                        maxLength={120}
                      />
                    ) : (
                      <button
                        onClick={() => !isLocked && setTitleEditing(true)}
                        className={cn(
                          'text-base font-bold leading-tight text-foreground text-left truncate min-w-[140px] max-w-[480px] shrink-0 transition-colors',
                          !isLocked && 'hover:text-primary cursor-text hover:underline decoration-dashed underline-offset-4'
                        )}
                        title={isLocked ? undefined : 'Click to rename'}
                      >
                        {title || 'Untitled Document'}
                      </button>
                    )}

                    <TelemetryStrip syncStatus={syncStatus} wordCount={wordCount} isLocked={isLocked} />
                  </div>

                  {/* Row 2: File Edit View Insert Format Tools sitting directly beneath Title */}
                  <div className="-ml-2 mt-0.5 flex items-center min-w-0">
                    {menuBar}
                  </div>
                </div>
              </div>

              {/* Right: Actions (History, Export, Submit) */}
              <div className="flex items-center gap-2 shrink-0 ml-4">

                {!isLocked && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Version history (Ctrl+Alt+H)"
                  >
                    <History className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                )}

                {/* Consolidated Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span>Export</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 border border-zinc-200/90 shadow-xl rounded-xl p-1.5 z-[150]"
                  >
                    <DropdownMenuItem
                      onClick={handleExportDocx}
                      className="cursor-pointer gap-2.5 px-3 py-2 rounded-lg text-zinc-900 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-xs text-zinc-900">Microsoft Word (.docx)</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Download editable Word file</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportPdf}
                      className="cursor-pointer gap-2.5 px-3 py-2 rounded-lg text-zinc-900 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900 transition-colors"
                    >
                      <Download className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-xs text-zinc-900">PDF Document (.pdf)</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Download printable PDF</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isLocked ? (
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-fg hover:bg-primary-hover shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Duplicate as Draft</span>
                  </button>
                ) : (
                  <button
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-fg hover:bg-primary-hover border border-primary shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-fg" />
                    ) : (
                      <Send className="w-4 h-4 text-primary-fg stroke-[2.2]" />
                    )}
                    <span>Submit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Conflict resolution banner */}
            {showConflictBanner && conflictLocal && conflictRemote && (
              <div className="px-4 py-2.5 bg-red-50/95 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900 z-30 shrink-0">
                <ConflictBanner
                  local={conflictLocal}
                  remote={conflictRemote}
                  storage={storageRef.current}
                  draftId={draft?.id ?? ''}
                  onResolved={handleConflictResolved}
                />
              </div>
            )}
          </div>
        );

      }}
        initialContent={draft?.content ?? [{ type: 'p', children: [{ text: '' }] }]}
        headerFooter={draft?.headerFooter}
        onHeaderFooterChange={handleHeaderFooterChange}
        onChange={handleEditorChange}
        readOnly={isLocked && !isReviewer}
        placeholder="Start writing your document..."
        mode={editorMode}
        onModeChange={setEditorMode}
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
    saved:    { icon: CheckCircle, label: 'Saved', color: 'text-emerald-500' },
    saving:   { icon: Loader2,     label: 'Saving…', color: 'text-muted-foreground', spin: true },
    offline:  { icon: WifiOff,     label: 'Offline', color: 'text-amber-500' },
    conflict: { icon: AlertTriangle, label: 'Conflict', color: 'text-red-500' },
    error:    { icon: AlertTriangle, label: 'Error', color: 'text-red-500' },
  };

  const cfg = statusConfig[syncStatus];
  const Icon = cfg.icon;

  if (isLocked) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        <span>Submitted</span>
        <span className="text-border">·</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>
    );
  }

  return (
    <div
      data-editor-telemetry
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Icon className={cn('w-3.5 h-3.5', cfg.color, (cfg as any).spin && 'animate-spin')} />
      <span className={cfg.color}>{cfg.label}</span>
      <span className="text-border">·</span>
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
  onResolved: (type: 'keep_local' | 'accept_cloud' | 'fork_local', newDraftId?: string) => void;
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
        onResolved(type, newId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Resolution failed.');
      } finally {
        setResolving(false);
      }
    },
    [local, onResolved, remote, resolving, storage]
  );

  return (
    <div
      data-conflict-banner
      className="flex flex-col gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm font-bold text-red-700 dark:text-red-400">Edit conflict detected</p>
      </div>
      <p className="text-xs text-red-600 dark:text-red-400">
        Your local changes conflict with a newer cloud version (Rev {remote.revision}). Choose how to resolve:
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => void resolve('keep_local')}
          disabled={resolving}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          Keep My Changes
        </button>
        <button
          onClick={() => void resolve('accept_cloud')}
          disabled={resolving}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          Accept Cloud Version
        </button>
        <button
          onClick={() => void resolve('fork_local')}
          disabled={resolving}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          Fork as Offline Copy
        </button>
      </div>
    </div>
  );
}

export default StudentDocumentEditor;
