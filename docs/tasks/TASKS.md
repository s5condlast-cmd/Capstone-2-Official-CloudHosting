# Active Tasks & Development Roadmap

## Document Editor: Plate Audit and Remediation

Production-readiness follow-up: [Rich editor production and DOCX/PDF fidelity plan](RICH_EDITOR_PRODUCTION_PLAN.md). This defines the proposed implementation order and certification gates for official school templates.

- [x] Scan the official Plate component catalogue (47 editor UI components and 38 node components) and map it to the portal's `platejs@53.3.11` implementation.
- [x] Publish the detailed capability/status matrix in [`docs/PLATE_EDITOR_COMPONENT_AUDIT.md`](../PLATE_EDITOR_COMPONENT_AUDIT.md).
- [x] Register visible Plate renderers for all toolbar-facing blocks, inline nodes, void nodes, and text marks.
- [x] Replace incompatible/duplicated toolbar transforms with a single Plate v53 command layer.
- [x] Fix bulleted and numbered lists to use valid nested list structures.
- [x] Make fixed/floating toolbar active states respond to editor value and selection changes.
- [x] Fix existing-draft OCC revision initialization, concurrent flush handling, version snapshots, history restore, and submission locking.
- [x] Add editor runtime regression tests and include them in `npm run test:editor`.
- [ ] Run authenticated browser QA in Chrome and Edge for every toolbar popover and keyboard shortcut.
- [ ] Verify table row/column/cell commands with first, middle, and last cells in 1x1 and multi-row tables.
- [ ] Verify media URL/upload flows and replace data-URL persistence with durable object storage before enabling large files in production.
- [ ] Verify speech-to-text permission/error behavior on Windows, Android, and iOS; confirm whether it belongs in the general editor or only the Weekly Journal.
- [ ] Add automated browser coverage for save/reload, version restore, DOCX export, print-to-PDF, and locked-document read-only behavior.

### Antigravity `docs/Change.md` Verification Backlog

- [x] Confirm that `docs/Change.md` is a historical claim rather than the current file inventory.
- [x] Confirm that `ai-menu.tsx`, `backend/routes/aiEditor.ts`, and `/api/ai/editor-assist` are absent and annotate the change log.
- [x] Confirm that the current toolbar supersedes the old source snapshot embedded in `docs/Change.md`.
- [ ] Audit every non-editor file claimed by Antigravity against the current implementation before marking it accepted.
- [ ] Decide whether to archive the embedded source dump in `docs/Change.md` and replace it with commit links plus a concise, verified change log.
- [ ] If AI editing is requested again, create a separate security/design task covering authenticated routes, rate limits, provider configuration, streaming, selection-safe replace/insert, and audit logging.

---

[←  Back to Documentation Hub](../README.md) | [Task History & Completed Logs](TASK_HISTORY.md) | [System Map](../architecture/SYSTEM_MAP.md) | [Feature Guides](../features/README.md)

---

## 📅 Calendar Page & Scheduling

- [x] Calendar sidebar mini calendar (restored original `<Calendar />`)
- [x] Calendar filter cards (circular check badges, layout fix)
- [x] Agenda view (continuous day-by-day, clean typography, white Today badge)
- [x] Toolbar date heading (editorial split typography)
- [x] Remove user email from header & sidebar
- [x] Widen search command palette button

---

## ➕ Add Event Modal (Calendar)

- [x] Fix date picker — replace plain `<input type="date">` with a proper calendar date picker (shadcn Popover + `<Calendar />`)
- [x] Fix time setter — replace plain text input with structured time picker (`DatePickerTime` pattern with `FieldGroup`)

---

## 📊 Dashboard Redesign & UI Polish

- [ ] Implement role-specific dashboards using shadcn `dashboard-01` components with clean typography and layout:
  - [ ] Admin Dashboard (Section cards, interactive area chart, recent student activity table, API key config card)
  - [ ] Student Dashboard (Refined stats, requirement timeline, company deployment info, compact sidebar)
  - [ ] Adviser Dashboard (Advisory stats, pending review queue, student roster table)
  - [ ] Supervisor Dashboard (Attendance metrics, DTR approval queue, intern performance table)
- [ ] General UI polish across all pages (responsive spacing, consistent cards, dark/light theme consistency)

---

## 🎓 Student Experience & Portal Refinement

- [ ] Refine Student Dashboard components and interactions:
  - [ ] Dynamic database sync for requirements progress (derive stats from Supabase rather than static state)
  - [ ] Real-time completed tasks sync between To-do checklist, submissions table, and modal
  - [ ] Responsive polish across mobile (375px), tablet (768px), and laptop (1024px–1536px)
