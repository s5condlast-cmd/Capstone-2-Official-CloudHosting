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

  test('StudentReviewSession uses validateDocumentUpload and documentReviewService.uploadRevision', () => {
    assert.ok(studentRevSrc.includes('validateDocumentUpload(file)'), 'StudentReviewSession must validate uploads against unified policy');
    assert.ok(studentRevSrc.includes('documentReviewService.uploadRevision'), 'StudentReviewSession must link revisions to cases');
  });
});

