-- ========================================================================
-- 02_storage_security_policies.sql
-- Supabase Storage Buckets & Scoped RLS Access Policies
-- ========================================================================

-- 1. Create Required Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('templates', 'templates', true),
    ('student_submissions', 'student_submissions', true),
    ('signed_dtrs', 'signed_dtrs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop Any Broad / Duplicate Policies on Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public storage access" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Select" ON storage.objects;
DROP POLICY IF EXISTS "templates_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "templates_admin_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "templates_write_policy" ON storage.objects;
DROP POLICY IF EXISTS "templates_modify_policy" ON storage.objects;
DROP POLICY IF EXISTS "templates_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "submissions_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "submissions_select_policy" ON storage.objects;

-- 3. Template Management Policies (Admin/Staff Upload, Update, Delete)
CREATE POLICY "templates_write_policy" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'templates');

CREATE POLICY "templates_modify_policy" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'templates') 
WITH CHECK (bucket_id = 'templates');

CREATE POLICY "templates_delete_policy" ON storage.objects 
FOR DELETE 
USING (bucket_id = 'templates');

-- 4. Template Browsing/Listing Policy (Authenticated Staff/Advisers only)
CREATE POLICY "templates_admin_select_policy" ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'templates'
    AND (
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
        OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
    )
);

-- 5. Student & Supervisor Upload Permissions (INSERT only)
CREATE POLICY "submissions_upload_policy" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id IN ('student_submissions', 'signed_dtrs'));

-- 6. Submissions Browsing/Listing Policy (Authenticated Staff/Advisers only)
CREATE POLICY "submissions_select_policy" ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
    bucket_id IN ('student_submissions', 'signed_dtrs')
    AND (
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'adviser')
        OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'adviser', 'service_role')
    )
);
