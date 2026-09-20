import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── Headers & Footers Format Dialog (Matching media_1789887189283.png) ───────

export interface HeadersFootersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  headerMargin?: number;
  footerMargin?: number;
  differentFirstPage?: boolean;
  differentOddEven?: boolean;
  onApply: (values: {
    headerMargin: number;
    footerMargin: number;
    differentFirstPage: boolean;
    differentOddEven: boolean;
  }) => void;
}

export const HeadersFootersDialog: React.FC<HeadersFootersDialogProps> = ({
  isOpen,
  onClose,
  headerMargin = 0.5,
  footerMargin = 0.5,
  differentFirstPage = false,
  differentOddEven = false,
  onApply,
}) => {
  const [headerMarginVal, setHeaderMarginVal] = useState<number>(headerMargin);
  const [footerMarginVal, setFooterMarginVal] = useState<number>(footerMargin);
  const [firstPageVal, setFirstPageVal] = useState<boolean>(differentFirstPage);
  const [oddEvenVal, setOddEvenVal] = useState<boolean>(differentOddEven);

  useEffect(() => {
    if (isOpen) {
      setHeaderMarginVal(headerMargin);
      setFooterMarginVal(footerMargin);
      setFirstPageVal(differentFirstPage);
      setOddEvenVal(differentOddEven);
    }
  }, [isOpen, headerMargin, footerMargin, differentFirstPage, differentOddEven]);

  const handleApply = () => {
    onApply({
      headerMargin: Number(headerMarginVal) || 0.5,
      footerMargin: Number(footerMarginVal) || 0.5,
      differentFirstPage: firstPageVal,
      differentOddEven: oddEvenVal,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[360px] p-6 rounded-2xl bg-card border border-border shadow-2xl z-[150]">
        <DialogHeader className="p-0 text-left">
          <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
            Headers & footers
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Margins section */}
          <div>
            <span className="text-sm font-semibold text-foreground block mb-3">
              Margins
            </span>

            <label className="text-xs text-muted-foreground mb-1.5 block">
              Header (inches from top)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={headerMarginVal}
              onChange={(e) => setHeaderMarginVal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />

            <label className="text-xs text-muted-foreground mb-1.5 mt-3.5 block">
              Footer (inches from bottom)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={footerMarginVal}
              onChange={(e) => setFooterMarginVal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>

          {/* Layout section */}
          <div className="pt-1">
            <span className="text-sm font-semibold text-foreground block mb-2.5">
              Layout
            </span>

            <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground py-1 select-none">
              <input
                type="checkbox"
                checked={firstPageVal}
                onChange={(e) => setFirstPageVal(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary focus:ring-primary cursor-pointer"
              />
              <span>Different first page</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground py-1 select-none">
              <input
                type="checkbox"
                checked={oddEvenVal}
                onChange={(e) => setOddEvenVal(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary focus:ring-primary cursor-pointer"
              />
              <span>Different odd & even</span>
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-2">
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


// ─── Page Numbers Dialog (Matching media_1789887189284.png) ───────────────────

export interface PageNumbersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: 'header' | 'footer';
  showOnFirstPage?: boolean;
  startAt?: number;
  onApply: (values: {
    position: 'header' | 'footer';
    showOnFirstPage: boolean;
    startAt: number;
  }) => void;
}

export const PageNumbersDialog: React.FC<PageNumbersDialogProps> = ({
  isOpen,
  onClose,
  initialPosition = 'header',
  showOnFirstPage = true,
  startAt = 1,
  onApply,
}) => {
  const [position, setPosition] = useState<'header' | 'footer'>(initialPosition);
  const [showFirst, setShowFirst] = useState<boolean>(showOnFirstPage);
  const [numberingType, setNumberingType] = useState<'start_at' | 'continue'>('start_at');
  const [startAtVal, setStartAtVal] = useState<number>(startAt);

  useEffect(() => {
    if (isOpen) {
      setPosition(initialPosition);
      setShowFirst(showOnFirstPage);
      setStartAtVal(startAt);
    }
  }, [isOpen, initialPosition, showOnFirstPage, startAt]);

  const handleApply = () => {
    onApply({
      position,
      showOnFirstPage: showFirst,
      startAt: numberingType === 'start_at' ? (Number(startAtVal) || 1) : 1,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[360px] p-6 rounded-2xl bg-card border border-border shadow-2xl z-[150]">
        <DialogHeader className="p-0 text-left">
          <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
            Page numbers
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Position section */}
          <div>
            <span className="text-sm font-semibold text-foreground block mb-2">
              Position
            </span>

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground py-1 select-none">
                <input
                  type="radio"
                  name="page-number-position"
                  checked={position === 'header'}
                  onChange={() => setPosition('header')}
                  className="w-4 h-4 text-primary accent-primary border-border focus:ring-primary cursor-pointer"
                />
                <span>Header</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground py-1 select-none">
                <input
                  type="radio"
                  name="page-number-position"
                  checked={position === 'footer'}
                  onChange={() => setPosition('footer')}
                  className="w-4 h-4 text-primary accent-primary border-border focus:ring-primary cursor-pointer"
                />
                <span>Footer</span>
              </label>
            </div>

            <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground py-1.5 mt-2 select-none">
              <input
                type="checkbox"
                checked={showFirst}
                onChange={(e) => setShowFirst(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary focus:ring-primary cursor-pointer"
              />
              <span>Show on first page</span>
            </label>
          </div>

          {/* Numbering section */}
          <div className="pt-1">
            <span className="text-sm font-semibold text-foreground block mb-2">
              Numbering
            </span>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between cursor-pointer text-sm text-foreground py-1 select-none">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="page-numbering-type"
                    checked={numberingType === 'start_at'}
                    onChange={() => setNumberingType('start_at')}
                    className="w-4 h-4 text-primary accent-primary border-border focus:ring-primary cursor-pointer"
                  />
                  <span>Start at</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={startAtVal}
                  disabled={numberingType !== 'start_at'}
                  onChange={(e) => setStartAtVal(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-2.5 py-1 text-sm text-center text-foreground bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground py-1 select-none">
                <input
                  type="radio"
                  name="page-numbering-type"
                  checked={numberingType === 'continue'}
                  onChange={() => setNumberingType('continue')}
                  className="w-4 h-4 text-primary accent-primary border-border focus:ring-primary cursor-pointer"
                />
                <span>Continue from previous section</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-2">
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

