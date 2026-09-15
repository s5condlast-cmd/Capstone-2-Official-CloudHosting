# Authentication implementation handoff

Updated 2026-09-15. Code is implemented locally. Required authentication functions and profile fields were confirmed in the connected Supabase project, but deployment of the latest frontend fix and complete role-by-role acceptance testing are still pending. The earlier diagnosis documents describe the original defects.

## Account workflow

An administrator directly creates each account using a real email address and assigns its role. The server generates a unique temporary password, displays it once, and never stores it in plaintext. The administrator sends the account email and temporary password privately through Messenger, SMS, or another verified direct channel. The user must replace it before MFA and portal access. Credentials must never be posted in group chats or retained in spreadsheets.

Students can be assigned an active adviser and supervisor in User Management. Server and database checks use these assignments; assigning a role alone does not grant access to every student.

## Implemented

- Supabase Auth owns passwords, recovery, sessions, and TOTP. Removed demo passwords, fixed verification codes, separate password storage, and browser-only identity restoration.
- Backend verifies identity, active profile, session validity, password setup, MFA, and role before protected actions. Legacy prototype authentication endpoints return 410.
- Direct account creation, administrator password resets, MFA resets, suspension, account removal, and reviewer assignment report real provider/database failures. Creation rolls back incomplete Auth accounts, and password resets fail closed.
- Migration 04 enforces role and assignment access in database and private storage, blocks self-promotion, and derives document comment authors on the server. Migration 06 makes password-state transitions explicit, adds provisioning timestamps, and records credential lifecycle audit events without passwords.
- Document/template operations use durable storage and checked API responses. Legacy document ownership is not guessed.
- OneDrive authorization begins through an authenticated admin API, with single-use state tied to the administrator’s session. Settings includes the connection button.

## Live administrator recovery — 2026-09-15

The bootstrap administrator was inspected through the Supabase administrator API without reading or storing any password. The Auth user exists, the email is confirmed, the account is not banned, and its matching profile has role `admin`, status `Active`, and `is_activated = true`. A verified TOTP factor also exists.

An administrator password reset was completed using the fail-closed workflow:

- Existing sessions were revoked.
- The profile was marked `requires_password_change = true` before and after the Auth password update.
- A unique temporary password was disclosed once to the account owner and is intentionally not recorded in this repository.
- The password reset initially preserved the existing TOTP factor. A later explicitly authorized bootstrap recovery removed that factor after access to the authenticator was confirmed lost.
- A subsequent live sign-in timestamp confirmed that Supabase accepted the temporary credential. The account still needs to complete permanent password setup and the TOTP challenge before portal acceptance is complete.

