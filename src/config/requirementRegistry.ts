/**
 * requirementRegistry.ts
 * Central institutional requirement registry for STI eLMS Document Repository
 * and Requirement Review flows.
 */

export interface RubricItem {
  id: number;
  title: string;
  points: number;
}

export interface InstitutionalRequirement {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  moduleTitle: string;
  phase: 'before_ojt' | 'in_ojt' | 'final';
  category: string;
  maxScore: number;
  startDate: string;
  dueDate: string;
  weight: string;
  instructions: string;
  rubric: RubricItem[];
  maxAttempts: number;
  allowLate: boolean;
  editable: boolean;
  redirectTo?: string;
}

export const INSTITUTIONAL_REQUIREMENTS: InstitutionalRequirement[] = [
  {
    id: 'student-application-letter',
    code: '01',
    name: '01 Student Application Letter - ARG',
    subtitle: 'Formal Practicum Application',
    moduleTitle: 'Before OJT Requirements',
    phase: 'before_ojt',
    category: 'Formal Letter',
    maxScore: 100,
    startDate: 'Aug 27, 2:20 pm',
    dueDate: 'Sep 7, 5:00 pm',
    weight: '10%',
    instructions:
      'Draft a formal application letter addressed to the Practicum Coordinator indicating your intent to undergo On-the-Job Training. Ensure all partner company details, requested training hours, and student contact credentials are accurately specified.',
    rubric: [
      { id: 1, title: 'Formal Request & Addressee', points: 15 },
      { id: 2, title: 'Student Credentials & Academic Standing', points: 15 },
      { id: 3, title: 'Company Placement & Department', points: 20 },
      { id: 4, title: 'Scope of Training & Hours Commitment', points: 20 },
      { id: 5, title: 'Formal Signatures & Endorsements', points: 30 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'parent-consent-with-fee',
    code: '02',
    name: '02 Parent Consent Form (With Fee) - ARG',
    subtitle: 'Legal & Guardian Authorization',
    moduleTitle: 'Before OJT Requirements',
    phase: 'before_ojt',
    category: 'Consent Form',
    maxScore: 100,
    startDate: 'Aug 27, 2:20 pm',
    dueDate: 'Sep 7, 5:00 pm',
    weight: '10%',
    instructions:
      'Submit signed parent or guardian consent explicitly authorizing off-campus practicum deployment with corresponding practicum fee acknowledgment. Both student and legal guardian signatures must be affixed.',
    rubric: [
      { id: 1, title: 'Parent/Guardian Legal Information', points: 20 },
      { id: 2, title: 'Student Identification & Student ID', points: 20 },
      { id: 3, title: 'Practicum Fee & Training Acknowledgment', points: 20 },
      { id: 4, title: 'Emergency Contact & Health Disclosure', points: 20 },
      { id: 5, title: 'Verified Guardian Signature & Date', points: 20 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'student-consent-with-fee',
    code: '03',
    name: '03 Student Consent Form - ARG',
    subtitle: 'Student Waiver & Agreement',
    moduleTitle: 'Before OJT Requirements',
    phase: 'before_ojt',
    category: 'Consent Form',
    maxScore: 100,
    startDate: 'Aug 27, 2:20 pm',
    dueDate: 'Sep 7, 5:00 pm',
    weight: '10%',
    instructions:
      'Complete the student consent form affirming personal commitment to adhere to all company safety regulations, workplace decorum, institutional guidelines, and academic practicum requirements.',
    rubric: [
      { id: 1, title: 'Statement of Compliance & Willingness', points: 25 },
      { id: 2, title: 'Institutional Practicum Policy Concurrence', points: 25 },
      { id: 3, title: 'Code of Professional Conduct Acknowledgment', points: 25 },
      { id: 4, title: 'Verified Student Signature & Date', points: 25 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'moa-template',
    code: '04',
    name: '04 Memorandum of Agreement (MOA) - ARG',
    subtitle: 'Institutional Company Partnership',
    moduleTitle: 'Before OJT Requirements',
    phase: 'before_ojt',
    category: 'Legal Agreement',
    maxScore: 100,
    startDate: 'Aug 28, 9:00 am',
    dueDate: 'Sep 14, 5:00 pm',
    weight: '15%',
    instructions:
      'Institutional bipartite agreement between STI College Marikina and the host training establishment detailing mentorship terms, student safety provisions, and training deliverables.',
    rubric: [
      { id: 1, title: 'Host Establishment Corporate Profile & Address', points: 20 },
      { id: 2, title: 'Authorized Signatory Credentials & Designation', points: 20 },
      { id: 3, title: 'Mutual Obligations of the Parties', points: 20 },
      { id: 4, title: 'Practicum Duration & Effective Term', points: 20 },
      { id: 5, title: 'Notarization & Official Signatures', points: 20 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'endorsement-letter',
    code: '05',
    name: '05 Endorsement Letter - ARG',
    subtitle: 'Coordinator Endorsement',
    moduleTitle: 'Before OJT Requirements',
    phase: 'before_ojt',
    category: 'Formal Letter',
    maxScore: 50,
    startDate: 'Aug 28, 10:00 am',
    dueDate: 'Sep 14, 5:00 pm',
    weight: '5%',
    instructions:
      'Official endorsement from the Practicum Coordinator formally recommending you for immersion to your designated host training establishment.',
    rubric: [
      { id: 1, title: 'Host Company Addressee & Department', points: 15 },
      { id: 2, title: 'HR Manager / Coordinator Verification', points: 15 },
      { id: 3, title: 'Student Program & Academic Standing', points: 10 },
      { id: 4, title: 'Institutional Signature & Stamp', points: 10 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'proposal-letter',
    code: '06',
    name: '06 Proposal Letter - ARG',
    subtitle: 'Training Placement Proposal',
    moduleTitle: 'Before OJT Requirements',
    phase: 'before_ojt',
    category: 'Formal Letter',
    maxScore: 50,
    startDate: 'Aug 28, 11:00 am',
    dueDate: 'Sep 14, 5:00 pm',
    weight: '5%',
    instructions:
      'Formal proposal letter introducing your technical qualification profile and proposing training scope to prospective partner establishments.',
    rubric: [
      { id: 1, title: 'Company Addressee & Department Head', points: 15 },
      { id: 2, title: 'Value Proposition & Technical Skillsets', points: 15 },
      { id: 3, title: 'Target Department & Project Domain', points: 10 },
      { id: 4, title: 'Professional Formatting & Tone', points: 10 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'weekly-journal',
    code: '07',
    name: '07 Weekly OJT Journal - ARG',
    subtitle: 'Periodic Activity Reflection',
    moduleTitle: 'In OJT Requirements',
    phase: 'in_ojt',
    category: 'Journal',
    maxScore: 100,
    startDate: 'Sep 1, 8:00 am',
    dueDate: 'Weekly Friday 5:00 pm',
    weight: '20%',
    instructions:
      'Weekly comprehensive journal chronicling daily training activities, technical competencies applied, workplace challenges encountered, and solutions executed.',
    rubric: [
      { id: 1, title: 'Daily Tasks & Activities Breakdown', points: 25 },
      { id: 2, title: 'Technical Insights & Coursework Alignment', points: 25 },
      { id: 3, title: 'Workplace Challenges & Practical Resolutions', points: 25 },
      { id: 4, title: 'Hours Rendered & Supervisor Concurrence', points: 25 },
    ],
    maxAttempts: 3,
    allowLate: true,
    editable: true,
  },
  {
    id: 'dtr-form',
    code: '08',
    name: '08 Daily Time Record (DTR) - ARG',
    subtitle: 'Attendance Matrix & Sign-off',
    moduleTitle: 'In OJT Requirements',
    phase: 'in_ojt',
    category: 'Attendance',
    maxScore: 100,
    startDate: 'Sep 1, 8:00 am',
    dueDate: 'Weekly Submission',
    weight: '15%',
    instructions:
      'Official weekly biometric attendance record detailing verified time-in and time-out punches, accumulated rendered hours, and supervisor signature verification.',
    rubric: [
      { id: 1, title: 'Biometric Punch Accuracy & Punctuality', points: 30 },
      { id: 2, title: 'Calculated Weekly Rendered Hours', points: 30 },
      { id: 3, title: 'Absence / Makeup Hour Justification', points: 20 },
      { id: 4, title: 'Verified Supervisor Signature', points: 20 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: false,
    redirectTo: '/student/attendance',
  },
  {
    id: 'training-plan-form',
    code: '09',
    name: '09 Training Plan Form - ARG',
    subtitle: 'Competency & Objectives Matrix',
    moduleTitle: 'In OJT Requirements',
    phase: 'in_ojt',
    category: 'Plan',
    maxScore: 50,
    startDate: 'Sep 1, 8:00 am',
    dueDate: 'Sep 21, 5:00 pm',
    weight: '5%',
    instructions:
      'Structured training plan co-authored with your company supervisor outlining learning objectives, weekly milestone activities, and target technical competencies.',
    rubric: [
      { id: 1, title: 'Training Objectives & Course Alignment', points: 15 },
      { id: 2, title: 'Weekly Milestone & Deliverable Schedule', points: 15 },
      { id: 3, title: 'Tangible Output Specification', points: 10 },
      { id: 4, title: 'Supervisor Formal Endorsement', points: 10 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'integration-paper',
    code: '10',
    name: '10 Final Integration Paper - ARG',
    subtitle: 'Practicum Synthesis Report',
    moduleTitle: 'Final Phase Requirements',
    phase: 'final',
    category: 'Synthesis',
    maxScore: 100,
    startDate: 'Oct 1, 8:00 am',
    dueDate: 'Nov 15, 5:00 pm',
    weight: '25%',
    instructions:
      'Comprehensive capstone synthesis paper connecting academic theories and classroom knowledge with practical immersion experiences, challenges, and insights.',
    rubric: [
      { id: 1, title: 'Company Background & Trainee Role Overview', points: 20 },
      { id: 2, title: 'Technical Competencies & Practical Immersion', points: 25 },
      { id: 3, title: 'Integration with Academic Foundations', points: 25 },
      { id: 4, title: 'Recommendations for Future Interns', points: 15 },
      { id: 5, title: 'Institutional Citations & Documentation', points: 15 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
  {
    id: 'performance-appraisal',
    code: '11',
    name: '11 Performance Appraisal Form - ARG',
    subtitle: 'Supervisor Evaluation & Rating',
    moduleTitle: 'Final Phase Requirements',
    phase: 'final',
    category: 'Evaluation',
    maxScore: 100,
    startDate: 'Oct 15, 8:00 am',
    dueDate: 'Nov 20, 5:00 pm',
    weight: '25%',
    instructions:
      'Final formal appraisal completed and signed by your company supervisor assessing work quality, punctuality, initiative, communication, and professional conduct.',
    rubric: [
      { id: 1, title: 'Quality & Accuracy of Deliverables (1-5)', points: 20 },
      { id: 2, title: 'Punctuality & Attendance Metric (1-5)', points: 20 },
      { id: 3, title: 'Initiative, Creativity & Problem Solving (1-5)', points: 20 },
      { id: 4, title: 'Communication & Team Cooperation (1-5)', points: 20 },
      { id: 5, title: 'Overall Supervisor Appraisal & Sign-off', points: 20 },
    ],
    maxAttempts: 2,
    allowLate: false,
    editable: true,
  },
];

export function getRequirementById(id: string): InstitutionalRequirement | undefined {
  const normalized = id.trim().toLowerCase();
  return INSTITUTIONAL_REQUIREMENTS.find(
    r =>
      r.id.toLowerCase() === normalized ||
      r.name.toLowerCase().includes(normalized) ||
      r.code === normalized
  );
}

export function getRequirementByIndex(index: number): InstitutionalRequirement | undefined {
  return INSTITUTIONAL_REQUIREMENTS[index];
}

export function getAdjacentRequirements(currentId: string): {
  previous: InstitutionalRequirement | null;
  next: InstitutionalRequirement | null;
} {
  const currentIndex = INSTITUTIONAL_REQUIREMENTS.findIndex(
    r => r.id.toLowerCase() === currentId.toLowerCase()
  );
  if (currentIndex === -1) {
    return { previous: null, next: null };
  }
  return {
    previous: currentIndex > 0 ? INSTITUTIONAL_REQUIREMENTS[currentIndex - 1] : null,
    next:
      currentIndex < INSTITUTIONAL_REQUIREMENTS.length - 1
        ? INSTITUTIONAL_REQUIREMENTS[currentIndex + 1]
        : null,
  };
}

