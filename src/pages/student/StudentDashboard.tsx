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
  RotateCw,
  Trash2,
  ShieldCheck,
  CalendarDays,
  FileCheck2,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

// Robust draft matcher
function matchesDraft(dr: DraftRecord, tmpl: TemplateDefinition): boolean {
  if (dr.template_id && dr.template_id.toLowerCase() === tmpl.id.toLowerCase()) return true;

  if (dr.template_name) {
    const dName = dr.template_name.trim().toLowerCase();
    const tName = tmpl.name.trim().toLowerCase();
    if (dName === tName) return true;

    // Consent forms fee separation
    const isDraftWithoutFee = dName.includes('without fee');
    const isTmplWithoutFee = tmpl.id.includes('without-fee') || tName.includes('without fee');
    if (isDraftWithoutFee !== isTmplWithoutFee && (dName.includes('consent') || tName.includes('consent'))) {
      return false;
    }

    if (tmpl.alias && (dName.includes(tmpl.alias.toLowerCase()) || tmpl.alias.toLowerCase().includes(dName))) {
      return true;
    }

    if (dName.includes(tName) || tName.includes(dName)) return true;
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
  const [activePhaseTab, setActivePhaseTab] = useState<'before' | 'in' | 'final'>('before');
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isCalendarHidden, setIsCalendarHidden] = useState(false);

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
  const [companyLocation, setCompanyLocation] = useState<string>('Pasig City');
  const [studentRole, setStudentRole] = useState<string>('Frontend Developer Intern');
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

  const [todoFilter, setTodoFilter] = useState<'all' | 'pending' | 'completed'>('all');
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
              setActivePhaseTab(tab);
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

  const currentRequirementItems = useMemo(() => {
    return activePhaseTab === 'before' ? beforeRequirements : activePhaseTab === 'in' ? inRequirements : finalRequirements;
  }, [activePhaseTab, beforeRequirements, inRequirements, finalRequirements]);

  // Phase completion stats (8 Before OJT + 3 In OJT + 2 Final = 13 Total)
  const beforeDoneCount = useMemo(() => beforeRequirements.filter(r => r.status === 'done').length, [beforeRequirements]);
  const inDoneCount = useMemo(() => inRequirements.filter(r => r.status === 'done').length, [inRequirements]);
  const finalDoneCount = useMemo(() => finalRequirements.filter(r => r.status === 'done').length, [finalRequirements]);
  const totalApprovedCount = beforeDoneCount + inDoneCount + finalDoneCount;
  const totalPendingCount = allRequirements.filter(r => r.status === 'pending').length;
  const totalRevisionCount = allRequirements.filter(r => r.status === 'revision' || r.status === 'returned').length;

  // Smart Priority Action Determination
  const priorityAction = useMemo(() => {
    // 1. Critical: Any document that needs revision or was returned
    const revisionReq = allRequirements.find(r => r.status === 'revision' || r.status === 'returned');
    if (revisionReq) {
      return {
        type: 'revision',
        title: `Revision Requested: ${revisionReq.name}`,
        description: revisionReq.feedback || 'Your practicum adviser requested changes on your submission. Please review remarks and update.',
        badgeText: 'Action Required · Adviser Remarks',
        badgeTone: 'rose' as const,
        ctaText: 'Open Editor to Revise',
        link: revisionReq.link,
      };
    }

    // 2. Active Draft in Progress (only genuine unsubmitted drafts)
    const activeDraft = drafts.find(d => d.status === 'draft');
    if (activeDraft) {
      return {
        type: 'draft',
        title: `Continue Working: ${activeDraft.title || 'Document Draft'}`,
        description: `Last saved ${safeFormatDate(activeDraft.updated_at, 'MMM d, h:mm a')}. Resume editing your document where you left off.`,
        badgeText: 'In Progress · Draft',
        badgeTone: 'sky' as const,
        ctaText: 'Resume Draft',
        link: `/student/editor?draft=${activeDraft.id}`,
      };
    }

    // 3. Next uncompleted requirement in student's current active practicum stage
    const activePhaseRequirements = profilePhase === 'before_ojt' ? beforeRequirements : profilePhase === 'in_ojt' ? inRequirements : finalRequirements;
    const nextReq = activePhaseRequirements.find(r => r.status === 'not_started' || r.status === 'draft');
    if (nextReq) {
      return {
        type: 'next_up',
        title: `Next Requirement: ${nextReq.name}`,
        description: nextReq.description,
        badgeText: 'Recommended Next Step',
        badgeTone: 'primary' as const,
        ctaText: nextReq.actionText,
        link: nextReq.link,
      };
    }

    // 4. Milestone achieved
    return {
      type: 'completed',
      title: 'Current Phase Milestones Accomplished!',
      description: 'You have completed all active requirements for this stage. Maintain your daily DTR logging and consult with your coordinator.',
      badgeText: 'Phase On Track',
      badgeTone: 'emerald' as const,
      ctaText: 'View Document Repository',
      link: '/student/documents',
    };
  }, [allRequirements, drafts, profilePhase, beforeRequirements, inRequirements, finalRequirements]);

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

  const filteredTodos = useMemo(() => {
    if (todoFilter === 'pending') return todos.filter(t => !t.done);
    if (todoFilter === 'completed') return todos.filter(t => t.done);
    return todos;
  }, [todos, todoFilter]);

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

  // ─── Loading State Skeleton ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5 pb-12 animate-in fade-in duration-300">
        <div className="flex justify-between items-center pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-9 space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-3">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-3.5">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      {/* 1. Header with Student Greeting & Live Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Intern'}!
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
              {profilePhase === 'before_ojt' ? 'Before OJT' : profilePhase === 'in_ojt' ? 'In OJT' : 'Final Phase'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>Student ID: <strong className="text-foreground">{studentId || user?.studentId || '2023-010482'}</strong></span>
            <span>·</span>
            <span>Program: <strong className="text-foreground">{programName || user?.course || 'BSIT'}</strong></span>
            <span>·</span>
            <span>Section: <strong className="text-foreground">{sectionName || user?.section || 'IT401'}</strong></span>
            <span>·</span>
            <span>Deployment: <strong className="text-foreground">{isAssignedCompany ? companyName : 'Pending Placement'}</strong></span>
          </p>
        </div>

        {/* Right actions: Refresh & Completed Accomplishments Dialog */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            title="Refresh dashboard state"
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RotateCw size={14} className={cn(refreshing && "animate-spin text-primary")} />
          </button>

          <button
            type="button"
            onClick={() => setIsCompletedModalOpen(true)}
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs flex items-center gap-2 transition-all cursor-pointer group select-none active:scale-[0.98] hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground">Completed Items</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
              {totalApprovedCount + todos.filter(t => t.done).length} Done
            </span>
            <ArrowRightIcon size={12} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. Top Pulse Metrics Strip: 4 Sleek Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Practicum Hours */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Practicum Hours
            </span>
            <ClockIcon size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">{renderedHours.toFixed(1)}</h3>
              <span className="text-xs text-muted-foreground font-medium">/ {totalHours} hrs</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                {hoursPercent}%
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${hoursPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {hoursRemaining.toFixed(1)} hrs remaining to completion
            </p>
          </div>
        </div>

        {/* Metric 2: Requirements Progress */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Requirements
            </span>
            <ClipboardCheckIcon size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">{totalApprovedCount} of {allRequirements.length}</h3>
              <span className="text-xs text-muted-foreground font-medium">Verified</span>
              {totalPendingCount > 0 ? (
                <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                  {totalPendingCount} Under Review
                </span>
              ) : totalRevisionCount > 0 ? (
                <span className="ml-auto text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                  {totalRevisionCount} Revise
                </span>
              ) : (
                <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  Up to Date
                </span>
              )}
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(totalApprovedCount / allRequirements.length) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(totalPendingCount / allRequirements.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {drafts.length > 0 ? `${drafts.length} draft in progress` : `${allRequirements.length - totalApprovedCount} total remaining`}
            </p>
          </div>
        </div>

        {/* Metric 3: Current Phase */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Practicum Stage
            </span>
            <Sparkles size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {profilePhase === 'before_ojt' ? 'Before OJT' : profilePhase === 'in_ojt' ? 'In OJT' : 'Final Phase'}
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                {profilePhase === 'before_ojt' ? 'Phase 1/3' : profilePhase === 'in_ojt' ? 'Phase 2/3' : 'Phase 3/3'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {profilePhase === 'before_ojt'
                ? 'Clearance & institutional endorsements'
                : profilePhase === 'in_ojt'
                ? 'DTR tracking & weekly reflections'
                : 'Appraisal, paper & defense clearance'}
            </p>
          </div>
        </div>

        {/* Metric 4: Placement & Mentor */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 px-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Host Placement
            </span>
            <BuildingIcon size={13} className="text-muted-foreground" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                {isAssignedCompany ? companyName : 'Pending Placement'}
              </h3>
              {isAssignedCompany ? (
                <CheckCheck size={13} className="text-emerald-500 shrink-0" />
              ) : (
                <ClockIcon size={13} className="text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {isAssignedCompany ? `${supervisorName} · ${companyLocation}` : 'Awaiting company endorsement'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Standard 9:3 Ratio (lg:col-span-9 and lg:col-span-3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Main Practicum Workflows (9 cols) */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* Active Deployment & Attendance Tracker Banner */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Briefcase size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {isAssignedCompany ? 'Active Deployment' : 'Practicum Onboarding'}
                    </span>
                    <span className="text-muted-foreground text-[10px]">·</span>
                    <span className="text-xs font-semibold text-foreground">
                      {isAssignedCompany ? companyName : 'Deployment Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAssignedCompany
                      ? `Supervisor: ${supervisorName} · ${studentRole}`
                      : 'Complete your Before OJT documents and MOA to verify industry placement.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Link to="/student/documents?phase=in_ojt">
                  <Button variant="primary" size="sm" className="font-bold text-xs h-8 px-3 rounded-lg cursor-pointer active:scale-95">
                    <ClockIcon size={13} className="mr-1" />
                    Log DTR
                  </Button>
                </Link>
                <Link to="/student/editor?template=weekly-journal">
                  <Button variant="outline" size="sm" className="font-bold text-xs h-8 px-2.5 rounded-lg cursor-pointer active:scale-95">
                    <BookOpenIcon size={13} className="mr-1" />
                    Journal
                  </Button>
                </Link>
                <Link to="/student/documents">
                  <Button variant="outline" size="sm" className="font-bold text-xs h-8 px-2.5 rounded-lg cursor-pointer active:scale-95">
                    <FolderOpen size={13} className="mr-1" />
                    Repository
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hours Progress and Milestones */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  Logged: <span className="text-foreground font-bold">{renderedHours.toFixed(1)} / {totalHours} Hours</span>
                </span>
                <span className="text-primary font-bold">{hoursPercent}% Rendered</span>
              </div>

              <div className="relative w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${hoursPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                <span>Phase: {profilePhase === 'before_ojt' ? 'Prelim Prep' : profilePhase === 'in_ojt' ? 'Active Logging' : 'Final Exit'}</span>
                <span>Midterm Target: 230.0 hrs</span>
                <span>Final Clearance: 460.0 hrs</span>
              </div>
            </div>
          </div>

          {/* Smart Priority Alert / Adviser Feedback Banner */}
          <div
            className={cn(
              "rounded-xl p-3.5 sm:p-4 border shadow-2xs space-y-2.5 transition-all",
              priorityAction.badgeTone === 'rose' && "bg-rose-500/[0.04] border-rose-500/30",
              priorityAction.badgeTone === 'sky' && "bg-sky-500/[0.04] border-sky-500/30",
              priorityAction.badgeTone === 'primary' && "bg-primary/[0.04] border-primary/30",
              priorityAction.badgeTone === 'emerald' && "bg-emerald-500/[0.04] border-emerald-500/30"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                    priorityAction.badgeTone === 'rose' && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                    priorityAction.badgeTone === 'sky' && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                    priorityAction.badgeTone === 'primary' && "bg-primary/10 text-primary border-primary/20",
                    priorityAction.badgeTone === 'emerald' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}
                >
                  {priorityAction.badgeTone === 'rose' ? (
                    <AlertTriangle size={16} />
                  ) : priorityAction.badgeTone === 'sky' ? (
                    <FileTextIcon size={16} />
                  ) : priorityAction.badgeTone === 'emerald' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider",
                        priorityAction.badgeTone === 'rose' && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                        priorityAction.badgeTone === 'sky' && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                        priorityAction.badgeTone === 'primary' && "bg-primary/10 text-primary",
                        priorityAction.badgeTone === 'emerald' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {priorityAction.badgeText}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {priorityAction.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {priorityAction.description}
                  </p>
                </div>
              </div>

              <Link to={priorityAction.link} className="shrink-0 self-start sm:self-auto">
                <Button variant="primary" size="sm" className="font-bold text-xs h-8 px-3 rounded-lg cursor-pointer active:scale-95">
                  <span>{priorityAction.ctaText}</span>
                  <ArrowRightIcon size={12} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Practicum Requirements Checklist Hub (13 Official Templates) */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-4.5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <ClipboardListIcon size={16} className="text-primary" />
                  <span>Practicum Requirements Checklist</span>
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  13 official institutional templates across the 3 practicum phases.
                </p>
              </div>

              {/* Phase Segmented Buttons */}
              <div className="bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-0.5 flex items-center gap-0.5 text-xs self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePhaseTab('before')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs active:scale-95",
                    activePhaseTab === 'before'
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span>Before OJT</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums",
                      activePhaseTab === 'before' ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200" : "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {beforeDoneCount}/{beforeRequirements.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('in')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs active:scale-95",
                    activePhaseTab === 'in'
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span>In OJT</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums",
                      activePhaseTab === 'in' ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200" : "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {inDoneCount}/{inRequirements.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('final')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs active:scale-95",
                    activePhaseTab === 'final'
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span>Final Phase</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums",
                      activePhaseTab === 'final' ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200" : "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {finalDoneCount}/{finalRequirements.length}
                  </span>
                </button>
              </div>
            </div>

            {/* High-Level 3-Stage Progress Stepper */}
            <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-2.5">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setActivePhaseTab('before')}
                  className={cn(
                    "p-1.5 rounded-md border transition-all cursor-pointer text-center w-full",
                    activePhaseTab === 'before'
                      ? "bg-white dark:bg-zinc-950 border-primary/40 shadow-2xs"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <span
                      className={cn(
                        "size-4 rounded-full flex items-center justify-center text-[8px] font-black",
                        beforeDoneCount === beforeRequirements.length
                          ? "bg-emerald-500 text-white"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {beforeDoneCount === beforeRequirements.length ? '✓' : '1'}
                    </span>
                    <span className="text-foreground">1. Before OJT</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {beforeDoneCount} of {beforeRequirements.length} Done
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('in')}
                  className={cn(
                    "p-1.5 rounded-md border transition-all cursor-pointer text-center w-full",
                    activePhaseTab === 'in'
                      ? "bg-white dark:bg-zinc-950 border-primary/40 shadow-2xs"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <span
                      className={cn(
                        "size-4 rounded-full flex items-center justify-center text-[8px] font-black",
                        inDoneCount === inRequirements.length
                          ? "bg-emerald-500 text-white"
                          : profilePhase === 'in_ojt' || profilePhase === 'final'
                          ? "bg-primary text-primary-foreground"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {inDoneCount === inRequirements.length ? '✓' : profilePhase === 'before_ojt' ? <LockIcon size={8} /> : '2'}
                    </span>
                    <span className="text-foreground">2. In OJT</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {inDoneCount} of {inRequirements.length} Done
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseTab('final')}
                  className={cn(
                    "p-1.5 rounded-md border transition-all cursor-pointer text-center w-full",
                    activePhaseTab === 'final'
                      ? "bg-white dark:bg-zinc-950 border-primary/40 shadow-2xs"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <span
                      className={cn(
                        "size-4 rounded-full flex items-center justify-center text-[8px] font-black",
                        finalDoneCount === finalRequirements.length
                          ? "bg-emerald-500 text-white"
                          : profilePhase === 'final'
                          ? "bg-primary text-primary-foreground"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {finalDoneCount === finalRequirements.length ? '✓' : profilePhase === 'final' ? '3' : <LockIcon size={8} />}
                    </span>
                    <span className="text-foreground">3. Final Phase</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {finalDoneCount} of {finalRequirements.length} Done
                  </span>
                </button>
              </div>
            </div>

            {/* Stable Requirement Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentRequirementItems.map((req, idx) => {
                const isDone = req.status === 'done';
                const isRevision = req.status === 'revision' || req.status === 'returned';
                const isPending = req.status === 'pending';
                const isDraft = req.status === 'draft';
                const isLocked = req.status === 'locked';
                const IconComponent = req.icon;

                const cardClasses = cn(
                  "p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 no-underline text-inherit",
                  isDone && "border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/40",
                  isRevision && "border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500/40",
                  isPending && "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/40",
                  isDraft && "border-sky-500/30 bg-sky-500/[0.03] hover:border-sky-500/40",
                  isLocked ? "opacity-60 border-dashed border-zinc-300/80 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 cursor-not-allowed" : "cursor-pointer group select-none active:scale-[0.99]"
                );

                const cardInner = (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={cn(
                              "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                              isDone && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                              isRevision && "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
                              isPending && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                              isDraft && "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
                              req.status === 'not_started' && "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400",
                              isLocked && "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                            )}
                          >
                            <IconComponent size={14} />
                          </div>
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                            Item {idx + 1}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isDone && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {isRevision && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                            {req.status === 'returned' ? 'Returned' : 'Revision Needed'}
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Under Review
                          </span>
                        )}
                        {isDraft && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            Draft Saved
                          </span>
                        )}
                        {req.status === 'not_started' && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700">
                            Not Started
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700">
                            Locked
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-foreground tracking-tight line-clamp-1">
                          {req.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {req.feedback ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              Remarks: {req.feedback}
                            </span>
                          ) : (
                            req.description
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {req.submissionDate ? `Submitted ${req.submissionDate}` : req.statusLabel}
                      </span>
                      {isLocked ? (
                        <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 font-semibold">
                          <LockIcon size={10} />
                          <span>Phase Locked</span>
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-bold transition-colors",
                            isDone && "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700",
                            isRevision && "text-rose-600 dark:text-rose-400 group-hover:text-rose-700",
                            isPending && "text-amber-600 dark:text-amber-400 group-hover:text-amber-700",
                            isDraft && "text-sky-600 dark:text-sky-400 group-hover:text-sky-700",
                            req.status === 'not_started' && "text-zinc-700 dark:text-zinc-300 group-hover:text-primary"
                          )}
                        >
                          <span>{req.actionText}</span>
                          <ArrowRightIcon size={11} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </>
                );

                if (isLocked) {
                  return (
                    <div key={req.id} className={cardClasses}>
                      {cardInner}
                    </div>
                  );
                }

                return (
                  <Link key={req.id} to={req.link} className={cardClasses}>
                    {cardInner}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Submissions & Adviser Feedback Stream */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <FileCheck2 size={16} className="text-primary" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Recent Submissions & Feedback Stream
                </h3>
              </div>
              <Link
                to="/student/documents"
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View all documents</span>
                <ArrowRightIcon size={11} />
              </Link>
            </div>

            {documents.length === 0 ? (
              <EmptyState
                icon={<FileTextIcon size={24} />}
                title="No Submissions Yet"
                description="Upload or draft your initial practicum requirements such as Application Letters and Consent Forms."
                className="min-h-[160px] py-6"
                action={
                  <Link to="/student/documents">
                    <Button variant="primary" size="sm" className="font-bold text-xs">
                      Open Document Repository
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 4).map(doc => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border",
                          doc.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          doc.status === 'Revision Required' || doc.status === 'Returned' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}
                      >
                        <FileTextIcon size={12} />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground truncate">{doc.doc_type}</span>
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.2 rounded border",
                              doc.status === 'Approved' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                              (doc.status === 'Revision Required' || doc.status === 'Returned') && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                              doc.status.includes('Pending') && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {doc.status}
                          </span>
                        </div>
                        {doc.adviser_feedback ? (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            Feedback: {doc.adviser_feedback}
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">
                            Submitted on {safeFormatDate(doc.created_at, 'MMMM d, yyyy · h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Link
                        to="/student/documents"
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Companion Sidebar Widgets (3 cols) */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Widget 1: Interactive Mini Calendar */}
          {!isCalendarHidden ? (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                  <CalendarDays className="size-3.5 text-primary" />
                  <span>Calendar</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground active:scale-95"
                    title="Previous month"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="tracking-tight text-xs font-bold">{monthName}</span>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer transition-colors text-muted-foreground hover:text-foreground active:scale-95"
                    title="Next month"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Day headers: Su Mo Tu We Th Fr Sa */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground/75 select-none py-0.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days cells */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
                {miniDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center justify-center h-6.5">
                    <span
                      className={cn(
                        "size-5.5 flex items-center justify-center rounded-full text-[11px] font-semibold select-none transition-colors",
                        d.isToday
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : d.currentMonth
                          ? "text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          : "text-muted-foreground/25"
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

              {/* Footer Links: Full calendar & Reset/Hide */}
              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] font-semibold px-0.5">
                <Link
                  to="/student/calendar"
                  className="text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Full calendar</span>
                  <ExternalLink size={9} />
                </Link>
                <div className="flex items-center gap-2">
                  {!isCurrentMonth && (
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date())}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Today
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCalendarHidden(true)}
                    className="text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors text-[11px]"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-dashed border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-xs">Calendar hidden</span>
              <button
                type="button"
                onClick={() => setIsCalendarHidden(false)}
                className="text-primary font-bold hover:underline cursor-pointer text-xs"
              >
                Show
              </button>
            </div>
          )}

          {/* Widget 2: Interactive To-Do Checklist */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>To-do Checklist</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                  {todos.filter(t => !t.done).length} Pending
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsAddingTodo(prev => !prev)}
                  title={isAddingTodo ? "Cancel" : "Add task"}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95"
                >
                  {isAddingTodo ? <X size={12} /> : <Plus size={12} />}
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setTodoFilter('all')}
                className={cn(
                  "px-2 py-0.5 rounded cursor-pointer transition-colors",
                  todoFilter === 'all' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({todos.length})
              </button>
              <button
                type="button"
                onClick={() => setTodoFilter('pending')}
                className={cn(
                  "px-2 py-0.5 rounded cursor-pointer transition-colors",
                  todoFilter === 'pending' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Active ({todos.filter(t => !t.done).length})
              </button>
              <button
                type="button"
                onClick={() => setTodoFilter('completed')}
                className={cn(
                  "px-2 py-0.5 rounded cursor-pointer transition-colors",
                  todoFilter === 'completed' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Done ({todos.filter(t => t.done).length})
              </button>
            </div>

            {/* Quick Add Form */}
            {isAddingTodo && (
              <form onSubmit={handleAddTodo} className="space-y-1.5 pt-0.5 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  placeholder="Type new practicum task..."
                  autoFocus
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 focus:outline-none focus:border-primary text-foreground"
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
                    className="h-6 text-[10px] px-2 rounded-md"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newTodoText.trim()}
                    className="h-6 text-[10px] px-2 rounded-md font-bold"
                  >
                    Add Task
                  </Button>
                </div>
              </form>
            )}

            {/* Todo Items */}
            <div className="space-y-1.5 pt-0.5 max-h-[260px] overflow-y-auto pr-0.5">
              {filteredTodos.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-muted-foreground">
                  {todoFilter === 'pending' ? 'No pending tasks left!' : 'No tasks in this view.'}
                </div>
              ) : (
                filteredTodos.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className={cn(
                      "flex items-start gap-2 p-2 px-2.5 rounded-lg border transition-all cursor-pointer group text-xs",
                      item.done
                        ? "bg-zinc-100/40 dark:bg-zinc-900/30 border-zinc-200/40 dark:border-zinc-800/40 opacity-60"
                        : "bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div
                      className={cn(
                        "size-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        item.done
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/50 group-hover:border-foreground"
                      )}
                    >
                      {item.done && <Check size={9} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-medium text-xs leading-snug transition-colors",
                          item.done ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary"
                        )}
                      >
                        {item.text}
                      </p>
                      {item.link && (
                        <Link
                          to={item.link}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline mt-0.5"
                        >
                          <span>Open action</span>
                          <ExternalLink size={8} />
                        </Link>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={e => deleteTodo(item.id, e)}
                      title="Delete task"
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 3: Practicum Announcements Bulletin */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                <Megaphone className="size-3.5 text-primary" />
                <span>Announcements</span>
              </div>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold">
                1 Notice
              </Badge>
            </div>

            {/* Announcement Bulletin */}
            <div className="space-y-1.5 pt-0.5">
              <div className="p-2.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Midterm Evaluation Window</span>
                  <span className="text-[9px] text-muted-foreground font-medium">Active</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Ensure DTR hours are signed weekly by your corporate supervisor before the Friday 5:00 PM cutoff.
                </p>
              </div>

              <div className="text-center pt-0.5">
                <Link
                  to="/student/notifications"
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View institutional alerts</span>
                  <ArrowRightIcon size={10} />
                </Link>
              </div>
            </div>
          </div>

          {/* Widget 4: Practicum Support Contacts */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-foreground font-bold text-xs px-0.5">
              <UsersIcon className="size-3.5 text-primary" />
              <span>Practicum Contacts</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  {getInitials(adviserName, 'SJ')}
                </div>
                <div className="min-w-0 flex-1 space-y-0.2">
                  <p className="font-bold text-foreground truncate text-xs">{adviserName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {adviserName === 'Awaiting Assignment' ? 'Coordinator pending assignment' : 'Practicum Adviser · STI Marikina'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  {getInitials(supervisorName, 'PR')}
                </div>
                <div className="min-w-0 flex-1 space-y-0.2">
                  <p className="font-bold text-foreground truncate text-xs">{supervisorName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {supervisorName === 'Awaiting Placement' ? 'Host company supervisor pending' : `Supervisor · ${companyName}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Tasks & Milestones Modal */}
      <Dialog open={isCompletedModalOpen} onOpenChange={setIsCompletedModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Completed Practicum Accomplishments
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Verified institutional requirements and completed task items.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 py-2">
            {/* Approved submissions */}
            {allRequirements.filter(r => r.status === 'done').map(req => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 hover:bg-emerald-500/[0.08] transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground truncate">{req.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold">
                        {req.phase === 'before_ojt' ? 'Before OJT' : req.phase === 'in_ojt' ? 'In OJT' : 'Final'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Verified and approved by your practicum coordinator.
                    </p>
                  </div>
                </div>
                <Link
                  to={req.link}
                  onClick={() => setIsCompletedModalOpen(false)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold text-[11px] shrink-0 self-center"
                >
                  View
                </Link>
              </div>
            ))}

            {/* To-dos marked done */}
            {todos
              .filter(t => t.done)
              .map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate line-through opacity-80">
                          {item.text}
                        </span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] h-4 px-1.5 font-bold">
                          Task
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Completed from your personal practicum checklist.
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            {allRequirements.filter(r => r.status === 'done').length === 0 && todos.filter(t => t.done).length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No completed accomplishments yet. Work on your Before OJT clearance to get started!
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompletedModalOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
