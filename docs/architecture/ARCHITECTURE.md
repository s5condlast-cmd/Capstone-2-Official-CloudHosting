---
title: "System Architecture & Technical Specification"
description: "High-level architectural blueprint, client SPA, serverless Express backend, Supabase database, and verified directory layout."
tags:
  - sti-ojt
  - architecture
  - react19
  - express
  - supabase
  - vite
aliases:
  - "System Architecture"
  - "Architecture Overview"
  - "Tech Stack Architecture"
created: 2026-08-26
updated: 2026-09-04
---

# System Architecture & Technical Specification

[←  Back to Documentation Hub](../README.md) | [System Map & Locator](SYSTEM_MAP.md) | [Backend & Database](BACKEND_AND_DATABASE.md) | [Document Workflows](DOCUMENT_WORKFLOWS.md)

## Overview

The **Web-Based Practicum Management System with AI** is a full-stack web application for STI College Marikina. It manages student OJT (On-the-Job Training) across three phases: **Before OJT**, **In OJT**, and **Finals**.

- **Frontend**: React 19 SPA bundled by Vite 6, styled with Tailwind CSS v4.
- **Backend**: Express.js API server (runs locally on port 3001, deploys as a Vercel Serverless Function).
- **Database & Storage**: Supabase (PostgreSQL + Blob Storage), with IndexedDB and localStorage offline fallbacks.

---

## Architecture Diagram

```text
+-------------------------------------------------------------------------â”
|                            CLIENT (Browser)                            |
|                                                                         |
|  +------------------â”  +------------------â”  +----------------------â”  |
|  |  Student Portal   |  |  Adviser Portal   |  |  Supervisor Portal   |  |
|  | StudentDocPage    |  | ReviewDocs        |  | DTRApproval          |  |
|  | DocumentWorkflow  |  | UnifiedReview     |  | WeeklyJournalReview  |  |
|  | DTR / Journals    |  | Approvals         |  | InternshipCompletion |  |
|  +------------------+  +------------------+  +----------------------+  |
|                                                                         |
|  +------------------------------------------------------------------â”   |
|  |  Admin Portal: Templates, DocumentVerification, Monitoring,      |   |
|  |  UserManagement, CompanyManagement, Reports, Settings            |   |
|  +------------------------------------------------------------------+   |
|                                                                         |
|  Document Engines:                                                      |
|    @embedpdf/react-pdf-viewer | docx-preview | easy-template-x         |
|    ExcelJS | docx | XLSX                                                |
|                                                                         |
|  Client-Side Supabase Client (src/lib/supabase.ts)                     |
|    -> Reads: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY                 |
+------------------------+------------------------------------------------+
                         |
          +--------------+--------------â”
          |                             |
          v                             v
+---------------------â”     +-------------------------â”
|  EXPRESS BACKEND     |     |  SUPABASE                |
|  (api/server.ts ->    |     |                           |
|   backend/server.ts) |     |  PostgreSQL Tables:       |
|                      |     |   • student_documents     |
| POST /api/analyze    |     |   • template_metadata     |
|  1. pdf-parse text   |     |   • document_templates    |
|  2. Groq AI (primary)|     |   • document_template_    |
|  3. Gemini (fallback)|     |     versions              |
|  4. Save findings    |     |   • document_instances    |
|     to Supabase DB   |     |                           |
|                      |     |  Storage Buckets:         |
| Reads env vars:      |     |   • student_submissions   |
|  VITE_SUPABASE_URL   |     |   • templates             |
|  VITE_SUPABASE_ANON  |     |                           |
|  VITE_GROQ_API_KEY   |     |  Row Level Security: ON   |
|  GEMINI_API_KEY      |     |  (per-role JWT policies)  |
+---------------------+     +-------------------------+
```

---

## Directory Layout (Verified)

