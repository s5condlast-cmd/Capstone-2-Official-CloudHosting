'use client';

import * as React from 'react';
import {
  Grid3X3,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';
import { ToolbarButton } from './toolbar';

export function TableToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [hoverRow, setHoverRow] = React.useState(0);
  const [hoverCol, setHoverCol] = React.useState(0);

  const isInsideTable = useEditorSelector((ed) => {
    try {
      return Boolean(
        ed.api?.above?.({
          match: (n: any) => n.type === 'table',
        })
      );
    } catch {
      return false;
    }
  }, []);

  const handleInsertTable = (rows: number, cols: number) => {
    try {
      const tableRows = [];
      for (let r = 0; r < rows; r++) {
        const cells = [];
        for (let c = 0; c < cols; c++) {
          cells.push({
            type: r === 0 ? 'th' : 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          });
        }
        tableRows.push({ type: 'tr', children: cells });
      }

      editor?.tf?.insertNodes?.([
        {
          type: 'table',
          children: tableRows,
        },
      ]);
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }

    setOpen(false);
  };

  const handleInsertRow = (below = true) => {
    try {
      const trEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'tr' });
      if (!trEntry) return;
      const [trNode, trPath] = trEntry;
      const colCount = trNode.children?.length || 2;
      const newCells = Array.from({ length: colCount }, () => ({
        type: 'td',
        children: [{ type: 'p', children: [{ text: '' }] }],
      }));
      const insertPath = below ? [trPath[0], trPath[1] + 1] : trPath;
      editor?.tf?.insertNodes?.([{ type: 'tr', children: newCells }], { at: insertPath });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const handleDeleteRow = () => {
    try {
      const trEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'tr' });
      if (trEntry) {
        editor?.tf?.removeNodes?.({ at: trEntry[1] });
        editor?.tf?.focus?.();
      }
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const handleInsertCol = (right = true) => {
    try {
      const tdEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
      if (!tdEntry || !tableEntry) return;
      const colIdx = tdEntry[1][tdEntry[1].length - 1];
      const targetIdx = right ? colIdx + 1 : colIdx;
      const [tableNode, tablePath] = tableEntry;

      tableNode.children.forEach((row: any, rIdx: number) => {
        const cellType = rIdx === 0 && row.children[0]?.type === 'th' ? 'th' : 'td';
        const cellPath = [...tablePath, rIdx, targetIdx];
        editor?.tf?.insertNodes?.(
          [{ type: cellType, children: [{ type: 'p', children: [{ text: '' }] }] }],
          { at: cellPath }
        );
      });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const handleDeleteCol = () => {
    try {
      const tdEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
      if (!tdEntry || !tableEntry) return;
      const colIdx = tdEntry[1][tdEntry[1].length - 1];
      const [tableNode, tablePath] = tableEntry;

      tableNode.children.forEach((row: any, rIdx: number) => {
        if (colIdx < row.children.length) {
          editor?.tf?.removeNodes?.({ at: [...tablePath, rIdx, colIdx] });
        }
      });
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  const handleDeleteTable = () => {
    try {
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
      if (tableEntry) {
        editor?.tf?.removeNodes?.({ at: tableEntry[1] });
        editor?.tf?.focus?.();
      }
    } catch { /* non-fatal */ }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          active={isInsideTable}
          pressed={open}
          tooltip="Table"
          aria-label="Table"
          isDropdown
        >
          <Grid3X3 className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48 p-1.5" align="start">
        {/* Insert Table Grid Picker submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Grid3X3 className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span>Table</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-3">
            <div className="text-[11px] font-medium text-zinc-500 mb-2 text-center">
              {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol}` : 'Create Table'}
            </div>
            <div
              className="grid grid-cols-8 gap-1"
              onMouseLeave={() => {
                setHoverRow(0);
                setHoverCol(0);
              }}
            >
              {Array.from({ length: 8 }).map((_, r) =>
                Array.from({ length: 8 }).map((__, c) => {
                  const highlighted = r < hoverRow && c < hoverCol;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => {
                        setHoverRow(r + 1);
                        setHoverCol(c + 1);
                      }}
                      onClick={() => handleInsertTable(r + 1, c + 1)}
                      className={cn(
                        'w-4 h-4 rounded-xs border transition-colors cursor-pointer',
                        highlighted
                          ? 'border-primary bg-primary/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      )}
                    />
                  );
                })
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Row Operations */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            disabled={!isInsideTable}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
              !isInsideTable && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span>Row</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 p-1">
            <DropdownMenuItem onClick={() => handleInsertRow(false)} className="text-xs">
              Insert row above
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleInsertRow(true)} className="text-xs">
              Insert row below
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteRow} className="text-xs text-red-500">
              Delete row
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Column Operations */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            disabled={!isInsideTable}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
              !isInsideTable && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span>Column</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 p-1">
            <DropdownMenuItem onClick={() => handleInsertCol(false)} className="text-xs">
              Insert column left
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleInsertCol(true)} className="text-xs">
              Insert column right
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteCol} className="text-xs text-red-500">
              Delete column
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Delete Table */}
        <DropdownMenuItem
          disabled={!isInsideTable}
          onClick={handleDeleteTable}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 text-xs rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer',
            !isInsideTable && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete table</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

