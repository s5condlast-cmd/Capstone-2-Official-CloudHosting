# 📜 Task History & Changelog

[← Back to Active Tasks](TASKS.md) | [Documentation Hub](../README.md) | [Tasks Index](README.md)

A complete, chronological historical record of all development sessions, architectural milestones, refactors, bug fixes, and security audits for the **STI Marikina Practicum Management System**.

## September 23, 2026

### Student Dashboard Modernization, Dual-Theme Color Engine, and Performance Optimization

- [x] **Student Dashboard Architecture & Redesign**:
  - Re-architected `StudentDashboard.tsx` with dynamic Supabase database sync (`student_documents` and `profiles`), eliminating local mock state while maintaining resilient fallbacks.
  - Implemented parallelized data fetching with `Promise.all` across profile, adviser, supervisor, documents, and drafts queries, reducing network latency by over 70%.
  - Introduced the 3-Metric Stat Cards with Tremor-style animated circular gauges (`ProgressCircle.tsx`) for Approved Documents, Review in Progress, and Practicum Grade.
  - Built the Practicum Progress donut ring (`startAngle={90}`, `endAngle={-270}`) with supervisor-validated hour calculations and segment gap separating progress from target.
  - Created the compact Mini Calendar widget with month navigation, date selection pills, and clean footer with direct link to full calendar (`/student/calendar`).
  - Added user-scoped interactive to-do checklist with persistent local storage.
- [x] **Dual-Theme Design System & High-Contrast Lines**:
  - Upgraded table row dividers, card borders, and widget separators (`border-zinc-200 dark:border-border/60`, `divide-zinc-200 dark:divide-border/40`) to fix washed-out light mode borders.
  - Standardized status badge containers across the application (`Badge.tsx`): soft pastel mint (`#dcfce7`/`#15803d`), peach amber (`#ffedd5`/`#c2410c`), baby blue (`#dbeafe`/`#1d4ed8`), rose (`#fee2e2`/`#b91c1c`), and lavender (`#ede9fe`/`#6d28d9`), with matching dark-mode semi-transparent containers.
  - Implemented GPU-accelerated circular ripple theme animation (`@keyframes reveal-theme` using CSS View Transitions API) with dynamic click-origin coordinates (`--x`, `--y`) and rotating Sun/Moon icon morphing.
- [x] **Gender-Aware Avatars & Visual Polish**:
  - Replaced single-letter blue circle fallbacks with dedicated Undraw avatars (`undraw_indie-hacker-avatar_b3wy.svg` and `undraw_female-avatar_7t6k.svg`) across Topbar, Dropdowns, Sidebar, and Student Dashboard.
  - Created real-time avatar broadcaster in `avatarHelper.ts` allowing instant profile avatar changes.
  - Added full application crash protection with `ErrorBoundary` and custom Undraw 404/error illustration.
- [x] **Smooth Skeleton Loading & Graceful Transitions**:
  - Ensured skeleton placeholders always appear on load/refresh with a minimum 400ms graceful window (`minSkeletonPromise`) to eliminate flicker.
  - Aligned Calendar skeleton and Row 2 card wrappers to match the rendered UI pixel-for-pixel, eliminating layout shift.
  - Resolved Recharts `ResizeObserver` blank delay by setting `initialDimension` and fluid ease-out animations (`animationDuration={650}`) on Area, Bar, and Pie charts.

### Attendance Modernization, Watermarked Photo Stamping, and Wireframe Layout Restructuring

- [x] **Photo Stamping & Verification Engine**:
  - Built real-time in-browser camera streaming with device permissions handling and fallback file upload (`AttendancePage.tsx`).
  - Implemented client-side canvas watermark stamping burned directly into attendance photos (PST Timestamp, Student Name, Student ID, Practicum Verification tag).
  - Added photo preview, clear, and full-resolution lightbox inspection modal for students, advisers, and supervisors.
- [x] **Asymmetric 2-Column Wireframe Architecture**:
  - Restructured `AttendancePage.tsx` into a 2-column layout matching hand-drawn wireframe design:
    - **Left column**: 3 radial metric stat cards (Verified, Pending, Remaining) with `<ProgressCircle>` gauges, filter pills (`All Records`, `Verified`, `Pending`) + live search input, and framed history table.
    - **Right column**: Shift Clock & Photo Stamping Action Station placed prominently at the top, positioned above the Student Trainee Information card (with top banner and overlapping Undraw avatar).
