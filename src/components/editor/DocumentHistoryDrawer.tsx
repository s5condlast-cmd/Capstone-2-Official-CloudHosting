/**
 * DocumentHistoryDrawer.tsx
 * Version history panel for the Plate.js document editor.
 *
 * Shows the list of saved versions (from document_versions table).
 * Allows selecting a version to preview and restoring it (with OCC check).
 */
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Clock, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { unwrapContentEnvelope } from '@/src/lib/documentHistoryStorage';
import type { DocumentHeaderFooterOptions } from '@/src/components/editor/serializers/docxSerializer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentVersion {
  version_id: string;
  doc_id: string;
  title: string;
  content: object[];
  word_count: number;
  label: string | null;
  source_revision: number;
  saved_at: string;
}

interface DocumentHistoryDrawerProps {
  draftId: string;
  currentRevision: number;
  onBeforeRestore?: () => Promise<number>;
  onClose: () => void;
  onRestoreComplete: (newContent: object[], newRevision: number, newTitle: string, newHeaderFooter?: DocumentHeaderFooterOptions) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentHistoryDrawer({
  draftId,
  currentRevision,
  onBeforeRestore,
  onClose,
  onRestoreComplete,
}: DocumentHistoryDrawerProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // ── Load versions ─────────────────────────────────────────────────────────
  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('document_versions')
        .select('*')
        .eq('doc_id', draftId)
        .order('saved_at', { ascending: false })
        .limit(20);

      if (err) throw new Error(err.message);
      setVersions((data ?? []) as DocumentVersion[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load version history.');
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  // ── Restore a version ─────────────────────────────────────────────────────
  const handleRestore = useCallback(
    async (version: DocumentVersion) => {
      if (restoring) return;
      const confirmed = window.confirm(
        `Restore "${version.label ?? 'this version'}" (saved ${formatDistanceToNow(new Date(version.saved_at))} ago)?\n\nA safety snapshot of your current content will be saved first.`
      );
      if (!confirmed) return;

      setRestoring(true);
      try {
        const expectedRevision = onBeforeRestore
          ? await onBeforeRestore()
          : currentRevision;
        const { data, error: err } = await supabase.rpc('restore_editor_version', {
          p_version_id: version.version_id,
          p_expected_revision: expectedRevision,
        });
        if (err) throw new Error(err.message);

        const restored = data as { id: string; title: string; content: object[]; revision: number };
        const { content: unwrappedContent, headerFooter: unwrappedHF } = unwrapContentEnvelope(restored.content);
        onRestoreComplete(unwrappedContent, restored.revision, restored.title, unwrappedHF);
        toast.success('Version restored successfully.');
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Restore failed. Please retry.');
      } finally {
        setRestoring(false);
      }
    },
    [currentRevision, onBeforeRestore, onClose, onRestoreComplete, restoring]
  );

  // Escape key handler (stops propagation so parent fullscreen is not exited)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const selectedVersion = versions.find(v => v.version_id === selectedId) ?? null;

  const drawerContent = (
    <div className="fixed inset-0 z-[125] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'relative z-[130]',
          'w-full max-w-sm h-full',
          'bg-card',
          'border-l border-border',
          'flex flex-col shadow-2xl animate-in slide-in-from-right duration-200'
        )}
        aria-label="Document version history"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Version History</span>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Close history"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading history…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 p-4 text-rose-500 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && versions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground text-sm text-center px-4">
            <Clock className="w-8 h-8 opacity-40 text-muted-foreground" />
            <p className="font-semibold text-foreground">No saved versions yet.</p>
            <p className="text-xs">Versions are created automatically or when you click "Save Version".</p>
          </div>
        )}

        {!loading && !error && versions.map((version) => {
          const isSelected = version.version_id === selectedId;
          const savedDate = new Date(version.saved_at);

          return (
            <div
              key={version.version_id}
              onClick={() => setSelectedId(isSelected ? null : version.version_id)}
              className={cn(
                'px-4 py-3 cursor-pointer border-b border-border/60 transition-colors',
                'hover:bg-muted/50',
                isSelected && 'bg-muted/80'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {version.label && (
                      <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-foreground truncate">
                      {version.label ?? 'Auto-save'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(savedDate, 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {version.word_count.toLocaleString()} words · Rev {version.source_revision}
                  </p>
                </div>
              </div>

              {/* Expanded restore button */}
              {isSelected && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); void handleRestore(version); }}
                    disabled={restoring}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
                      'bg-primary text-primary-fg hover:bg-primary-hover shadow-2xs transition-all cursor-pointer',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {restoring ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    Restore this version
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Up to 20 versions are kept. Older versions are removed automatically.
        </p>
      </div>
    </aside>
  </div>
  );

  return createPortal(drawerContent, document.body);
}

export default DocumentHistoryDrawer;
