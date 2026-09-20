# Active Tasks & Development Roadmap

[← Back to Tasks Hub](README.md) | [Documentation Hub](../README.md) | [Task History & Changelog](TASK_HISTORY.md) | [System Map](../architecture/SYSTEM_MAP.md)

This roadmap tracks active priorities, ongoing implementation plans, and verification backlogs for the **STI Marikina Practicum Management System**. Completed milestones are permanently recorded in [`TASK_HISTORY.md`](TASK_HISTORY.md).

---

## 0. Current Priority: Review Workflow and Quality Remediation

Detailed plans:

- [Centralized Document Review Center](DOCUMENT_REVIEW_CENTER_PLAN.md)
- [Code Quality and Production Readiness Remediation](CODE_QUALITY_REMEDIATION_PLAN.md)

- [ ] **P0 — Review case and revision integrity**:
  - [ ] Add stable review cases with immutable linked revisions, files, comments, and audit events.
  - [ ] Replace the current unrelated revision-upload behavior.
  - [ ] Enforce Student/Supervisor/Adviser assignments and workflow stages through RLS/RPCs.
- [ ] **P0 — Immediate security and contract fixes**:
  - [ ] Remove the global `supervisor_saved_signature` browser record and implement user/approval-bound signature handling.
  - [ ] Unify allowed upload types and size limits across UI, service, storage, and database validation.
  - [ ] Move renewable OneDrive credentials out of plaintext token files for production.
- [ ] **P1 — Central Review Center**:
  - [ ] Build one shared inbox/detail workspace for all sent/received files, revisions, comments, decisions, and history.
  - [ ] Add role adapters for Student, Supervisor, Adviser, and read-only Admin audit access.
  - [ ] Replace Weekly Journal mock review state as the first three-role workflow.
- [ ] **P1 — Verification and type-safety gate**:
  - [ ] Add real workflow, RLS, component, and browser interaction tests.
  - [ ] Separate `lint`, `typecheck`, and complete release `check` scripts.
  - [ ] Enable strict TypeScript for all new workflow modules and prevent the `any` baseline from increasing.
- [ ] **P2 — Maintainability refactor after behavior is protected**:
  - [ ] Split the 3,506-line toolbar, 1,990-line Student Dashboard, and duplicated header/footer logic into capability modules.
  - [ ] Remove mock arrays and page-local business rules from remaining production workflows.

---

## 1. Document Editor Production Hardening

Unified master specification: [Rich Document Editor Master Plan](RICH_DOCUMENT_EDITOR_PLAN.md).

- [ ] **Browser QA & Shortcut Coverage**:
  - [ ] Run authenticated browser QA in Chrome and Edge for every toolbar popover and keyboard shortcut.
  - [ ] Verify table row/column/cell commands with first, middle, and last cells in 1x1 and multi-row tables.
- [ ] **Media & Storage Persistence**:
  - [ ] Verify media URL/upload flows and replace data-URL persistence with durable object storage before enabling large files in production.
- [ ] **Speech-to-Text Clarification & Error Handling**:
  - [ ] Verify Web Speech API permission/error behavior on Windows, Android, and iOS; confirm strict restriction to Weekly Journal reflection entry.
- [ ] **Automated Integration & Export Tests**:
  - [ ] Add automated browser test coverage for save/reload, version restore, DOCX export, print-to-PDF, and locked-document read-only behavior.
- [ ] **Antigravity Verification Backlog**:
  - [ ] Audit every non-editor file claimed in prior sessions against current implementation before marking accepted.
  - [ ] If AI editing is requested, create separate security/design task covering authenticated routes, rate limits, provider configuration, selection-safe replacement, and audit logging.

---

## 2. Dashboard Redesign & UI Polish

Student specification: [Simplified Student Dashboard Plan](STUDENT_DASHBOARD_SIMPLIFICATION_PLAN.md).

- [ ] **Role-Specific Dashboards (shadcn `dashboard-01` baseline)**:
  - [ ] **Admin Dashboard**: Section metrics, interactive area chart, recent student activity table, and API key configuration card.
  - [ ] **Student Dashboard**: Replace the dense widget grid with three status metrics, one authoritative Next Action, compact phase progress, Needs Attention, and Recent Activity.
  - [ ] **Adviser Dashboard**: Advisory section stats, pending review queue, and student roster table.
  - [ ] **Supervisor Dashboard**: Attendance metrics, DTR digital signature queue, and intern performance table.
- [ ] **System-Wide UI Polish**:
  - [ ] Maintain responsive spacing, consistent cards, and dark/light theme consistency using theme-aware tokens (`text-primary`, `bg-primary`).

---

## 3. Student Experience & Portal Refinement

- [ ] **Student Dashboard Dynamic Database Sync**:
  - [ ] Derive requirements progress dynamically from Supabase `student_documents` and `user_profiles` rather than local mock state.
  - [ ] Synchronize real-time completed tasks between To-do checklist, submissions table, and modal.
  - [ ] Responsive testing across mobile (375px), tablet (768px), and desktop (1024px–1536px).
