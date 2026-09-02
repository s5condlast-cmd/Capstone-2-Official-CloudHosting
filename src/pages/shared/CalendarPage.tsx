import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
  CalendarClock,
  FileCheck,
  Award,
  ClipboardCheck,
  FileEdit,
  CheckCircle2,
  Filter,
  Clock,
  CalendarDays,
  Plus,
  Check,
  PanelRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/src/types';

interface CalendarEvent {
  id: string;
  title: string;
  category: 'supervisor' | 'submission' | 'evaluation' | 'checkin' | 'adviser_revision';
  date: string; // YYYY-MM-DD
  time?: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Weekly DTR Approved',
    category: 'supervisor',
    date: '2026-09-01',
    time: '8:00 AM - 5:00 PM',
  },
  {
    id: 'e2',
    title: 'Weekly Journal Due',
    category: 'submission',
    date: '2026-09-04',
    time: '11:59 PM',
  },
  {
    id: 'e3',
    title: 'Supervisor Check-in',
    category: 'checkin',
    date: '2026-09-11',
    time: '5:00 PM',
  },
  {
    id: 'e4',
    title: 'Adviser Consultation',
    category: 'evaluation',
    date: '2026-09-16',
    time: '2:00 PM - 3:30 PM',
  },
  {
    id: 'e5',
    title: 'MOA Verification',
    category: 'submission',
    date: '2026-09-22',
    time: '10:00 AM',
  },
  {
    id: 'e6',
    title: 'Endorsement Revision',
    category: 'adviser_revision',
    date: '2026-09-28',
    time: '1:00 PM',
  },
];

const CATEGORIES = [
  {
    id: 'supervisor',
    label: 'Supervisor Reviewed',
    tag: 'Reviewed',
    icon: ClipboardCheck,
    borderClass: 'border-l-sky-500',
    dotClass: 'bg-sky-500',
    iconColor: 'text-muted-foreground',
  },
  {
    id: 'submission',
    label: 'Document Submissions',
    tag: 'Due',
    icon: FileCheck,
    borderClass: 'border-l-rose-500',
    dotClass: 'bg-rose-500',
    iconColor: 'text-muted-foreground',
  },
  {
    id: 'evaluation',
    label: 'Adviser Reviews',
    tag: 'Evaluation',
    icon: Award,
    borderClass: 'border-l-purple-500',
    dotClass: 'bg-purple-500',
    iconColor: 'text-muted-foreground',
  },
  {
    id: 'checkin',
    label: 'Supervisor Check-ins',
    tag: 'Check-in',
    icon: CalendarClock,
    borderClass: 'border-l-orange-500',
    dotClass: 'bg-orange-500',
    iconColor: 'text-muted-foreground',
  },
  {
    id: 'adviser_revision',
    label: 'Adviser Revisions',
    tag: 'Revision',
    icon: FileEdit,
    borderClass: 'border-l-blue-600',
    dotClass: 'bg-blue-600',
    iconColor: 'text-muted-foreground',
  },
];

const formatTimeTo12Hour = (time24: string) => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};

const getCategoryConfig = (category: CalendarEvent['category']) => {
  return CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
};

const cleanTitle = (str: string) => str.replace(/\s*\(.*?\)/g, '').trim();

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i);