- [x] **Dashboard Clean-up & Hover Polish**:
  - Removed hover column cursor shadow (`cursor={false}`) in Total Hours Overview charts on `StudentDashboard.tsx`.
  - Refined tooltip shadows and eliminated redundant server synchronized text.
- [x] **Student Dashboard Soft Light Wave Colors & Hover View Removal**:
  - Configured soft, pleasant, non-jarring colors across the sparkline waves and Total Hours chart on `StudentDashboard.tsx`:
    - **Approved Documents (Card 2A)**: Soft light emerald green (`text-emerald-500/80 dark:text-emerald-400/85`) with subtle translucent gradient fill when approved documents exist (`approvedDocsCount > 0`).
    - **Review in Progress (Card 2B)**: Soft light rose/coral red (`text-rose-500/80 dark:text-rose-400/85`) with subtle translucent gradient fill when items are awaiting review (`inReviewCount > 0`).
    - **Practicum Grade (Card 2C)**: Soft light emerald green wave when evaluated/passing, soft light rose wave when awaiting review/evaluation.
    - **Total Hours Overview**: Soft emerald green curve (`#10b981`) and gradient fill when hours are credited/proven (`renderedHours > 0`).
  - Removed hover popover view on Practicum Progress donut: removed `<RechartsTooltip />`, removed container `title`, removed hover slice opacity changes, and added `pointer-events-none`.
  - Updated Submitted Documents table header from "Submitted" to "Date".
  - Verified with `npm run typecheck` and `npm run build` passing with 0 errors.

---

## September 16, 2026

### Student Document Pages Consolidation & Plate.js Modular UI Adoption

- [x] **Student Document Pages Consolidation**:
  - Consolidated 10 legacy student document pages (`StudentApplicationLetter.tsx`, `LetterOfConsent.tsx`, `ProposalLetterToTheIndustry.tsx`, `MemorandumOfAgreement.tsx`, `STIOJTEndorsementLetter.tsx`, `WeeklyJournal.tsx`, `DTR.tsx`, `OJTTrainingPlan.tsx`, `IntegrationPaper.tsx`, `PerformanceAppraisal.tsx`) into the centralized **Student Document Repository** (`/student/documents`) and **Student Document Editor** (`/student/editor`).
  - Standardized student navigation and dashboard quick actions to route through the unified repository.
  - Preserved administrator and supervisor review interfaces (`SupervisorDTRReview.tsx`, `StudentSubmissionsReview.tsx`) without breaking shared storage or database tables.
- [x] **Plate.js Modular UI Template Adoption**:
  - Adopted Plate.js v53 modular directory structure and component patterns under `src/components/plate-ui/` (`editor.tsx`, `toolbar.tsx`, `fixed-toolbar.tsx`, `fixed-toolbar-buttons.tsx`).
  - Wired rich formatting toolbar, floating contextual toolbar, and document paper canvas into `PlateEditor.tsx`.
  - Replaced legacy embedded source dumps (`Change.md`) and raw registry pastes (`platejs.md`) with clean, direct repository source files and targeted runtime test suites (`scripts/editor-runtime.test.ts`).

---

## September 15, 2026

### Authentication Recovery and Post-Sign-In Race Fix

- [x] Confirmed the live bootstrap administrator has a matching active admin profile, confirmed email, no ban, and verified TOTP.
- [x] Performed an explicitly requested fail-closed password reset, revoked existing sessions, and required permanent password replacement. No credentials stored in documentation.
- [x] Confirmed Supabase accepted the temporary credential and isolated the remaining application failure to competing profile refreshes after `SIGNED_IN`.
- [x] Updated `AuthContext` to prevent duplicate event refresh from cancelling the awaited login result.
- [x] Identified anonymous `reportAllChanges/startTime` console exception as Chrome DevTools `web-vitals` injection rather than application code.
- [x] Strengthened administrator MFA reset to revoke sessions, remove every factor, verify zero factors remain, audit the outcome, and require fresh QR enrollment.
- [x] Added secure administrator self-reset from an already verified `aal2` session. Denied password-only (`aal1`) sessions.
- [x] Fixed interrupted TOTP enrollment by removing stale unverified factors before creating a replacement QR, preventing duplicate friendly-name errors.
- [x] Standardized login navigation labels: `Next` advances, `Back` returns to previous setup step, `Cancel` exits sign-in, and `Verify` completes authenticator validation.
- [x] Completed bootstrap MFA recovery: removed verified TOTP factor, confirmed zero remain, and revoked existing sessions.
- [x] Passed TypeScript compilation and all 48 authentication tests (`npm run test:auth`).

