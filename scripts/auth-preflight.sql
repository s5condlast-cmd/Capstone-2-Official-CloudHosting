-- READ ONLY. Run in the Supabase SQL editor before migration/cutover.
-- Never automatically reconcile identities by a person's name or email prefix.
SELECT p.id AS profile_id, u.id AS auth_id, p.email, p.role, p.status,
  CASE WHEN u.id IS NULL THEN 'missing auth account'
       WHEN u.id <> p.id THEN 'ID mapping required' ELSE 'aligned' END AS migration_status
FROM public.profiles p LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
ORDER BY migration_status, p.role;
SELECT lower(email), count(*) FROM public.profiles GROUP BY lower(email) HAVING count(*) > 1;
SELECT count(*) AS documents_requiring_owner_mapping FROM public.student_documents;
SELECT count(*) AS legacy_instances FROM public.document_instances;
SELECT policyname, tablename, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname IN ('public','storage') ORDER BY tablename, policyname;
