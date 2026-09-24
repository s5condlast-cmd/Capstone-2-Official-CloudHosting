-- 09_student_pdf_submission_workflow.sql
-- Hardened Student PDF Submission & Centralized Review Workflow.
-- Normalizes reviewer UUIDs, creates review_requirement_definitions catalog,
-- links editor drafts to review cases, enforces PDF-only constraints for new revisions,
-- and provides transactional RPCs for initial submissions and revision iterations.
-- Idempotent. Requires migrations 01-08.

BEGIN;

-- ============================================================
-- 1. Normalize reviewer assignments on profiles
-- ============================================================

-- Drop dependent RLS policy that references profiles.adviser_id and supervisor_id
DROP POLICY IF EXISTS doc_cases_select_policy ON public.document_review_cases;

DO $$
BEGIN
  -- Convert adviser_id to uuid if text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'adviser_id' AND data_type = 'text'
  ) THEN
    UPDATE public.profiles
    SET adviser_id = NULL
    WHERE adviser_id IS NOT NULL AND adviser_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    ALTER TABLE public.profiles
      ALTER COLUMN adviser_id TYPE uuid USING (NULLIF(adviser_id, '')::uuid);
  END IF;

  -- Convert supervisor_id to uuid if text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'supervisor_id' AND data_type = 'text'
  ) THEN
    UPDATE public.profiles
    SET supervisor_id = NULL
    WHERE supervisor_id IS NOT NULL AND supervisor_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    ALTER TABLE public.profiles
      ALTER COLUMN supervisor_id TYPE uuid USING (NULLIF(supervisor_id, '')::uuid);
  END IF;
END $$;