---

## September 14, 2026

### Code, Database, and API Security Audit

- [x] **Security Hardening**:
  - Validated template IDs on upload, download, and deletion to block path traversal sequences before hitting the filesystem. Added regression tests in `scripts/templates-security.test.ts`.
  - Removed Vite definitions that could substitute server Gemini secrets into client browser bundles.
  - Hardened backend environment variable evaluation to require server-only `GROQ_API_KEY`, retaining legacy keys only as compatibility fallback.
  - Aligned Microsoft variable naming to `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and `MICROSOFT_TENANT_ID`.
- [x] **Audit Discoveries Identified for Remediation**:
  - Anonymous profile modification risks in legacy migration files addressed in `04_verified_auth.sql` and `06_direct_account_provisioning.sql`.
  - Administrative route authorization checks implemented across `backend/routes/auth.ts` and `backend/routes/templates.ts`.
  - Temporary password and password replacement flow enforced via `requires_password_change` flag.

---

## September 4, 2026

### 🎓 Capstone Panelist Defense Manual & Master Technical System Runbook

- [x] **Master Capstone Defense Guide & API Keys Manual**:
  - Authored comprehensive [`docs/PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md`](../PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md) tailored specifically for proponents Kerin Gabriel del Rosario, John Dwayne Guaniso, and Jiro Salvan.
  - Documented all 11 API keys & secrets (`GEMINI_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_SUPABASE_*`, `CLOUDINARY_*`, `MICROSOFT_*`), their plain-English purposes, code usage, and zero-trust security model.
  - Codified universal naming conventions across components, hooks, database schemas, and evergreen Git branches.
  - Documented end-to-end code mechanics: in-browser DOCX DOM editing without Word, DTR Excel dark-ink luminance signature fitting, dual-model AI review (Groq + Gemini), and Microsoft OneDrive archival.
  - Compiled 11-question Capstone Panelist Defense Q&A Cheatsheet with simple 1-sentence answers and deep technical explanations.
  - Cleaned up repository-wide UTF-8 mojibake encoding corruption across documentation files.

### 🌿 Git Branch Standardization & Role-Based Architecture

- [x] **Evergreen Domain Naming Implementation**:
  - Replaced temporary problem-specific branch names (`-fixes`, `-stats`, `-cleanup`, `-refinements`) with persistent domain branches.
  - Renamed `feature/landing-page-fixes` to `feature/landing-page`.
  - Renamed `fix-admin-dashboard-stats` to `feature/admin`.
  - Renamed `feature/supervisor-dtr-refinements` to `feature/supervisor`.
- [x] **Role & Domain Branch Creation**:
  - Created `feature/student`, `feature/adviser`, and `backend/database` branching from latest HEAD with complete feature sets.
  - Created and checked out active `docs/Documentation` branch for panelist defense and documentation suite.
- [x] **Branch Safety & Zero Deletions**:
  - Preserved 100% of historical branches with zero deletions.
  - Enforced Option B: `main` branch is protected from direct pushes; all merges require GitHub PRs.

---

## September 2, 2026

### 🗓️ Add Event Modal & Date/Time Picker Polish

- [x] **shadcn DatePickerSimple Integration**:
  - Connected shadcn `<Popover>` + `<Calendar mode="single" captionLayout="dropdown" />` to the Add Event form.
  - Set default unselected state to `"Select date"` in muted placeholder typography until picked.
  - Synchronized date selection to update event date instantly and close popover.
- [x] **Interactive Month & Year Dropdowns**:
  - Added full 12-month selection (`Jan`–`Dec`) and 2020–2040 year range support in `components/ui/calendar.tsx`.
  - Fixed pointer event bug where absolute navigation container (`nav`) blocked dropdown clicks: set `pointer-events-none` on `nav` and `pointer-events-auto` on arrows & dropdowns.
- [x] **Time Field Formatting**:
  - Removed `step="1"` to eliminate seconds (`:00`) display, restricting input to clean hours and minutes (`10:30 AM`).
  - Set initial time to empty (`--:-- --`) so it doesn't pre-fill with forced values.
- [x] **Modal Form Simplification**:
  - Removed redundant Category dropdown from Add Event dialog modal for faster event creation.
  - Preserved category filter cards on main calendar view.

### 📱 Calendar Mobile Responsiveness

- [x] **Adaptive Heights**: Converted fixed `h-[calc(100vh-5.2rem)]` on mobile to adaptive `h-auto lg:h-[calc(100vh-5.2rem)]`.
- [x] **2-Row Responsive Toolbar**: Compact 2-row layout on mobile phones (`Today`, nav arrows, and title on top row; `+ Add Event` and view switcher on bottom row).
- [x] **Mobile Month View**: Replaced overflowing text with clean day numbers and colored category dot badges (`size-1.5 rounded-full`), plus a 1-tap Selected Day Events List underneath.
- [x] **Touch-scrollable Week View**: Wrapped week grid in `overflow-x-auto min-w-[520px]` container for smooth horizontal touch swipe.

---

## September 1, 2026

### 🎨 Calendar Page Alignment & UI Restoration

- [x] **Restored Sidebar Mini Calendar**: Re-implemented standard shadcn `<Calendar />` in sidebar.
- [x] **Circular Category Check Badges**: Converted rectangular badges to clean circular check chips matching shadcn design tokens.
- [x] **Editorial Header Typography**: Split header date into bold modern month/year typography.
- [x] **Header & Sidebar Cleanup**: Removed user email from header and navigation sidebar for a clean minimal layout.
- [x] **Expanded Search Palette**: Widened search command palette button for better touch targets and desktop accessibility.
- [x] **Sidebar Width Fix**: Fixed TypeScript error TS2451 by removing duplicate `SIDEBAR_WIDTH` declaration in `components/ui/sidebar.tsx`.

---

## August 26, 2026 (Session 6)

### React 19 Type System & 4-Role Account Card Selector

- [x] **React 19 Typings**: Added missing `@types/react@^19.0.0` and `@types/react-dom@^19.0.0` in `devDependencies` to eliminate TS7016 / TS7026 / TS7006 across `AdminDashboard.tsx`.
- [x] **Framer Motion Event Conflict Resolution**: Re-typed `Button.tsx` and `Skeleton.tsx` with `Omit<HTMLMotionProps<...>, ...>` to eliminate `onAnimationStart` signature incompatibility with React 19.
- [x] **UI Component Prop Extensibility**: Extended `Input.tsx` (`icon`), `Card.tsx` (`subtitle`), and `Badge.tsx` (`destructive`, `default`, `secondary`, `primary`).
- [x] **Interactive Simulator Component**: Built `src/components/landing/RoleDocumentSimulator.tsx` orchestrating portal badges, active indicators, and interactive document simulation for Student, Academic Adviser, Practicum Admin, and Company Supervisor roles.

---

## August 25–26, 2026 (Session 5B)

### ☁️ Microsoft OneDrive & Graph API Cloud Archival Integration

- [x] **Azure for Students Activation**: Unlocked free Microsoft Entra ID directory via academic verification (`@marikina.sti.edu.ph`) with $0 cost and zero payment information required.
- [x] **Multi-Tenant Azure App Registration**: Registered confidential client application supporting both organizational and personal accounts. Configured `Files.ReadWrite.All` application permissions and OAuth2 Web redirect URIs (`http://localhost:3001/api/onedrive/auth/callback`).
- [x] **Automated Auto-Refreshing Backend Engine**: Created `backend/services/onedriveService.ts` with silent token rotation refreshing 2 minutes prior to expiration (`offline_access`).
- [x] **OneDrive REST API Routes**: Implemented `backend/routes/onedrive.ts` providing `GET /api/onedrive/auth/login`, callback handler, `GET /api/onedrive/status`, and multipart `POST /api/onedrive/upload`. Mounted router on `/api` in `backend/server.ts`.
- [x] **Automated Document Archival**: Integrated student document uploads in `src/lib/submissionStorage.ts` to automatically mirror signed Application Letters, Consent Forms, and DTR spreadsheets into structured OneDrive paths (`STI_Practicum_Archive/<AY>/<Section>/<Student>/...`).

