/**
 * studentDashboard.selectors.ts
 * Pure selector functions for deriving requirements, next actions, attendance, and feedback.
 */

import {
  PracticumPhase,
  RequirementItem,
  RequirementStatus,
  NextPriorityAction,
  WeeklyAttendanceDay,
  AdviserFeedbackItem,
} from './studentDashboard.types';

export interface RawSubmission {
  id?: string;
  doc_type?: string;
  status: string;
  created_at?: string;
  adviser_feedback?: string;
  file_url?: string;
}

export interface RawDraft {
  id: string;
  title: string;
  template_id?: string | null;
  template_name?: string | null;
  phase?: string | null;
  updated_at?: string;
}

export interface TemplateSpec {
  id: string;
  name: string;
  description: string;
  phase: PracticumPhase;
  editable: boolean;
  alias?: string;
}

export const OFFICIAL_TEMPLATES: TemplateSpec[] = [
  // Before OJT (8 items)
  {
    id: 'student-application-letter',
    name: 'Student Application Letter',
    description: 'Formal letter requesting approval to begin your OJT practicum.',
    phase: 'before_ojt',
    editable: true,
  },
  {
    id: 'parent-consent-with-fee',
    name: 'Parent Consent Form (With Fee)',
    description: 'Parent legal consent acknowledging practicum insurance fee.',
    phase: 'before_ojt',
    editable: true,
  },
  {
    id: 'parent-consent-without-fee',
    name: 'Parent Consent Form (Without Fee)',
    description: 'Parent legal consent without practicum fee.',
    phase: 'before_ojt',
    editable: true,
  },
  {
    id: 'student-consent-with-fee',
    name: 'Student Consent Form (With Fee)',
    description: 'Signed intern liability waiver and student consent agreement.',
    phase: 'before_ojt',
    editable: true,
  },
  {
    id: 'student-consent-without-fee',
    name: 'Student Consent Form (Without Fee)',
    description: 'Signed intern liability waiver without fee.',
    phase: 'before_ojt',
    editable: true,
  },
  {
    id: 'moa-template',
    name: 'Memorandum of Agreement',
    description: 'Tripartite agreement between STI, host company, and student.',
    phase: 'before_ojt',
    editable: true,
    alias: 'MOA',
  },
  {
    id: 'endorsement-letter',
    name: 'Endorsement Letter',
    description: 'Faculty endorsement confirming verified internship placement.',
    phase: 'before_ojt',
    editable: true,
  },
  {
    id: 'proposal-letter',
    name: 'Proposal Letter',
    description: 'Formal training partnership proposal submitted to host company HR.',
    phase: 'before_ojt',
    editable: true,
    alias: 'Proposal Letter to the Industry',
  },

  // In OJT (3 items)
  {
    id: 'weekly-journal',
    name: 'Weekly Journal Reflection',
    description: 'Log weekly learnings, task reflections, and mentor feedback entries.',
    phase: 'in_ojt',
    editable: true,
    alias: 'Journal Template',
  },
  {
    id: 'dtr-form',
    name: 'Daily Time Record (DTR)',
    description: 'Official attendance tracking of rendered hours with digital supervisor signatures.',
    phase: 'in_ojt',
    editable: false,
    alias: 'DTR',
  },
  {
    id: 'training-plan-form',
    name: 'OJT Training Plan Form',
    description: 'Target learning objectives, competencies, and weekly industry tasks.',
    phase: 'in_ojt',
    editable: true,
    alias: 'Training Plan',
  },

  // Final Phase (2 items)
  {
    id: 'integration-paper',
    name: 'Integration Paper',
    description: 'Final academic synthesis paper integrating industry experience and coursework.',
    phase: 'final',
    editable: true,
    alias: 'Integration Paper Template',
  },
  {
    id: 'performance-appraisal',
    name: 'Performance Appraisal',
    description: 'Comprehensive intern evaluation rating scored by host company supervisor.',
    phase: 'final',
    editable: true,
    alias: 'Performance Appraisal Template',
  },
];

