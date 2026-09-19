# 📋 Plan: Bulk Student Account Registration from CSV or Excel

[← Back to Tasks Hub](README.md) | [Documentation Hub](../README.md) | [Active Tasks](TASKS.md) | [Task History](TASK_HISTORY.md)

**Status:** Proposed Architecture & Implementation Plan  
**Target:** Admin Portal (`/admin/users`), Registrar Workflow, Supabase Auth & PostgreSQL

---

## 1. Objective

Allow an authorized registrar or administrator to upload a CSV or XLSX student roster and automatically create secure student accounts in Supabase Auth with matching portal profiles.

The feature reuses the existing administrator account-provisioning workflow, requires students to replace their temporary passwords and enroll MFA upon first login, reports errors on a per-row basis, and avoids storing plaintext credentials or retaining the raw roster file on disk.

---

## 2. Import Workflow

```text
Registrar CSV/XLSX File
         │
         ▼
 Browser-Side Parsing & Normalization
         │
         ▼
 Validation & Interactive Row Preview
         │
         ▼
 Administrator Confirmation
         │
         ▼
 Chunked API Creation (10–20 Students/Batch)
         │
         ▼
 Supabase Auth User + PostgreSQL Student Profile
         │
         ▼
 One-Time Credentials Display & Summary Report
```

1. Add an **Import Students** action to `Admin -> User Management` (`src/pages/admin/UserManagement.tsx`).
2. Provide a downloadable official CSV/XLSX template.
3. Parse the selected file in the browser without permanently uploading the raw roster.
4. Normalize headers, whitespace, email casing, dates, and empty cells.
5. Display an interactive preview of valid rows, invalid rows, duplicates, and existing accounts.
6. Require administrator confirmation before creating any accounts.
7. Submit valid rows to the server in chunks of approximately 10–20 students so processing remains within Vercel's serverless function-duration limit.
8. Display live progress and a final per-row result: *Created*, *Already Registered*, *Skipped*, or *Failed*.
9. Return temporary credentials only for accounts created during the current import and clear them when the result view is closed.

---

## 3. Official File Format & Schema

Name, date of birth, and month alone are insufficient for a unique, recoverable login. The official template requires:

| Column | Required | Format and Purpose |
| :--- | :---: | :--- |
| `student_id` | **Yes** | Unique institutional student identifier (e.g., `02000249821`) |
| `full_name` | **Yes** | Student's full legal name |
| `email` | **Yes** | Unique login and recovery email |
| `date_of_birth` | **Yes** | ISO date format: `YYYY-MM-DD` |
| `intake_month` | **Yes** | Cohort/intake month: `YYYY-MM` |
| `program` | Optional | Program code (e.g., `BSIT`) |
| `section` | Optional | Section identifier (e.g., `BSIT 402`) |
| `adviser_email` | Optional | Must match an existing active academic adviser |
| `supervisor_email` | Optional | Must match an existing active company supervisor |

> [!WARNING]
> **Strict Security Controls**:
> - Never accept a `role` column in the roster. Every account created through this importer is strictly assigned the server-controlled `student` role.
> - Never derive default passwords from student birth dates, student IDs, or predictable personal details.

---

## 4. Validation Rules

### File-Level Validation

- Accept only `.csv` and `.xlsx` files.
- Cap initial imports at a maximum of 500 rows per file.
- For XLSX, read only the expected `Students` sheet or prompt the administrator to select a sheet explicitly.
- Reject password-protected, malformed, or formula-driven roster cells.
- Parse quoted CSV values correctly, including commas, Unicode characters, and escaped quotes.
- Validate file extension and parsed workbook structure, not MIME type alone.

### Row-Level Validation

- Require `student_id`, `full_name`, `email`, `date_of_birth`, and `intake_month`.
- Normalize email addresses to lowercase.
- Parse dates without timezone shifts and reject invalid or future birth dates.
- Normalize intake month to the first day of that month for database storage.
- Reject duplicate email addresses and student IDs within the uploaded file.
- Check email and student-ID conflicts against existing database profiles before confirmation.
- Resolve adviser and supervisor emails only to active accounts with the corresponding role.
- Provide exact row numbers and safe, actionable error messages for correction reports.

