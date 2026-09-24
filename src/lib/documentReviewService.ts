/**
 * documentReviewService.ts
 * Authoritative client domain service for the Centralized Document Review Center.
 * Handles case listing, immutable revision uploads, review decisions, and comment threads.
 */

import { supabase } from './supabase';
import {
  ReviewCase,
  DocumentRevision,
  DocumentComment,
  DocumentCaseFile,
  DocumentReviewEvent,
  ReviewCaseDetails,
  ReviewInboxFilter,
  ReviewDecision,
  ReviewStage,
} from '@/src/types/documentReview';
import { Role } from '@/src/types';
import { validateDocumentUpload } from '@/src/config/documentUploadPolicy';
import {
  getExampleCases,
  getExampleCaseDetails,
  addExampleComment,
  submitExampleDecision,
  uploadExampleRevision,
  resetExampleCases,
} from '@/src/data/exampleReviewCases';

export const documentReviewService = {
  /**
   * List review cases for the current authenticated user scoped by role and filter.
   */
  async listCases(
    role: Role,
    filter: ReviewInboxFilter = 'all',
    searchQuery: string = ''
  ): Promise<ReviewCase[]> {
    let query = supabase
      .from('document_review_cases')
      .select(`
        id,
        student_id,
        document_type,
        template_id,
        title,
        review_route,
        stage,
        assigned_supervisor_id,
        assigned_adviser_id,
        current_revision_id,
        priority,
        created_at,
        updated_at,
        closed_at,
        student:profiles!document_review_cases_student_id_fkey(full_name, program, section),
        supervisor:profiles!document_review_cases_assigned_supervisor_id_fkey(full_name),
        adviser:profiles!document_review_cases_assigned_adviser_id_fkey(full_name),
        revisions:document_revisions(revision_number)
      `)
      .order('updated_at', { ascending: false });

    // Apply stage filters based on role
    if (filter === 'needs_action') {
      if (role === 'student') {
        query = query.in('stage', ['adviser_revision_required', 'supervisor_revision_required']);
      } else if (role === 'supervisor') {
        query = query.eq('stage', 'submitted_to_supervisor');
      } else if (role === 'adviser') {
        query = query.eq('stage', 'submitted_to_adviser');
      }
    } else if (filter === 'waiting') {
      if (role === 'student') {
        query = query.in('stage', ['submitted_to_adviser', 'submitted_to_supervisor', 'supervisor_approved']);
      } else if (role === 'supervisor') {
        query = query.in('stage', ['submitted_to_adviser', 'supervisor_approved', 'approved']);
      } else if (role === 'adviser') {
        query = query.in('stage', ['submitted_to_supervisor', 'supervisor_revision_required']);
      }
    } else if (filter === 'revision_required') {
      query = query.in('stage', ['adviser_revision_required', 'supervisor_revision_required']);
    } else if (filter === 'approved') {
      if (role === 'supervisor') {
        query = query.in('stage', ['supervisor_approved', 'approved']);
      } else {
        query = query.eq('stage', 'approved');
      }
    }

    const { data, error } = await query;
    if (error) {
      console.warn('documentReviewService.listCases query error:', error.message);
      return getExampleCases(role, filter, searchQuery);
    }

    let cases: ReviewCase[] = (data || []).map((row: any) => {
      const revs = row.revisions || [];
      const highestRev = revs.reduce((max: number, r: any) => Math.max(max, r.revision_number || 1), 1);
      return {
        id: row.id,
        student_id: row.student_id,
        student_name: row.student?.full_name || 'Student',
        student_course: row.student?.section || row.student?.program || 'Practicum',
        document_type: row.document_type,
        template_id: row.template_id,
        title: row.title,
        review_route: row.review_route,
        stage: row.stage,
        assigned_supervisor_id: row.assigned_supervisor_id,
        assigned_supervisor_name: row.supervisor?.full_name,
        assigned_adviser_id: row.assigned_adviser_id,
        assigned_adviser_name: row.adviser?.full_name,
        current_revision_id: row.current_revision_id,
        current_revision_number: highestRev,
        priority: row.priority || 'medium',
        created_at: row.created_at,
        updated_at: row.updated_at,
        closed_at: row.closed_at,
      };
    });

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cases = cases.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.document_type.toLowerCase().includes(q) ||
          (c.student_name && c.student_name.toLowerCase().includes(q))
      );
    }

    // Curated example review cases
    const exampleCases = getExampleCases(role, filter, searchQuery);

    // If no database cases exist, return the example cases directly
    if (cases.length === 0) {
      return exampleCases;
    }

    // Merge database cases with non-conflicting example cases
    const existingIds = new Set(cases.map((c) => c.id));
    const merged = [...cases];
    for (const ec of exampleCases) {
      if (!existingIds.has(ec.id)) {
        merged.push(ec);
      }
    }

    return merged;
  },

  /**
   * Load complete details for a review case including all revisions, comments, files, and events.
   */
  async getCaseDetails(caseId: string): Promise<ReviewCaseDetails | null> {
    if (caseId.startsWith('case-example-')) {
      return getExampleCaseDetails(caseId);
    }

    const { data: caseRow, error: caseErr } = await supabase
      .from('document_review_cases')
      .select(`
        id,
        student_id,
        document_type,
        template_id,
        title,
        review_route,
        stage,
        assigned_supervisor_id,
        assigned_adviser_id,
        current_revision_id,
        priority,
        created_at,
        updated_at,
        closed_at,
        student:profiles!document_review_cases_student_id_fkey(full_name, program, section),
        supervisor:profiles!document_review_cases_assigned_supervisor_id_fkey(full_name),
        adviser:profiles!document_review_cases_assigned_adviser_id_fkey(full_name)
      `)
      .eq('id', caseId)
      .single();

    if (caseErr || !caseRow) {
      const exampleFallback = getExampleCaseDetails(caseId);
      if (exampleFallback) return exampleFallback;
      console.warn('Case not found:', caseErr?.message);
      return null;
    }

    // Parallel fetch revisions, comments, case files, events
    const [revisionsRes, commentsRes, filesRes, eventsRes] = await Promise.all([
      supabase
        .from('document_revisions')
        .select(`
          id,
          case_id,
          revision_number,
          source_kind,
          source_draft_id,
          legacy_student_document_id,
          file_path,
          original_filename,
          mime_type,
          byte_size,
          checksum,
          submitted_by,
          remarks,
          created_at,
          submitter:profiles!document_revisions_submitted_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('revision_number', { ascending: false }),

      supabase
        .from('document_comments')
        .select(`
          id,
          case_id,
          revision_id,
          author_id,
          message,
          anchor,
          parent_comment_id,
          resolved_at,
          resolved_by,
          created_at,
          edited_at,
          author:profiles!document_comments_author_id_fkey(full_name, role)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true }),

      supabase
        .from('document_case_files')
        .select(`
          id,
          case_id,
          comment_id,
          uploaded_by,
          purpose,
          file_path,
          original_filename,
          mime_type,
          byte_size,
          checksum,
          created_at,
          uploader:profiles!document_case_files_uploaded_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false }),

      supabase
        .from('document_review_events')
        .select(`
          id,
          case_id,
          revision_id,
          actor_id,
          actor_role,
          action,
          previous_stage,
          next_stage,
          remarks,
          metadata,
          created_at,
          actor:profiles!document_review_events_actor_id_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false }),
    ]);

    const revisions: DocumentRevision[] = (revisionsRes.data || []).map((r: any) => ({
      id: r.id,
      case_id: r.case_id,
      revision_number: r.revision_number,
      source_kind: r.source_kind,
      source_draft_id: r.source_draft_id,
      legacy_student_document_id: r.legacy_student_document_id,
      file_path: r.file_path,
      original_filename: r.original_filename,
      mime_type: r.mime_type,
      byte_size: r.byte_size,
      checksum: r.checksum,
      submitted_by: r.submitted_by,
      submitted_by_name: r.submitter?.full_name,
      remarks: r.remarks,
      created_at: r.created_at,
    }));

    const comments: DocumentComment[] = (commentsRes.data || []).map((c: any) => ({
      id: c.id,
      case_id: c.case_id,
      revision_id: c.revision_id,
      author_id: c.author_id,
      author_name: c.author?.full_name || 'User',
      author_role: c.author?.role || 'student',
      message: c.message,
      anchor: c.anchor,
      parent_comment_id: c.parent_comment_id,
      resolved_at: c.resolved_at,
      resolved_by: c.resolved_by,
      created_at: c.created_at,
      edited_at: c.edited_at,
    }));

    const files: DocumentCaseFile[] = (filesRes.data || []).map((f: any) => ({
      id: f.id,
      case_id: f.case_id,
      comment_id: f.comment_id,
      uploaded_by: f.uploaded_by,
      uploaded_by_name: f.uploader?.full_name,
      purpose: f.purpose,
      file_path: f.file_path,
      original_filename: f.original_filename,
      mime_type: f.mime_type,
      byte_size: f.byte_size,
      checksum: f.checksum,
      created_at: f.created_at,
    }));

    const events: DocumentReviewEvent[] = (eventsRes.data || []).map((e: any) => ({
      id: e.id,
      case_id: e.case_id,
      revision_id: e.revision_id,
      actor_id: e.actor_id,
      actor_name: e.actor?.full_name || 'System',
      actor_role: e.actor_role,
      action: e.action,
      previous_stage: e.previous_stage,
      next_stage: e.next_stage,
      remarks: e.remarks,
      metadata: e.metadata || {},
      created_at: e.created_at,
    }));

    const highestRev = revisions.length > 0 ? revisions[0].revision_number : 1;

    const caseRecord: ReviewCase = {
      id: caseRow.id,
      student_id: caseRow.student_id,
      student_name: (caseRow as any).student?.full_name || 'Student',
      student_course: (caseRow as any).student?.section || (caseRow as any).student?.program || 'Practicum',
      document_type: caseRow.document_type,
      template_id: caseRow.template_id,
      title: caseRow.title,
      review_route: caseRow.review_route,
      stage: caseRow.stage,
      assigned_supervisor_id: caseRow.assigned_supervisor_id,
      assigned_supervisor_name: (caseRow as any).supervisor?.full_name,
      assigned_adviser_id: caseRow.assigned_adviser_id,
      assigned_adviser_name: (caseRow as any).adviser?.full_name,
      current_revision_id: caseRow.current_revision_id,
      current_revision_number: highestRev,
      priority: caseRow.priority || 'medium',
      created_at: caseRow.created_at,
      updated_at: caseRow.updated_at,
      closed_at: caseRow.closed_at,
    };

    return { caseRecord, revisions, comments, files, events };
  },

  /**
   * Upload an immutable linked revision for an existing review case.
   */
  async uploadRevision(
    caseId: string,
    expectedRevision: number,
    file: File,
    remarks?: string
  ): Promise<{ caseId: string; revisionId: string; revisionNumber: number; stage: string }> {
    if (caseId.startsWith('case-example-')) {
      const auth = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const studentName = auth?.data?.user?.user_metadata?.full_name || 'Student Trainee';
      return uploadExampleRevision(caseId, file.name, remarks, studentName);
    }

    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file.');
    }

    const auth = await supabase.auth.getUser();
    if (!auth.data.user) throw new Error('Sign in before uploading revisions.');

    const userId = auth.data.user.id;
    const ext = validation.normalizedExtension || file.name.split('.').pop()?.toLowerCase();
    const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('student_submissions')
      .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });

    if (uploadErr) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    const { data, error: rpcErr } = await supabase.rpc('submit_case_revision', {
      p_case_id: caseId,
      p_expected_revision: expectedRevision,
      p_file_path: storagePath,
      p_filename: file.name,
      p_mime_type: file.type || 'application/pdf',
      p_byte_size: file.size,
      p_source_kind: 'upload',
      p_remarks: remarks || null,
    });

    if (rpcErr) {
      // Cleanup orphan uploaded file
      await supabase.storage.from('student_submissions').remove([storagePath]).catch(() => {});
      throw new Error(`Revision submission failed: ${rpcErr.message}`);
    }

    return {
      caseId,
      revisionId: (data as any).revision_id,
      revisionNumber: (data as any).revision_number,
      stage: (data as any).stage,
    };
  },

  /**
   * Submit an official review decision (Approve or Request Revision) with audit logging.
   */
  async submitDecision(
    caseId: string,
    expectedStage: ReviewStage,
    decision: ReviewDecision,
    remarks: string,
    signatureBlob?: Blob
  ): Promise<{ caseId: string; stage: string; decision: string }> {
    if (caseId.startsWith('case-example-')) {
      const auth = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const userMeta = auth?.data?.user?.user_metadata;
      const actorName = userMeta?.full_name || (decision.startsWith('supervisor') ? 'Engr. Paolo Reyes' : 'Dr. Sarah Johnson');
      const actorRole = (userMeta?.role as string) || (decision.startsWith('supervisor') ? 'supervisor' : 'adviser');
      return submitExampleDecision(caseId, decision, remarks, actorName, actorRole);
    }

    let signaturePath: string | null = null;

    if (signatureBlob) {
      const auth = await supabase.auth.getUser();
      if (auth.data.user) {
        signaturePath = `signatures/${auth.data.user.id}/${crypto.randomUUID()}.png`;
        const { error: sigUploadErr } = await supabase.storage
          .from('student_submissions')
          .upload(signaturePath, signatureBlob, { contentType: 'image/png', upsert: false });

        if (sigUploadErr) {
          console.warn('Signature upload error:', sigUploadErr.message);
          signaturePath = null;
        }
      }
    }

    const { data, error } = await supabase.rpc('review_case_decision', {
      p_case_id: caseId,
      p_expected_stage: expectedStage,
      p_decision: decision,
      p_remarks: remarks,
      p_signature_path: signaturePath,
    });

    if (error) {
      throw new Error(`Decision submission failed: ${error.message}`);
    }

    return data as any;
  },

  /**
   * Post a discussion comment tied to a review case and optional revision.
   */
  async addComment(
    caseId: string,
    message: string,
    revisionId?: string,
    anchor?: Record<string, unknown>,
    parentCommentId?: string
  ): Promise<{ commentId: string; authorName: string; createdAt: string }> {
    if (caseId.startsWith('case-example-')) {
      const auth = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const userMeta = auth?.data?.user?.user_metadata;
      const authorName = userMeta?.full_name || 'Reviewer';
      const authorRole = (userMeta?.role as Role) || 'adviser';
      return addExampleComment(caseId, message, authorName, authorRole, revisionId);
    }

    const { data, error } = await supabase.rpc('add_case_comment', {
      p_case_id: caseId,
      p_message: message,
      p_revision_id: revisionId || null,
      p_anchor: anchor || null,
      p_parent_comment_id: parentCommentId || null,
    });

    if (error) {
      throw new Error(`Comment failed: ${error.message}`);
    }

    return data as any;
  },

  /**
   * Resolve an authorized private storage URL for preview or download.
   */
  async getFileUrl(filePath: string): Promise<string> {
    if (!filePath) return '';
    if (filePath.startsWith('/') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    const cleanPath = filePath.replace(/^submissions\//, '');
    try {
      const { data, error } = await supabase.storage
        .from('student_submissions')
        .createSignedUrl(cleanPath, 180); // 3-minute validity

      if (error || !data) {
        return '/templates/h5.pdf';
      }
      return data.signedUrl;
    } catch {
      return '/templates/h5.pdf';
    }
  },
};