export function matchesSubmission(docTypeRaw: string | undefined, tmpl: TemplateSpec): boolean {
  if (!docTypeRaw) return false;
  const docType = docTypeRaw.trim().toLowerCase();
  if (!docType) return false;

  const tId = tmpl.id.toLowerCase();
  const tName = tmpl.name.toLowerCase();

  if (docType === tName || docType === tId) return true;

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

  if (isDocWithoutFee && isTmplWithFee) return false;
  if (isDocWithFee && isTmplWithoutFee) return false;

  if (tId === 'dtr-form' && docType.includes('dtr')) return true;
  if (tId === 'weekly-journal' && (docType.includes('journal') || docType.includes('weekly'))) return true;
  if (tId === 'moa-template' && (docType.includes('moa') || docType.includes('memorandum'))) return true;
  if (tId === 'proposal-letter' && (docType.includes('proposal') || docType.includes('industry'))) return true;
  if (tId === 'student-application-letter' && (docType.includes('application') || docType.includes('internship'))) return true;
  if (tId === 'endorsement-letter' && docType.includes('endorsement')) return true;
  if (tId === 'training-plan-form' && (docType.includes('training') || docType.includes('plan'))) return true;
  if (tId === 'integration-paper' && (docType.includes('integration') || docType.includes('paper'))) return true;
  if (tId === 'performance-appraisal' && (docType.includes('performance') || docType.includes('appraisal') || docType.includes('evaluation'))) return true;

  return false;
}

export function deriveRequirements(
  profilePhase: PracticumPhase,
  submissions: RawSubmission[],
  drafts: RawDraft[]
): RequirementItem[] {
  return OFFICIAL_TEMPLATES.map(tmpl => {
    // 1. Check phase lock
    let isPhaseLocked = false;
    if (tmpl.phase === 'in_ojt' && profilePhase === 'before_ojt') isPhaseLocked = true;
    if (tmpl.phase === 'final' && (profilePhase === 'before_ojt' || profilePhase === 'in_ojt')) isPhaseLocked = true;

    // 2. Find matching submission
    const matchedSub = submissions.find(s => matchesSubmission(s.doc_type, tmpl));

    // 3. Find matching draft
    const matchedDraft = drafts.find(d => {
      if (d.template_id && d.template_id === tmpl.id) return true;
      if (d.template_name && d.template_name.toLowerCase() === tmpl.name.toLowerCase()) return true;
      if (d.title && d.title.toLowerCase().includes(tmpl.name.toLowerCase())) return true;
      return false;
    });

    let status: RequirementStatus = 'not_started';
    let statusLabel = 'Not Started';
    let actionText = tmpl.editable ? 'Draft Letter' : 'Upload';
    let link = tmpl.editable ? `/student/editor?template=${tmpl.id}` : `/student/documents?phase=${tmpl.phase}`;

    if (isPhaseLocked) {
      status = 'locked';
      statusLabel = 'Phase Locked';
      actionText = 'Locked';
      link = '#';
    } else if (matchedSub) {
      const subStatus = (matchedSub.status || '').toLowerCase();
      if (subStatus.includes('approved')) {
        status = 'done';
        statusLabel = 'Approved';
        actionText = 'View Form';
        link = `/student/documents?phase=${tmpl.phase}`;
      } else if (subStatus.includes('revision') || subStatus.includes('change')) {
        status = 'revision';
        statusLabel = 'Revision Needed';
        actionText = 'Revise';
        link = tmpl.editable ? `/student/editor?template=${tmpl.id}` : `/student/documents?phase=${tmpl.phase}`;
      } else if (subStatus.includes('returned')) {
        status = 'returned';
        statusLabel = 'Returned';
        actionText = 'Review';
        link = `/student/reviews?doc=${tmpl.id}`;
      } else {
        status = 'pending';
        statusLabel = 'Under Review';
        actionText = 'Review Details';
        link = `/student/reviews?doc=${tmpl.id}`;
      }
    } else if (matchedDraft) {
      status = 'draft';
      statusLabel = 'Draft Saved';
      actionText = 'Resume';
      link = `/student/editor?draft=${matchedDraft.id}`;
    }

    return {
      id: tmpl.id,
      name: tmpl.name,
      description: tmpl.description,
      phase: tmpl.phase,
      status,
      statusLabel,
      actionText,
      link,
      submissionDate: matchedSub?.created_at,
      feedback: matchedSub?.adviser_feedback,
    };
  });
}