---

## 5. Backend Architecture & Endpoints

### Reusable Provisioning Service

Extract the account-creation logic currently in `POST /api/users` into a reusable backend service (`backend/services/userService.ts`). Both individual registration and bulk registration must execute through this shared service to enforce consistent policies:

1. Validate and normalize row inputs on the server.
2. Confirm email and student ID uniqueness against Supabase Auth and `profiles`.
3. Generate a unique, cryptographically secure temporary password.
4. Create the Supabase Auth user with confirmed email.
5. Create the matching profile in PostgreSQL with role `student`.
6. Set `requires_password_change = true` and log `temporary_password_issued_at`.
7. Assign adviser/supervisor relationships only after validating their active roles.
8. Record a security audit event without persisting the credential.
9. Delete the incomplete Auth user if profile insertion fails (compensating rollback).
10. Return the temporary password once with `Cache-Control: no-store`.

### Dedicated Import Endpoints

- `POST /api/users/import/validate`
  - Accept normalized student rows.
  - Return validation findings and an import batch ID without creating accounts.
- `POST /api/users/import/:batchId/commit`
  - Accept a chunk of validated row IDs.
  - Provision accounts using the shared service.
  - Return created credentials and per-row outcomes.
- `GET /api/users/import/:batchId`
  - Return batch progress and non-sensitive status to support resuming interrupted imports.

---

## 6. Database Schema Extensions

Create a new migration (`supabase/migrations/07_student_bulk_import.sql`):

- `profiles.date_of_birth DATE`
- `profiles.intake_month DATE`
- Unique constraint / partial unique index on `profiles.student_id`
- `student_import_batches` table:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `uploader_id UUID REFERENCES profiles(id)`
  - `filename TEXT NOT NULL`
  - `file_hash TEXT NOT NULL`
  - `status TEXT NOT NULL` (e.g., `pending`, `processing`, `completed`, `failed`)
  - `total_rows INT NOT NULL`
  - `success_count INT DEFAULT 0`
  - `failed_count INT DEFAULT 0`
  - `created_at TIMESTAMPTZ DEFAULT now()`
- `student_import_rows` table:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `batch_id UUID REFERENCES student_import_batches(id) ON DELETE CASCADE`
  - `source_row_number INT NOT NULL`
  - `normalized_data JSONB NOT NULL` (non-secret fields only)
  - `status TEXT NOT NULL`
  - `error_message TEXT`
  - `created_user_id UUID REFERENCES auth.users(id)`

---

## 7. Administrator UI (`UserManagement.tsx`)

Multi-step modal workflow:

1. **Download Template**: Get sample CSV and Excel files pre-populated with correct headers.
2. **Select File**: Drag-and-drop file upload with format check.
3. **Preview & Validate**: Table displaying rows categorized as *Valid*, *Needs Correction*, or *Duplicate*.
4. **Confirm & Execute**: Confirmation modal before triggering server chunk execution.
5. **Live Progress**: Progress bar tracking chunk commits (10–20 students per chunk).
6. **Results & One-Time Export**: Safe one-time credential view with strict formula-injection sanitization.

---

## 8. Test Matrix & Acceptance Gates

- [ ] Valid CSV and XLSX parsing with Unicode names and quoted commas.
- [ ] Header validation (rejects missing required columns).
- [ ] Rejection of invalid, future, or malformed birth dates.
- [ ] In-file and database duplicate detection (email, student ID).
- [ ] Role isolation: spreadsheet input cannot elevate role above `student`.
- [ ] Enforces first-login temporary password change and TOTP enrollment.
- [ ] Compensating transaction: Auth user deleted if profile insertion fails.
- [ ] Safe batch chunking preventing Vercel function timeouts.
- [ ] No plaintext credentials stored in database, logs, or error responses.
- [ ] TypeScript compilation (`npm run lint`) and zero test regressions.