-- Add foreign key constraints on profiles.adviser_id and supervisor_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_adviser_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_adviser_id_fkey
      FOREIGN KEY (adviser_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_supervisor_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_supervisor_id_fkey
      FOREIGN KEY (supervisor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update can_access_student function to compare UUIDs directly without text casts
CREATE OR REPLACE FUNCTION public.can_access_student(student uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.portal_role() = 'admin' OR (
    public.portal_role() IS NOT NULL AND (student = (SELECT auth.uid()) OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = student AND (
        (public.portal_role() = 'adviser' AND p.adviser_id = (SELECT auth.uid()))
        OR (public.portal_role() = 'supervisor' AND p.supervisor_id = (SELECT auth.uid()))
      )
    ))
  );
$$;

-- Recreate doc_cases_select_policy now that supervisor_id and adviser_id are uuid
CREATE POLICY doc_cases_select_policy ON public.document_review_cases
  FOR SELECT TO authenticated
  USING (
    public.portal_role() = 'admin'
    OR (public.portal_role() = 'student' AND student_id = (SELECT auth.uid()))
    OR (public.portal_role() = 'supervisor' AND (
      assigned_supervisor_id = (SELECT auth.uid())
      OR student_id IN (
        SELECT id FROM public.profiles WHERE supervisor_id = (SELECT auth.uid())
      )
    ))
    OR (public.portal_role() = 'adviser' AND (
      assigned_adviser_id = (SELECT auth.uid())
      OR student_id IN (
        SELECT id FROM public.profiles WHERE adviser_id = (SELECT auth.uid())
      )
    ))
  );

-- ============================================================
-- 2. Authoritative Requirement Catalog: review_requirement_definitions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_requirement_definitions (
  id text PRIMARY KEY,
  title text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('before_ojt', 'in_ojt', 'final')),
  template_id text,
  review_route text NOT NULL CHECK (review_route IN ('adviser_only', 'supervisor_then_adviser')),
  accepts_editor_draft boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_requirement_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_req_defs_read_all ON public.review_requirement_definitions;
CREATE POLICY review_req_defs_read_all ON public.review_requirement_definitions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS review_req_defs_admin_mutation ON public.review_requirement_definitions;
CREATE POLICY review_req_defs_admin_mutation ON public.review_requirement_definitions
  FOR ALL TO authenticated
  USING (public.portal_role() = 'admin')
  WITH CHECK (public.portal_role() = 'admin');

-- Seed the 11 institutional requirements
INSERT INTO public.review_requirement_definitions (id, title, phase, template_id, review_route, accepts_editor_draft, active)
VALUES
  ('student-application-letter', '01 Student Application Letter - ARG', 'before_ojt', 'student-application-letter', 'adviser_only', true, true),
  ('parent-consent-with-fee', '02 Parent Consent Form (With Fee) - ARG', 'before_ojt', 'parent-consent-with-fee', 'adviser_only', true, true),
  ('student-consent-with-fee', '03 Student Consent Form - ARG', 'before_ojt', 'student-consent-with-fee', 'adviser_only', true, true),
  ('moa-template', '04 Memorandum of Agreement (MOA) - ARG', 'before_ojt', 'moa-template', 'adviser_only', true, true),
  ('endorsement-letter', '05 Endorsement Letter - ARG', 'before_ojt', 'endorsement-letter', 'adviser_only', true, true),
  ('proposal-letter', '06 Proposal Letter - ARG', 'before_ojt', 'proposal-letter', 'adviser_only', true, true),
  ('weekly-journal', '07 Weekly OJT Journal - ARG', 'in_ojt', 'weekly-journal', 'supervisor_then_adviser', true, true),
  ('dtr-form', '08 Daily Time Record (DTR) - ARG', 'in_ojt', 'dtr-form', 'supervisor_then_adviser', false, true),
  ('training-plan-form', '09 Training Plan Form - ARG', 'in_ojt', 'training-plan-form', 'supervisor_then_adviser', true, true),
  ('integration-paper', '10 Final Integration Paper - ARG', 'final', 'integration-paper', 'adviser_only', true, true),
  ('performance-appraisal', '11 Performance Appraisal Form - ARG', 'final', 'performance-appraisal', 'supervisor_then_adviser', false, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  phase = EXCLUDED.phase,
  template_id = EXCLUDED.template_id,
  review_route = EXCLUDED.review_route,
  accepts_editor_draft = EXCLUDED.accepts_editor_draft,
  active = EXCLUDED.active,
  updated_at = now();

-- ============================================================
-- 3. Link editor_drafts to document_review_cases
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'editor_drafts' AND column_name = 'review_case_id'
  ) THEN
    ALTER TABLE public.editor_drafts
      ADD COLUMN review_case_id uuid REFERENCES public.document_review_cases(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'editor_drafts' AND column_name = 'submitted_revision_id'
  ) THEN
    ALTER TABLE public.editor_drafts
      ADD COLUMN submitted_revision_id uuid REFERENCES public.document_revisions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS editor_drafts_review_case_idx
  ON public.editor_drafts(review_case_id) WHERE review_case_id IS NOT NULL;

-- ============================================================
-- 4. Idempotency & PDF constraints on cases, revisions & case files
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_review_cases' AND column_name = 'client_submission_id'
  ) THEN
    ALTER TABLE public.document_review_cases
      ADD COLUMN client_submission_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_cases_client_submission'
  ) THEN
    ALTER TABLE public.document_review_cases
      ADD CONSTRAINT uq_cases_client_submission
      UNIQUE (student_id, client_submission_id);
  END IF;

  -- Add source_document to document_case_files.purpose if not present
  ALTER TABLE public.document_case_files
    DROP CONSTRAINT IF EXISTS document_case_files_purpose_check;
  ALTER TABLE public.document_case_files
    ADD CONSTRAINT document_case_files_purpose_check
    CHECK (purpose IN ('reviewer_attachment', 'student_supporting', 'annotated_markup', 'source_document'));

  -- Add checksum to document_case_files if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_case_files' AND column_name = 'checksum'
  ) THEN
    ALTER TABLE public.document_case_files
      ADD COLUMN checksum text;
  END IF;
END $$;

-- Check constraint on document_revisions for non-legacy rows: must be PDF
DO $$
BEGIN
  ALTER TABLE public.document_revisions
    DROP CONSTRAINT IF EXISTS chk_doc_revisions_pdf_mime;
  ALTER TABLE public.document_revisions
    ADD CONSTRAINT chk_doc_revisions_pdf_mime
    CHECK (
      legacy_student_document_id IS NOT NULL
      OR (
        mime_type = 'application/pdf'
        AND lower(file_path) LIKE '%.pdf'
      )
    );
