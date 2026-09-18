/**
 * DocumentOutline.tsx
 * Google Docs style collapsible left rail for Document Outline & Heading Navigation.
 *
 * Requirements from GOOGLE_DOCS_EDITOR_UI_PLAN.md:
 * - "Document outline" header with collapse control
 * - Current document title row
 * - Live heading tree (H1, H2, H3) extracted from Slate body content
 * - Clicking a heading scrolls smoothly to that heading in the document canvas
 * - Empty state hint: "Headings you add to the document will appear here."
 */
import React, { useMemo } from 'react';
import {
  PanelLeftClose,
  FileText,
  Bookmark,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface OutlineItem {
  id: string;
  type: 'h1' | 'h2' | 'h3';
  text: string;
  depth: number;
}

export interface DocumentOutlineProps {
  content: object[];
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DocumentOutline({
  content,
  documentTitle,
  isOpen,
  onClose,
  className,
}: DocumentOutlineProps) {
  // Extract headings from content tree
  const outlineItems = useMemo<OutlineItem[]>(() => {
    const items: OutlineItem[] = [];

    function extractText(node: any): string {
      if (typeof node.text === 'string') return node.text;
      if (Array.isArray(node.children)) {
        return node.children.map(extractText).join('');
      }
      return '';
    }

    function walk(nodes: any[]): void {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (node && typeof node === 'object') {
          const type = node.type;
          if (type === 'h1' || type === 'h2' || type === 'h3') {
            const text = extractText(node).trim();
            if (text) {
              const depth = type === 'h1' ? 0 : type === 'h2' ? 1 : 2;
              items.push({
                id: `heading-${items.length}`,
                type,
                text,
                depth,
              });
            }
          }
          if (Array.isArray(node.children)) {
            walk(node.children);
          }
        }
      }
    }

    walk(content);
    return items;
  }, [content]);

  const handleHeadingClick = (item: OutlineItem, index: number) => {
    try {
      // Find all heading elements in the document paper container
      const headings = document.querySelectorAll(
        '.plate-paper-sheet h1, .plate-paper-sheet h2, .plate-paper-sheet h3'
      );
      if (headings[index]) {
        headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // Fallback: match by text content
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].textContent?.trim() === item.text) {
          headings[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
      }
    } catch { /* non-fatal */ }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        'w-64 shrink-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md',
        'border-r border-zinc-200 dark:border-zinc-800 flex flex-col',
        'h-full select-none print:hidden transition-all duration-200 ease-in-out',
        className
      )}
    >
      {/* Outline Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          <AlignLeft className="w-4 h-4 text-zinc-500" />
          <span>Document outline</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close outline"
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Active Document Title */}
      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate">
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate" title={documentTitle}>
            {documentTitle || 'Untitled Document'}
          </span>
        </div>
      </div>

      {/* Heading Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {outlineItems.length > 0 ? (
          outlineItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleHeadingClick(item, idx)}
              style={{ paddingLeft: `${item.depth * 14 + 8}px` }}
              className={cn(
                'w-full text-left py-1.5 pr-2 rounded-md text-xs transition-colors truncate block group',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800/70',
                item.depth === 0
                  ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                  : item.depth === 1
                  ? 'font-medium text-zinc-700 dark:text-zinc-300'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
              title={item.text}
            >
              <span className="truncate group-hover:text-primary transition-colors">
                {item.text}
              </span>
            </button>
          ))
        ) : (
          <div className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 space-y-2">
            <Bookmark className="w-6 h-6 mx-auto stroke-[1.5] text-zinc-300 dark:text-zinc-600" />
            <p>Headings you add to the document will appear here.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

