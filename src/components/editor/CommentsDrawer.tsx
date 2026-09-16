/**
 * CommentsDrawer.tsx
 * Multi-role comments and feedback side drawer for student document reviews.
 * Supports Student, Adviser, Supervisor, and Admin authors with institutional role badges.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  MessageSquarePlus,
  CheckCircle2,
  Trash2,
  CornerDownRight,
  Send,
  User,
  Quote,
  Clock,
  Check,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { type EditorComment } from '@/src/components/plate-ui/fixed-toolbar-buttons';

export interface CommentsDrawerProps {
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

export function CommentsDrawer({
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
}: CommentsDrawerProps) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newCommentText.trim()) return;

    onAddComment(newCommentText.trim(), selectedText || undefined);
    setNewCommentText('');
    onClearSelectedText?.();
  };

  const displayedList = activeTab === 'active' ? activeComments : resolvedComments;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      role="dialog"
      aria-label="Document comments"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Comments
          </h2>
          {activeComments.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary">
              {activeComments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close comments drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-5 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'py-2.5 px-3 border-b-2 transition-colors',
            activeTab === 'active'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          Active ({activeComments.length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={cn(
            'py-2.5 px-3 border-b-2 transition-colors',
            activeTab === 'resolved'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          Resolved ({resolvedComments.length})
        </button>
      </div>

      {/* New Comment Input Section */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {selectedText && (
            <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-1.5 min-w-0">
                <Quote className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span className="italic line-clamp-2">"{selectedText}"</span>
              </div>
              <button
                type="button"
                onClick={onClearSelectedText}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0"
                title="Remove quote"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                selectedText
                  ? 'Add a comment about the selected text…'
                  : 'Add general document feedback or a note…'
              }
              rows={3}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span>Posting as:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
                {currentUserName}
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded-md border',
                  ROLE_BADGES[currentUserRole]?.className || ROLE_BADGES.student.className
                )}
              >
                {ROLE_BADGES[currentUserRole]?.label || 'Student'}
              </span>
            </div>

            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-fg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              <Send className="w-3 h-3" />
              <span>Comment</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">
              {activeTab === 'active' ? 'No active comments' : 'No resolved comments'}
            </p>
            <p className="text-xs mt-1 max-w-[200px]">
              {activeTab === 'active'
                ? 'Highlight any text in the document or write a note above to start a discussion.'
                : 'Resolved comments will appear here for reference.'}
            </p>
          </div>
        ) : (
          displayedList.map((item) => {
            const roleBadge = ROLE_BADGES[item.authorRole || 'student'] || ROLE_BADGES.student;

            return (
              <div
                key={item.id}
                className={cn(
                  'p-3.5 rounded-xl border transition-all space-y-2',
                  item.resolved
                    ? 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-80'
                    : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 shadow-xs'
                )}
              >
                {/* Author Info & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-200 shrink-0">
                      {item.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.author}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 text-[10px] font-medium rounded-md border shrink-0',
                        roleBadge.className
                      )}
                    >
                      {roleBadge.label}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {item.createdAt}
                  </span>
                </div>

                {/* Quoted Text if any */}
                {item.selectedText && (
                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border-l-2 border-primary/60 text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2">
                    "{item.selectedText}"
                  </div>
                )}

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {item.text}
                </p>

                {/* Footer Controls: Resolve / Re-open / Delete */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                  {item.resolved ? (
                    <button
                      type="button"
                      onClick={() => onUnresolveComment?.(item.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Re-open comment"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-open</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onResolveComment?.(item.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="Mark as resolved"
                    >
                      <Check className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>
                  )}

                  {onDeleteComment && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(item.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