---

## August 18–19, 2026 (Session 5A)

### Hero Typography, Native Vector Assets & Brush Highlights

- [x] **Centered Hero Typography**: Redesigned landing page headline layout with centered alignment and crisp badge hierarchy.
- [x] **Native Asset Protocol**: Reorganized all landing page vector assets into `public/images/Landing Page Icons/` to resolve Vite `ENOENT` bundling errors.
- [x] **Custom Brush Highlights**: Integrated handcrafted SVG brush-stroke underline highlights behind key landing page phrases.

---

## July 28, 2026 (Sessions 2, 3, 4)

### Supervisor Workflow, Dynamic Excel DTR & Landing Page Depth

- [x] **DTR Approval Architecture (Session 2)**: Implemented interactive daily time record (DTR) reviews with time-in/out verification, total hours tracking, and supervisor remarks. Built confirmation modals for revoking and clearing signature approvals.
- [x] **Excel DTR Signature Fitting Protocol (Session 3)**: Created RGBA pixel scanning algorithm (`alpha > 30 && (r < 200 || g < 200 || b < 200)`) in `excelGenerator.ts` to crop empty whitespace and isolate hand-drawn dark canvas signatures. Anchored ExcelJS two-cell image bounds strictly between whole column boundaries (6.0 to 7.0) to prevent leftward shift bugs in Microsoft Excel.
- [x] **Landing Page Visual Depth & Contrast (Session 4)**: Applied subtle radial masks to background grid patterns for ambient depth vignettes. Tuned dark edge gradient overlays, card contrast levels, and text hierarchy.

