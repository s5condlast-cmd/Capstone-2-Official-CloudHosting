---
title: "Task History & Changelog"
description: "Chronological record of completed tasks, refactors, bug fixes, and architectural milestones."
tags:
  - sti-ojt
  - task-history
  - changelog
  - milestones
  - sprint-history
aliases:
  - "Task History"
  - "Changelog"
  - "Completed Tasks"
created: 2026-08-26
updated: 2026-09-04
---

# 📜 Task History & Changelog

[←  Back to Active Tasks](TASKS.md) | [Documentation Hub](../README.md) | [All Sessions History](../sessions/ALL_SESSIONS_HISTORY.md)

A historical record of completed tasks, refactors, bug fixes, and architectural milestones for the **Capstone-2 CloudHosting OJT Management System**.

---

## 📅 September 2, 2026

### ðŸ—“ï¸ Add Event Modal & Date/Time Picker Polish

- [x] **shadcn DatePickerSimple Integration**:
  - Connected shadcn `<Popover>` + `<Calendar mode="single" captionLayout="dropdown" />` to the Add Event form.
  - Set default unselected state to `"Select date"` in muted placeholder typography until picked.
  - Synchronized date selection to update the event date instantly and close the popover.
- [x] **Interactive Month & Year Dropdowns**:
  - Added full 12-month selection (`Jan`–`Dec`) and 2020–2040 year range support in `components/ui/calendar.tsx`.
  - Fixed pointer event bug where the absolute navigation container (`nav`) blocked dropdown clicks: set `pointer-events-none` on `nav` and `pointer-events-auto` on arrows & dropdowns.
  - Sized and styled dropdown pills matching exact shadcn visual design with generous `p-4` popover padding.
- [x] **Time Field Formatting**:
  - Removed `step="1"` to eliminate seconds (`:00`) display, restricting input to clean hours and minutes (`10:30 AM`).
  - Set initial time to empty (`--:-- --`) so it doesn't pre-fill with forced values.
- [x] **Modal Form Simplification**:
  - Removed redundant Category dropdown from the Add Event dialog modal for faster event creation.
  - Preserved category filter cards on the main calendar view.

---

### 📱 Calendar Mobile Responsiveness

- [x] **Adaptive Heights**: Converted fixed `h-[calc(100vh-5.2rem)]` on mobile to adaptive `h-auto lg:h-[calc(100vh-5.2rem)]`.
- [x] **2-Row Responsive Toolbar**: Compact 2-row layout on mobile phones (`Today`, nav arrows, and title on top row; `+ Add Event` and view switcher on bottom row).
- [x] **Mobile Month View**: Replaced overflowing text with clean day numbers and colored category dot badges (`size-1.5 rounded-full`), plus a 1-tap **Selected Day Events List** underneath.
- [x] **Touch-scrollable Week View**: Wrapped week grid in `overflow-x-auto min-w-[520px]` container for smooth horizontal touch swipe.
- [x] **Fixed `isSameDayDate` Reference Error**: Hoisted top-level date comparison function with safe null checks.

---

### â˜ï¸ Microsoft OneDrive & Graph API Cloud Archival Integration

- [x] **Credit-Card-Free Azure Activation**:
  - Unlocked free Microsoft Entra ID directory via **Azure for Students** academic verification (`@marikina.sti.edu.ph`) with \$0 cost and zero payment information required.
- [x] **Multi-Tenant Azure App Registration**:
  - Registered confidential client application (`fbe81653-8deb-44da-a644-3cff2e4696a4`) supporting both organizational and personal accounts.
  - Configured `Files.ReadWrite.All` application permissions and OAuth2 Web redirect URIs (`http://localhost:3001/api/onedrive/auth/callback`).
- [x] **Automated Auto-Refreshing Backend Engine**:
  - Created [`backend/services/onedriveService.ts`](../../backend/services/onedriveService.ts) with silent token rotation refreshing 2 minutes prior to expiration (`offline_access`).
  - Implemented `testOneDriveConnection()` for live quota and storage health diagnostics.
