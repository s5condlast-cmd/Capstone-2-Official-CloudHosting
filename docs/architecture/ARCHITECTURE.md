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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                            CLIENT (Browser)                            â”‚
â”‚                                                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  Student Portal   â”‚  â”‚  Adviser Portal   â”‚  â”‚  Supervisor Portal   â”‚  â”‚
â”‚  â”‚ StudentDocPage    â”‚  â”‚ ReviewDocs        â”‚  â”‚ DTRApproval          â”‚  â”‚
â”‚  â”‚ DocumentWorkflow  â”‚  â”‚ UnifiedReview     â”‚  â”‚ WeeklyJournalReview  â”‚  â”‚
â”‚  â”‚ DTR / Journals    â”‚  â”‚ Approvals         â”‚  â”‚ InternshipCompletion â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  Admin Portal: Templates, DocumentVerification, Monitoring,      â”‚   â”‚
â”‚  â”‚  UserManagement, CompanyManagement, Reports, Settings            â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                                         â”‚
â”‚  Document Engines:                                                      â”‚
â”‚    @embedpdf/react-pdf-viewer â”‚ docx-preview â”‚ easy-template-x         â”‚
â”‚    ExcelJS â”‚ docx â”‚ XLSX                                                â”‚
â”‚                                                                         â”‚
â”‚  Client-Side Supabase Client (src/lib/supabase.ts)                     â”‚
â”‚    ← ’ Reads: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚                             â”‚
          â–¼                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EXPRESS BACKEND     â”‚     â”‚  SUPABASE                â”‚
â”‚  (api/server.ts ← ’    â”‚     â”‚                           â”‚
â”‚   backend/server.ts) â”‚     â”‚  PostgreSQL Tables:       â”‚
â”‚                      â”‚     â”‚   ”¢ student_documents     â”‚
â”‚ POST /api/analyze    â”‚     â”‚   ”¢ template_metadata     â”‚
â”‚  1. pdf-parse text   â”‚     â”‚   ”¢ document_templates    â”‚
â”‚  2. Groq AI (primary)â”‚     â”‚   ”¢ document_template_    â”‚
â”‚  3. Gemini (fallback)â”‚     â”‚     versions              â”‚
â”‚  4. Save findings    â”‚     â”‚   ”¢ document_instances    â”‚
â”‚     to Supabase DB   â”‚     â”‚                           â”‚
â”‚                      â”‚     â”‚  Storage Buckets:         â”‚
â”‚ Reads env vars:      â”‚     â”‚   ”¢ student_submissions   â”‚
â”‚  VITE_SUPABASE_URL   â”‚     â”‚   ”¢ templates             â”‚
â”‚  VITE_SUPABASE_ANON  â”‚     â”‚                           â”‚
â”‚  VITE_GROQ_API_KEY   â”‚     â”‚  Row Level Security: ON   â”‚
â”‚  GEMINI_API_KEY      â”‚     â”‚  (per-role JWT policies)  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Directory Layout (Verified)

