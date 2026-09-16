'use client';

import * as React from 'react';
import { Link2, ExternalLink, Unlink } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToolbarButton } from './toolbar';

export function LinkToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const [text, setText] = React.useState('');

  const activeLinkNode = useEditorSelector((ed) => {
    try {
      const entry = ed.api?.above?.({
        match: (n: any) => n.type === 'a',
      });
      return entry ? entry[0] : null;
    } catch {
      return null;
    }
  }, []);

  const isLinkActive = Boolean(activeLinkNode);

  React.useEffect(() => {
    if (open) {
      if (activeLinkNode) {
        setUrl(String((activeLinkNode as any).url || ''));
        setText(
          (activeLinkNode as any).children?.[0]?.text || ''
        );
      } else {
        setUrl('');
        try {
          const selected = editor?.api?.string?.(editor.selection) || '';
          setText(selected);
        } catch {
          setText('');
        }
      }
    }
  }, [open, activeLinkNode, editor]);

  const handleSave = () => {
    if (!url.trim()) return;
    const finalUrl = /^(https?:|mailto:|tel:)/i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;

    try {
      if (isLinkActive) {
        editor?.tf?.setNodes?.(
          { url: finalUrl },
          { match: (n: any) => n.type === 'a' }
        );
      } else {
        const displayText = text.trim() || finalUrl;
        editor?.tf?.insertNodes?.([
          { type: 'a', url: finalUrl, children: [{ text: displayText }] },
        ]);
      }
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }

    setOpen(false);
  };

  const handleUnlink = () => {
    try {
      editor?.tf?.unwrapNodes?.({ match: (n: any) => n.type === 'a' });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          active={isLinkActive}
          tooltip={isLinkActive ? 'Edit link' : 'Insert link (Ctrl+K)'}
          aria-label="Link"
        >
          <Link2 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="start">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {isLinkActive ? 'Edit link' : 'Insert link'}
            </span>
            {isLinkActive && (
              <div className="flex items-center gap-1">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    title="Open link in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="p-1 rounded text-zinc-400 hover:text-red-500"
                  title="Remove link"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-zinc-500">URL</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-zinc-500">Text to display</label>
            <input
              type="text"
              placeholder="Link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2.5 py-1 text-xs rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!url.trim()}
              onClick={handleSave}
              className="px-3 py-1 text-xs font-semibold rounded bg-primary text-primary-fg disabled:opacity-40"
            >
              {isLinkActive ? 'Update' : 'Insert'}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