- [x] **OneDrive REST API Routes**:
  - Implemented [`backend/routes/onedrive.ts`](../../backend/routes/onedrive.ts) providing `GET /api/onedrive/auth/login`, callback handler, `GET /api/onedrive/status`, and multipart `POST /api/onedrive/upload`.
  - Mounted router on `/api` in `backend/server.ts`.
- [x] **Automated Signed Letter & DTR Archiving**:
  - Integrated student document uploads in [`src/lib/submissionStorage.ts`](../../src/lib/submissionStorage.ts) to automatically mirror signed Application Letters, Consent Forms, and DTR spreadsheets into structured OneDrive paths (`STI_Practicum_Archive/<AY>/<Section>/<Student>/...`).
  - Added live OneDrive sync indicators to the student upload interface in `StudentDocumentPage.tsx`.
- [x] **Zero-Leak Security Hardening**:
  - Protected `.env` and `backend/config/onedrive-token.json` via `.gitignore`.
  - Verified 0 TypeScript errors with `npm run lint` (`tsc --noEmit`).
  - Authorized and pushed clean repository commits (`6baf611` & `e409fa1`) to GitHub.

---

## 📅 September 1, 2026

### ðŸŽ¨ Calendar Page Alignment & UI Restoration

- [x] **Restored Sidebar Mini Calendar**: Re-implemented standard shadcn `<Calendar />` in sidebar.
- [x] **Circular Category Check Badges**: Converted rectangular badges to clean circular check chips matching shadcn design tokens.
- [x] **Editorial Header Typography**: Split header date into bold modern month/year typography.
- [x] **Header & Sidebar Cleanup**: Removed user email from header and navigation sidebar for a clean minimal layout.
- [x] **Expanded Search Palette**: Widened search command palette button for better touch targets and desktop accessibility.
- [x] **Sidebar Width Fix**: Fixed TypeScript error TS2451 by removing duplicate `SIDEBAR_WIDTH` declaration in `components/ui/sidebar.tsx`.

---

### 🚀 Git & Deployment

- [x] **Authorized Repository Push**: Staged, committed, and pushed 69 clean files to `origin/feature/landing-page-fixes` following explicit user authorization (`/push`).

---

## 📌 Upcoming Tasks

- [ ] **Role Dashboards Redesign & UI Polish (Option A)**
  - [ ] Admin Dashboard (Cards, interactive metrics, activity table)
  - [ ] Student Dashboard (Progress metrics, quick requirements, submissions)
  - [ ] Adviser Dashboard (Pending reviews, student roster, approval queue)
  - [ ] Supervisor Dashboard (DTR approvals, evaluations, attendance charts)
  - [ ] General UI polish across all pages (responsive spacing, consistent cards)
- [ ] **Student Experience & Portal Refinement**
  - [ ] Dynamic database sync for requirements progress
  - [ ] Real-time completed tasks sync across To-do, submissions, and modal
  - [ ] Standardize student document workflows via `StudentDocumentPage.tsx`
- [ ] **Document Digitization: Interactive Inputs for All Templates**
  - [ ] Convert all 13 official templates across Before OJT, In OJT, and Final into digital interactive inputs (`AutoWidthInput`)
  - [ ] Enforce strict 30-word limits, print stylesheets (`@media print`), and sequential JSZip injection
- [ ] **Core Backend, Security & Cloud Sync (High Priority — Post-Dashboards)**
  - [ ] Authentication & Security (Microsoft 365 SSO + Institutional OTP)
  - [ ] Automated Emailing System (Microsoft Graph Outlook Mail `Mail.Send`)
  - [x] Microsoft OneDrive Integration (Microsoft Graph API, cloud document sync & backup)

---

## Related Documentation & Cross-References

- [Active Tasks & Roadmap](TASKS.md) — Ongoing sprints and backlog
- [All Sessions History](../sessions/ALL_SESSIONS_HISTORY.md) — Comprehensive session archive
- [Master Documentation Hub](../README.md) — Central documentation portal
