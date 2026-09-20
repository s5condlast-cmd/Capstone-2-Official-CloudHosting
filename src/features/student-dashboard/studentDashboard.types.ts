/**
 * studentDashboard.types.ts
 * Domain and View-Model types for the Bento-Style Student Dashboard.
 */

export type PracticumPhase = 'before_ojt' | 'in_ojt' | 'final';

export type RequirementStatus = 
  | 'done' 
  | 'pending' 
  | 'revision' 
  | 'returned' 
  | 'draft' 
  | 'not_started' 
  | 'locked';

export interface RequirementItem {
  id: string;
  name: string;
  description: string;
  phase: PracticumPhase;
  status: RequirementStatus;
  statusLabel: string;
  actionText: string;
  link: string;
  submissionDate?: string;
  feedback?: string;
  iconName?: string;
}

export interface NextPriorityAction {
  title: string;
  description: string;
  badgeText: string;
  badgeTone: 'rose' | 'amber' | 'emerald' | 'sky' | 'primary';
  ctaText: string;
  link: string;
  urgent: boolean;
}

export interface WeeklyAttendanceDay {
  dayShort: string; // 'Mon', 'Tue', etc.
  dayNumber: number;
  date: string;
  hours: number;
  isToday: boolean;
  isRendered: boolean;
}

export interface AdviserFeedbackItem {
  id: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  documentTitle: string;
  feedback: string;
  status: 'Approved' | 'Revision Required' | 'Returned' | 'Pending Review';
  createdAt: string;
  formattedDate: string;
  link: string;
}

export interface PracticumContact {
  id: string;
  name: string;
  role: string;
  initials: string;
  company?: string;
  email?: string;
}

export interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  studentId: string;
  program: string;
  section: string;
  companyName: string;
  supervisorName: string;
  studentRole: string;
  companyLocation: string;
  adviserName: string;
  profilePhase: PracticumPhase;
  renderedHours: number;
  targetHours: number;
}

export interface StudentDashboardViewModel {
  profile: StudentProfileData;
  activePhaseTab: PracticumPhase;
  hoursPercent: number;
  hoursRemaining: number;
  totalApproved: number;
  totalPending: number;
  totalRevision: number;
  totalRequirements: number;
  phaseRequirements: RequirementItem[];
  beforeDone: number;
  beforeTotal: number;
  inDone: number;
  inTotal: number;
  finalDone: number;
  finalTotal: number;
  nextAction: NextPriorityAction;
  weeklyAttendance: WeeklyAttendanceDay[];
  weeklyTotalHours: number;
  feedbackList: AdviserFeedbackItem[];
  contacts: PracticumContact[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setActivePhaseTab: (phase: PracticumPhase) => void;
}
