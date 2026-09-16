import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';

// An isolated PostgreSQL engine with the minimal Supabase auth/storage contracts.
// No network, actual tokens, accounts, or deployed tables are used.
const db = new PGlite();
after(() => db.close());
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, encrypted_password text, raw_user_meta_data jsonb DEFAULT '{}', deleted_at timestamptz);
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid,created_at timestamptz DEFAULT now());
CREATE TABLE auth.mfa_factors(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,status text);
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,bucket_id text,name text);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO anon,authenticated,service_role;
`);
for (const name of ['01_initial_schema.sql', '02_storage_security_policies.sql', '03_auth_and_profiles.sql', '04_verified_auth.sql']) {
  await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
}
// Ensure the new migration is safely repeatable without widening policies.
await db.exec(await readFile(new URL('../supabase/migrations/04_verified_auth.sql', import.meta.url), 'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/06_direct_account_provisioning.sql', import.meta.url), 'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/06_direct_account_provisioning.sql', import.meta.url), 'utf8'));
const admin = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const student = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const other = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const adviser = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const supervisor = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
for (const [id, role] of [[admin, 'admin'], [student, 'student'], [other, 'student'], [adviser, 'adviser'], [supervisor, 'supervisor']]) {
  await db.query(`INSERT INTO auth.users(id,email,encrypted_password) VALUES($1,$2,'old hash')`, [id, `${role}-${id[0]}@example.invalid`]);
  await db.query(`UPDATE public.profiles SET role=$2,status='Active',is_activated=true,requires_password_change=false WHERE id=$1`, [id, role]);
  await db.query(`INSERT INTO auth.sessions(id,user_id) VALUES($1,$1)`, [id]);
  await db.query(`INSERT INTO auth.mfa_factors(user_id,status) VALUES($1,'verified')`, [id]);
}
await db.query(`UPDATE public.profiles SET adviser_id=$1,supervisor_id=$2 WHERE id=$3`, [adviser, supervisor, student]);
await db.query(`INSERT INTO public.student_documents(owner_id,student_name,course,doc_type,file_path) VALUES
 ($1,'Student B','BSIT','PDF',$3),($2,'Student C','BSIT','PDF',$4),(NULL,'Legacy','BSIT','PDF','legacy.pdf')`, [student, other, `${student}/file.pdf`, `${other}/file.pdf`]);
await db.query(`INSERT INTO storage.objects(bucket_id,name) VALUES('student_submissions',$1),('student_submissions',$2),('templates','h1')`, [`${student}/file.pdf`, `${other}/file.pdf`]);

async function asUser<T>(id: string | null, aal: string, action: () => Promise<T>): Promise<T> {
  await db.query(`SELECT set_config('request.jwt.claims',$1,false)`, [JSON.stringify(id ? { sub: id, session_id: id, aal } : {})]);
  await db.exec(`SET ROLE ${id ? 'authenticated' : 'anon'}`);
  try { return await action(); } finally { await db.exec('RESET ROLE'); }
}
test('anonymous users cannot read OTPs or change profiles', async () => {
  await asUser(null, 'aal1', async () => {
    await assert.rejects(db.query('SELECT * FROM public.auth_otps'), /permission denied/);
    await assert.rejects(db.query("UPDATE public.profiles SET role='admin'"), /permission denied/);
  });
});
test('password-only session has no document access', async () => {
  const result = await asUser(student, 'aal1', () => db.query('SELECT * FROM public.student_documents'));
  assert.equal(result.rows.length, 0);
});
test('student sees own documents only; legacy ownerless rows are not guessed', async () => {
  const result = await asUser(student, 'aal2', () => db.query('SELECT owner_id FROM public.student_documents'));
  assert.deepEqual(result.rows, [{ owner_id: student }]);
});
test('assigned adviser and supervisor can read only their student', async () => {
  for (const id of [adviser, supervisor]) {
    const result = await asUser(id, 'aal2', () => db.query('SELECT owner_id FROM public.student_documents'));
    assert.deepEqual(result.rows, [{ owner_id: student }]);
  }
});
test('administrator sees records that require legacy mapping', async () => {
  const result = await asUser(admin, 'aal2', () => db.query('SELECT owner_id FROM public.student_documents'));
  assert.equal(result.rows.length, 3);
});
test('student cannot change their role, MFA flags, or activation state', async () => {
  await asUser(student, 'aal2', async () => {
    for (const field of ["role='admin'", "mfa_enrolled=true", "is_activated=true", "requires_password_change=false", "temporary_password_issued_at=now()"])
      await assert.rejects(db.query(`UPDATE public.profiles SET ${field} WHERE id=$1`, [student]), /permission denied/);
  });
});
test('student cannot forge another owner or submit an approved record', async () => {
  await asUser(student, 'aal2', async () => {
    await assert.rejects(db.query("INSERT INTO public.student_documents(owner_id,student_name,course,doc_type) VALUES($1,'Other','BSIT','PDF')", [other]), /row-level security/);
    await assert.rejects(db.query("INSERT INTO public.student_documents(owner_id,student_name,course,doc_type,status) VALUES($1,'Me','BSIT','PDF','Approved')", [student]), /row-level security/);
  });
});
test('storage hides other students and disallows template changes', async () => {
  await asUser(student, 'aal2', async () => {
    const result = await db.query("SELECT name FROM storage.objects WHERE bucket_id='student_submissions'");
    assert.deepEqual(result.rows, [{ name: `${student}/file.pdf` }]);
    await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('templates','evil')"), /row-level security/);
    const removed = await db.query("DELETE FROM storage.objects WHERE bucket_id='templates' RETURNING name");
    assert.equal(removed.rows.length, 0);
  });
});
test('unrelated assigned supervisor uploads are denied; own assignment is allowed', async () => {
  await asUser(supervisor, 'aal2', async () => {
    await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student_submissions',$1)", [`${student}/signed.xlsx`]);
    await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student_submissions',$1)", [`${other}/signed.xlsx`]), /row-level security/);
  });
});
test('new signup metadata cannot create an administrator', async () => {
  const id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  await db.query(`INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,'signup@example.invalid','{"role":"admin"}')`, [id]);
  const result = await db.query('SELECT role,status,is_activated FROM public.profiles WHERE id=$1', [id]);
  assert.deepEqual(result.rows, [{ role: 'student', status: 'Pending', is_activated: false }]);
});
test('generic auth password updates cannot clear the temporary-password requirement', async () => {
  await db.query('UPDATE public.profiles SET requires_password_change=true WHERE id=$1', [other]);
  await db.query("UPDATE auth.users SET encrypted_password='new hash' WHERE id=$1", [other]);
  const result = await db.query<{ requires_password_change: boolean }>('SELECT requires_password_change FROM public.profiles WHERE id=$1', [other]);
  assert.equal(result.rows[0].requires_password_change, true);
  const documents = await asUser(other, 'aal2', () => db.query('SELECT * FROM public.student_documents'));
  assert.equal(documents.rows.length, 0);
});
test('revoked or suspended accounts lose database access', async () => {
  await db.query("UPDATE public.profiles SET status='Suspended' WHERE id=$1", [student]);
  const result = await asUser(student, 'aal2', () => db.query('SELECT * FROM public.student_documents'));
  assert.equal(result.rows.length, 0);
  await db.query("UPDATE public.profiles SET status='Active', sessions_revoked_before=now() WHERE id=$1", [student]);
  const valid = await asUser(student, 'aal2', () => db.query<{ valid: boolean }>('SELECT public.current_session_is_valid() AS valid'));
  assert.equal(valid.rows[0].valid, false);
});
test('MFA factor deletion invalidates stale AAL2 tokens', async () => {
  await db.query('DELETE FROM auth.mfa_factors WHERE user_id=$1', [adviser]);
  const result = await asUser(adviser, 'aal2', () => db.query<{ valid: boolean }>('SELECT public.current_session_is_valid() AS valid'));
  assert.equal(result.rows[0].valid, false);
});