- [ ] **Document Workflow Component Standardization**:
  - [ ] Standardize all student document workflows via `StudentDocumentPage.tsx` (`src/components/compose/StudentDocumentPage.tsx`).
  - [ ] Ensure dynamic database state syncing on mount (`submissionStorage` status, remarks, comment history).
  - [ ] Enforce consistent empty states using `src/components/ui/EmptyState.tsx`.
- [ ] **Weekly Journal Speech-to-Text Voice Dictation**:
  - [ ] Integrate Web Speech API inside `WeeklyJournal.tsx` for reflection entry dictation.
  - [ ] Add interactive microphone toggle button with active listening pulse wave animation and error fallback.
  - [ ] Preserve strict scope: voice dictation applies strictly to **Weekly Journal reflection entries**, never to formal letter templates.

---

## 4. Document Digitization: Interactive Inputs for All 13 Templates

- [ ] **Phase 1: Before OJT Templates (8 templates)**:
  - [ ] Student Application Letter
  - [ ] Parent Consent Form (With Fee)
  - [ ] Parent Consent Form (Without Fee)
  - [ ] Student Consent Form (With Fee)
  - [ ] Student Consent Form (Without Fee)
  - [ ] MOA Template
  - [ ] Endorsement Letter
  - [ ] Proposal Letter
- [ ] **Phase 2: In OJT Templates (3 templates)**:
  - [ ] Journal Template (with voice dictation)
  - [ ] DTR Form
  - [ ] Training Plan Form
- [ ] **Phase 3: Final Templates (2 templates)**:
  - [ ] Integration Paper Template
  - [ ] Performance Appraisal Template
- [ ] **Pipeline Invariants**:
  - [ ] Interactive `AutoWidthInput` elements replacing literal blanks (`_{3,}`) and `<PLACEHOLDER>` tags.
  - [ ] Strict 30-word limit per input to protect document layout structure.
  - [ ] Print stylesheets (`@media print`) and PDF export preservation.
  - [ ] Sequential data extraction (`blankEdits`, `dateEdits`, `angleData`) and JSZip XML substitution.

---

## 5. Bulk Student Roster Import (Registrar Feature)

Detailed specification: [Bulk Student Roster Import Plan](BULK_ROSTER_IMPORT_PLAN.md).

- [ ] Implement CSV and XLSX upload parser with client-side header validation.
- [ ] Build chunked backend provisioning endpoint (`/api/admin/bulk-register`) processing 25 records per batch.
- [ ] Add rollback/error reporting displaying row-by-row success/failure badges in admin UI.
- [ ] Export generated one-time credentials table for authorized administrator handoff.

---

## 6. External Notifications & Inactivity Alerts

- [ ] **Email Notification Engine (Microsoft Graph Outlook Integration)**:
  - [ ] Student alerts: Notification when adviser approves or requests revision on a submission.
  - [ ] Supervisor alerts: Notification when intern submits weekly DTR for signature.
  - [ ] Adviser alerts: Notification when students submit new documents.
- [ ] **Inactivity & Deadline Proactive Alerts**:
  - [ ] Automated reminder to students if no Weekly Journal has been logged for 5+ days.
  - [ ] Approaching MOA submission deadline reminder alerts.
  - [ ] Missing requirement warning alerts before end of practicum phase.

---

## 7. Capstone Manuscript & Paper Alignment (`Main_Document.md`)

- [ ] **Institutional Templates Matrix Alignment**:
  - [ ] Update Section 1.4 & 1.5 in `Main_Document.md` to reflect the official 13 Institutional Templates Matrix.
  - [ ] Document format (.docx, .xlsx, .pdf), state gates, and compliance approval sequence.
- [ ] **Technical Background & Software Resources Rectification**:
  - [ ] Update tech stack citations to React 19.0 + Vite 6.0 + Express.js REST API Server.
  - [ ] Document Tailwind CSS v4.0 and theme variables (`--theme-primary`).
  - [ ] Document native Web Speech API for Weekly Journal reflection.
  - [ ] Document Dual-Model Fallback AI Architecture (Groq Llama-3.3-70B primary with Google Gemini 1.5 Flash fallback).
- [ ] **Figure & Diagram De-Collision**:
  - [ ] Resolve duplicate Figure 15: Preserve ERD diagram; renumber Landing Page Storyboard to Figure 17.
- [ ] **Appendices Population**:
  - [ ] Populate Appendix A (Resource Persons): Table of interviewed faculty and coordinators.
  - [ ] Populate Appendix B (Personal Technical Vitae): Complete curriculum vitae for proponents.

---

## Related Documentation & Cross-References

- [Tasks Index](README.md) — Category overview
- [Task History & Changelog](TASK_HISTORY.md) — Chronological log of completed milestones
- [Rich Document Editor Master Plan](RICH_DOCUMENT_EDITOR_PLAN.md) — Editor technical specification
- [Bulk Student Roster Import Plan](BULK_ROSTER_IMPORT_PLAN.md) — Registrar batch provisioning architecture
- [Master Documentation Hub](../README.md) — Central documentation portal
