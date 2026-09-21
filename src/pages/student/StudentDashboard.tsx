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
  Building2 as BuildingIcon,
  Sparkles,
  CheckCheck,
  Plus,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  Briefcase,
  X,
  AlertTriangle,
  AlertCircle,
  RotateCw,
  Trash2,
  ShieldCheck,
  CalendarDays,
  FileCheck2,
  FolderOpen,
  MoreHorizontal,
  TrendingUp,
  PenLine,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  const [tablePhaseTab, setTablePhaseTab] = useState<'all' | 'before' | 'in' | 'final'>('before');

  // Live database data
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [profilePhase, setProfilePhase] = useState<'before_ojt' | 'in_ojt' | 'final'>('before_ojt');

  // Profile metadata
  const [studentId, setStudentId] = useState<string>('');
  const [programName, setProgramName] = useState<string>('');
  const [sectionName, setSectionName] = useState<string>('');
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

  // Mini Calendar State
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

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
            if (!isManualRefresh) {
              const tab = prof.practicum_phase === 'before_ojt' ? 'before' : prof.practicum_phase === 'in_ojt' ? 'in' : 'final';
              setTablePhaseTab(tab);
            }
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
          link = `/student/documents?phase=${tmpl.phase}`;
          actionText = 'View Submission';
        } else if (sub.status === 'Revision Required') {
          status = 'revision';
          statusLabel = 'Revision Required';
          statusTone = 'rose';
          link = tmpl.editable
            ? (draft ? `/student/editor?draft=${draft.id}` : `/student/editor?template=${tmpl.id}`)
            : `/student/documents?phase=${tmpl.phase}`;
          actionText = 'Revise Document';
        } else if (sub.status === 'Returned') {
          status = 'returned';
          statusLabel = 'Returned';
          statusTone = 'rose';
          link = tmpl.editable
            ? (draft ? `/student/editor?draft=${draft.id}` : `/student/editor?template=${tmpl.id}`)
            : `/student/documents?phase=${tmpl.phase}`;
          actionText = 'Revise Document';
        } else if (sub.status.includes('Pending')) {
          status = 'pending';
          statusLabel = 'Under Review';
          statusTone = 'amber';
          link = `/student/documents?phase=${tmpl.phase}`;
          actionText = 'View Status';
        }
      } else if (draft) {
        status = 'draft';
        statusLabel = 'Draft in Progress';
        statusTone = 'sky';
        link = `/student/editor?draft=${draft.id}`;
        actionText = 'Resume Draft';
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

  // Phase-specific slices
  const beforeRequirements = useMemo(() => allRequirements.filter(r => r.phase === 'before_ojt'), [allRequirements]);
  const inRequirements = useMemo(() => allRequirements.filter(r => r.phase === 'in_ojt'), [allRequirements]);
  const finalRequirements = useMemo(() => allRequirements.filter(r => r.phase === 'final'), [allRequirements]);

  const filteredTableRequirements = useMemo(() => {
    if (tablePhaseTab === 'before') return beforeRequirements;
    if (tablePhaseTab === 'in') return inRequirements;
    if (tablePhaseTab === 'final') return finalRequirements;
    return allRequirements;
  }, [tablePhaseTab, beforeRequirements, inRequirements, finalRequirements, allRequirements]);

  // Phase completion stats (8 Before OJT + 3 In OJT + 2 Final = 13 Total)
  const beforeDoneCount = useMemo(() => beforeRequirements.filter(r => r.status === 'done').length, [beforeRequirements]);
  const inDoneCount = useMemo(() => inRequirements.filter(r => r.status === 'done').length, [inRequirements]);
  const finalDoneCount = useMemo(() => finalRequirements.filter(r => r.status === 'done').length, [finalRequirements]);
  const totalApprovedCount = beforeDoneCount + inDoneCount + finalDoneCount;
  const totalPendingCount = allRequirements.filter(r => r.status === 'pending').length;
  const totalRevisionCount = allRequirements.filter(r => r.status === 'revision' || r.status === 'returned').length;
  const documentsNeedingAttention = useMemo(() => {
    return allRequirements.filter(
      r => r.status === 'revision' || r.status === 'returned' || (Boolean(r.feedback) && r.feedback!.trim().length > 0)
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
    toast.success('Task added to checklist.');
  };

  const deleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

  // ─── Mini Calendar Helpers ──────────────────────────────────────────────────

  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const monthName = calendarMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const miniDays: { day: number; currentMonth: boolean; isToday: boolean; hasEvent?: boolean }[] = [];
  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    miniDays.push({ day: prevMonthDays - i, currentMonth: false, isToday: false, hasEvent: false });
  }

  // Current month days with correct date bounds
  const now = new Date();
  const isCurrentYear = calYear === now.getFullYear();
  const isCurrentMonth = isCurrentYear && calMonth === now.getMonth();
  const isPastMonth = calYear < now.getFullYear() || (isCurrentYear && calMonth < now.getMonth());

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentMonth && now.getDate() === d;
    const dayOfWeek = new Date(calYear, calMonth, d).getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const hasEvent = isWeekday && (isPastMonth || (isCurrentMonth && d <= now.getDate()));
    miniDays.push({ day: d, currentMonth: true, isToday, hasEvent });
  }

  // Remaining cells to fill 35 or 42 grid
  const targetCells = miniDays.length > 35 ? 42 : 35;
  const remainingCells = targetCells - miniDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    miniDays.push({ day: d, currentMonth: false, isToday: false, hasEvent: false });
  }

  // Hours calculation
  const hoursRemaining = Math.max(0, totalHours - renderedHours);
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

  // ─── Loading State Skeleton ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex justify-between items-center pb-3.5 border-b border-border/80">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        {/* Top Metrics Skeleton: Exact 2-2-2-6 12-col grid, h-[155px] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-2 sm:col-span-1 p-4 bg-card border border-border/70 rounded-2xl h-[155px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-full mt-1" />
            </div>
          </div>

          <div className="lg:col-span-2 sm:col-span-1 p-4 bg-card border border-border/70 rounded-2xl h-[155px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-7 w-full rounded-xl mt-1" />
            </div>
          </div>

          <div className="lg:col-span-2 sm:col-span-1 p-4 bg-card border border-border/70 rounded-2xl h-[155px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-full mt-1" />
            </div>
          </div>

          <div className="lg:col-span-6 sm:col-span-2 p-4 sm:p-5 bg-card border border-border/70 rounded-2xl h-[155px] flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2.5">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Skeleton className="h-6 w-full rounded-lg" />
                <Skeleton className="h-6 w-full rounded-lg" />
                <Skeleton className="h-6 w-full rounded-lg" />
                <Skeleton className="h-6 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="w-32 sm:w-44 h-28 rounded-xl shrink-0" />
          </div>
        </div>

        {/* Row 2 Skeleton: 9:3 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-9 p-5 bg-card border border-border/80 rounded-2xl h-[280px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md" />
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-[180px] w-full rounded-xl" />
          </div>
          <div className="lg:col-span-3 p-4 bg-card border border-border/80 rounded-2xl h-[280px] space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
            <Skeleton className="h-[210px] w-full rounded-xl" />
          </div>
        </div>

        {/* Row 3 Skeleton: 9:3 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-9 p-5 bg-card border border-border/80 rounded-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-6 w-60 rounded-md" />
                <Skeleton className="h-3 w-80 rounded-md" />
              </div>
              <Skeleton className="h-9 w-44 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="pt-2 border-t border-border/60 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  <Skeleton className="h-7 w-16 rounded-xl" />
                  <Skeleton className="h-7 w-36 rounded-xl" />
                  <Skeleton className="h-7 w-28 rounded-xl" />
                  <Skeleton className="h-7 w-24 rounded-xl" />
                </div>
                <Skeleton className="h-4 w-28 rounded-md shrink-0 ml-auto" />
              </div>
              <div className="border border-border/70 rounded-xl p-3.5 space-y-3 bg-card">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-lg shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-44 rounded-md" />
                        <Skeleton className="h-2.5 w-64 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 bg-card border border-border/80 rounded-2xl h-56 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Metrics Grid: 3 Modern Metric Cards + 1 Trainee Hero Card (12 Cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
        {/* Metric 1: Total Hours Rendered (2 cols) */}
        <div className="lg:col-span-2 sm:col-span-1 bg-card border border-border/70 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow duration-200 flex flex-col justify-between h-[155px]">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-muted/80 text-foreground flex items-center justify-center shrink-0">
              <ClockIcon size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {hoursPercent}%
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-foreground tracking-tight leading-none tabular-nums">
                {renderedHours.toFixed(1)}
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">hrs</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Total Hours</p>
            <span className="inline-block mt-2 text-[10px] font-bold text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-full">
              Target: {totalHours} hrs
            </span>
          </div>
        </div>

        {/* Metric 2: Needs Attention & Review Center (2 cols) */}
        <div className="lg:col-span-2 sm:col-span-1 bg-card border border-border/70 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow duration-200 flex flex-col justify-between h-[155px] group">
          <div className="flex items-center justify-between">
            <div className={cn(
              "size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
              documentsNeedingAttention.length > 0
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-muted/80 text-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              <AlertCircle size={16} />
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              documentsNeedingAttention.length > 0
                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                : totalPendingCount > 0
                ? "text-sky-600 dark:text-sky-400 bg-sky-500/10"
                : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            )}>
              {documentsNeedingAttention.length > 0
                ? `${documentsNeedingAttention.length} Action`
                : totalPendingCount > 0
                ? `${totalPendingCount} In Review`
                : 'All Clear'}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-foreground tracking-tight leading-tight">
              Needs Attention
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
              {documentsNeedingAttention.length > 0
                ? `${documentsNeedingAttention.length} doc${documentsNeedingAttention.length > 1 ? 's' : ''} need revision`
                : totalPendingCount > 0
                ? `${totalPendingCount} doc${totalPendingCount > 1 ? 's' : ''} in review`
                : 'No remarks or revisions'}
            </p>
            <Link to="/student/reviews" className="block mt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full h-7 text-[10.5px] sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 px-2"
              >
                <span>Open Review Center</span>
                <ArrowRightIcon size={11} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric 3: Host Placement (2 cols) */}
        <div className="lg:col-span-2 sm:col-span-1 bg-card border border-border/70 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow duration-200 flex flex-col justify-between h-[155px]">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-muted/80 text-foreground flex items-center justify-center shrink-0">
              <Briefcase size={16} />
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              isAssignedCompany ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-amber-600 dark:text-amber-400 bg-amber-500/10"
            )}>
              {isAssignedCompany ? 'Verified' : 'Pending'}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-foreground tracking-tight truncate leading-tight">
              {isAssignedCompany ? companyName : 'Placement'}
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Host Company</p>
            <span className="inline-block mt-2 text-[10px] font-bold text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-full truncate max-w-full">
              {isAssignedCompany ? supervisorName : 'Awaiting Match'}
            </span>
          </div>
        </div>

        {/* Hero Card: Trainee Profile (6 cols) — Dedicated Profile Card */}
        <div className="lg:col-span-6 sm:col-span-2 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow duration-200 flex items-center justify-between gap-4 h-[155px] overflow-hidden">
          <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
            {/* Student Name & Role Header */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">
                  {user?.name || 'John Dwayne B. Guaniso'}
                </h3>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shrink-0">
                  Trainee
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mentor: <strong className="text-foreground font-semibold">{adviserName}</strong>
              </p>
            </div>

            {/* Student Information Metadata (Full visibility 2x2 grid) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/80 text-xs font-medium min-w-0">
                <span>ID:</span>
                <strong className="text-foreground font-mono font-bold">{studentId || user?.studentId || '2023-010482'}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/80 text-xs font-medium min-w-0">
                <span>Program:</span>
                <strong className="text-foreground font-bold">{programName || user?.course || 'BSIT'}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/80 text-xs font-medium min-w-0">
                <span>Section:</span>
                <strong className="text-foreground font-bold">{sectionName || user?.section || 'BSIT 402'}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/80 text-xs font-medium min-w-0">
                <BuildingIcon className="size-3 text-primary shrink-0" />
                <span>Placement:</span>
                <strong className="text-foreground font-bold truncate">{isAssignedCompany ? companyName : 'Pending Placement'}</strong>
              </span>
            </div>
          </div>

          {/* Large Frameless Focused Dev Avatar */}
          <div className="w-32 sm:w-44 h-28 sm:h-32 shrink-0 flex items-center justify-center pointer-events-none">
            <img
              src="/images/Dashboard Icons/undraw_focused-dev_gqoa.svg"
              alt="Trainee Avatar"
              className="w-full h-full object-contain pointer-events-none drop-shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Analytics & Activity Row: Area Chart + Report + Requirement State (Matching bottom row of reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Graph Card: Total Hours Weekly Trend (9 cols) */}
        <div className="lg:col-span-9 min-w-0 bg-card border border-border/70 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">Total Hours</h2>
              <p className="text-xs text-muted-foreground font-medium">Weekly report overview</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                Mon – Sun
              </span>
              <button type="button" className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="w-full h-56 min-w-0 min-h-[224px] pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary, #18181b)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary, #18181b)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => `${v}h`}
                  domain={[0, 10]}
                  ticks={[2, 4, 6, 8, 10]}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-lg text-xs">
                          <p className="font-bold text-foreground">
                            {label}: <span className="text-primary font-extrabold">{payload[0].value} hrs</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--foreground)"
                  strokeWidth={2.5}
                  fill="url(#hoursGrad)"
                  activeDot={{ r: 5, fill: 'var(--foreground)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Daily target: <strong className="text-foreground">8.0 hrs/day</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">40.0 hrs / week</span>
          </div>
        </div>

        {/* Right Card: Interactive Calendar (3 cols) */}
        <div className="lg:col-span-3 bg-card border border-border/70 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <span>Calendar</span>
              </h2>
              <p className="text-xs text-muted-foreground font-medium">Practicum schedule</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
              <button
                type="button"
                onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground active:scale-95"
                title="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="tracking-tight text-xs font-bold min-w-[70px] text-center">{monthName}</span>
              <button
                type="button"
                onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground active:scale-95"
                title="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Day headers: Su Mo Tu We Th Fr Sa */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground select-none py-1 border-b border-border/70">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs py-1">
            {miniDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center justify-center h-7">
                <span
                  className={cn(
                    "size-6.5 flex items-center justify-center rounded-full text-xs font-semibold select-none transition-colors",
                    d.isToday
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : d.currentMonth
                      ? "text-foreground hover:bg-muted cursor-pointer"
                      : "text-muted-foreground/30"
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

          {/* Footer Links: Full calendar & Reset/Today */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-semibold px-0.5">
            <Link
              to="/student/calendar"
              className="text-primary hover:underline cursor-pointer flex items-center gap-1 font-bold text-xs"
            >
              <span>Full calendar</span>
              <ExternalLink size={11} />
            </Link>
            {!isCurrentMonth ? (
              <button
                type="button"
                onClick={() => setCalendarMonth(new Date())}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Today
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium">Current Month</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Standard 9:3 Ratio (lg:col-span-9 and lg:col-span-3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Main Practicum Workflows (9 cols) */}
        <div className="lg:col-span-9 space-y-5 min-w-0">
          {/* Practicum Requirements & Document Repository Hub */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="size-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ClipboardListIcon size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    <span>Practicum Requirements & Templates</span>
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5 max-w-xl">
                    Access, edit, and manage your official institutional documents across Before OJT, In OJT, and Final practicum phases.
                  </p>
                </div>
              </div>

              <Link to="/student/documents" className="shrink-0 self-start sm:self-auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="font-bold text-xs h-9 px-4 rounded-xl cursor-pointer active:scale-95 shadow-2xs flex items-center gap-2"
                >
                  <FolderOpen size={14} />
                  <span>Open Document Repository</span>
                  <ArrowRightIcon size={13} />
                </Button>
              </Link>
            </div>

            {/* Completion Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Approved Docs</span>
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-2xl font-black text-foreground tracking-tight leading-none">{totalApprovedCount}</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ {allRequirements.length}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Verified by practicum adviser</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Under Review</span>
                  <span className="size-2 rounded-full bg-amber-500"></span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-2xl font-black text-foreground tracking-tight leading-none">{totalPendingCount}</span>
                  <span className="text-xs font-semibold text-muted-foreground">pending</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Awaiting evaluation remarks</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Remaining</span>
                  <span className="size-2 rounded-full bg-muted-foreground/50"></span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-2xl font-black text-foreground tracking-tight leading-none">
                    {Math.max(0, allRequirements.length - totalApprovedCount)}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">templates</span>
                </div>
                <p className="text-[11px] text-muted-foreground">To draft, upload, or complete</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Overall Documentation Progress</span>
                <span className="text-foreground font-bold font-mono">
                  {Math.round((totalApprovedCount / (allRequirements.length || 1)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((totalApprovedCount / (allRequirements.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Interactive Phase Filter Tabs & Table Header */}
            <div className="pt-2 border-t border-border/60 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTablePhaseTab('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      tablePhaseTab === 'all'
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/60"
                    )}
                  >
                    All ({allRequirements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTablePhaseTab('before')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      tablePhaseTab === 'before'
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/60"
                    )}
                  >
                    Before OJT ({beforeDoneCount}/{beforeRequirements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTablePhaseTab('in')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      tablePhaseTab === 'in'
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/60"
                    )}
                  >
                    In OJT ({inDoneCount}/{inRequirements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTablePhaseTab('final')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      tablePhaseTab === 'final'
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/60"
                    )}
                  >
                    Final ({finalDoneCount}/{finalRequirements.length})
                  </button>
                </div>

                <Link
                  to="/student/documents"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0 ml-auto"
                >
                  <span>Browse repository</span>
                  <ArrowRightIcon size={12} />
                </Link>
              </div>

              {/* Documents Table */}
              <div className="border border-border/70 rounded-xl overflow-hidden shadow-2xs bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/70 text-muted-foreground font-bold">
                        <th scope="col" className="py-2.5 px-4 font-bold text-foreground">Document Name</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Phase</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Status</th>
                        <th scope="col" className="py-2.5 px-4 font-bold text-foreground text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredTableRequirements.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            No documents found for this phase.
                          </td>
                        </tr>
                      ) : (
                        filteredTableRequirements.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-muted/20 transition-colors group"
                          >
                            {/* Document Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "size-8 rounded-lg flex items-center justify-center shrink-0 border",
                                  item.status === 'done'
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : item.status === 'revision' || item.status === 'returned'
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                    : item.status === 'pending'
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-muted/80 text-muted-foreground border-border/60"
                                )}>
                                  <item.icon size={15} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground text-xs leading-snug truncate max-w-[240px] sm:max-w-md">
                                    {item.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate max-w-[240px] sm:max-w-md">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Phase */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border",
                                item.phase === 'before_ojt'
                                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20"
                                  : item.phase === 'in_ojt'
                                  ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                                  : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                              )}>
                                {item.phase === 'before_ojt' ? 'Before OJT' : item.phase === 'in_ojt' ? 'In OJT' : 'Final'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border",
                                item.status === 'done'
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : item.status === 'revision' || item.status === 'returned'
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  : item.status === 'pending'
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : item.status === 'draft'
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-muted/70 text-muted-foreground border-border/70"
                              )}>
                                <span className={cn(
                                  "size-1.5 rounded-full",
                                  item.status === 'done'
                                    ? "bg-emerald-500"
                                    : item.status === 'revision' || item.status === 'returned'
                                    ? "bg-rose-500"
                                    : item.status === 'pending'
                                    ? "bg-amber-500"
                                    : item.status === 'draft'
                                    ? "bg-primary"
                                    : "bg-muted-foreground/60"
                                )} />
                                <span>{item.statusLabel}</span>
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <Link to={item.link}>
                                <Button
                                  variant={item.status === 'revision' || item.status === 'returned' ? 'danger' : item.status === 'done' ? 'outline' : 'primary'}
                                  size="sm"
                                  className="h-7 text-[11px] font-bold rounded-lg px-2.5 cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-95"
                                >
                                  <span>{item.actionText}</span>
                                  <ArrowRightIcon size={11} />
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

        {/* RIGHT COLUMN: Companion Sidebar Widgets (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Widget 1: To-Do Checklist (Positioned directly below Calendar) */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground tracking-tight">To-do Checklist</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] h-5 px-2 font-bold rounded-full">
                  {todos.filter(t => !t.done).length} Pending
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsAddingTodo(prev => !prev)}
                  title={isAddingTodo ? "Cancel" : "Add task"}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95"
                >
                  {isAddingTodo ? <X size={14} /> : <Plus size={14} />}
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {isAddingTodo && (
              <form onSubmit={handleAddTodo} className="space-y-2 py-1 animate-in fade-in duration-200 border-b border-border/60">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  placeholder="Type new practicum task..."
                  autoFocus
                  className="w-full text-xs px-3 py-1.5 rounded-xl bg-muted/30 border border-border focus:outline-none focus:border-primary text-foreground"
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
                    Add Task
                  </Button>
                </div>
              </form>
            )}

            {/* Pending Tasks List */}
            <div className="space-y-2 pt-0.5 max-h-[260px] overflow-y-auto pr-0.5">
              {todos.filter(t => !t.done).length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">All caught up!</p>
                  <p className="text-[11px] mt-0.5">No pending tasks to finish.</p>
                </div>
              ) : (
                todos.filter(t => !t.done).map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className="flex items-start gap-2.5 p-2.5 px-3 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all cursor-pointer group text-xs shadow-2xs"
                  >
                    <div className="size-4 rounded-md border border-muted-foreground/50 group-hover:border-foreground flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      {item.done && <Check size={10} strokeWidth={3} className="text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs leading-snug text-foreground group-hover:text-primary transition-colors">
                        {item.text}
                      </p>
                      {item.link && (
                        <Link
                          to={item.link}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline mt-1"
                        >
                          <span>Open action</span>
                          <ExternalLink size={9} />
                        </Link>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={e => deleteTodo(item.id, e)}
                      title="Delete task"
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>{todos.filter(t => !t.done).length} remaining</span>
              <button
                type="button"
                onClick={() => setIsAddingTodo(true)}
                className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer text-xs"
              >
                <Plus size={12} />
                <span>Add task</span>
              </button>
            </div>
          </div>

          {/* Widget 2: Practicum Announcements Bulletin */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs sm:text-sm">
                <Megaphone className="size-4 text-primary" />
                <span>Announcements</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 px-2 font-bold rounded-full">
                1 Notice
              </Badge>
            </div>

            {/* Announcement Bulletin */}
            <div className="space-y-2.5 pt-0.5">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Midterm Evaluation Window</span>
                  <span className="text-[10px] text-muted-foreground font-bold px-1.5 py-0.5 rounded bg-muted">Active</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ensure DTR hours are signed weekly by your corporate supervisor before the Friday 5:00 PM cutoff.
                </p>
              </div>

              <div className="text-center pt-1">
                <Link
                  to="/student/notifications"
                  className="text-xs font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View institutional alerts</span>
                  <ArrowRightIcon size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
