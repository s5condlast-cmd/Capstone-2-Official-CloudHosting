'use client';

import * as React from 'react';
import {
  Grid3X3,
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

  const savedSelection = React.useRef<any>(null);
  const savedTableInfo = React.useRef<{
    tablePath: number[];
    trPath: number[];
    tdPath: number[];
    colIdx: number;
    rowIdx: number;
    numCols: number;
    numRows: number;
  } | null>(null);

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

  // When dropdown opens, save selection and table path information
  React.useEffect(() => {
    if (open && editor) {
      savedSelection.current = editor.selection;
      try {
        const tableEntry = editor.api?.above?.({ match: (n: any) => n.type === 'table' });
        const trEntry = editor.api?.above?.({ match: (n: any) => n.type === 'tr' });
        const tdEntry = editor.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });

        if (tableEntry && trEntry && tdEntry) {
          const [tableNode, tablePath] = tableEntry;
          const [trNode, trPath] = trEntry;
          const [, tdPath] = tdEntry;
          savedTableInfo.current = {
            tablePath,
            trPath,
            tdPath,
            colIdx: tdPath[tdPath.length - 1],
            rowIdx: trPath[trPath.length - 1],
            numCols: trNode.children?.length || 2,
            numRows: tableNode.children?.length || 2,
          };
        }
      } catch {
        // non-fatal
      }
    }
  }, [open, editor]);

  const handleInsertTable = (rows: number, cols: number) => {
    try {
      if (savedSelection.current && !editor.selection) {
        editor.tf.select(savedSelection.current);
      }
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
    } catch {
      // non-fatal
    }

    setOpen(false);
  };

  const handleInsertRow = (below = true) => {
    try {
      const info = savedTableInfo.current;
      const trEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'tr' });
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });

      let insertPath: number[];
      let colCount = 2;

      if (trEntry && tableEntry) {
        const [trNode, trPath] = trEntry;
        colCount = trNode.children?.length || 2;
        const rowIndex = trPath[trPath.length - 1];
        insertPath = [...trPath.slice(0, -1), rowIndex + (below ? 1 : 0)];
      } else if (info) {
        colCount = info.numCols;
        insertPath = [...info.tablePath, info.rowIdx + (below ? 1 : 0)];
      } else {
        return;
      }

      const newCells = Array.from({ length: colCount }, () => ({
        type: 'td',
        children: [{ type: 'p', children: [{ text: '' }] }],
      }));

      editor?.tf?.insertNodes?.([{ type: 'tr', children: newCells }], { at: insertPath });
      editor?.tf?.focus?.();
    } catch {
      // non-fatal
    }
    setOpen(false);
  };

  const handleDeleteRow = () => {
    try {
      const trEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'tr' });
      const info = savedTableInfo.current;

      if (trEntry) {
        editor?.tf?.removeNodes?.({ at: trEntry[1] });
      } else if (info) {
        editor?.tf?.removeNodes?.({ at: info.trPath });
      }
      editor?.tf?.focus?.();
    } catch {
      // non-fatal
    }
    setOpen(false);
  };

  const handleInsertCol = (right = true) => {
    try {
      const tdEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
      const info = savedTableInfo.current;

      let tablePath: number[];
      let numRows: number;
      let targetIdx: number;

      if (tdEntry && tableEntry) {
        const colIdx = tdEntry[1][tdEntry[1].length - 1];
        targetIdx = right ? colIdx + 1 : colIdx;
        tablePath = tableEntry[1];
        numRows = tableEntry[0].children?.length || 2;
      } else if (info) {
        targetIdx = right ? info.colIdx + 1 : info.colIdx;
        tablePath = info.tablePath;
        numRows = info.numRows;
      } else {
        return;
      }

      for (let r = 0; r < numRows; r++) {
        const cellType = r === 0 ? 'th' : 'td';
        editor?.tf?.insertNodes?.(
          [{ type: cellType, children: [{ type: 'p', children: [{ text: '' }] }] }],
          { at: [...tablePath, r, targetIdx] }
        );
      }
      editor?.tf?.focus?.();
    } catch {
      // non-fatal
    }
    setOpen(false);
  };

  const handleDeleteCol = () => {
    try {
      const tdEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'td' || n.type === 'th' });
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
      const info = savedTableInfo.current;

      let tablePath: number[];
      let colIdx: number;
      let numRows: number;

      if (tdEntry && tableEntry) {
        colIdx = tdEntry[1][tdEntry[1].length - 1];
        tablePath = tableEntry[1];
        numRows = tableEntry[0].children?.length || 2;
      } else if (info) {
        colIdx = info.colIdx;
        tablePath = info.tablePath;
        numRows = info.numRows;
      } else {
        return;
      }

      for (let r = 0; r < numRows; r++) {
        editor?.tf?.removeNodes?.({ at: [...tablePath, r, colIdx] });
      }
      editor?.tf?.focus?.();
    } catch {
      // non-fatal
    }
    setOpen(false);
  };

  const handleDeleteTable = () => {
    try {
      const tableEntry = editor?.api?.above?.({ match: (n: any) => n.type === 'table' });
      const info = savedTableInfo.current;

      if (tableEntry) {
        editor?.tf?.removeNodes?.({ at: tableEntry[1] });
      } else if (info) {
        editor?.tf?.removeNodes?.({ at: info.tablePath });
      }
      editor?.tf?.focus?.();
    } catch {
      // non-fatal
    }
    setOpen(false);
  };

  const canEditTable = isInsideTable || Boolean(savedTableInfo.current);

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

      <DropdownMenuContent className="w-48 p-1.5 shadow-xl border border-zinc-200 dark:border-zinc-800" align="start">
        {/* Insert Table Grid Picker submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Grid3X3 className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span>Table</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-3 shadow-xl border border-zinc-200 dark:border-zinc-800">
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
            disabled={!canEditTable}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
              !canEditTable && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span>Row</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
            <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => handleInsertRow(false)} className="text-xs cursor-pointer">
              Insert row above
            </DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => handleInsertRow(true)} className="text-xs cursor-pointer">
              Insert row below
            </DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={handleDeleteRow} className="text-xs text-red-500 cursor-pointer">
              Delete row
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Column Operations */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            disabled={!canEditTable}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
              !canEditTable && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span>Column</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 p-1 shadow-lg border border-zinc-200 dark:border-zinc-800">
            <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => handleInsertCol(false)} className="text-xs cursor-pointer">
              Insert column left
            </DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => handleInsertCol(true)} className="text-xs cursor-pointer">
              Insert column right
            </DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={handleDeleteCol} className="text-xs text-red-500 cursor-pointer">
              Delete column
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Delete Table */}
        <DropdownMenuItem
          disabled={!canEditTable}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDeleteTable}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 text-xs rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer',
            !canEditTable && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete table</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
