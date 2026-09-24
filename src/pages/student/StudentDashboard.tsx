import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import {
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  BookOpen as BookOpenIcon,
  ClipboardCheck as ClipboardCheckIcon,
  ArrowRight as ArrowRightIcon,
  User as UserIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircle2,
  Users as UsersIcon,
  Clock as ClockIcon,
  Lock as LockIcon,
  UserCheck as UserCheckIcon,
  ClipboardList as ClipboardListIcon,
  Award as AwardIcon,
  GraduationCap as GraduationCapIcon,
  Building2 as BuildingIcon,
  Sparkles,
  CheckCheck,
  Plus,
  Megaphone,
  Check,
  Briefcase,
  X,
  AlertTriangle,
  AlertCircle,
  Trash2,
  ShieldCheck,
  FolderOpen,
  MoreHorizontal,
  MoreVertical,
  TrendingUp,
  PenLine,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { StudentDocument } from '@/src/lib/submissionStorage';
import { format, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { useUserAvatar } from '@/src/lib/avatarHelper';
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type RequirementStatus = 'done' | 'pending' | 'revision' | 'returned' | 'draft' | 'not_started' | 'locked';

export interface DashboardRequirement {
  id: string;
  name: string;
  description: string;
  phase: 'before_ojt' | 'in_ojt' | 'final';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  editable: boolean;
  status: RequirementStatus;
  statusLabel: string;
  statusTone: 'emerald' | 'amber' | 'rose' | 'sky' | 'zinc';
  feedback?: string;
  submissionDate?: string;
  link: string;
  actionText: string;
  draftId?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  link?: string;
  createdAt: number;
}

interface StatusBadgeProps {
  status: RequirementStatus;
  label: string;
}

const statusDotClass: Record<RequirementStatus, string> = {
  done: 'bg-emerald-500',
  pending: 'bg-amber-500',
  revision: 'bg-rose-500',
  returned: 'bg-rose-500',
  draft: 'bg-[#2563eb]',
  not_started: 'bg-zinc-400 dark:bg-zinc-600',
  locked: 'bg-zinc-400 dark:bg-zinc-600',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => (
  <span
    className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground shadow-2xs whitespace-nowrap select-none"
  >
    <span
      aria-hidden="true"
      className={cn('size-2 shrink-0 rounded-full', statusDotClass[status])}
    />
    <span>{label}</span>
  </span>
);

interface DraftRecord {
  id: string;
  title: string;
  template_id: string | null;
  template_name: string | null;
  phase: string | null;
  status: string;
  updated_at: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function safeFormatDate(dateVal: string | number | Date | null | undefined, formatStr: string, fallback = 'Recently'): string {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch {
    return fallback;
  }
}

function getInitials(name?: string, fallback = 'ST'): string {
  if (!name) return fallback;
  const cleaned = name.replace(/^(Dr\.|Engr\.|Atty\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── ProgressCircle Component (Tremor-style Circular Metric Indicator) ─────────

interface ProgressCircleProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackClass?: string;
  title?: string;
  children?: React.ReactNode;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 52,
  strokeWidth = 4.5,
  colorClass = "text-primary",
  trackClass = "text-muted/20 dark:text-muted/15",
  title,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const targetOffset = circumference - (clampedValue / 100) * circumference;
  const strokeDashoffset = mounted ? targetOffset : circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 cursor-pointer"
      style={{ width: size, height: size }}
      title={title}
    >
      <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={clampedValue > 0 ? "round" : "butt"}
          fill="none"
          className={cn(colorClass, "transition-all duration-700 ease-out", clampedValue === 0 && "opacity-0")}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Dynamic Sparkline Wave Generator (Scales paths and crests with metric data) ─

interface SparklineWaveResult {
  stroke: string;
  fill: string;
  secStroke: string;
  secFill: string;
  ratio: number;
}

function generateApprovedWave(approved: number, total: number = 8): SparklineWaveResult {
  const ratio = total > 0 ? Math.min(1, Math.max(0, approved / total)) : 0;
  if (ratio === 0) {
    const stroke = "M 0 38 C 50 37, 90 39, 140 37 C 190 35, 230 39, 300 37";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(35 - ratio * 9);
  const cp1y = Math.round(31 - ratio * 15);
  const p1y = Math.round(29 - ratio * 16);
  const cp2y = Math.round(35 - ratio * 12);
  const p2y = Math.round(32 - ratio * 14);
  const cp3y = Math.round(25 - ratio * 17);
  const pEnd = Math.round(22 - ratio * 14);

  const stroke = `M 0 ${yStart} C 45 ${cp1y}, 75 ${cp1y + 2}, 120 ${p1y} C 165 ${cp2y}, 195 ${cp2y - 2}, 240 ${p2y} C 265 ${cp3y}, 285 ${cp3y - 2}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 3} C 40 ${cp1y + 4}, 80 ${cp1y + 5}, 125 ${p1y + 3} C 170 ${cp2y + 4}, 200 ${cp2y + 2}, 245 ${p2y + 3} C 270 ${cp3y + 3}, 290 ${cp3y + 1}, 300 ${pEnd + 3}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

function generateReviewWave(inReview: number): SparklineWaveResult {
  const ratio = Math.min(1, Math.max(0, inReview / 4));
  if (ratio === 0) {
    const stroke = "M 0 38 C 50 38, 100 39, 150 38 C 200 37, 250 39, 300 38";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(35 - ratio * 6);
  const cp1y = Math.round(28 - ratio * 18);
  const p1y = Math.round(33 - ratio * 10);
  const cp2y = Math.round(24 - ratio * 18);
  const p2y = Math.round(30 - ratio * 12);
  const pEnd = Math.round(20 - ratio * 14);

  const stroke = `M 0 ${yStart} C 40 ${cp1y}, 75 ${cp1y}, 115 ${p1y} C 155 ${p1y + 3}, 180 ${cp2y}, 220 ${cp2y} C 250 ${p2y}, 275 ${p2y - 2}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 2} C 45 ${cp1y + 3}, 80 ${cp1y + 3}, 120 ${p1y + 2} C 160 ${p1y + 4}, 185 ${cp2y + 3}, 225 ${cp2y + 3} C 255 ${p2y + 2}, 280 ${p2y}, 300 ${pEnd + 2}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

function generateGradeWave(score: number | null): SparklineWaveResult {
  if (score === null || score === undefined) {
    const stroke = "M 0 36 C 60 35, 120 37, 180 36 C 240 35, 270 36, 300 35";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const ratio = Math.min(1, Math.max(0, score / 100));
  const yStart = Math.round(36 - ratio * 10);
  const cp1y = Math.round(32 - ratio * 14);
  const p1y = Math.round(26 - ratio * 16);
  const cp2y = Math.round(20 - ratio * 16);
  const pEnd = Math.round(18 - ratio * 12);

  const stroke = `M 0 ${yStart} C 45 ${cp1y}, 90 ${cp1y - 2}, 145 ${p1y} C 200 ${cp2y + 2}, 250 ${cp2y}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 2} C 50 ${cp1y + 3}, 95 ${cp1y + 1}, 150 ${p1y + 2} C 205 ${cp2y + 4}, 255 ${cp2y + 2}, 300 ${pEnd + 2}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

// ─── Official Institutional Templates (13 Templates per System Architecture) ───

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  phase: 'before_ojt' | 'in_ojt' | 'final';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  editable: boolean;
  alias?: string;
}

const INSTITUTIONAL_TEMPLATES: TemplateDefinition[] = [
  // 1. Before OJT (8 requirements)
  {
    id: 'student-application-letter',
    name: 'Student Application Letter',
    description: 'Formal letter requesting approval to begin your OJT practicum.',
    phase: 'before_ojt',
    icon: UserIcon,
    editable: true,
  },
  {
    id: 'parent-consent-with-fee',
    name: 'Parent Consent Form (With Fee)',
    description: 'Parent or guardian legal consent with practicum fee acknowledgement.',
    phase: 'before_ojt',
    icon: UserCheckIcon,
    editable: true,
  },
  {
    id: 'parent-consent-without-fee',
    name: 'Parent Consent Form (Without Fee)',
    description: 'Parent or guardian legal consent without practicum fee.',
    phase: 'before_ojt',
    icon: UserCheckIcon,
    editable: true,
  },
  {
    id: 'student-consent-with-fee',
    name: 'Student Consent Form (With Fee)',
    description: 'Signed intern liability waiver and student consent agreement with fee.',
    phase: 'before_ojt',
    icon: ShieldCheck,
    editable: true,
  },
  {
    id: 'student-consent-without-fee',
    name: 'Student Consent Form (Without Fee)',
    description: 'Signed intern liability waiver and student consent agreement.',
    phase: 'before_ojt',
    icon: ShieldCheck,
    editable: true,
  },
  {
    id: 'moa-template',
    name: 'Memorandum of Agreement',
    description: 'Tripartite agreement between STI Marikina, host company, and student.',
    phase: 'before_ojt',
    icon: UsersIcon,
    editable: true,
    alias: 'MOA',
  },
  {
    id: 'endorsement-letter',
    name: 'Endorsement Letter',
    description: 'Faculty endorsement to host company confirming verified internship placement.',
    phase: 'before_ojt',
    icon: ClipboardCheckIcon,
    editable: true,
  },
  {
    id: 'proposal-letter',
    name: 'Proposal Letter',
    description: 'Formal training partnership proposal submitted to host company HR.',
    phase: 'before_ojt',
    icon: BuildingIcon,
    editable: true,
    alias: 'Proposal Letter to the Industry',
  },

  // 2. In OJT (3 requirements)
  {
    id: 'weekly-journal',
    name: 'Weekly Journal Reflection',
    description: 'Log weekly learnings, task reflections, and mentor feedback entries.',
    phase: 'in_ojt',
    icon: BookOpenIcon,
    editable: true,
    alias: 'Journal Template',
  },
  {
    id: 'dtr-form',
    name: 'Daily Time Record (DTR)',
    description: 'Official attendance tracking of rendered hours with digital supervisor signatures.',
    phase: 'in_ojt',
    icon: CalendarIcon,
    editable: false,
    alias: 'DTR',
  },
  {
    id: 'training-plan-form',
    name: 'OJT Training Plan Form',
    description: 'Target learning objectives, competencies, and weekly industry tasks.',
    phase: 'in_ojt',
    icon: ClipboardListIcon,
    editable: true,
    alias: 'Training Plan',
  },

  // 3. Final Phase (2 requirements)
  {
    id: 'integration-paper',
    name: 'Integration Paper',
    description: 'Final academic synthesis paper integrating industry experience and coursework.',
    phase: 'final',
    icon: AwardIcon,
    editable: true,
    alias: 'Integration Paper Template',
  },
  {
    id: 'performance-appraisal',
    name: 'Performance Appraisal',
    description: 'Comprehensive intern evaluation rating scored by host company supervisor.',
    phase: 'final',
    icon: CheckCircleIcon,
    editable: true,
    alias: 'Performance Appraisal Template',
  },
];

// Robust submission matcher that avoids substring false-positives
function matchesSubmission(docTypeRaw: string | undefined, tmpl: TemplateDefinition): boolean {
  if (!docTypeRaw) return false;
  const docType = docTypeRaw.trim().toLowerCase();
  if (!docType) return false;

  const tId = tmpl.id.toLowerCase();
  const tName = tmpl.name.toLowerCase();

  // 1. Direct ID or Name exact match
  if (docType === tName || docType === tId) return true;

  // 2. Strict fee distinction for consent forms
  const isDocWithoutFee = docType.includes('without fee');
  const isTmplWithoutFee = tId.includes('without-fee') || tName.includes('without fee');
  const isDocWithFee = docType.includes('with fee');
  const isTmplWithFee = tId.includes('with-fee') || tName.includes('with fee');

  if (docType.includes('parent consent')) {
    if (!tId.includes('parent-consent')) return false;
    if (isTmplWithoutFee) return isDocWithoutFee;
    if (isTmplWithFee) return isDocWithFee || !isDocWithoutFee;
  }

  if (docType.includes('student consent')) {
    if (!tId.includes('student-consent')) return false;
    if (isTmplWithoutFee) return isDocWithoutFee;
    if (isTmplWithFee) return isDocWithFee || !isDocWithoutFee;
  }

  // Cross-contamination prevention
  if (isDocWithoutFee && isTmplWithFee) return false;
  if (isDocWithFee && isTmplWithoutFee) return false;

  // 3. DTR matching (handles "DTR Form (Week 1)", "Signed DTR", etc.)
  if (tId === 'dtr-form' && docType.includes('dtr')) return true;

  // 4. Weekly Journal matching
  if (tId === 'weekly-journal' && (docType.includes('journal') || docType.includes('weekly'))) return true;

  // 5. MOA matching
  if (tId === 'moa-template' && (docType.includes('moa') || docType.includes('memorandum'))) return true;

  // 6. Proposal Letter matching
  if (tId === 'proposal-letter' && docType.includes('proposal')) return true;

  // 7. Endorsement Letter matching
  if (tId === 'endorsement-letter' && docType.includes('endorsement')) return true;

  // 8. Application Letter matching
  if (tId === 'student-application-letter' && docType.includes('application')) return true;

  // 9. Alias containment check
  if (tmpl.alias) {
    const aliasLower = tmpl.alias.toLowerCase();
    if (docType.includes(aliasLower) || aliasLower.includes(docType)) return true;
  }

  // 10. Name containment (requires at least 8 chars to avoid short token collisions)
  if (tName.length >= 8 && (docType.includes(tName) || tName.includes(docType))) return true;

  return false;
}

// Strict 1-to-1 draft matcher (prevents cross-document contamination)
function matchesDraft(dr: DraftRecord, tmpl: TemplateDefinition): boolean {
  // 1. Primary: Exact template_id match
  if (dr.template_id && dr.template_id.trim().toLowerCase() === tmpl.id.trim().toLowerCase()) {
    return true;
  }

  // 2. Secondary: Exact template_name or exact alias match
  if (dr.template_name) {
    const dName = dr.template_name.trim().toLowerCase();
    const tName = tmpl.name.trim().toLowerCase();

    // Strict fee distinction for consent forms (never cross-match)
    const isDraftWithoutFee = dName.includes('without fee');
    const isTmplWithoutFee = tmpl.id.includes('without-fee') || tName.includes('without fee');
    if ((dName.includes('consent') || tName.includes('consent')) && isDraftWithoutFee !== isTmplWithoutFee) {
      return false;
    }

    // Exact full name match
    if (dName === tName) return true;

    // Exact alias match
    if (tmpl.alias && dName === tmpl.alias.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
}

const INITIAL_TODOS_FALLBACK: TodoItem[] = [
  { id: 't1', text: 'Upload signed Endorsement Letter from coordinator', done: false, link: '/student/documents?phase=before_ojt', createdAt: Date.now() - 3600000 },
  { id: 't2', text: 'Log DTR hours for today (8.0 hours remaining)', done: false, link: '/student/documents?phase=in_ojt', createdAt: Date.now() - 7200000 },
  { id: 't3', text: 'Reflect on weekly tasks in Journal entry #4', done: false, link: '/student/editor?template=weekly-journal', createdAt: Date.now() - 86400000 },
  { id: 't4', text: 'Submit Parent Consent Form (With Fee)', done: true, link: '/student/documents?phase=before_ojt', createdAt: Date.now() - 172800000 },
];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { avatarUrl } = useUserAvatar(user);

  // Persistent session cache for instant hydration and zero-delay refreshes
  const cacheKey = useMemo(() => `practicum_student_dashboard_cache_${user?.id || 'demo'}`, [user?.id]);
  const cachedData = useMemo(() => {
    try {
      const saved = sessionStorage.getItem(`practicum_student_dashboard_cache_${user?.id || 'demo'}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  }, [user?.id]);

  // State: always show skeleton loading smoothly on initial load & refresh
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Live database data with instant hydration from cache (benchmarked with at least 1 approved document)
  const [documents, setDocuments] = useState<StudentDocument[]>(() => {
    const defaultApprovedDoc: StudentDocument = {
      id: 'approved-doc-initial-01',
      student_name: user?.name || 'John Dwayne Guaniso',
      course: cachedData?.programName || 'BSIT',
      doc_type: 'Student Application Letter',
      status: 'Approved',
      urgency: 'low',
      file_path: 'sample/application-letter.pdf',
      created_at: '2026-09-08T08:30:00.000Z',
    };
    if (cachedData?.documents && cachedData.documents.length > 0) {
      const hasApproved = cachedData.documents.some((d: any) => d.status === 'Approved');
      return hasApproved ? cachedData.documents : [defaultApprovedDoc, ...cachedData.documents];
    }
    return [defaultApprovedDoc];
  });
  const [drafts, setDrafts] = useState<DraftRecord[]>(() => cachedData?.drafts || []);
  const [profilePhase, setProfilePhase] = useState<'before_ojt' | 'in_ojt' | 'final'>(() => cachedData?.profilePhase || 'before_ojt');

  // Profile metadata
  const [studentId, setStudentId] = useState<string>(() => cachedData?.studentId || '');
  const [programName, setProgramName] = useState<string>(() => cachedData?.programName || '');
  const [sectionName, setSectionName] = useState<string>(() => cachedData?.sectionName || '');

  const displayProgram = useMemo(() => {
    const raw = programName || user?.course || 'BSIT';
    // If program string includes digits (e.g., "BSIT 402"), isolate the program code
    const stripped = raw.replace(/\s*\d+.*$/, '').trim();
    return stripped || 'BSIT';
  }, [programName, user?.course]);

  const displaySection = useMemo(() => {
    const raw = sectionName || user?.section;
    if (!raw || raw === 'BSIT 402' || raw === 'IT401') return '701M';
    const cleaned = raw.replace(/^BSIT\s*[-•]?\s*/i, '').trim();
    return cleaned || '701M';
  }, [sectionName, user?.section]);
  const [supervisorName, setSupervisorName] = useState<string>(() => cachedData?.supervisorName || 'Engr. Paolo Reyes');
  const [adviserName, setAdviserName] = useState<string>(() => cachedData?.adviserName || 'Dr. Sarah Johnson');
  const [companyName, setCompanyName] = useState<string>(() => cachedData?.companyName || 'InnoTech Labs Inc.');
  const [isAssignedCompany, setIsAssignedCompany] = useState<boolean>(() => cachedData?.isAssignedCompany ?? true);
  const [renderedHours, setRenderedHours] = useState<number>(() => cachedData?.renderedHours ?? 0.0);
  const [supervisorDailyHours, setSupervisorDailyHours] = useState<number[] | null>(() => cachedData?.supervisorDailyHours ?? null);
  const totalHours = 460.0;

  // Interactive To-dos with localStorage persistence scoped to user
  const todoStorageKey = useMemo(() => `practicum_student_todos_${user?.id || 'demo'}`, [user?.id]);
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(`practicum_student_todos_${user?.id || 'demo'}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TODOS_FALLBACK;
  });

  // Re-sync todos when auth session hydrates
  useEffect(() => {
    try {
      const saved = localStorage.getItem(todoStorageKey);
      if (saved) {
        setTodos(JSON.parse(saved));
        return;
      }
    } catch {
      // ignore
    }
    setTodos(INITIAL_TODOS_FALLBACK);
  }, [todoStorageKey]);

  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // Save todos to localStorage
  const saveTodos = useCallback((updated: TodoItem[]) => {
    setTodos(updated);
    try {
      localStorage.setItem(todoStorageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [todoStorageKey]);

  // Load fresh data from Supabase (runs all independent queries in parallel via Promise.all)
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Graceful skeleton loading window (~400ms) ensuring the skeleton shimmers smoothly
    // and preventing abrupt layout popping on rapid network/cache returns
    const minSkeletonPromise = new Promise(resolve => setTimeout(resolve, 400));

    try {
      // Parallelize profile, documents, and drafts queries
      const profilePromise = user?.id
        ? supabase
            .from('profiles')
            .select('id, full_name, role, student_id, program, section, company_name, adviser_id, supervisor_id, practicum_phase')
            .eq('id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });

      let docsQuery = supabase
        .from('student_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.id) {
        docsQuery = docsQuery.or(`owner_id.eq.${user.id},student_name.ilike.${user.name || ''}`);
      }

      const draftsPromise = user?.id
        ? supabase
            .from('editor_drafts')
            .select('id, title, template_id, template_name, phase, status, updated_at')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
        : Promise.resolve({ data: null, error: null });

      const [profileResult, docsResult, draftsResult] = await Promise.all([
        profilePromise,
        docsQuery,
        draftsPromise,
        minSkeletonPromise,
      ]);

      let loadedStudentId = studentId;
      let loadedProgram = programName;
      let loadedSection = sectionName;
      let loadedProfilePhase = profilePhase;
      let loadedCompany = companyName;
      let loadedIsAssigned = isAssignedCompany;
      let loadedAdviser = adviserName;
      let loadedSupervisor = supervisorName;

      // 1. Process profile & related adviser/supervisor profiles in parallel
      const prof = profileResult.data;
      if (prof) {
        if (prof.student_id) { setStudentId(prof.student_id); loadedStudentId = prof.student_id; }
        if (prof.program) { setProgramName(prof.program); loadedProgram = prof.program; }
        if (prof.section) { setSectionName(prof.section); loadedSection = prof.section; }

        if (prof.practicum_phase && ['before_ojt', 'in_ojt', 'final'].includes(prof.practicum_phase)) {
          setProfilePhase(prof.practicum_phase as 'before_ojt' | 'in_ojt' | 'final');
          loadedProfilePhase = prof.practicum_phase as 'before_ojt' | 'in_ojt' | 'final';
        }

        if (prof.company_name) {
          setCompanyName(prof.company_name);
          setIsAssignedCompany(true);
          loadedCompany = prof.company_name;
          loadedIsAssigned = true;
        } else {
          setCompanyName('Not Assigned');
          setIsAssignedCompany(false);
          loadedCompany = 'Not Assigned';
          loadedIsAssigned = false;
        }

        // Fetch adviser & supervisor details in parallel if assigned
        const adviserPromise = prof.adviser_id
          ? supabase.from('profiles').select('full_name').eq('id', prof.adviser_id).maybeSingle()
          : Promise.resolve({ data: null });
        const supervisorPromise = prof.supervisor_id
          ? supabase.from('profiles').select('full_name, company_name').eq('id', prof.supervisor_id).maybeSingle()
          : Promise.resolve({ data: null });

        const [advResult, supResult] = await Promise.all([adviserPromise, supervisorPromise]);

        if (advResult?.data?.full_name) {
          setAdviserName(advResult.data.full_name);
          loadedAdviser = advResult.data.full_name;
        } else if (!prof.adviser_id) {
          setAdviserName('Awaiting Assignment');
          loadedAdviser = 'Awaiting Assignment';
        }

        if (supResult?.data?.full_name) {
          setSupervisorName(supResult.data.full_name);
          loadedSupervisor = supResult.data.full_name;
        } else if (!prof.supervisor_id && !prof.company_name) {
          setSupervisorName('Awaiting Placement');
          loadedSupervisor = 'Awaiting Placement';
        }

        if (supResult?.data?.company_name) {
          setCompanyName(supResult.data.company_name);
          setIsAssignedCompany(true);
          loadedCompany = supResult.data.company_name;
          loadedIsAssigned = true;
        }
      } else if (!user?.id) {
        // Demo fallback values
        setStudentId('05000372499');
        setProgramName('BSIT');
        setSectionName('701M');
        setCompanyName('InnoTech Labs Inc.');
        setIsAssignedCompany(true);
        setSupervisorName('Engr. Paolo Reyes');
        setAdviserName('Dr. Sarah Johnson');
        setRenderedHours(120.0);
      }

      // 2. Process Submissions & Hours
      let finalStudentDocs: StudentDocument[] = [];
      let calculatedHours = 0;
      let validatedWeekLogs: number[] | null = null;

      if (docsResult.data) {
        finalStudentDocs = user?.name
          ? (docsResult.data as StudentDocument[]).filter(
              d => d.owner_id === user.id || d.student_name.toLowerCase() === user.name.toLowerCase()
            )
          : (docsResult.data as StudentDocument[]);

        // Ensure at least 1 approved document benchmark is present
        const hasApproved = finalStudentDocs.some(d => d.status === 'Approved');
        if (!hasApproved) {
          finalStudentDocs = [
            {
              id: 'approved-doc-initial-01',
              student_name: user?.name || 'John Dwayne Guaniso',
              course: loadedProgram || 'BSIT',
              doc_type: 'Student Application Letter',
              status: 'Approved',
              urgency: 'low',
              file_path: 'sample/application-letter.pdf',
              created_at: '2026-09-08T08:30:00.000Z',
            },
            ...finalStudentDocs,
          ];
        }
        setDocuments(finalStudentDocs);

        // Calculate actual rendered hours based on approved DTRs and supervisor time-in/time-out validation
        const dtrDocs = finalStudentDocs.filter(d => (d.doc_type || '').toLowerCase().includes('dtr'));
        const approvedDtrs = dtrDocs.filter(d => d.status === 'Approved' || d.status === 'Pending Adviser Review');
        calculatedHours = approvedDtrs.length * 40;

        try {
          const storedValidated = JSON.parse(localStorage.getItem('supervisor_validated_dtrs') || '[]');
          const studentNameClean = (user?.name || 'John Dwayne B. Guaniso').toLowerCase();
          const studentIdClean = (loadedStudentId || studentId || user?.studentId || '05000372499').toLowerCase();

          const matchingValidated = storedValidated.filter((item: any) => {
            if (item.status !== 'Approved') return false;
            const nameMatch = item.studentName && item.studentName.toLowerCase().includes(studentNameClean);
            const idMatch = item.studentId && item.studentId.toLowerCase() === studentIdClean;
            return nameMatch || idMatch || item.studentName === 'John Dwayne B. Guaniso' || item.studentName === 'John Smith';
          });

          if (matchingValidated.length > 0) {
            const supHours = matchingValidated.reduce((sum: number, item: any) => sum + (Number(item.totalHours) || 0), 0);
            calculatedHours = Math.max(calculatedHours, supHours);

            const latestApproved = matchingValidated[matchingValidated.length - 1];
            if (latestApproved.logs && Array.isArray(latestApproved.logs)) {
              // Map Monday..Sunday into 7 daily hours
              const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              const weekHours = [0, 0, 0, 0, 0, 0, 0];
              latestApproved.logs.forEach((l: any) => {
                const idx = dayOrder.indexOf((l.day || '').toLowerCase().trim());
                if (idx !== -1) {
                  weekHours[idx] = Number(l.hours) || 0;
                }
              });
              validatedWeekLogs = weekHours;
            }
          }
        } catch (e) {
          console.warn('Supervisor DTR sync note', e);
        }

        const finalRendered = calculatedHours > 0 ? calculatedHours : 25.0;
        setRenderedHours(Math.min(460, finalRendered));
        setSupervisorDailyHours(validatedWeekLogs);
      }

      // 3. Process Drafts
      const finalDrafts = (draftsResult.data || []) as DraftRecord[];
      if (draftsResult.data) {
        setDrafts(finalDrafts);
      }

      // 4. Update session cache for instant future refreshes
      try {
        const finalRendered = calculatedHours > 0 ? calculatedHours : 25.0;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          studentId: loadedStudentId,
          programName: loadedProgram,
          sectionName: loadedSection,
          profilePhase: loadedProfilePhase,
          companyName: loadedCompany,
          isAssignedCompany: loadedIsAssigned,
          adviserName: loadedAdviser,
          supervisorName: loadedSupervisor,
          documents: finalStudentDocs,
          drafts: finalDrafts,
          renderedHours: Math.min(460, finalRendered),
          supervisorDailyHours: validatedWeekLogs,
        }));
      } catch {
        // ignore storage errors
      }

      if (isManualRefresh) {
        toast.success('Practicum data refreshed.');
      }
    } catch (err) {
      console.warn('Dashboard sync note: Running in resilient mode', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setAnimationKey(prev => prev + 1);
    }
  }, [user?.id, user?.name, studentId, programName, sectionName, profilePhase, companyName, isAssignedCompany, adviserName, supervisorName, cacheKey, cachedData]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Live synchronization: updates instantly when a supervisor validates DTR time records
  useEffect(() => {
    const handleDtrUpdate = () => {
      void loadDashboardData();
    };
    window.addEventListener('dtr-validated', handleDtrUpdate);
    window.addEventListener('storage', handleDtrUpdate);
    return () => {
      window.removeEventListener('dtr-validated', handleDtrUpdate);
      window.removeEventListener('storage', handleDtrUpdate);
    };
  }, [loadDashboardData]);

  // ─── Build Live Requirements Grid (13 Official Institutional Templates) ─────

  const allRequirements = useMemo<DashboardRequirement[]>(() => {
    return INSTITUTIONAL_TEMPLATES.map(tmpl => {
      // Find matching live submission
      const sub = documents.find(d => matchesSubmission(d.doc_type, tmpl));

      // Find matching live draft
      const draft = drafts.find(dr => matchesDraft(dr, tmpl));

      // Phase accessibility logic
      const phaseOrder: Record<string, number> = { before_ojt: 1, in_ojt: 2, final: 3 };
      const currentPhaseLevel = phaseOrder[profilePhase] || 1;
      const tmplPhaseLevel = phaseOrder[tmpl.phase] || 1;
      const isLocked = tmplPhaseLevel > currentPhaseLevel && !sub && !draft;

      // Status determination
      let status: RequirementStatus = 'not_started';
      let statusLabel = 'Not Started';
      let statusTone: 'emerald' | 'amber' | 'rose' | 'sky' | 'zinc' = 'zinc';
      let feedback = sub?.adviser_feedback;
      let submissionDate = sub?.created_at
        ? safeFormatDate(sub.created_at, 'MMM d, yyyy')
        : (draft as any)?.updated_at
        ? safeFormatDate((draft as any).updated_at, 'MMM d, yyyy')
        : (draft as any)?.created_at
        ? safeFormatDate((draft as any).created_at, 'MMM d, yyyy')
        : undefined;
      let link = tmpl.editable ? `/student/editor?template=${tmpl.id}` : `/student/documents?phase=${tmpl.phase}`;
      let actionText = 'Start in Editor';

      if (isLocked) {
        status = 'locked';
        statusLabel = 'Phase Locked';
        statusTone = 'zinc';
        actionText = 'Locked';
      } else if (sub) {
        if (sub.status === 'Approved') {
          status = 'done';
          statusLabel = 'Approved';
          statusTone = 'emerald';
          link = `/student/documents/${sub.id}`;
          actionText = 'View';
        } else if (sub.status === 'Revision Required') {
          status = 'revision';
          statusLabel = 'Revision Required';
          statusTone = 'rose';
          link = tmpl.editable
            ? (draft ? `/student/editor?draft=${draft.id}` : `/student/editor?template=${tmpl.id}`)
            : `/student/documents/${sub.id}`;
          actionText = 'Revise';
        } else if (sub.status === 'Returned') {
          status = 'returned';
          statusLabel = 'Returned';
          statusTone = 'rose';
          link = tmpl.editable
            ? (draft ? `/student/editor?draft=${draft.id}` : `/student/editor?template=${tmpl.id}`)
            : `/student/documents/${sub.id}`;
          actionText = 'Revise';
        } else if (sub.status.includes('Pending')) {
          status = 'pending';
          statusLabel = 'Under Review';
          statusTone = 'amber';
          link = `/student/documents/${sub.id}`;
          actionText = 'View';
        }
      } else if (draft) {
        status = 'draft';
        statusLabel = 'Draft in Progress';
        statusTone = 'sky';
        link = `/student/editor?draft=${draft.id}`;
        actionText = 'Resume';
      } else if (!tmpl.editable) {
        link = `/student/documents?phase=${tmpl.phase}`;
        actionText = 'View Workflow';
      }

      return {
        id: tmpl.id,
        name: tmpl.name,
        description: tmpl.description,
        phase: tmpl.phase,
        icon: tmpl.icon,
        editable: tmpl.editable,
        status,
        statusLabel,
        statusTone,
        feedback,
        submissionDate,
        link,
        actionText,
        draftId: draft?.id,
      };
    });
  }, [documents, drafts, profilePhase]);

  // Active student submissions and drafts (only documents actually worked on / submitted)
  const activeSubmissions = useMemo<DashboardRequirement[]>(() => {
    const matchedRequirements = allRequirements.filter(r => r.status !== 'not_started' && r.status !== 'locked');

    // Also include any standalone drafts that may not have matched an institutional template
    const unmatchedDrafts: DashboardRequirement[] = drafts
      .filter(dr => !matchedRequirements.some(req => req.draftId === dr.id))
      .map(dr => ({
        id: dr.id,
        name: dr.title || dr.template_name || 'Untitled Document',
        description: 'Custom document draft in progress.',
        phase: (dr.phase as 'before_ojt' | 'in_ojt' | 'final') || 'before_ojt',
        icon: FileTextIcon,
        editable: true,
        status: 'draft',
        statusLabel: 'Draft in Progress',
        statusTone: 'sky',
        submissionDate: safeFormatDate(dr.updated_at, 'MMM d, yyyy'),
        link: `/student/editor?draft=${dr.id}`,
        actionText: 'Resume',
        draftId: dr.id,
      }));

    return [...matchedRequirements, ...unmatchedDrafts];
  }, [allRequirements, drafts]);

  const activeApprovedCount = useMemo(() => activeSubmissions.filter(r => r.status === 'done').length, [activeSubmissions]);
  const activePendingCount = useMemo(() => activeSubmissions.filter(r => r.status === 'pending').length, [activeSubmissions]);
  const activeRevisionCount = useMemo(() => activeSubmissions.filter(r => r.status === 'revision' || r.status === 'returned').length, [activeSubmissions]);

  const accessibleRequirementsCount = useMemo(() => {
    return allRequirements.filter(r => r.status !== 'locked').length;
  }, [allRequirements]);

  const approvedDocsCount = useMemo(() => {
    return allRequirements.filter(r => r.status === 'done').length;
  }, [allRequirements]);

  const inProgressDocsCount = useMemo(() => {
    return allRequirements.filter(
      r => r.status === 'pending' || r.status === 'revision' || r.status === 'returned' || r.status === 'draft'
    ).length;
  }, [allRequirements]);

  const appraisalDoc = useMemo(() => {
    return documents.find(d => (d.doc_type || '').toLowerCase().includes('appraisal'));
  }, [documents]);

  const studentPracticumScore = useMemo<number | null>(() => {
    if (appraisalDoc?.ai_findings && typeof appraisalDoc.ai_findings === 'object' && 'score' in appraisalDoc.ai_findings) {
      const parsed = Number((appraisalDoc.ai_findings as any).score);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, [appraisalDoc]);

  const inReviewCount = useMemo(() => {
    return activePendingCount > 0 ? activePendingCount : inProgressDocsCount;
  }, [activePendingCount, inProgressDocsCount]);

  const approvedPercent = useMemo(() => {
    return accessibleRequirementsCount > 0
      ? Math.round((approvedDocsCount / accessibleRequirementsCount) * 100)
      : 0;
  }, [approvedDocsCount, accessibleRequirementsCount]);

  const inReviewPercent = useMemo(() => {
    return accessibleRequirementsCount > 0
      ? Math.min(100, Math.round((inReviewCount / accessibleRequirementsCount) * 100))
      : 0;
  }, [inReviewCount, accessibleRequirementsCount]);

  const gradePercent = useMemo(() => {
    return studentPracticumScore !== null
      ? Math.min(100, Math.max(0, Math.round(studentPracticumScore)))
      : 0;
  }, [studentPracticumScore]);

  // Dynamic Sparkline Waves for Metric Cards (Moves & scales dynamically with counts and grades)
  const approvedWave = useMemo(
    () => generateApprovedWave(approvedDocsCount, accessibleRequirementsCount),
    [approvedDocsCount, accessibleRequirementsCount]
  );

  const reviewWave = useMemo(
    () => generateReviewWave(inReviewCount),
    [inReviewCount]
  );

  const gradeWave = useMemo(
    () => generateGradeWave(studentPracticumScore),
    [studentPracticumScore]
  );

  // Collapsible Dropview State for Due Documents
  const [isDueDocsExpanded, setIsDueDocsExpanded] = useState<boolean>(true);

  // Accessible requirements that are due / needing action (excludes approved and documents currently under review)
  const dueDocumentsList = useMemo(() => {
    return allRequirements.filter(
      r => r.status !== 'done' && r.status !== 'locked' && r.status !== 'pending'
    );
  }, [allRequirements]);

  // ─── To-do Actions ──────────────────────────────────────────────────────────

  const toggleTodo = (id: string) => {
    const updated = todos.map(t => (t.id === id ? { ...t, done: !t.done } : t));
    saveTodos(updated);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      done: false,
      createdAt: Date.now(),
    };
    saveTodos([newTodo, ...todos]);
    setNewTodoText('');
    setIsAddingTodo(false);
    toast.success('Task added to to-do list.');
  };

  const deleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

  // Hours calculation
  const hoursPercent = Math.min(100, Math.round((renderedHours / totalHours) * 1000) / 10);

  // ─── Weekly Hours Trend Chart Data (Mon - Sun) ──────────────────────────────
  const weeklyChartData = useMemo(() => {
    const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const hasHours = renderedHours > 0;
    return days.map((day, idx) => {
      if (idx >= 5) return { day, hours: 0 }; // Weekends
      if (hasHours) {
        const dayThreshold = (idx + 1) * 8;
        const logged = renderedHours >= dayThreshold ? 8 : Math.max(0, renderedHours - idx * 8);
        return { day, hours: Math.min(8, logged) };
      }
      const mockWeek = [6.5, 8, 8, 7.5, 8, 0, 0];
      return { day, hours: mockWeek[idx] };
    });
  }, [renderedHours]);

  // ─── Chart View & Datasets for Reference Boxing Cards ──────────────────────
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');

  // Monthly Hours Progression (Jan - Dec) with actual hours logged & sample fallback
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonthIndex = new Date().getMonth();

    // Map approved DTRs by creation month
    const dtrDocs = documents.filter(d => (d.doc_type || '').toLowerCase().includes('dtr') && d.status === 'Approved');
    const hoursByMonth = new Array(12).fill(0);

    if (dtrDocs.length > 0) {
      dtrDocs.forEach(d => {
        const m = new Date(d.created_at).getMonth();
        if (m >= 0 && m < 12) {
          hoursByMonth[m] += 40; // 40h per approved weekly DTR
        }
      });
    } else if (renderedHours > 0) {
      hoursByMonth[curMonthIndex] = Math.min(160, renderedHours);
    } else {
      // Sample overview data progression across active practicum months
      const sampleMonthly = [32, 64, 96, 120, 80, 0, 0, 0, 0, 0, 0, 0];
      sampleMonthly.forEach((h, idx) => {
        hoursByMonth[idx] = h;
      });
    }

    return months.map((month, idx) => ({
      label: month,
      value: hoursByMonth[idx],
      isCurrent: idx === curMonthIndex,
    }));
  }, [documents, renderedHours]);

  // Weekly Daily Hours (Mon - Sun) with actual hours logged & sample fallback with lower look
  const weeklyBarData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const curDayIndex = (new Date().getDay() + 6) % 7;
    // Lower look for sample daily hours (average ~5.0 hrs instead of all maxed out at 8.0h ceiling)
    const sampleWeekly = [4.5, 6.0, 5.5, 4.0, 5.0, 0.0, 0.0];

    return days.map((day, idx) => {
      const isCurrent = idx === curDayIndex;
      let hours = 0;
      if (supervisorDailyHours && supervisorDailyHours.length === 7) {
        // Use exact supervisor-validated daily hours (time in / out verified)
        hours = supervisorDailyHours[idx] || 0;
      } else if (renderedHours > 0) {
        if (idx < 5) {
          const dayThreshold = (idx + 1) * 8;
          const logged = renderedHours >= dayThreshold ? 8 : Math.max(0, renderedHours - idx * 8);
          hours = Math.min(8, logged);
        }
      } else {
        hours = sampleWeekly[idx];
      }
      return {
        label: day,
        value: hours,
        isCurrent,
      };
    });
  }, [renderedHours, supervisorDailyHours]);

  // Donut Segments for Practicum Progress (Strictly Logged Hours vs Remaining Target)
  // Maintains segment gap separating logged progress from remaining clearance target at the top
  const donutData = useMemo(() => {
    // When 0 hours, maintain a 0.8 sliver so Recharts renders the gap at the top
    const verified = renderedHours > 0 ? renderedHours : 0.8;
    const remaining = Math.max(0, totalHours - (renderedHours > 0 ? renderedHours : 0.8));
    return [
      {
        name: 'Logged Hours',
        value: verified,
        displayHours: renderedHours,
        color: '#0066f5',
      },
      {
        name: 'Remaining Target',
        value: remaining,
        displayHours: Math.max(0, totalHours - renderedHours),
        color: '#10b981',
      },
    ];
  }, [renderedHours, totalHours]);

  // ─── Mini Calendar State & Grid ─────────────────────────────────────────────
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isCalendarHidden, setIsCalendarHidden] = useState<boolean>(false);

  const prevMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectDay = useCallback((cellDate: Date, isCurrentMonth: boolean) => {
    setSelectedDate(cellDate);
    if (!isCurrentMonth) {
      setCalendarDate(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
    }
  }, []);

  const calendarGrid = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];
    const today = new Date();

    // Previous month tail days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const cellDay = daysInPrevMonth - i;
      const cellDate = new Date(year, month - 1, cellDay);
      days.push({
        day: cellDay,
        date: cellDate,
        isCurrentMonth: false,
        isToday: isSameDay(today, cellDate),
        isSelected: isSameDay(selectedDate, cellDate),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const cellDate = new Date(year, month, i);
      days.push({
        day: i,
        date: cellDate,
        isCurrentMonth: true,
        isToday: isSameDay(today, cellDate),
        isSelected: isSameDay(selectedDate, cellDate),
      });
    }

    // Next month head days to fill 35 or 42 cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const cellDate = new Date(year, month + 1, i);
      days.push({
        day: i,
        date: cellDate,
        isCurrentMonth: false,
        isToday: isSameDay(today, cellDate),
        isSelected: isSameDay(selectedDate, cellDate),
      });
    }

    return days;
  }, [calendarDate, selectedDate]);

  // ─── Loading State Skeleton ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_315px] gap-3 sm:gap-3.5 items-start pb-6 animate-in fade-in duration-150">
        {/* Left Column Skeletons */}
        <div className="space-y-3 sm:space-y-3.5 min-w-0 flex-1">
          {/* Hero Banner + 3 Stat Cards */}
          <div className="flex flex-col gap-3 sm:gap-3.5 min-w-0">
            <div className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-card border border-zinc-200 dark:border-border/40 shadow-sm min-h-[110px] flex items-center justify-between gap-4">
              <div className="flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 sm:size-11 rounded-full shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-5 sm:h-5.5 w-44 rounded-lg" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                </div>
                {/* Trainee Information Badges Skeleton (2 rows matching loaded state) */}
                <div className="flex flex-col gap-1.5 pt-0.5 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Skeleton className="h-6 w-24 rounded-full shrink-0" />
                    <Skeleton className="h-6 w-28 rounded-full shrink-0" />
                    <Skeleton className="h-6 w-22 rounded-full shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Skeleton className="h-6 w-32 rounded-full shrink-0" />
                    <Skeleton className="h-6 w-36 rounded-full shrink-0" />
                  </div>
                </div>
              </div>
              <Skeleton className="w-28 h-20 sm:w-36 sm:h-24 md:w-40 md:h-26 rounded-2xl shrink-0 hidden sm:block self-center" />
            </div>

            {/* 3 Metric Stat Cards Skeleton (Single Compact Box + Wave) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-zinc-200 dark:border-border/50 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="size-5.5 rounded-md" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-7 w-12 rounded-md" />
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-7.5 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Total Hours & Practicum Progress Dual Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_275px] gap-3 sm:gap-3.5 items-stretch">
            {/* Total Hours Skeleton */}
            <div className="min-w-0 flex flex-col h-full">
              <div className="p-3.5 sm:p-4 bg-card border border-zinc-200 dark:border-border/40 shadow-sm rounded-2xl min-h-[255px] flex flex-col justify-between space-y-2 h-full">
                <div className="flex justify-between items-center pb-0.5">
                  <Skeleton className="h-4.5 w-36 rounded-md" />
                  <Skeleton className="h-5.5 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-[175px] sm:h-[185px] w-full rounded-xl" />
              </div>
            </div>

            {/* Practicum Progress Skeleton */}
            <div className="min-w-0 flex flex-col h-full">
              <div className="p-3.5 sm:p-4 bg-card border border-zinc-200 dark:border-border/40 shadow-sm rounded-2xl min-h-[255px] flex flex-col justify-between space-y-2 h-full">
                <div className="flex justify-between items-center pb-0.5">
                  <Skeleton className="h-4.5 w-32 rounded-md" />
                  <Skeleton className="size-5.5 rounded-md" />
                </div>
                <div className="relative flex items-center justify-center my-auto min-h-[160px]">
                  <Skeleton className="size-32 rounded-full" />
                  <div className="absolute size-22 rounded-full bg-card flex flex-col items-center justify-center gap-1">
                    <Skeleton className="h-2 w-12 rounded-xs" />
                    <Skeleton className="h-4 w-14 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Submissions Tracker Table Skeleton */}
          <div className="p-3.5 sm:p-4 bg-card border border-zinc-200 dark:border-border/40 shadow-sm rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 pb-0.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4.5 w-36 rounded-md" />
                <Skeleton className="h-4.5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>

            {/* Documents Table Skeleton */}
            <div className="border border-zinc-200 dark:border-border/60 rounded-xl overflow-hidden shadow-2xs bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-zinc-200 dark:border-border/70">
                      <th className="py-2 px-3"><Skeleton className="h-3.5 w-24 rounded-md" /></th>
                      <th className="py-2 px-3"><Skeleton className="h-3.5 w-14 rounded-md" /></th>
                      <th className="py-2 px-3 text-center"><Skeleton className="h-3.5 w-12 rounded-md mx-auto" /></th>
                      <th className="py-2 px-3 text-center"><Skeleton className="h-3.5 w-12 rounded-md mx-auto" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-border/40">
                    {[...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="size-6 rounded-md shrink-0" />
                            <Skeleton className="h-3.5 w-32 sm:w-48 rounded-md" />
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <Skeleton className="h-3 w-16 rounded-md" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Skeleton className="h-4.5 w-16 rounded-full mx-auto" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) Skeletons */}
        <div className="space-y-3 min-w-0 w-full lg:w-[315px] shrink-0">
          {/* 1. Calendar Skeleton */}
          <div className="bg-card border border-zinc-200 dark:border-border/40 shadow-sm rounded-2xl p-3 sm:p-3.5 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>

            {/* Month Nav */}
            <div className="flex items-center justify-between px-0.5">
              <Skeleton className="size-4.5 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="size-4.5 rounded-md" />
            </div>

            {/* Days Container */}
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 text-center font-bold text-[10px] py-0.5">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="size-2.5 rounded-xs mx-auto" />
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="flex items-center justify-center py-0.5">
                    <Skeleton className="size-5 sm:size-5.5 rounded-full mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <Skeleton className="h-3 w-8 rounded-xs" />
            </div>
          </div>

          {/* 2. To-do Skeleton */}
          <div className="p-3 sm:p-3.5 bg-card border border-zinc-200 dark:border-border/40 shadow-sm rounded-2xl space-y-2">
            <div className="flex justify-between items-center pb-0.5 border-b border-zinc-200 dark:border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <Skeleton className="size-4.5 rounded-md" />
            </div>
            <Skeleton className="h-6 w-full rounded-lg" />
            <div className="space-y-1.5 pt-0.5">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-1">
                  <Skeleton className="size-3 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Announcements Skeleton */}
          <div className="p-3 sm:p-3.5 bg-card border border-zinc-200 dark:border-border/40 shadow-sm rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 pb-0.5 border-b border-zinc-200 dark:border-border/60">
              <Skeleton className="size-4 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <Skeleton className="size-3 rounded-md" />
              <Skeleton className="h-3 w-12 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_315px] gap-3 sm:gap-3.5 items-start pb-6 animate-in fade-in duration-300 ease-out">
      {/* ─── LEFT COLUMN: Main Stream (Hero + Stats, Total Hours & Progress Row, Submissions Tracker) ─── */}
      <div className="space-y-3 sm:space-y-3.5 min-w-0 flex-1">
        {/* Section 1: Hero Banner + 3 Stat Cards */}
        <div className="flex flex-col gap-3 sm:gap-3.5 min-w-0">
          {/* Card 1: Compact Hero Greeting Banner (Theme-Aware, High-Contrast & Readable) */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-zinc-200 dark:border-border/40 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="relative z-10 flex items-center justify-between gap-4">
              {/* Left Column: Greeting & Badges */}
              <div className="flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Circular Avatar Badge (matches media_1790091654883.png) */}
                  <div className="size-10 sm:size-11 rounded-full overflow-hidden border border-zinc-200 dark:border-border/80 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-xs shrink-0 select-none">
                    <img
                      src={avatarUrl}
                      alt={user?.name || "Student Avatar"}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground leading-tight truncate">
                      Welcome back, {user?.name || 'John Dwayne B. Guaniso'}
                    </h1>
                    <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                      {format(new Date(), 'd MMMM, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Trainee Information Badges */}
                <div className="flex flex-col gap-1.5 pt-0.5 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 dark:bg-muted/40 border border-zinc-200 dark:border-border/60 text-foreground shadow-2xs hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors shrink-0">
                      <UserIcon size={13} className="text-muted-foreground shrink-0" />
                      <span>ID: {studentId || user?.studentId || '05000372499'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 dark:bg-muted/40 border border-zinc-200 dark:border-border/60 text-foreground shadow-2xs hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors shrink-0">
                      <GraduationCapIcon size={13} className="text-muted-foreground shrink-0" />
                      <span>{displayProgram} - {displaySection}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 dark:bg-muted/40 border border-zinc-200 dark:border-border/60 text-foreground shadow-2xs hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors shrink-0">
                      <Briefcase size={13} className="text-muted-foreground shrink-0" />
                      <span>{isAssignedCompany ? companyName : 'Company'}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 dark:bg-muted/40 border border-zinc-200 dark:border-border/60 text-foreground shadow-2xs hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors shrink-0">
                      <UserCheckIcon size={13} className="text-muted-foreground shrink-0" />
                      <span>Adviser: {adviserName}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 dark:bg-muted/40 border border-zinc-200 dark:border-border/60 text-foreground shadow-2xs hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors shrink-0">
                      <UsersIcon size={13} className="text-muted-foreground shrink-0" />
                      <span>Supervisor: {supervisorName}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Trainee Avatar Illustration (Spans Full Height of Card on Right) */}
              <div className="w-28 h-20 sm:w-36 sm:h-24 md:w-40 md:h-26 shrink-0 hidden sm:flex items-center justify-end pointer-events-none self-center">
                <img
                  src="/images/Dashboard Icons/undraw_focused-dev_gqoa.svg"
                  alt="Trainee Avatar"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Card 2: 3 Metric Stat Cards in a row (Approved Documents, Review in Progress, Practicum Grade) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Card 2A: Approved Documents */}
            <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between select-none overflow-hidden">
              {/* Top Header Row with Title & Kebab Menu */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-[13px] font-bold text-muted-foreground tracking-tight">
                  Approved Documents
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="size-6.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/student/documents')}>
                      <FolderOpen className="size-4 mr-2" />
                      <span>Open Repository</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/documents?phase=before_ojt')}>
                      <FileTextIcon className="size-4 mr-2" />
                      <span>View Requirements</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Numbers & Label Row */}
              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {approvedDocsCount}
                </span>
                <span className="text-[11.5px] sm:text-xs text-muted-foreground font-medium truncate">
                  / {accessibleRequirementsCount} required
                </span>
              </div>

              {/* Soft Light Sparkline Wave (Dynamic path scaled with approved count + smooth animations) */}
              <div className="w-full pt-0.5 -mb-1 overflow-hidden pointer-events-none">
                <svg
                  key={`sparkline-approved-${animationKey}`}
                  viewBox="0 0 300 45"
                  preserveAspectRatio="none"
                  className={cn(
                    "w-full h-7.5 overflow-visible transition-colors duration-200",
                    approvedDocsCount > 0
                      ? "text-emerald-500/80 dark:text-emerald-400/85"
                      : "text-muted-foreground/30"
                  )}
                >
                  <defs>
                    <linearGradient id="metricWaveGrad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity={approvedDocsCount > 0 ? "0.22" : "0.08"} />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Subtle secondary ambient floating wave */}
                  {approvedDocsCount > 0 && (
                    <path
                      d={approvedWave.secFill}
                      fill="currentColor"
                      className="opacity-15 animate-sparkline-float-secondary"
                    />
                  )}
                  {/* Dynamic gradient fill with entrance fade and ambient float */}
                  <path
                    d={approvedWave.fill}
                    fill="url(#metricWaveGrad1)"
                    className="animate-sparkline-fade animate-sparkline-float"
                  />
                  {/* Dynamic stroke with entrance draw and ambient float */}
                  <path
                    d={approvedWave.stroke}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-sparkline-draw animate-sparkline-float"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2B: Review in Progress */}
            <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between select-none overflow-hidden">
              {/* Top Header Row with Title & Kebab Menu */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-[13px] font-bold text-muted-foreground tracking-tight">
                  Review in Progress
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="size-6.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/student/reviews')}>
                      <ClipboardCheckIcon className="size-4 mr-2" />
                      <span>Open Review Center</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/reviews')}>
                      <ClockIcon className="size-4 mr-2" />
                      <span>Pending Submissions</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Numbers & Label Row */}
              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {inReviewCount}
                </span>
                <span className="text-[11.5px] sm:text-xs text-muted-foreground font-medium truncate">
                  awaiting review
                </span>
              </div>

              {/* Soft Light Sparkline Wave (Dynamic path scaled with in-review count + smooth animations) */}
              <div className="w-full pt-0.5 -mb-1 overflow-hidden pointer-events-none">
                <svg
                  key={`sparkline-review-${animationKey}`}
                  viewBox="0 0 300 45"
                  preserveAspectRatio="none"
                  className={cn(
                    "w-full h-7.5 overflow-visible transition-colors duration-200",
                    inReviewCount > 0
                      ? "text-orange-500/85 dark:text-orange-400/90"
                      : "text-muted-foreground/30"
                  )}
                >
                  <defs>
                    <linearGradient id="metricWaveGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity={inReviewCount > 0 ? "0.22" : "0.08"} />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Subtle secondary ambient floating wave */}
                  {inReviewCount > 0 && (
                    <path
                      d={reviewWave.secFill}
                      fill="currentColor"
                      className="opacity-15 animate-sparkline-float-secondary"
                    />
                  )}
                  {/* Dynamic gradient fill with entrance fade and ambient float */}
                  <path
                    d={reviewWave.fill}
                    fill="url(#metricWaveGrad2)"
                    className="animate-sparkline-fade animate-sparkline-float"
                  />
                  {/* Dynamic stroke with entrance draw and ambient float */}
                  <path
                    d={reviewWave.stroke}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-sparkline-draw animate-sparkline-float"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2C: Practicum Grade */}
            <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-xs space-y-1.5 flex flex-col justify-between select-none overflow-hidden">
              {/* Top Header Row with Title & Kebab Menu */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-[13px] font-bold text-muted-foreground tracking-tight">
                  Practicum Grade
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="size-6.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(appraisalDoc ? `/student/documents/${appraisalDoc.id}` : "/student/documents?phase=final")}>
                      <AwardIcon className="size-4 mr-2" />
                      <span>View Appraisal</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/documents?phase=final')}>
                      <GraduationCapIcon className="size-4 mr-2" />
                      <span>Final Phase Docs</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Numbers & Label Row */}
              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {studentPracticumScore !== null ? studentPracticumScore.toFixed(1) : '—'}
                </span>
                <span className="text-[11.5px] sm:text-xs text-muted-foreground font-medium truncate">
                  {studentPracticumScore !== null ? '/ 100' : 'awaiting evaluation'}
                </span>
              </div>

              {/* Soft Light Sparkline Wave (Dynamic path scaled with practicum score + smooth animations) */}
              <div className="w-full pt-0.5 -mb-1 overflow-hidden pointer-events-none">
                <svg
                  key={`sparkline-grade-${animationKey}`}
                  viewBox="0 0 300 45"
                  preserveAspectRatio="none"
                  className={cn(
                    "w-full h-7.5 overflow-visible transition-colors duration-200",
                    studentPracticumScore !== null && studentPracticumScore >= 75
                      ? "text-emerald-500/80 dark:text-emerald-400/85"
                      : studentPracticumScore !== null
                      ? "text-rose-500/80 dark:text-rose-400/85"
                      : "text-muted-foreground/30"
                  )}
                >
                  <defs>
                    <linearGradient id="metricWaveGrad3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity={studentPracticumScore !== null ? "0.22" : "0.08"} />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Subtle secondary ambient floating wave */}
                  {studentPracticumScore !== null && (
                    <path
                      d={gradeWave.secFill}
                      fill="currentColor"
                      className="opacity-15 animate-sparkline-float-secondary"
                    />
                  )}
                  {/* Dynamic gradient fill with entrance fade and ambient float */}
                  <path
                    d={gradeWave.fill}
                    fill="url(#metricWaveGrad3)"
                    className="animate-sparkline-fade animate-sparkline-float"
                  />
                  {/* Dynamic stroke with entrance draw and ambient float */}
                  <path
                    d={gradeWave.stroke}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-sparkline-draw animate-sparkline-float"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Total Hours Overview & Practicum Progress Dual Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_275px] gap-3 sm:gap-3.5 items-stretch">
          {/* Total Hours Overview Chart Card */}
          <div className="min-w-0 flex flex-col h-full">
            <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[255px] space-y-2 overflow-hidden">
              <div className="flex items-center justify-between pb-0.5">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Total Hours Overview</h2>
                </div>
                <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-zinc-200 dark:border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartView('weekly')}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer",
                      chartView === 'weekly' ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('monthly')}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer",
                      chartView === 'monthly' ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="w-full h-[175px] sm:h-[185px] min-w-0">
                <ResponsiveContainer key={`hours-chart-${animationKey}-${chartView}`} width="100%" height="100%" minHeight={175} initialDimension={{ width: 500, height: 185 }} debounce={0}>
                  {chartView === 'monthly' ? (
                    <AreaChart
                      data={monthlyChartData}
                      margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
                      className="text-foreground"
                    >
                      <defs>
                        <linearGradient id="hoursAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-border/40" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        domain={[0, 160]}
                        ticks={[0, 40, 80, 120, 160]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 600 }}
                        className="text-muted-foreground"
                        tickFormatter={(v) => `${v}h`}
                      />
                      <RechartsTooltip
                        cursor={false}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-sm text-xs space-y-0.5">
                                <p className="font-bold text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Hours Logged: <span className="text-foreground font-black">{payload[0].value} hrs</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium">Monthly Target: 160 hrs</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#hoursAreaGradient)"
                        dot={{ r: 3.5, fill: '#10b981', stroke: 'var(--color-card, #fff)', strokeWidth: 1.5 }}
                        activeDot={{ r: 5.5, fill: '#10b981', stroke: 'var(--color-card, #fff)', strokeWidth: 2 }}
                        className="text-emerald-500"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={650}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={weeklyBarData}
                      margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-border/40" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        domain={[0, 8]}
                        ticks={[0, 2, 4, 6, 8]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 600 }}
                        className="text-muted-foreground"
                        tickFormatter={(v) => `${v}h`}
                      />
                      <RechartsTooltip
                        cursor={false}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const val = Number(payload[0].value);
                            const valStr = val % 1 === 0 ? `${val} hrs` : `${val.toFixed(1)} hrs`;
                            return (
                              <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-sm text-xs space-y-0.5">
                                <p className="font-bold text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Hours Logged: <span className="text-foreground font-black">{valStr}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium">Daily Target: 8.0 hrs</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {weeklyBarData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill="currentColor"
                            className={cn(
                              "transition-colors duration-150 cursor-pointer",
                              entry.isCurrent
                                ? "text-emerald-300 dark:text-emerald-400/60 fill-current hover:opacity-90"
                                : entry.value > 0
                                ? "text-emerald-500/80 dark:text-emerald-400/85 fill-current hover:text-emerald-600 dark:hover:text-emerald-300"
                                : "text-muted-foreground/15 dark:text-muted-foreground/10 fill-current"
                            )}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Practicum Progress Card */}
          <div className="min-w-0 flex flex-col h-full">
            <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[255px] space-y-2 overflow-hidden">
              <div className="flex items-center justify-between pb-0.5">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Practicum Progress</h2>
                </div>
                <button
                  type="button"
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Options"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>

              <div className="relative flex items-center justify-center my-auto min-h-[160px] pointer-events-none">
                <ResponsiveContainer key={`progress-donut-${animationKey}`} width="100%" height={160} minHeight={160} initialDimension={{ width: 240, height: 160 }} debounce={0}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={46}
                      outerRadius={66}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cursor="default"
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={650}
                      animationEasing="ease-out"
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          cursor="default"
                          className="outline-none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center animate-in fade-in zoom-in-95 duration-400 ease-out">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Total Hours</span>
                  <span className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight mt-0.5">
                    {renderedHours.toFixed(1)} <span className="text-[11px] font-bold text-muted-foreground">/ {totalHours}h</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: My Document Submissions & Reviews Active Tracker */}
        <div className="min-w-0">
          <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between gap-3 pb-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Submitted Documents
                </h2>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-border/40">
                  {activeSubmissions.length} active
                </span>
              </div>

              <Link
                to="/student/documents"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer group shrink-0"
              >
                <span>Browse all templates</span>
                <ArrowRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Documents Table */}
            <div className="border border-zinc-200 dark:border-border/60 rounded-xl overflow-hidden shadow-2xs bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-zinc-200 dark:border-border/70 text-muted-foreground font-bold">
                        <th scope="col" className="py-2.5 px-3.5 font-bold text-foreground">Document Name</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Date</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground text-center">Status</th>
                        <th scope="col" className="py-2.5 px-3.5 font-bold text-foreground text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-border/40">
                      {activeSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 px-4 text-center">
                            <div className="space-y-2.5 max-w-sm mx-auto">
                              <div className="size-10 rounded-xl bg-muted/60 text-muted-foreground border border-zinc-200 dark:border-border/70 flex items-center justify-center mx-auto">
                                <FolderOpen size={18} className="text-muted-foreground" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-foreground text-sm">No Document Submissions Yet</p>
                                <p className="text-xs text-muted-foreground">
                                  Browse the institutional repository to find your practicum templates, draft requirements, and submit them for review.
                                </p>
                              </div>
                              <div className="pt-1">
                                <Link to="/student/documents">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="h-7.5 px-3 text-xs font-bold rounded-xl shadow-xs active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FolderOpen size={12} />
                                    <span>Open Document Repository</span>
                                    <ArrowRightIcon size={11} />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        activeSubmissions.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-muted/20 transition-colors group"
                          >
                            {/* Document Info */}
                            <td className="py-2.5 px-3.5 align-middle">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src="/images/Dashboard Icons/undraw_action-required_pplo.svg"
                                  alt="Document"
                                  className="size-7 object-contain shrink-0 pointer-events-none"
                                />
                                <span className="font-bold text-foreground text-xs leading-none truncate max-w-[260px] sm:max-w-md">
                                  {item.name}
                                </span>
                              </div>
                            </td>

                            {/* Submitted Date */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-medium text-xs align-middle">
                              {item.submissionDate || safeFormatDate(new Date(), 'MMM d, yyyy')}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-center align-middle">
                              <div className="flex items-center justify-center">
                                <StatusBadge status={item.status} label={item.statusLabel} />
                              </div>
                            </td>

                            {/* Action */}
                            <td className="py-2.5 px-3.5 text-center whitespace-nowrap align-middle">
                              <div className="flex items-center justify-center">
                                <Link to={item.link}>
                                  <Button
                                    variant={item.status === 'revision' || item.status === 'returned' ? 'danger' : item.status === 'done' ? 'outline' : 'primary'}
                                    size="sm"
                                    className="h-7 text-[11px] font-bold rounded-full min-w-[82px] px-3 cursor-pointer inline-flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                                  >
                                    <span>{item.actionText}</span>
                                    <ArrowRightIcon size={10} className="shrink-0" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ─── RIGHT COLUMN: Dedicated Sidebar (Calendar, To-do, Announcements) ─── */}
      <div className="space-y-3 sm:space-y-3.5 min-w-0 w-full lg:w-[315px] shrink-0">
        {/* 1. Calendar Widget (Compact & Theme-Aware) */}
        <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={15} className="text-muted-foreground shrink-0" />
              <h2 className="text-[14.5px] sm:text-base font-bold text-foreground tracking-tight">Calendar</h2>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-0.5">
            <button
              type="button"
              onClick={prevMonth}
              title="Previous month"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span
              className="text-[13px] sm:text-sm font-bold text-foreground tracking-tight select-none"
            >
              {format(calendarDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              title="Next month"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {!isCalendarHidden && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              {/* Day Headers (S M T W T F S) */}
              <div className="grid grid-cols-7 text-center font-bold text-[11px] sm:text-xs text-muted-foreground py-0.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="py-0.5">{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {calendarGrid.map((cell, idx) => (
                  <div key={idx} className="flex items-center justify-center py-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectDay(cell.date, cell.isCurrentMonth)}
                      className={cn(
                        "size-6 sm:size-6.5 flex items-center justify-center mx-auto rounded-full text-[11px] sm:text-xs transition-all cursor-pointer",
                        cell.isSelected
                          ? "bg-foreground text-background font-bold shadow-xs scale-105"
                          : cell.isToday
                          ? "border border-zinc-300 dark:border-border font-bold text-foreground hover:bg-muted/60"
                          : cell.isCurrentMonth
                          ? "font-medium text-foreground hover:bg-muted/60"
                          : "text-muted-foreground/30 hover:bg-muted/30 hover:text-muted-foreground/60"
                      )}
                      title={format(cell.date, 'PPPP')}
                    >
                      {cell.day}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="pt-1.5 flex items-center justify-between text-xs">
            <Link
              to="/student/calendar"
              className="text-muted-foreground hover:text-foreground font-semibold hover:underline cursor-pointer transition-colors"
            >
              full calendar
            </Link>
            <button
              type="button"
              onClick={() => setIsCalendarHidden(prev => !prev)}
              className="text-muted-foreground hover:text-foreground font-semibold hover:underline cursor-pointer transition-colors"
            >
              {isCalendarHidden ? 'show' : 'hide'}
            </button>
          </div>
        </div>

        {/* 2. To-do Widget (Compact & Theme-Aware) */}
        <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-border/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-muted-foreground shrink-0" />
              <h2 className="text-[14.5px] sm:text-base font-bold text-foreground tracking-tight">To-do</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsAddingTodo(prev => !prev)}
                title={isAddingTodo ? "Cancel" : "Add to-do"}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95"
              >
                {isAddingTodo ? <X size={15} /> : <Plus size={15} />}
              </button>
            </div>
          </div>

          {/* Quick Add Form */}
          {isAddingTodo && (
            <form onSubmit={handleAddTodo} className="space-y-1.5 py-1 animate-in fade-in duration-200 border-b border-zinc-200 dark:border-border/60">
              <input
                type="text"
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                placeholder="Type new to-do..."
                autoFocus
                className="w-full text-xs sm:text-[13px] px-2.5 py-1.5 rounded-lg bg-muted/30 border border-zinc-200 dark:border-border focus:outline-none focus:border-primary text-foreground"
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingTodo(false);
                    setNewTodoText('');
                  }}
                  className="h-7 text-xs px-2.5 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newTodoText.trim()}
                  className="h-7 text-xs px-3 rounded-lg font-bold"
                >
                  Add To-do
                </Button>
              </div>
            </form>
          )}

          {/* Action Items List */}
          <div className="space-y-2 text-xs sm:text-[13px]">
            {/* Due Documents Dropview Header Toggle */}
            <button
              type="button"
              onClick={() => setIsDueDocsExpanded(prev => !prev)}
              className="flex items-center justify-between w-full py-1 text-foreground hover:text-foreground/80 transition-colors font-semibold group cursor-pointer text-xs sm:text-[13px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileTextIcon size={15} className="text-muted-foreground group-hover:text-foreground shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate text-xs sm:text-[13px] font-bold">
                  {dueDocumentsList.length} assignments due
                </span>
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  "text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0",
                  isDueDocsExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Collapsible Due Documents Bullet List */}
            {isDueDocsExpanded && (
              <div className="space-y-1 pt-0.5 pb-1 animate-in fade-in duration-200">
                <div className="border-t border-zinc-200 dark:border-border/40 max-h-[165px] overflow-y-auto pr-0.5 divide-y divide-zinc-200/80 dark:divide-border/30">
                  {dueDocumentsList.length > 0 ? (
                    dueDocumentsList.map(req => (
                      <Link
                        key={req.id}
                        to={req.link}
                        className="flex items-center justify-between gap-2.5 py-1.5 px-1.5 rounded-md text-xs sm:text-[13px] hover:bg-muted/40 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="size-2 rounded-full bg-muted-foreground/60 shrink-0 group-hover:bg-foreground group-hover:scale-125 transition-all" />
                          <span className="truncate text-xs sm:text-[13px] font-semibold text-foreground group-hover:text-foreground transition-colors">
                            {req.name}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-2 text-center text-xs text-muted-foreground italic">
                      All required documents submitted!
                    </div>
                  )}
                </div>

                {/* Bottom Collapse Chevron Button */}
                <button
                  type="button"
                  onClick={() => setIsDueDocsExpanded(false)}
                  className="w-full flex items-center justify-center pt-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                  title="Collapse due documents"
                >
                  <ChevronUp size={15} className="group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* User Custom Todos if any */}
            {todos.length > 0 && (
              <div className="pt-1.5 border-t border-zinc-200 dark:border-border/40 space-y-1 max-h-[120px] overflow-y-auto pr-0.5">
                {todos.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className="flex items-center justify-between gap-2.5 p-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.done ? (
                        <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                          <Check size={10} strokeWidth={3.5} />
                        </div>
                      ) : (
                        <div className="size-4 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary shrink-0 transition-colors" />
                      )}
                      <span className={cn(
                        "truncate text-xs sm:text-[13px] font-semibold",
                        item.done ? "text-muted-foreground line-through font-normal" : "text-foreground"
                      )}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={e => deleteTodo(item.id, e)}
                      title="Delete"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-500 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Announcements Widget (Compact & Theme-Aware) */}
        <div className="bg-card border border-zinc-200 dark:border-border/40 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-border/60">
            <Megaphone size={15} className="text-muted-foreground shrink-0" />
            <h2 className="text-[14.5px] sm:text-base font-bold text-foreground tracking-tight">Announcements</h2>
          </div>

          <div className="flex items-center gap-2.5 py-1 text-xs sm:text-[13px] text-muted-foreground">
            <Megaphone size={14} className="text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground text-xs sm:text-[13px]">None</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentDashboardWithBoundary: React.FC = (props) => (
  <ErrorBoundary>
    <StudentDashboard {...props} />
  </ErrorBoundary>
);

export default StudentDashboardWithBoundary;
