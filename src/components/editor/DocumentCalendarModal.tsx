import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface DocumentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullCalendar: () => void;
}

interface MilestoneItem {
  id: string;
  title: string;
  category: 'submission' | 'supervisor' | 'evaluation' | 'requirement';
  dateStr: string;
  dayNumber: number;
  timeStr: string;
  badgeText: string;
}

const UPCOMING_MILESTONES: MilestoneItem[] = [
  {
    id: 'm1',
    title: 'Weekly Journal Submission',
    category: 'submission',
    dateStr: 'Friday, Sep 18, 2026',
    dayNumber: 18,
    timeStr: '11:59 PM',
    badgeText: 'Due Soon',
  },
  {
    id: 'm2',
    title: 'Supervisor DTR Review & Biometric Sign-off',
    category: 'supervisor',
    dateStr: 'Tuesday, Sep 22, 2026',
    dayNumber: 22,
    timeStr: '5:00 PM',
    badgeText: 'Supervisor',
  },
  {
    id: 'm3',
    title: 'Adviser Consultation & Feedback Window',
    category: 'evaluation',
    dateStr: 'Friday, Sep 25, 2026',
    dayNumber: 25,
    timeStr: '2:00 PM',
    badgeText: 'Adviser',
  },
  {
    id: 'm4',
    title: 'MOA & Training Plan Final Verification',
    category: 'requirement',
    dateStr: 'Wednesday, Sep 30, 2026',
    dayNumber: 30,
    timeStr: '4:00 PM',
    badgeText: 'Milestone',
  },
];

export function DocumentCalendarModal({
  isOpen,
  onClose,
  onOpenFullCalendar,
}: DocumentCalendarModalProps) {
  // Calendar month state (defaults to Sep 2026 to align with Practicum schedule or current date)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(2026, 8, 1));

  // Escape key handler (stops propagation so parent fullscreen isn't exited)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const miniDays: { day: number; currentMonth: boolean; isToday: boolean; hasEvent?: boolean }[] = [];
  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    miniDays.push({ day: prevMonthDays - i, currentMonth: false, isToday: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = calYear === 2026 && calMonth === 8 && d === 18;
    const hasEvent = [4, 11, 18, 22, 25, 30].includes(d) && calMonth === 8;
    miniDays.push({ day: d, currentMonth: true, isToday, hasEvent });
  }
  // Remaining cells to fill 35 or 42 grid
  const totalCells = miniDays.length > 35 ? 42 : 35;
  const remainingCells = totalCells - miniDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    miniDays.push({ day: d, currentMonth: false, isToday: false });
  }

  const modalContent = (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
        className="relative z-[131] w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="calendar-modal-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Practicum Calendar & Deadlines
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Stay updated on upcoming submissions and reviews
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 editor-scrollbar">
          {/* Calendar Widget Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
            {/* Month & Navigation */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {monthName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                  className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                  className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Header Row */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 py-1 border-b border-zinc-200/60 dark:border-zinc-800/60 select-none">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs mt-1.5">
              {miniDays.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center h-7">
                  <span
                    className={cn(
                      'size-6 flex items-center justify-center rounded-full text-[11px] font-medium transition-colors select-none',
                      d.isToday
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : d.currentMonth
                        ? 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                        : 'text-zinc-400/40 dark:text-zinc-600/40'
                    )}
                  >
                    {d.day}
                  </span>
                  {d.hasEvent && !d.isToday && (
                    <span className="size-1 bg-primary rounded-full -mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines & Milestones List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Upcoming Deadlines & Milestones
              </h3>
              <span className="text-[11px] text-primary font-medium">September 2026</span>
            </div>

            <div className="space-y-2">
              {UPCOMING_MILESTONES.map((item) => {
                const isUrgent = item.category === 'submission';
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start justify-between p-2.5 rounded-xl border transition-colors',
                      isUrgent
                        ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-900/50 text-zinc-900 dark:text-zinc-100'
                        : 'bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                          isUrgent
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )}
                      >
                        {isUrgent ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <FileCheck className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <span>{item.dateStr}</span>
                          <span>•</span>
                          <span>{item.timeStr}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0',
                        isUrgent
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      )}
                    >
                      {item.badgeText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onOpenFullCalendar}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Open Full Calendar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