```text
MainCode/
â”œ-- .agents/
|   +-- AGENTS.md                   # Agent rules, coding constraints, operational protocols
â”œ-- api/
|   +-- server.ts                   # Vercel serverless entrypoint (re-exports backend/server.ts)
â”œ-- backend/
|   â”œ-- config/supabase.ts          # Server-side Supabase client (uses dotenv)
|   â”œ-- routes/analyze.ts           # POST /api/analyze — AI document analysis route
|   â”œ-- services/aiService.ts       # Groq -> Gemini fallback AI pipeline
|   â”œ-- utils/pdfParser.ts          # pdf-parse text extraction from PDF buffers
|   +-- server.ts                   # Express app: CORS, JSON, /api mount, conditional listen()
â”œ-- docs/                           # Technical documentation (this directory)
â”œ-- public/
|   +-- images/                     # Static assets: hero-bg.png, students-box.png, etc.
|       +-- Landing Page Icons/     # Dedicated landing page vector SVGs:
|           â”œ-- Logo.svg                   # Official Practicum Portal SVG brand logo
|           â”œ-- Landing Page Post.svg      # Document post SVG vector icon
|           â”œ-- Landing Page key Points.svg# DTR key points SVG vector icon
|           +-- Landing Page Selfie.svg    # Student selfie SVG graphic
â”œ-- scripts/
|   +-- push_to_github.bat          # Git staging, commit, and push script
â”œ-- supabase/
|   +-- migrations/
|       â”œ-- 01_initial_schema.sql            # Master database tables, triggers, indexes, and table RLS policies
|       +-- 02_storage_security_policies.sql # Storage buckets and scoped storage security policies
â”œ-- src/
|   â”œ-- components/
|   |   â”œ-- admin/
|   |   |   +-- VisualTemplateBuilder.tsx   # Admin template schema visual editor
|   |   â”œ-- compose/
|   |   |   â”œ-- ComposeButton.tsx           # Floating compose trigger button
|   |   |   â”œ-- ComposeModal.tsx            # Document compose modal dialog
|   |   |   â”œ-- DocumentForm.tsx            # Dynamic form field renderer
|   |   |   â”œ-- DocumentProgressTimeline.tsx # Document status timeline tracker
|   |   |   â”œ-- DocumentWorkflow.tsx        # Core: Template preview + fill form + generate DOCX
|   |   |   â”œ-- FillableField.tsx           # Single fillable form field component
|   |   |   â”œ-- StudentDocumentPage.tsx     # Shared layout wrapper for ALL student doc pages
|   |   |   +-- StructuredDocumentRenderer.tsx  # Structured JSON document form renderer
|   |   â”œ-- layout/
|   |   |   â”œ-- MainLayout.tsx              # App shell: sidebar + topbar + content outlet
|   |   |   â”œ-- PhaseGuard.tsx              # OJT phase lock wrapper (beforeOjt/inOjt/finals)
|   |   |   â”œ-- ProtectedRoute.tsx          # Role-based route access guard
|   |   |   â”œ-- Sidebar.tsx                 # Left navigation sidebar (role-aware)
|   |   |   +-- Topbar.tsx                  # Top navigation bar with search and actions
|   |   â”œ-- review/
|   |   |   â”œ-- AiAssistantPanel.tsx        # AI grammar/insight findings display panel
|   |   |   â”œ-- DocxViewer.tsx              # docx-preview renderer with TreeWalker placeholder scan
|   |   |   â”œ-- EmbedPdfWorkspace.tsx       # @embedpdf/react-pdf-viewer wrapper
|   |   |   â”œ-- UnifiedReviewSession.tsx    # Combined PDF/DOCX review + AI + comments workspace
|   |   |   +-- templateFields.ts           # Template field exports
|   |   +-- ui/
|   |       â”œ-- Badge.tsx                   # Theme-aware badge component
|   |       â”œ-- Button.tsx                  # Theme-aware button (variant="primary"|"outline"|etc.)
|   |       â”œ-- Card.tsx                    # Rounded card container
|   |       â”œ-- CommandPalette.tsx          # Keyboard shortcut command palette (Ctrl+K)
|   |       â”œ-- EmptyState.tsx              # Shared zero-state placeholder component
|   |       â”œ-- ErrorBoundary.tsx           # React error boundary wrapper
|   |       â”œ-- Input.tsx                   # Styled text input component
|   |       â”œ-- Skeleton.tsx               # Loading skeleton placeholder
|   |       +-- StatCard.tsx                # Dashboard metric/stat display card
|   â”œ-- config/
|   |   +-- templateFields.ts               # Template-specific fillable field definitions
|   â”œ-- hooks/
|   |   â”œ-- useDocumentStatus.ts            # Fetches latest submission status from Supabase
|   |   â”œ-- usePhaseLock.ts                 # Manages OJT phase lock/unlock state
|   |   +-- useSpeechToText.ts              # Browser Speech Recognition API wrapper
|   â”œ-- lib/
|   |   â”œ-- aiService.ts                    # Client-side proxy: POST /api/analyze
|   |   â”œ-- documentGenerator.ts            # DOCX generation: JSZip + easy-template-x + docx
|   |   â”œ-- excelGenerator.ts               # Excel DTR/journal generation: ExcelJS + XLSX
|   |   â”œ-- submissionStorage.ts            # Student doc upload, query, status sync (Supabase)
|   |   â”œ-- supabase.ts                     # Client-side Supabase instance (import.meta.env)
|   |   â”œ-- templateStorage.ts              # Template file + metadata storage (Supabase + IDB)
|   |   +-- utils.ts                        # cn() class merge helper (clsx + tailwind-merge)
|   â”œ-- pages/
|   |   â”œ-- admin/                          # 11 admin pages
|   |   |   â”œ-- AdminDashboard.tsx
|   |   |   â”œ-- AdminDocumentEditor.tsx
|   |   |   â”œ-- AdminReviewSession.tsx
|   |   |   â”œ-- Announcements.tsx
|   |   |   â”œ-- CompanyManagement.tsx
|   |   |   â”œ-- DocumentVerification.tsx
|   |   |   â”œ-- Monitoring.tsx
|   |   |   â”œ-- Reports.tsx
|   |   |   â”œ-- Settings.tsx
|   |   |   â”œ-- Templates.tsx
|   |   |   +-- UserManagement.tsx
|   |   â”œ-- adviser/                        # 11 adviser pages
|   |   |   â”œ-- AdviserComparison.tsx
|   |   |   â”œ-- AdviserDashboard.tsx
|   |   |   â”œ-- AdviserDocumentEditor.tsx
|   |   |   â”œ-- Approvals.tsx
|   |   |   â”œ-- ClassReports.tsx
|   |   |   â”œ-- CompanyEvaluations.tsx
|   |   |   â”œ-- DocumentReviewSession.tsx
|   |   |   â”œ-- Endorsements.tsx
|   |   |   â”œ-- MOAReview.tsx
|   |   |   â”œ-- MyStudents.tsx
|   |   |   +-- ReviewDocs.tsx
|   |   â”œ-- public/                         # Public auth & landing pages
|   |   |   â”œ-- ForgotPassword.tsx
|   |   |   â”œ-- LandingPage.tsx
|   |   |   +-- Login.tsx
|   |   â”œ-- shared/                         # Shared user pages (all roles)
|   |   |   â”œ-- Notifications.tsx
|   |   |   +-- Profile.tsx
|   |   â”œ-- student/                        # 11 student pages
|   |   |   â”œ-- DTR.tsx
|   |   |   â”œ-- IntegrationPaper.tsx
|   |   |   â”œ-- LetterOfConsent.tsx
|   |   |   â”œ-- MemorandumOfAgreement.tsx
|   |   |   â”œ-- OJTTrainingPlan.tsx
|   |   |   â”œ-- PerformanceAppraisal.tsx
|   |   |   â”œ-- ProposalLetterToTheIndustry.tsx
|   |   |   â”œ-- STIOJTEndorsementLetter.tsx
|   |   |   â”œ-- StudentApplicationLetter.tsx
|   |   |   â”œ-- StudentDashboard.tsx
|   |   |   +-- WeeklyJournal.tsx
|   |   +-- supervisor/                     # 5 supervisor pages
|   |       â”œ-- DTRApproval.tsx
|   |       â”œ-- InternshipCompletion.tsx
|   |       â”œ-- MyInterns.tsx
|   |       â”œ-- SupervisorDashboard.tsx
|   |       +-- WeeklyJournalReview.tsx
|   â”œ-- services/
|   |   â”œ-- FieldDetectionService.ts        # Auto-detects field bindings from StructuredDocument
|   |   â”œ-- TemplateValidator.ts            # Validates template version schemas
|   |   +-- parsers/
|   |       â”œ-- DocumentParser.ts           # Abstract parser interface
|   |       â”œ-- OpenDataLabParser.ts        # OpenDataLab document parser implementation
|   |       â”œ-- ParserErrors.ts             # Parser error type definitions
|   |       +-- ParserManager.ts            # Parser registry and orchestrator
|   â”œ-- types/
|   |   â”œ-- core.ts                         # Core domain types: User, Role, AiFindings, Company
|   |   â”œ-- index.ts                        # Barrel export for all types
|   |   +-- structuredDocument.ts           # Full structured document type system
|   â”œ-- App.tsx                             # Root router, session state, theme init
|   â”œ-- main.tsx                            # React DOM root render
|   â”œ-- types.ts                            # Re-exports from types/index.ts
|   â”œ-- index.css                           # Tailwind CSS v4 + print styles + theme tokens
|   +-- vite-env.d.ts                       # Vite environment type declarations
â”œ-- Features/Students/studentfeature.md     # Student workflow design spec
â”œ-- .env                                    # Local environment variables (git-ignored)
â”œ-- .env.example                            # Template for required environment variables
â”œ-- .gitignore
â”œ-- index.html                              # Vite HTML entry
â”œ-- metadata.json                           # Project metadata
â”œ-- package.json                            # Dependencies and npm scripts
â”œ-- tsconfig.json                           # TypeScript configuration (bundler mode, path aliases)
â”œ-- vercel.json                             # Vercel deployment config
+-- vite.config.ts                          # Vite bundler, dev proxy, HMR, path alias config
```

