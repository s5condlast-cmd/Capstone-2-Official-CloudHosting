-- 07_document_review_cases.sql
-- Centralized Document Review Center: cases, immutable revisions, comments, attachments, and audit events.
-- Requires migrations 01–06. Idempotent.

BEGIN;

-- ============================================================
-- 1. document_review_cases table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_review_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  template_id text,
  title text NOT NULL,
  review_route text NOT NULL DEFAULT 'adviser_only'
    CHECK (review_route IN ('adviser_only', 'supervisor_then_adviser')),
  stage text NOT NULL DEFAULT 'submitted_to_adviser'
    CHECK (stage IN (
      'submitted_to_adviser',
      'adviser_revision_required',
      'submitted_to_supervisor',
      'supervisor_revision_required',
      'supervisor_approved',
      'approved',
      'returned'
    )),
  assigned_supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_adviser_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_revision_id uuid, -- forward reference, populated on revision insert
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX IF NOT EXISTS doc_review_cases_student_idx
  ON public.document_review_cases (student_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS doc_review_cases_supervisor_stage_idx
  ON public.document_review_cases (assigned_supervisor_id, stage, updated_at DESC)
  WHERE assigned_supervisor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS doc_review_cases_adviser_stage_idx
  ON public.document_review_cases (assigned_adviser_id, stage, updated_at DESC)
  WHERE assigned_adviser_id IS NOT NULL;

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.doc_review_cases_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doc_review_cases_updated_at ON public.document_review_cases;
CREATE TRIGGER trg_doc_review_cases_updated_at
  BEFORE UPDATE ON public.document_review_cases
  FOR EACH ROW EXECUTE FUNCTION public.doc_review_cases_set_updated_at();

ALTER TABLE public.document_review_cases ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. document_revisions table (immutable revision history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.document_review_cases(id) ON DELETE CASCADE,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  source_kind text NOT NULL DEFAULT 'upload'
    CHECK (source_kind IN ('editor', 'upload', 'issued_document', 'signed_return')),
  source_draft_id uuid REFERENCES public.editor_drafts(id) ON DELETE SET NULL,
  legacy_student_document_id uuid REFERENCES public.student_documents(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text,
  byte_size bigint CHECK (byte_size IS NULL OR byte_size >= 0),
  checksum text,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_case_revision_number UNIQUE (case_id, revision_number)
);

CREATE INDEX IF NOT EXISTS doc_revisions_case_rev_idx
  ON public.document_revisions (case_id, revision_number DESC);

ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint from cases.current_revision_id to revisions.id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cases_current_revision'
  ) THEN
    ALTER TABLE public.document_review_cases
      ADD CONSTRAINT fk_cases_current_revision
      FOREIGN KEY (current_revision_id) REFERENCES public.document_revisions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. document_comments table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.document_review_cases(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES public.document_revisions(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message text NOT NULL CHECK (length(trim(message)) > 0),
  anchor jsonb, -- e.g. { page: 1, textSelection: "..." }
  parent_comment_id uuid REFERENCES public.document_comments(id) ON DELETE CASCADE,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS doc_comments_case_created_idx
  ON public.document_comments (case_id, created_at ASC);

ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. document_case_files table (supporting/signed attachments)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_case_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.document_review_cases(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.document_comments(id) ON DELETE SET NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  purpose text NOT NULL DEFAULT 'supporting_file'
    CHECK (purpose IN ('supporting_file', 'review_attachment', 'issued_copy', 'signed_copy')),
  file_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text,
  byte_size bigint CHECK (byte_size IS NULL OR byte_size >= 0),
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doc_case_files_case_idx
  ON public.document_case_files (case_id, created_at DESC);

ALTER TABLE public.document_case_files ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. document_review_events table (append-only audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.document_review_cases(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES public.document_revisions(id) ON DELETE SET NULL,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_role text NOT NULL,
  action text NOT NULL, -- 'submit', 'resubmit', 'comment', 'supervisor_approve', 'supervisor_request_revision', 'adviser_approve', 'adviser_request_revision', 'attach_file'
  previous_stage text,
  next_stage text,
  remarks text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doc_review_events_case_created_idx
  ON public.document_review_events (case_id, created_at ASC);

ALTER TABLE public.document_review_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Row Level Security Policies
-- ============================================================

-- Cases: SELECT
DROP POLICY IF EXISTS doc_cases_select_policy ON public.document_review_cases;
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

-- Revisions: SELECT inherits case visibility
DROP POLICY IF EXISTS doc_revisions_select_policy ON public.document_revisions;
CREATE POLICY doc_revisions_select_policy ON public.document_revisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.document_review_cases c
      WHERE c.id = case_id
    )
  );

-- Comments: SELECT inherits case visibility
DROP POLICY IF EXISTS doc_comments_select_policy ON public.document_comments;
CREATE POLICY doc_comments_select_policy ON public.document_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.document_review_cases c
      WHERE c.id = case_id
    )
  );

-- Case Files: SELECT inherits case visibility
DROP POLICY IF EXISTS doc_case_files_select_policy ON public.document_case_files;
CREATE POLICY doc_case_files_select_policy ON public.document_case_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.document_review_cases c
      WHERE c.id = case_id
    )
  );

