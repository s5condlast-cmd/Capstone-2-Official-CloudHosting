# Active Tasks & Development Roadmap

[← Back to Tasks Hub](README.md) | [Documentation Hub](../README.md) | [Task History & Changelog](TASK_HISTORY.md) | [System Map](../architecture/SYSTEM_MAP.md)

This roadmap tracks active priorities, ongoing implementation plans, and verification backlogs for the **STI Marikina Practicum Management System**. Completed milestones are permanently recorded in [`TASK_HISTORY.md`](TASK_HISTORY.md).

---

## 0. Current Priority: Attendance & Time In/Out Photo Evidence with Timestamp Verification

- [x] **Interactive Photo Proof & Watermark Engine** *(Completed Sep 23, 2026 — See [TASK_HISTORY.md](TASK_HISTORY.md))*:
  - [x] Implemented in-browser camera streaming (`navigator.mediaDevices.getUserMedia`) and mobile file capture.
  - [x] Generated client-side burned-in timestamp watermark via HTML5 Canvas (PST timestamp, Student Full Name, Student ID, Practicum Verification tag).
  - [x] Integrated stamped photo preview, removal, and inspect actions in Time In / Time Out workflows.
- [x] **Time In & Out UI Modernization** *(Completed Sep 23, 2026 — See [TASK_HISTORY.md](TASK_HISTORY.md))*:
  - [x] Asymmetric 2-column wireframe layout with 3 radial metric cards (`ProgressCircle`), 3 status filter pills (`All Records`, `Verified`, `Pending`) + live search input.
  - [x] Live digital clock display with Manila date and active shift state.
  - [x] Live elapsed shift timer and start timestamp display during active shifts.
  - [x] Shift Clock & Action Station positioned at top of sidebar dock, above the Trainee Information card (with cover banner and gender-aware Undraw avatar).
- [x] **Inspection Modal & Verification Queue** *(Completed Sep 23, 2026 — See [TASK_HISTORY.md](TASK_HISTORY.md))*:
  - [x] Photo evidence thumbnail column in attendance history table with high-resolution lightbox inspection modal.
  - [x] Reviewer queue inspection workflow for supervisors and administrators.

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

## 2. Role-Specific Dashboards & UI Polish

Student specification: [Simplified Student Dashboard Plan](STUDENT_DASHBOARD_SIMPLIFICATION_PLAN.md). Completed milestones recorded in [`TASK_HISTORY.md`](TASK_HISTORY.md).

- [ ] **Role-Specific Dashboards (shadcn `dashboard-01` baseline)**:
  - [ ] **Admin Dashboard**: Section metrics, interactive area chart, recent student activity table, and API key configuration card.
  - [ ] **Adviser Dashboard**: Advisory section stats, pending review queue, and student roster table.
  - [ ] **Supervisor Dashboard**: Attendance metrics, DTR digital signature queue, and intern performance table.
- [ ] **System-Wide UI Polish**:
  - [ ] Maintain responsive spacing, consistent cards, and dark/light theme consistency using theme-aware tokens (`text-foreground`, `border-zinc-200`).

---

## 3. Student Experience & Portal Refinement

- [x] **Document Performance Chart Deduplication & Zero-Stacking Layout** *(Completed Sep 24, 2026)*:
  - [x] Added `matchInstitutionalRequirement` canonical mapping to eliminate duplicate requirement drafts and submissions on the SVG score chart and drafts table.
  - [x] Consolidated scratch/untitled drafts to at most the latest active untitled draft, preventing multiple blank drafts from crowding the timeline.
  - [x] Implemented dynamic chart SVG width with minimum 92px horizontal spacing and `overflow-x-auto`, completely eliminating horizontal collisions between status pills and two-line deliverable labels.
  - [x] Ordered deliverables logically across practicum phases (Before OJT → In OJT → Final Phase → Custom/Drafts).
  - [x] Added an interactive "Active Deliverables" vs "All Requirements" view mode toggle in the chart header.

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
