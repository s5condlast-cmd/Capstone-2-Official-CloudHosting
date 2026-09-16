'use client';

import * as React from 'react';
import { MessageSquareText, Plus, Trash2 } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/src/lib/utils';
import { ToolbarButton } from './toolbar';

export interface CommentItem {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  selectedText?: string;
  resolved?: boolean;
}

export interface CommentToolbarButtonProps {
  comments?: CommentItem[];
  onAddComment?: (comment: CommentItem) => void;
  onResolveComment?: (id: string) => void;
}

export function CommentToolbarButton({
  comments = [],
  onAddComment,
  onResolveComment,
}: CommentToolbarButtonProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [selectedQuote, setSelectedQuote] = React.useState('');

  const activeComments = comments.filter((c) => !c.resolved);

  React.useEffect(() => {
    if (open) {
      try {
        const text = editor?.api?.string?.(editor.selection) || '';
        setSelectedQuote(text);
      } catch {
        setSelectedQuote('');
      }
    }
  }, [open, editor]);

  const handleAdd = () => {
    if (!commentText.trim()) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      text: commentText.trim(),
      author: 'Student',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedText: selectedQuote || undefined,
    };

    onAddComment?.(newComment);
    setCommentText('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          active={open || activeComments.length > 0}
          tooltip={activeComments.length > 0 ? `${activeComments.length} Comment(s)` : 'Add Comment'}
          aria-label="Comments"
          className="relative"
        >
          <MessageSquareText className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
          {activeComments.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">
              {activeComments.length}
            </span>
          )}
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="end">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Comments & Notes ({activeComments.length})
            </span>
          </div>

          {selectedQuote && (
            <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border-l-2 border-primary text-[11px] text-zinc-600 dark:text-zinc-300 italic truncate">
              "{selectedQuote}"
            </div>
          )}

          {/* New comment input */}
          <div className="flex flex-col gap-2">
            <textarea
              rows={2}
              placeholder="Write a note or comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full p-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={!commentText.trim()}
                onClick={handleAdd}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-primary text-primary-fg disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {/* Existing comments list */}
          {activeComments.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {activeComments.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{c.author}</span>
                    <span>{c.createdAt}</span>
                  </div>
                  <p className="text-zinc-800 dark:text-zinc-200">{c.text}</p>
                  {onResolveComment && (
                    <button
                      type="button"
                      onClick={() => onResolveComment(c.id)}
                      className="self-end text-[10px] text-zinc-400 hover:text-red-500 inline-flex items-center gap-1 pt-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

