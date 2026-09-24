import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function run() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, encrypted_password text, raw_user_meta_data jsonb DEFAULT '{}', deleted_at timestamptz);
    CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid,created_at timestamptz DEFAULT now());
    CREATE TABLE auth.mfa_factors(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,status text);
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,bucket_id text,name text);
  `);

  const migrations = [
    '01_initial_schema.sql',
    '02_storage_security_policies.sql',
    '03_auth_and_profiles.sql',
    '04_verified_auth.sql',
    '05_editor_drafts.sql',
    '06_direct_account_provisioning.sql',
    '07_document_review_cases.sql',
    '08_attendance_time_tracking.sql',
    '09_student_pdf_submission_workflow.sql'
  ];

  for (const name of migrations) {
    console.log('Applying', name);
    const sql = readFileSync(resolve('supabase/migrations', name), 'utf8');
    await db.exec(sql);
  }

  console.log('SUCCESS: All 9 migrations applied cleanly in PGlite!');

  // Verify review_requirement_definitions
  const reqDefs = await db.query<any>('SELECT count(*) as count FROM public.review_requirement_definitions');
  console.log('Requirement definitions count:', reqDefs.rows[0]);
  if (Number(reqDefs.rows[0].count) !== 11) {
    throw new Error('Expected 11 requirement definitions, got ' + reqDefs.rows[0].count);
  }

  // Setup test student and adviser
  const studentId = '11111111-1111-1111-1111-111111111111';
  const adviserId = '22222222-2222-2222-2222-222222222222';
  await db.exec(`
    INSERT INTO public.profiles (id, full_name, email, role, status, is_activated, adviser_id)
    VALUES ('${adviserId}', 'Adviser User', 'adviser@test.com', 'adviser', 'Active', true, NULL);

    INSERT INTO public.profiles (id, full_name, email, role, status, is_activated, adviser_id)
    VALUES ('${studentId}', 'Student User', 'student@test.com', 'student', 'Active', true, '${adviserId}');
  `);

  // Emulate authenticated student context
  await db.exec(`
    SET "request.jwt.claims" = '{"sub": "${studentId}", "role": "authenticated", "aal": "aal2"}';
  `);

  // Test create_review_case_from_submission
  const clientSubId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const subRes = await db.query<any>(`
    SELECT public.create_review_case_from_submission(
      '${clientSubId}'::uuid,
      'student-application-letter',
      'My Application Letter',
      'submissions/${studentId}/app.pdf',
      'app.pdf',
      'application/pdf',
      1024,
      'sha256dummy',
      'upload',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'medium',
      'Please review my application'
    ) as result;
  `);

  const caseData = subRes.rows[0].result;
  console.log('Created case result:', caseData);
  if (!caseData || !caseData.case_id) {
    throw new Error('Failed to create review case via RPC');
  }

  // Test idempotency with same clientSubId
  const idempRes = await db.query<any>(`
    SELECT public.create_review_case_from_submission(
      '${clientSubId}'::uuid,
      'student-application-letter',
      'My Application Letter',
      'submissions/${studentId}/app.pdf',
      'app.pdf'
    ) as result;
  `);
  if (idempRes.rows[0].result.case_id !== caseData.case_id) {
    throw new Error('Idempotency failed: expected same case ID');
  }
  console.log('Idempotency test passed!');

  // Update case stage to 'adviser_revision_required' to simulate adviser requesting revision
  await db.exec(`
    UPDATE public.document_review_cases
    SET stage = 'adviser_revision_required'
    WHERE id = '${caseData.case_id}';
  `);

  // Test submit_case_revision
  const revRes = await db.query<any>(`
    SELECT public.submit_case_revision(
      '${caseData.case_id}'::uuid,
      1,
      'submissions/${studentId}/app-v2.pdf',
      'app-v2.pdf',
      'application/pdf',
      2048,
      'sha256dummyv2',
      'upload',
      'Incorporated feedback'
    ) as result;
  `);
  console.log('Created revision result:', revRes.rows[0].result);
  if (revRes.rows[0].result.revision_number !== 2) {
    throw new Error('Expected revision_number 2');
  }

  console.log('ALL FUNCTIONAL RPC TESTS PASSED CLEANLY!');
  await db.close();
}

run().catch(err => {
  console.error('Migration failed message:', err.message);
  if (err.position) console.error('Position:', err.position);
  if (err.detail) console.error('Detail:', err.detail);
  if (err.hint) console.error('Hint:', err.hint);
  if (err.where) console.error('Where:', err.where);
  process.exit(1);
});