- [ ] Standardize all student document workflows via `StudentDocumentPage.tsx`:
  - [ ] Eliminate layout duplication and ensure consistent action bars, preview panels, and upload triggers
  - [ ] Dynamic database state syncing on mount (`submissionStorage` status, remarks, comment history)
  - [ ] Proper empty states using standard `src/components/ui/EmptyState.tsx`
- [ ] **Speech-to-Text Voice Dictation (Weekly Journal Only)**:
  - [ ] Integrate Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) inside `WeeklyJournal.tsx`
  - [ ] Interactive microphone record/pause toggle button beside the reflection entry field
  - [ ] Real-time live transcript streaming with voice-to-text appending into the journal text body
  - [ ] Microphone permission request handling, active listening pulse wave animation, and error feedback
  - [ ] Strict scope enforcement: Speech-to-text is strictly restricted to **Weekly Journal reflection entry only** (never applied to other formal fill-in-the-blank letter templates)

---

## 📄 Document Digitization: Interactive Inputs for All Templates

- [ ] Convert all official OJT templates across the 3 phases into digital interactive fill-in-the-blank inputs:
  - [ ] **Phase 1: Before OJT Templates**
    - [ ] Student Application Letter
    - [ ] Parent Consent Form (With Fee)
    - [ ] Parent Consent Form (Without Fee)
    - [ ] Student Consent Form (With Fee)
    - [ ] Student Consent Form (Without Fee)
    - [ ] MOA Template
    - [ ] Endorsement Letter
    - [ ] Proposal Letter
  - [ ] **Phase 2: In OJT Templates**
    - [ ] Journal Template (with Speech-to-Text voice dictation)
    - [ ] DTR Form
    - [ ] Training Plan Form
  - [ ] **Phase 3: Final Templates**
    - [ ] Integration Paper Template
    - [ ] Performance Appraisal Template
- [ ] Implement established DOCX template editing & printable form field pattern:
  - [ ] Interactive `AutoWidthInput` elements replacing literal blanks (`_{3,}`) and `<PLACEHOLDER>` tags
  - [ ] Strict 30-word limit per input to prevent document layout distortion
  - [ ] Print stylesheets (`@media print`) and PDF export preservation
  - [ ] Sequential data extraction (`blankEdits`, `dateEdits`, `angleData`) and JSZip injection

---

## 🔔 External Notifications & Inactivity Alerts (Off-Platform Communication)

- [ ] **Email Notification Engine (Microsoft Graph Outlook Integration)**:
  - [ ] Send automated emails to official school inboxes (`@marikina.sti.edu.ph`) when users are **not active on the website**:
    - [ ] **Student Alerts**: Instant notification when an adviser Approves or Rejects a document with revision remarks
    - [ ] **Supervisor Alerts**: Email notification when an intern submits a completed DTR waiting for supervisor digital signature
    - [ ] **Adviser Alerts**: Daily digest or instant notification when new submissions are queued for review
  - [ ] **Inactivity & Deadline Proactive Alerts**:
    - [ ] Automated reminder to students if no Weekly Journal has been logged for 5+ days
    - [ ] Approaching MOA submission deadline reminder alerts
    - [ ] Missing requirement warning alerts before end of OJT phase
  - [ ] **Browser Web Push Notifications (Optional Progressive Web App)**:
    - [ ] Service Worker Web Push API integration for background desktop/mobile alerts even when website tab is closed

---

## 🔐 Authentication, OTP & Account Management (Account Opening + Password Reset)

- [x] **OTP-Based Account Opening & Initial Activation**:
  - [x] Self-service account opening / first-time activation flow for enrolled STI students
  - [x] Institutional domain validation: strictly restricts registration to `@marikina.sti.edu.ph` email addresses (with dual Gmail support)
  - [x] 6-digit OTP dispatch via Microsoft Graph Outlook Mail with 60-second countdown timer and resend cooldown
  - [x] 6-box auto-focusing numeric OTP input component (matching Storyboard Figure 16)
  - [x] Initial student profile setup upon successful OTP verification (Student ID, Program, Section, Contact Number)
- [x] **OTP-Based Self-Service Password Reset**:
  - [x] "Forgot Password" request interface (matching Storyboard Figure 17)
  - [x] Secure OTP generation and dispatch to registered email address
  - [x] Brute-force protection: Maximum 3 invalid OTP attempts before temporary 5-minute account lock
  - [x] Secure password reset submission with confirmation feedback and automatic redirect to login