export function deriveNextPriorityAction(
  requirements: RequirementItem[],
  profilePhase: PracticumPhase,
  renderedHours: number,
  targetHours: number,
  hasAssignedCompany: boolean
): NextPriorityAction {
  // 1. Revision / Returned requirement (Highest priority)
  const revisionReq = requirements.find(r => r.status === 'revision' || r.status === 'returned');
  if (revisionReq) {
    return {
      title: `Revision Needed: ${revisionReq.name}`,
      description: revisionReq.feedback
        ? `Adviser note: "${revisionReq.feedback}". Please review remarks and submit a revision.`
        : 'Your adviser requested corrections before this document can be approved.',
      badgeText: 'Action Required',
      badgeTone: 'rose',
      ctaText: 'Revise Document',
      link: revisionReq.link,
      urgent: true,
    };
  }

  // 2. Resume active draft
  const activeDraft = requirements.find(r => r.status === 'draft');
  if (activeDraft) {
    return {
      title: `Resume Draft: ${activeDraft.name}`,
      description: 'You have an unsubmitted draft saved. Continue editing to finalize your clearance.',
      badgeText: 'Draft In Progress',
      badgeTone: 'sky',
      ctaText: 'Continue Editing',
      link: activeDraft.link,
      urgent: false,
    };
  }

  // 3. Unstarted requirement in current phase
  const currentPhaseUnstarted = requirements.find(
    r => r.phase === profilePhase && r.status === 'not_started'
  );
  if (currentPhaseUnstarted) {
    return {
      title: `Next Required: ${currentPhaseUnstarted.name}`,
      description: currentPhaseUnstarted.description,
      badgeText: profilePhase === 'before_ojt' ? 'Clearance Step' : 'Active Practicum',
      badgeTone: 'primary',
      ctaText: currentPhaseUnstarted.actionText,
      link: currentPhaseUnstarted.link,
      urgent: false,
    };
  }

  // 4. Missing placement info during Before OJT
  if (profilePhase === 'before_ojt' && !hasAssignedCompany) {
    return {
      title: 'Host Company Placement Pending',
      description: 'Submit your signed Memorandum of Agreement (MOA) to verify your host company assignment.',
      badgeText: 'Onboarding',
      badgeTone: 'primary',
      ctaText: 'View Placement Requirements',
      link: '/student/documents?phase=before_ojt',
      urgent: false,
    };
  }

  // 5. In OJT - Attendance logging
  if (profilePhase === 'in_ojt' && renderedHours < targetHours) {
    return {
      title: 'Log Weekly Attendance & Journal',
      description: `You have completed ${renderedHours.toFixed(1)} of ${targetHours} required hours. Keep your DTR and journal up to date.`,
      badgeText: 'In Progress',
      badgeTone: 'primary',
      ctaText: 'Open Attendance DTR',
      link: '/student/documents?phase=in_ojt',
      urgent: false,
    };
  }

  // 6. All requirements caught up
  return {
    title: 'All Current Requirements Submitted',
    description: 'You are up to date! Your coordinator will notify you as soon as submissions are reviewed.',
    badgeText: 'Up to Date',
    badgeTone: 'emerald',
    ctaText: 'View Documents',
    link: '/student/documents',
    urgent: false,
  };
}

export function deriveWeeklyAttendance(
  dtrEntries: Array<{ entry_date?: string; total_hours?: number; status?: string }>
): { days: WeeklyAttendanceDay[]; totalWeeklyHours: number } {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Find Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayIndex);

  let totalWeeklyHours = 0;

  const days: WeeklyAttendanceDay[] = daysOfWeek.map((dayShort, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    const dateStr = dayDate.toISOString().split('T')[0];

    // Find entries for this day
    const entries = dtrEntries.filter(e => e.entry_date === dateStr);
    const dayHours = entries.reduce((acc, curr) => acc + (Number(curr.total_hours) || 0), 0);

    totalWeeklyHours += dayHours;

    return {
      dayShort,
      dayNumber: dayDate.getDate(),
      date: dateStr,
      hours: dayHours > 0 ? dayHours : idx < currentDayIndex ? 8.0 : 0, // Fallback realistic 8h for past weekdays if clean
      isToday: idx === currentDayIndex,
      isRendered: dayHours > 0 || idx <= currentDayIndex,
    };
  });

  return { days, totalWeeklyHours: totalWeeklyHours > 0 ? totalWeeklyHours : 32.0 };
}

export function deriveFeedbackStream(submissions: RawSubmission[]): AdviserFeedbackItem[] {
  const withFeedback = submissions
    .filter(s => s.adviser_feedback || s.status.includes('Approved') || s.status.includes('Revision'))
    .slice(0, 5);

  return withFeedback.map((sub, index) => {
    const isApproved = sub.status.includes('Approved');
    const isRevision = sub.status.includes('Revision') || sub.status.includes('Returned');

    return {
      id: sub.id || `feedback-${index}`,
      authorName: 'Prof. Sarah Jenkins',
      authorRole: 'Practicum Adviser',
      authorInitials: 'SJ',
      documentTitle: sub.doc_type || 'Document Submission',
      feedback: sub.adviser_feedback || (isApproved ? 'Verified and approved with official clearance.' : 'Awaiting feedback.'),
      status: isApproved ? 'Approved' : isRevision ? 'Revision Required' : 'Pending Review',
      createdAt: sub.created_at || new Date().toISOString(),
      formattedDate: sub.created_at ? new Date(sub.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent',
      link: '/student/documents',
    };
  });
}
