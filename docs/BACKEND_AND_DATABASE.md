# Backend, Database & AI Service Architecture

This document describes every database table, storage bucket, the offline fallback system, and the AI document analysis pipeline — all verified against the actual codebase.

---

## 1. Supabase Configuration

### Environment Variables

| Variable | Used By | Description |
|:---|:---|:---|
| `VITE_SUPABASE_URL` | Frontend (`src/lib/supabase.ts`) + Backend (`backend/config/supabase.ts`) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend + Backend | Public anonymous key for Supabase client |
| `VITE_GROQ_API_KEY` | Backend (`backend/services/aiService.ts`) | Groq API key (primary AI model) |
| `GEMINI_API_KEY` | Backend (`backend/services/aiService.ts`) | Google Gemini API key (fallback AI model) |

### Client Initialization

**Frontend** ([`src/lib/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/supabase.ts)):
```typescript
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Backend** ([`backend/config/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/supabase.ts)):
```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 2. Database Tables

### `student_documents` (Runtime — used by `submissionStorage.ts`)

This is the **primary working table** used by the live application for student submissions and adviser reviews.

| Column | Type | Description |
|:---|:---|:---|
| `id` | UUID/text (PK) | Auto-generated document ID |
| `student_name` | text | Full student name |
| `course` | text | Program code (e.g. "BSIT", "BSCpE") |
| `doc_type` | text | Template name (e.g. "Student Application Letter", "DTR Form (Week 1)") |
| `status` | text | `'Pending Adviser Review'` \| `'Pending Final Approval'` \| `'Revision Required'` \| `'Approved'` |
| `urgency` | text | `'low'` \| `'medium'` \| `'high'` |
| `file_path` | text | Supabase Storage path (e.g. `submissions/filename.pdf`) |
| `ai_status` | text | `'Pending'` \| `'Processing'` \| `'Completed'` \| `'Failed'` |
| `ai_findings` | jsonb | Structured AI analysis results (see AiFindings type) |
| `adviser_feedback` | text | Adviser review comments |
| `comments` | jsonb | Array of `{ author, msg, time }` comment objects |
| `created_at` | timestamptz | Submission timestamp |

### `template_metadata` (Runtime — used by `templateStorage.ts`)

Stores admin-managed template catalog entries.

| Column | Type | Description |
|:---|:---|:---|
| `id` | text (PK) | Template identifier |
| `name` | text | Display name |
| `group` | text | Phase group (`'Before OJT Templates'`, `'In OJT Templates'`, `'Final Templates'`) |
| `type` | text | `'DOCX'` \| `'PDF'` \| `'XLSX'` |
| `filename` | text | Original filename on disk |
| `version` | text | Version string (e.g. "v1.0") |
| `size` | text | Human-readable size (e.g. "320 KB") |
| `updated` | text | Last update date string |

### Migration-Defined Tables (from [`supabase/migrations/20260724_template_platform.sql`](file:///c:/Users/johnd/Downloads/MainCode/supabase/migrations/20260724_template_platform.sql))

These tables support the structured document template system:

#### `document_templates`
| Column | Type | Description |
|:---|:---|:---|
| `id` | UUID (PK) | Template ID |
| `name` | text | Template name |
| `category` | text | Category (default: "General") |
| `phase` | text | `'before_ojt'` \| `'in_ojt'` \| `'final'` (CHECK constraint) |
| `current_version_id` | UUID (FK) | Points to active `document_template_versions.id` |
| `created_at` | timestamptz | Creation timestamp |

#### `document_template_versions`
| Column | Type | Description |
|:---|:---|:---|
| `id` | UUID (PK) | Version ID |
| `template_id` | UUID (FK) | Parent template |
| `version_number` | int | Monotonically increasing version number |
| `schema_json` | jsonb | `StructuredDocument` layout tree |
| `mapping_rules` | jsonb | Array of `MappingRule` objects |
| `status` | text | `'draft'` \| `'needs_mapping'` \| `'ready'` \| `'published'` \| `'archived'` |
| `published_by` | text | Publisher identity |
| `created_at` | timestamptz | Creation timestamp |

#### `document_instances`
| Column | Type | Description |
|:---|:---|:---|
| `id` | UUID (PK) | Instance ID |
| `template_id` | UUID (FK) | Parent template (ON DELETE RESTRICT) |
| `template_version_id` | UUID (FK) | Specific version used (ON DELETE RESTRICT) |
| `student_id` | text | Student identifier |
| `student_name` | text | Student display name |
| `instance_version` | int | Optimistic locking counter (must increment by exactly 1) |
| `field_values` | jsonb | Key-value `FieldValues` map |
| `status` | text | `'draft'` \| `'submitted'` \| `'adviser_review'` \| `'revision_required'` \| `'approved'` \| `'archived'` |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Key Constraints:**
- Unique index prevents duplicate active submissions: `(student_id, template_id) WHERE status NOT IN ('archived','approved')`
- Trigger validates `template_version_id` belongs to stated `template_id`
- Non-admin/adviser roles cannot modify `template_id`, `template_version_id`, or `student_id` on existing instances
- Row Level Security (RLS) enabled on all three tables

---

## 3. Storage Buckets

| Bucket | Purpose | Used By |
|:---|:---|:---|
| `student_submissions` | Student-uploaded PDFs, DOCXs, and supervisor-signed XLSXs | `submissionStorage.ts` |
| `templates` | Admin-uploaded master templates + optional `${id}_pdf_backup` files | `templateStorage.ts` |

---

## 4. Offline Fallback Architecture

### `submissionStorage.ts` Fallback Chain
1. **Upload attempt**: Tries Supabase Storage `.upload()` first
2. **DB insert attempt**: Tries Supabase `.insert()` on `student_documents`
3. **If either fails**: Returns a mock `StudentDocument` with a local `doc-${Date.now()}` ID
4. **Published DTRs**: Cached in `localStorage` under key `published_dtrs` for immediate local display

### `templateStorage.ts` Fallback Chain
1. **File storage**: Supabase Storage → falls back to raw IndexedDB (`CapstoneTemplateDB`)
2. **Metadata**: Supabase DB `template_metadata` → falls back to `localStorage`
3. **IndexedDB implementation**: Uses native `indexedDB.open()` API with a single object store `templates_store`
4. **File retrieval**: Handles `Blob`, `ArrayBuffer`, and typed array return types from IDB

---

## 5. AI Review Assistant Pipeline

### Flow (Backend → Supabase → Client)

```
Client: aiService.analyzeDocument(docId, pdfUrl, metadata)
  │  POST /api/analyze
  ▼
Backend: routes/analyze.ts
  │
  ├─ 1. UPDATE student_documents SET ai_status='Processing', ai_findings=null WHERE id=docId
  ├─ 2. fetch(pdfUrl) → Buffer
  ├─ 3. extractTextFromPdfBuffer(buffer) via pdf-parse
  ├─ 4. analyzeDocumentText(text, metadata) via aiService.ts
  │     ├─ Try Groq API (llama-3.3-70b-versatile, temp 0.1, JSON mode)
  │     └─ Fallback: Gemini API (gemini-1.5-flash, temp 0.1, JSON MIME)
  ├─ 5. UPDATE student_documents SET ai_status='Completed', ai_findings={...}
  └─ 6. Return JSON findings to client
```

### Client-Side AI Service ([`src/lib/aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/aiService.ts))
- Simple proxy that calls `POST /api/analyze` with `{ docId, pdfUrl, studentName, course, docType, company }`
- Returns typed `AiFindings` to the UI
- Used by `AiAssistantPanel.tsx` and `UnifiedReviewSession.tsx`

### AiFindings Schema
```typescript
interface AiFindings {
  overallAssessment: 'Good' | 'Needs Attention' | 'Critical Issues';
  grammarIssues: number;              // Count of grammar/spelling errors
  missingInformation: string[];       // List of missing items
  consistencyIssues: string[];        // Metadata vs document mismatches
  recommendations: string[];          // Actionable suggestions
  confidence: 'High' | 'Medium' | 'Low';
}
```

---

## 6. `submissionStorage` API Reference

All methods are on the exported `submissionStorage` object in [`src/lib/submissionStorage.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/submissionStorage.ts):

| Method | Returns | Description |
|:---|:---|:---|
| `uploadSubmission(file, studentName, course, docType, urgency)` | `Promise<StudentDocument>` | Upload file + insert DB record |
| `publishSignedDTR(studentName, course, weekNumber, xlsxBlob)` | `Promise<StudentDocument>` | Publish supervisor-signed DTR XLSX |
| `getPublishedDTRs()` | `StudentDocument[]` | Read locally cached DTR records |
| `getFileUrl(filePath)` | `string` | Get Supabase Storage public URL |
| `getPendingDocuments()` | `Promise<StudentDocument[]>` | Fetch pending adviser review docs |
| `getPendingAdminDocuments()` | `Promise<StudentDocument[]>` | Fetch pending + approved admin docs |
| `getDocumentById(id)` | `Promise<StudentDocument>` | Get single document by ID |
| `getLatestDocumentByType(studentName, docType)` | `Promise<StudentDocument\|null>` | Latest doc by student + type |
| `updateDocumentStatus(id, status, feedback?)` | `Promise<void>` | Update status + optional feedback |
| `postComment(id, author, msg)` | `Promise<void>` | Append comment to document |
| `updateAiFindings(id, aiStatus, aiFindings)` | `Promise<void>` | Update AI analysis results |