END $$;

-- ============================================================
-- 5. RPC: create_review_case_from_submission (Transactional & Idempotent)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_review_case_from_submission(
  p_client_submission_id uuid,
  p_requirement_id text,
  p_title text,
  p_file_path text,
  p_filename text,
  p_mime_type text DEFAULT 'application/pdf',
  p_byte_size bigint DEFAULT 0,
  p_checksum text DEFAULT NULL,
  p_source_kind text DEFAULT 'upload',
  p_draft_id uuid DEFAULT NULL,
  p_expected_draft_revision integer DEFAULT NULL,
  p_source_file_path text DEFAULT NULL,
  p_source_filename text DEFAULT NULL,
  p_source_mime_type text DEFAULT NULL,
  p_source_byte_size bigint DEFAULT NULL,
  p_source_checksum text DEFAULT NULL,
  p_priority text DEFAULT 'medium',
  p_remarks text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_student_profile record;
  v_req record;
  v_existing_case record;
  v_route text;
  v_initial_stage text;
  v_new_case_id uuid;
  v_new_rev_id uuid;
  v_source_file_id uuid;
  v_draft record;
BEGIN
  v_caller_id := (SELECT auth.uid());
  v_caller_role := public.portal_role();

  IF v_caller_role <> 'student' THEN
    RAISE EXCEPTION 'Only students may submit review documents.';
  END IF;

  -- 1. Idempotency Check
  IF p_client_submission_id IS NOT NULL THEN
    SELECT * INTO v_existing_case
    FROM public.document_review_cases
    WHERE student_id = v_caller_id AND client_submission_id = p_client_submission_id;

    IF v_existing_case.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'case_id', v_existing_case.id,
        'revision_id', v_existing_case.current_revision_id,
        'revision_number', 1,
        'stage', v_existing_case.stage,
        'idempotent', true
      );
    END IF;
  END IF;

  -- 2. Validate PDF properties
  IF p_mime_type <> 'application/pdf' OR lower(p_file_path) NOT LIKE '%.pdf' THEN
    RAISE EXCEPTION 'Review revisions must be valid PDF documents.';
  END IF;

  -- 3. Resolve requirement definition & review route
  SELECT * INTO v_req
  FROM public.review_requirement_definitions
  WHERE id = p_requirement_id AND active = true;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive requirement ID: %.', p_requirement_id;
  END IF;

  v_route := v_req.review_route;

  -- 4. Load student profile & reviewer assignments
  SELECT id, adviser_id, supervisor_id, full_name, section, program
  INTO v_student_profile
  FROM public.profiles
  WHERE id = v_caller_id;

  IF v_student_profile.id IS NULL THEN
    RAISE EXCEPTION 'Student profile not found.';
  END IF;

  IF v_student_profile.adviser_id IS NULL THEN
    RAISE EXCEPTION 'No adviser is assigned to your practicum profile. Contact your coordinator before submitting.';
  END IF;

  IF v_route = 'supervisor_then_adviser' AND v_student_profile.supervisor_id IS NULL THEN
    RAISE EXCEPTION 'This requirement requires supervisor review first, but no supervisor is assigned to your profile.';
  END IF;

  -- 5. Determine initial stage
  IF v_route = 'supervisor_then_adviser' THEN
    v_initial_stage := 'submitted_to_supervisor';
  ELSE
    v_initial_stage := 'submitted_to_adviser';
  END IF;

  -- 6. Validate & lock draft if provided
  IF p_draft_id IS NOT NULL THEN
    SELECT * INTO v_draft
    FROM public.editor_drafts
    WHERE id = p_draft_id AND student_id = v_caller_id AND deleted_at IS NULL
    FOR UPDATE;

    IF v_draft.id IS NULL THEN
      RAISE EXCEPTION 'Draft not found or access denied.';
    END IF;

    IF v_draft.status = 'locked' THEN
      RAISE EXCEPTION 'This draft is already locked and submitted.';
    END IF;

    IF p_expected_draft_revision IS NOT NULL AND v_draft.revision <> p_expected_draft_revision THEN
      RAISE EXCEPTION 'Draft revision mismatch: expected % but current is %.', p_expected_draft_revision, v_draft.revision;
    END IF;
  END IF;

  -- 7. Create Case
  INSERT INTO public.document_review_cases (
    student_id,
    document_type,
    template_id,
    title,
    review_route,
    stage,
    assigned_supervisor_id,
    assigned_adviser_id,
    priority,
    client_submission_id
  ) VALUES (
    v_caller_id,
    v_req.title,
    v_req.template_id,
    COALESCE(p_title, v_req.title),
    v_route,
    v_initial_stage,
    v_student_profile.supervisor_id,
    v_student_profile.adviser_id,
    COALESCE(p_priority, 'medium'),
    p_client_submission_id
  ) RETURNING id INTO v_new_case_id;

  -- 8. Create Revision 1
  INSERT INTO public.document_revisions (
    case_id,
    revision_number,
    source_kind,
    source_draft_id,
    file_path,
    original_filename,
    mime_type,
    byte_size,
    checksum,
    submitted_by,
    remarks
  ) VALUES (
    v_new_case_id,
    1,
    COALESCE(p_source_kind, 'upload'),
    p_draft_id,
    p_file_path,
    p_filename,
    p_mime_type,
    p_byte_size,
    p_checksum,
    v_caller_id,
    p_remarks
  ) RETURNING id INTO v_new_rev_id;

  -- Update case current_revision_id pointer
  UPDATE public.document_review_cases
  SET current_revision_id = v_new_rev_id
  WHERE id = v_new_case_id;

  -- 9. Optional source document attachment
  IF p_source_file_path IS NOT NULL AND p_source_filename IS NOT NULL THEN
    INSERT INTO public.document_case_files (
      case_id,
      revision_id,
      uploaded_by,
      file_path,
      original_filename,
      mime_type,
      byte_size,
      checksum,
      purpose,
      is_archived
    ) VALUES (
      v_new_case_id,
      v_new_rev_id,
      v_caller_id,
      p_source_file_path,
      p_source_filename,
      COALESCE(p_source_mime_type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      p_source_byte_size,
      p_source_checksum,
      'source_document',
      false
    ) RETURNING id INTO v_source_file_id;
  END IF;

  -- 10. Lock draft and link case
  IF p_draft_id IS NOT NULL THEN
    UPDATE public.editor_drafts
    SET status = 'locked',
        locked_at = now(),
        review_case_id = v_new_case_id,
        submitted_revision_id = v_new_rev_id,
        updated_at = now()
    WHERE id = p_draft_id;
  END IF;

  -- 11. Create Audit Event
  INSERT INTO public.document_review_events (
    case_id,
    revision_id,
    actor_id,
    actor_role,
    action,
    previous_stage,
    next_stage,
    remarks,
    metadata
  ) VALUES (
    v_new_case_id,
    v_new_rev_id,
    v_caller_id,
    'student',
    'submit',
    NULL,
    v_initial_stage,
    COALESCE(p_remarks, 'Initial PDF submission (Revision 1)'),
    jsonb_build_object(
      'filename', p_filename,
      'requirement_id', p_requirement_id,
      'source_kind', p_source_kind,
      'draft_id', p_draft_id,
      'has_source_docx', (p_source_file_path IS NOT NULL)
    )
  );

  RETURN jsonb_build_object(
    'case_id', v_new_case_id,
    'revision_id', v_new_rev_id,
    'revision_number', 1,
    'stage', v_initial_stage,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_review_case_from_submission(uuid,text,text,text,text,text,bigint,text,text,uuid,integer,text,text,text,bigint,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_review_case_from_submission(uuid,text,text,text,text,text,bigint,text,text,uuid,integer,text,text,text,bigint,text,text,text) TO authenticated;

-- ============================================================
-- 6. RPC: submit_case_revision (Hardened PDF Revision Submission)
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_case_revision(
  p_case_id uuid,
  p_expected_revision integer DEFAULT NULL,
  p_file_path text DEFAULT '',
  p_filename text DEFAULT '',
  p_mime_type text DEFAULT 'application/pdf',
  p_byte_size bigint DEFAULT 0,
  p_checksum text DEFAULT NULL,
  p_source_kind text DEFAULT 'upload',
  p_remarks text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_case record;
  v_new_rev_num integer;
  v_new_rev_id uuid;
  v_next_stage text;
BEGIN
  v_caller_id := (SELECT auth.uid());
  v_caller_role := public.portal_role();

  IF v_caller_role <> 'student' THEN
    RAISE EXCEPTION 'Only students may submit document revisions.';
  END IF;

  SELECT * INTO v_case
  FROM public.document_review_cases
  WHERE id = p_case_id AND student_id = v_caller_id;

  IF v_case.id IS NULL THEN
    RAISE EXCEPTION 'Review case not found or access denied.';
  END IF;

  -- Ensure stage allows revisions
  IF v_case.stage NOT IN ('adviser_revision_required', 'supervisor_revision_required') THEN
    RAISE EXCEPTION 'Revisions can only be submitted when revisions are requested. Current stage: %.', v_case.stage;
  END IF;

  -- Validate PDF properties
  IF p_mime_type <> 'application/pdf' OR lower(p_file_path) NOT LIKE '%.pdf' THEN
    RAISE EXCEPTION 'Review revisions must be valid PDF documents.';
  END IF;

  -- OCC check on revision number
  SELECT COALESCE(MAX(revision_number), 0) INTO v_new_rev_num
  FROM public.document_revisions
  WHERE case_id = p_case_id;

  IF p_expected_revision IS NOT NULL AND v_new_rev_num <> p_expected_revision THEN
    RAISE EXCEPTION 'Revision conflict: expected revision % but current is %.', p_expected_revision, v_new_rev_num;
  END IF;

  v_new_rev_num := v_new_rev_num + 1;

  -- Restart stage from the appropriate reviewer based on review_route
  IF v_case.review_route = 'supervisor_then_adviser' THEN
    v_next_stage := 'submitted_to_supervisor';
  ELSE
    v_next_stage := 'submitted_to_adviser';
  END IF;

  -- Insert new revision
  INSERT INTO public.document_revisions (
    case_id,
    revision_number,
    source_kind,
    file_path,
    original_filename,
    mime_type,
    byte_size,
    checksum,
    submitted_by,
    remarks
  ) VALUES (
    p_case_id,
    v_new_rev_num,
    COALESCE(p_source_kind, 'upload'),
    p_file_path,
    p_filename,
    p_mime_type,
    p_byte_size,
    p_checksum,
    v_caller_id,
    p_remarks
  ) RETURNING id INTO v_new_rev_id;

  -- Update case current revision and stage
  UPDATE public.document_review_cases
  SET current_revision_id = v_new_rev_id,
      stage = v_next_stage,
      closed_at = NULL,
      updated_at = now()
  WHERE id = p_case_id;

  -- Log revision event
  INSERT INTO public.document_review_events (
    case_id,
    revision_id,
    actor_id,
    actor_role,
    action,
    previous_stage,
    next_stage,
    remarks,
    metadata
  ) VALUES (
    p_case_id,
    v_new_rev_id,
    v_caller_id,
    'student',
    'resubmit',
    v_case.stage,
    v_next_stage,
    COALESCE(p_remarks, 'Submitted replacement PDF (Revision ' || v_new_rev_num::text || ')'),
    jsonb_build_object('revision_number', v_new_rev_num, 'filename', p_filename)
  );

  RETURN jsonb_build_object(
    'case_id', p_case_id,
    'revision_id', v_new_rev_id,
    'revision_number', v_new_rev_num,
    'stage', v_next_stage
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_case_revision(uuid,integer,text,text,text,bigint,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_case_revision(uuid,integer,text,text,text,bigint,text,text,text) TO authenticated;

COMMIT;
