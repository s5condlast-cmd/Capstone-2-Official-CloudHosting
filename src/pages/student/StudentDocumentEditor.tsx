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
  History, FileText, Users, ShieldCheck, ArrowLeft, RefreshCw,
  FileSearch, Mic, MicOff
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
import { EditorAiProofreadDrawer } from '@/src/components/editor/EditorAiProofreadDrawer';
import { EditorPreSubmitModal } from '@/src/components/editor/EditorPreSubmitModal';
import { generateEditorReviewArtifacts } from '@/src/lib/editorReviewArtifacts';
import {
  submitReviewDocument,
  fetchRequirementDefinitions,
  FALLBACK_REQUIREMENT_DEFINITIONS,
  type ReviewRequirementDefinition,
} from '@/src/lib/reviewSubmissionService';
import { speechToTextService, polishDictationWithGemini } from '@/src/lib/speechToTextService';
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
  const [versionCount, setVersionCount] = useState<number>(0);

  const loadVersionCount = useCallback(async (draftId: string) => {
    try {
      const { count, error } = await supabase
        .from('document_versions')
        .select('*', { count: 'exact', head: true })
        .eq('doc_id', draftId);
      if (!error && typeof count === 'number') {
        setVersionCount(count);
      }
    } catch {
      // non-fatal
    }
  }, []);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [showConflictBanner, setShowConflictBanner] = useState(false);
  const [conflictLocal, setConflictLocal] = useState<DraftState | null>(null);
  const [conflictRemote, setConflictRemote] = useState<DraftState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [remoteUpdate, setRemoteUpdate] = useState<{
    content: object[];
    revision: number;
    title: string;
    headerFooter?: DocumentHeaderFooterOptions;
    wordCount?: number;
  } | null>(null);

  // ── Writing Studio & Review Submission State ─────────────────────────────
  const [showProofread, setShowProofread] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [showPreSubmitModal, setShowPreSubmitModal] = useState(false);
  const [requirementsList, setRequirementsList] = useState<ReviewRequirementDefinition[]>([]);
  const [studentProfile, setStudentProfile] = useState<{
    hasAdviser: boolean;
    hasSupervisor: boolean;
    adviserName?: string;
    supervisorName?: string;
  } | null>(null);

  // ── Fullscreen Tracking & Safe Navigation ────────────────────────────────
  const isFullscreenRef = useRef(false);
  const exitFullscreenRef = useRef<(() => void) | null>(null);
  const isDirtyRef = useRef(false);

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
        if (storageRef.current && isDirtyRef.current) {
          await Promise.race([
            storageRef.current.flushNow('Saved before exit', 1000),
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
  const applyRemoteStateRef = useRef<((content: object[], revision: number, remoteTitle: string, headerFooter?: DocumentHeaderFooterOptions, remoteWC?: number, isSilent?: boolean) => void) | null>(null);

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
            isDirtyRef.current = false;
            setDraft((current) => current
              ? { ...current, revision: saved.revision, updatedAt: saved.updatedAt }
              : current
            );
          },
          onVersionCreated: () => {
            if (loadedDraft) void loadVersionCount(loadedDraft.id);
          },
          onAutoReconciled: () => {
            toast.info('Document synced with cloud. Previous version backed up to History.', {
              duration: 4000,
            });
            if (loadedDraft) void loadVersionCount(loadedDraft.id);
          },
          onRemoteUpdate: (remoteContent, remoteRevision, remoteTitle, remoteHF, remoteWC) => {
            if (storageRef.current && storageRef.current.getCloudRevision() >= remoteRevision) {
              return;
            }
            // If the current tab has NO unsaved changes, auto-sync silently without bothering user
            if (!isDirtyRef.current) {
              applyRemoteStateRef.current?.(remoteContent, remoteRevision, remoteTitle, remoteHF, remoteWC, true);
              return;
            }
            // Document updated in another tab and current tab has unsaved edits. Guard against stale overwrites and prompt user
            setRemoteUpdate({
              content: remoteContent,
              revision: remoteRevision,
              title: remoteTitle,
              headerFooter: remoteHF,
              wordCount: remoteWC,
            });
          },
        });
        await storage.load(loadedDraft.revision, loadedDraft.content);
        storageRef.current = storage;
        void loadVersionCount(loadedDraft.id);

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

  // ── Load Requirements Catalog & Reviewer Information ─────────────────────
  useEffect(() => {
    async function loadReviewerData() {
      if (!user) return;
      try {
        const [reqs, profileRes] = await Promise.all([
          fetchRequirementDefinitions().catch((err) => {
            console.warn('[StudentDocumentEditor] Using fallback requirement definitions:', err);
            return FALLBACK_REQUIREMENT_DEFINITIONS;
          }),
          Promise.resolve(
            supabase
              .from('profiles')
              .select('id, full_name, adviser_id, supervisor_id')
              .eq('id', user.id)
              .maybeSingle()
          ).catch((err) => {
            console.warn('[StudentDocumentEditor] Failed to fetch student profile:', err);
            return { data: null, error: err };
          }),
        ]);

        const resolvedReqs = reqs && reqs.length > 0 ? reqs : FALLBACK_REQUIREMENT_DEFINITIONS;
        setRequirementsList(resolvedReqs);

        const profile = profileRes?.data;
        let adviserName = '';
        let supervisorName = '';
        if (profile?.adviser_id) {
          try {
            const { data: adv } = await supabase.from('profiles').select('full_name').eq('id', profile.adviser_id).maybeSingle();
            if (adv) adviserName = adv.full_name;
          } catch (e) {
            console.warn('[StudentDocumentEditor] Failed to fetch adviser name:', e);
          }
        }
        if (profile?.supervisor_id) {
          try {
            const { data: sup } = await supabase.from('profiles').select('full_name').eq('id', profile.supervisor_id).maybeSingle();
            if (sup) supervisorName = sup.full_name;
          } catch (e) {
            console.warn('[StudentDocumentEditor] Failed to fetch supervisor name:', e);
          }
        }

        setStudentProfile({
          hasAdviser: Boolean(profile?.adviser_id),
          hasSupervisor: Boolean(profile?.supervisor_id),
          adviserName,
          supervisorName,
        });
      } catch (e) {
        console.warn('Failed to load reviewer metadata:', e);
        setRequirementsList(FALLBACK_REQUIREMENT_DEFINITIONS);
      }
    }
    loadReviewerData();
  }, [user]);

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

  const applyRemoteState = useCallback(
    (
      content: object[],
      revision: number,
      remoteTitle: string,
      headerFooter?: DocumentHeaderFooterOptions,
      remoteWC?: number,
      isSilent: boolean = false
    ) => {
      if (!storageRef.current || !draftRef.current || !user) return;
      const currentDraft = draftRef.current;

      const nextDraft: LocalDraft = {
        ...currentDraft,
        content,
        revision,
        title: remoteTitle,
        headerFooter: headerFooter ?? currentDraft.headerFooter,
        wordCount: remoteWC ?? currentDraft.wordCount,
        updatedAt: new Date().toISOString(),
      };

      const nextState: DraftState = {
        id: currentDraft.id,
        userId: user.id,
        title: remoteTitle,
        templateId: currentDraft.templateId ?? undefined,
        templateName: currentDraft.templateName ?? undefined,
        phase: currentDraft.phase ?? undefined,
        content,
        headerFooter: headerFooter ?? currentDraft.headerFooter,
        wordCount: remoteWC ?? currentDraft.wordCount,
        revision,
        status: currentDraft.status,
        submissionId: currentDraft.submissionId,
        createdAt: currentDraft.createdAt,
        updatedAt: new Date().toISOString(),
      };

      storageRef.current.applyRemoteUpdate(revision, content, nextState);

      setDraft(nextDraft);
      setTitle(remoteTitle);
      if (remoteWC != null) setWordCount(remoteWC);

      isDirtyRef.current = false;
      setEditorEpoch((v) => v + 1);
      setRemoteUpdate(null);

      if (isSilent) {
        toast.info('Document synced with updates from another tab.', { duration: 3000 });
      } else {
        toast.success('Document updated with latest changes from another tab.');
      }
    },
    [user]
  );
  applyRemoteStateRef.current = applyRemoteState;

  // ── Multi-Tab remote update apply ─────────────────────────────────────────
  const handleApplyRemoteUpdate = useCallback(() => {
    if (!remoteUpdate) return;
    const { content, revision, title: remoteTitle, headerFooter, wordCount: remoteWC } = remoteUpdate;
    applyRemoteState(content, revision, remoteTitle, headerFooter, remoteWC, false);
  }, [applyRemoteState, remoteUpdate]);

  // ── Editor content change ────────────────────────────────────────────────
  const handleEditorChange = useCallback(
    (content: object[], wc: number) => {
      if (!draftRef.current || !storageRef.current || !user) return;
      isDirtyRef.current = true;
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
      isDirtyRef.current = true;
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
      isDirtyRef.current = true;
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
      if (draftRef.current) void loadVersionCount(draftRef.current.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save version.');
    }
  }, [loadVersionCount]);

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
      void loadVersionCount(draft.id);
    },
    [draft, loadVersionCount]
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

  // ── Voice Dictation (Streaming Word-by-Word into Plate Editor) ───────────
  const dictatedWordCountRef = useRef<number>(0);

  const handleToggleDictation = useCallback(() => {
    if (isDictating) {
      speechToTextService.stopListening();
      setIsDictating(false);
      dictatedWordCountRef.current = 0;
      toast.info('Voice dictation stopped.');
    } else {
      dictatedWordCountRef.current = 0;
      // Pre-focus editor so insertion cursor is established
      editorRef.current?.insertText?.('');

      const started = speechToTextService.startListening({
        onResult: (transcript, isFinal) => {
          if (!transcript || !transcript.trim()) return;

          const words = transcript.trim().split(/\s+/).filter(Boolean);
          if (words.length > dictatedWordCountRef.current) {
            const newWords = words.slice(dictatedWordCountRef.current);
            const chunk = newWords.join(' ') + ' ';
            editorRef.current?.insertText(chunk);
            dictatedWordCountRef.current = words.length;
          }

          if (isFinal) {
            dictatedWordCountRef.current = 0;
          }
        },
        onError: (err) => {
          toast.error(err);
          setIsDictating(false);
          dictatedWordCountRef.current = 0;
        },
        onEnd: () => {
          setIsDictating(false);
          dictatedWordCountRef.current = 0;
        },
      });

      if (started) {
        setIsDictating(true);
        toast.success('Voice dictation active. Speak clearly into your mic.');
      }
    }
  }, [isDictating]);

  // Clean up speech recognition if user navigates away while dictating
  useEffect(() => {
    return () => {
      if (speechToTextService.isListening()) {
        speechToTextService.stopListening();
      }
    };
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!draft || !user || submitting) return;
    if (draft.status === 'locked') {
      toast.error('This document has already been submitted.');
      return;
    }
    setShowPreSubmitModal(true);
  }, [draft, submitting, user]);

  const handleConfirmSubmit = useCallback(async (options: {
    requirementId: string;
    remarks?: string;
    attachSourceDocx: boolean;
  }) => {
    if (!draft || !user || submitting) return;

    setSubmitting(true);
    try {
      // 1. Flush pending draft revision
      const savedDraft = storageRef.current
        ? await storageRef.current.flushNow()
        : null;
      const expectedRevision = savedDraft?.revision
        ?? storageRef.current?.getCloudRevision()
        ?? draft.revision;

      // 2. Generate PDF and source DOCX with consistent line & paragraph spacing
      const content = editorRef.current?.getContent() ?? draft.content;
      const headerFooter = editorRef.current?.getHeaderFooter?.() ?? draft.headerFooter;
      const editorDom = document.querySelector('[data-slate-editor="true"]') as HTMLElement | null;

      const artifacts = await generateEditorReviewArtifacts({
        content: content as any[],
        title,
        headerFooter,
        editorElement: editorDom,
      });

      // 3. Submit PDF to trusted backend endpoint
      const result = await submitReviewDocument({
        requirementId: options.requirementId,
        title,
        pdfFile: artifacts.pdf,
        filename: artifacts.pdf.name,
        sourceDocxFile: options.attachSourceDocx ? artifacts.sourceDocx : undefined,
        sourceFilename: options.attachSourceDocx ? artifacts.sourceDocx.name : undefined,
        draftId: draft.id,
        expectedDraftRevision: expectedRevision,
        remarks: options.remarks,
      });

      // 4. Update local draft state
      setDraft((prev) => prev ? {
        ...prev,
        revision: expectedRevision,
        status: 'locked',
        submissionId: result.case_id,
      } : prev);

      setShowPreSubmitModal(false);
      toast.success('Document submitted successfully for review!');
      navigate(`/student/reviews?caseId=${result.case_id}`);
    } catch (e: any) {
      toast.error(e?.message || 'Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  }, [draft, navigate, submitting, title, user]);

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
                  <>
                    {speechToTextService.isSupported() && (
                      <button
                        type="button"
                        onClick={handleToggleDictation}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95 cursor-pointer',
                          isDictating
                            ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 animate-pulse'
                            : 'border-border bg-card text-foreground hover:bg-muted/80 shadow-2xs'
                        )}
                        title={isDictating ? 'Stop Voice Dictation' : 'Voice Dictation (Speech to Text)'}
                      >
                        {isDictating ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4 text-muted-foreground" />}
                        <span className="hidden md:inline">{isDictating ? 'Listening...' : 'Voice'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowProofread(prev => !prev)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95 cursor-pointer',
                        showProofread
                          ? 'bg-primary/10 text-primary border-primary/30 shadow-2xs'
                          : 'border-border bg-card text-foreground hover:bg-muted/80 shadow-2xs'
                      )}
                      title="Analyze Document Writing"
                    >
                      <FileSearch className="w-4 h-4 text-primary" />
                      <span className="hidden sm:inline">Analyze</span>
                    </button>

                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Version history (Ctrl+Alt+H)"
                    >
                      <History className="w-4 h-4 text-primary" />
                      <span className="hidden sm:inline">History</span>
                      {versionCount > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 leading-none">
                          {versionCount}
                        </span>
                      )}
                    </button>
                  </>
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

            {/* Multi-Tab Remote Update Banner */}
            {remoteUpdate && !showConflictBanner && (
              <div
                data-remote-update-banner
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-100 z-30 shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="font-medium truncate">
                    Document updated in another tab (Rev {remoteUpdate.revision}).
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleApplyRemoteUpdate}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer shadow-2xs"
                  >
                    Click to reload
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoteUpdate(null)}
                    className="px-2 py-1 text-xs text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-lg transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
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

      {/* AI Proofread Drawer */}
      <EditorAiProofreadDrawer
        isOpen={showProofread}
        onClose={() => setShowProofread(false)}
        getContent={() => editorRef.current?.getContent() ?? draft?.content ?? []}
        content={editorRef.current?.getContent() ?? draft?.content ?? []}
        title={title}
        requirementId={draft?.templateId || undefined}
        onApplySuggestion={(s) => {
          if (editorRef.current) {
            const success = editorRef.current.replaceText(s.originalText, s.suggestion);
            if (success) {
              toast.success(`Applied fix: "${s.suggestion}"`);
            } else {
              editorRef.current.insertText(` ${s.suggestion} `);
              toast.info(`Inserted: "${s.suggestion}"`);
            }
          }
        }}
      />

      {/* Real-time Voice Dictation Floating Indicator */}
      {isDictating && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 rounded-full shadow-2xl backdrop-blur-sm border border-white/10 dark:border-black/10 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <span>Listening... words appear live in editor</span>
          <button
            type="button"
            onClick={handleToggleDictation}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-white/20 dark:bg-black/15 hover:bg-white/30 dark:hover:bg-black/25 text-[11px] font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {/* Pre-Submit Compliance Audit Dialog */}
      {showPreSubmitModal && draft && (
        <EditorPreSubmitModal
          isOpen={showPreSubmitModal}
          onClose={() => setShowPreSubmitModal(false)}
          onConfirmSubmit={handleConfirmSubmit}
          title={title}
          content={editorRef.current?.getContent() ?? draft.content ?? []}
          defaultRequirementId={draft.templateId || undefined}
          requirements={requirementsList}
          studentProfile={studentProfile}
          submitting={submitting}
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
