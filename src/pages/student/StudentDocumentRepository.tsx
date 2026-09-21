/**
 * StudentDocumentRepository.tsx
 * Phase 5: Student Document Repository page — /student/documents
 *
 * - Loads drafts from IndexedDB first, reconciles with Supabase
 * - Phase tabs derived from profiles.practicum_phase (never mock state)
 * - Loading, empty, offline, conflict, retry states
 * - Draft actions: Resume, Export Word, Export PDF, Soft Delete + 10s undo
 * - Template actions: Download DOCX, Download PDF, Edit in Editor
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Download, Edit3, Trash2, RotateCcw,
  Plus, RefreshCw, AlertCircle, Loader2, FolderOpen,
  FilePlus2, Clock, CheckCircle, Lock, Eye
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { templateStorage } from '@/src/lib/templateStorage';
import { EDITOR_TEMPLATES, EditorTemplate, TemplatePhase, getTemplatesForPhase } from '@/src/config/editorTemplates';
import { titleToFilename } from '@/src/lib/sanitizeDocumentFilename';
import { clearAllDraftCacheForUser } from '@/src/lib/documentHistoryStorage';
import { downloadDocx } from '@/src/components/editor/serializers/docxSerializer';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftRow {
  id: string;
  user_id: string;
  title: string;
  template_id: string | null;
  template_name: string | null;
  phase: string | null;
  content: object[];
  word_count: number;
  revision: number;
  status: 'draft' | 'submitted' | 'locked';
  submission_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

type Phase = 'before_ojt' | 'in_ojt' | 'final';

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASES: { key: Phase; label: string }[] = [
  { key: 'before_ojt', label: 'Before OJT' },
  { key: 'in_ojt',     label: 'In OJT' },
  { key: 'final',      label: 'Final' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentDocumentRepository() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phaseQuery = searchParams.get('phase') as Phase | null;
  const { user } = useAuth();

  const [activePhase, setActivePhase] = useState<Phase>(() => {
    if (phaseQuery === 'before_ojt' || phaseQuery === 'in_ojt' || phaseQuery === 'final') {
      return phaseQuery;
    }
    return 'before_ojt';
  });
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Undo-delete state
  const [pendingDelete, setPendingDelete] = useState<{ draft: DraftRow; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  // Sync activePhase if searchParam changes
  useEffect(() => {
    if (phaseQuery === 'before_ojt' || phaseQuery === 'in_ojt' || phaseQuery === 'final') {
      setActivePhase(phaseQuery);
    }
  }, [phaseQuery]);

  // ── Load profile phase ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoadingProfile(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('practicum_phase')
          .eq('id', user.id)
          .single();
        if (!phaseQuery) {
          const phase = (data?.practicum_phase as Phase | null) ?? 'before_ojt';
          setActivePhase(phase);
        }
      } catch {
        if (!phaseQuery) setActivePhase('before_ojt');
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user?.id, phaseQuery]);

  // ── Load drafts from Supabase ───────────────────────────────────────────
  const loadDrafts = useCallback(async () => {
    if (!user?.id) return;
    setLoadingDrafts(true);
    setDraftsError(null);
    try {
      const { data, error } = await supabase
        .from('editor_drafts')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw new Error(error.message);
      setDrafts((data ?? []) as DraftRow[]);
      setIsOffline(false);
    } catch (e) {
      setDraftsError(e instanceof Error ? e.message : 'Could not load your documents.');
      setIsOffline(true);
    } finally {
      setLoadingDrafts(false);
    }
  }, [user?.id]);

  useEffect(() => { void loadDrafts(); }, [loadDrafts]);

  // ── Create or resume draft from template ───────────────────────────────
  const handleCreateFromTemplate = useCallback(
    async (template: EditorTemplate) => {
      if (!user?.id) return;

      if (!template.editable && template.redirectTo) {
        navigate(template.redirectTo);
        return;
      }

      // Re-use single active draft if it already exists for this template
      const existingDraft = drafts.find(d =>
        ((d.template_id && d.template_id.trim().toLowerCase() === template.id.trim().toLowerCase()) ||
         (d.template_name && d.template_name.trim().toLowerCase() === template.name.trim().toLowerCase())) &&
        d.status !== 'locked'
      );
      if (existingDraft) {
        navigate(`/student/editor?draft=${existingDraft.id}`);
        return;
      }

      const draftId = crypto.randomUUID();
      try {
        const { error } = await supabase.rpc('create_editor_draft', {
          p_id: draftId,
          p_title: template.name,
          p_template_id: template.id,
          p_template_name: template.name,
          p_phase: template.phase,
          p_content: template.seedContent,
          p_word_count: 0,
        });
        if (error) throw new Error(error.message);

        navigate(`/student/editor?draft=${draftId}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not create document. Please retry.');
      }
    },
    [drafts, navigate, user?.id]
  );

  // ── Download template file ──────────────────────────────────────────────
  const handleDownloadTemplate = useCallback(
    async (templateId: string, type: 'docx' | 'pdf') => {
      try {
        const buffer = type === 'pdf'
          ? await templateStorage.getTemplatePdfBackup(templateId)
          : await templateStorage.getTemplateFile(templateId);

        if (!buffer) {
          toast.error('This template file is not yet available.');
          return;
        }

        const url = URL.createObjectURL(new Blob([buffer]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateId}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Download failed. Please retry.');
      }
    },
    []
  );

  // ── Soft delete draft ───────────────────────────────────────────────────
  const handleSoftDelete = useCallback(
    (draft: DraftRow) => {
      // Optimistically remove from list
      setDrafts(prev => prev.filter(d => d.id !== draft.id));

      const timeoutId = setTimeout(async () => {
        // Commit the delete to the server
        try {
          const { error } = await supabase.rpc('soft_delete_editor_draft', {
            p_draft_id: draft.id,
            p_expected_revision: draft.revision,
          });
          if (error) {
            // Restore if delete failed
            setDrafts(prev => [draft, ...prev].sort((a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            ));
            toast.error('Could not delete draft. It has been restored.');
          }
        } catch {
          setDrafts(prev => [draft, ...prev]);
          toast.error('Delete failed. Draft restored.');
        }
        setPendingDelete(null);
      }, 10000);

      setPendingDelete({ draft, timeoutId });
      toast.success('Draft moved to trash.', {
        action: {
          label: 'Undo',
          onClick: () => {
            clearTimeout(timeoutId);
            setPendingDelete(null);
            setDrafts(prev => [draft, ...prev].sort((a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            ));
            toast.success('Draft restored.');
          },
        },
        duration: 10000,
      });
    },
    []
  );

  // ── Export draft as DOCX ────────────────────────────────────────────────
  const handleExportDocx = useCallback(
    async (draft: DraftRow) => {
      try {
        await downloadDocx(draft.content as any[], draft.title);
      } catch (e) {
        toast.error('DOCX export failed. Please try again.');
      }
    },
    []
  );

  // ── Open or resume blank document ──────────────────────────────────────
  const handleOpenBlankDocument = useCallback(async () => {
    if (!user?.id) return;

    // Check if an existing unsubmitted blank draft exists
    const existingBlank = drafts.find(d => !d.template_id && d.status !== 'locked');
    if (existingBlank) {
      navigate(`/student/editor?draft=${existingBlank.id}`);
      return;
    }

    const draftId = crypto.randomUUID();
    try {
      const { error } = await supabase.rpc('create_editor_draft', {
        p_id: draftId,
        p_title: 'Untitled Document',
        p_template_id: null,
        p_template_name: null,
        p_phase: null,
        p_content: [{ type: 'p', children: [{ text: '' }] }],
        p_word_count: 0,
      });
      if (error) throw new Error(error.message);

      navigate(`/student/editor?draft=${draftId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create document.');
    }
  }, [drafts, navigate, user?.id]);

  // ── Derived data (deduplicated so only 1 working draft per template is displayed) ──
  const phaseTemplates = getTemplatesForPhase(activePhase as TemplatePhase);
  const phaseDrafts = useMemo(() => {
    const raw = drafts.filter(d => d.phase === activePhase || d.phase === null);
    const seen = new Set<string>();
    const result: DraftRow[] = [];
    for (const d of raw) {
      const key = d.template_id || `blank_${d.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(d);
      }
    }
    return result;
  }, [activePhase, drafts]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Document Repository
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse institutional templates and manage your working practicum drafts.
          </p>
        </div>
        <button
          onClick={handleOpenBlankDocument}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Blank Document</span>
        </button>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1.5 p-1 bg-muted/60 border border-border/80 rounded-xl w-fit">
        {PHASES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActivePhase(key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activePhase === key
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-0.5">
          Official Institutional Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {phaseTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => handleCreateFromTemplate(template)}
              onDownloadDocx={() => handleDownloadTemplate(template.id, 'docx')}
              onDownloadPdf={() => handleDownloadTemplate(template.id, 'pdf')}
            />
          ))}
        </div>
      </section>

      {/* Drafts section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            My Working Drafts
          </h2>
          <button
            onClick={() => void loadDrafts()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingDrafts && 'animate-spin text-primary')} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingDrafts && (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm">Loading documents…</span>
          </div>
        )}

        {!loadingDrafts && draftsError && (
          <div className="flex flex-col items-center gap-3 py-8 text-center bg-card border border-rose-500/20 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm text-foreground">{draftsError}</p>
            <button
              onClick={() => void loadDrafts()}
              className="text-xs text-primary font-semibold underline underline-offset-4 hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {!loadingDrafts && !draftsError && phaseDrafts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 border border-dashed border-border/80 bg-muted/10 rounded-2xl text-center">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderOpen className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No working drafts for this phase yet.</p>
            <p className="text-xs text-muted-foreground">Click "Edit in Editor" on a template above to start drafting.</p>
          </div>
        )}

        {!loadingDrafts && !draftsError && phaseDrafts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {phaseDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onResume={() => navigate(`/student/editor?draft=${draft.id}`)}
                onReview={() => {
                  if (draft.submission_id) {
                    navigate(`/student/review/${draft.submission_id}`);
                  } else {
                    navigate(`/student/editor?draft=${draft.id}`);
                  }
                }}
                onExportDocx={() => void handleExportDocx(draft)}
                onExportPdf={() => { navigate(`/student/editor?draft=${draft.id}&print=1`); }}
                onDelete={() => handleSoftDelete(draft)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDownloadDocx,
  onDownloadPdf,
}: {
  template: EditorTemplate;
  onEdit: () => void;
  onDownloadDocx: () => void;
  onDownloadPdf: () => void;
}) {
  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-card border border-border hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl shadow-xs transition-all group">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug group-hover:text-foreground transition-colors truncate">
            {template.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-border/60">
        {template.editable ? (
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            Edit in Editor
          </button>
        ) : (
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:opacity-90 cursor-pointer"
          >
            <FilePlus2 className="w-3 h-3" />
            Open Workflow
          </button>
        )}
        <div className="flex gap-1.5">
          <button
            onClick={onDownloadDocx}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            DOCX
          </button>
          <button
            onClick={onDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DraftCard ────────────────────────────────────────────────────────────────

function DraftCard({
  draft,
  onResume,
  onReview,
  onExportDocx,
  onExportPdf,
  onDelete,
}: {
  draft: DraftRow;
  onResume: () => void;
  onReview: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onDelete: () => void;
}) {
  const isLocked = draft.status === 'locked';
  const isSubmitted = draft.status === 'submitted';

  return (
    <div className="flex flex-col justify-between gap-3.5 p-4 sm:p-5 bg-card border border-border hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl shadow-xs transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              {isLocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </div>
            <p className="text-sm font-bold text-foreground truncate group-hover:text-foreground transition-colors">
              {draft.title}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold border',
              isLocked   ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700' :
              isSubmitted ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' :
                           'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
            )}>
              {isLocked ? 'Locked' : isSubmitted ? 'Submitted' : 'Draft'}
            </span>
            <span className="text-xs text-muted-foreground">
              {draft.word_count.toLocaleString()} words
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>
            {format(new Date(draft.updated_at), 'MMM d')}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 pt-2 border-t border-border/60">
        {!isLocked ? (
          <button
            onClick={onResume}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            Resume
          </button>
        ) : (
          <button
            onClick={onReview}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            Review & Comments
          </button>
        )}
        <button
          onClick={onExportDocx}
          title="Export as Word DOCX"
          className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        {!isLocked && (
          <button
            onClick={onDelete}
            title="Delete draft"
            className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default StudentDocumentRepository;