```text
MainCode/
â”œâ”€â”€ .agents/
â”‚   â””â”€â”€ AGENTS.md                   # Agent rules, coding constraints, operational protocols
â”œâ”€â”€ api/
â”‚   â””â”€â”€ server.ts                   # Vercel serverless entrypoint (re-exports backend/server.ts)
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/supabase.ts          # Server-side Supabase client (uses dotenv)
â”‚   â”œâ”€â”€ routes/analyze.ts           # POST /api/analyze — AI document analysis route
â”‚   â”œâ”€â”€ services/aiService.ts       # Groq ← ’ Gemini fallback AI pipeline
â”‚   â”œâ”€â”€ utils/pdfParser.ts          # pdf-parse text extraction from PDF buffers
â”‚   â””â”€â”€ server.ts                   # Express app: CORS, JSON, /api mount, conditional listen()
â”œâ”€â”€ docs/                           # Technical documentation (this directory)
â”œâ”€â”€ public/
â”‚   â””â”€â”€ images/                     # Static assets: hero-bg.png, students-box.png, etc.
â”‚       â””â”€â”€ Landing Page Icons/     # Dedicated landing page vector SVGs:
â”‚           â”œâ”€â”€ Logo.svg                   # Official Practicum Portal SVG brand logo
â”‚           â”œâ”€â”€ Landing Page Post.svg      # Document post SVG vector icon
â”‚           â”œâ”€â”€ Landing Page key Points.svg# DTR key points SVG vector icon
â”‚           â””â”€â”€ Landing Page Selfie.svg    # Student selfie SVG graphic
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ push_to_github.bat          # Git staging, commit, and push script
â”œâ”€â”€ supabase/
â”‚   â””â”€â”€ migrations/
â”‚       â”œâ”€â”€ 01_initial_schema.sql            # Master database tables, triggers, indexes, and table RLS policies
â”‚       â””â”€â”€ 02_storage_security_policies.sql # Storage buckets and scoped storage security policies
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ admin/
â”‚   â”‚   â”‚   â””â”€â”€ VisualTemplateBuilder.tsx   # Admin template schema visual editor
â”‚   â”‚   â”œâ”€â”€ compose/
â”‚   â”‚   â”‚   â”œâ”€â”€ ComposeButton.tsx           # Floating compose trigger button
â”‚   â”‚   â”‚   â”œâ”€â”€ ComposeModal.tsx            # Document compose modal dialog
â”‚   â”‚   â”‚   â”œâ”€â”€ DocumentForm.tsx            # Dynamic form field renderer
â”‚   â”‚   â”‚   â”œâ”€â”€ DocumentProgressTimeline.tsx # Document status timeline tracker
â”‚   â”‚   â”‚   â”œâ”€â”€ DocumentWorkflow.tsx        # Core: Template preview + fill form + generate DOCX
â”‚   â”‚   â”‚   â”œâ”€â”€ FillableField.tsx           # Single fillable form field component
â”‚   â”‚   â”‚   â”œâ”€â”€ StudentDocumentPage.tsx     # Shared layout wrapper for ALL student doc pages
â”‚   â”‚   â”‚   â””â”€â”€ StructuredDocumentRenderer.tsx  # Structured JSON document form renderer
â”‚   â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”‚   â”œâ”€â”€ MainLayout.tsx              # App shell: sidebar + topbar + content outlet
â”‚   â”‚   â”‚   â”œâ”€â”€ PhaseGuard.tsx              # OJT phase lock wrapper (beforeOjt/inOjt/finals)
â”‚   â”‚   â”‚   â”œâ”€â”€ ProtectedRoute.tsx          # Role-based route access guard
â”‚   â”‚   â”‚   â”œâ”€â”€ Sidebar.tsx                 # Left navigation sidebar (role-aware)
â”‚   â”‚   â”‚   â””â”€â”€ Topbar.tsx                  # Top navigation bar with search and actions
â”‚   â”‚   â”œâ”€â”€ review/
â”‚   â”‚   â”‚   â”œâ”€â”€ AiAssistantPanel.tsx        # AI grammar/insight findings display panel
â”‚   â”‚   â”‚   â”œâ”€â”€ DocxViewer.tsx              # docx-preview renderer with TreeWalker placeholder scan
â”‚   â”‚   â”‚   â”œâ”€â”€ EmbedPdfWorkspace.tsx       # @embedpdf/react-pdf-viewer wrapper
â”‚   â”‚   â”‚   â”œâ”€â”€ UnifiedReviewSession.tsx    # Combined PDF/DOCX review + AI + comments workspace
â”‚   â”‚   â”‚   â””â”€â”€ templateFields.ts           # Template field exports
â”‚   â”‚   â””â”€â”€ ui/
â”‚   â”‚       â”œâ”€â”€ Badge.tsx                   # Theme-aware badge component
â”‚   â”‚       â”œâ”€â”€ Button.tsx                  # Theme-aware button (variant="primary"|"outline"|etc.)
â”‚   â”‚       â”œâ”€â”€ Card.tsx                    # Rounded card container
â”‚   â”‚       â”œâ”€â”€ CommandPalette.tsx          # Keyboard shortcut command palette (Ctrl+K)
â”‚   â”‚       â”œâ”€â”€ EmptyState.tsx              # Shared zero-state placeholder component
â”‚   â”‚       â”œâ”€â”€ ErrorBoundary.tsx           # React error boundary wrapper
â”‚   â”‚       â”œâ”€â”€ Input.tsx                   # Styled text input component
â”‚   â”‚       â”œâ”€â”€ Skeleton.tsx               # Loading skeleton placeholder
â”‚   â”‚       â””â”€â”€ StatCard.tsx                # Dashboard metric/stat display card
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ templateFields.ts               # Template-specific fillable field definitions
â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”œâ”€â”€ useDocumentStatus.ts            # Fetches latest submission status from Supabase
â”‚   â”‚   â”œâ”€â”€ usePhaseLock.ts                 # Manages OJT phase lock/unlock state
â”‚   â”‚   â””â”€â”€ useSpeechToText.ts              # Browser Speech Recognition API wrapper
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ aiService.ts                    # Client-side proxy: POST /api/analyze
â”‚   â”‚   â”œâ”€â”€ documentGenerator.ts            # DOCX generation: JSZip + easy-template-x + docx
â”‚   â”‚   â”œâ”€â”€ excelGenerator.ts               # Excel DTR/journal generation: ExcelJS + XLSX
â”‚   â”‚   â”œâ”€â”€ submissionStorage.ts            # Student doc upload, query, status sync (Supabase)
â”‚   â”‚   â”œâ”€â”€ supabase.ts                     # Client-side Supabase instance (import.meta.env)
â”‚   â”‚   â”œâ”€â”€ templateStorage.ts              # Template file + metadata storage (Supabase + IDB)
â”‚   â”‚   â””â”€â”€ utils.ts                        # cn() class merge helper (clsx + tailwind-merge)
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ admin/                          # 11 admin pages
â”‚   â”‚   â”‚   â”œâ”€â”€ AdminDashboard.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AdminDocumentEditor.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AdminReviewSession.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Announcements.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ CompanyManagement.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ DocumentVerification.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Monitoring.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Reports.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Settings.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Templates.tsx
â”‚   â”‚   â”‚   â””â”€â”€ UserManagement.tsx
â”‚   â”‚   â”œâ”€â”€ adviser/                        # 11 adviser pages
â”‚   â”‚   â”‚   â”œâ”€â”€ AdviserComparison.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AdviserDashboard.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AdviserDocumentEditor.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Approvals.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ClassReports.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ CompanyEvaluations.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ DocumentReviewSession.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Endorsements.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MOAReview.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MyStudents.tsx
â”‚   â”‚   â”‚   â””â”€â”€ ReviewDocs.tsx
â”‚   â”‚   â”œâ”€â”€ public/                         # Public auth & landing pages
â”‚   â”‚   â”‚   â”œâ”€â”€ ForgotPassword.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ LandingPage.tsx
â”‚   â”‚   â”‚   â””â”€â”€ Login.tsx
â”‚   â”‚   â”œâ”€â”€ shared/                         # Shared user pages (all roles)
â”‚   â”‚   â”‚   â”œâ”€â”€ Notifications.tsx
â”‚   â”‚   â”‚   â””â”€â”€ Profile.tsx
â”‚   â”‚   â”œâ”€â”€ student/                        # 11 student pages
â”‚   â”‚   â”‚   â”œâ”€â”€ DTR.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ IntegrationPaper.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ LetterOfConsent.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MemorandumOfAgreement.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ OJTTrainingPlan.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ PerformanceAppraisal.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ProposalLetterToTheIndustry.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ STIOJTEndorsementLetter.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ StudentApplicationLetter.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ StudentDashboard.tsx
â”‚   â”‚   â”‚   â””â”€â”€ WeeklyJournal.tsx
â”‚   â”‚   â””â”€â”€ supervisor/                     # 5 supervisor pages
â”‚   â”‚       â”œâ”€â”€ DTRApproval.tsx
â”‚   â”‚       â”œâ”€â”€ InternshipCompletion.tsx
â”‚   â”‚       â”œâ”€â”€ MyInterns.tsx
â”‚   â”‚       â”œâ”€â”€ SupervisorDashboard.tsx
â”‚   â”‚       â””â”€â”€ WeeklyJournalReview.tsx
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ FieldDetectionService.ts        # Auto-detects field bindings from StructuredDocument
â”‚   â”‚   â”œâ”€â”€ TemplateValidator.ts            # Validates template version schemas
â”‚   â”‚   â””â”€â”€ parsers/
â”‚   â”‚       â”œâ”€â”€ DocumentParser.ts           # Abstract parser interface
â”‚   â”‚       â”œâ”€â”€ OpenDataLabParser.ts        # OpenDataLab document parser implementation
â”‚   â”‚       â”œâ”€â”€ ParserErrors.ts             # Parser error type definitions
â”‚   â”‚       â””â”€â”€ ParserManager.ts            # Parser registry and orchestrator
â”‚   â”œâ”€â”€ types/
â”‚   â”‚   â”œâ”€â”€ core.ts                         # Core domain types: User, Role, AiFindings, Company
â”‚   â”‚   â”œâ”€â”€ index.ts                        # Barrel export for all types
â”‚   â”‚   â””â”€â”€ structuredDocument.ts           # Full structured document type system
â”‚   â”œâ”€â”€ App.tsx                             # Root router, session state, theme init
â”‚   â”œâ”€â”€ main.tsx                            # React DOM root render
â”‚   â”œâ”€â”€ types.ts                            # Re-exports from types/index.ts
â”‚   â”œâ”€â”€ index.css                           # Tailwind CSS v4 + print styles + theme tokens
â”‚   â””â”€â”€ vite-env.d.ts                       # Vite environment type declarations
â”œâ”€â”€ Features/Students/studentfeature.md     # Student workflow design spec
â”œâ”€â”€ .env                                    # Local environment variables (git-ignored)
â”œâ”€â”€ .env.example                            # Template for required environment variables
â”œâ”€â”€ .gitignore
â”œâ”€â”€ index.html                              # Vite HTML entry
â”œâ”€â”€ metadata.json                           # Project metadata
â”œâ”€â”€ package.json                            # Dependencies and npm scripts
â”œâ”€â”€ tsconfig.json                           # TypeScript configuration (bundler mode, path aliases)
â”œâ”€â”€ vercel.json                             # Vercel deployment config
â””â”€â”€ vite.config.ts                          # Vite bundler, dev proxy, HMR, path alias config
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
