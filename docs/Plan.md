# Plan: Safely Remove Retired Student Document Modules

## Objective

Remove the following ten student-facing modules completely without breaking shared administrator, adviser, supervisor, authentication, document-storage, or reporting functionality:

- Application Letter — `/student/application-letter`
- Consent Form — `/student/consent`
- Proposal Letter — `/student/proposal`
- Memorandum of Agreement — `/student/moa`
- Endorsement Letter — `/student/endorsement`
- Weekly Journal — `/student/journal`
- Daily Time Record — `/student/dtr`
- OJT Training Plan — `/student/training-plan`
- Integration Paper — `/student/completion`
- Performance Appraisal — `/student/evaluation`

## Safety boundaries

- Do not delete existing Supabase records or uploaded student documents during this change.
- Do not drop shared database tables, storage buckets, policies, or document services.
- Preserve `/supervisor/dtr` and `/supervisor/journal` unless their removal is requested separately.
- Preserve administrator template management and adviser/supervisor review features that still have valid uses.
- Preserve unrelated user changes in the working tree.
- Delete shared components, configuration, helpers, or assets only after a repository-wide dependency search proves that nothing remaining uses them.

## Implementation phases

### 1. Establish a baseline

- Record the current working-tree state with `git status`.
- Run TypeScript lint, relevant tests, and the production build.
- Record any pre-existing failures separately so they are not confused with removal regressions.

### 2. Remove application routes

- Remove the ten student route declarations from `src/App.tsx`.
- Remove their now-unused page imports.
- Confirm direct visits to retired URLs use the application's normal not-found behavior or safe student-dashboard fallback.

### 3. Remove navigation and UI entry points

Remove retired links, actions, cards, and labels from:

- Student sidebar implementations
- Student dashboard requirements, progress cards, tasks, and quick actions
- Command palette
- Notification dropdown
- Student generative/AI interface
- Site-header route-title mapping

Remove empty Before OJT, In OJT, or Finals navigation groups when they no longer contain active destinations.

### 4. Remove page components

After all imports and routes have been removed, delete:

- `src/pages/student/StudentApplicationLetter.tsx`
- `src/pages/student/LetterOfConsent.tsx`
- `src/pages/student/ProposalLetterToTheIndustry.tsx`
- `src/pages/student/MemorandumOfAgreement.tsx`
- `src/pages/student/STIOJTEndorsementLetter.tsx`
- `src/pages/student/WeeklyJournal.tsx`
- `src/pages/student/DTR.tsx`
- `src/pages/student/OJTTrainingPlan.tsx`
- `src/pages/student/IntegrationPaper.tsx`
- `src/pages/student/PerformanceAppraisal.tsx`

### 5. Audit supporting code and assets

Review, but do not automatically delete:

- Template-field and editor-template configuration
- PDF, DOCX, and spreadsheet templates
- Document-generation and Excel-export helpers
- Submission-storage utilities
- Shared document workflow and review components
- DTR signature and supervisor-review utilities

Remove an item only when it is exclusive to the retired student modules and has zero remaining runtime, test, or documentation references.

### 6. Preserve historical data

- Keep existing `student_documents` records and uploaded files available to authorized roles.
- Stop new submissions by removing the student entry points.
- Treat permanent record or file deletion as a separate migration requiring a backup and explicit approval.

### 7. Update documentation

Remove obsolete routes and active-feature descriptions from:

- README and student portal guides
- System map and architecture documents
- Document workflow documentation
- Panelist/system guide
- Current task lists

Keep historical task entries where useful, but mark the modules as retired instead of rewriting project history.

### 8. Verification checklist

- [x] Repository search returns no active references to the ten retired student URLs.
- [x] No imports reference the ten deleted page components.
- [x] Student navigation contains no dead links or empty phase groups.
- [x] Direct visits to retired routes are handled safely.
- [x] TypeScript lint passes.
- [x] Relevant unit and authentication tests pass.
- [x] Production build succeeds.
- [x] Student dashboard and remaining student routes render correctly.
- [x] Administrator and adviser pages still render correctly.
- [x] Supervisor DTR and weekly-journal review still work.
- [x] Existing Supabase records and stored documents remain untouched.
- [x] `git diff --check` reports no whitespace errors.

## Completion criteria

The removal is complete only when all ten student pages and their entry points are gone, no broken references remain, shared workflows continue to pass verification, and existing user data has not been deleted.

---

# Plan: Bulk Student Account Registration from CSV or Excel

## Objective

Allow an authorized registrar or administrator to upload a CSV or XLSX student roster and automatically create secure student accounts in Supabase Auth with matching portal profiles.

The feature must reuse the existing administrator account-provisioning workflow, require students to replace their temporary passwords and enroll MFA, report errors per row, and avoid storing plaintext credentials or the original roster file.

## Import workflow

```text
Registrar CSV/XLSX
        |
        v
Parse and normalize
        |
        v
Validate and preview rows
        |
        v
Administrator confirms
        |
        v
Create accounts in small chunks
        |
        v
Supabase Auth user + student profile
        |
        v
One-time credentials and import report
```

