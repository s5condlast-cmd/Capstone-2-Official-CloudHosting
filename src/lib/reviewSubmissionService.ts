import { supabase } from './supabase';
import { apiFetch } from './api';
import { validatePdfFileBytes, validateSourceDocxBytes, REVIEW_PDF_POLICY } from '../config/reviewPdfPolicy';
import { INSTITUTIONAL_REQUIREMENTS } from '../config/requirementRegistry';

export interface ReviewRequirementDefinition {
  id: string;
  title: string;
  phase: 'before_ojt' | 'in_ojt' | 'final';
  template_id: string | null;
  review_route: 'adviser_only' | 'supervisor_then_adviser';
  accepts_editor_draft: boolean;
  active: boolean;
}

export const FALLBACK_REQUIREMENT_DEFINITIONS: ReviewRequirementDefinition[] = INSTITUTIONAL_REQUIREMENTS.map((req) => ({
  id: req.id,
  title: req.name,
  phase: req.phase,
  template_id: req.id,
  review_route: (
    req.id === 'weekly-journal' ||
    req.id === 'dtr-form' ||
    req.id === 'training-plan-form' ||
    req.id === 'performance-appraisal'
  ) ? 'supervisor_then_adviser' : 'adviser_only',
  accepts_editor_draft: req.editable,
  active: true,
}));

let isRemoteCatalogUnavailable = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined' && window.sessionStorage.getItem('review_req_defs_unavailable') === 'true';

export interface SubmitReviewDocumentParams {
  requirementId: string;
  title?: string;
  pdfFile: File | Blob;
  filename?: string;
  sourceDocxFile?: File | Blob;
  sourceFilename?: string;
  draftId?: string;
  expectedDraftRevision?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  remarks?: string;
  clientSubmissionId?: string;
}

export interface SubmitReviewResult {
  success: boolean;
  case_id: string;
  revision_id: string;
  revision_number: number;
  stage: string;
  idempotent?: boolean;
}

export interface SubmitReviewRevisionParams {
  caseId: string;
  expectedRevision?: number;
  pdfFile: File | Blob;
  filename?: string;
  remarks?: string;
  sourceKind?: 'upload' | 'editor';
}

export interface SubmitReviewRevisionResult {
  success: boolean;
  case_id: string;
  revision_id: string;
  revision_number: number;
  stage: string;
}

/**
 * Fetch authoritative review requirement definitions from the database catalog.
 * Gracefully falls back to the institutional requirement registry if the catalog
 * table is unavailable in Supabase.
 */
export async function fetchRequirementDefinitions(): Promise<ReviewRequirementDefinition[]> {
  if (isRemoteCatalogUnavailable) {
    return FALLBACK_REQUIREMENT_DEFINITIONS;
  }

  try {
    const { data, error } = await supabase
      .from('review_requirement_definitions')
      .select('id, title, phase, template_id, review_route, accepts_editor_draft, active')
      .eq('active', true)
      .order('id', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        isRemoteCatalogUnavailable = true;
        try {
          if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
            window.sessionStorage.setItem('review_req_defs_unavailable', 'true');
          }
        } catch {}
      }
      console.warn('[reviewSubmissionService] Using local institutional requirements catalog fallback:', error.message || error);
      return FALLBACK_REQUIREMENT_DEFINITIONS;
    }

    if (data && data.length > 0) {
      return data as ReviewRequirementDefinition[];
    }

    return FALLBACK_REQUIREMENT_DEFINITIONS;
  } catch (err) {
    isRemoteCatalogUnavailable = true;
    console.warn('[reviewSubmissionService] Failed to query review_requirement_definitions, using fallback:', err);
    return FALLBACK_REQUIREMENT_DEFINITIONS;
  }
}

/**
 * Submits a validated PDF document (with optional source DOCX) to initiate a review case.
 */
export async function submitReviewDocument(params: SubmitReviewDocumentParams): Promise<SubmitReviewResult> {
  // 1. Client-side PDF Validation
  const pdfValidation = await validatePdfFileBytes(params.pdfFile);
  if (!pdfValidation.valid) {
    throw new Error(pdfValidation.error || 'The selected file is not a valid PDF.');
  }

  // 2. Validate optional source DOCX
  if (params.sourceDocxFile) {
    const docxValidation = await validateSourceDocxBytes(params.sourceDocxFile);
    if (!docxValidation.valid) {
      throw new Error(docxValidation.error || 'Invalid source Word (.docx) document.');
    }
  }

  // 3. Build multipart form data
  const formData = new FormData();
  const pdfName = params.filename || (params.pdfFile instanceof File ? params.pdfFile.name : 'document.pdf');
  formData.append('pdf_file', params.pdfFile, pdfName);

  if (params.sourceDocxFile) {
    const sourceName = params.sourceFilename || (params.sourceDocxFile instanceof File ? params.sourceDocxFile.name : 'source.docx');
    formData.append('source_file', params.sourceDocxFile, sourceName);
  }

  formData.append('requirement_id', params.requirementId);
  if (params.title) formData.append('title', params.title);
  if (params.draftId) formData.append('draft_id', params.draftId);
  if (params.expectedDraftRevision !== undefined) {
    formData.append('expected_draft_revision', String(params.expectedDraftRevision));
  }
  if (params.priority) formData.append('priority', params.priority);
  if (params.remarks) formData.append('remarks', params.remarks);
  if (params.clientSubmissionId) formData.append('client_submission_id', params.clientSubmissionId);

  // 4. Send request to trusted backend API
  const response = await apiFetch('/api/review-submissions', {
    method: 'POST',
    body: formData,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `Submission failed with status ${response.status}.`);
  }

  return body as SubmitReviewResult;
}

/**
 * Submits an iterative PDF revision for a case awaiting changes.
 */
export async function submitReviewRevision(params: SubmitReviewRevisionParams): Promise<SubmitReviewRevisionResult> {
  if (params.caseId.startsWith('case-example-')) {
    const { uploadExampleRevision } = await import('@/src/data/exampleReviewCases');
    const filename = params.filename || (params.pdfFile instanceof File ? params.pdfFile.name : 'revision.pdf');
    const res = uploadExampleRevision(params.caseId, filename, params.remarks);
    return {
      success: true,
      case_id: res.caseId,
      revision_id: res.revisionId,
      revision_number: res.revisionNumber,
      stage: res.stage,
    };
  }

  const pdfValidation = await validatePdfFileBytes(params.pdfFile);
  if (!pdfValidation.valid) {
    throw new Error(pdfValidation.error || 'The selected file is not a valid PDF.');
  }

  const formData = new FormData();
  const pdfName = params.filename || (params.pdfFile instanceof File ? params.pdfFile.name : 'revision.pdf');
  formData.append('pdf_file', params.pdfFile, pdfName);

  if (params.expectedRevision !== undefined && params.expectedRevision !== null) {
    formData.append('expected_revision', String(params.expectedRevision));
  }
  if (params.remarks) formData.append('remarks', params.remarks);
  if (params.sourceKind) formData.append('source_kind', params.sourceKind);

  const response = await apiFetch(`/api/review-cases/${encodeURIComponent(params.caseId)}/revisions`, {
    method: 'POST',
    body: formData,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `Revision submission failed with status ${response.status}.`);
  }

  return body as SubmitReviewRevisionResult;
}