---

## Routing Architecture (from App.tsx)

### Public Routes

| Path | Component | Notes |
| :--- | :--- | :--- |
| `/` | `LandingPage` | Public landing page |
| `/login` | `Login` | Multi-role login, redirects if authenticated |
| `/forgot-password` | `ForgotPassword` | Password recovery |

### Student Routes (`/student/*`) — wrapped in `ProtectedRoute` + `PhaseGuard`

| Path | Component | Phase |
| :--- | :--- | :--- |
| `/student` | `StudentDashboard` | — |
| `/student/application-letter` | `StudentApplicationLetter` | beforeOjt |
| `/student/consent` | `LetterOfConsent` | beforeOjt |
| `/student/moa` | `MemorandumOfAgreement` | beforeOjt |
| `/student/endorsement` | `STIOJTEndorsementLetter` | beforeOjt |
| `/student/proposal` | `ProposalLetterToTheIndustry` | beforeOjt |
| `/student/dtr` | `DTR` | inOjt |
| `/student/journal` | `WeeklyJournal` | inOjt |
| `/student/training-plan` | `OJTTrainingPlan` | inOjt |
| `/student/evaluation` | `PerformanceAppraisal` | finals |
| `/student/completion` | `IntegrationPaper` | finals |

### Adviser Routes (`/adviser/*`)

