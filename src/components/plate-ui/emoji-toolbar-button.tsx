'use client';

import * as React from 'react';
import { Smile } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToolbarButton } from './toolbar';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤩', '🥳', '😎'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '🙏', '💪', '👈', '👉', '👆', '👇', '✋', '👋', '✍️'],
  },
  {
    name: 'Objects & Symbols',
    emojis: ['⭐', '🌟', '✨', '💡', '📌', '📎', '✏️', '📝', '📁', '📅', '📊', '📈', '📉', '🔒', '🔑', '🎯', '🔥', '🎉', '✅', '❌'],
  },
];

export function EmojiToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const savedSelection = React.useRef<any>(null);

  React.useEffect(() => {
    if (open) {
      if (editor?.selection) {
        savedSelection.current = editor.selection;
      }
    }
  }, [open, editor]);

  const handleSelectEmoji = (emoji: string) => {
    try {
      if (savedSelection.current) {
        editor?.tf?.select?.(savedSelection.current);
      }
      editor?.tf?.focus?.();
      if (editor?.tf?.insertText) {
        editor.tf.insertText(emoji);
      } else if ((editor as any)?.insertText) {
        (editor as any).insertText(emoji);
      }
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip="Insert emoji"
          aria-label="Insert emoji"
          onMouseDown={() => {
            if (editor?.selection) {
              savedSelection.current = editor.selection;
            }
          }}
        >
          <Smile className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" align="start">
        <input
          type="text"
          placeholder="Search emojis..."
          value={filter}
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          className="w-full mb-2 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200"
        />

        <div className="max-h-56 overflow-y-auto space-y-3">
          {EMOJI_CATEGORIES.map((cat) => {
            const visibleEmojis = cat.emojis.filter((e) => !filter || e.includes(filter));
            if (visibleEmojis.length === 0) return null;
            return (
              <div key={cat.name}>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  {cat.name}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {visibleEmojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectEmoji(e)}
                      className="w-7 h-7 flex items-center justify-center text-base hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

