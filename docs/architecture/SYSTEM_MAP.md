---
title: "System Map, Code Locator & Problem-Fix Register"
description: "Comprehensive engineering map, quick code locator for all routes and components, and pre-emptive solutions for known risks."
tags:
  - sti-ojt
  - system-map
  - code-locator
  - problem-register
  - troubleshooting
aliases:
  - "System Map"
  - "Code Locator"
  - "Problem-Fix Register"
created: 2026-08-26
updated: 2026-09-04
---

# 🗺️ System Map, Code Locator & Problem-Fix Register

[← Back to Documentation Hub](../README.md) | [Architecture Overview](ARCHITECTURE.md) | [Backend & Database](BACKEND_AND_DATABASE.md) | [Document Workflows](DOCUMENT_WORKFLOWS.md)

A comprehensive engineering map of the **Capstone-2 CloudHosting OJT Management System**. Use this document to quickly locate any code, route, or database entity, and to anticipate and immediately resolve known technical risks and "about-to-be" problems.

---

## 🎯 Code Locator — Find Any Feature Fast

### 1. Frontend Pages & Routes by User Role

All routes are defined in [`src/App.tsx`](../../src/App.tsx).

#### A. Student Portal (`/student/*`)

| Route | Main Component | Description | Key Subcomponents / Utilities |
| :--- | :--- | :--- | :--- |
| `/student` | [`StudentDashboard.tsx`](../../src/pages/student/StudentDashboard.tsx) | Student homepage, checklist hero card, placement progress, compact sidebar | `Card.tsx`, `Badge.tsx`, `dialog.tsx` |
| `/student/application-letter` | [`StudentApplicationLetter.tsx`](../../src/pages/student/StudentApplicationLetter.tsx) | Before OJT application letter submission & preview | `StudentDocumentPage.tsx`, `DocumentWorkflow.tsx` |
| `/student/consent` | [`ParentConsentForm.tsx`](../../src/pages/student/LetterOfConsent.tsx) | Parent/student consent form (with/without fee) | `StudentDocumentPage.tsx`, `DocumentWorkflow.tsx` |
| `/student/moa` | [`MOATemplate.tsx`](../../src/pages/student/MemorandumOfAgreement.tsx) | Memorandum of Agreement workflow | `StudentDocumentPage.tsx`, `DocumentWorkflow.tsx` |
| `/student/endorsement` | [`EndorsementLetter.tsx`](../../src/pages/student/STIOJTEndorsementLetter.tsx) | Endorsement letter upload & status | `StudentDocumentPage.tsx`, `DocumentWorkflow.tsx` |
| `/student/proposal` | [`ProposalLetterToTheIndustry.tsx`](../../src/pages/student/ProposalLetterToTheIndustry.tsx) | Industry proposal letter workflow | `StudentDocumentPage.tsx`, `DocumentWorkflow.tsx` |
| `/student/journal` | [`WeeklyJournal.tsx`](../../src/pages/student/WeeklyJournal.tsx) | Weekly OJT journal submission & AI grammar feedback | `AiAssistantPanel.tsx`, `submissionStorage.ts` |
| `/student/dtr` | [`DailyTimeRecord.tsx`](../../src/pages/student/DTR.tsx) | Time tracking, daily punch logs, rendered hours | `excelGenerator.ts`, `submissionStorage.ts` |
| `/student/training-plan` | [`TrainingPlanForm.tsx`](../../src/pages/student/OJTTrainingPlan.tsx) | Training plan submission & company task schedule | `StudentDocumentPage.tsx` |
| `/student/evaluation` | [`PerformanceAppraisal.tsx`](../../src/pages/student/PerformanceAppraisal.tsx) | Supervisor performance appraisal review | `StudentDocumentPage.tsx` |
| `/student/completion` | [`IntegrationPaper.tsx`](../../src/pages/student/IntegrationPaper.tsx) | Final integration paper submission & clearance sign-off | `StudentDocumentPage.tsx` |

#### B. Adviser Portal (`/adviser/*`)

| Route | Main Component | Description | Key Subcomponents / Utilities |
| :--- | :--- | :--- | :--- |
| `/adviser` | [`AdviserDashboard.tsx`](../../src/pages/adviser/AdviserDashboard.tsx) | Summary of assigned students, pending approvals, analytics | `Card.tsx`, `Badge.tsx` |
| `/adviser/review` | [`ReviewDocs.tsx`](../../src/pages/adviser/ReviewDocs.tsx) | Document review queue with AI audit assistance | `DocumentReviewSession.tsx`, `AiAssistantPanel.tsx` |
| `/adviser/approvals` | [`Approvals.tsx`](../../src/pages/adviser/Approvals.tsx) | Official sign-offs and status approvals | `submissionStorage.ts` |
| `/adviser/students` | [`MyStudents.tsx`](../../src/pages/adviser/MyStudents.tsx) | Roster of assigned practicum students | `Card.tsx`, `Badge.tsx` |

