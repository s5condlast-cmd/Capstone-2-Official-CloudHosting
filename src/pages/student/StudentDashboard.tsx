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
  RotateCw,
  Trash2,
  ShieldCheck,
  FolderOpen,
  MoreHorizontal,
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
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  children?: React.ReactNode;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 52,
  strokeWidth = 4.5,
  colorClass = "text-primary",
  trackClass = "text-muted/20 dark:text-muted/15",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
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
          className={cn(colorClass, "transition-all duration-500 ease-out", clampedValue === 0 && "opacity-0")}
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

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live database data
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [profilePhase, setProfilePhase] = useState<'before_ojt' | 'in_ojt' | 'final'>('before_ojt');

  // Profile metadata
  const [studentId, setStudentId] = useState<string>('');
  const [programName, setProgramName] = useState<string>('');
  const [sectionName, setSectionName] = useState<string>('');

  const displayProgram = useMemo(() => {
    const raw = programName || user?.course || 'BSIT';
    // If program string includes digits (e.g., "BSIT 402"), isolate the program code
    const stripped = raw.replace(/\s*\d+.*$/, '').trim();
    return stripped || 'BSIT';
  }, [programName, user?.course]);
  const [supervisorName, setSupervisorName] = useState<string>('Engr. Paolo Reyes');
  const [adviserName, setAdviserName] = useState<string>('Dr. Sarah Johnson');
  const [companyName, setCompanyName] = useState<string>('InnoTech Labs Inc.');
  const [isAssignedCompany, setIsAssignedCompany] = useState<boolean>(true);
  const [renderedHours, setRenderedHours] = useState<number>(0.0);
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

  // Load fresh data from Supabase
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch live Profile
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, full_name, role, student_id, program, section, company_name, adviser_id, supervisor_id, practicum_phase')
          .eq('id', user.id)
          .maybeSingle();

        if (prof) {
          if (prof.student_id) setStudentId(prof.student_id);
          if (prof.program) setProgramName(prof.program);
          if (prof.section) setSectionName(prof.section);

          if (prof.practicum_phase && ['before_ojt', 'in_ojt', 'final'].includes(prof.practicum_phase)) {
            setProfilePhase(prof.practicum_phase as 'before_ojt' | 'in_ojt' | 'final');
          }

          if (prof.company_name) {
            setCompanyName(prof.company_name);
            setIsAssignedCompany(true);
          } else {
            setCompanyName('Not Assigned');
            setIsAssignedCompany(false);
          }

          // Fetch adviser details if assigned
          if (prof.adviser_id) {
            const { data: adv } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', prof.adviser_id)
              .maybeSingle();
            if (adv?.full_name) setAdviserName(adv.full_name);
          } else {
            setAdviserName('Awaiting Assignment');
          }

          // Fetch supervisor details if assigned
          if (prof.supervisor_id) {
            const { data: sup } = await supabase
              .from('profiles')
              .select('full_name, company_name')
              .eq('id', prof.supervisor_id)
              .maybeSingle();
            if (sup?.full_name) setSupervisorName(sup.full_name);
            if (sup?.company_name) {
              setCompanyName(sup.company_name);
              setIsAssignedCompany(true);
            }
          } else if (!prof.company_name) {
            setSupervisorName('Awaiting Placement');
          }
        }
      } else {
        // Demo fallback values
        setStudentId('2023-010482');
        setProgramName('BSIT');
        setSectionName('IT401');
        setCompanyName('InnoTech Labs Inc.');
        setIsAssignedCompany(true);
        setSupervisorName('Engr. Paolo Reyes');
        setAdviserName('Dr. Sarah Johnson');
        setRenderedHours(120.0);
      }

      // 2. Fetch Submissions
      let query = supabase
        .from('student_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.id) {
        query = query.or(`owner_id.eq.${user.id},student_name.ilike.${user.name || ''}`);
      }

      const { data: docData } = await query;

      if (docData) {
        const studentDocs = user?.name
          ? (docData as StudentDocument[]).filter(
              d => d.owner_id === user.id || d.student_name.toLowerCase() === user.name.toLowerCase()
            )
          : (docData as StudentDocument[]);
        setDocuments(studentDocs);

        // Calculate actual rendered hours based on approved DTRs
        const dtrDocs = studentDocs.filter(d => (d.doc_type || '').toLowerCase().includes('dtr'));
        const approvedDtrs = dtrDocs.filter(d => d.status === 'Approved');
        if (user?.id) {
          // Live student: 40 hrs per approved DTR submission
          setRenderedHours(Math.min(460, approvedDtrs.length * 40));
        }
      }

      // 3. Fetch Drafts from Supabase
      if (user?.id) {
        const { data: draftData } = await supabase
          .from('editor_drafts')
          .select('id, title, template_id, template_name, phase, status, updated_at')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false });

        if (draftData) {
          setDrafts(draftData as DraftRecord[]);
        }
      }

      if (isManualRefresh) {
        toast.success('Practicum data refreshed.');
      }
    } catch (err) {
      console.warn('Dashboard sync note: Running in resilient mode', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.name]);

  useEffect(() => {
    void loadDashboardData();
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
      let submissionDate = sub?.created_at ? safeFormatDate(sub.created_at, 'MMM d, yyyy') : undefined;
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
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');

  // Monthly Hours Progression (Jan - Dec) with actual hours logged
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
    }

    return months.map((month, idx) => ({
      label: month,
      value: hoursByMonth[idx],
      isCurrent: idx === curMonthIndex,
    }));
  }, [documents, renderedHours]);

  // Weekly Daily Hours (Mon - Sun) with actual hours logged
  const weeklyBarData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const curDayIndex = (new Date().getDay() + 6) % 7;
    return days.map((day, idx) => {
      const isCurrent = idx === curDayIndex;
      let hours = 0;
      if (idx < 5 && renderedHours > 0) {
        const dayThreshold = (idx + 1) * 8;
        const logged = renderedHours >= dayThreshold ? 8 : Math.max(0, renderedHours - idx * 8);
        hours = Math.min(8, logged);
      }
      return {
        label: day,
        value: hours,
        isCurrent,
      };
    });
  }, [renderedHours]);

  // Donut Segments for Practicum Progress (Strictly Logged Hours vs Remaining Target)
  // Maintains segment gap separating logged progress from remaining clearance target
  const donutData = useMemo(() => {
    const verified = Math.max(renderedHours, 0.1);
    const remaining = Math.max(totalHours - renderedHours, 1);
    return [
      { name: 'Logged Hours', value: verified, color: '#0066f5' },
      { name: 'Remaining Target', value: remaining, color: '#10b981' },
    ];
  }, [renderedHours, totalHours]);

  // ─── Mini Calendar State & Grid ─────────────────────────────────────────────
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [isCalendarHidden, setIsCalendarHidden] = useState<boolean>(false);

  const prevMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const calendarGrid = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const today = new Date();

    // Previous month tail days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday =
        today.getDate() === i &&
        today.getMonth() === month &&
        today.getFullYear() === year;
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Next month head days to fill 35 or 42 cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [calendarDate]);

  // ─── Loading State Skeleton ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start pb-10 animate-in fade-in duration-300">
        {/* Left Column Skeletons */}
        <div className="space-y-4 min-w-0 flex-1">
          {/* Hero Banner + 3 Stat Cards */}
          <div className="flex flex-col gap-3.5 sm:gap-4 min-w-0">
            <div className="rounded-2xl sm:rounded-3xl p-4.5 sm:p-5 bg-card border border-border/60 dark:border-border/40 shadow-sm min-h-[118px] flex items-center justify-between gap-4">
              <div className="flex flex-col justify-between gap-3 sm:gap-3.5 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 sm:size-12 rounded-full shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-0.5 w-full">
                  <Skeleton className="h-5 w-24 rounded-full shrink-0" />
                  <Skeleton className="h-5 w-28 rounded-full shrink-0" />
                  <Skeleton className="h-5 w-32 rounded-full shrink-0" />
                  <Skeleton className="h-5 w-24 rounded-full shrink-0" />
                </div>
              </div>
              <Skeleton className="w-32 h-24 sm:w-40 sm:h-28 md:w-48 md:h-32 rounded-xl shrink-0 hidden sm:block self-center" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center gap-3 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
                    <Skeleton className="size-11 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border/60 dark:border-border/40 px-3.5 py-2 sm:px-4 sm:py-2.5 flex justify-end">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Total Hours & Practicum Progress Dual Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-4 items-stretch">
            {/* Total Hours Skeleton */}
            <div className="p-4 sm:p-4.5 bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl min-h-[310px] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </div>

            {/* Practicum Progress Skeleton */}
            <div className="p-4 sm:p-4.5 bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl min-h-[310px] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="size-5 rounded-md" />
              </div>
              <Skeleton className="size-40 rounded-full mx-auto my-auto" />
            </div>
          </div>

          {/* Submissions Tracker Skeleton */}
          <div className="p-4 sm:p-5 bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl space-y-3.5">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-7 w-36 rounded-xl" />
            </div>
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Column (Sidebar) Skeletons */}
        <div className="space-y-4 min-w-0 w-full lg:w-[300px] shrink-0">
          {/* Calendar Skeleton */}
          <div className="p-3.5 sm:p-4 bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl space-y-2.5">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4.5 w-24 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <Skeleton className="h-38 w-full rounded-xl" />
          </div>

          {/* To-do Skeleton */}
          <div className="p-3.5 sm:p-4 bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl space-y-2.5">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4.5 w-20 rounded-md" />
              <Skeleton className="size-5 rounded-md" />
            </div>
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
          </div>

          {/* Announcements Skeleton */}
          <div className="p-3 sm:p-3.5 bg-card border border-border/60 dark:border-border/40 shadow-sm rounded-2xl space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4.5 w-16 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start pb-10 animate-in fade-in duration-300">
      {/* ─── LEFT COLUMN: Main Stream (Hero + Stats, Total Hours & Progress Row, Submissions Tracker) ─── */}
      <div className="space-y-4 min-w-0 flex-1">
        {/* Section 1: Hero Banner + 3 Stat Cards */}
        <div className="flex flex-col gap-3.5 sm:gap-4 min-w-0">
          {/* Card 1: Compact Hero Greeting Banner (Theme-Aware, High-Contrast & Readable) */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border/60 dark:border-border/40 p-4.5 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Ambient Lighting Gradients */}
            <div className="absolute -top-16 -right-16 size-52 rounded-full bg-blue-500/[0.12] dark:bg-blue-500/[0.15] blur-3xl pointer-events-none" />
            <div className="absolute top-4 right-12 size-36 rounded-full bg-[#FBBF24]/[0.08] blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-emerald-500/[0.06] blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              {/* Left Column: Greeting & Badges */}
              <div className="flex flex-col justify-between gap-3 sm:gap-3.5 min-w-0 flex-1">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  {/* Circular Avatar Badge */}
                  <div className="size-11 sm:size-12 rounded-full overflow-hidden border border-border/80 bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-xs shrink-0 select-none">
                    {(user as any)?.avatar_url || (user as any)?.avatarUrl ? (
                      <img
                        src={(user as any)?.avatar_url || (user as any)?.avatarUrl}
                        alt={user?.name || "Student Avatar"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(user?.name, 'JD')}</span>
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight truncate">
                      Welcome back, {user?.name ? user.name.split(' ')[0] : 'Darrel'}
                    </h1>
                    <p className="text-xs sm:text-[13px] font-medium text-muted-foreground">
                      {format(new Date(), 'd MMMM, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Trainee Information Badges (Single Row, Aligned next to ID & Section) */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-0.5 w-full">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 text-foreground shadow-2xs hover:bg-blue-500/20 transition-colors shrink-0 whitespace-nowrap">
                    <UserIcon size={11} className="text-blue-500 dark:text-blue-400 shrink-0" />
                    <span>ID: {studentId || user?.studentId || '2023-010482'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 text-foreground shadow-2xs hover:bg-sky-500/20 transition-colors shrink-0 whitespace-nowrap">
                    <GraduationCapIcon size={11} className="text-sky-500 dark:text-sky-400 shrink-0" />
                    <span>{displayProgram} • {sectionName || user?.section || 'BSIT 402'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-foreground shadow-2xs hover:bg-emerald-500/20 transition-colors shrink-0 whitespace-nowrap">
                    <UserCheckIcon size={11} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>Mentor: {adviserName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FBBF24]/10 dark:bg-[#FBBF24]/15 border border-[#FBBF24]/30 text-foreground shadow-2xs hover:bg-[#FBBF24]/20 transition-colors shrink-0 whitespace-nowrap">
                    <Briefcase size={11} className="text-amber-500 dark:text-[#FBBF24] shrink-0" />
                    <span>{isAssignedCompany ? companyName : 'Awaiting Match'}</span>
                  </span>
                </div>
              </div>

              {/* Trainee Avatar Illustration (Spans Full Height of Card on Right) */}
              <div className="w-32 h-24 sm:w-40 sm:h-28 md:w-48 md:h-32 shrink-0 hidden sm:flex items-center justify-end pointer-events-none self-center">
                <img
                  src="/images/Dashboard Icons/undraw_focused-dev_gqoa.svg"
                  alt="Trainee Avatar"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Card 2: 3 Metric Stat Cards in a row (Approved, In Progress, Grade) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            {/* Card 2A: Approved Documents */}
            <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
              <div className="flex items-center gap-3 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
                <ProgressCircle
                  value={approvedPercent}
                  size={46}
                  strokeWidth={4.5}
                  colorClass="text-emerald-500 dark:text-emerald-400"
                  trackClass="text-emerald-500/15 dark:text-emerald-500/20"
                >
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {approvedDocsCount}
                  </span>
                </ProgressCircle>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-[15px] font-bold text-foreground tracking-tight leading-tight truncate">
                    Approved Documents
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                    / {accessibleRequirementsCount} required
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-border/60 dark:border-border/40 px-3.5 py-2 sm:px-4 sm:py-2.5">
                <Link
                  to="/student/documents"
                  className="flex items-center justify-end gap-1.5 text-xs sm:text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors group/link cursor-pointer"
                >
                  <span>View approved docs</span>
                  <ArrowRightIcon size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2B: In Progress Documents */}
            <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
              <div className="flex items-center gap-3 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
                <ProgressCircle
                  value={inReviewPercent}
                  size={46}
                  strokeWidth={4.5}
                  colorClass="text-[#FBBF24]"
                  trackClass="text-[#FBBF24]/20"
                >
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {inReviewCount}
                  </span>
                </ProgressCircle>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-[15px] font-bold text-foreground tracking-tight leading-tight truncate">
                    Review in Progress
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                    Awaiting mentor review
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-border/60 dark:border-border/40 px-3.5 py-2 sm:px-4 sm:py-2.5">
                <Link
                  to="/student/reviews"
                  className="flex items-center justify-end gap-1.5 text-xs sm:text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors group/link cursor-pointer"
                >
                  <span>Open Review Center</span>
                  <ArrowRightIcon size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2C: Practicum Grade */}
            <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
              <div className="flex items-center gap-3 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
                <ProgressCircle
                  value={gradePercent}
                  size={46}
                  strokeWidth={4.5}
                  colorClass="text-blue-500 dark:text-blue-400"
                  trackClass="text-blue-500/15 dark:text-blue-500/20"
                >
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {studentPracticumScore !== null ? Math.round(studentPracticumScore) : '—'}
                  </span>
                </ProgressCircle>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-[15px] font-bold text-foreground tracking-tight leading-tight truncate">
                    Practicum Grade
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                    {studentPracticumScore !== null ? `${studentPracticumScore.toFixed(1)} / 100` : 'Awaiting evaluation'}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-border/60 dark:border-border/40 px-3.5 py-2 sm:px-4 sm:py-2.5">
                <Link
                  to={appraisalDoc ? `/student/documents/${appraisalDoc.id}` : "/student/documents?phase=final"}
                  className="flex items-center justify-end gap-1.5 text-xs sm:text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors group/link cursor-pointer"
                >
                  <span>View appraisal</span>
                  <ArrowRightIcon size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Total Hours Overview & Practicum Progress Dual Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-4 items-stretch">
          {/* Total Hours Overview Chart Card */}
          <div className="min-w-0 flex flex-col h-full">
            <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[310px] space-y-2.5">
              <div className="flex items-center justify-between pb-0.5">
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight">Total Hours Overview</h2>
                </div>
                <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/60 text-xs">
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
                </div>
              </div>

              <div className="w-full h-[215px] sm:h-[225px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'monthly' ? (
                    <AreaChart
                      data={monthlyChartData}
                      margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
                      className="text-foreground"
                    >
                      <defs>
                        <linearGradient id="hoursAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="currentColor" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
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
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-lg text-xs space-y-0.5">
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
                        stroke="currentColor"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#hoursAreaGradient)"
                        dot={{ r: 3.5, fill: 'currentColor', stroke: 'var(--color-card, #000)', strokeWidth: 1.5 }}
                        activeDot={{ r: 5.5, fill: 'currentColor', stroke: 'var(--color-card, #000)', strokeWidth: 2 }}
                        className="text-foreground"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={weeklyBarData}
                      margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
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
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-lg text-xs space-y-0.5">
                                <p className="font-bold text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Hours Logged: <span className="text-foreground font-black">{payload[0].value} hrs</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium">Daily Target: 8.0 hrs</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {weeklyBarData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill="currentColor"
                            className={
                              entry.isCurrent
                                ? 'text-foreground fill-current'
                                : entry.value > 0
                                ? 'text-muted-foreground fill-current'
                                : 'text-muted-foreground/20 dark:text-muted-foreground/15 fill-current'
                            }
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
            <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[310px] space-y-3">
              <div className="flex items-center justify-between pb-0.5">
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight">Practicum Progress</h2>
                </div>
                <button
                  type="button"
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Options"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>

              <div className="relative flex items-center justify-center my-auto min-h-[190px]">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={76}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Hours</span>
                  <span className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-tight mt-0.5">
                    {renderedHours.toFixed(1)} <span className="text-xs font-bold text-muted-foreground">/ {totalHours}h</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: My Document Submissions & Reviews Active Tracker */}
        <div className="min-w-0">
          {/* Card 4: My Document Submissions & Reviews Active Tracker */}
          <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-3.5">
            <div className="flex items-center justify-between gap-3 pb-0.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Submitted Documents
                </h2>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
                  {activeSubmissions.length} active
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/student/documents"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1 transition-colors mr-1 cursor-pointer group"
                >
                  <span>Browse all templates</span>
                  <ArrowRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/student/documents" className="shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold text-xs h-8 px-3.5 rounded-xl cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1.5"
                  >
                    <FolderOpen size={13} />
                    <span>Open Repository</span>
                    <ArrowRightIcon size={12} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Documents Table */}
            <div className="border border-border/35 rounded-xl overflow-hidden shadow-2xs bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/70 text-muted-foreground font-bold">
                        <th scope="col" className="py-2.5 px-3.5 font-bold text-foreground">Document Name</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Submitted / Updated</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground text-center">Status</th>
                        <th scope="col" className="py-2.5 px-3.5 font-bold text-foreground text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {activeSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 px-4 text-center">
                            <div className="space-y-2.5 max-w-sm mx-auto">
                              <div className="size-10 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 flex items-center justify-center mx-auto">
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
                                <div className="size-7 rounded-lg flex items-center justify-center shrink-0 border border-border/60 bg-muted/40 text-muted-foreground group-hover:text-foreground transition-colors">
                                  <item.icon size={13} />
                                </div>
                                <span className="font-bold text-foreground text-xs leading-none truncate max-w-[260px] sm:max-w-md">
                                  {item.name}
                                </span>
                              </div>
                            </td>

                            {/* Submitted / Updated Date */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-medium text-xs align-middle">
                              {item.submissionDate || (item.status === 'draft' ? 'Draft saved' : 'Recently')}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-center align-middle">
                              <span className={cn(
                                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight shadow-2xs transition-colors",
                                item.status === 'done'
                                  ? "bg-[#dcfce7] text-[#166534] dark:bg-emerald-500/15 dark:border dark:border-emerald-500/30 dark:text-emerald-400"
                                  : item.status === 'revision' || item.status === 'returned'
                                  ? "bg-[#fee2e2] text-[#991b1b] dark:bg-rose-500/15 dark:border dark:border-rose-500/30 dark:text-rose-400"
                                  : item.status === 'pending'
                                  ? "bg-[#ffedd5] text-[#9a3412] dark:bg-amber-500/15 dark:border dark:border-amber-500/30 dark:text-[#fbbf24]"
                                  : "bg-[#dbeafe] text-[#1e40af] dark:bg-sky-500/15 dark:border dark:border-sky-500/30 dark:text-sky-400"
                              )}>
                                {item.statusLabel}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap align-middle">
                              <Link to={item.link}>
                                <Button
                                  variant={item.status === 'revision' || item.status === 'returned' ? 'danger' : item.status === 'done' ? 'outline' : 'primary'}
                                  size="sm"
                                  className="h-6.5 text-[10.5px] font-bold rounded-lg px-2.5 cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-95"
                                >
                                  <span>{item.actionText}</span>
                                  <ArrowRightIcon size={10} />
                                </Button>
                              </Link>
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
      <div className="space-y-3.5 min-w-0 w-full lg:w-[300px] shrink-0">
        {/* 1. Calendar Widget (Compact & Theme-Aware) */}
        <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-0.5 border-b border-border/60">
            <Link
              to="/student/calendar"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <CalendarIcon size={15} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight group-hover:underline">Calendar</h2>
            </Link>
            <Link
              to="/student/calendar"
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Open Full
            </Link>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-0.5">
            <button
              type="button"
              onClick={prevMonth}
              title="Previous month"
              className="p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <Link
              to="/student/calendar"
              className="text-xs sm:text-sm font-bold text-foreground hover:underline tracking-tight cursor-pointer"
              title="Open calendar"
            >
              {format(calendarDate, 'MMM yyyy')}
            </Link>
            <button
              type="button"
              onClick={nextMonth}
              title="Next month"
              className="p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {!isCalendarHidden && (
            <div className="space-y-1 animate-in fade-in duration-200">
              {/* Day Headers (S M T W T F S) */}
              <div className="grid grid-cols-7 text-center font-bold text-[10.5px] text-muted-foreground py-0.5 border-b border-border/40">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="py-0.5">{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11px]">
                {calendarGrid.map((cell, idx) => (
                  <div key={idx} className="flex items-center justify-center py-0.5">
                    {cell.isToday ? (
                      <Link
                        to="/student/calendar"
                        className="size-5.5 sm:size-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto shadow-xs text-[11px] hover:opacity-90 transition-opacity"
                        title="Today — Open in Calendar"
                      >
                        {cell.day}
                      </Link>
                    ) : cell.isCurrentMonth ? (
                      <Link
                        to="/student/calendar"
                        className="size-5.5 sm:size-6 flex items-center justify-center mx-auto font-medium text-foreground hover:bg-muted/60 rounded-full cursor-pointer transition-colors text-[11px]"
                        title="Open in Calendar"
                      >
                        {cell.day}
                      </Link>
                    ) : (
                      <span className="size-5.5 sm:size-6 flex items-center justify-center mx-auto text-muted-foreground/30 font-normal text-[11px]">
                        {cell.day}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
            <Link
              to="/student/calendar"
              className="text-muted-foreground hover:text-foreground font-bold hover:underline cursor-pointer transition-colors"
            >
              full calendar
            </Link>
            <button
              type="button"
              onClick={() => setIsCalendarHidden(prev => !prev)}
              className="text-muted-foreground hover:text-foreground font-bold hover:underline cursor-pointer transition-colors"
            >
              {isCalendarHidden ? 'show' : 'hide'}
            </button>
          </div>
        </div>

        {/* 2. To-do Widget (Compact & Theme-Aware) */}
        <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-2.5">
          <div className="flex items-center justify-between pb-0.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-muted-foreground shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">To-do</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsAddingTodo(prev => !prev)}
                title={isAddingTodo ? "Cancel" : "Add to-do"}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95"
              >
                {isAddingTodo ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>
          </div>

          {/* Quick Add Form */}
          {isAddingTodo && (
            <form onSubmit={handleAddTodo} className="space-y-1.5 py-1 animate-in fade-in duration-200 border-b border-border/60">
              <input
                type="text"
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                placeholder="Type new to-do..."
                autoFocus
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border focus:outline-none focus:border-primary text-foreground"
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
                  className="h-6 text-[11px] px-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newTodoText.trim()}
                  className="h-6 text-[11px] px-2.5 rounded-lg font-bold"
                >
                  Add To-do
                </Button>
              </div>
            </form>
          )}

          {/* Action Items List */}
          <div className="space-y-1.5 text-xs">
            {/* Due Documents Dropview Header Toggle */}
            <button
              type="button"
              onClick={() => setIsDueDocsExpanded(prev => !prev)}
              className="flex items-center justify-between w-full py-1 text-foreground hover:text-foreground/80 transition-colors font-semibold group cursor-pointer text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileTextIcon size={14} className="text-muted-foreground group-hover:text-foreground shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate text-xs font-bold group-hover:underline">
                  {dueDocumentsList.length} assignments due
                </span>
              </div>
              <ChevronDown
                size={13}
                className={cn(
                  "text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0",
                  isDueDocsExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Collapsible Due Documents Bullet List */}
            {isDueDocsExpanded && (
              <div className="space-y-1 pt-0.5 pb-1 animate-in fade-in duration-200">
                <div className="border-t border-border/40 max-h-[160px] overflow-y-auto pr-0.5 divide-y divide-border/30">
                  {dueDocumentsList.length > 0 ? (
                    dueDocumentsList.map(req => (
                      <Link
                        key={req.id}
                        to={req.link}
                        className="flex items-center justify-between gap-2 py-1.5 px-1 rounded-md text-xs hover:bg-muted/40 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0 group-hover:bg-foreground group-hover:scale-125 transition-all" />
                          <span className="truncate text-xs font-semibold text-foreground group-hover:text-foreground group-hover:underline transition-colors">
                            {req.name}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[11px] text-muted-foreground italic">
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
                  <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* User Custom Todos if any */}
            {todos.length > 0 && (
              <div className="pt-1.5 border-t border-border/40 space-y-1 max-h-[120px] overflow-y-auto pr-0.5">
                {todos.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className="flex items-center justify-between gap-2 p-1 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.done ? (
                        <div className="size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                          <Check size={9} strokeWidth={3.5} />
                        </div>
                      ) : (
                        <div className="size-3.5 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary shrink-0 transition-colors" />
                      )}
                      <span className={cn(
                        "truncate text-xs font-semibold",
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
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Announcements Widget (Compact & Theme-Aware) */}
        <div className="bg-card border border-border/60 dark:border-border/40 rounded-2xl p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-200 space-y-2">
          <div className="flex items-center gap-2 pb-0.5 border-b border-border/60">
            <Megaphone size={15} className="text-muted-foreground shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Announcements</h2>
          </div>

          <div className="flex items-center gap-2.5 py-0.5 text-xs text-muted-foreground">
            <Megaphone size={13} className="text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground text-xs">None</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
