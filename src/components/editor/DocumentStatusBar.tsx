import React from 'react';
import {
  CheckCircle2,
  Loader2,
  WifiOff,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface DocumentStatusBarProps {
  pageCount?: number;
  currentPage?: number;
  wordCount?: number;
  charCount?: number;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  syncStatus?: 'saved' | 'saving' | 'offline' | 'conflict' | 'error';
  isReadOnly?: boolean;
  className?: string;
}

/**
 * Google Docs / Microsoft Word style bottom telemetry status bar.
 * Displays page count (Page 1 of X), live word & character count,
 * cloud sync status, and zoom controls.
 */
export const DocumentStatusBar: React.FC<DocumentStatusBarProps> = ({
  pageCount = 1,
  currentPage = 1,
  wordCount = 0,
  charCount,
  zoomLevel = 100,
  onZoomChange,
  syncStatus = 'saved',
  isReadOnly = false,
  className,
}) => {
  const syncConfig = {
    saved: { icon: CheckCircle2, label: 'Saved to cloud', color: 'text-emerald-600 dark:text-emerald-400' },
    saving: { icon: Loader2, label: 'Saving…', color: 'text-muted-foreground', spin: true },
    offline: { icon: WifiOff, label: 'Offline (saved locally)', color: 'text-amber-500' },
    conflict: { icon: AlertTriangle, label: 'Revision conflict', color: 'text-red-500' },
    error: { icon: AlertTriangle, label: 'Save error', color: 'text-red-500' },
  };

  const status = syncConfig[syncStatus] || syncConfig.saved;
  const StatusIcon = status.icon;

  return (
    <footer
      data-document-statusbar="true"
      className={cn(
        'w-full h-8 px-4 bg-card/90 border-t border-border flex items-center justify-between text-xs text-muted-foreground select-none shrink-0 backdrop-blur-xs z-30 print:hidden',
        className
      )}
    >
      {/* Left: Page count & Word count */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            Page {currentPage} of {Math.max(1, pageCount)}
          </span>
        </div>

        <span className="text-border">|</span>

        <div className="flex items-center gap-1.5" title={charCount !== undefined ? `${charCount.toLocaleString()} characters` : undefined}>
          <span className="font-semibold text-foreground">{wordCount.toLocaleString()}</span>
          <span>{wordCount === 1 ? 'word' : 'words'}</span>
        </div>

        {isReadOnly && (
          <>
            <span className="text-border">|</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
              Read-Only
            </span>
          </>
        )}
      </div>

      {/* Right: Cloud Sync Status & Zoom Stepper */}
      <div className="flex items-center gap-4">
        {/* Cloud Sync Indicator */}
        <div className="flex items-center gap-1.5">
          <StatusIcon className={cn('w-3.5 h-3.5', status.color, (status as any).spin && 'animate-spin')} />
          <span className={cn('text-[11px] font-medium hidden sm:inline', status.color)}>
            {status.label}
          </span>
        </div>

        <span className="text-border hidden sm:inline">|</span>

        {/* Zoom Controls */}
        {onZoomChange && (
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              title="Zoom out"
              onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Reset to 100%"
              onClick={() => onZoomChange(100)}
              className="px-2 py-0.5 font-mono font-medium hover:bg-muted text-foreground rounded-lg cursor-pointer transition-colors"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              title="Zoom in"
              onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};