The console error `reportAllChanges: Cannot read properties of undefined (reading 'startTime')` was traced to an anonymous `VM*` script injected by Chrome DevTools, not to project code. It matches [GoogleChrome/web-vitals issue #792](https://github.com/GoogleChrome/web-vitals/issues/792) and is not the authentication rejection.

The application did contain a separate post-sign-in race in `src/contexts/AuthContext.tsx`: `login()` awaited a profile refresh while the simultaneous Supabase `SIGNED_IN` event started another refresh and superseded the first result. This could show `Unable to verify your portal account` after Supabase had accepted the password. The fix tracks interactive sign-in and suppresses only that duplicate event refresh; other auth-state refreshes remain active.

### Authenticator reset behavior

Resetting MFA removes every TOTP factor from Supabase, revokes existing sessions, verifies that no factor remains, and records the outcome. The next successful password sign-in enrolls a fresh factor and displays a new QR code. Supabase cannot remotely delete the old entry stored inside Google Authenticator, Microsoft Authenticator, or another authenticator app; the user must delete that obsolete entry on their device.

Starting TOTP enrollment creates an unverified Supabase factor immediately. If the user closes or cancels before entering the first code, its QR secret cannot be retrieved on a later login and its friendly name can block replacement enrollment. The login flow now removes stale unverified TOTP factors before enrolling a new one. A normal Cancel action also attempts to remove the unfinished factor before signing out.

During live recovery on 2026-09-15, the duplicate friendly-name error was reproduced as one stale unverified factor. That incomplete factor was removed through the trusted administrator API and the remaining factor count was verified as zero.

An administrator may reset their own MFA only from an active `aal2` portal session, which proves the current authenticator was successfully used. The reset immediately revokes that session and requires fresh enrollment at the next login. A password-only (`aal1`) session cannot reset MFA. If the authenticator is already lost and the administrator cannot reach the portal, another verified administrator or an explicitly authorized out-of-band recovery through the trusted Supabase administrator environment is required. Never add an unauthenticated self-reset endpoint.

For the bootstrap administrator recovery on 2026-09-15, one verified TOTP factor was removed through the trusted Supabase administrator API, the final factor count was verified as zero, and existing sessions were revoked. The next password sign-in must display a new enrollment QR code. The account owner must manually delete the obsolete entry from their authenticator app; the server has no control over entries stored on the phone.

## Required activation steps

Apply `supabase/migrations/06_direct_account_provisioning.sql` after migration 04 and deploy it with the matching backend/frontend release. Direct provisioning intentionally fails until migration 06 is present. The connected project currently exposes `current_session_is_valid`, `portal_role`, and the direct-provisioning profile fields; this confirms required schema primitives, not every deployed policy definition.

1. Back up the database and test on staging. Run `scripts/auth-preflight.sql` read-only to inspect mismatched Auth/profile IDs, duplicate emails, existing policies, and document ownership. Reconcile each real person to the exact Supabase Auth UUID. Preserve historical records; do not match ownership by name or email prefix.
2. Apply migrations 01–03 if not already applied, then `supabase/migrations/04_verified_auth.sql`. This has been tested against a local PostgreSQL-compatible engine with representative Supabase schemas, not against the live Supabase instance. Deploy backend and frontend together with the migration; the new API intentionally denies access when session validation is unavailable.
3. Configure the current `SUPABASE_SECRET_KEY` (`sb_secret_…`) on the server only. The legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported during migration. Administrator access is available in the checked local environment; verify the same secret independently in each deployed backend environment. Never use a `VITE_` prefix for a secret. Configure `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser; the legacy anon-key name remains supported.
4. Local `APP_URL` uses `http://localhost:3000`. Vercel is configured with `https://capstone-2-official-cloud-hosting.vercel.app`. Set the Supabase Site URL to that production origin and allow both `https://capstone-2-official-cloud-hosting.vercel.app/reset-password` and `http://localhost:3000/reset-password` as redirect URLs.
5. Enable TOTP, disable public self-signup, and set the provider password minimum to 6 characters to match the application. User-selected passwords are limited to 6–12 characters and must contain uppercase, lowercase, a number, and a symbol. This shorter policy was explicitly selected for the project and is weaker than the previous 12-character minimum. SMTP is no longer required for account creation or administrator resets, but the separate Forgot Password page still requires configured recovery email delivery.
6. The first real administrator now has matching Auth/profile identity, role `admin`, active status, confirmed email, and verified TOTP. Complete the currently required permanent password change and TOTP challenge after deploying the login-race fix. The old demo password is no longer supported.
7. Map existing documents to verified `owner_id` UUIDs and migrate private objects into the expected UUID folder paths. Ownerless legacy documents remain visible only to administrators. Move template files into the private `templates` bucket, preserving separate original and PDF-backup IDs; old local/public files are not automatically migrated.
8. If OneDrive is needed, configure Microsoft client credentials, tenant, and callback `${APP_URL}/api/onedrive/auth/callback`, then connect from Settings. No Microsoft sign-in is needed for portal users.

No live SQL was applied and no email was sent during the 2026-09-15 recovery. One explicitly requested live password reset was performed for the bootstrap administrator and recorded without the credential.

## Verification

Final production build passed. Vite reported a large-chunk warning; it did not block the build.

Use Windows commands:

```powershell
node scripts/check-auth-config.mjs
npm.cmd run lint
npm.cmd run test:auth
npm.cmd run build
npm.cmd run dev
```

All 48 authentication tests and TypeScript checks pass after the post-sign-in race and verified MFA-reset changes. The suite covers API authorization, direct account provisioning, unique password generation, fail-closed resets, partial-provisioning cleanup, revoked sessions, verified factor removal, AAL2 self-reset, password-only self-reset denial, role/assignment database and storage policies, signup privilege escalation, and authentication page rendering. API tests use synthetic responses; database tests use PGlite fixtures. Render tests do not exercise client effects or real provider redirects.

Before production acceptance, use controlled admin/student/adviser/supervisor accounts to verify direct creation, one-time credential display, private credential delivery, mandatory password replacement, authenticator enrollment and challenge, logout, administrator reset, recovery, MFA reset, suspension, reviewer assignment, and cross-role denial. Confirm old passwords and sessions stop working, then check private document upload/download and template management. Browser/provider end-to-end verification remains pending.

## Remaining scope and limitations

This does not certify every portal feature as production-ready. The existing Settings save controls and some DTR data remain prototypes. OneDrive token persistence still uses the existing local/temp mechanism; durable multi-instance token storage and automatic archival are separate work. Primary document persistence now uses Supabase. Existing dependency audit findings (24 reported during installation) and the large production bundle need a separate upgrade/performance pass. The unrelated `docs/Plan.md` editor roadmap was preserved.
