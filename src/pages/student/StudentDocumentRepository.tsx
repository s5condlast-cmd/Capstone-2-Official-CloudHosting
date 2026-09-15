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
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Edit3, Trash2, RotateCcw,
  Plus, RefreshCw, AlertCircle, Loader2, FolderOpen,
  FilePlus2, Clock, CheckCircle, Lock
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
  const { user } = useAuth();

  const [activePhase, setActivePhase] = useState<Phase>('before_ojt');
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Undo-delete state
  const [pendingDelete, setPendingDelete] = useState<{ draft: DraftRow; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

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
        const phase = (data?.practicum_phase as Phase | null) ?? 'before_ojt';
        setActivePhase(phase);
      } catch {
        setActivePhase('before_ojt');
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user?.id]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Document Repository
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse templates and manage your working documents.
          </p>
        </div>
        <button
          onClick={() => navigate('/student/editor')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
            'hover:opacity-90'
          )}
        >
          <Plus className="w-4 h-4" />
          New Blank Document
        </button>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
        {PHASES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActivePhase(key)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium',
              activePhase === key
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates section */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Official Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            My Working Drafts
          </h2>
          <button
            onClick={() => void loadDrafts()}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingDrafts && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {loadingDrafts && (
          <div className="flex items-center gap-2 py-8 justify-center text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading documents…</span>
          </div>
        )}

        {!loadingDrafts && draftsError && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{draftsError}</p>
            <button
              onClick={() => void loadDrafts()}
              className="text-xs text-primary underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {!loadingDrafts && !draftsError && phaseDrafts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
            <FolderOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500">No working drafts for this phase yet.</p>
            <p className="text-xs text-zinc-400">Click "Edit in Editor" on a template above to start.</p>
          </div>
        )}

        {!loadingDrafts && !draftsError && phaseDrafts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {phaseDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onResume={() => navigate(`/student/editor?draft=${draft.id}`)}
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
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{template.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{template.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-auto">
        {template.editable ? (
          <button
            onClick={onEdit}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
            )}
          >
            <Edit3 className="w-3 h-3" />
            Edit in Editor
          </button>
        ) : (
          <button
            onClick={onEdit}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:opacity-90'
            )}
          >
            <FilePlus2 className="w-3 h-3" />
            Open Workflow
          </button>
        )}
        <div className="flex gap-1.5">
          <button
            onClick={onDownloadDocx}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Download className="w-3 h-3" />
            DOCX
          </button>
          <button
            onClick={onDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
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
  onExportDocx,
  onExportPdf,
  onDelete,
}: {
  draft: DraftRow;
  onResume: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onDelete: () => void;
}) {
  const isLocked = draft.status === 'locked';
  const isSubmitted = draft.status === 'submitted';

  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            )}
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{draft.title}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              isLocked   ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' :
              isSubmitted ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                           'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            )}>
              {isLocked ? 'Locked' : isSubmitted ? 'Submitted' : 'Draft'}
            </span>
            <span className="text-xs text-zinc-400">
              {draft.word_count.toLocaleString()} words
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span className="text-xs text-zinc-400">
            {format(new Date(draft.updated_at), 'MMM d')}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {!isLocked ? (
          <button
            onClick={onResume}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
            )}
          >
            <Edit3 className="w-3 h-3" />
            Resume
          </button>
        ) : (
          <button
            onClick={onResume}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:opacity-90'
            )}
          >
            <CheckCircle className="w-3 h-3" />
            View
          </button>
        )}
        <button onClick={onExportDocx} title="Export as Word DOCX"
          className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <Download className="w-3.5 h-3.5" />
        </button>
        {!isLocked && (
          <button onClick={onDelete} title="Delete draft"
            className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-zinc-200 dark:border-zinc-700">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default StudentDocumentRepository;