#### C. Supervisor Portal (`/supervisor/*`)

| Route | Main Component | Description | Key Subcomponents / Utilities |
| :--- | :--- | :--- | :--- |
| `/supervisor` | [`SupervisorDashboard.tsx`](../../src/pages/supervisor/SupervisorDashboard.tsx) | Company dashboard, intern attendance rates, pending DTRs | `Card.tsx`, `Badge.tsx` |
| `/supervisor/dtr` | [`DTRApproval.tsx`](../../src/pages/supervisor/DTRApproval.tsx) | Daily Time Record review, signature stamping & export | `excelGenerator.ts`, `DTRApproval.tsx` |
| `/supervisor/journal` | [`WeeklyJournalReview.tsx`](../../src/pages/supervisor/WeeklyJournalReview.tsx) | Journal inspection, weekly rating, supervisor comments | `Card.tsx`, `Badge.tsx` |
| `/supervisor/completion` | [`InternshipCompletion.tsx`](../../src/pages/supervisor/InternshipCompletion.tsx) | Final intern clearance sign-off and certificate of completion | `DTRApproval.tsx` |

#### D. Admin Portal (`/admin/*`)

| Route | Main Component | Description | Key Subcomponents / Utilities |
| :--- | :--- | :--- | :--- |
| `/admin` | [`AdminDashboard.tsx`](../../src/pages/admin/AdminDashboard.tsx) | Global system health, student counts, company partners | `Card.tsx`, `StatCard.tsx` |
| `/admin/templates` | [`Templates.tsx`](../../src/pages/admin/Templates.tsx) | Upload/download official DOCX and PDF backup templates | 4-button action grid, `templateStorage.ts` |
| `/admin/verification` | [`DocumentVerification.tsx`](../../src/pages/admin/DocumentVerification.tsx) | Institutional registrar/dean clearance queue | `submissionStorage.ts` |
| `/admin/users` | [`UserManagement.tsx`](../../src/pages/admin/UserManagement.tsx) | Manage student, adviser, supervisor, and admin accounts | `supabase.ts` |
| `/admin/companies` | [`CompanyManagement.tsx`](../../src/pages/admin/CompanyManagement.tsx) | Manage approved host training establishments (HTEs) | `Badge.tsx` |

#### E. Shared Pages & Utilities

| Route / Feature | File Location | Purpose |
| :--- | :--- | :--- |
| `/calendar` | [`src/pages/shared/CalendarPage.tsx`](../../src/pages/shared/CalendarPage.tsx) | Interactive practicum calendar (Month, Week, Day, Agenda views) |
| `/notifications` | [`src/pages/shared/Notifications.tsx`](../../src/pages/shared/Notifications.tsx) | System announcements and personal submission notifications |
| `/login` | [`src/pages/public/Login.tsx`](../../src/pages/public/Login.tsx) | Authentication and role-based portal routing |

---

### 2. Document Engines & Generators

| Engine | Source File | Key Responsibilities |
| :--- | :--- | :--- |
| **DOCX Previewer** | [`src/components/review/DocxViewer.tsx`](../../src/components/review/DocxViewer.tsx) | In-browser DOCX rendering using `docx-preview`; wraps text nodes in `.editable-placeholder` spans; hides preview `<header>` |
| **DOCX Generator** | [`src/lib/documentGenerator.ts`](../../src/lib/documentGenerator.ts) | Reads `.docx` binary buffer with `JSZip`, replaces blanks and dates, runs `easy-template-x` with `<` `>` delimiters, generates signature block tables |
| **PDF Workspace** | [`src/components/review/EmbedPdfWorkspace.tsx`](../../src/components/review/EmbedPdfWorkspace.tsx) | Canvas viewer using `@embedpdf/react-pdf-viewer`; requires explicit `w-full h-full` style |
| **Excel DTR Generator** | [`src/lib/excelGenerator.ts`](../../src/lib/excelGenerator.ts) | Generates `.xlsx` logs with ExcelJS; embeds dark ink signatures with strict 1:1 cell boundary anchors |
| **Printable Inputs** | [`src/components/compose/FillableField.tsx`](../../src/components/compose/FillableField.tsx) | Dynamic text input that measures width offscreen; toggles `data-print-text` for print layouts |

---

### 3. Backend & Cloud Infrastructure

