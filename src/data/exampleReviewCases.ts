/**
 * exampleReviewCases.ts
 * Curated institutional example review cases for the Centralized Document Review Center.
 * Provides realistic review cases across All, In Review, Revisions, and Approved stages.
 */

import {
  ReviewCase,
  ReviewCaseDetails,
  DocumentRevision,
  DocumentComment,
  DocumentCaseFile,
  DocumentReviewEvent,
  ReviewInboxFilter,
  ReviewDecision,
  ReviewStage,
} from '@/src/types/documentReview';
import { Role } from '@/src/types';

export const INITIAL_EXAMPLE_CASES: ReviewCaseDetails[] = [
  // ─── Case 1: Endorsement Letter (Needs Adviser Review) ───
  {
    caseRecord: {
      id: 'case-example-endorsement',
      student_id: 'std-05000372499',
      student_name: 'John Dwayne B. Guaniso',
      student_course: 'BSIT 402',
      document_type: 'Endorsement Letter',
      template_id: 'endorsement',
      title: 'Endorsement Letter - InnoTech Labs Inc.',
      review_route: 'adviser_only',
      stage: 'submitted_to_adviser',
      assigned_adviser_id: 'adv-001',
      assigned_adviser_name: 'Dr. Sarah Johnson',
      assigned_supervisor_id: 'sup-001',
      assigned_supervisor_name: 'Engr. Paolo Reyes',
      current_revision_id: 'rev-endorsement-1',
      current_revision_number: 1,
      priority: 'high',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    revisions: [
      {
        id: 'rev-endorsement-1',
        case_id: 'case-example-endorsement',
        revision_number: 1,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'John_Dwayne_Guaniso_Endorsement_Letter.pdf',
        mime_type: 'application/pdf',
        byte_size: 250880, // ~245 KB
        submitted_by: 'std-05000372499',
        submitted_by_name: 'John Dwayne B. Guaniso',
        remarks: 'Official Endorsement Letter addressed to Engr. Paolo Reyes of InnoTech Labs Inc. for Dr. Johnson review.',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-end-1',
        case_id: 'case-example-endorsement',
        revision_id: 'rev-endorsement-1',
        author_id: 'std-05000372499',
        author_name: 'John Dwayne B. Guaniso',
        author_role: 'student',
        message: 'Good day Dr. Johnson! I have finalized the technical practicum terms with InnoTech Labs and submitted my formal Endorsement Letter for your review and endorsement signature.',
        created_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      },
      {
        id: 'comm-end-2',
        case_id: 'case-example-endorsement',
        revision_id: 'rev-endorsement-1',
        author_id: 'adv-001',
        author_name: 'Dr. Sarah Johnson',
        author_role: 'adviser',
        message: 'Hello John, I have received your submission. Verifying company details and host supervisor credentials now.',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
    files: [
      {
        id: 'file-end-1',
        case_id: 'case-example-endorsement',
        uploaded_by: 'std-05000372499',
        uploaded_by_name: 'John Dwayne B. Guaniso',
        purpose: 'supporting_file',
        file_path: '/templates/h5.pdf',
        original_filename: 'InnoTech_Company_Profile.pdf',
        mime_type: 'application/pdf',
        byte_size: 421000,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
    events: [
      {
        id: 'ev-end-1',
        case_id: 'case-example-endorsement',
        revision_id: 'rev-endorsement-1',
        actor_id: 'std-05000372499',
        actor_name: 'John Dwayne B. Guaniso',
        actor_role: 'student',
        action: 'submit_revision',
        previous_stage: null,
        next_stage: 'submitted_to_adviser',
        remarks: 'Student submitted Revision 1 for official adviser review',
        metadata: { revisionNumber: 1 },
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },

  // ─── Case 2: MOA Template (Revision Required) ───
  {
    caseRecord: {
      id: 'case-example-moa',
      student_id: 'std-05000388123',
      student_name: 'Maria Santos',
      student_course: 'BSIT 401',
      document_type: 'MOA Template',
      template_id: 'moa',
      title: 'Memorandum of Agreement - InnoTech Labs Inc.',
      review_route: 'supervisor_then_adviser',
      stage: 'adviser_revision_required',
      assigned_adviser_id: 'adv-001',
      assigned_adviser_name: 'Dr. Sarah Johnson',
      assigned_supervisor_id: 'sup-001',
      assigned_supervisor_name: 'Engr. Paolo Reyes',
      current_revision_id: 'rev-moa-2',
      current_revision_number: 2,
      priority: 'urgent',
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    revisions: [
      {
        id: 'rev-moa-2',
        case_id: 'case-example-moa',
        revision_number: 2,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'MOA_InnoTech_v2_CorrectedSEC.pdf',
        mime_type: 'application/pdf',
        byte_size: 389120, // ~380 KB
        submitted_by: 'std-05000388123',
        submitted_by_name: 'Maria Santos',
        remarks: 'Revision 2: Added SEC Registration CS201912345 and notarization witness signatures.',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
      {
        id: 'rev-moa-1',
        case_id: 'case-example-moa',
        revision_number: 1,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'MOA_InnoTech_v1_Initial.pdf',
        mime_type: 'application/pdf',
        byte_size: 372000,
        submitted_by: 'std-05000388123',
        submitted_by_name: 'Maria Santos',
        remarks: 'Initial MOA draft submission.',
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-moa-1',
        case_id: 'case-example-moa',
        revision_id: 'rev-moa-1',
        author_id: 'adv-001',
        author_name: 'Dr. Sarah Johnson',
        author_role: 'adviser',
        message: 'Maria, page 2 is missing the official SEC registration number of InnoTech Labs, and the notary witness block on page 4 needs two complete names. Please rectify and upload Revision 2.',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'comm-moa-2',
        case_id: 'case-example-moa',
        revision_id: 'rev-moa-2',
        author_id: 'std-05000388123',
        author_name: 'Maria Santos',
        author_role: 'student',
        message: 'Thank you Dr. Johnson! InnoTech HR provided their SEC certificate (CS201912345) and I updated both witness names. Revision 2 is now ready for re-review.',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
    files: [
      {
        id: 'file-moa-1',
        case_id: 'case-example-moa',
        uploaded_by: 'std-05000388123',
        uploaded_by_name: 'Maria Santos',
        purpose: 'supporting_file',
        file_path: '/templates/h5.pdf',
        original_filename: 'InnoTech_SEC_Certificate.pdf',
        mime_type: 'application/pdf',
        byte_size: 512000,
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
    events: [
      {
        id: 'ev-moa-1',
        case_id: 'case-example-moa',
        revision_id: 'rev-moa-1',
        actor_id: 'adv-001',
        actor_name: 'Dr. Sarah Johnson',
        actor_role: 'adviser',
        action: 'request_revision',
        previous_stage: 'submitted_to_adviser',
        next_stage: 'adviser_revision_required',
        remarks: 'Missing SEC registration number and notary witness block names.',
        metadata: {},
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'ev-moa-2',
        case_id: 'case-example-moa',
        revision_id: 'rev-moa-2',
        actor_id: 'std-05000388123',
        actor_name: 'Maria Santos',
        actor_role: 'student',
        action: 'submit_revision',
        previous_stage: 'adviser_revision_required',
        next_stage: 'submitted_to_adviser',
        remarks: 'Uploaded Revision 2 with corrected SEC number and notary block',
        metadata: { revisionNumber: 2 },
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
  },

  // ─── Case 3: Parent Consent Form (Approved) ───
  {
    caseRecord: {
      id: 'case-example-consent',
      student_id: 'std-05000399456',
      student_name: 'Christian Reyes',
      student_course: 'BSCS 401',
      document_type: 'Parent Consent Form (Without Fee)',
      template_id: 'parent_consent_without_fee',
      title: 'Parent Consent Form (Without Fee)',
      review_route: 'adviser_only',
      stage: 'approved',
      assigned_adviser_id: 'adv-001',
      assigned_adviser_name: 'Dr. Sarah Johnson',
      current_revision_id: 'rev-consent-1',
      current_revision_number: 1,
      priority: 'medium',
      created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    revisions: [
      {
        id: 'rev-consent-1',
        case_id: 'case-example-consent',
        revision_number: 1,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'Christian_Reyes_Parent_Consent_Signed.pdf',
        mime_type: 'application/pdf',
        byte_size: 202752, // ~198 KB
        submitted_by: 'std-05000399456',
        submitted_by_name: 'Christian Reyes',
        remarks: 'Signed parent consent form with attached valid government ID of parent Mrs. Elena Reyes.',
        created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-con-1',
        case_id: 'case-example-consent',
        revision_id: 'rev-consent-1',
        author_id: 'adv-001',
        author_name: 'Dr. Sarah Johnson',
        author_role: 'adviser',
        message: 'Parent signature, contact number, and attached government ID successfully verified. All checklist criteria met. Approved and credited.',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
    files: [],
    events: [
      {
        id: 'ev-con-1',
        case_id: 'case-example-consent',
        revision_id: 'rev-consent-1',
        actor_id: 'adv-001',
        actor_name: 'Dr. Sarah Johnson',
        actor_role: 'adviser',
        action: 'adviser_approve',
        previous_stage: 'submitted_to_adviser',
        next_stage: 'approved',
        remarks: 'Consent verified and approved.',
        metadata: {},
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
  },

  // ─── Case 4: DTR Form (Supervisor Approved, Awaiting Adviser) ───
  {
    caseRecord: {
      id: 'case-example-dtr',
      student_id: 'std-05000372499',
      student_name: 'John Dwayne B. Guaniso',
      student_course: 'BSIT 402',
      document_type: 'DTR Form',
      template_id: 'dtr',
      title: 'DTR Form - Week 3 (40 Hours Rendered)',
      review_route: 'supervisor_then_adviser',
      stage: 'supervisor_approved',
      assigned_supervisor_id: 'sup-001',
      assigned_supervisor_name: 'Engr. Paolo Reyes',
      assigned_adviser_id: 'adv-001',
      assigned_adviser_name: 'Dr. Sarah Johnson',
      current_revision_id: 'rev-dtr-1',
      current_revision_number: 1,
      priority: 'medium',
      created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    },
    revisions: [
      {
        id: 'rev-dtr-1',
        case_id: 'case-example-dtr',
        revision_number: 1,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'DTR_Week_3_John_Guaniso_Signed.pdf',
        mime_type: 'application/pdf',
        byte_size: 215040, // ~210 KB
        submitted_by: 'std-05000372499',
        submitted_by_name: 'John Dwayne B. Guaniso',
        remarks: 'Rendered 40.0 hours (8h/day Mon-Fri) in Cloud Systems Development.',
        created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-dtr-1',
        case_id: 'case-example-dtr',
        revision_id: 'rev-dtr-1',
        author_id: 'sup-001',
        author_name: 'Engr. Paolo Reyes',
        author_role: 'supervisor',
        message: 'Timesheet records cross-checked with the facility access badge system. All 40 hours rendered with excellent task completion. Digitally signed and endorsed for adviser accreditation.',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ],
    files: [],
    events: [
      {
        id: 'ev-dtr-1',
        case_id: 'case-example-dtr',
        revision_id: 'rev-dtr-1',
        actor_id: 'sup-001',
        actor_name: 'Engr. Paolo Reyes',
        actor_role: 'supervisor',
        action: 'supervisor_approve',
        previous_stage: 'submitted_to_supervisor',
        next_stage: 'supervisor_approved',
        remarks: 'Timesheet verified against biometric door logs. Digital signature attached.',
        metadata: {},
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ],
  },

  // ─── Case 5: Weekly Journal Reflection (In Review with Supervisor) ───
  {
    caseRecord: {
      id: 'case-example-journal',
      student_id: 'std-05000377889',
      student_name: 'Althea Ramos',
      student_course: 'BSIT 402',
      document_type: 'Journal Template',
      template_id: 'journal',
      title: 'Weekly Journal - Week 3 Reflection',
      review_route: 'supervisor_then_adviser',
      stage: 'submitted_to_supervisor',
      assigned_supervisor_id: 'sup-001',
      assigned_supervisor_name: 'Engr. Paolo Reyes',
      assigned_adviser_id: 'adv-001',
      assigned_adviser_name: 'Dr. Sarah Johnson',
      current_revision_id: 'rev-journal-1',
      current_revision_number: 1,
      priority: 'medium',
      created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    },
    revisions: [
      {
        id: 'rev-journal-1',
        case_id: 'case-example-journal',
        revision_number: 1,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'Weekly_Journal_Week3_Althea_Ramos.pdf',
        mime_type: 'application/pdf',
        byte_size: 158720, // ~155 KB
        submitted_by: 'std-05000377889',
        submitted_by_name: 'Althea Ramos',
        remarks: 'Week 3 reflection detailing database query optimizations and cloud deployment procedures.',
        created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-jour-1',
        case_id: 'case-example-journal',
        revision_id: 'rev-journal-1',
        author_id: 'std-05000377889',
        author_name: 'Althea Ramos',
        author_role: 'student',
        message: 'Engr. Reyes, here is my Week 3 reflective journal entry summarizing my learnings on Docker containers and PostgreSQL query indexing.',
        created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      },
    ],
    files: [],
    events: [
      {
        id: 'ev-jour-1',
        case_id: 'case-example-journal',
        revision_id: 'rev-journal-1',
        actor_id: 'std-05000377889',
        actor_name: 'Althea Ramos',
        actor_role: 'student',
        action: 'submit_revision',
        previous_stage: null,
        next_stage: 'submitted_to_supervisor',
        remarks: 'Journal submitted for supervisor review and remark endorsement.',
        metadata: { revisionNumber: 1 },
        created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      },
    ],
  },

  // ─── Case 6: Student Application Letter (Needs Action / Review) ───
  {
    caseRecord: {
      id: 'case-example-application',
      student_id: 'std-05000366221',
      student_name: 'Mark Anthony Dizon',
      student_course: 'BSIT 402',
      document_type: 'Student Application Letter',
      template_id: 'student_application_letter',
      title: 'Student Application Letter - InnoTech Labs',
      review_route: 'adviser_only',
      stage: 'submitted_to_adviser',
      assigned_adviser_id: 'adv-001',
      assigned_adviser_name: 'Dr. Sarah Johnson',
      current_revision_id: 'rev-app-1',
      current_revision_number: 1,
      priority: 'high',
      created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    },
    revisions: [
      {
        id: 'rev-app-1',
        case_id: 'case-example-application',
        revision_number: 1,
        source_kind: 'editor',
        file_path: '/templates/h5.pdf',
        original_filename: 'Application_Letter_Mark_Dizon.pdf',
        mime_type: 'application/pdf',
        byte_size: 179200, // ~175 KB
        submitted_by: 'std-05000366221',
        submitted_by_name: 'Mark Anthony Dizon',
        remarks: 'Application letter stating core competencies in QA automation and React Native development.',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-app-1',
        case_id: 'case-example-application',
        revision_id: 'rev-app-1',
        author_id: 'std-05000366221',
        author_name: 'Mark Anthony Dizon',
        author_role: 'student',
        message: 'Dr. Johnson, kindly check if my objectives section matches our practicum syllabus requirements before I send it to InnoTech HR.',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ],
    files: [],
    events: [
      {
        id: 'ev-app-1',
        case_id: 'case-example-application',
        revision_id: 'rev-app-1',
        actor_id: 'std-05000366221',
        actor_name: 'Mark Anthony Dizon',
        actor_role: 'student',
        action: 'submit_revision',
        previous_stage: null,
        next_stage: 'submitted_to_adviser',
        remarks: 'Application letter submitted for adviser clearance.',
        metadata: { revisionNumber: 1 },
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

// In-memory state holding dynamic modifications (comments, decisions, revisions) during the session
let sessionExampleCases: ReviewCaseDetails[] = JSON.parse(JSON.stringify(INITIAL_EXAMPLE_CASES));

export function resetExampleCases(): void {
  sessionExampleCases = JSON.parse(JSON.stringify(INITIAL_EXAMPLE_CASES));
}

/**
 * Filter and query example cases based on active portal role, tab filter, and search text.
 */
export function getExampleCases(
  role: Role,
  filter: ReviewInboxFilter = 'all',
  searchQuery: string = ''
): ReviewCase[] {
  let list = sessionExampleCases.map((c) => c.caseRecord);

  // Filter by stage according to role
  if (filter === 'needs_action') {
    if (role === 'student') {
      list = list.filter((c) =>
        ['adviser_revision_required', 'supervisor_revision_required'].includes(c.stage)
      );
    } else if (role === 'supervisor') {
      list = list.filter((c) => c.stage === 'submitted_to_supervisor');
    } else if (role === 'adviser') {
      list = list.filter((c) =>
        ['submitted_to_adviser', 'supervisor_approved'].includes(c.stage)
      );
    } else {
      list = list.filter((c) =>
        ['submitted_to_adviser', 'submitted_to_supervisor', 'supervisor_approved'].includes(c.stage)
      );
    }
  } else if (filter === 'waiting') {
    if (role === 'student') {
      list = list.filter((c) =>
        ['submitted_to_adviser', 'submitted_to_supervisor', 'supervisor_approved'].includes(c.stage)
      );
    } else if (role === 'supervisor') {
      list = list.filter((c) =>
        ['submitted_to_adviser', 'supervisor_approved', 'approved'].includes(c.stage)
      );
    } else if (role === 'adviser') {
      list = list.filter((c) =>
        ['submitted_to_supervisor', 'supervisor_revision_required'].includes(c.stage)
      );
    }
  } else if (filter === 'revision_required') {
    list = list.filter((c) =>
      ['adviser_revision_required', 'supervisor_revision_required'].includes(c.stage)
    );
  } else if (filter === 'approved') {
    if (role === 'supervisor') {
      list = list.filter((c) => ['supervisor_approved', 'approved'].includes(c.stage));
    } else {
      list = list.filter((c) => c.stage === 'approved');
    }
  }

  // Filter by search query
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.document_type.toLowerCase().includes(q) ||
        (c.student_name && c.student_name.toLowerCase().includes(q)) ||
        (c.student_course && c.student_course.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Retrieve deep details for an example case.
 */
export function getExampleCaseDetails(caseId: string): ReviewCaseDetails | null {
  const match = sessionExampleCases.find((c) => c.caseRecord.id === caseId);
  return match ? JSON.parse(JSON.stringify(match)) : null;
}

/**
 * Add a live comment to an example case.
 */
export function addExampleComment(
  caseId: string,
  message: string,
  authorName: string = 'User',
  authorRole: string = 'adviser',
  revisionId?: string
): { commentId: string; authorName: string; createdAt: string } {
  const target = sessionExampleCases.find((c) => c.caseRecord.id === caseId);
  if (!target) throw new Error('Example case not found.');

  const newComment: DocumentComment = {
    id: `comm-${Date.now()}`,
    case_id: caseId,
    revision_id: revisionId || target.caseRecord.current_revision_id,
    author_id: `user-${authorRole}`,
    author_name: authorName,
    author_role: authorRole,
    message,
    created_at: new Date().toISOString(),
  };

  target.comments.push(newComment);
  target.caseRecord.updated_at = new Date().toISOString();

  return {
    commentId: newComment.id,
    authorName: newComment.author_name || 'User',
    createdAt: newComment.created_at,
  };
}

/**
 * Submit an official review decision for an example case.
 */
export function submitExampleDecision(
  caseId: string,
  decision: ReviewDecision,
  remarks: string,
  actorName: string = 'Dr. Sarah Johnson',
  actorRole: string = 'adviser'
): { caseId: string; stage: string; decision: string } {
  const target = sessionExampleCases.find((c) => c.caseRecord.id === caseId);
  if (!target) throw new Error('Example case not found.');

  const previousStage = target.caseRecord.stage;
  let nextStage: ReviewStage = previousStage;

  if (decision === 'adviser_approve') {
    nextStage = 'approved';
    target.caseRecord.closed_at = new Date().toISOString();
  } else if (decision === 'adviser_request_revision') {
    nextStage = 'adviser_revision_required';
  } else if (decision === 'supervisor_approve') {
    nextStage = target.caseRecord.review_route === 'supervisor_then_adviser' ? 'supervisor_approved' : 'approved';
  } else if (decision === 'supervisor_request_revision') {
    nextStage = 'supervisor_revision_required';
  }

  target.caseRecord.stage = nextStage;
  target.caseRecord.updated_at = new Date().toISOString();

  // Audit event
  const newEvent: DocumentReviewEvent = {
    id: `ev-${Date.now()}`,
    case_id: caseId,
    revision_id: target.caseRecord.current_revision_id,
    actor_id: `actor-${actorRole}`,
    actor_name: actorName,
    actor_role: actorRole,
    action: decision,
    previous_stage: previousStage,
    next_stage: nextStage,
    remarks,
    metadata: {},
    created_at: new Date().toISOString(),
  };

  target.events.unshift(newEvent);

  return {
    caseId,
    stage: nextStage,
    decision,
  };
}

/**
 * Upload an example revision for an existing case.
 */
export function uploadExampleRevision(
  caseId: string,
  filename: string,
  remarks?: string,
  studentName: string = 'Student Trainee'
): { caseId: string; revisionId: string; revisionNumber: number; stage: string } {
  const target = sessionExampleCases.find((c) => c.caseRecord.id === caseId);
  if (!target) throw new Error('Example case not found.');

  const newRevisionNumber = (target.caseRecord.current_revision_number || 1) + 1;
  const newRevId = `rev-${caseId}-${newRevisionNumber}`;

  const newRev: DocumentRevision = {
    id: newRevId,
    case_id: caseId,
    revision_number: newRevisionNumber,
    source_kind: 'upload',
    file_path: '/templates/h5.pdf',
    original_filename: filename,
    mime_type: 'application/pdf',
    byte_size: 275000,
    submitted_by: target.caseRecord.student_id,
    submitted_by_name: studentName,
    remarks: remarks || `Uploaded revision ${newRevisionNumber}`,
    created_at: new Date().toISOString(),
  };

  target.revisions.unshift(newRev);
  target.caseRecord.current_revision_id = newRevId;
  target.caseRecord.current_revision_number = newRevisionNumber;
  target.caseRecord.stage = target.caseRecord.review_route === 'supervisor_then_adviser' ? 'submitted_to_supervisor' : 'submitted_to_adviser';
  target.caseRecord.updated_at = new Date().toISOString();

  const newEvent: DocumentReviewEvent = {
    id: `ev-${Date.now()}`,
    case_id: caseId,
    revision_id: newRevId,
    actor_id: target.caseRecord.student_id,
    actor_name: studentName,
    actor_role: 'student',
    action: 'submit_revision',
    previous_stage: 'adviser_revision_required',
    next_stage: target.caseRecord.stage,
    remarks: remarks || `Submitted revision ${newRevisionNumber}`,
    metadata: { revisionNumber: newRevisionNumber },
    created_at: new Date().toISOString(),
  };

  target.events.unshift(newEvent);

  return {
    caseId,
    revisionId: newRevId,
    revisionNumber: newRevisionNumber,
    stage: target.caseRecord.stage,
  };
}
