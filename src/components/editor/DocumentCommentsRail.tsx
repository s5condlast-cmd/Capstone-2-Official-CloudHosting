/**
 * DocumentCommentsRail.tsx
 * Google Docs style docked right rail displaying comment cards, feedback, and discussion threads.
 *
 * Requirements from GOOGLE_DOCS_EDITOR_UI_PLAN.md:
 * - 300–360px docked right rail
 * - Soft comment cards with avatar, author, institutional role badge, relative time, and text
 * - Selected text quote pill in warm amber/yellow tint
 * - Resolve, unresolve, and delete controls
 * - Composer for adding new comments
 * - Tab switcher for Active vs. Resolved comments
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MessageSquare,
  MessageSquarePlus,
  CheckCircle2,
  Trash2,
  Send,
  User,
  Quote,
  Clock,
  Check,
  RotateCcw,
  PanelRightClose,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { type EditorComment } from '@/src/components/plate-ui/fixed-toolbar-buttons';

export interface DocumentCommentsRailProps {
  open: boolean;
  onClose: () => void;
  comments: EditorComment[];
  onAddComment: (text: string, selectedText?: string) => void;
  onResolveComment?: (id: string) => void;
  onUnresolveComment?: (id: string) => void;
  onDeleteComment?: (id: string) => void;
  selectedText?: string;
  onClearSelectedText?: () => void;
  currentUserRole?: 'student' | 'adviser' | 'supervisor' | 'admin';
  currentUserName?: string;
  className?: string;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
  },
  adviser: {
    label: 'Adviser',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  },
  supervisor: {
    label: 'Supervisor',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  },
  student: {
    label: 'Student',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  },
};

export function DocumentCommentsRail({
  open,
  onClose,
  comments = [],
  onAddComment,
  onResolveComment,
  onUnresolveComment,
  onDeleteComment,
  selectedText,
  onClearSelectedText,
  currentUserRole = 'student',
  currentUserName = 'User',
  className,
}: DocumentCommentsRailProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [newCommentText, setNewCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  useEffect(() => {
    if (open && (selectedText || activeComments.length === 0)) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, selectedText, activeComments.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), selectedText);
    setNewCommentText('');
    onClearSelectedText?.();
  };

  if (!open) return null;

  return (
    <aside
      className={cn(
        'w-80 shrink-0 bg-card/95 backdrop-blur-md',
        'border-l border-border flex flex-col',
        'h-full select-none print:hidden transition-all duration-200 ease-in-out',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Comments</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            ({activeComments.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close comments rail"
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/40 px-2 pt-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors cursor-pointer',
            activeTab === 'active'
              ? 'border-primary text-primary bg-card font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Active ({activeComments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resolved')}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors cursor-pointer',
            activeTab === 'resolved'
              ? 'border-primary text-primary bg-card font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Resolved ({resolvedComments.length})
        </button>
      </div>

      {/* New Comment Box (Active Tab Only) */}
      {activeTab === 'active' && (
        <form onSubmit={handleSubmit} className="p-3 border-b border-border bg-primary/5">
          {selectedText && (
            <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <Quote className="w-3 h-3" /> Quoted selection:
                </span>
                <button
                  type="button"
                  onClick={onClearSelectedText}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-muted-foreground line-clamp-2 italic">
                "{selectedText}"
              </p>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a comment or remark..."
              rows={2}
              className={cn(
                'w-full text-xs p-2.5 rounded-xl border border-border',
                'bg-background text-foreground',
                'focus:outline-none focus:ring-1 focus:ring-primary resize-none pr-8 placeholder:text-muted-foreground'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              title="Post comment (Ctrl+Enter)"
              className={cn(
                'absolute right-2 bottom-2 p-1 rounded-lg transition-colors cursor-pointer',
                newCommentText.trim()
                  ? 'bg-primary text-primary-fg hover:bg-primary-hover shadow-2xs'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Comment as {currentUserName} ({currentUserRole})</span>
            <span>Ctrl+Enter to post</span>
          </div>
        </form>
      )}

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {(activeTab === 'active' ? activeComments : resolvedComments).length > 0 ? (
          (activeTab === 'active' ? activeComments : resolvedComments).map((comment) => {
            const roleBadge = ROLE_BADGES[comment.authorRole || 'student'] || ROLE_BADGES.student;
            return (
              <div
                key={comment.id}
                className={cn(
                  'p-3.5 rounded-2xl border text-xs shadow-2xs space-y-2 transition-all',
                  comment.resolved
                    ? 'bg-muted/40 border-border/60 opacity-75'
                    : 'bg-card border-border hover:border-border/90'
                )}
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-foreground truncate">
                      {comment.author}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] px-1 py-0.2 rounded border font-medium uppercase',
                        roleBadge.className
                      )}
                    >
                      {roleBadge.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {comment.createdAt}
                  </span>
                </div>

                {/* Quoted Text if available */}
                {comment.selectedText && (
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border-l-2 border-amber-500 text-[11px] text-foreground/80 italic line-clamp-2">
                    "{comment.selectedText}"
                  </div>
                )}

                {/* Comment Text */}
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {comment.text}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60">
                  {comment.resolved ? (
                    onUnresolveComment && (
                      <button
                        type="button"
                        onClick={() => onUnresolveComment(comment.id)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Re-open
                      </button>
                    )
                  ) : (
                    onResolveComment && (
                      <button
                        type="button"
                        onClick={() => onResolveComment(comment.id)}
                        className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Resolve
                      </button>
                    )
                  )}

                  {onDeleteComment && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
            <MessageSquare className="w-6 h-6 mx-auto stroke-[1.5] text-muted-foreground/50" />
            <p>
              {activeTab === 'active'
                ? 'No active comments. Highlight text to add feedback.'
                : 'No resolved comments.'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

