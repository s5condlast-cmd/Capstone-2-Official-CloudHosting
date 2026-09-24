# PocketBase Implementation & Migration Plan

[← Back to Tasks Hub](README.md) | [System Architecture Reference](../architecture/POCKETBASE_SELF_HOSTING_ARCHITECTURE.md) | [Backend & Database](../architecture/BACKEND_AND_DATABASE.md)

This document provides the definitive, step-by-step technical implementation guide for integrating **PocketBase** into the repository. It defines database schemas, API Rules, frontend client adapters, Express sidecar execution, and automated deployment scripts.

---

## 1. Migration Strategy: The Dual-Backend Adapter Pattern

To preserve project stability and adhere to repository standards, the implementation adopts an **Adapter Pattern** governed by an environment flag:

```
VITE_STORAGE_BACKEND = "pocketbase" | "supabase"
```

* **When set to `pocketbase`:** The application routes authentication, document uploads, and database queries through the local PocketBase instance (`/api/...`).
* **When set to `supabase`:** The application uses the existing Supabase cloud backend.
* **Benefit:** You can develop and test PocketBase locally without breaking the existing Supabase configuration or cloud deployment pipelines.

---

## 2. Phase 1: Environment & Directory Setup

### Directory Structure
Create a dedicated `backend/pocketbase` directory to isolate the local database, executable, and static assets:

```
backend/
├── pocketbase/
│   ├── pocketbase.exe           # PocketBase Go binary (downloaded from pocketbase.io)
│   ├── pb_data/                 # Generated SQLite database & configuration (gitignored)
│   │    └── storage/            # Local document file storage (gitignored)
│   ├── pb_public/               # Production build output from Vite (gitignored)
│   └── pb_hooks/                # (Optional) Custom JavaScript event hooks
├── config/
│   └── onedrive-token.json      # Persistent Microsoft Graph OAuth token
└── server.ts                    # Express sidecar (Gemini AI & OneDrive sync on :5000)
```

### Git Isolation (`.gitignore`)
Ensure binary artifacts and database files are not checked into version control:
```gitignore
# PocketBase runtime artifacts
backend/pocketbase/pocketbase.exe
backend/pocketbase/pb_data/
backend/pocketbase/pb_public/
```

---

## 3. Phase 2: PocketBase Collections & Schema Definition

In PocketBase, tables are called **Collections**. These can be configured via the visual Admin UI (`http://localhost:8090/_/`) or imported using a migration script.

### Collection 1: `users` (System Auth Collection)
Extends PocketBase's default auth collection with role and practicum attributes:

| Field Name | Type | Options / Rules | Description |
| :--- | :--- | :--- | :--- |
| `id` | Text (System PK) | Auto-generated 15-char string | Unique user ID |
| `email` | Email (System) | Required, Unique | Institutional login email |
| `password` | Password (System)| Required, Min 8 chars | Bcrypt-hashed password |
| `name` | Text | Required | Full user display name |
| `role` | Select | Values: `'student'`, `'adviser'`, `'supervisor'`, `'admin'` | System role |
| `student_id` | Text | Optional, Unique | Student institutional ID (e.g. `2021-00123`) |
| `course` | Text | Optional | Program/section (e.g. `BSIT 4-A`) |
| `department` | Text | Optional | Academic department |
| `company_name` | Text | Optional | Host Training Establishment (HTE) name |
| `adviser_id` | Relation | Target: `users` collection | Assigned faculty adviser |
| `supervisor_id` | Relation | Target: `users` collection | Assigned company supervisor |
| `requires_password_change` | Bool | Default: `true` | Forces reset on first login |

**API Rules for `users`:**
* **List/View Rule:** `@request.auth.id != ""` (Authenticated users can view profiles).
* **Create Rule:** `@request.auth.role = "admin"` (Only admins can provision accounts).
* **Update Rule:** `@request.auth.id = id || @request.auth.role = "admin"` (Users can update own profile; admins can edit all).
* **Delete Rule:** `@request.auth.role = "admin"` (Admin only).

---

### Collection 2: `student_documents` (Base Collection)
Stores document submission records and review statuses:

| Field Name | Type | Options / Rules | Description |
| :--- | :--- | :--- | :--- |
| `id` | Text (PK) | Auto-generated | Submission ID |
| `student_id` | Relation | Target: `users`, Required | Submitting student |
| `student_name` | Text | Required | Cached student name for fast tables |
| `course` | Text | Required | Program/section |
| `doc_type` | Text | Required | Template name (e.g. `Parent Consent Form`) |
| `status` | Select | Values: `'Pending Adviser Review'`, `'Pending Final Approval'`, `'Revision Required'`, `'Approved'` |
| `urgency` | Select | Values: `'low'`, `'medium'`, `'high'` | Priority level |
| `file` | File | **Protected: TRUE**, Max size: 25 MB, Mime: `.pdf, .docx` | Uploaded document file |
| `ai_status` | Select | Values: `'Pending'`, `'Processing'`, `'Completed'`, `'Failed'` |
| `ai_findings` | JSON | Structured grammar & rubric results |
| `adviser_feedback` | Text | Optional | Faculty remarks |
| `comments` | JSON | Array of comment message objects |

**API Rules for `student_documents`:**
* **List/View Rule:** `@request.auth.id != "" && (student_id = @request.auth.id || @request.auth.role = "adviser" || @request.auth.role = "admin")`
* **Create Rule:** `@request.auth.id != "" && @request.auth.role = "student" && student_id = @request.auth.id`
* **Update Rule:** `@request.auth.id != "" && ((student_id = @request.auth.id && status = "Revision Required") || @request.auth.role = "adviser" || @request.auth.role = "admin")`
* **Delete Rule:** `@request.auth.role = "admin"`

