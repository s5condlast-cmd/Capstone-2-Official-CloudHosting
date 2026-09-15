# Login diagnosis and repair plan

Implementation update: see [the authentication handoff](AUTH_IMPLEMENTATION_HANDOFF.md) for the local fixes, verification, and pending activation steps. The findings below describe the original code.

Date: 2026-09-14. Scope: diagnosis and planning; no authentication implementation or live account changes made in this pass.

## Conclusion

The login system combines production Supabase Auth, demo shortcuts, a separate password store, and browser-only identity state. Each can disagree with the others. The result is inconsistent passwords, verification that does not prove identity, and portal access that is not backed by a valid database session.

## Evidence and reproduction

Inspected Login.tsx, ForgotPassword.tsx, AuthContext.tsx, ProtectedRoute.tsx, App.tsx, backend auth routes, userStore, email/OneDrive services, and SQL policies. Previous read-only checks confirmed Supabase connectivity; connectivity is not the root cause of the code defects below.

An isolated local invocation of the actual route handlers, with every network request blocked and a fictitious email, confirmed:

| Request | Observed result |
| --- | --- |
| Reset password without a verification token | HTTP 200, success true; handler contains no password update |
| TOTP verification with the fixed demo code and no enrolled account | HTTP 200, success true |
| Email OTP verification with the fixed demo code, no prior send, and no stored challenge | HTTP 200, success true, verification token issued |

No emails were sent, real accounts accessed, or cloud records changed. Other findings are confirmed source traces, not claims that every production symptom was reproduced.

## Findings by function

### 1. Username, email, student ID, and phone lookup

`backend/services/userStore.ts:findUser` compares email prefixes even when a full email was supplied. Two different domains with the same prefix can resolve to the same account. Backend fallback queries similarly use prefix wildcards. Phone input is accepted by the UI, but findUser does not match contact numbers; an unmatched number can become a fabricated email address. Canonicalize identifiers once and resolve them to a unique auth user ID. Do not infer identity from an email prefix.

### 2. Password login

`backend/routes/auth.ts:694` first checks built-in demo accounts, then Supabase Auth, then a custom password hash from `auth_otps`. The demo branch accepts its default password independently of the account's updated hash. Thus changing a seeded account's password does not eliminate that shortcut.

More seriously, `userStore.ts:24–81` stores password hashes in `auth_otps.verification_token` under purpose `password_reset`. OTP verification at `auth.ts:411` overwrites verification_token for every row matching the email, without filtering challenge or purpose. Sending/verifying a code can therefore overwrite a password hash with an unrelated token. A subsequent fallback password login reads that token as its password hash. This can break fallback login even if the user never changed their password. A working Supabase Auth login may mask this defect.

### 3. Forgot password

`ForgotPassword.tsx:203` sends the new password and verification token. `auth.ts:655` neither validates the token nor changes a password. It only clears some memory fields and returns success. The success screen is therefore misleading; the new password will not work because of this request.

### 4. First-time password change and admin resets

`auth.ts:1468` validates the old password against the custom store rather than consistently against the provider used during login. It changes memory first, starts a cloud hash write without awaiting it, and attempts provider synchronization. Without a service role it calls signUp for an existing account instead of an authenticated password update. Returned errors are ignored. The old and new passwords can consequently belong to different stores.

Admin password/MFA reset and suspension/delete routes are not protected by server authentication/role checks. Their memory caches and swallowed database errors make their effects unreliable across instances. Clearing localStorage in the administrator's browser cannot clear a student's browser session.

### 5. Email code delivery

`emailService.ts` reads a saved Microsoft access token directly, without invoking the OneDrive refresh path. The previously inspected local token is expired. OneDrive OAuth requests Files.ReadWrite and User.Read, while the email service attempts sendMail. Actual granted mail permissions and delivery have not been verified. If sending fails, the service logs the OTP and still returns success. Login displays previewCode; ForgotPassword does not. This explains how login can display a code while password recovery says a code was sent but no message arrives.

### 6. Code validity, expiry, resend, and lockout

`auth.ts:323` verifies only the process-local memoryOtpStore; it does not reload a challenge from the database. A cold start or different server instance loses the challenge. The SQL purpose constraint permits `login_verify`, while the login form sends `login_mfa`; inserts fail if the checked-in constraint is deployed, and returned database errors are ignored.

The verifier ignores purpose, accepts a fixed demo code, and does not reject already verified/consumed challenges. Sending another purpose replaces the same email-keyed memory record. Locks and attempts are process-local; when no record exists, repeated invalid attempts are not persisted. Resend changes codes, but the UI/server cooldown rules also differ.

### 7. Authenticator enrollment and verification

`Login.tsx:87` uses one hardcoded secret for everyone. `auth.ts:458` trusts a caller-provided secret rather than retrieving the factor enrolled for that account. Both frontend and backend accept the fixed demo code. Enrollment defaults to that code and is not tied to an authenticated user or verified password challenge.

The frontend decides whether to show the setup QR using both profile state and a browser-local enrollment flag. A new device may therefore display setup again even when the account is already enrolled. Backend MFA state is a boolean, not an actual managed factor. The frontend Google-verification path calls completeSignIn directly and forces requiresPasswordChange false; completion requirements are spread across inconsistent handlers.

### 8. Microsoft, SMS, and call options

Selecting Microsoft Authenticator is redirected to the same TOTP setup as Google Authenticator; there is no Microsoft push request. The number-match handler is local simulation, and the current selection flow does not enter its authenticator step. SMS and call choices both invoke the email OTP route and only change the displayed destination label. No SMS/voice provider is invoked there.

