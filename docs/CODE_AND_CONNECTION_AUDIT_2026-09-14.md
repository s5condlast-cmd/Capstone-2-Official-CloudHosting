# Code, database, and API audit — 2026-09-14

The application builds, and Supabase and Groq are reachable, but it is not ready for production sign-off. Authentication, authorization, and durable persistence have blocking issues. This audit reviewed the application wiring and SQL files; it did not execute every role workflow or inspect deployed PostgreSQL policy definitions.

## Verification

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Pass (TypeScript compilation only; no separate ESLint rules configured) |
| `npm.cmd run build` | Pass; main JavaScript bundle approximately 5.17 MB before gzip, 1.42 MB gzip |
| `node --import tsx --test scripts/templates-security.test.ts` | Four regression tests pass |
| Supabase Auth settings | HTTP 200 with configured anonymous key |
| Seven expected Supabase table endpoints | HTTP 200 for zero-row queries; confirms endpoint availability, not row access controls or successful writes |
| Groq model listing | HTTP 200; key accepted; generation and document analysis not exercised |
| Gemini | Local key missing; fallback unavailable locally |
| OneDrive | Saved local access token expired; refresh and drive operations not exercised |
| Supabase service role | Standard `SUPABASE_SERVICE_ROLE_KEY` variable absent locally; privileged operations not verified |
| Cloudinary | Router commented out in backend/server.ts; not an active mounted integration |

Read-only probes are repeatable with `node scripts/check-connections.mjs`. They print no credentials or database records. No production writes, email dispatches, uploads, migrations, or deployment were performed.

## Fixes included

- Validate template IDs on upload, download, and deletion before turning IDs into filesystem paths. Previously, IDs could contain traversal paths. Regression tests cover encoded traversal and an ordinary missing template.
- Remove the Vite definition that could substitute the server Gemini secret into browser code. No existing source usage was found, so this is preventative hardening, not evidence of an existing leaked bundle.
- Accept server-only `GROQ_API_KEY` first, retain the legacy variable as a compatibility fallback, and update the example configuration.
- Correct README Microsoft variable names to match the implementation (`MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`). The implementation still hardcodes the OAuth tenant to `common`.

## Blocking findings remaining

1. **Database policies permit anonymous profile modification and OTP access.** `supabase/migrations/03_auth_and_profiles.sql:83–118` grants profile CRUD to `anon` with unconditional predicates, and all OTP operations with `USING (true)` / `WITH CHECK (true)`. `backend/services/userStore.ts` also stores password hashes in the OTP table. If deployed as written, these policies expose authentication data and permit role/status changes. Replace them with policies tied to verified identities and privileged server operations. Live zero-row queries do not establish which policies are currently deployed.

2. **Administrative APIs have no server-side authorization.** `backend/server.ts` mounts routers without authentication middleware. User creation, deletion, password/MFA resets, and status changes in `backend/routes/auth.ts` do not verify an administrator session. The same gap affects template mutations and OneDrive file operations. Authorization must be implemented alongside actual session issuance and client credential propagation; hiding UI buttons is insufficient.

3. **MFA has explicit bypasses.** `backend/routes/auth.ts:311` returns the OTP to the caller. The TOTP endpoint around line 458 accepts a fixed `123456` code and otherwise uses a caller-supplied/default secret, rather than an enrolled secret associated with a verified login challenge. `backend/services/emailService.ts` logs OTPs and falls back to console delivery while the API reports that mail was sent. Enrollment, challenge verification, rate limits, and token consumption need a coordinated rewrite.

4. **Password reset reports success without updating the password.** `backend/routes/auth.ts:655` reads but does not validate `verificationToken`; it clears memory state and logs success without updating an authentication provider or password store. Registration around line 577 also treats any supplied verification token as sufficient to bypass the in-memory verification check.

5. **Browser state substitutes for an authenticated session.** `src/contexts/AuthContext.tsx` restores `practicum_session` from localStorage even when there is no Supabase session. Demo login sets arbitrary role users directly. The credentials flow returns user data without installing the returned Supabase session. Most API requests carry no session credentials. The database therefore cannot consistently enforce user-based ownership.

6. **Default passwords and transient account state undermine persistence.** `backend/services/userStore.ts` seeds accounts with password `123`, defaults missing hashes to that password, uses fast SHA-256 password hashes, and stores deletions/status/MFA state in process memory. `backend/routes/auth.ts` similarly falls back to default hashes while importing profiles. Cold starts and failed database operations can revive stale state. Replace this with an authoritative authentication provider and durable, checked writes.

7. **Database/storage failures are presented as successful local operations.** For example, `src/lib/submissionStorage.ts:129` does not inspect the storage upload's returned error; failed document insertion falls back to a synthetic local ID around line 155. Several auth mutations ignore returned Supabase errors. Catching exceptions alone does not handle these result errors. A local submission can consequently appear saved without being visible to another user/device.

8. **OneDrive and template persistence depend on ephemeral state.** OneDrive tokens are stored in process memory and `/tmp` on Vercel (`backend/services/onedriveService.ts:10`); backend templates use memory and `/tmp` (`backend/routes/templates.ts`). Those implementations cannot guarantee availability across instances/redeployments. Persist credentials securely and template files in durable storage, and return failures when durable writes fail.

9. **OneDrive OAuth/email wiring is incomplete.** OAuth has no state validation; it uses `common` regardless of the configured tenant. Requested scopes are `offline_access Files.ReadWrite User.Read`, while emailService calls `/me/sendMail`. EmailService reads the saved access token directly without using the OneDrive refresh path. The expired local token does not establish that refresh credentials are invalid, but email delivery is not verified. The OAuth success page also links to localhost, and interpolates unescaped callback/account text into HTML.

10. **Document analysis accepts an arbitrary server-fetch URL.** `backend/routes/analyze.ts:24` fetches client-supplied `pdfUrl` without an origin allowlist, ownership check, timeout, or response-size limit. This permits unwanted server-side requests and resource exhaustion. Resolve the document from an authorized database record and trusted storage rather than accepting arbitrary URLs.

11. **Storage policies lack role/owner restrictions in important paths.** `supabase/migrations/02_storage_security_policies.sql` lets clients write/modify/delete template bucket objects using bucket-only predicates. Review these together with document policies and student ownership columns; the initial `student_documents` schema has a student name rather than an authenticated student ID.

12. **Some role workflows still use demo state.** For example, `src/pages/supervisor/DTRApproval.tsx` initializes its DTR list from `mockWeeklyDTRs`. The UI being functional does not establish cross-role database synchronization. Exercise student submission → supervisor/adviser action → admin review with separate authenticated accounts after the session/policy work.

## Completion order

First establish real sessions, remove demo authentication bypasses, and enforce route authorization. Then replace permissive database/storage policies and check all persistence errors. Repair OTP/password-reset workflows and persist OneDrive credentials and templates durably. Finally exercise each role workflow, provider failures, expired sessions, and cross-user denial cases against a staging database.

Remaining quality work includes enabling TypeScript strictness incrementally (the current configuration does not enable `strict`), introducing focused auth/persistence integration tests, and splitting the large frontend bundle by route or document editor. Dependency vulnerabilities and full browser accessibility/performance were not audited in this pass.