| Path | Component |
| :--- | :--- |
| `/adviser` | `AdviserDashboard` |
| `/adviser/students` | `MyStudents` |
| `/adviser/review` | `ReviewDocs` |
| `/adviser/review/:id` | `DocumentReviewSession` |
| `/adviser/review/:id/edit` | `AdviserDocumentEditor` |
| `/adviser/endorsements` | `Endorsements` |
| `/adviser/moa` | `MOAReview` |
| `/adviser/evaluations` | `CompanyEvaluations` |
| `/adviser/comparison` | `AdviserComparison` |
| `/adviser/class-reports` | `ClassReports` |

### Supervisor Routes (`/supervisor/*`)

| Path | Component |
| :--- | :--- |
| `/supervisor` | `SupervisorDashboard` |
| `/supervisor/interns` | `MyInterns` |
| `/supervisor/dtr` | `DTRApproval` |
| `/supervisor/journal` | `WeeklyJournalReview` |
| `/supervisor/completion` | `InternshipCompletion` |

### Admin Routes (`/admin/*`)

| Path | Component |
| :--- | :--- |
| `/admin` | `AdminDashboard` |
| `/admin/monitoring` | `Monitoring` |
| `/admin/users` | `UserManagement` |
| `/admin/companies` | `CompanyManagement` |
| `/admin/documents` | `DocumentVerification` |
| `/admin/documents/:id` | `AdminReviewSession` |
| `/admin/documents/:id/edit` | `AdminDocumentEditor` |
| `/admin/templates` | `Templates` |
| `/admin/reports` | `Reports` |
| `/admin/settings` | `Settings` |
| `/admin/announcements` | `Announcements` |

---

## Core TypeScript Domain Types (from `src/types.ts`)

```typescript
type Role = 'admin' | 'adviser' | 'student' | 'supervisor';

interface User {
  id: string; username: string; name: string; role: Role; email: string;
  department?: string; studentId?: string; course?: string;
  adviserId?: string; companyName?: string; companyId?: string; supervisorId?: string;
}

type DocumentStatus = 'Pending Adviser Review' | 'Pending Final Approval' | 'Revision Required' | 'Approved';

interface AiFindings {
  overallAssessment: 'Good' | 'Needs Attention' | 'Critical Issues';
  grammarIssues: number;
  missingInformation: string[];
  consistencyIssues: string[];
  recommendations: string[];
  confidence: 'High' | 'Medium' | 'Low';
}
```

---

## Related Documentation & Cross-References

- [Backend & Database Architecture](BACKEND_AND_DATABASE.md) — Database tables, triggers, and RLS policies
- [Document Workflows & Template Generation](DOCUMENT_WORKFLOWS.md) — 13-template pipeline, preview, and generation
- [System Map & Code Locator](SYSTEM_MAP.md) — Problem-fix register and direct component targets
- [Feature Specifications Hub](../features/README.md) — Visual dataflow guides for all 8 core features
- [Deployment & Vercel Guide](../deployment/DEPLOYMENT_AND_VERCEL.md) — Vercel serverless functions and environment variables
- [Active Tasks & Roadmap](../tasks/TASKS.md) — Current development tasks and milestones