| Layer | Source File | Purpose |
| :--- | :--- | :--- |
| **Serverless Entrypoint** | [`api/server.ts`](../../api/server.ts) | Vercel Serverless Function proxy exporting Express `app` |
| **Express Server** | [`backend/server.ts`](../../backend/server.ts) | Local dev server running on port 3001; wraps `app.listen()` in `!process.env.VERCEL` |
| **AI Document Analyzer** | [`backend/routes/analyze.ts`](../../backend/routes/analyze.ts) | Parses uploaded PDF text with `pdf-parse`; audits grammar and requirements using Groq (`llama-3.3-70b`) with Gemini fallback |
| **Supabase Client** | [`src/lib/supabase.ts`](../../src/lib/supabase.ts) | Client-side database and storage connection |
| **Fallback Storage** | [`src/lib/submissionStorage.ts`](../../src/lib/submissionStorage.ts) | Offline fallback layer syncing Supabase with local state |
| **Cloudinary Router** | [`backend/routes/cloudinary.ts`](../../backend/routes/cloudinary.ts) | Server-side secure file upload endpoint to Cloudinary CDN |

---

## ⚠️ Known Risks, Upcoming Problems & Pre-Emptive Fixes

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FAILURE MODE & RISK MATRIX                         │
├──────────────────────────┬───────────────────────┬──────────────────────────┤
│ Problem / Risk Area      │ Primary Cause         │ Pre-Emptive Solution     │
├──────────────────────────┼───────────────────────┼──────────────────────────┤
│ 1. Word Placeholder Split│ Word XML text runs    │ easy-template-x with < > │
│ 2. Chrome Print Shrink   │ input[size=1] engine  │ [data-print-text] span   │
│ 3. Excel Signature Shift │ Fractional anchors    │ Exact integer 6.0 to 7.0 │
│ 4. Vercel Port Collision │ app.listen() in cloud │ Guard with !process.env  │
│ 5. Supabase RLS Slowness │ auth.uid() per row    │ (SELECT auth.uid())      │
│ 6. Black Screen PDF View │ Collapsed 0px canvas  │ Explicit w-full h-full   │
│ 7. React 19 Motion Error │ onAnimationStart type │ Omit<HTMLMotionProps, ..>│
│ 8. OneDrive Token Expiry │ 60m OAuth2 timeout    │ Auto-refresh retry loop  │
└──────────────────────────┴───────────────────────┴──────────────────────────┘
```

---

### Problem 1 — Word Document Tags Split Across XML Nodes (`<STUDENT_NAME>`)

* **Symptoms**: When downloading or filling a DOCX, tags like `<STUDENT NAME>` remain unpopulated or corrupt the document.
* **Root Cause**: Microsoft Word splits text runs into separate XML elements (e.g. `<w:t><STUDENT</w:t><w:t>NAME></w:t>`) when a user edits or saves the document. Plain regex string replacement will miss the tag.
* **Fix**:
  * In [`src/lib/documentGenerator.ts`](../../src/lib/documentGenerator.ts), use `easy-template-x` configured with custom angle delimiters:

    ```typescript
    const handler = new TemplateHandler({
      delimiters: { tagStart: "<", tagEnd: ">" }
    });
    const docBuffer = await handler.process(templateBuffer, angleData);
    ```

  * For sequential blanks (`____`), replace directly inside `word/document.xml` using `JSZip`.

---

### Problem 2 — Form Input Truncation When Printing to PDF

* **Symptoms**: Printable form fields (`FillableField`) get cut off to 1 character (~15px wide) when saving to PDF via the browser print dialogue (`Ctrl + P`).
* **Root Cause**: The Chromium print engine ignores dynamic `<input size={...}>` calculations and forces a single-character baseline during page rendering.
* **Fix**:
  * In [`src/index.css`](../../src/index.css), hide raw inputs and reveal the offscreen measurement span during print:

    ```css
    @media print {
      input.auto-width-input {
        display: none !important;
      }
      [data-print-text] {
        display: inline !important;
        font-weight: 600 !important;
      }
    }
    ```

---

### Problem 3 — Excel DTR Signature Shifting or Stretching

* **Symptoms**: Digital canvas signatures embedded in exported Excel DTR sheets appear shifted to the left, squished, or cropped incorrectly.
* **Root Cause**: ExcelJS two-cell anchors using fractional offsets (`col: 6.2`) cause Microsoft Excel's rendering engine to miscalculate column bounds. Also, white background pixels around the signature draw frame prevent accurate boundary calculation.
* **Fix**:
  * In [`src/lib/excelGenerator.ts`](../../src/lib/excelGenerator.ts), apply luminance filtering to crop only dark ink pixels:

    ```typescript
    const isInk = alpha > 30 && (r < 200 || g < 200 || b < 200);
    ```

  * Always use strict 1:1 integer column boundaries:

    ```typescript
    tl: { col: 6.0, row: rowIndex - 1 },
    br: { col: 7.0, row: rowIndex }
    ```

---

### Problem 4 — Vercel Serverless Function Crash on Startup

* **Symptoms**: Vercel deployment reports `FUNCTION_INVOCATION_FAILED` or hangs on incoming requests.
* **Root Cause**: `app.listen(PORT)` is called in the serverless environment where Vercel automatically manages the HTTP listener, causing port collision errors.
* **Fix**:
  * In [`backend/server.ts`](../../backend/server.ts), guard the listener:

    ```typescript
    if (!process.env.VERCEL) {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
    export default app;
    ```

  * In [`api/server.ts`](../../api/server.ts), re-export the app instance:

    ```typescript
    import app from '../backend/server';
    export default app;
    ```

---

### Problem 5 — Supabase RLS Query Slowdown as Records Grow

* **Symptoms**: Document queries become sluggish over time as more student rows are created.
* **Root Cause**: Calling `auth.uid()` directly inside row security policies forces Postgres to evaluate the authentication function on every single row scan.
* **Fix**:
  * In Supabase SQL migrations, always wrap auth evaluations in subqueries `(SELECT auth.uid())` so Postgres calculates user identity once per query (InitPlan optimization):

    ```sql
    CREATE POLICY "Students view own documents"
    ON student_documents FOR SELECT
    USING (student_id = (SELECT auth.uid()));
    ```

---

### Problem 6 — PDF Canvas Collapses to 0px (Black Screen)

* **Symptoms**: Embedded PDF viewer displays a solid black box or blank white space.
* **Root Cause**: The `@embedpdf/react-pdf-viewer` canvas does not have intrinsic CSS dimensions and collapses to 0px if the parent container doesn't specify explicit sizing.
* **Fix**:
  * In [`src/components/review/EmbedPdfWorkspace.tsx`](../../src/components/review/EmbedPdfWorkspace.tsx), always apply explicit dimensions directly:

    ```tsx
    <PDFViewer
      className="w-full h-full min-h-[500px]"
      style={{ width: '100%', height: '100%' }}
    />
    ```

---

### Problem 7 — React 19 vs. Framer Motion Prop Type Collision

* **Symptoms**: `npm run lint` fails with `TS2322: Type '...' is not assignable to type 'HTMLMotionProps'`.
* **Root Cause**: React 19 introduced updated signatures for `onAnimationStart`, conflicting with Framer Motion's internal animation definition handlers.
* **Fix**:
  * Type all motion-wrapped primitives using `Omit`:

    ```typescript
    interface CustomMotionProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
      // custom props
    }
    ```

---

### Problem 8 — Microsoft OneDrive Token Expiry & Sync Throttling

* **Symptoms**: Automatic cloud backup to OneDrive fails silently after 1 hour of server uptime, or large batch uploads fail with HTTP 429.
* **Root Cause**: Microsoft Graph OAuth2 access tokens expire every 3600 seconds (60 minutes). Sending rapid sequential file uploads triggers Microsoft's cloud rate-limiting.
* **Fix**:
  * Implement an automatic token refresh interceptor in the OneDrive service:

    ```typescript
    if (Date.now() >= tokenExpiresAt - 60000) {
      await refreshAccessToken();
    }
    ```

  * Batch file syncs in queues of 3 with exponential backoff on HTTP 429.

---

## 🛠️ Rapid Diagnostic Cheat Sheet

When troubleshooting an issue, follow this 3-step diagnostic sequence:

1. **Type & Compilation Check**:

   ```bash
   npm run lint
   # (Runs tsc --noEmit: catches missing imports, prop mismatches, broken types)
   ```

2. **Git Working Tree Check**:

   ```bash
   git status
   # (Confirms branch, uncommitted changes, or deleted assets)
   ```

3. **Backend Health Check**:

   ```bash
   curl http://localhost:3001/api/health
   # (Verifies Express API server status and database connectivity)
   ```

---

## Related Documentation & Cross-References

- [System Architecture Overview](ARCHITECTURE.md) — High-level architecture and directory map
- [Backend & Database Architecture](BACKEND_AND_DATABASE.md) — Supabase schemas and RLS policies
- [Document Workflows & Template Generation](DOCUMENT_WORKFLOWS.md) — 13-template inventory and DOCX pipeline
- [Feature Guides Index](../features/README.md) — Visual dataflow documentation for all 8 core features
- [Vercel Deployment Guide](../deployment/DEPLOYMENT_AND_VERCEL.md) — Serverless backend compatibility
- [Cloudinary Document Storage Integration](../deployment/CLOUDINARY_INTEGRATION_SUMMARY.md) — Cloud document storage and CDN
