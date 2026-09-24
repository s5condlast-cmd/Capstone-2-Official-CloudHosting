-- ============================================================
-- Migration 10: Cap Editor Versions to 5 and add Version Deletion
-- ============================================================

-- 1. Update _prune_document_versions to keep 5 newest versions
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

-- 2. Callable pruning function for client sync
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

-- 3. delete_editor_version RPC function
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

-- 4. Enable DELETE permissions & RLS policy for document_versions
GRANT DELETE ON public.document_versions TO authenticated;

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