---

### Collection 3: `template_metadata` (Base Collection)
Catalog of active document templates managed by the Practicum Coordinator:

| Field Name | Type | Options / Rules | Description |
| :--- | :--- | :--- | :--- |
| `id` | Text (PK) | Template slug (e.g. `parent_consent`) | Unique template key |
| `name` | Text | Required | Display title |
| `group` | Select | Values: `'Before OJT Templates'`, `'In OJT Templates'`, `'Final Templates'` |
| `type` | Select | Values: `'DOCX'`, `'PDF'`, `'XLSX'` |
| `file` | File | Master template file download |
| `version` | Text | Version tag (e.g. `v1.2`) |
| `size` | Text | Display file size |

**API Rules for `template_metadata`:**
* **List/View Rule:** `@request.auth.id != ""` (All authenticated users can download templates).
* **Create / Update / Delete Rules:** `@request.auth.role = "admin"` (Admin only).

---

## 4. Phase 3: Client SDK & Adapter Implementation

### 1. Install PocketBase SDK
```bash
npm install pocketbase
```

### 2. Create Unified Client ([`src/lib/pocketbase.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/pocketbase.ts))
```typescript
import PocketBase from 'pocketbase';

// Connects to root origin in production (pb_public), or fallback port in development
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || (
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8090'
);

export const pb = new PocketBase(POCKETBASE_URL);
```

### 3. Update Auth Context ([`src/contexts/AuthContext.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/contexts/AuthContext.tsx))
Adapt the authentication provider to support PocketBase sessions:

```typescript
// Login implementation with PocketBase
const loginWithPocketBase = async (email: string, password: string) => {
  const authData = await pb.collection('users').authWithPassword(email.trim().toLowerCase(), password);
  const userRecord = authData.record;
  
  const mappedUser: User = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role,
    studentId: userRecord.student_id,
    course: userRecord.course,
    department: userRecord.department,
    requiresPasswordChange: userRecord.requires_password_change,
  };
  
  setUser(mappedUser);
  return { user: mappedUser, portalReady: !mappedUser.requiresPasswordChange };
};

// Logout implementation with PocketBase
const logoutWithPocketBase = async () => {
  pb.authStore.clear();
  setUser(null);
};
```

---

## 5. Phase 4: Express Sidecar Microservice (AI & OneDrive)

Because Google Gemini document auditing (`@google/genai`) and Microsoft Graph OneDrive synchronization require specific Node.js APIs, the existing Express backend (`backend/server.ts`) is retained as a local sidecar on port `5000`:

```
[React Frontend on :8090] ──> PocketBase :8090 (Auth, Database, Files)
           │
           └──(AI Audit / OneDrive Sync)──> Express :5000 ──> Google / Microsoft APIs
```

### Persistent OneDrive Token Storage
In `backend/services/onedriveService.ts`, verify that `TOKEN_FILE_PATH` targets the persistent local directory:
```typescript
const TOKEN_FILE_PATH = path.resolve(process.cwd(), 'backend', 'config', 'onedrive-token.json');
```
Because the host machine is persistent, tokens will not be lost across restarts.

---

## 6. Phase 5: Automation & Deployment Scripts

Add specialized scripts to `package.json` to streamline building, serving, and tunneling:

```json
{
  "scripts": {
    "build:pb": "vite build && node scripts/copy-to-pb.js",
    "serve:pb": "cd backend/pocketbase && .\\pocketbase.exe serve --http=0.0.0.0:8090",
    "tunnel": "cloudflared tunnel run --url http://localhost:8090"
  }
}
```

### Copy Automation Script (`scripts/copy-to-pb.js`)
```javascript
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const targetDir = path.resolve('backend/pocketbase/pb_public');

if (fs.existsSync(distDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(distDir, targetDir, { recursive: true });
  console.log('✅ Successfully copied Vite build to PocketBase pb_public directory.');
} else {
  console.error('❌ dist/ directory not found. Run npm run build first.');
}
```

---

## 7. Phase 6: Frontend File Size Guard

To ensure submissions never exceed Cloudflare's **100 MB request limit**, enforce a **25 MB client-side restriction** across all document upload components:

```typescript
export const validateSubmissionFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (file.size > MAX_BYTES) {
    return { valid: false, error: 'Document exceeds 25 MB limit. Please compress or optimize the file.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF and DOCX files are accepted.' };
  }
  return { valid: true };
};
```

---

## 8. Verification & Rollout Plan

### Step-by-Step Validation Checklist

1. **Local Binary Verification:**
   * Run `npm run serve:pb` and access `http://localhost:8090/_/`.
   * Create the primary admin account and verify collection creation.
2. **Frontend Build & Public Serving:**
   * Execute `npm run build:pb`.
   * Open `http://localhost:8090` in an incognito window and verify the React application loads without console errors.
3. **Authentication Verification:**
   * Log in with test student credentials.
   * Verify JWT session persistence across page refreshes (`F5`).
4. **Protected File Submission Test:**
   * Submit a test PDF (< 25 MB).
   * Confirm the file is stored under `backend/pocketbase/pb_data/storage/`.
   * Verify that copying the direct file link into an unauthenticated browser returns `403 Forbidden`.
5. **Cloudflare Tunnel Test:**
   * Start the tunnel: `npm run tunnel`.
   * Access the public HTTPS tunnel URL from a mobile device on cellular data.
   * Perform end-to-end login, submission, and document download.
