-- Apply with the matching application release, first in staging.
-- Run scripts/auth-preflight.sql and reconcile legacy IDs before production cutover.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sessions_revoked_before timestamptz;
ALTER TABLE public.student_documents ADD COLUMN IF NOT EXISTS owner_id uuid DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS student_documents_owner_idx ON public.student_documents(owner_id);

CREATE OR REPLACE FUNCTION public.current_session_is_valid() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.sessions s
    JOIN auth.users u ON u.id = s.user_id
    JOIN public.profiles p ON p.id = u.id
    WHERE s.id::text = (SELECT auth.jwt()->>'session_id')
      AND s.user_id = (SELECT auth.uid()) AND u.deleted_at IS NULL
      AND (p.sessions_revoked_before IS NULL OR s.created_at > p.sessions_revoked_before)
      AND (coalesce((SELECT auth.jwt()->>'aal'), 'aal1') <> 'aal2'
        OR EXISTS (SELECT 1 FROM auth.mfa_factors f WHERE f.user_id = u.id AND f.status = 'verified'))
  );
$$;

CREATE OR REPLACE FUNCTION public.portal_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid())
    AND p.status = 'Active' AND p.is_activated AND NOT p.requires_password_change
    AND (SELECT auth.jwt()->>'aal') = 'aal2' AND public.current_session_is_valid();
$$;

CREATE OR REPLACE FUNCTION public.can_access_student(student uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.portal_role() = 'admin' OR (
    public.portal_role() IS NOT NULL AND (student = (SELECT auth.uid()) OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = student AND (
        (public.portal_role() = 'adviser' AND p.adviser_id = (SELECT auth.uid())::text)
        OR (public.portal_role() = 'supervisor' AND p.supervisor_id = (SELECT auth.uid())::text)
      )
    ))
  );
$$;
REVOKE ALL ON FUNCTION public.current_session_is_valid(), public.portal_role(), public.can_access_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_session_is_valid(), public.portal_role(), public.can_access_student(uuid) TO anon, authenticated, service_role;

-- Remove ALL existing policies on these application tables: permissive policies combine with OR.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('profiles','auth_otps','student_documents','document_instances','template_metadata','document_templates','document_template_versions')
  LOOP EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename); END LOOP;
END $$;
REVOKE ALL ON public.auth_otps FROM anon, authenticated;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- Only editable contact fields are writable directly; authority fields require the admin API.
GRANT UPDATE (full_name, contact_number) ON public.profiles TO authenticated;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (
  (id = (SELECT auth.uid()) AND public.current_session_is_valid()) OR public.can_access_student(id)
);
CREATE POLICY profiles_edit_contact ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) AND public.portal_role() IS NOT NULL)
  WITH CHECK (id = (SELECT auth.uid()) AND public.portal_role() IS NOT NULL);

CREATE POLICY documents_read ON public.student_documents FOR SELECT TO authenticated
  USING (public.can_access_student(owner_id));
REVOKE UPDATE ON public.student_documents FROM authenticated;
GRANT UPDATE (status, adviser_feedback, ai_status, ai_findings) ON public.student_documents TO authenticated;
CREATE POLICY documents_create ON public.student_documents FOR INSERT TO authenticated
  WITH CHECK ((public.portal_role() = 'student' AND owner_id = (SELECT auth.uid()) AND status IN ('Pending','Pending Adviser Review'))
    OR (public.portal_role() IN ('admin','supervisor') AND public.can_access_student(owner_id) AND status = 'Pending Adviser Review'));
CREATE POLICY documents_review ON public.student_documents FOR UPDATE TO authenticated
  USING (public.portal_role() IN ('admin','adviser','supervisor') AND public.can_access_student(owner_id))
  WITH CHECK (public.portal_role() IN ('admin','adviser','supervisor') AND public.can_access_student(owner_id));
CREATE POLICY documents_delete ON public.student_documents FOR DELETE TO authenticated
  USING (public.portal_role() = 'admin');

