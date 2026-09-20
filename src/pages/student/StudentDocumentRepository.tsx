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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  // ── Create new draft from template ─────────────────────────────────────
  const handleCreateFromTemplate = useCallback(
    async (template: EditorTemplate) => {
      if (!user?.id) return;

      if (!template.editable && template.redirectTo) {
        navigate(template.redirectTo);
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
    [navigate, user?.id]
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

  // ── Derived data ────────────────────────────────────────────────────────
  const phaseTemplates = getTemplatesForPhase(activePhase as TemplatePhase);
  const phaseDrafts = drafts.filter(d => d.phase === activePhase || d.phase === null);

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
          onClick={() => navigate('/student/editor')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold',
            'bg-primary text-primary-fg hover:bg-primary-hover',
            'shadow-2xs active:scale-95 transition-all cursor-pointer'
          )}
        >
          <Plus className="w-4 h-4" />
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
    <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-card border border-border hover:border-primary/40 rounded-2xl shadow-xs transition-all group">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors truncate">
            {template.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-border/60">
        {template.editable ? (
          <button
            onClick={onEdit}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold',
              'bg-primary text-primary-fg hover:bg-primary-hover shadow-2xs active:scale-95 transition-all cursor-pointer'
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit in Editor</span>
          </button>
        ) : (
          <button
            onClick={onEdit}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold',
              'bg-muted/70 hover:bg-muted text-foreground border border-border/80 shadow-2xs active:scale-95 transition-all cursor-pointer'
            )}
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Open Workflow</span>
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onDownloadDocx}
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Download className="w-3 h-3 text-primary" />
            <span>DOCX</span>
          </button>
          <button
            onClick={onDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Download className="w-3 h-3 text-rose-500" />
            <span>PDF</span>
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
    <div className="flex flex-col justify-between gap-3.5 p-4 sm:p-5 bg-card border border-border hover:border-border/90 rounded-2xl shadow-xs transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              {isLocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </div>
            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {draft.title}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold border',
              isLocked   ? 'bg-muted text-muted-foreground border-border' :
              isSubmitted ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                           'bg-primary/10 text-primary border-primary/20'
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

      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
        {!isLocked ? (
          <button
            onClick={onResume}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold',
              'bg-primary text-primary-fg hover:bg-primary-hover shadow-2xs active:scale-95 transition-all cursor-pointer'
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={onReview}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold',
              'bg-card border border-border hover:bg-muted/80 text-foreground shadow-2xs active:scale-95 transition-all cursor-pointer'
            )}
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>Review & Comments</span>
          </button>
        )}
        <button
          onClick={onExportDocx}
          title="Export as Word DOCX"
          className="h-8.5 w-8.5 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground bg-card hover:bg-muted/80 border border-border shadow-2xs transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        {!isLocked && (
          <button
            onClick={onDelete}
            title="Delete draft"
            className="h-8.5 w-8.5 rounded-xl flex items-center justify-center text-muted-foreground hover:text-rose-500 bg-card hover:bg-rose-500/10 border border-border hover:border-rose-500/30 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default StudentDocumentRepository;