- [x] **Core Authentication & Security Hardening**:
  - [x] Supabase Auth integration with secure JWT session tokens and PostgreSQL Row-Level Security (RLS)
  - [x] Role-based route guards (`/student`, `/adviser`, `/supervisor`, `/admin`) preventing cross-role privilege escalation
  - [x] 1-Click Microsoft 365 Single Sign-On (SSO) integration alongside email/password login

---

## Related Documentation & Cross-References

- [Task History & Changelog](TASK_HISTORY.md) — Chronological log of completed tasks and milestones
- [Feature Guides Index](../features/README.md) — Complete specifications for all system capabilities
- [System Architecture Specification](../architecture/ARCHITECTURE.md) — System components and technical stack
- [Documentation Hub](../README.md) — Master documentation index

---

## 🎓 Capstone Manuscript & Paper Alignment (Main_Document.md)

- [ ] **Task 1: Institutional Templates Matrix Alignment (Scope & Limitations)**
  - [ ] Update Section 1.4 & 1.5 in `Main_Document.md` from generic document mentions to the official **13 Institutional Templates Matrix**
  - [ ] Structure by Practicum Phase: Phase 1: Before OJT (8 templates), Phase 2: In OJT (3 templates), Phase 3: Finals (2 templates)
  - [ ] Detail document format (.docx, .xlsx, .pdf), state gates, and compliance approval sequence
- [ ] **Task 2: Technical Background & Software Resources Rectification**
  - [ ] Replace `React 18 / Next.js 15 API routes` with **React 19.0 + Vite 6.0 + Express.js REST API Server** (`backend/server.ts`) with Vercel serverless proxy
  - [ ] Replace `Tailwind v3.4.4` with **Tailwind CSS v4.0** and theme variables (`--theme-primary`)
  - [ ] Replace `Groq Whisper` with browser native **Web Speech API** for zero-latency reflection dictation
  - [ ] Document **Dual-Model Fallback AI Architecture**: Primary Groq Llama-3.3-70B with automatic failover to Google Gemini 1.5 Flash
  - [ ] Document **Cloudinary CDN** for raw document blob storage and **Microsoft Graph API** for institutional OneDrive sync
- [ ] **Task 3: System Innovations & Advanced Algorithms Documentation**
  - [ ] Document the **In-Browser DOCX Editing & Generation Pipeline** (`docx-preview` DOM TreeWalker placeholder parsing + `JSZip` XML surgery + `easy-template-x` tagged substitution without MS Office)
  - [ ] Document the **DTR Attendance & Signature Fitting Engine** (HTML5 Canvas + Dark-Ink Stroke Luminance Filtering `alpha > 30 && (r < 200 || g < 200 || b < 200)` + ExcelJS 1:1 cell border anchoring)
  - [ ] Document the **Automated OneDrive Archival Directory Structure** (`STI_Practicum_Archive / AY_YYYY_YYYY / Section / Student_ID / Phase`)
- [ ] **Task 4: Figure & Diagram Numbering De-Collision**
  - [ ] Resolve duplicate Figure 15: Preserve `Figure 15: Web-based Practicum System ERD Diagram`
  - [ ] Renumber `Figure 15. Landing Page StoryBoard` to `Figure 17. Landing Page Storyboard` and increment subsequent storyboard figures (Figures 18–31)
- [ ] **Task 5: Appendices Population (Empty Appendix Pages)**
  - [ ] Populate **Appendix A (Resource Persons)**: Formal table of resource persons and interviewed faculty (Dave Lord Rubaya, Emilou Magnaye, Regina Kate Dominguez, Michael Sayson)
  - [ ] Populate **Appendix B (Personal Technical Vitae)**: Complete curriculum vitae for proponents Kerin Gabriel del Rosario, John Dwayne Guaniso, and Jiro Salvan using standard STI CV format
  - [ ] Link survey charts and adviser interview transcripts to functional requirements matrix

---

## 📚 Completed Milestone: Panelist Defense Manual & System Guide

- [x] **Master Capstone Defense Guide & API Keys Manual**:
  - [x] Created [`docs/PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md`](../PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md) covering all 11 API keys, universal naming conventions, end-to-end code mechanics, and plain-language Q&A cheatsheet
  - [x] Linked into `README.md` and `docs/README.md`
  - [x] Cleaned repository-wide UTF-8 mojibake across 10 markdown documentation files

## Web editor research

first outlook:https://platejs.org/editors
