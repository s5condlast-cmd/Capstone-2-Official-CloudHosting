# System Architecture & Technical Specification

## Overview

The **Web-Based Practicum Management System with AI** is a full-stack web application for STI College Marikina. It manages student OJT (On-the-Job Training) across three phases: **Before OJT**, **In OJT**, and **Finals**.

**Frontend**: React 19 SPA bundled by Vite 6, styled with Tailwind CSS v4.  
**Backend**: Express.js API server (runs locally on port 3001, deploys as a Vercel Serverless Function).  
**Database & Storage**: Supabase (PostgreSQL + Blob Storage), with IndexedDB and localStorage offline fallbacks.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Browser)                            │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Student Portal   │  │  Adviser Portal   │  │  Supervisor Portal   │  │
│  │ StudentDocPage    │  │ ReviewDocs        │  │ DTRApproval          │  │
│  │ DocumentWorkflow  │  │ UnifiedReview     │  │ WeeklyJournalReview  │  │
│  │ DTR / Journals    │  │ Approvals         │  │ InternshipCompletion │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Admin Portal: Templates, DocumentVerification, Monitoring,      │   │
│  │  UserManagement, CompanyManagement, Reports, Settings            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Document Engines:                                                      │
│    @embedpdf/react-pdf-viewer │ docx-preview │ easy-template-x         │
│    ExcelJS │ docx │ XLSX                                                │
│                                                                         │
│  Client-Side Supabase Client (src/lib/supabase.ts)                     │
│    → Reads: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY                 │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────────┐     ┌─────────────────────────┐
│  EXPRESS BACKEND     │     │  SUPABASE                │
│  (api/server.ts →    │     │                           │
│   backend/server.ts) │     │  PostgreSQL Tables:       │
│                      │     │   • student_documents     │
│ POST /api/analyze    │     │   • template_metadata     │
│  1. pdf-parse text   │     │   • document_templates    │
│  2. Groq AI (primary)│     │   • document_template_    │
│  3. Gemini (fallback)│     │     versions              │
│  4. Save findings    │     │   • document_instances    │
│     to Supabase DB   │     │                           │
│                      │     │  Storage Buckets:         │
│ Reads env vars:      │     │   • student_submissions   │
│  VITE_SUPABASE_URL   │     │   • templates             │
│  VITE_SUPABASE_ANON  │     │                           │
│  VITE_GROQ_API_KEY   │     │  Row Level Security: ON   │
│  GEMINI_API_KEY      │     │  (per-role JWT policies)  │
└─────────────────────┘     └─────────────────────────┘
```

---

## Directory Layout (Verified)

```
MainCode/
├── .agents/
│   └── AGENTS.md                   # Agent rules, coding constraints, operational protocols
├── api/
│   └── server.ts                   # Vercel serverless entrypoint (re-exports backend/server.ts)
├── backend/
│   ├── config/supabase.ts          # Server-side Supabase client (uses dotenv)
│   ├── routes/analyze.ts           # POST /api/analyze — AI document analysis route
│   ├── services/aiService.ts       # Groq → Gemini fallback AI pipeline
│   ├── utils/pdfParser.ts          # pdf-parse text extraction from PDF buffers
│   └── server.ts                   # Express app: CORS, JSON, /api mount, conditional listen()
├── docs/                           # Technical documentation (this directory)
├── public/
│   └── images/                     # Static assets: hero-bg.png, students-box.png, etc.
│       └── Landing Page Icons/     # Dedicated landing page vector SVGs:
│           ├── Logo.svg                   # Official Practicum Portal SVG brand logo
│           ├── Landing Page Post.svg      # Document post SVG vector icon
│           ├── Landing Page key Points.svg# DTR key points SVG vector icon
│           └── Landing Page Selfie.svg    # Student selfie SVG graphic
├── scripts/
│   └── push_to_github.bat          # Git staging, commit, and push script
├── supabase/
│   └── migrations/
│       └── 20260724_template_platform.sql  # Full SQL schema with RLS policies
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── VisualTemplateBuilder.tsx   # Admin template schema visual editor
│   │   ├── compose/
│   │   │   ├── ComposeButton.tsx           # Floating compose trigger button
│   │   │   ├── ComposeModal.tsx            # Document compose modal dialog
│   │   │   ├── DocumentForm.tsx            # Dynamic form field renderer
│   │   │   ├── DocumentProgressTimeline.tsx # Document status timeline tracker
│   │   │   ├── DocumentWorkflow.tsx        # Core: Template preview + fill form + generate DOCX
│   │   │   ├── FillableField.tsx           # Single fillable form field component
│   │   │   └── StudentDocumentPage.tsx     # Shared layout wrapper for ALL student doc pages
│   │   ├── composer/
│   │   │   └── StructuredDocumentRenderer.tsx  # Structured JSON document form renderer
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx              # App shell: sidebar + topbar + content outlet
│   │   │   ├── PhaseGuard.tsx              # OJT phase lock wrapper (beforeOjt/inOjt/finals)
│   │   │   ├── ProtectedRoute.tsx          # Role-based route access guard
│   │   │   ├── Sidebar.tsx                 # Left navigation sidebar (role-aware)
│   │   │   └── Topbar.tsx                  # Top navigation bar with search and actions
│   │   ├── review/
│   │   │   ├── AiAssistantPanel.tsx        # AI grammar/insight findings display panel
│   │   │   ├── DocxViewer.tsx              # docx-preview renderer with TreeWalker placeholder scan
│   │   │   ├── EmbedPdfWorkspace.tsx       # @embedpdf/react-pdf-viewer wrapper
│   │   │   ├── UnifiedReviewSession.tsx    # Combined PDF/DOCX review + AI + comments workspace
│   │   │   └── templateFields.ts           # Template-specific fillable field definitions
│   │   └── ui/
│   │       ├── Badge.tsx                   # Theme-aware badge component
│   │       ├── Button.tsx                  # Theme-aware button (variant="primary"|"outline"|etc.)
│   │       ├── Card.tsx                    # Rounded card container
│   │       ├── CommandPalette.tsx          # Keyboard shortcut command palette (Ctrl+K)
│   │       ├── EmptyState.tsx              # Shared zero-state placeholder component
│   │       ├── ErrorBoundary.tsx           # React error boundary wrapper
│   │       ├── Input.tsx                   # Styled text input component
│   │       ├── Skeleton.tsx               # Loading skeleton placeholder
│   │       └── StatCard.tsx                # Dashboard metric/stat display card
│   ├── hooks/
│   │   ├── useDocumentStatus.ts            # Fetches latest submission status from Supabase
│   │   ├── usePhaseLock.ts                 # Manages OJT phase lock/unlock state
│   │   └── useSpeechToText.ts              # Browser Speech Recognition API wrapper
│   ├── lib/
│   │   ├── aiService.ts                    # Client-side proxy: POST /api/analyze
│   │   ├── documentGenerator.ts            # DOCX generation: JSZip + easy-template-x + docx
│   │   ├── excelGenerator.ts               # Excel DTR/journal generation: ExcelJS + XLSX
│   │   ├── submissionStorage.ts            # Student doc upload, query, status sync (Supabase)
│   │   ├── supabase.ts                     # Client-side Supabase instance (import.meta.env)
│   │   ├── templateStorage.ts              # Template file + metadata storage (Supabase + IDB)
│   │   └── utils.ts                        # cn() class merge helper (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── admin/                          # 11 admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminDocumentEditor.tsx
│   │   │   ├── AdminReviewSession.tsx
│   │   │   ├── Announcements.tsx
│   │   │   ├── CompanyManagement.tsx
│   │   │   ├── DocumentVerification.tsx
│   │   │   ├── Monitoring.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Templates.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── adviser/                        # 11 adviser pages
│   │   │   ├── AdviserComparison.tsx
│   │   │   ├── AdviserDashboard.tsx
│   │   │   ├── AdviserDocumentEditor.tsx
│   │   │   ├── Approvals.tsx
│   │   │   ├── ClassReports.tsx
│   │   │   ├── CompanyEvaluations.tsx
│   │   │   ├── DocumentReviewSession.tsx
│   │   │   ├── Endorsements.tsx
│   │   │   ├── MOAReview.tsx
│   │   │   ├── MyStudents.tsx
│   │   │   └── ReviewDocs.tsx
│   │   ├── public/
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── LandingPage.tsx
│   │   ├── student/                        # 11 student pages
│   │   │   ├── DTR.tsx
│   │   │   ├── IntegrationPaper.tsx
│   │   │   ├── LetterOfConsent.tsx
│   │   │   ├── MemorandumOfAgreement.tsx
│   │   │   ├── OJTTrainingPlan.tsx
│   │   │   ├── PerformanceAppraisal.tsx
│   │   │   ├── ProposalLetterToTheIndustry.tsx
│   │   │   ├── STIOJTEndorsementLetter.tsx
│   │   │   ├── StudentApplicationLetter.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── WeeklyJournal.tsx
│   │   ├── supervisor/                     # 5 supervisor pages
│   │   │   ├── DTRApproval.tsx
│   │   │   ├── InternshipCompletion.tsx
│   │   │   ├── MyInterns.tsx
│   │   │   ├── SupervisorDashboard.tsx
│   │   │   └── WeeklyJournalReview.tsx
│   │   ├── Login.tsx
│   │   ├── Notifications.tsx
│   │   └── Profile.tsx
│   ├── services/
│   │   ├── FieldDetectionService.ts        # Auto-detects field bindings from StructuredDocument
│   │   ├── TemplateValidator.ts            # Validates template version schemas
│   │   └── parsers/
│   │       ├── DocumentParser.ts           # Abstract parser interface
│   │       ├── OpenDataLabParser.ts        # OpenDataLab document parser implementation
│   │       ├── ParserErrors.ts             # Parser error type definitions
│   │       └── ParserManager.ts            # Parser registry and orchestrator
│   ├── types/
│   │   └── structuredDocument.ts           # Full structured document type system
│   ├── utils/
│   │   └── templateGenerator.ts            # Legacy HTML-to-DOC template generator
│   ├── App.tsx                             # Root router, session state, theme init
│   ├── main.tsx                            # React DOM root render
│   ├── types.ts                            # Core domain types: User, Role, AiFindings, Company
│   ├── index.css                           # Tailwind CSS v4 + print styles + theme tokens
│   └── vite-env.d.ts                       # Vite environment type declarations
├── Features/Students/studentfeature.md     # Student workflow design spec
├── .env                                    # Local environment variables (git-ignored)
├── .env.example                            # Template for required environment variables
├── .gitignore
├── index.html                              # Vite HTML entry
├── metadata.json                           # Project metadata
├── package.json                            # Dependencies and npm scripts
├── tsconfig.json                           # TypeScript configuration (bundler mode, path aliases)
├── vercel.json                             # Vercel deployment config
└── vite.config.ts                          # Vite bundler, dev proxy, HMR, path alias config
```

---

## Routing Architecture (from App.tsx)

### Public Routes
| Path | Component | Notes |
|:---|:---|:---|
| `/` | `LandingPage` | Public landing page |
| `/login` | `Login` | Multi-role login, redirects if authenticated |
| `/forgot-password` | `ForgotPassword` | Password recovery |

### Student Routes (`/student/*`) — wrapped in `ProtectedRoute` + `PhaseGuard`
| Path | Component | Phase |
|:---|:---|:---|
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
|:---|:---|
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
|:---|:---|
| `/supervisor` | `SupervisorDashboard` |
| `/supervisor/interns` | `MyInterns` |
| `/supervisor/dtr` | `DTRApproval` |
| `/supervisor/journal` | `WeeklyJournalReview` |
| `/supervisor/completion` | `InternshipCompletion` |

### Admin Routes (`/admin/*`)
| Path | Component |
|:---|:---|
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
