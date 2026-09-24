/**
 * review-workflow.test.ts
 * Behavioral and data integrity tests for the Centralized Document Review Center
 * and Code Quality Remediation Plan.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateDocumentUpload,
  formatDocumentFileSize,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../src/config/documentUploadPolicy';
import {
  getSupervisorSignature,
  saveSupervisorSignature,
  clearSupervisorSignature,
  clearAllSupervisorSignatures,
} from '../src/lib/signatureStorage';

// ─── 1. Unified Upload Policy Tests ──────────────────────────────────────────

describe('Unified Document Upload Policy', () => {
  test('approves valid PDF and DOCX files under 10MB', () => {
    const validPdf = { name: 'WeeklyJournal_Rev1.pdf', size: 2 * 1024 * 1024, type: 'application/pdf' };
    const pdfRes = validateDocumentUpload(validPdf);
    assert.equal(pdfRes.valid, true);
    assert.equal(pdfRes.normalizedExtension, 'pdf');

    const validDocx = { name: 'ApplicationLetter.docx', size: 1.5 * 1024 * 1024 };
    const docxRes = validateDocumentUpload(validDocx);
    assert.equal(docxRes.valid, true);
    assert.equal(docxRes.normalizedExtension, 'docx');
  });

  test('approves valid XLSX, JPG, and PNG documents', () => {
    const validXlsx = { name: 'signed_dtr.xlsx', size: 500 * 1024 };
    assert.equal(validateDocumentUpload(validXlsx).valid, true);

    const validPng = { name: 'receipt.png', size: 800 * 1024 };
    assert.equal(validateDocumentUpload(validPng).valid, true);
  });

  test('strictly rejects legacy .doc with user-friendly guidance', () => {
    const legacyDoc = { name: 'Resume_2026.doc', size: 1024 * 1024 };
    const res = validateDocumentUpload(legacyDoc);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('Legacy Word (.doc) files are not supported'));
  });

  test('strictly rejects files exceeding 10MB', () => {
    const oversized = { name: 'GiantScan.pdf', size: MAX_DOCUMENT_SIZE_BYTES + 1024 };
    const res = validateDocumentUpload(oversized);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('exceeds the maximum allowed size of 10 MB'));
  });

  test('strictly rejects empty files (0 bytes)', () => {
    const empty = { name: 'empty.pdf', size: 0 };
    const res = validateDocumentUpload(empty);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('empty'));
  });

  test('formats file sizes accurately', () => {
    assert.equal(formatDocumentFileSize(1024), '1.0 KB');
    assert.equal(formatDocumentFileSize(5 * 1024 * 1024), '5.0 MB');
    assert.equal(formatDocumentFileSize(0), '0 B');
  });
});

// ─── 2. Supervisor Signature Isolation Tests ─────────────────────────────────

describe('Supervisor Signature User-Scoped Isolation', () => {
  // Mock localStorage for node environment
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] || null,
  };

  test('namespaces signature by supervisor user ID and isolates between supervisors', () => {
    (globalThis as any).window = {};
    (globalThis as any).localStorage = mockLocalStorage;

    const supervisorA_Id = 'sup-uuid-1111';
    const supervisorB_Id = 'sup-uuid-2222';
    const sigA = 'data:image/png;base64,SupervisorA_Signature_Data';
    const sigB = 'data:image/png;base64,SupervisorB_Signature_Data';

    // Save Supervisor A signature
    saveSupervisorSignature(supervisorA_Id, sigA);
    assert.equal(getSupervisorSignature(supervisorA_Id), sigA);

    // Verify Supervisor B has NO signature
    assert.equal(getSupervisorSignature(supervisorB_Id), null);

    // Save Supervisor B signature
    saveSupervisorSignature(supervisorB_Id, sigB);
    assert.equal(getSupervisorSignature(supervisorB_Id), sigB);
    assert.equal(getSupervisorSignature(supervisorA_Id), sigA);

    // Verify raw localStorage contains namespaced keys
    assert.equal(mockLocalStorage.getItem(`supervisor_signature_user_${supervisorA_Id}`), sigA);
    assert.equal(mockLocalStorage.getItem(`supervisor_signature_user_${supervisorB_Id}`), sigB);

    // Clear Supervisor A only
    clearSupervisorSignature(supervisorA_Id);
    assert.equal(getSupervisorSignature(supervisorA_Id), null);
    assert.equal(getSupervisorSignature(supervisorB_Id), sigB);

    // Clear all on global logout
    clearAllSupervisorSignatures();
    assert.equal(getSupervisorSignature(supervisorB_Id), null);
  });
});

// ─── 3. Review Case Schema & RPC Architecture Tests ──────────────────────────

describe('Review Case & Revisions Database Architecture', () => {
  const migrationPath = path.resolve('supabase/migrations/07_document_review_cases.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  test('migration 07 defines all 5 core tables with foreign keys and unique constraints', () => {
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.document_review_cases'), 'Must create document_review_cases');
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.document_revisions'), 'Must create document_revisions');
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.document_comments'), 'Must create document_comments');
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.document_case_files'), 'Must create document_case_files');
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.document_review_events'), 'Must create document_review_events');

    // Unique revision constraint
    assert.ok(
      migrationSql.includes('CONSTRAINT uq_case_revision_number UNIQUE (case_id, revision_number)'),
      'document_revisions must enforce uniqueness on (case_id, revision_number)'
    );
  });

  test('migration 07 enforces RLS and subquery (SELECT auth.uid()) optimizations', () => {
    assert.ok(migrationSql.includes('ALTER TABLE public.document_review_cases ENABLE ROW LEVEL SECURITY'));
    assert.ok(migrationSql.includes('ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY'));
    assert.ok(migrationSql.includes('ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY'));
    assert.ok(migrationSql.includes('ALTER TABLE public.document_case_files ENABLE ROW LEVEL SECURITY'));
    assert.ok(migrationSql.includes('ALTER TABLE public.document_review_events ENABLE ROW LEVEL SECURITY'));

    assert.ok(migrationSql.includes('(SELECT auth.uid())'), 'RLS must use subquery auth.uid()');
  });

  test('migration 07 defines atomic transactional RPCs', () => {
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.create_review_case_from_submission'),
      'Must define create_review_case_from_submission RPC'
    );
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.submit_case_revision'),
      'Must define submit_case_revision RPC'
    );
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.review_case_decision'),
      'Must define review_case_decision RPC'
    );
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.add_case_comment'),
      'Must define add_case_comment RPC'
    );
    assert.ok(
      migrationSql.includes('CREATE OR REPLACE FUNCTION public.backfill_legacy_student_documents_to_cases'),
      'Must define backfill RPC to preserve existing student_documents'
    );
  });

  test('RPC review_case_decision strictly enforces remarks when requesting revisions', () => {
    assert.ok(
      migrationSql.includes("IF p_decision IN ('supervisor_request_revision', 'adviser_request_revision') AND length(trim(COALESCE(p_remarks, ''))) = 0 THEN"),
      'review_case_decision must require remarks for revision requests'
    );
  });

  test('legacy backfill safely handles documents without an owner profile', () => {
    assert.ok(migrationSql.includes('v_student_id uuid;'), 'Backfill must use a typed nullable student ID');
    assert.ok(
      migrationSql.includes('INTO v_student_id, v_supervisor_id, v_adviser_id'),
      'Backfill must populate typed scalar lookup values'
    );
    assert.ok(!migrationSql.includes('v_student := NULL;'), 'Backfill must not dereference an unassigned RECORD');
  });
});

// ─── 4. Review Center UI Wiring & Role Route Tests ───────────────────────────

describe('Review Center UI & Routing Integration', () => {
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  const sidebarSrc = fs.readFileSync(path.resolve('src/components/layout/Sidebar.tsx'), 'utf8');
  const centerSrc = fs.readFileSync(path.resolve('src/components/review/DocumentReviewCenter.tsx'), 'utf8');
  const studentRevSrc = fs.readFileSync(path.resolve('src/pages/student/StudentReviewSession.tsx'), 'utf8');

  test('App.tsx registers Review Center routes across all 4 roles', () => {
    assert.ok(appSrc.includes('<Route path="reviews" element={<StudentReviewCenterPage />} />'), 'Student reviews route registered');
    assert.ok(appSrc.includes('<Route path="reviews" element={<SupervisorReviewCenterPage />} />'), 'Supervisor reviews route registered');
    assert.ok(appSrc.includes('<Route path="reviews" element={<AdviserReviewCenterPage />} />'), 'Adviser reviews route registered');
    assert.ok(appSrc.includes('<Route path="reviews" element={<AdminReviewCenterPage />} />'), 'Admin reviews route registered');
  });

  test('Sidebar.tsx exposes Review Center navigation in all 4 portals', () => {
    assert.ok(sidebarSrc.includes("{ to: '/student/reviews', icon: ClipboardCheckIcon, label: 'Review Center' }"));
    assert.ok(sidebarSrc.includes("{ to: '/supervisor/reviews', icon: ClipboardCheckIcon, label: 'Review Center' }"));
    assert.ok(sidebarSrc.includes("{ to: '/adviser/reviews', icon: ClipboardCheckIcon, label: 'Review Center' }"));
    assert.ok(sidebarSrc.includes("{ to: '/admin/reviews', icon: ClipboardCheckIcon, label: 'Review Center' }"));
  });

  test('DocumentReviewCenter enforces 3-column architecture with revision selector and decisions', () => {
    assert.ok(centerSrc.includes('Review Inbox'), 'Must have inbox column');
    assert.ok(centerSrc.includes('selectedRevisionNumber'), 'Must support version switching');
    assert.ok(centerSrc.includes('handleDecision'), 'Must support role-specific approval decisions');
    assert.ok(centerSrc.includes('Audit Trail'), 'Must display append-only audit events');
  });

  test('StudentReviewSession uses validatePdfFileBytes and submitReviewRevision', () => {
    assert.ok(studentRevSrc.includes('validatePdfFileBytes'), 'StudentReviewSession must validate uploads against PDF policy');
    assert.ok(studentRevSrc.includes('submitReviewRevision'), 'StudentReviewSession must link revisions to cases');
  });

  test('reviewPdfPolicy enforces magic bytes and size thresholds', async () => {
    const { validatePdfFileBytes, validateSourceDocxBytes, REVIEW_PDF_POLICY } = await import('../src/config/reviewPdfPolicy');
    assert.equal(REVIEW_PDF_POLICY.maxSizeBytes, 15 * 1024 * 1024);
    assert.equal(REVIEW_PDF_POLICY.maxSourceSizeBytes, 20 * 1024 * 1024);

    // Valid PDF blob
    const validPdfBlob = new Blob(['%PDF-1.7 institutional thesis content'], { type: 'application/pdf' });
    const pdfValidRes = await validatePdfFileBytes(validPdfBlob);
    assert.equal(pdfValidRes.valid, true);

    // Invalid PDF (e.g. text/html masquerading as PDF)
    const invalidPdfBlob = new Blob(['<html><body>not a pdf</body></html>'], { type: 'application/pdf' });
    const pdfInvalidRes = await validatePdfFileBytes(invalidPdfBlob);
    assert.equal(pdfInvalidRes.valid, false);
    assert.ok(pdfInvalidRes.error?.includes('not a valid PDF document'));

    // Valid DOCX (ZIP header: PK\x03\x04)
    const docxHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const validDocxBlob = new Blob([docxHeader]);
    const docxValidRes = await validateSourceDocxBytes(validDocxBlob);
    assert.equal(docxValidRes.valid, true);

    // Invalid DOCX
    const invalidDocxBlob = new Blob(['plain text not docx']);
    const docxInvalidRes = await validateSourceDocxBytes(invalidDocxBlob);
    assert.equal(docxInvalidRes.valid, false);
  });

  test('Migration 09 defines review_requirement_definitions catalog and idempotent RPCs', () => {
    const mig09Src = fs.readFileSync(path.resolve('supabase/migrations/09_student_pdf_submission_workflow.sql'), 'utf8');
    assert.ok(mig09Src.includes('CREATE TABLE IF NOT EXISTS public.review_requirement_definitions'), 'Must create requirement catalog');
    assert.ok(mig09Src.includes('CREATE OR REPLACE FUNCTION public.create_review_case_from_submission'), 'Must create submission RPC');
    assert.ok(mig09Src.includes('CREATE OR REPLACE FUNCTION public.submit_case_revision'), 'Must create revision RPC');
    assert.ok(mig09Src.includes('adviser_only'), 'Must support adviser_only routing');
    assert.ok(mig09Src.includes('supervisor_then_adviser'), 'Must support supervisor_then_adviser routing');
  });

  test('Backend routes register review submissions and AI check endpoints', () => {
    const serverSrc = fs.readFileSync(path.resolve('backend/server.ts'), 'utf8');
    assert.ok(serverSrc.includes('reviewSubmissionsRouter'), 'Server must mount reviewSubmissionsRouter');

    const routeSrc = fs.readFileSync(path.resolve('backend/routes/reviewSubmissions.ts'), 'utf8');
    assert.ok(routeSrc.includes("'/review-submissions'"), 'Must expose POST /review-submissions');
    assert.ok(routeSrc.includes("'/review-cases/:caseId/revisions'"), 'Must expose POST /review-cases/:caseId/revisions');
    assert.ok(routeSrc.includes("'/editor/ai-check'"), 'Must expose POST /editor/ai-check');
  });

  test('reviewSubmissionService falls back to authoritative INSTITUTIONAL_REQUIREMENTS if catalog table is missing', async () => {
    const { fetchRequirementDefinitions, FALLBACK_REQUIREMENT_DEFINITIONS } = await import('../src/lib/reviewSubmissionService');
    assert.ok(Array.isArray(FALLBACK_REQUIREMENT_DEFINITIONS));
    assert.equal(FALLBACK_REQUIREMENT_DEFINITIONS.length, 11);
    const reqs = await fetchRequirementDefinitions();
    assert.ok(Array.isArray(reqs));
    assert.equal(reqs.length, 11);
  });

  test('StudentDocumentRepository analytics supports drafts of templates made and toggles', () => {
    const repoSrc = fs.readFileSync(path.resolve('src/pages/student/StudentDocumentRepository.tsx'), 'utf8');
    assert.ok(repoSrc.includes('draftsAndMadeItems'), 'Must compute draftsAndMadeItems');
    assert.ok(repoSrc.includes('Document Performance & Score') || repoSrc.includes('Document Deliverables'), 'Must render analytics heading');
  });
});

describe('Centralized Review Center Example Cases', () => {
  test('supplies 6 curated institutional review cases across All, In Review, Revisions, and Approved', async () => {
    const { getExampleCases, getExampleCaseDetails, resetExampleCases } = await import('../src/data/exampleReviewCases');
    resetExampleCases();

    const cases = getExampleCases('adviser', 'all');
    assert.equal(cases.length, 6, 'Should contain 6 example review cases');

    // Verify key institutional templates are represented
    const docTypes = cases.map((c) => c.document_type);
    assert.ok(docTypes.includes('Endorsement Letter'));
    assert.ok(docTypes.includes('MOA Template'));
    assert.ok(docTypes.includes('Parent Consent Form (Without Fee)'));
    assert.ok(docTypes.includes('DTR Form'));
    assert.ok(docTypes.includes('Journal Template') || docTypes.includes('Weekly Journal'));
    assert.ok(docTypes.includes('Student Application Letter'));

    // Check deep details for a case
    const details = getExampleCaseDetails('case-example-endorsement');
    assert.ok(details, 'Should retrieve full case details');
    assert.equal(details.revisions.length, 1);
    assert.equal(details.comments.length, 2);
    assert.ok(details.events.length >= 1);
  });

  test('supports interactive comments, decisions, and revisions on example cases', async () => {
    const {
      addExampleComment,
      submitExampleDecision,
      uploadExampleRevision,
      getExampleCaseDetails,
      resetExampleCases,
    } = await import('../src/data/exampleReviewCases');
    resetExampleCases();

    // 1. Post a comment
    const commRes = addExampleComment('case-example-endorsement', 'Verified host company profile.', 'Dr. Sarah Johnson', 'adviser');
    assert.ok(commRes.commentId);
    let details = getExampleCaseDetails('case-example-endorsement');
    assert.equal(details?.comments.length, 3);

    // 2. Submit an approval decision
    const decRes = submitExampleDecision('case-example-endorsement', 'adviser_approve', 'Formal endorsement approved.', 'Dr. Sarah Johnson', 'adviser');
    assert.equal(decRes.stage, 'approved');
    details = getExampleCaseDetails('case-example-endorsement');
    assert.equal(details?.caseRecord.stage, 'approved');

    // 3. Upload a revision to an existing case
    const revRes = uploadExampleRevision('case-example-moa', 'MOA_Revision_2.pdf', 'Addressed legal clause feedback');
    assert.equal(revRes.revisionNumber, 3);
    details = getExampleCaseDetails('case-example-moa');
    assert.equal(details?.caseRecord.current_revision_number, 3);
  });
});



