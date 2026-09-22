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
        actionText: 'Resume Draft',
        draftId: dr.id,
      }));

    return [...matchedRequirements, ...unmatchedDrafts];
  }, [allRequirements, drafts]);

  const activeApprovedCount = useMemo(() => activeSubmissions.filter(r => r.status === 'done').length, [activeSubmissions]);
  const activePendingCount = useMemo(() => activeSubmissions.filter(r => r.status === 'pending').length, [activeSubmissions]);
  const activeRevisionCount = useMemo(() => activeSubmissions.filter(r => r.status === 'revision' || r.status === 'returned').length, [activeSubmissions]);

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
    toast.success('Task added to to-do list.');
  };

  const deleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

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

  // ─── Chart View & Datasets for Reference Boxing Cards ──────────────────────
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');

  // Monthly Hours Progression (Jan - Dec) matching reference chart
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonthIndex = new Date().getMonth();
    return months.map((month, idx) => {
      const isCurrent = idx === curMonthIndex;
      let value = 0;
      if (idx < curMonthIndex) {
        value = Math.min(100, Math.round((idx + 1) * 14 + 10));
      } else if (idx === curMonthIndex) {
        value = hoursPercent > 0 ? hoursPercent : 85;
      } else {
        value = Math.max(15, Math.round(Math.sin(idx * 0.9) * 22 + 45));
      }
      return {
        label: month,
        value,
        isCurrent,
      };
    });
  }, [hoursPercent]);

  // Weekly Daily Hours (Mon - Sun)
  const weeklyBarData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const curDayIndex = (new Date().getDay() + 6) % 7;
    return days.map((day, idx) => {
      const isCurrent = idx === curDayIndex;
      let hours = 0;
      if (idx < 5) {
        if (renderedHours > 0) {
          const logged = renderedHours >= (idx + 1) * 8 ? 8 : Math.max(0, renderedHours - idx * 8);
          hours = Math.min(8, logged);
        } else {
          hours = [7.5, 8.0, 8.0, 7.5, 8.0, 0, 0][idx] || 0;
        }
      }
      return {
        label: day,
        value: hours,
        isCurrent,
      };
    });
  }, [renderedHours]);

  // Donut Segments for Practicum Progress (Top Performers card equivalent)
  const donutData = useMemo(() => {
    const verified = Math.max(renderedHours, 0.1);
    const inReview = Math.max(activePendingCount * 15, activeSubmissions.length > 0 ? 10 : 0.1);
    const remaining = Math.max(totalHours - renderedHours, 1);
    return [
      { name: 'Logged', value: verified, color: '#0066f5' },
      { name: 'In Review', value: inReview, color: '#f97316' },
      { name: 'Remaining', value: remaining, color: '#10b981' },
    ];
  }, [renderedHours, activePendingCount, activeSubmissions.length, totalHours]);

  // ─── Loading State Skeleton ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 pb-10 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column Skeleton (8 cols) */}
          <div className="lg:col-span-8 space-y-4 min-w-0">
            {/* Hero Banner Skeleton */}
            <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-card border border-border/70 h-[145px] sm:h-[150px] flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-3.5 w-64 rounded-md" />
                <div className="flex gap-1.5 pt-1.5 flex-wrap">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-5 w-32 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl shrink-0 hidden sm:block" />
            </div>

            {/* 3 Metric Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3.5 sm:p-4 bg-card border border-border/70 rounded-2xl h-[105px] flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-5 w-16 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-md pt-1" />
                </div>
              ))}
            </div>

            {/* Total Hours Chart Skeleton */}
            <div className="p-4 sm:p-4.5 bg-card border border-border/70 rounded-2xl h-[250px] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-4.5 w-40 rounded-md" />
                  <Skeleton className="h-3 w-52 rounded-md" />
                </div>
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-[150px] w-full rounded-xl" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-3 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>

            {/* Submissions Tracker Skeleton */}
            <div className="p-4 sm:p-5 bg-card border border-border/70 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-52 rounded-md" />
                <Skeleton className="h-7 w-36 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>

          {/* Right Column Skeleton (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Donut Card Skeleton */}
            <div className="p-4 sm:p-4.5 bg-card border border-border/70 rounded-2xl h-[250px] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4.5 w-32 rounded-md" />
                <Skeleton className="size-5 rounded-md" />
              </div>
              <Skeleton className="size-32 rounded-full mx-auto" />
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <Skeleton className="h-7 rounded-lg" />
                <Skeleton className="h-7 rounded-lg" />
                <Skeleton className="h-7 rounded-lg" />
              </div>
            </div>

            {/* To-do List Skeleton */}
            <div className="p-4 sm:p-4.5 bg-card border border-border/70 rounded-2xl h-[250px] space-y-2.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4.5 w-24 rounded-md" />
                <Skeleton className="h-5 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-300">
      {/* ─── Master 2-Column Boxing Grid Layout (8:4 Desktop Ratio) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ─── LEFT COLUMN: Main Track (8 cols / ~67% width) ───────────────── */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Card 1: Compact Hero Greeting Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white p-4 sm:p-5 shadow-xs border border-blue-500/30">
            {/* Ambient Lighting Gradients */}
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                    Welcome back, {user?.name ? user.name.split(' ')[0] : 'Darrel'} 👋
                  </h1>
                </div>
                <p className="text-xs sm:text-[13px] text-blue-50/90 font-medium max-w-xl leading-relaxed">
                  You've completed <strong className="font-extrabold text-white">{hoursPercent}%</strong> of your practicum goal this term! Keep submitting your records to reach completion.
                </p>

                {/* Trainee Information Badges (Single-Line Streamlined Strip) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 backdrop-blur-xs border border-white/20 text-white shadow-2xs">
                    <UserIcon size={11} className="text-blue-200" />
                    <span>ID: {studentId || user?.studentId || '2023-010482'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 backdrop-blur-xs border border-white/20 text-white shadow-2xs">
                    <GraduationCapIcon size={11} className="text-blue-200" />
                    <span>{displayProgram} • {sectionName || user?.section || 'BSIT 402'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 backdrop-blur-xs border border-white/20 text-white shadow-2xs">
                    <UserCheckIcon size={11} className="text-blue-200" />
                    <span>Mentor: {adviserName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 backdrop-blur-xs border border-white/20 text-white shadow-2xs">
                    <Briefcase size={11} className="text-blue-200" />
                    <span>{isAssignedCompany ? companyName : 'Awaiting Match'}</span>
                  </span>
                </div>
              </div>

              {/* Trainee Avatar Illustration */}
              <div className="w-28 h-20 sm:w-36 sm:h-24 shrink-0 hidden sm:flex items-center justify-center pointer-events-none self-end sm:self-center">
                <img
                  src="/images/Dashboard Icons/undraw_focused-dev_gqoa.svg"
                  alt="Trainee Avatar"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Card 2: 3 Metric Stat Cards in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Card 2A: Total Hours Logged */}
            <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                  <ClockIcon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none tabular-nums">
                    {renderedHours.toFixed(1)} <span className="text-xs font-semibold text-muted-foreground">/ {totalHours}h</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                    Total Hours Logged
                  </p>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-border/50">
                <Link
                  to="/student/documents?phase=in_ojt"
                  className="flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors cursor-pointer"
                >
                  <span>View DTR log</span>
                  <ArrowRightIcon size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2B: Pending Evaluations */}
            <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none tabular-nums">
                    {activePendingCount} <span className="text-xs font-semibold text-muted-foreground">/ {activeSubmissions.length} active</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                    Pending Evaluations
                  </p>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-border/50">
                <Link
                  to="/student/reviews"
                  className="flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors cursor-pointer"
                >
                  <span>Open Review Center</span>
                  <ArrowRightIcon size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2C: Host Placement */}
            <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <BuildingIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight truncate" title={isAssignedCompany ? companyName : 'Awaiting Match'}>
                    {isAssignedCompany ? companyName : 'Awaiting Match'}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                    {isAssignedCompany ? `Supervisor: ${supervisorName}` : 'Matching in progress'}
                  </p>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-border/50">
                <Link
                  to="/student/profile"
                  className="flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors cursor-pointer"
                >
                  <span>View placement</span>
                  <ArrowRightIcon size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Total Hours Overview Chart Card */}
          <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between pb-0.5">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">Total Hours Overview</h2>
                <p className="text-xs text-muted-foreground font-medium">Practicum hours completion rates</p>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            <div className="w-full h-40 min-w-0 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartView === 'monthly' ? monthlyChartData : weeklyBarData}
                  margin={{ top: 12, right: 10, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 600 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `${v}${chartView === 'monthly' ? '%' : 'h'}`}
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover/95 backdrop-blur-md border border-border px-2.5 py-1.5 rounded-xl shadow-lg text-xs">
                            <p className="font-bold text-foreground">
                              {label}: <span className="text-primary font-extrabold">{payload[0].value}{chartView === 'monthly' ? '% complete' : ' hrs'}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {(chartView === 'monthly' ? monthlyChartData : weeklyBarData).map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={entry.isCurrent ? '#0066f5' : 'currentColor'}
                        className={entry.isCurrent ? 'fill-blue-600 dark:fill-blue-500' : 'fill-muted-foreground/20 dark:fill-muted-foreground/15'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Daily target: <strong className="text-foreground font-semibold">8.0 hrs/day</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">40.0 hrs / week</span>
            </div>
          </div>

          {/* Card 4: My Document Submissions & Reviews Active Tracker */}
          <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                    <span>My Document Submissions & Reviews</span>
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5 max-w-xl">
                    Track and manage your submitted practicum requirements, adviser evaluations, and approval statuses.
                  </p>
                </div>
              </div>

              <Link to="/student/documents" className="shrink-0 self-start sm:self-auto">
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

            {/* Active Submissions Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Card 1: Approved */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/70 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Approved</span>
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none tabular-nums">
                    {activeApprovedCount}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">verified</span>
                </div>
                <p className="text-[10.5px] text-muted-foreground">Approved by practicum adviser</p>
              </div>

              {/* Card 2: Under Review */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/70 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Under Review</span>
                  <span className={cn("size-2 rounded-full", activePendingCount > 0 ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/40")}></span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none tabular-nums">
                    {activePendingCount}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">pending</span>
                </div>
                <p className="text-[10.5px] text-muted-foreground">Currently awaiting evaluation</p>
              </div>

              {/* Card 3: Action Needed */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/70 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Action Needed</span>
                  <span className={cn("size-2 rounded-full", activeRevisionCount > 0 ? "bg-rose-500" : "bg-emerald-500")}></span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none tabular-nums">
                    {activeRevisionCount}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {activeRevisionCount === 1 ? 'requires action' : activeRevisionCount > 1 ? 'require action' : 'all clear'}
                  </span>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  {activeRevisionCount > 0 ? 'Document returned for revisions' : 'No revisions required'}
                </p>
              </div>
            </div>

            {/* Submissions Section Header & Table */}
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">Submitted Documents</span>
                  <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {activeSubmissions.length} active
                  </span>
                </div>

                <Link
                  to="/student/documents"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0 ml-auto"
                >
                  <span>Browse all templates</span>
                  <ArrowRightIcon size={12} />
                </Link>
              </div>

              {/* Documents Table */}
              <div className="border border-border/70 rounded-xl overflow-hidden shadow-2xs bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/70 text-muted-foreground font-bold">
                        <th scope="col" className="py-2.5 px-3.5 font-bold text-foreground">Document Name</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Submitted / Updated</th>
                        <th scope="col" className="py-2.5 px-3 font-bold text-foreground">Status</th>
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
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={cn(
                                  "size-7.5 rounded-lg flex items-center justify-center shrink-0 border",
                                  item.status === 'done'
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : item.status === 'revision' || item.status === 'returned'
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                    : item.status === 'pending'
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-muted/80 text-muted-foreground border-border/60"
                                )}>
                                  <item.icon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground text-xs leading-snug truncate max-w-[220px] sm:max-w-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-[10.5px] text-muted-foreground truncate max-w-[220px] sm:max-w-sm">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Submitted / Updated Date */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-medium text-xs">
                              {item.submissionDate || (item.status === 'draft' ? 'Draft saved' : 'Recently')}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
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
                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
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

        {/* ─── RIGHT COLUMN: Companion Track (4 cols / ~33% width) ─────────── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 5: Practicum Progress Donut Card (Top Performers equivalent) */}
          <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between pb-0.5">
              <h2 className="text-base font-bold text-foreground tracking-tight">Practicum Progress</h2>
              <button
                type="button"
                className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Options"
              >
                <MoreHorizontal size={15} />
              </button>
            </div>

            <div className="relative flex items-center justify-center my-0.5 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={66}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="text-2xl font-black text-foreground tracking-tight">{hoursPercent}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="truncate">Progress</span>
                </div>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{hoursPercent}%</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                  <span className="truncate">In Review</span>
                </div>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{activePendingCount} docs</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Target</span>
                </div>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{totalHours}h</span>
              </div>
            </div>
          </div>

          {/* Card 6: To-do List Card */}
          <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-all space-y-2.5">
            <div className="flex items-center justify-between pb-0.5 border-b border-border/60">
              <h2 className="text-base font-bold text-foreground tracking-tight">To do list</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTodo(prev => !prev)}
                  title={isAddingTodo ? "Cancel" : "Add to-do"}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95"
                >
                  {isAddingTodo ? <X size={14} /> : <Plus size={14} />}
                </button>
                <button
                  type="button"
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Quick Add Input */}
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

            {/* Task List styled like Reference screenshot */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
              {todos.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">All caught up!</p>
                  <p className="text-[11px] mt-0.5">No pending to-dos.</p>
                </div>
              ) : (
                todos.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className="flex items-start gap-2.5 p-1 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group text-xs"
                  >
                    {/* Round check indicator matching reference screenshot */}
                    {item.done ? (
                      <div className="size-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check size={11} strokeWidth={3.5} />
                      </div>
                    ) : (
                      <div className="size-4.5 rounded-full border-2 border-slate-300 dark:border-zinc-600 group-hover:border-blue-500 shrink-0 mt-0.5 transition-colors" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-xs font-bold leading-snug transition-colors",
                        item.done ? "text-muted-foreground line-through font-medium" : "text-foreground group-hover:text-blue-600"
                      )}>
                        {item.text}
                      </p>
                      {!item.done && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                          {idx === 0 ? 'P Aug 1 – Due tomorrow' : idx === 1 ? 'P Aug 2 – Due in 2 days' : 'In progress'}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={e => deleteTodo(item.id, e)}
                      title="Delete task"
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Pill */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check size={11} strokeWidth={3} />
                <span>{todos.filter(t => t.done).length}/{todos.length} Complete</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingTodo(true)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Add To-do</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