`AuthContext.loginWithMicrosoft` exists but is not used by the current Login component. Its fallback opens OneDrive authorization, which connects an archive account rather than signing the person into the portal. Microsoft branding alone does not make the local form Microsoft SSO.

### 9. Remember device

The UI writes 30-day mfa_trusted timestamps unconditionally, but no code reads them to authorize trusted-device skipping. rememberDevice state is not connected to that behavior. This explains repeated MFA prompts despite the trust-related storage entries. These entries must not become authorization simply by adding a localStorage read.

### 10. Portal access, reload, roles, and logout

`AuthContext.tsx:145` calls backend login but returns only data.user, discarding any data.session. completeSignIn stores a user object in localStorage. ProtectedRoute checks that object's role. On reload, cached identity remains even if there is no Supabase session. This can show a portal while authenticated database operations fail, or retain stale account status. A manipulated local role is also trusted by the UI.

Logout clears that UI identity and invokes Supabase signOut, but there is no corresponding custom server session to revoke. No reliable server-enforced session links the custom password/MFA flow to protected API calls. The supplied SQL additionally grants anonymous profile and OTP operations; fixing the UI alone cannot fix access control.

App.tsx currently renders `<Login />` without onLogin. Its unused handleLogin callback is therefore not the cause of normal login replacing users with demo users.

### 11. Student activation

`auth.ts:555` does not enforce OTP verification: its failed-verification branch is empty. It ignores signUpError and profile-upsert errors, can invent a UUID when auth creation fails, and still returns an activated user. The UI can report activation without a usable authentication account. Domain validation also ultimately accepts any string containing @, contrary to the institutional restriction message.

## Repair plan, in dependency order

1. **Prepare migration and regression cases.** Use a staging environment and synthetic accounts for each role. Inventory profile-to-auth ID mismatches, duplicate aliases, and profile-only accounts using counts/IDs, without exporting credentials. Preserve existing document ownership mappings and establish a recoverable administrator account. Define the allowed registration domains and supported identifiers.

2. **Make Supabase Auth authoritative.** Remove production demo login, default-password fallback, and custom password hashes. Use verified provider sessions; choose the existing browser Supabase client for session lifecycle and send its access token with Express API requests. Use a request-scoped client for user operations, never a shared signed-in server client. Map profiles to auth IDs and keep roles/status server controlled. Legacy profile-only accounts need an invitation/recovery transition, not guessed passwords.

3. **Implement access control as part of the same staging change.** Validate tokens and current account status on protected APIs. Apply role checks and document ownership checks. Replace anonymous profile/OTP/storage write policies. Prevent users editing role or activation/MFA authority fields. Require verified MFA assurance where the portal requires it. Do not deploy permissive policies while testing a stricter UI.

4. **Rebuild password/activation workflows.** Use provider account creation and recovery; validate provider errors before success. Bind recovery to the verified account, apply expiration and one-time use, update the authoritative password, and invalidate recovery state. Handle first-login password requirements on the server. Recovery screens must remain accessible during recovery without prematurely granting portal access. Start with provider recovery links; retaining a six-digit recovery UI requires a verified provider-supported recovery flow, not the current custom token table.

5. **Replace MFA with actual factors.** Use unique provider-managed TOTP enrollment, challenge, verification, and factor reset. Derive enrollment from provider factors, not localStorage. A password-verified session must not access protected data until required MFA succeeds. Remove demo codes, shared secrets, local approval simulation, and OTP previews/logs. Add SMS/voice/push only when there is a working provider integration; show only supported options in the meantime.

6. **Repair delivery and UI state.** Configure reliable authentication email delivery independent of document archival. Report send failures truthfully. Implement one clear state flow: identifier → password → required password update/enrollment → verification → authorized portal. Preserve pending input on retry, enforce resend/lockout rules server-side, and show explicit expiry errors. Implement remembered devices only with revocable server/provider-backed proof. Wire real Azure OAuth separately if Microsoft SSO is required.

7. **Validate before cutover.** Verify the matrix below, migrate accounts without losing document links, then deploy auth/client/policy changes together. Confirm the first real role workflow and monitor sanitized auth error codes after deployment. Remove obsolete OTP/password-cache data only after the migration is verified.

## Acceptance matrix

- Correct password works; wrong password and old passwords after a change fail. No demo credentials work in production.
- Reset updates the real password; invalid, expired, cross-account, wrong-purpose, and reused recovery proof is rejected.
- Verification never changes a password hash. No credentials or codes appear in responses/logs.
- OTP expiry, resend, attempt limits, and lockout behave identically after restart and across instances.
- Each user has a separate MFA factor; invalid codes fail; incomplete MFA cannot access protected APIs/database rows.
- Activation failure leaves no falsely activated user. Existing emails and disallowed domains have defined behavior.
- New device, refresh, expired session, revoked session, suspension, and deletion produce correct access decisions.
- LocalStorage tampering cannot grant API/database access or roles. Users with identical email prefixes remain distinct.
- Email delivery failure displays failure; SMS/call/push labels appear only for implemented integrations.
- Logout and administrative revocation are tested across two browsers; all four role permissions are exercised.

## Official implementation references

Use the current [Supabase password flow](https://supabase.com/docs/guides/auth/passwords) for recovery and password updates, and its [MFA guide](https://supabase.com/docs/guides/auth/auth-mfa) and [TOTP flow](https://supabase.com/docs/guides/auth/auth-mfa/totp) for enrollment, challenges, and session assurance. These provider capabilities support the proposed consolidation; deployment configuration must still be validated in staging.
