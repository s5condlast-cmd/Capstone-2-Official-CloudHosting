-- 05_editor_drafts.sql
-- Student document editor draft schema, version history, and RPC layer.
-- Requires migrations 01–04. Idempotent (DROP IF EXISTS before recreating).
BEGIN;

-- ============================================================
-- 1. practicum_phase column on profiles (admin-only via RPC)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS practicum_phase text
  CHECK (practicum_phase IN ('before_ojt','in_ojt','final'));

CREATE OR REPLACE FUNCTION public.admin_set_practicum_phase(target_user uuid, new_phase text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.portal_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only administrators may change practicum phase.';
  END IF;
  IF new_phase IS NOT NULL AND new_phase NOT IN ('before_ojt','in_ojt','final') THEN
    RAISE EXCEPTION 'Invalid practicum phase value.';
  END IF;
  UPDATE public.profiles SET practicum_phase = new_phase WHERE id = target_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found.'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_practicum_phase(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_practicum_phase(uuid,text) TO authenticated;

-- ============================================================
-- 2. editor_drafts table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.editor_drafts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title text NOT NULL DEFAULT 'Untitled Document',
  template_id text,
  template_name text,
  phase text CHECK (phase IN ('before_ojt','in_ojt','final','general')),
  content jsonb NOT NULL DEFAULT '[]',
  word_count integer NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','locked')),
  submission_id uuid REFERENCES public.student_documents(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS editor_drafts_user_updated_idx
  ON public.editor_drafts (user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE public.editor_drafts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. document_versions table (append-only history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_versions (
  version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id uuid NOT NULL REFERENCES public.editor_drafts(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL,
  word_count integer NOT NULL DEFAULT 0,
  label text,
  source_revision integer NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_versions_doc_saved_idx
  ON public.document_versions (doc_id, saved_at DESC, version_id DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. updated_at trigger for editor_drafts
-- ============================================================
CREATE OR REPLACE FUNCTION public.editor_drafts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
REVOKE ALL ON FUNCTION public.editor_drafts_set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS editor_drafts_updated_at ON public.editor_drafts;
CREATE TRIGGER editor_drafts_updated_at
  BEFORE UPDATE ON public.editor_drafts
  FOR EACH ROW EXECUTE FUNCTION public.editor_drafts_set_updated_at();

-- ============================================================
-- 5. RLS policies (student read-only; all writes via functions)
-- ============================================================
-- Revoke direct access
REVOKE ALL ON public.editor_drafts FROM anon, authenticated;
REVOKE ALL ON public.document_versions FROM anon, authenticated;
GRANT SELECT ON public.editor_drafts TO authenticated;
GRANT SELECT, DELETE ON public.document_versions TO authenticated;

-- Drop named policies before recreating (idempotency)
DROP POLICY IF EXISTS editor_drafts_owner_read ON public.editor_drafts;
CREATE POLICY editor_drafts_owner_read ON public.editor_drafts
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND deleted_at IS NULL
    AND public.portal_role() = 'student'
    AND public.current_session_is_valid()
  );

DROP POLICY IF EXISTS document_versions_owner_read ON public.document_versions;
CREATE POLICY document_versions_owner_read ON public.document_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.editor_drafts d
      WHERE d.id = doc_id
        AND d.user_id = (SELECT auth.uid())
        AND d.deleted_at IS NULL
        AND public.portal_role() = 'student'
        AND public.current_session_is_valid()
    )
  );

DROP POLICY IF EXISTS document_versions_owner_delete ON public.document_versions;
CREATE POLICY document_versions_owner_delete ON public.document_versions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.editor_drafts d
      WHERE d.id = doc_id
        AND d.user_id = (SELECT auth.uid())
        AND d.deleted_at IS NULL
        AND public.portal_role() = 'student'
        AND public.current_session_is_valid()
    )
  );

-- ============================================================
-- 6. Internal version pruning (keeps newest 5 per draft)
-- ============================================================
CREATE OR REPLACE FUNCTION public._prune_document_versions(p_doc_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.document_versions
  WHERE doc_id = p_doc_id
    AND version_id NOT IN (
      SELECT version_id FROM public.document_versions
      WHERE doc_id = p_doc_id
      ORDER BY saved_at DESC, version_id DESC
      LIMIT 5
    );
END;
$$;
REVOKE ALL ON FUNCTION public._prune_document_versions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._prune_document_versions(uuid) TO service_role;

DROP FUNCTION IF EXISTS public.prune_editor_versions(uuid);
CREATE OR REPLACE FUNCTION public.prune_editor_versions(p_doc_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may manage document versions.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.editor_drafts
    WHERE id = p_doc_id AND user_id = (SELECT auth.uid()) AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Draft not found or access denied.';
  END IF;

  PERFORM public._prune_document_versions(p_doc_id);
END;
$$;
REVOKE ALL ON FUNCTION public.prune_editor_versions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prune_editor_versions(uuid) TO authenticated;

-- ============================================================
-- 7. create_editor_draft
-- ============================================================
DROP FUNCTION IF EXISTS public.create_editor_draft(uuid,text,text,text,text,jsonb,integer);
DROP FUNCTION IF EXISTS public.create_editor_draft(text,text,text,text,jsonb,integer);
CREATE OR REPLACE FUNCTION public.create_editor_draft(
  p_id uuid,
  p_title text,
  p_template_id text,
  p_template_name text,
  p_phase text,
  p_content jsonb,
  p_word_count integer
) RETURNS public.editor_drafts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result public.editor_drafts;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may create editor drafts.';
  END IF;
  IF p_word_count < 0 THEN RAISE EXCEPTION 'word_count cannot be negative.'; END IF;
  INSERT INTO public.editor_drafts
    (id, user_id, title, template_id, template_name, phase, content, word_count, revision, status)
  VALUES
    (p_id, (SELECT auth.uid()), p_title, p_template_id, p_template_name, p_phase, p_content, p_word_count, 1, 'draft')
  RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_editor_draft(uuid,text,text,text,text,jsonb,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_editor_draft(uuid,text,text,text,text,jsonb,integer) TO authenticated;

-- ============================================================
-- 8. save_editor_draft (OCC)
-- ============================================================
DROP FUNCTION IF EXISTS public.save_editor_draft(uuid,integer,text,jsonb,integer);
CREATE OR REPLACE FUNCTION public.save_editor_draft(
  p_draft_id uuid,
  p_expected_revision integer,
  p_title text,
  p_content jsonb,
  p_word_count integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result public.editor_drafts;
  conflict_row public.editor_drafts;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may save editor drafts.';
  END IF;
  UPDATE public.editor_drafts
  SET title = p_title, content = p_content, word_count = p_word_count,
      revision = revision + 1
  WHERE id = p_draft_id
    AND user_id = (SELECT auth.uid())
    AND revision = p_expected_revision
    AND status = 'draft'
    AND deleted_at IS NULL
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    -- Conflict or not found: return current state
    SELECT * INTO conflict_row FROM public.editor_drafts
    WHERE id = p_draft_id AND user_id = (SELECT auth.uid());
    IF conflict_row.id IS NULL THEN
      RAISE EXCEPTION 'Draft not found or access denied.';
    END IF;
    RETURN jsonb_build_object('conflict', true, 'current', to_jsonb(conflict_row));
  END IF;

  RETURN jsonb_build_object('conflict', false, 'draft', to_jsonb(result));
END;
$$;
REVOKE ALL ON FUNCTION public.save_editor_draft(uuid,integer,text,jsonb,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_editor_draft(uuid,integer,text,jsonb,integer) TO authenticated;

-- ============================================================
-- 9. create_editor_version
-- ============================================================
DROP FUNCTION IF EXISTS public.create_editor_version(uuid,text);
CREATE OR REPLACE FUNCTION public.create_editor_version(
  p_draft_id uuid,
  p_label text
) RETURNS public.document_versions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  draft public.editor_drafts;
  ver public.document_versions;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may create document versions.';
  END IF;
  SELECT * INTO draft FROM public.editor_drafts
  WHERE id = p_draft_id AND user_id = (SELECT auth.uid())
    AND deleted_at IS NULL AND status = 'draft';
  IF draft.id IS NULL THEN
    RAISE EXCEPTION 'Draft not found or not accessible.';
  END IF;
  INSERT INTO public.document_versions
    (doc_id, title, content, word_count, label, source_revision)
  VALUES
    (draft.id, draft.title, draft.content, draft.word_count, p_label, draft.revision)
  RETURNING * INTO ver;
  PERFORM public._prune_document_versions(draft.id);
  RETURN ver;
END;
$$;
REVOKE ALL ON FUNCTION public.create_editor_version(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_editor_version(uuid,text) TO authenticated;

-- ============================================================
-- 10. restore_editor_version
-- ============================================================
DROP FUNCTION IF EXISTS public.restore_editor_version(uuid,integer);
CREATE OR REPLACE FUNCTION public.restore_editor_version(
  p_version_id uuid,
  p_expected_revision integer
) RETURNS public.editor_drafts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  ver public.document_versions;
  draft public.editor_drafts;
  result public.editor_drafts;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may restore document versions.';
  END IF;
  -- Verify version belongs to an owned draft
  SELECT dv.* INTO ver
  FROM public.document_versions dv
  JOIN public.editor_drafts d ON d.id = dv.doc_id
  WHERE dv.version_id = p_version_id
    AND d.user_id = (SELECT auth.uid())
    AND d.deleted_at IS NULL
    AND d.status = 'draft';
  IF ver.version_id IS NULL THEN
    RAISE EXCEPTION 'Version not found or access denied.';
  END IF;
  -- Create safety snapshot of current state
  INSERT INTO public.document_versions (doc_id, title, content, word_count, label, source_revision)
  SELECT id, title, content, word_count, 'Pre-restore snapshot', revision
  FROM public.editor_drafts WHERE id = ver.doc_id;
  -- Apply restore with OCC
  UPDATE public.editor_drafts
  SET title = ver.title, content = ver.content, word_count = ver.word_count,
      revision = revision + 1
  WHERE id = ver.doc_id
    AND user_id = (SELECT auth.uid())
    AND revision = p_expected_revision
    AND status = 'draft'
    AND deleted_at IS NULL
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Revision conflict during restore. Reload and retry.';
  END IF;
  PERFORM public._prune_document_versions(ver.doc_id);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.restore_editor_version(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_editor_version(uuid,integer) TO authenticated;

-- ============================================================
-- 10b. delete_editor_version
-- ============================================================
DROP FUNCTION IF EXISTS public.delete_editor_version(uuid);
CREATE OR REPLACE FUNCTION public.delete_editor_version(
  p_version_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_doc_id uuid;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may delete document versions.';
  END IF;

  SELECT v.doc_id INTO v_doc_id
  FROM public.document_versions v
  JOIN public.editor_drafts d ON d.id = v.doc_id
  WHERE v.version_id = p_version_id
    AND d.user_id = (SELECT auth.uid())
    AND d.deleted_at IS NULL;

  IF v_doc_id IS NULL THEN
    RAISE EXCEPTION 'Version not found or access denied.';
  END IF;

  DELETE FROM public.document_versions
  WHERE version_id = p_version_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_editor_version(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_editor_version(uuid) TO authenticated;

-- ============================================================
-- 11. soft_delete_editor_draft
-- ============================================================
DROP FUNCTION IF EXISTS public.soft_delete_editor_draft(uuid,integer);
CREATE OR REPLACE FUNCTION public.soft_delete_editor_draft(
  p_draft_id uuid,
  p_expected_revision integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may delete their own drafts.';
  END IF;
  UPDATE public.editor_drafts
  SET deleted_at = now()
  WHERE id = p_draft_id
    AND user_id = (SELECT auth.uid())
    AND revision = p_expected_revision
    AND status = 'draft'
    AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft not found, already deleted, or revision conflict.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.soft_delete_editor_draft(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_editor_draft(uuid,integer) TO authenticated;

-- ============================================================
-- 12. restore_editor_draft (undo soft delete)
-- ============================================================
DROP FUNCTION IF EXISTS public.restore_editor_draft(uuid);
CREATE OR REPLACE FUNCTION public.restore_editor_draft(
  p_draft_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may restore their own drafts.';
  END IF;
  UPDATE public.editor_drafts
  SET deleted_at = NULL
  WHERE id = p_draft_id
    AND user_id = (SELECT auth.uid())
    AND status = 'draft';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft not found or not restorable.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.restore_editor_draft(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_editor_draft(uuid) TO authenticated;

-- ============================================================
-- 13. resolve_editor_conflict
-- ============================================================
DROP FUNCTION IF EXISTS public.resolve_editor_conflict(uuid,integer,text,jsonb,integer,boolean);
CREATE OR REPLACE FUNCTION public.resolve_editor_conflict(
  p_draft_id uuid,
  p_force_revision integer, -- the CURRENT server revision (override)
  p_title text,
  p_content jsonb,
  p_word_count integer,
  p_snapshot_discarded boolean  -- if true, snapshot current server state before overwriting
) RETURNS public.editor_drafts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result public.editor_drafts;
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may resolve conflicts.';
  END IF;
  IF p_snapshot_discarded THEN
    INSERT INTO public.document_versions (doc_id, title, content, word_count, label, source_revision)
    SELECT id, title, content, word_count, 'Conflict – discarded remote', revision
    FROM public.editor_drafts
    WHERE id = p_draft_id AND user_id = (SELECT auth.uid()) AND status = 'draft';
  END IF;
  UPDATE public.editor_drafts
  SET title = p_title, content = p_content, word_count = p_word_count,
      revision = p_force_revision + 1
  WHERE id = p_draft_id
    AND user_id = (SELECT auth.uid())
    AND revision = p_force_revision
    AND status = 'draft'
    AND deleted_at IS NULL
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Draft not found, locked, or revision already changed.';
  END IF;
  PERFORM public._prune_document_versions(p_draft_id);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_editor_conflict(uuid,integer,text,jsonb,integer,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_editor_conflict(uuid,integer,text,jsonb,integer,boolean) TO authenticated;

-- ============================================================
-- 14. lock_editor_draft_for_submission
-- ============================================================
DROP FUNCTION IF EXISTS public.lock_editor_draft_for_submission(uuid,uuid,integer);
CREATE OR REPLACE FUNCTION public.lock_editor_draft_for_submission(
  p_draft_id uuid,
  p_submission_id uuid,
  p_expected_revision integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.portal_role() <> 'student' THEN
    RAISE EXCEPTION 'Only students may lock their drafts.';
  END IF;
  -- Verify the submission belongs to the same authenticated student
  IF NOT EXISTS (
    SELECT 1 FROM public.student_documents
    WHERE id = p_submission_id AND owner_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Submission not found or does not belong to you.';
  END IF;
  UPDATE public.editor_drafts
  SET status = 'locked', submission_id = p_submission_id
  WHERE id = p_draft_id
    AND user_id = (SELECT auth.uid())
    AND revision = p_expected_revision
    AND status = 'draft'
    AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft not found, already locked, or revision conflict. Reload and retry.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.lock_editor_draft_for_submission(uuid,uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lock_editor_draft_for_submission(uuid,uuid,integer) TO authenticated;

COMMIT;