-- Review Events: SELECT inherits case visibility
DROP POLICY IF EXISTS doc_review_events_select_policy ON public.document_review_events;
CREATE POLICY doc_review_events_select_policy ON public.document_review_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.document_review_cases c
      WHERE c.id = case_id
    )
  );

-- Revoke direct insert/update/delete from clients (all mutations via RPCs)
REVOKE INSERT, UPDATE, DELETE ON public.document_review_cases FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.document_revisions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.document_comments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.document_case_files FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.document_review_events FROM anon, authenticated;

-- Allow SELECT
GRANT SELECT ON public.document_review_cases TO authenticated;
GRANT SELECT ON public.document_revisions TO authenticated;
GRANT SELECT ON public.document_comments TO authenticated;
GRANT SELECT ON public.document_case_files TO authenticated;
GRANT SELECT ON public.document_review_events TO authenticated;

-- ============================================================
-- 7. RPC: create_review_case_from_submission
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_review_case_from_submission(
  p_title text,
  p_doc_type text,
  p_template_id text DEFAULT NULL,
  p_review_route text DEFAULT 'adviser_only',
  p_file_path text DEFAULT '',
  p_filename text DEFAULT '',
  p_mime_type text DEFAULT 'application/pdf',
  p_byte_size bigint DEFAULT 0,
  p_source_kind text DEFAULT 'upload',
  p_source_draft_id uuid DEFAULT NULL,
  p_priority text DEFAULT 'medium'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_student_profile record;
  v_new_case_id uuid;
  v_new_rev_id uuid;
  v_initial_stage text;
  v_route text;
BEGIN
  v_caller_id := (SELECT auth.uid());
  v_caller_role := public.portal_role();

  IF v_caller_role <> 'student' THEN
    RAISE EXCEPTION 'Only students may initiate document review cases.';
  END IF;

  SELECT id, supervisor_id, adviser_id
  INTO v_student_profile
  FROM public.profiles
  WHERE id = v_caller_id;

  IF v_student_profile.id IS NULL THEN
    RAISE EXCEPTION 'Student profile not found.';
  END IF;

  -- Route validation
  v_route := COALESCE(p_review_route, 'adviser_only');
  IF v_route NOT IN ('adviser_only', 'supervisor_then_adviser') THEN
    v_route := 'adviser_only';
  END IF;

  IF v_route = 'supervisor_then_adviser' THEN
    v_initial_stage := 'submitted_to_supervisor';
  ELSE
    v_initial_stage := 'submitted_to_adviser';
  END IF;

  -- 1. Create Case
  INSERT INTO public.document_review_cases (
    student_id,
    document_type,
    template_id,
    title,
    review_route,
    stage,
    assigned_supervisor_id,
    assigned_adviser_id,
    priority
  ) VALUES (
    v_caller_id,
    p_doc_type,
    p_template_id,
    p_title,
    v_route,
    v_initial_stage,
    v_student_profile.supervisor_id,
    v_student_profile.adviser_id,
    COALESCE(p_priority, 'medium')
  ) RETURNING id INTO v_new_case_id;

  -- 2. Create Revision 1
  INSERT INTO public.document_revisions (
    case_id,
    revision_number,
    source_kind,
    source_draft_id,
    file_path,
    original_filename,
    mime_type,
    byte_size,
    submitted_by
  ) VALUES (
    v_new_case_id,
    1,
    COALESCE(p_source_kind, 'upload'),
    p_source_draft_id,
    p_file_path,
    p_filename,
    p_mime_type,
    p_byte_size,
    v_caller_id
  ) RETURNING id INTO v_new_rev_id;

  -- Update current revision pointer
  UPDATE public.document_review_cases
  SET current_revision_id = v_new_rev_id
  WHERE id = v_new_case_id;

  -- 3. Audit Event
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
    'Initial document submission (Revision 1)',
    jsonb_build_object('filename', p_filename, 'doc_type', p_doc_type)
  );

  RETURN jsonb_build_object(
    'case_id', v_new_case_id,
    'revision_id', v_new_rev_id,
    'stage', v_initial_stage,
    'revision_number', 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_review_case_from_submission(text,text,text,text,text,text,text,bigint,text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_review_case_from_submission(text,text,text,text,text,text,text,bigint,text,uuid,text) TO authenticated;

-- ============================================================
-- 8. RPC: submit_case_revision
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_case_revision(
  p_case_id uuid,
  p_expected_revision integer,
  p_file_path text,
  p_filename text,
  p_mime_type text DEFAULT 'application/pdf',
  p_byte_size bigint DEFAULT 0,
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
    RAISE EXCEPTION 'Review case not found or does not belong to you.';
  END IF;

  -- Revision increment & OCC check
  SELECT COALESCE(MAX(revision_number), 0) INTO v_new_rev_num
  FROM public.document_revisions
  WHERE case_id = p_case_id;

  IF v_new_rev_num <> p_expected_revision THEN
    RAISE EXCEPTION 'Revision conflict: expected revision % but current is %.', p_expected_revision, v_new_rev_num;
  END IF;

  v_new_rev_num := v_new_rev_num + 1;

  -- Determine stage reset
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
    v_caller_id,
    p_remarks
  ) RETURNING id INTO v_new_rev_id;

  -- Update case current revision and stage
  UPDATE public.document_review_cases
  SET current_revision_id = v_new_rev_id,
      stage = v_next_stage,
      closed_at = NULL
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
    COALESCE(p_remarks, 'Submitted revision ' || v_new_rev_num::text),
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

REVOKE ALL ON FUNCTION public.submit_case_revision(uuid,integer,text,text,text,bigint,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_case_revision(uuid,integer,text,text,text,bigint,text,text) TO authenticated;

-- ============================================================
-- 9. RPC: review_case_decision
-- ============================================================
CREATE OR REPLACE FUNCTION public.review_case_decision(
  p_case_id uuid,
  p_expected_stage text,
  p_decision text, -- 'supervisor_approve', 'supervisor_request_revision', 'adviser_approve', 'adviser_request_revision'
  p_remarks text DEFAULT '',
  p_signature_path text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_case record;
  v_next_stage text;
  v_action text;
BEGIN
  v_caller_id := (SELECT auth.uid());
  v_caller_role := public.portal_role();

  SELECT * INTO v_case
  FROM public.document_review_cases
  WHERE id = p_case_id;

  IF v_case.id IS NULL THEN
    RAISE EXCEPTION 'Review case not found.';
  END IF;

  IF v_case.stage <> p_expected_stage THEN
    RAISE EXCEPTION 'Stale workflow stage: expected % but current stage is %.', p_expected_stage, v_case.stage;
  END IF;

  IF p_decision IN ('supervisor_request_revision', 'adviser_request_revision') AND length(trim(COALESCE(p_remarks, ''))) = 0 THEN
    RAISE EXCEPTION 'Remarks are required when requesting revisions.';
  END IF;

  -- Route decision logic
  IF p_decision = 'supervisor_approve' THEN
    IF v_caller_role <> 'supervisor' AND v_caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Only assigned supervisors or admins may approve supervisor stages.';
    END IF;
    v_next_stage := 'submitted_to_adviser';
    v_action := 'supervisor_approve';

  ELSIF p_decision = 'supervisor_request_revision' THEN
    IF v_caller_role <> 'supervisor' AND v_caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Only assigned supervisors or admins may request supervisor revisions.';
    END IF;
    v_next_stage := 'supervisor_revision_required';
    v_action := 'supervisor_request_revision';

  ELSIF p_decision = 'adviser_approve' THEN
    IF v_caller_role <> 'adviser' AND v_caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Only assigned advisers or admins may give final document approval.';
    END IF;
    v_next_stage := 'approved';
    v_action := 'adviser_approve';

  ELSIF p_decision = 'adviser_request_revision' THEN
    IF v_caller_role <> 'adviser' AND v_caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Only assigned advisers or admins may request adviser revisions.';
    END IF;
    v_next_stage := 'adviser_revision_required';
    v_action := 'adviser_request_revision';

  ELSE
    RAISE EXCEPTION 'Invalid review decision: %.', p_decision;
  END IF;

  -- Apply update
  UPDATE public.document_review_cases
  SET stage = v_next_stage,
      closed_at = (CASE WHEN v_next_stage = 'approved' THEN now() ELSE NULL END)
  WHERE id = p_case_id;

  -- If signature path provided, attach as signed copy
  IF p_signature_path IS NOT NULL AND length(trim(p_signature_path)) > 0 THEN
    INSERT INTO public.document_case_files (
      case_id,
      uploaded_by,
      purpose,
      file_path,
      original_filename,
      mime_type
    ) VALUES (
      p_case_id,
      v_caller_id,
      'signed_copy',
      p_signature_path,
      'supervisor-signature.png',
      'image/png'
    );
  END IF;

  -- Audit log event
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
    v_case.current_revision_id,
    v_caller_id,
    v_caller_role,
    v_action,
    v_case.stage,
    v_next_stage,
    p_remarks,
    jsonb_build_object('decision', p_decision, 'signature_applied', (p_signature_path IS NOT NULL))
  );

  RETURN jsonb_build_object(
    'case_id', p_case_id,
    'previous_stage', v_case.stage,
    'stage', v_next_stage,
    'decision', p_decision
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_case_decision(uuid,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_case_decision(uuid,text,text,text,text) TO authenticated;

-- ============================================================
-- 10. RPC: add_case_comment
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_case_comment(
  p_case_id uuid,
  p_message text,
  p_revision_id uuid DEFAULT NULL,
  p_anchor jsonb DEFAULT NULL,
  p_parent_comment_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_new_comment_id uuid;
  v_author_name text;
BEGIN
  v_caller_id := (SELECT auth.uid());
  v_caller_role := public.portal_role();

  IF length(trim(COALESCE(p_message, ''))) = 0 THEN
    RAISE EXCEPTION 'Comment message cannot be empty.';
  END IF;

  -- Ensure caller has access to the case
  IF NOT EXISTS (
    SELECT 1 FROM public.document_review_cases
    WHERE id = p_case_id
  ) THEN
    RAISE EXCEPTION 'Review case not found or access denied.';
  END IF;

  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = v_caller_id;

  INSERT INTO public.document_comments (
    case_id,
    revision_id,
    author_id,
    message,
    anchor,
    parent_comment_id
  ) VALUES (
    p_case_id,
    p_revision_id,
    v_caller_id,
    trim(p_message),
    p_anchor,
    p_parent_comment_id
  ) RETURNING id INTO v_new_comment_id;

  -- Audit log event
  INSERT INTO public.document_review_events (
    case_id,
    revision_id,
    actor_id,
    actor_role,
    action,
    remarks,
    metadata
  ) VALUES (
    p_case_id,
    p_revision_id,
    v_caller_id,
    v_caller_role,
    'comment',
    'Added comment: ' || substring(trim(p_message) from 1 for 60),
    jsonb_build_object('comment_id', v_new_comment_id, 'is_reply', (p_parent_comment_id IS NOT NULL))
  );

  RETURN jsonb_build_object(
    'comment_id', v_new_comment_id,
    'author_name', COALESCE(v_author_name, 'User'),
    'created_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.add_case_comment(uuid,text,uuid,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_case_comment(uuid,text,uuid,jsonb,uuid) TO authenticated;

-- ============================================================
-- 11. RPC: backfill_legacy_student_documents_to_cases
-- Migrates existing student_documents rows into cases and revision 1 seamlessly.
-- ============================================================
CREATE OR REPLACE FUNCTION public.backfill_legacy_student_documents_to_cases()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_doc record;
  v_count integer := 0;
  v_case_id uuid;
  v_rev_id uuid;
  v_route text;
  v_stage text;
  v_student record;
BEGIN
  FOR v_doc IN
    SELECT sd.*
    FROM public.student_documents sd
    WHERE NOT EXISTS (
      SELECT 1 FROM public.document_revisions r
      WHERE r.legacy_student_document_id = sd.id
    )
  LOOP
    -- Get student supervisor/adviser IDs
    SELECT id, supervisor_id, adviser_id
    INTO v_student
    FROM public.profiles
    WHERE id = v_doc.owner_id;

    -- Determine route
    IF v_doc.doc_type ILIKE '%journal%' OR v_doc.doc_type ILIKE '%dtr%' THEN
      v_route := 'supervisor_then_adviser';
    ELSE
      v_route := 'adviser_only';
    END IF;

    -- Map stage
    IF v_doc.status = 'Approved' THEN
      v_stage := 'approved';
    ELSIF v_doc.status = 'Revision Required' THEN
      v_stage := (CASE WHEN v_route = 'supervisor_then_adviser' THEN 'supervisor_revision_required' ELSE 'adviser_revision_required' END);
    ELSIF v_doc.status = 'Pending Adviser Review' THEN
      v_stage := 'submitted_to_adviser';
    ELSIF v_route = 'supervisor_then_adviser' THEN
      v_stage := 'submitted_to_supervisor';
    ELSE
      v_stage := 'submitted_to_adviser';
    END IF;

    -- Insert Case
    INSERT INTO public.document_review_cases (
      student_id,
      document_type,
      title,
      review_route,
      stage,
      assigned_supervisor_id,
      assigned_adviser_id,
      priority,
      created_at,
      updated_at
    ) VALUES (
      COALESCE(v_student.id, v_doc.owner_id),
      v_doc.doc_type,
      COALESCE(v_doc.doc_type || ' - ' || v_doc.student_name, 'Practicum Document'),
      v_route,
      v_stage,
      v_student.supervisor_id,
      v_student.adviser_id,
      COALESCE(v_doc.urgency, 'medium'),
      v_doc.created_at,
      v_doc.created_at
    ) RETURNING id INTO v_case_id;

    -- Insert Revision 1
    INSERT INTO public.document_revisions (
      case_id,
      revision_number,
      source_kind,
      legacy_student_document_id,
      file_path,
      original_filename,
      mime_type,
      submitted_by,
      created_at
    ) VALUES (
      v_case_id,
      1,
      'upload',
      v_doc.id,
      v_doc.file_path,
      COALESCE(split_part(v_doc.file_path, '/', 2), 'document.pdf'),
      (CASE WHEN v_doc.file_path ILIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ELSE 'application/pdf' END),
      COALESCE(v_student.id, v_doc.owner_id),
      v_doc.created_at
    ) RETURNING id INTO v_rev_id;

    -- Set current revision
    UPDATE public.document_review_cases
    SET current_revision_id = v_rev_id
    WHERE id = v_case_id;

    -- Migrate feedback if exists
    IF v_doc.adviser_feedback IS NOT NULL AND length(trim(v_doc.adviser_feedback)) > 0 THEN
      INSERT INTO public.document_comments (
        case_id,
        revision_id,
        author_id,
        message,
        created_at
      ) VALUES (
        v_case_id,
        v_rev_id,
        COALESCE(v_student.adviser_id, v_student.id, v_doc.owner_id),
        v_doc.adviser_feedback,
        v_doc.created_at
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_legacy_student_documents_to_cases() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.backfill_legacy_student_documents_to_cases() TO service_role, authenticated;

-- Run backfill on migration execution
SELECT public.backfill_legacy_student_documents_to_cases();

COMMIT;