1. Add an **Import Students** action to Admin -> Accounts.
2. Provide a downloadable official CSV/XLSX template.
3. Parse the selected file in the browser without permanently uploading the raw roster.
4. Normalize headers, whitespace, email casing, dates, and empty cells.
5. Display a preview of valid rows, invalid rows, duplicates, and existing accounts.
6. Require administrator confirmation before creating any accounts.
7. Submit valid rows to the server in chunks of approximately 10-20 students so processing remains within Vercel's function-duration limit.
8. Display live progress and a final per-row result: Created, Already Registered, Skipped, or Failed.
9. Return temporary credentials only for accounts created during the current import and clear them when the result view is closed.

## Official file format

Name, date of birth, and month alone are insufficient for a unique, recoverable login. The official template should contain:

| Column | Required | Format and purpose |
| --- | --- | --- |
| `student_id` | Yes | Unique institutional student identifier |
| `full_name` | Yes | Student's full legal name |
| `email` | Yes | Unique login and recovery email |
| `date_of_birth` | Yes | ISO date: `YYYY-MM-DD` |
| `intake_month` | Yes | Cohort/intake month: `YYYY-MM` |
| `program` | Optional | Example: `BSIT` |
| `section` | Optional | Example: `BSIT 402` |
| `adviser_email` | Optional | Must match an existing active adviser |
| `supervisor_email` | Optional | Must match an existing active supervisor |

For this plan, **Month** means the student's intake or cohort month. If Month means birth month, remove that column because it is already derived from `date_of_birth`.

Do not accept a role column. Every account created through this importer must have the server-controlled `student` role. Never use the student's birth date, birth month, student ID, or other predictable personal information as a password.

## Validation rules

### File-level validation

- Accept only `.csv` and `.xlsx` files.
- Use a documented maximum file size and row count; initially cap imports at 500 rows.
- For XLSX, read only the expected `Students` sheet or require the administrator to select a sheet explicitly.
- Reject password-protected, malformed, or formula-driven roster cells.
- Parse quoted CSV values correctly, including commas, Unicode names, and escaped quotes.
- Do not rely on MIME type alone; validate the extension and parsed workbook structure.

### Row-level validation

- Require student ID, name, email, date of birth, and intake month.
- Normalize email addresses to lowercase.
- Parse dates without timezone conversion and reject impossible or future birth dates.
- Normalize intake month to the first day of that month for database storage.
- Reject duplicate email addresses and student IDs within the uploaded file.
- Check email and student-ID conflicts against existing profiles before confirmation.
- Resolve adviser and supervisor emails only to active accounts with the expected role.
- Show the exact row number and a safe, actionable error message.

## Backend design

### Reusable provisioning service

Extract the account-creation logic currently used by `POST /api/users` into one reusable server service. Both individual registration and bulk registration must call this service so they enforce the same rules.

For each student, the service must:

1. Validate and normalize the row again on the server.
2. Confirm that the email and student ID do not conflict with existing accounts.
3. Generate a unique, cryptographically secure temporary password.
4. Create the Supabase Auth user with a confirmed email.
5. Create the matching active profile with role `student`.
6. Set `requires_password_change = true` and record `temporary_password_issued_at`.
7. Assign an adviser and supervisor only after validating their active roles.
8. Write a security audit event without recording the password.
9. Delete the incomplete Auth user if profile creation fails.
10. Return the temporary password once with `Cache-Control: no-store`.

### Import endpoints

- `POST /api/users/import/validate`
  - Accept a normalized set of student rows.
  - Return row validation results and an import batch identifier.
  - Make no account changes.
- `POST /api/users/import/:batchId/commit`
  - Accept a bounded chunk of validated row identifiers.
  - Create accounts using the shared provisioning service.
  - Return created credentials and per-row outcomes.
- `GET /api/users/import/:batchId`
  - Return progress and non-sensitive results so an interrupted import can be resumed.

All endpoints must use the existing verified identity, portal-readiness, and administrator-role middleware. Imports must be idempotent: retrying a completed row must not create another account or reset an existing password.

## Database changes

Create a new migration that adds:

- `profiles.date_of_birth DATE`
- `profiles.intake_month DATE`
- A unique constraint or partial unique index for student IDs
- `student_import_batches`
  - Import ID, uploader ID, sanitized filename, file hash, status, row counts, and timestamps
- `student_import_rows`
  - Batch ID, source row number, normalized non-secret data, status, safe error code/message, and created user ID

The import tables must never contain plaintext passwords, session tokens, MFA secrets, or the raw spreadsheet. Date of birth is personal information and must be accessible only where operationally required by authorized roles.

## Administrator interface

Add a multi-step import dialog to `src/pages/admin/UserManagement.tsx`:

1. **Download Template**
2. **Select CSV/XLSX**
3. **Preview and Validate**
4. **Confirm Import**
5. **Progress**
6. **Results and One-Time Credentials**

The preview should show totals for valid, invalid, duplicate, and existing rows. Invalid rows must be downloadable as a correction report without exposing credentials.