function isSameDayDate(d1?: Date | null, d2?: Date | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function CalendarPage({ user }: { user?: User | null }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2026, 8, 1));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 8, 1));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [activeCategories, setActiveCategories] = useState<string[]>([
    'supervisor',
    'submission',
    'evaluation',
    'checkin',
    'adviser_revision',
  ]);

  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE_EVENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Form states
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('supervisor');
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [newEventDate, setNewEventDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date(2026, 8, 1));
  const [newEventTime, setNewEventTime] = useState('');

  // Synchronize/sanitize events if loaded from stale state
  const sanitizedEvents = events.map((e) => ({
    ...e,
    title: cleanTitle(e.title),
  }));

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const dateStr = eventDate ? format(eventDate, 'yyyy-MM-dd') : (newEventDate || '2026-09-01');

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      category: newEventCategory,
      date: dateStr,
      time: newEventTime.trim() ? (formatTimeTo12Hour(newEventTime) || newEventTime.trim()) : undefined,
    };

    setEvents((prev) => [newEvt, ...prev]);
    setIsAddModalOpen(false);
    // Reset form
    setNewEventTitle('');
    setEventDate(undefined);
    setNewEventDate('');
  };

  const toggleCategory = (catId: string) => {
    setActiveCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handlePrev = () => {
    if (viewMode === 'week') {
      const currentBase = selectedDate || currentMonth;
      const newDate = new Date(currentBase);
      newDate.setDate(newDate.getDate() - 7);
      setSelectedDate(newDate);
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    } else {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      const currentBase = selectedDate || currentMonth;
      const newDate = new Date(currentBase);
      newDate.setDate(newDate.getDate() + 7);
      setSelectedDate(newDate);
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    } else {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    const today = new Date(2026, 8, 1);
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Generate 35 calendar cells for currentMonth (e.g. Sep 2026)
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const mStr = String(prevM + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = prevY + '-' + mStr + '-' + dStr;
    days.push({ day: d, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = year + '-' + mStr + '-' + dStr;
    days.push({ day: d, isCurrentMonth: true, dateStr });
  }

  // Next month leading days (fill up to 35)
  const remaining = 35 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const mStr = String(nextM + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = nextY + '-' + mStr + '-' + dStr;
    days.push({ day: d, isCurrentMonth: false, dateStr });
  }

  // Generate 5 days (Mon-Fri) for the Workweek View
  const baseDate = selectedDate || currentMonth;
  const currentDayOfWeek = baseDate.getDay(); // 0 = Sun
  const monday = new Date(baseDate);
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  monday.setDate(monday.getDate() + diffToMonday);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return {
      date: d,
      dateStr: `${y}-${m}-${dayNum}`,
      dayName: d.toLocaleString('default', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: `${y}-${m}-${dayNum}` === '2026-09-01',
    };
  });

  // Filter and sort active agenda events (scoped to current month)
  const currentMonthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const activeAgendaEvents = sanitizedEvents.filter((e) =>
    activeCategories.includes(e.category) && e.date.startsWith(currentMonthPrefix)
  ).sort((a, b) => a.date.localeCompare(b.date));

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getHeaderParts = () => {
    if (viewMode === 'week' && weekDays.length === 5) {
      const start = weekDays[0].date;
      const end = weekDays[4].date;
      const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
      const startDay = start.getDate();
      const endDay = end.getDate();
      const year = end.getFullYear();

      if (startMonth === endMonth) {
        return {
          main: `${startMonth} ${startDay} – ${endDay}`,
          year: `${year}`,
        };
      }
      return {
        main: `${startMonth} ${startDay} – ${endMonth} ${endDay}`,
        year: `${year}`,
      };
    }

    return {
      main: currentMonth.toLocaleDateString('en-US', { month: 'long' }),
      year: `${currentMonth.getFullYear()}`,
    };
  };

  const headerParts = getHeaderParts();

  return (
    <TooltipProvider delay={80}>
      <div className="max-w-7xl mx-auto pb-6 lg:pb-2 animate-in fade-in duration-300">
      {/* 2-Column Grid: Stack on Mobile, Equal Height Stretch on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch h-auto lg:h-[calc(100vh-5.2rem)] min-h-0 lg:min-h-[600px]">
        {/* Left Side: Toolbar + Big Calendar Grid (8/9 Cols or Full 12 Cols when collapsed) */}
        <div className={cn(isSidebarOpen ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-12", "flex flex-col gap-2.5 h-auto lg:h-full min-h-0 transition-all duration-300")}>
          {/* Calendar Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 px-3 sm:px-4 bg-card rounded-2xl border border-border shadow-xs shrink-0">
            {/* Left Nav Controls */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="text-xs font-bold px-2.5 sm:px-3.5 h-7.5 sm:h-8 rounded-lg cursor-pointer shadow-2xs hover:bg-muted/80"
                >
                  Today
                </Button>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    className="size-7.5 sm:size-8 rounded-lg cursor-pointer hover:bg-muted"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="size-7.5 sm:size-8 rounded-lg cursor-pointer hover:bg-muted"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-1.5 ml-1 sm:ml-2.5 min-w-0">
                <span className="text-sm sm:text-base lg:text-lg font-bold text-foreground tracking-tight truncate">
                  {headerParts.main}
                </span>
                <span className="text-xs sm:text-sm lg:text-base font-semibold text-muted-foreground/70 shrink-0">
                  {headerParts.year}
                </span>
              </div>
            </div>

            {/* Right View Switcher & Action */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {/* Plus button directly next to week / agenda */}
              {(viewMode === 'week' || viewMode === 'agenda') && (
                <Button
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="h-7.5 sm:h-8 gap-1.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 cursor-pointer animate-in fade-in zoom-in-95 duration-200 shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span className="hidden xs:inline">Add Event</span>
                </Button>
              )}

              <div className="flex items-center bg-muted/60 p-0.5 sm:p-1 rounded-xl border border-border/60 text-xs flex-1 sm:flex-none justify-center">
                {(['week', 'month', 'agenda'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-bold text-[11px] sm:text-xs transition-all cursor-pointer capitalize text-center',
                      viewMode === mode
                        ? 'bg-background text-foreground shadow-xs border border-border/80'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Sidebar Collapse Toggle Button */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                title={isSidebarOpen ? "Close sidebar (Active)" : "Open sidebar (Hidden)"}
                className={cn(
                  "hidden lg:flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer",
                  isSidebarOpen
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-border/60"
                )}
              >
                <PanelRight size={17} />
              </button>
            </div>
          </div>

          {/* Dynamic View Card */}
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden p-0 flex-1 flex flex-col min-h-[460px] sm:min-h-0">
            {viewMode === 'month' && (
              <>
                {/* Weekday Row Header */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-[10px] sm:text-xs font-bold text-muted-foreground py-1.5 shrink-0 select-none">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* 35 Calendar Cells (Equal Height Rows) */}
                <div className="grid grid-cols-7 grid-rows-5 flex-1 divide-x divide-border/60 bg-card min-h-0">
                  {days.map((item, idx) => {
                    const isToday = item.dateStr === '2026-09-01';
                    const isSelected = selectedDate ? isSameDayDate(new Date(item.dateStr), selectedDate) : false;
                    const dayEvents = sanitizedEvents.filter(
                      (e) => e.date === item.dateStr && activeCategories.includes(e.category)
                    );

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(new Date(item.dateStr))}
                        className={cn(
                          'p-1 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer relative group overflow-hidden min-h-0',
                          !item.isCurrentMonth && 'bg-muted/15 text-muted-foreground/40',
                          item.isCurrentMonth && 'hover:bg-muted/30',
                          isSelected && 'ring-1.5 ring-inset ring-primary/40 bg-muted/20'
                        )}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[11px] sm:text-xs font-semibold leading-none',
                              isToday
                                ? 'size-5 sm:size-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-2xs text-[10px] sm:text-xs'
                                : item.isCurrentMonth
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground/50'
                            )}
                          >
                            {item.day}
                          </span>
                        </div>

                        {/* Mobile Event Dots Indicator (< sm) */}
                        {dayEvents.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-0.5 mt-0.5 sm:hidden">
                            {dayEvents.slice(0, 3).map((evt) => {
                              const config = getCategoryConfig(evt.category);
                              return (
                                <span
                                  key={evt.id}
                                  className={cn('size-1.5 rounded-full shrink-0 shadow-2xs', config.dotClass)}
                                />
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] font-bold text-muted-foreground leading-none">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Desktop Events List in Day Cell (>= sm) */}
                        <div className="hidden sm:block space-y-1.5 mt-1 flex-1 overflow-hidden">
                          {dayEvents.map((evt) => {
                            const config = getCategoryConfig(evt.category);
                            const IconComponent = config.icon;
                            return (
                              <Tooltip key={evt.id}>
                                <TooltipTrigger
                                  render={
                                    <div
                                      className={cn(
                                        'rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-card-foreground shadow-2xs transition-all cursor-pointer p-1.5 px-2 flex flex-col justify-center border-l-[3.5px] min-h-[36px] text-left w-full',
                                        config.borderClass
                                      )}
                                    >
                                      <span className="text-[9.5px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-none">
                                        {config.tag}
                                      </span>
                                      <span className="text-xs font-bold text-foreground truncate tracking-tight leading-tight mt-0.5">
                                        {evt.title}
                                      </span>
                                    </div>
                                  }
                                />
                                <TooltipContent
                                  side="top"
                                  sideOffset={6}
                                  className="bg-popover text-popover-foreground border border-border p-3 shadow-2xl rounded-2xl max-w-xs w-72 backdrop-blur-md z-50 pointer-events-none"
                                  arrowClassName="bg-popover fill-popover border-b border-r border-border"
                                >
                                  <div className="flex items-start gap-3 w-full text-left">
                                    <div
                                      className={cn(
                                        'size-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-xs',
                                        config.dotClass
                                      )}
                                    >
                                      <IconComponent className="size-4.5" />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <p className="text-xs font-bold text-foreground leading-snug">
                                        {evt.title}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground leading-tight">
                                        {config.label}
                                      </p>
                                      {evt.time && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-foreground font-semibold pt-1">
                                          <Clock className="size-3 text-muted-foreground shrink-0" />
                                          <span>{evt.time}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Selected Date Event Drawer / List (< sm) */}
                {selectedDate && (
                  <div className="sm:hidden border-t border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {sanitizedEvents.filter(e => e.date === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` && activeCategories.includes(e.category)).length} events
                      </span>
                    </div>
                    {sanitizedEvents.filter(e => e.date === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` && activeCategories.includes(e.category)).length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-1">No events scheduled for this day.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {sanitizedEvents
                          .filter(e => e.date === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` && activeCategories.includes(e.category))
                          .map((evt) => {
                            const config = getCategoryConfig(evt.category);
                            return (
                              <div
                                key={evt.id}
                                className={cn(
                                  'rounded-xl border border-border/80 bg-muted/20 p-2.5 px-3 flex items-center justify-between gap-2 border-l-[3.5px]',
                                  config.borderClass
                                )}
                              >
                                <div className="min-w-0">
                                  <span className="text-[9.5px] font-bold text-muted-foreground/80 uppercase tracking-wider block">
                                    {config.tag}
                                  </span>
                                  <span className="text-xs font-bold text-foreground block truncate">
                                    {evt.title}
                                  </span>
                                  {evt.time && (
                                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                      <Clock className="size-2.5" />
                                      {evt.time}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold shrink-0">
                                  {config.label}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {viewMode === 'week' && (
              <div className="flex-1 flex flex-col min-h-0 bg-card overflow-x-auto">
                <div className="min-w-[520px] sm:min-w-0 flex-1 flex flex-col">
                  {/* Weekday Header Columns (5-day Workweek: Mon-Fri) */}
                  <div className="grid grid-cols-5 border-b border-border bg-muted/30 text-center py-2 shrink-0 select-none divide-x divide-border/60">
                    {weekDays.map((wd, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 px-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{wd.dayName}</span>
                        <span
                          className={cn(
                            'text-xs font-bold size-7 rounded-full flex items-center justify-center transition-all',
                            wd.isToday
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'text-foreground hover:bg-muted'
                          )}
                        >
                          {wd.dayNumber}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 5 Columns Day Schedule */}
                  <div className="grid grid-cols-5 flex-1 divide-x divide-border/60 min-h-0 overflow-y-auto">
                    {weekDays.map((wd, i) => {
                      const dayEvents = sanitizedEvents.filter(
                        (e) => e.date === wd.dateStr && activeCategories.includes(e.category)
                      );
                      return (
                        <div key={i} className="p-2 space-y-2 flex flex-col min-h-0">
                          {dayEvents.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground/40 font-medium">
                              No events
                            </div>
                          ) : (
                            dayEvents.map((evt) => {
                              const config = getCategoryConfig(evt.category);
                              const IconComponent = config.icon;
                              return (
                                <Tooltip key={evt.id}>
                                  <TooltipTrigger
                                    render={
                                      <div
                                        className={cn(
                                          'rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-card-foreground shadow-2xs transition-all cursor-pointer p-2.5 space-y-1 border-l-[3.5px] w-full text-left',
                                          config.borderClass
                                        )}
                                      >
                                        <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block leading-none">
                                          {config.tag}
                                        </span>
                                        <span className="text-xs font-bold text-foreground leading-snug break-words block mt-1">
                                          {evt.title}
                                        </span>
                                      </div>
                                    }
                                  />
                                  <TooltipContent
                                    side="top"
                                    sideOffset={6}
                                    className="bg-popover text-popover-foreground border border-border p-3 shadow-2xl rounded-2xl max-w-xs w-72 backdrop-blur-md z-50 pointer-events-none"
                                    arrowClassName="bg-popover fill-popover border-b border-r border-border"
                                  >
                                    <div className="flex items-start gap-3 w-full text-left">
                                      <div
                                        className={cn(
                                          'size-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-xs',
                                          config.dotClass
                                        )}
                                      >
                                        <IconComponent className="size-4.5" />
                                      </div>
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <p className="text-xs font-bold text-foreground leading-snug">
                                          {evt.title}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                          {config.label}
                                        </p>
                                        {evt.time && (
                                          <div className="flex items-center gap-1.5 text-[11px] text-foreground font-semibold pt-1">
                                            <Clock className="size-3 text-muted-foreground shrink-0" />
                                            <span>{evt.time}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'agenda' && (
              <div className="flex-1 flex flex-col min-h-0 bg-card p-5 overflow-y-auto space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Scheduled Agenda Items
                    </span>
                    <Badge variant="secondary" className="text-xs font-bold px-2 h-5">
                      {activeAgendaEvents.length}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold px-2.5 h-6">
                    {monthName}
                  </Badge>
                </div>

                {activeAgendaEvents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <CalendarDays className="size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-semibold">No agenda items found</p>
                    <p className="text-xs text-muted-foreground/70">Try selecting more categories in the sidebar.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();

                      const daysList = Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const dateObj = new Date(year, month, dayNum);
                        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                        const monthDayYear = dateObj.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const dayEvents = activeAgendaEvents.filter((e) => e.date === dateStr);
                        const isToday =
                          dateObj.getFullYear() === 2026 &&
                          dateObj.getMonth() === 8 &&
                          dateObj.getDate() === 1;
                        return { dateStr, dateObj, weekday, monthDayYear, dayEvents, isToday };
                      });

                      return daysList.map((day) => (
                        <div key={day.dateStr} className="space-y-2.5">
                          {/* Date Header */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-sm">
                              <span className="font-bold text-foreground tracking-tight">{day.weekday}</span>
                              <span className="text-muted-foreground/50 font-normal">·</span>
                              <span className="text-muted-foreground font-medium">{day.monthDayYear}</span>
                              {day.isToday && (
                                <span className="ml-1 text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                                  Today
                                </span>
                              )}
                            </div>
                            {day.dayEvents.length > 0 ? (
                              <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                                {day.dayEvents.length} {day.dayEvents.length === 1 ? 'event' : 'events'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-muted-foreground/40">
                                No events
                              </span>
                            )}
                          </div>

                          {/* Events under this date OR subtle empty day indicator */}
                          {day.dayEvents.length > 0 ? (
                            <div className="space-y-2">
                              {day.dayEvents.map((evt) => {
                                const config = getCategoryConfig(evt.category);

                                return (
                                  <div
                                    key={evt.id}
                                    className={cn(
                                      'rounded-xl border border-border/80 bg-card p-3 px-4 flex items-center justify-between gap-4 shadow-2xs hover:bg-muted/40 transition-colors cursor-pointer border-l-[3.5px]',
                                      config.borderClass
                                    )}
                                  >
                                    {/* Left Title & Meta */}
                                    <div className="flex flex-col min-w-0 gap-0.5">
                                      <span className="text-sm font-bold text-foreground truncate">
                                        {evt.title}
                                      </span>

                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                                          {config.tag}
                                        </span>
                                        <span className="text-muted-foreground/40">•</span>
                                        <span className="text-muted-foreground font-medium">
                                          {config.label}
                                        </span>

                                        {evt.time && (
                                          <>
                                            <span className="text-muted-foreground/40">•</span>
                                            <div className="flex items-center gap-1 font-semibold text-foreground/90 bg-muted/60 px-2 py-0.5 rounded-md text-[11px]">
                                              <Clock className="size-3 text-muted-foreground shrink-0" />
                                              <span>{evt.time}</span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right Status Badge */}
                                    <div className="flex items-center shrink-0">
                                      <Badge
                                        variant="outline"
                                        className="h-6 px-2.5 gap-1.5 font-semibold text-xs rounded-full border-border/80 bg-muted/30 text-foreground"
                                      >
                                        <Check className="size-3 text-emerald-500" />
                                        <span>Submitted</span>
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-border/50 bg-muted/5 py-2 px-3.5 text-xs font-medium text-muted-foreground/50 flex items-center justify-between">
                              <span>No events scheduled</span>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Mini Calendar + Filter Sidebar (4 Cols on LG, 3 on XL) */}
        {isSidebarOpen && (
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3.5 h-full min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Card 1: Shadcn Mini Calendar (Full Natural Size, Never Shrinks) */}
            <Card className="rounded-2xl border-border/60 shadow-sm p-3 flex flex-col items-center justify-center bg-card shrink-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) {
                    setSelectedDate(d);
                    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }
                }}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                captionLayout="label"
                className="p-0 w-full [--cell-size:32px]"
                classNames={{
                  month_caption: "flex h-9 w-full items-center justify-center px-10 text-center",
                  caption_label: "font-bold text-[13px] tracking-tight text-foreground select-none",
                  button_previous: "size-7 p-0 flex items-center justify-center cursor-pointer select-none rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
                  button_next: "size-7 p-0 flex items-center justify-center cursor-pointer select-none rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
                  weekday: "w-9 text-center text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest select-none py-1",
                  weekdays: "flex w-full justify-between mb-0.5 border-b border-border/40 pb-1.5",
                  day: "size-9 text-center text-[13px] p-0 relative flex items-center justify-center font-medium",
                  week: "mt-0.5 flex w-full justify-between",
                  today: "rounded-lg bg-muted/60 text-foreground font-bold",
                  outside: "text-muted-foreground/30",
                  month_grid: "w-full border-collapse mt-1.5",
                }}
              />
            </Card>

            {/* Card 2: Filterable Calendars */}
            <Card className="rounded-2xl border-border shadow-xs overflow-hidden flex flex-col flex-1 min-h-0 bg-card">
              <CardHeader className="py-2 px-3.5 flex flex-row items-center justify-between space-y-0 border-b border-border/60 shrink-0">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <span>Calendars</span>
                </CardTitle>
                <button
                  type="button"
                  onClick={() => {
                    if (activeCategories.length === CATEGORIES.length) {
                      setActiveCategories([]);
                    } else {
                      setActiveCategories(CATEGORIES.map((c) => c.id));
                    }
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {activeCategories.length === CATEGORIES.length ? 'Clear all' : 'Select all'}
                </button>
              </CardHeader>

              <CardContent className="p-2 space-y-1 flex-1 flex flex-col justify-start min-h-0 overflow-y-auto">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategories.includes(cat.id);
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          'w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl transition-all cursor-pointer text-left font-semibold border shrink-0',
                          isActive
                            ? 'bg-muted/50 border-border text-foreground shadow-2xs hover:bg-muted/80'
                            : 'border-transparent text-muted-foreground hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-5.5 rounded-md bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconComponent className={cn('size-3', cat.iconColor)} />
                          </div>
                          <span className="truncate text-xs font-bold text-foreground">{cat.label}</span>
                        </div>
                        <span
                          className={cn(
                            'size-4.5 rounded-full border flex items-center justify-center text-xs shrink-0 transition-colors',
                            isActive
                              ? cn(cat.dotClass, 'text-white border-transparent shadow-2xs')
                              : 'border-border bg-background'
                          )}
                        >
                          {isActive && <Check className="size-2.5 stroke-[3] text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Event Shadcn Dialog Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm sm:max-w-[440px] p-4 sm:p-5 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-0.5 pb-0.5">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
              <CalendarClock className="size-4.5 text-muted-foreground" />
              <span>Add Event</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new calendar schedule or reminder.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEvent} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="event-title" className="text-xs sm:text-sm font-semibold text-foreground/90">
                Event Title *
              </Label>
              <Input
                id="event-title"
                placeholder="Enter event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                required
                className="h-9 text-sm rounded-xl px-3"
              />
            </div>

            {/* Date & Time Grid using FieldGroup and DatePicker pattern */}
            <FieldGroup className="flex-row gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor="date" className="text-xs sm:text-sm font-semibold text-foreground/90">
                  Date *
                </FieldLabel>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        id="date"
                        className={cn(
                          "w-full justify-start font-normal h-9 text-sm rounded-xl border-input bg-card shadow-2xs hover:bg-muted/40 cursor-pointer px-3",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        {eventDate ? eventDate.toLocaleDateString() : "Select date"}
                      </Button>
                    }
                  />
                  <PopoverContent
                    className="w-auto p-4 rounded-2xl shadow-2xl border border-border bg-popover text-popover-foreground z-[9999]"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      defaultMonth={eventDate || new Date(2026, 8, 1)}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setEventDate(date);
                        if (date) setNewEventDate(format(date, 'yyyy-MM-dd'));
                        setIsDatePickerOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="time-picker-optional" className="text-xs sm:text-sm font-semibold text-foreground/90">
                  Time
                </FieldLabel>
                <Input
                  type="time"
                  id="time-picker-optional"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="h-9 text-sm rounded-xl px-3 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </Field>
            </FieldGroup>

            {/* Footer with Add Event on Left and Cancel on Right */}
            <div className="pt-2 flex items-center justify-between gap-2.5 w-full">
              <Button type="submit" size="sm" className="h-9 text-sm font-semibold gap-1.5 px-4 rounded-xl cursor-pointer">
                <Plus className="size-4" />
                <span>Add Event</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-9 text-sm font-semibold px-4 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