CREATE OR REPLACE FUNCTION public.add_document_comment(document_id uuid, message text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE author_name text;
BEGIN
  IF public.portal_role() NOT IN ('admin','adviser','supervisor','student') OR public.portal_role() IS NULL
    OR length(trim(message)) NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'Comment not allowed'; END IF;
  SELECT full_name INTO author_name FROM public.profiles WHERE id = (SELECT auth.uid());
  UPDATE public.student_documents SET comments = coalesce(comments,'[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('author',author_name,'msg',message,'time',now()))
    WHERE id = document_id AND public.can_access_student(owner_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Document unavailable'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.add_document_comment(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_document_comment(uuid,text) TO authenticated;

-- Legacy ownerless rows are visible only to administrators until explicitly mapped.
CREATE POLICY instances_read ON public.document_instances FOR SELECT TO authenticated
  USING (public.portal_role() = 'admin' OR (student_id = (SELECT auth.uid())::text AND public.portal_role() = 'student'));
CREATE POLICY instances_create ON public.document_instances FOR INSERT TO authenticated
  WITH CHECK (public.portal_role() = 'student' AND student_id = (SELECT auth.uid())::text AND status = 'draft');
CREATE POLICY instances_edit ON public.document_instances FOR UPDATE TO authenticated
  USING (public.portal_role() = 'admin' OR (public.portal_role() = 'student' AND student_id = (SELECT auth.uid())::text AND status IN ('draft','revision_required')))
  WITH CHECK (public.portal_role() = 'admin' OR (public.portal_role() = 'student' AND student_id = (SELECT auth.uid())::text AND status IN ('draft','submitted','revision_required')));

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['template_metadata','document_templates','document_template_versions'] LOOP
    EXECUTE format('CREATE POLICY templates_read ON public.%I FOR SELECT TO authenticated USING (public.portal_role() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY templates_admin ON public.%I FOR ALL TO authenticated USING (public.portal_role() = ''admin'') WITH CHECK (public.portal_role() = ''admin'')', t);
  END LOOP;
END $$;

-- Supabase Auth changes the password, then this trigger updates the application requirement.
CREATE OR REPLACE FUNCTION public.auth_password_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    UPDATE public.profiles SET requires_password_change = false, sessions_revoked_before = now()
      WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS practicum_password_changed ON auth.users;
CREATE TRIGGER practicum_password_changed AFTER UPDATE OF encrypted_password ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auth_password_changed();

CREATE OR REPLACE FUNCTION public.auth_profile_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN
  INSERT INTO public.profiles(id,email,full_name,role,status,is_activated,requires_password_change)
    VALUES(NEW.id,lower(NEW.email),coalesce(NEW.raw_user_meta_data->>'full_name','New user'),'student','Pending',false,true)
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS practicum_profile_created ON auth.users;
CREATE TRIGGER practicum_profile_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.auth_profile_created();
REVOKE ALL ON FUNCTION public.auth_password_changed(), public.auth_profile_created() FROM PUBLIC, anon, authenticated;

-- Restrictive policy caps any unrelated existing storage policies for our three buckets.
UPDATE storage.buckets SET public = false WHERE id IN ('templates','student_submissions','signed_dtrs');
DROP POLICY IF EXISTS practicum_storage_boundary ON storage.objects;
CREATE POLICY practicum_storage_boundary ON storage.objects AS RESTRICTIVE FOR ALL TO public
  USING (bucket_id NOT IN ('templates','student_submissions','signed_dtrs') OR
    (public.portal_role() IS NOT NULL AND (bucket_id = 'templates' OR public.portal_role() = 'admin'
      OR public.can_access_student(CASE WHEN split_part(name,'/',1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN split_part(name,'/',1)::uuid ELSE NULL END))))
  WITH CHECK (bucket_id NOT IN ('templates','student_submissions','signed_dtrs') OR
    (bucket_id = 'templates' AND public.portal_role() = 'admin') OR
    (bucket_id IN ('student_submissions','signed_dtrs') AND public.portal_role() IS NOT NULL
      AND (split_part(name,'/',1) = (SELECT auth.uid())::text OR
        (public.portal_role() IN ('admin','supervisor') AND public.can_access_student(CASE WHEN split_part(name,'/',1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN split_part(name,'/',1)::uuid ELSE NULL END)))));
-- Prevent deletion of templates by ordinary authenticated users even when old policies allow it.
DROP POLICY IF EXISTS practicum_storage_delete_boundary ON storage.objects;
CREATE POLICY practicum_storage_delete_boundary ON storage.objects AS RESTRICTIVE FOR DELETE TO public
 USING (bucket_id NOT IN ('templates','student_submissions','signed_dtrs') OR public.portal_role() = 'admin'
   OR (bucket_id <> 'templates' AND public.portal_role() IS NOT NULL AND split_part(name,'/',1) = (SELECT auth.uid())::text));
DROP POLICY IF EXISTS practicum_storage_read ON storage.objects;
DROP POLICY IF EXISTS practicum_storage_update_boundary ON storage.objects;
CREATE POLICY practicum_storage_update_boundary ON storage.objects AS RESTRICTIVE FOR UPDATE TO public
 USING (bucket_id NOT IN ('templates','student_submissions','signed_dtrs') OR public.portal_role() = 'admin'
   OR (bucket_id <> 'templates' AND public.portal_role() IS NOT NULL AND split_part(name,'/',1) = (SELECT auth.uid())::text));
CREATE POLICY practicum_storage_read ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id IN ('templates','student_submissions','signed_dtrs') AND public.portal_role() IS NOT NULL);
DROP POLICY IF EXISTS practicum_storage_write ON storage.objects;
CREATE POLICY practicum_storage_write ON storage.objects FOR ALL TO authenticated
 USING (bucket_id = 'templates' AND public.portal_role() = 'admin')
 WITH CHECK ((bucket_id = 'templates' AND public.portal_role() = 'admin') OR
   (bucket_id IN ('student_submissions','signed_dtrs') AND public.portal_role() IS NOT NULL AND
     (split_part(name,'/',1) = (SELECT auth.uid())::text OR
       (public.portal_role() IN ('admin','supervisor') AND public.can_access_student(CASE WHEN split_part(name,'/',1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN split_part(name,'/',1)::uuid ELSE NULL END)))));

CREATE TABLE IF NOT EXISTS public.oauth_pending (
  state_hash text PRIMARY KEY, actor_id uuid NOT NULL, session_id uuid NOT NULL,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.oauth_pending ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oauth_pending FROM anon, authenticated;
GRANT ALL ON public.oauth_pending TO service_role;
CREATE OR REPLACE FUNCTION public.consume_onedrive_state(state_digest text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE pending public.oauth_pending;
BEGIN
  DELETE FROM public.oauth_pending WHERE state_hash = state_digest RETURNING * INTO pending;
  DELETE FROM public.oauth_pending WHERE expires_at < now();
  IF pending.actor_id IS NULL OR pending.expires_at < now() THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.profiles p JOIN auth.sessions s ON s.user_id = p.id
    WHERE p.id = pending.actor_id AND p.role = 'admin' AND p.status = 'Active' AND p.is_activated
      AND NOT p.requires_password_change AND s.id = pending.session_id
      AND (p.sessions_revoked_before IS NULL OR s.created_at > p.sessions_revoked_before)
      AND EXISTS (SELECT 1 FROM auth.mfa_factors f WHERE f.user_id=p.id AND f.status='verified'));
END $$;
REVOKE ALL ON FUNCTION public.consume_onedrive_state(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_onedrive_state(text) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_user_directory() RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT to_jsonb(p) || jsonb_build_object('has_verified_factor', EXISTS (
    SELECT 1 FROM auth.mfa_factors f WHERE f.user_id=p.id AND f.status='verified'))
    FROM public.profiles p ORDER BY p.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_user_directory() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_directory() TO service_role;

COMMIT;