Temporary credentials should remain in browser memory only. If a one-time credential export is retained for registrar operations, warn the administrator that it contains sensitive data, prevent spreadsheet-formula injection, and require immediate secure delivery and deletion. The preferred long-term alternative is properly configured Supabase invitation/recovery email delivery so passwords do not need to be exported.

## Security boundaries

- Restrict bulk imports to active administrators with an `aal2` session.
- Fix the account role to `student` on the server regardless of client input.
- Never derive passwords from names, student IDs, dates of birth, or months.
- Never log or persist generated passwords.
- Set all credential responses to `Cache-Control: no-store` and `Pragma: no-cache`.
- Do not permanently store the uploaded file.
- Do not overwrite existing accounts automatically.
- Do not silently match people by name or email prefix.
- Record success and failure audit events for each attempted account.
- Limit batch size and request rate to protect Supabase Auth and the Vercel function.

## Failure and retry behavior

Bulk import is per-row, not all-or-nothing, because Supabase Auth creation and profile creation cross separate operations.

- A failed row must not roll back unrelated successful students.
- Profile failure must trigger deletion of the newly created Auth user.
- If cleanup also fails, mark the row as requiring administrator reconciliation and retain only the affected account ID.
- Existing exact matches should be reported as skipped.
- Conflicting student ID/email combinations should be blocked for manual review.
- Retrying a failed or interrupted chunk must reuse the same batch and row identifiers.
- If the results page is lost, created passwords cannot be recovered; the administrator must use the existing secure password-reset workflow for those accounts.

## Implementation phases

### 1. Confirm data meaning and policy

- Confirm whether Month means intake/cohort month.
- Confirm the authoritative student ID and login-email source.
- Decide whether date of birth must be stored after import or only validated.
- Confirm the secure temporary-credential delivery method.
- Define the initial file-size and row-count limits.

### 2. Add schema and access controls

- Add the profile and import-tracking fields/tables.
- Add indexes, uniqueness rules, RLS, and service-role grants.
- Update the administrator directory function if the new profile fields need to appear there.

### 3. Refactor individual provisioning

- Move the current `POST /api/users` creation sequence into a reusable service.
- Preserve its compensating cleanup, audit logging, temporary-password behavior, and response shape.
- Keep existing individual account creation tests passing.

### 4. Implement parsing and validation

- Add strict CSV and XLSX parsing helpers.
- Add header mapping and normalization.
- Add client preview validation and authoritative server validation.
- Add duplicate and existing-account detection.

### 5. Implement chunked import APIs

- Create validation, commit, and status endpoints.
- Add idempotent row processing and bounded concurrency.
- Add sanitized failure reporting and import audit records.

### 6. Build the administrator workflow

- Add template download and file selection.
- Add validation preview and confirmation.
- Add progress, retry, cancellation between chunks, and final reporting.
- Keep temporary credentials only in memory and clear them deliberately.

### 7. Verify and deploy

- Apply the migration in staging first.
- Test with synthetic students only.
- Verify the import under Vercel's function-duration constraints.
- Confirm all created students can change their password, enroll MFA, sign out, and sign in again.
- Deploy migration, backend, and frontend together.

## Test matrix

- Valid CSV and XLSX imports
- Unicode names, quoted commas, blank lines, and Excel serial dates
- Missing or renamed required headers
- Invalid, future, and ambiguous dates
- Duplicate email/student ID inside one file
- Existing exact account and conflicting existing account
- Adviser/supervisor not found, inactive, or wrong role
- Unauthorized, non-admin, password-change-pending, and `aal1` requests
- Auth creation failure
- Profile creation failure with successful cleanup
- Profile creation failure with failed cleanup
- Partial batch success and safe retry
- Repeated commit request remains idempotent
- Vercel chunk-duration and Supabase rate-limit behavior
- No plaintext passwords in database records, logs, errors, or cached responses
- CSV formula-injection protection in downloaded reports

## Acceptance criteria

- [ ] A registrar can download the official template and upload a valid CSV or XLSX roster.
- [ ] The system previews all rows and clearly identifies corrections before account creation.
- [ ] Only confirmed valid rows are processed.
- [ ] Every new account has a unique Supabase Auth user and matching student profile.
- [ ] Imported accounts are always students and cannot gain another role through spreadsheet data.
- [ ] Every student must replace the temporary password and complete MFA before portal access.
- [ ] Duplicate or retried rows never create duplicate accounts or change existing passwords.
- [ ] One failed student does not corrupt or roll back unrelated successful accounts.
- [ ] Temporary passwords are shown once and never stored in the database or logs.
- [ ] The raw registrar spreadsheet is not retained by the application.
- [ ] Import progress can be safely resumed after a network interruption.
- [ ] Authentication, database-policy, parser, TypeScript, and production-build checks pass.

## Completion criteria

The feature is complete when an authorized administrator can validate and import an official student roster, all valid students receive secure Supabase accounts and profiles, invalid or duplicate rows receive actionable reports, imports are safe to retry within Vercel limits, and no raw roster or plaintext credentials remain stored by the application.
