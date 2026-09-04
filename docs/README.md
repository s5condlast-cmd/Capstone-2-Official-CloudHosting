---
title: "Project Documentation Hub"
description: "Master Map of Content (MOC) and centralized technical documentation index for STI Marikina Practicum Management System."
tags:
  - sti-ojt
  - documentation-hub
  - map-of-content
  - obsidian-moc
  - architecture
aliases:
  - "Documentation Hub"
  - "Docs MOC"
  - "Docs Center"
created: 2026-08-26
updated: 2026-09-04
---

# ðŸ“š Project Documentation Hub

[←  Return to Project Overview](../README.md)

Welcome to the **Capstone-2 CloudHosting OJT Management System** documentation center. This repository contains the complete architectural blueprints, database schemas, feature specifications, deployment guides, and developmental task history.

---

## ðŸ—ºï¸ Master Documentation Map of Content (MOC)

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                       DOCUMENTATION VAULT TOPOLOGY                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                             â”‚
â”‚   [Master README] â”€â”€â–º [docs/README.md (Documentation Hub)]                 â”‚
â”‚                              â”‚                                              â”‚
â”‚         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚
â”‚         â–¼                    â–¼                    â–¼                   â–¼     â”‚
â”‚   [ðŸŒŸ Features]       [ðŸ—ï¸ Architecture]     [🚀 Deployment]    [📋 Tasks]   â”‚
â”‚   ”¢ 01 Checklist      ”¢ Architecture        ”¢ Vercel Guide     ”¢ Tasks      â”‚
â”‚   ”¢ 02 Pipeline       ”¢ Backend & DB        ”¢ Cloudinary       ”¢ History    â”‚
â”‚   ”¢ 03 DTR Fitting    ”¢ Document Workflows  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚   ”¢ 04 AI Audit       ”¢ System Map                                          â”‚
â”‚   ”¢ 05 Review Room    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                                    â”‚
â”‚   ”¢ 06 Admin Mgmt                                                           â”‚
â”‚   ”¢ 07 Calendar       [ðŸ“ Guidelines]       [ðŸ•’ Sessions Archive]           â”‚
â”‚   ”¢ 08 Auth & Sync    ”¢ Refactoring Rules   ”¢ All Sessions History          â”‚
â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  ”¢ Main Proposal       ”¢ TypeScript Milestone Check    â”‚
â”‚                                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ“‚ Documentation Vault Structure

### 📋 [Development Tasks & Roadmap](tasks/TASKS.md)

- [Active Tasks & Roadmap](tasks/TASKS.md) — Ongoing sprints, UI polish items, voice dictation, and template digitization
- [Task History & Changelog](tasks/TASK_HISTORY.md) — Chronological record of completed milestones and bug fixes

### ðŸŒŸ [Feature Specifications & Deep Dives](features/README.md)

- [Feature Documentation Hub](features/README.md) — Comprehensive dataflow diagrams and mechanics per feature
- [01. Student Portal & Checklist](features/01_STUDENT_PORTAL_CHECKLIST.md) — Dynamic 3-stage progress checklist, placement card, and completed tasks modal
- [02. Document Generation Pipeline](features/02_DOCUMENT_PIPELINE.md) — 13 institutional templates, in-browser DOCX preview, and JSZip generation
- [03. DTR Attendance & Signatures](features/03_DTR_ATTENDANCE_SIGNATURE.md) — 460-hour tracker, digital signature canvas, and ExcelJS luminance cropping
- [04. AI-Assisted Document Audit](features/04_AI_GRAMMAR_AUDIT.md) — Dual-model Groq Llama-3.3 + Google Gemini grammar/compliance analyzer
- [05. Adviser & Supervisor Reviews](features/05_ADVISER_SUPERVISOR_REVIEW.md) — Dual-viewport review room, audit trail, and approval workflows
- [06. Admin Templates & Clearance](features/06_ADMIN_MANAGEMENT.md) — Master template distribution, registrar clearance queue, and company directory
- [07. Practicum Calendar & Scheduling](features/07_CALENDAR_AND_EVENTS.md) — Multi-view timeline engine, event modal, and date pickers
- [08. Auth, OTP & OneDrive Sync](features/08_AUTH_AND_ONEDRIVE_SYNC.md) — Institutional security, OTP verification, and Microsoft Graph OneDrive sync

### ðŸ—ï¸ [Architecture & Technical Specifications](architecture/ARCHITECTURE.md)

- [Architecture Overview](architecture/ARCHITECTURE.md) — System topology, client SPA, serverless Express backend, and Supabase integration
- [System Map & Target Locator](architecture/SYSTEM_MAP.md) — Fast code locator, component route index, and problem-fix register
- [Backend, Database & AI](architecture/BACKEND_AND_DATABASE.md) — Supabase PostgreSQL schema, RLS policies, storage buckets, and AI routes
- [Document Workflows](architecture/DOCUMENT_WORKFLOWS.md) — 3-phase template inventory, `StudentDocumentPage` architecture, and DOCX/PDF workflows

### 🚀 [Deployment & Cloud Infrastructure](deployment/DEPLOYMENT_AND_VERCEL.md)

- [Vercel Deployment Guide](deployment/DEPLOYMENT_AND_VERCEL.md) — Serverless configuration, environment checklist, and redeploy safeguards
- [Cloudinary Storage Integration](deployment/CLOUDINARY_INTEGRATION_SUMMARY.md) — CDN media storage, signature upload handling, and document backups

### ðŸ“ [Engineering Guidelines & Project Specs](guidelines/REFACTORING_GUIDELINES.md)

- [Refactoring Guidelines](guidelines/REFACTORING_GUIDELINES.md) — Coding standards, component rules, theme tokens, and state conventions
- [Main Capstone Proposal](guidelines/Main_Document.md) — Core academic project proposal and institutional specifications

### ðŸ•’ [Work Sessions & Learnings Archive](sessions/ALL_SESSIONS_HISTORY.md)

- [All Sessions History](sessions/ALL_SESSIONS_HISTORY.md) — Complete multi-session archive and architectural evolution
- [TypeScript Diagnosis & Prop Alignment](sessions/SESSION_SUMMARY_2026-08-26.md) — React 19 type alignment and component prop audit
