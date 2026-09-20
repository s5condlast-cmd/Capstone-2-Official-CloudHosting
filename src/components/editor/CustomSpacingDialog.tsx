import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CustomSpacingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialLineHeight?: number | string;
  initialSpaceBefore?: number;
  initialSpaceAfter?: number;
  onApply: (values: {
    lineHeight: string;
    spaceBefore: number;
    spaceAfter: number;
  }) => void;
}

/**
 * Authentic Google Docs Custom Spacing Dialog (Matching media_1789892399567.png).
 * Allows users to customize line spacing multiple (e.g. 1.15, 1.5, 2.0)
 * and paragraph spacing in points before/after with notched outline fields.
 */
export const CustomSpacingDialog: React.FC<CustomSpacingDialogProps> = ({
  isOpen,
  onClose,
  initialLineHeight = '1.15',
  initialSpaceBefore = 0,
  initialSpaceAfter = 8,
  onApply,
}) => {
  const [lineSpacingVal, setLineSpacingVal] = useState<string>(String(initialLineHeight));
  const [spaceBeforeVal, setSpaceBeforeVal] = useState<string>(String(initialSpaceBefore));
  const [spaceAfterVal, setSpaceAfterVal] = useState<string>(String(initialSpaceAfter));

  useEffect(() => {
    if (isOpen) {
      setLineSpacingVal(String(initialLineHeight || '1.15'));
      setSpaceBeforeVal(String(initialSpaceBefore ?? 0));
      setSpaceAfterVal(String(initialSpaceAfter ?? 8));
    }
  }, [isOpen, initialLineHeight, initialSpaceBefore, initialSpaceAfter]);

  const handleApply = () => {
    const parsedLine = parseFloat(lineSpacingVal);
    const validLine = isNaN(parsedLine) || parsedLine <= 0 ? '1.15' : String(parsedLine);

    const parsedBefore = parseFloat(spaceBeforeVal);
    const validBefore = isNaN(parsedBefore) || parsedBefore < 0 ? 0 : parsedBefore;

    const parsedAfter = parseFloat(spaceAfterVal);
    const validAfter = isNaN(parsedAfter) || parsedAfter < 0 ? 0 : parsedAfter;

    onApply({
      lineHeight: validLine,
      spaceBefore: validBefore,
      spaceAfter: validAfter,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-custom-spacing-dialog
        className="sm:max-w-[340px] p-6 rounded-2xl bg-card border border-border shadow-2xl z-[160]"
      >
        <DialogHeader className="p-0 text-left">
          <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
            Custom spacing
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-3">
          {/* 1. Line spacing input with floating notch label */}
          <div className="relative mt-2">
            <input
              id="custom-line-spacing"
              type="number"
              step="0.05"
              min="0.5"
              max="10"
              value={lineSpacingVal}
              onChange={(e) => setLineSpacingVal(e.target.value)}
              className="w-full h-11 px-3.5 pt-1 text-sm font-medium text-foreground bg-background border border-primary rounded-xl focus:ring-1 focus:ring-primary focus:outline-none"
            />
            <label
              htmlFor="custom-line-spacing"
              className="absolute -top-2.5 left-3 px-1 text-xs font-semibold text-primary bg-card select-none"
            >
              Line spacing
            </label>
          </div>

          {/* 2. Paragraph spacing (pts) */}
          <div className="pt-2">
            <span className="text-sm font-semibold text-foreground block mb-3">
              Paragraph spacing (pts)
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Before input */}
              <div className="relative">
                <input
                  id="custom-spacing-before"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={spaceBeforeVal}
                  onChange={(e) => setSpaceBeforeVal(e.target.value)}
                  className="w-full h-11 px-3.5 pt-1 text-sm font-medium text-foreground bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl focus:outline-none transition-colors"
                />
                <label
                  htmlFor="custom-spacing-before"
                  className="absolute -top-2.5 left-3 px-1 text-xs font-medium text-muted-foreground bg-card select-none"
                >
                  Before
                </label>
              </div>

              {/* After input */}
              <div className="relative">
                <input
                  id="custom-spacing-after"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={spaceAfterVal}
                  onChange={(e) => setSpaceAfterVal(e.target.value)}
                  className="w-full h-11 px-3.5 pt-1 text-sm font-medium text-foreground bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl focus:outline-none transition-colors"
                />
                <label
                  htmlFor="custom-spacing-after"
                  className="absolute -top-2.5 left-3 px-1 text-xs font-medium text-muted-foreground bg-card select-none"
                >
                  After
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons matching system styling */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 text-sm font-semibold text-primary-fg bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