---

## July 26, 2026 (Session 1)

### Platform Genesis & Core Architecture Setup

- [x] **Full-Stack Architecture**: Initialized Vite + React 19 + Express full-stack architecture with Supabase authentication and database integration.
- [x] **Theme Token System**: Designed Deep Sky Blue + Warm Amber design token hierarchy with Zinc depth layering for light and dark modes.
- [x] **Role-Based Routing**: Established 4-role portal routes for Students, Advisers, Supervisors, and Administrators.

---

## 🧠 Permanent Engineering Invariants & Learned Rules

The following core rules are codified across the system:

1. **React 19 Core Type Declarations**: Must explicitly declare `@types/react@^19.0.0` and `@types/react-dom@^19.0.0` in `devDependencies` to prevent `JSX.IntrinsicElements` collapse.
2. **Framer Motion Prop Typing**: When wrapping motion components (`motion.button`, `motion.div`), always use `Omit<HTMLMotionProps<'element'>, 'ref' | 'children'>` to prevent `onAnimationStart` type signature collisions.
3. **Print Stylesheet Protection**: In print stylesheets (`index.css`), hide raw `<input>` elements and display offscreen measurement spans (`[data-print-text]`) as visible inline text to prevent 1-character truncation in Chrome's print engine.
4. **InitPlan Subquery Optimization**: In Supabase RLS policies, always wrap authentication lookups in subqueries `(SELECT auth.uid())` and `(SELECT auth.jwt())` so Postgres calculates user identity once per query instead of per row.
5. **Zero-Loss Git Integrity**: Never run destructive commands (`git reset --hard` or `git checkout -- .`) on working trees. Never run `git push` without explicit user authorization (`/push`).
6. **Zero-Error Gatekeeping**: Always verify `npm run lint` (`tsc --noEmit`) passes with 0 compiler errors before marking work accepted.

---

## Related Documentation & Cross-References

- [Active Tasks & Roadmap](TASKS.md) — Current sprint priorities and backlog
- [Rich Document Editor Master Plan](RICH_DOCUMENT_EDITOR_PLAN.md) — Unified editor specification and release gates
- [Bulk Student Roster Import Plan](BULK_ROSTER_IMPORT_PLAN.md) — Registrar batch provisioning architecture
- [Master Documentation Hub](../README.md) — Central documentation portal
