/**
 * documentReview.ts
 * Strict TypeScript models for the Centralized Document Review Center.
 * Zero unapproved `any` usage.
 */

export type ReviewRoute = 'adviser_only' | 'supervisor_then_adviser';

export type ReviewStage =
  | 'submitted_to_adviser'
  | 'adviser_revision_required'
  | 'submitted_to_supervisor'
  | 'supervisor_revision_required'
  | 'supervisor_approved'
  | 'approved'
  | 'returned';

export type ReviewPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RevisionSourceKind = 'editor' | 'upload' | 'issued_document' | 'signed_return';

export type CaseFilePurpose = 'supporting_file' | 'review_attachment' | 'issued_copy' | 'signed_copy';

export interface ReviewCase {
  id: string;
  student_id: string;
  student_name?: string;
  student_course?: string;
  document_type: string;
  template_id?: string | null;
  title: string;
  review_route: ReviewRoute;
  stage: ReviewStage;
  assigned_supervisor_id?: string | null;
  assigned_supervisor_name?: string | null;
  assigned_adviser_id?: string | null;
  assigned_adviser_name?: string | null;
  current_revision_id?: string | null;
  current_revision_number?: number;
  priority: ReviewPriority;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  unread_comments_count?: number;
}

export interface DocumentRevision {
  id: string;
  case_id: string;
  revision_number: number;
  source_kind: RevisionSourceKind;
  source_draft_id?: string | null;
  legacy_student_document_id?: string | null;
  file_path: string;
  original_filename: string;
  mime_type?: string | null;
  byte_size?: number | null;
  checksum?: string | null;
  submitted_by: string;
  submitted_by_name?: string | null;
  remarks?: string | null;
  created_at: string;
}

export interface DocumentComment {
  id: string;
  case_id: string;
  revision_id?: string | null;
  author_id: string;
  author_name?: string | null;
  author_role?: string | null;
  message: string;
  anchor?: Record<string, unknown> | null;
  parent_comment_id?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
  edited_at?: string | null;
}

export interface DocumentCaseFile {
  id: string;
  case_id: string;
  comment_id?: string | null;
  uploaded_by: string;
  uploaded_by_name?: string | null;
  purpose: CaseFilePurpose;
  file_path: string;
  original_filename: string;
  mime_type?: string | null;
  byte_size?: number | null;
  checksum?: string | null;
  created_at: string;
}

export interface DocumentReviewEvent {
  id: string;
  case_id: string;
  revision_id?: string | null;
  actor_id: string;
  actor_name?: string | null;
  actor_role: string;
  action: string;
  previous_stage?: string | null;
  next_stage?: string | null;
  remarks?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ReviewCaseDetails {
  caseRecord: ReviewCase;
  revisions: DocumentRevision[];
  comments: DocumentComment[];
  files: DocumentCaseFile[];
  events: DocumentReviewEvent[];
}

export type ReviewInboxFilter =
  | 'all'
  | 'needs_action'
  | 'waiting'
  | 'revision_required'
  | 'approved';

export type ReviewDecision =
  | 'supervisor_approve'
  | 'supervisor_request_revision'
  | 'adviser_approve'
  | 'adviser_request_revision';

