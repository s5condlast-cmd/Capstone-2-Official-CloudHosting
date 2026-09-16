import React from 'react';
import { cn } from '@/src/lib/utils';

export interface DocumentRulerProps {
  /** Paper width in pixels (defaults to 816 for US Letter at 96 DPI) */
  width?: number;
  /** Left margin in pixels (defaults to 96 for 1 inch) */
  leftMargin?: number;
  /** Right margin in pixels (defaults to 96 for 1 inch) */
  rightMargin?: number;
  /** Zoom percentage (defaults to 100) */
  zoom?: number;
  className?: string;
}

/**
 * Google Docs & Microsoft Word style horizontal ruler.
 * Displays inch divisions (1-7), tick marks (1/8", 1/4", 1/2"),
 * shaded 1-inch margin gutters on left and right, and draggable/visual indent markers.
 */
export const DocumentRuler: React.FC<DocumentRulerProps> = ({
  width = 816,
  leftMargin = 96,
  rightMargin = 96,
  zoom = 100,
  className,
}) => {
  // Total width in inches (8.5 inches for 816px at 96 DPI)
  const totalInches = 8.5;
  const pixelsPerInch = 96;
  const printableWidth = width - leftMargin - rightMargin; // 624px (6.5 inches)

  // Generate tick marks for each 1/8th inch (12px each)
  const totalTicks = Math.floor(width / 12);
  const ticks = Array.from({ length: totalTicks + 1 }, (_, i) => {
    const px = i * 12;
    const isInch = i % 8 === 0;
    const isHalfInch = i % 4 === 0 && !isInch;
    const isQuarterInch = i % 2 === 0 && !isInch && !isHalfInch;
    const inchNumber = isInch ? i / 8 : null;

    return {
      index: i,
      px,
      isInch,
      isHalfInch,
      isQuarterInch,
      inchNumber,
    };
  });

  return (
    <div
      data-document-ruler="true"
      className={cn(
        'relative select-none pointer-events-none transition-all print:hidden',
        className
      )}
      style={{
        width: `${width}px`,
        height: '24px',
      }}
    >
      {/* Outer Ruler Bar Frame */}
      <div className="relative w-full h-full flex bg-zinc-200 dark:bg-zinc-800 border-x border-t border-zinc-300 dark:border-zinc-700/80 rounded-t-xs overflow-hidden shadow-2xs">
        {/* Left Margin Gutter (Shaded 1 inch / 96px) */}
        <div
          style={{ width: `${leftMargin}px` }}
          className="h-full bg-zinc-300/85 dark:bg-zinc-800/95 border-r border-zinc-400/50 dark:border-zinc-700 relative shrink-0"
        />

        {/* Central Printable Area (White / Bright 6.5 inches / 624px) */}
        <div
          style={{ width: `${printableWidth}px` }}
          className="h-full bg-white dark:bg-zinc-900 relative shrink-0"
        />

        {/* Right Margin Gutter (Shaded 1 inch / 96px) */}
        <div
          style={{ width: `${rightMargin}px` }}
          className="h-full bg-zinc-300/85 dark:bg-zinc-800/95 border-l border-zinc-400/50 dark:border-zinc-700 relative shrink-0"
        />

        {/* Tick Marks & Numbers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {ticks.map(({ index, px, isInch, isHalfInch, isQuarterInch, inchNumber }) => {
            // Numbers are displayed for inches 1 through 7
            const showNumber = isInch && inchNumber !== null && inchNumber >= 1 && inchNumber <= 7;

            return (
              <React.Fragment key={index}>
                {/* Tick Mark Line */}
                <div
                  className={cn(
                    'absolute bottom-0 w-px bg-zinc-400 dark:bg-zinc-600',
                    isInch && 'h-2.5 bg-zinc-600 dark:bg-zinc-400',
                    isHalfInch && 'h-2 bg-zinc-500 dark:bg-zinc-500',
                    isQuarterInch && 'h-1.5 bg-zinc-400/80 dark:bg-zinc-600',
                    !isInch && !isHalfInch && !isQuarterInch && 'h-1 bg-zinc-300 dark:bg-zinc-700'
                  )}
                  style={{ left: `${px}px` }}
                />

                {/* Inch Number Label */}
                {showNumber && (
                  <span
                    className="absolute top-0.5 text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 -translate-x-1/2 select-none"
                    style={{ left: `${px}px` }}
                  >
                    {inchNumber}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Left Indent Marker (First-line bar + Left indent triangle at 1 inch / 96px) */}
        <div
          className="absolute bottom-0 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto cursor-ew-resize group"
          style={{ left: `${leftMargin}px` }}
          title="Left Indent (1.0 inch)"
        >
          {/* First Line Indent Rectangle */}
          <div className="w-2.5 h-1 bg-blue-600 dark:bg-blue-500 rounded-2xs mb-0.5 shadow-2xs group-hover:scale-125 transition-transform" />
          {/* Hanging / Left Indent Down Triangle */}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-blue-600 dark:border-t-blue-500 group-hover:scale-125 transition-transform" />
        </div>

        {/* Right Indent Marker (Down triangle at 7.5 inches / 720px) */}
        <div
          className="absolute bottom-0 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto cursor-ew-resize group"
          style={{ left: `${width - rightMargin}px` }}
          title="Right Indent (7.5 inches)"
        >
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-blue-600 dark:border-t-blue-500 group-hover:scale-125 transition-transform" />
        </div>
      </div>
    </div>
  );
};
