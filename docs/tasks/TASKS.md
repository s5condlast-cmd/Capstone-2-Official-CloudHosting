---
title: Active Tasks & Development Roadmap
description: Active development tasks, feature checklist, UI polish items, voice dictation, template digitization, and backend roadmap.
tags:
  - sti-ojt
  - tasks
  - roadmap
  - sprint-planning
  - backlog
aliases:
  - Tasks
  - Active Tasks
  - Roadmap
created: 2026-08-26
updated: 2026-09-04
---

# Active Tasks & Development Roadmap

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

## 🔒 Core Backend, Security & Cloud Sync (Post-Dashboards)

- [ ] **Authentication & Security (Microsoft 365 SSO + OTP Login)**:
  - [ ] Modern login screen with institutional branding, 1-click Microsoft 365 Single Sign-On (SSO), and role-based redirection
  - [ ] Institutional OTP (One-Time Password) generation and validation workflow
  - [ ] Supabase Auth integration with secure RLS policies and JWT session handling
- [ ] **Automated Emailing System (Microsoft Graph / Outlook Integration)**:
  - [ ] Microsoft Graph API Outlook Mail integration (`Mail.Send`) using existing Microsoft Entra credentials
  - [ ] Delivery of OTP verification codes directly via Outlook to school emails (`@marikina.sti.edu.ph`)
  - [ ] Submission status notification emails (Document Approved, Revision Requested, DTR Signed) sent via Outlook
- [x] **Microsoft OneDrive Integration**:
  - [x] Microsoft Graph API / OneDrive cloud storage connection
  - [x] Automated sync and backup of approved student documents, MOAs, and signed DTR forms to institutional OneDrive
  - [x] Auto-refresh OAuth2 token engine and status/quota monitoring endpoint

---

## Related Documentation & Cross-References

- [Task History & Changelog](TASK_HISTORY.md) — Chronological log of completed tasks and milestones
- [Feature Guides Index](../features/README.md) — Complete specifications for all system capabilities
- [System Architecture Specification](../architecture/ARCHITECTURE.md) — System components and technical stack
- [Documentation Hub](../README.md) — Master documentation index

---

## Next Promt

- [ ] all add a md that explains api keys, naming convesion the follows the everything and how it works how you did the codes everything no missing for my capstone if the panelist answer make it simple and easy to understand


