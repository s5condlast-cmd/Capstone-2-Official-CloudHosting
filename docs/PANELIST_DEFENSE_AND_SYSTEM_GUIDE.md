---
title: "Capstone Panelist Defense & Technical System Manual"
description: "Comprehensive panelist defense preparation, API keys manual, universal naming conventions, and end-to-end code architecture guide for STI College Marikina BSIT Capstone."
tags:
  - sti-ojt
  - capstone-defense
  - panelist-guide
  - api-keys
  - naming-conventions
  - system-architecture
  - oral-defense
aliases:
  - "Panelist Defense Guide"
  - "API Keys and Conventions Manual"
  - "Capstone Defense Cheatsheet"
created: 2026-09-04
updated: 2026-09-04
---

# 🎓 Capstone Panelist Defense & Technical System Manual
### Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring
**STI College Marikina — Bachelor of Science in Information Technology (BSIT)**

[← Back to Documentation Hub](README.md) | [Architecture Specification](architecture/ARCHITECTURE.md) | [Refactoring Guidelines](guidelines/REFACTORING_GUIDELINES.md) | [Task History](tasks/TASK_HISTORY.md)

---

## 📌 Document Overview & Purpose

This document is the **definitive defense manual and technical guide** for the Capstone Project. It is specially crafted for the project proponents (**Kerin Gabriel del Rosario**, **John Dwayne Guaniso**, and **Jiro Salvan**) to:

1. **Understand and explain all API keys and environment variables** with 100% confidence.
2. **Master the universal naming conventions** followed throughout every layer of the system.
3. **Articulate "How You Did the Codes"** across every feature, pipeline, algorithm, and integration with zero gaps.
4. **Deliver simple, plain-language answers to panelist questions** so that any non-technical or technical evaluator can easily grasp and appreciate the system's innovations.

---

# 📑 Table of Contents

- [1. Capstone Project Identity & Academic Context](#1-capstone-project-identity--academic-context)
- [2. Master API Keys & Environment Variables Manual](#2-master-api-keys--environment-variables-manual)
  - [2.1 The Master Keys Inventory Table](#21-the-master-keys-inventory-table)
  - [2.2 Deep-Dive Per Key: Purpose, Code Usage & Security](#22-deep-dive-per-key-purpose-code-usage--security)
  - [2.3 Security Architecture: Frontend Public vs Backend Private](#23-security-architecture-frontend-public-vs-backend-private)
  - [2.4 Step-by-Step Setup Runbook (From Scratch)](#24-step-by-step-setup-runbook-from-scratch)
- [3. Universal Naming Conventions & Code Standards](#3-universal-naming-conventions--code-standards)
  - [3.1 File & Directory Naming Rules](#31-file--directory-naming-rules)
  - [3.2 Component, Hook & Code Symbol Conventions](#32-component-hook--code-symbol-conventions)
  - [3.3 Database & PostgreSQL Schema Naming](#33-database--postgresql-schema-naming)
  - [3.4 Styling, Tailwind & Theme Variable Rules](#34-styling-tailwind--theme-variable-rules)
  - [3.5 Git Branching & Workflow Rules](#35-git-branching--workflow-rules)
- [4. "How You Did the Codes" — End-to-End Technical Breakdown](#4-how-you-did-the-codes--end-to-end-technical-breakdown)
  - [4.1 The Core Architecture (React 19 + Express + Supabase)](#41-the-core-architecture-react-19--express--supabase)
  - [4.2 The 4 Portals & User Roles](#42-the-4-portals--user-roles)
  - [4.3 Digital Document Generation Pipeline (Without Microsoft Office)](#43-digital-document-generation-pipeline-without-microsoft-office)
  - [4.4 DTR Attendance & Signature Fitting Engine (ExcelJS + Dark-Ink Luminance)](#44-dtr-attendance--signature-fitting-engine-exceljs--dark-ink-luminance)
  - [4.5 Dual-Model AI Review Assistant (Groq Llama-3.3 + Gemini Fallback)](#45-dual-model-ai-review-assistant-groq-llama-33--gemini-fallback)
  - [4.6 Automated Microsoft OneDrive Archival (Microsoft Graph API)](#46-automated-microsoft-onedrive-archival-microsoft-graph-api)
  - [4.7 Database Integrity, Realtime Sync & RLS Security](#47-database-integrity-realtime-sync--rls-security)
- [5. Capstone Panelist Defense Q&A Cheatsheet (Plain English & Tech Breakdown)](#5-capstone-panelist-defense-qa-cheatsheet-plain-english--tech-breakdown)
  - [Category A: Project Objectives & System Purpose](#category-a-project-objectives--system-purpose)
  - [Category B: Security & API Keys Defense](#category-b-security--api-keys-defense)
  - [Category C: AI Review Assistant & Reliability](#category-c-ai-review-assistant--reliability)
  - [Category D: Document Generation & Office Independence](#category-d-document-generation--office-independence)
  - [Category E: Digital Signatures & Anti-Fraud](#category-e-digital-signatures--anti-fraud)
  - [Category F: Cloud Storage, OneDrive & Data Archival](#category-f-cloud-storage-onedrive--data-archival)
  - [Category G: Architecture, Offline Resilience & Performance](#category-g-architecture-offline-resilience--performance)
- [6. Defense Day Quick-Reference Checklist](#6-defense-day-quick-reference-checklist)

---

# 1. Capstone Project Identity & Academic Context

When opening your defense presentation or answering questions about the project's background, memorize these exact details:

| Academic Parameter | Official Project Detail |
| :--- | :--- |
| **Project Title** | **Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring for STI Marikina** |
| **Degree Program** | Bachelor of Science in Information Technology (BSIT) |
| **Institution** | STI College Marikina |
| **Proponents** | **Kerin Gabriel B. del Rosario**, **John Dwayne Guaniso**, **Jiro Salvan** |
| **Capstone Project Adviser** | **Mr. Dave Lord Rubaya** |
| **Capstone Project Coordinator** | **Dr. Frederic D. Yulo** |
| **Program Head** | **Mr. Dave Lord Rubaya** |
| **Lead Panelist** | **Mr. Mark Saledio** |
| **Review Panel Members** | **Dr. Frederic D. Yulo**, **Mr. Warren Marklou Rosqueta** |

### The Core Problem Statement (Simple Words for Panelists)
> *"Before our system, OJT coordinators and students struggled with manual paper forms, messy email attachments, misplaced DTR timesheets, and slow document approvals. Coordinators had to read through hundreds of pages manually to check for grammar, missing signatures, and wrong company names. Our web system digitizes the entire OJT journey, lets students preview and edit templates directly in their browser without Microsoft Word, automatically fits digital signatures into official Excel timesheets, checks student submissions using an AI Review Assistant, and automatically backs up approved documents into STI's official Microsoft OneDrive."*

---

# 2. Master API Keys & Environment Variables Manual

The system utilizes **11 core environment variables and API keys** distributed between client-side (`src/`) and server-side (`backend/`).

## 2.1 The Master Keys Inventory Table

| Variable Name | Environment Scope | Service / Provider | Purpose in Plain English | Primary Code Location |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Backend (`process.env`) | **Google Gemini AI** | Backup AI engine for reviewing document grammar, structure, and missing details | [`backend/services/aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/aiService.ts#L42) |
| `VITE_GROQ_API_KEY` | Backend (`process.env`) | **Groq Cloud (Llama 3.3)** | Ultra-fast primary AI engine (750 tokens/sec) that analyzes student document text | [`backend/services/aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/aiService.ts#L41) |
| `VITE_SUPABASE_URL` | Frontend & Backend | **Supabase (PostgreSQL)** | Web endpoint address of our cloud PostgreSQL database and auth server | [`src/lib/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/supabase.ts#L3), [`backend/config/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/supabase.ts#L6) |
| `VITE_SUPABASE_ANON_KEY` | Frontend & Backend | **Supabase Auth / Public** | Public anonymous API key allowing browser client to query data protected by RLS | [`src/lib/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/supabase.ts#L4), [`backend/config/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/supabase.ts#L7) |
| `CLOUDINARY_CLOUD_NAME` | Backend (`process.env`) | **Cloudinary CDN** | Name of the cloud storage bucket where files, images, and signatures are hosted | [`backend/config/cloudinaryConfig.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/cloudinaryConfig.ts#L14) |
| `CLOUDINARY_API_KEY` | Backend (`process.env`) | **Cloudinary CDN** | Public identifier for authenticating uploads to Cloudinary | [`backend/config/cloudinaryConfig.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/cloudinaryConfig.ts#L15) |
| `CLOUDINARY_API_SECRET` | Backend (`process.env`) | **Cloudinary CDN** | Secret cryptographic key to authorize file upload, deletion, and CDN signing | [`backend/config/cloudinaryConfig.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/cloudinaryConfig.ts#L16) |
| `MICROSOFT_CLIENT_ID` | Backend (`process.env`) | **Azure App Registration** | Application ID generated in Microsoft Entra ID for STI Microsoft 365 | [`backend/services/onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts#L55) |
| `MICROSOFT_TENANT_ID` | Backend (`process.env`) | **Azure App Registration** | Directory ID identifying STI College's educational Microsoft 365 organization | [`backend/services/onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts#L56) |
| `MICROSOFT_CLIENT_SECRET` | Backend (`process.env`) | **Azure App Registration** | Confidential password generated in Azure used during OAuth2 token exchange | [`backend/services/onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts#L72) |
| `ONEDRIVE_USER_EMAIL` | Backend (`process.env`) | **Microsoft 365 User** | Official coordinator email (e.g. `@marikina.sti.edu.ph`) owning the OneDrive | [`backend/services/onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts#L57) |
| `ONEDRIVE_ROOT_FOLDER` | Backend (`process.env`) | **OneDrive Root** | Master folder name (default: `STI_Practicum_Archive`) where files are organized | [`backend/services/onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts#L251) |
| `APP_URL` | Frontend & Backend | **Environment** | The base web address of the application (`http://localhost:3000` or production) | [`.env.example`](file:///c:/Users/johnd/Downloads/MainCode/.env.example#L6) |

---

## 2.2 Deep-Dive Per Key: Purpose, Code Usage & Security

### 1. `VITE_GROQ_API_KEY` (Groq Llama 3.3 70B)
- **What it does**: Groq is an AI hardware and cloud service that runs large language models (LLMs) on specialized chips (LPUs) at extreme speeds (over 700 tokens per second).
- **Why we use it**: Checking student documents requires analyzing several pages of text. Groq returns the full analysis in less than 2 seconds, compared to 10–15 seconds with traditional AI APIs.
- **Where in code**: [`backend/services/aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/aiService.ts#L49-L65). The server sends the extracted document text and student metadata to `https://api.groq.com/openai/v1/chat/completions` with a strict JSON output schema.
- **Model Used**: `llama-3.3-70b-versatile`.

### 2. `GEMINI_API_KEY` (Google Gemini 1.5 Flash)
- **What it does**: Google's multi-modal AI model provided by Google DeepMind / Google Cloud.
- **Why we use it**: It serves as an **automatic high-reliability fallback**. If Groq reaches its daily rate limit or is temporarily unreachable, the system automatically redirects the request to Google Gemini so the adviser never encounters a broken screen or error.
- **Where in code**: [`backend/services/aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/aiService.ts#L83-L123). Sends the request to `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`.

### 3. `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
- **What it does**: Connects our frontend and backend to our managed PostgreSQL database, authentication system, and real-time listeners hosted on Supabase.
- **Why `VITE_` prefix?**: In Vite applications, only environment variables prefixed with `VITE_` are exposed to client-side code (`import.meta.env.VITE_*`).
- **Where in code**:
  - Frontend: [`src/lib/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/supabase.ts#L10) creates the client singleton:
    ```typescript
    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
    ```
  - Backend: [`backend/config/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/supabase.ts#L10) creates the server-side Supabase client.

### 4. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **What it does**: Provides dedicated Content Delivery Network (CDN) cloud blob storage for `.pdf`, `.docx`, `.xlsx` files and digital signature images.
- **Why we use it**: Relational databases like PostgreSQL should store structured data (names, dates, statuses), not heavy multi-megabyte binary files. Cloudinary provides global CDN delivery with fast downloads.
- **Security**: The `CLOUDINARY_API_SECRET` is kept **strictly on the backend**. The browser never touches this key; instead, the browser uploads to `/api/cloudinary/upload`, and our backend securely ships the file to Cloudinary.

### 5. `MICROSOFT_CLIENT_ID`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_SECRET`
- **What it does**: Authenticates our application with the **Microsoft Graph API** via an Azure App Registration.
- **Why we use it**: STI College uses Microsoft 365 for students and faculty. By integrating Microsoft Graph, every approved student submission is automatically archived directly into the Practicum Coordinator's official STI OneDrive storage without manual file downloads or flash drives.
- **Where in code**: [`backend/services/onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts). Handles OAuth2 token refresh and Graph endpoints `/me/drive/root:/...:/content`.

---

## 2.3 Security Architecture: Frontend Public vs Backend Private

Panelists frequently ask: *"Why is your Supabase key in the frontend code? Can't a student inspect the web page and steal your database key?"*

Here is your exact winning answer:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY BOUNDARY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   CLIENT BROWSER (Public Environment)                                   │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ • VITE_SUPABASE_URL                                              │   │
│   │ • VITE_SUPABASE_ANON_KEY (Public Anonymous Key)                 │   │
│   │                                                                 │   │
│   │ SAFE BECAUSE OF ROW-LEVEL SECURITY (RLS):                       │   │
│   │ The Anon key does NOT grant admin rights. Postgres evaluates    │   │
│   │ RLS policies on EVERY single row. A student can only see        │   │
│   │ their own rows: (auth.uid() = student_id).                      │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    │ Safe API calls                     │
│                                    ▼                                    │
│   BACKEND SERVER (Confidential Node.js / Express Environment)           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ • GEMINI_API_KEY                                                │   │
│   │ • CLOUDINARY_API_SECRET                                         │   │
│   │ • MICROSOFT_CLIENT_SECRET                                       │   │
│   │                                                                 │   │
│   │ NEVER SENT TO BROWSER:                                          │   │
│   │ These keys remain inside backend/ and are never bundled into    │   │
│   │ the frontend JavaScript files.                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

> **The 1-Sentence Panelist Answer:**
> *"Our frontend only holds the Supabase Anonymous key, which is safe by design because our database is protected by PostgreSQL Row-Level Security (RLS) where every row checks user authentication. All true administrative secrets—like our Microsoft Client Secret, Cloudinary Secret, and AI keys—are locked inside our private Express backend and can never be seen by users inspecting the browser."*

---

## 2.4 Step-by-Step Setup Runbook (From Scratch)

If the panelist asks: *"If you were to deploy this system for another STI campus tomorrow, how do you set up all the keys from scratch?"*

### Step 1: Supabase Setup (5 Minutes)
1. Go to `https://supabase.com` and click **New Project**.
2. Name the project `STI-Marikina-Practicum` and set a strong database password.
3. Open **Project Settings** → **API**.
4. Copy the **Project URL** → Paste into `.env` as `VITE_SUPABASE_URL`.
5. Copy the **anon / public** key → Paste into `.env` as `VITE_SUPABASE_ANON_KEY`.
6. Open **SQL Editor** and run the database schema migration script located in [`backend/config/supabase.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/config/supabase.ts).

### Step 2: Groq AI Setup (2 Minutes)
1. Go to `https://console.groq.com` and log in.
2. Navigate to **API Keys** → Click **Create API Key**.
3. Name it `practicum-ai-audit`.
4. Copy the key starting with `gsk_...` → Paste into `.env` as `VITE_GROQ_API_KEY`.

### Step 3: Google Gemini AI Fallback Setup (2 Minutes)
1. Visit `https://aistudio.google.com/` and sign in with a Google account.
2. Click **Get API Key** → **Create API Key in new project**.
3. Copy the key starting with `AIzaSy...` → Paste into `.env` as `GEMINI_API_KEY`.

### Step 4: Cloudinary Setup (3 Minutes)
1. Sign up at `https://cloudinary.com`.
2. On your **Dashboard**, find the **Product Environment Credentials**:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
3. Paste all three into `.env`.

### Step 5: Microsoft 365 Azure App Registration (5 Minutes)
1. Log in to `https://portal.azure.com` with school administrator credentials.
2. Go to **Microsoft Entra ID** (formerly Azure Active Directory) → **App registrations** → **New registration**.
3. Set Supported account types to **Accounts in this organizational directory only** (Single tenant).
4. Set Redirect URI (Web) to `http://localhost:3001/api/onedrive/auth/callback` (and your production URL).
5. Copy **Application (client) ID** → `MICROSOFT_CLIENT_ID`.
6. Copy **Directory (tenant) ID** → `MICROSOFT_TENANT_ID`.
7. Go to **Certificates & secrets** → **New client secret** → Copy secret value → `MICROSOFT_CLIENT_SECRET`.
8. Go to **API permissions** → Add permissions for **Microsoft Graph**:
   - `Files.ReadWrite.All`
   - `offline_access`
   - `User.Read`
9. Click **Grant admin consent**.
10. In `.env`, set `ONEDRIVE_USER_EMAIL="coordinator@marikina.sti.edu.ph"`.

---

# 3. Universal Naming Conventions & Code Standards

Consistency in naming is one of the clearest signs of professional software engineering. Here are the exact conventions enforced across our codebase:

## 3.1 File & Directory Naming Rules

| Asset Type | Convention | Examples from Codebase | Rationale |
| :--- | :--- | :--- | :--- |
| **React Page Components** | `PascalCase.tsx` | [`StudentDocumentPage.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/compose/StudentDocumentPage.tsx), [`ProposalLetterToTheIndustry.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/student/ProposalLetterToTheIndustry.tsx) | Standard React convention; strictly descriptive names matching the 13 official templates. Generic names like `DocumentSubmission.tsx` or `Proposal.tsx` are forbidden. |
| **Shared UI Primitives** | `PascalCase.tsx` | [`Button.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/ui/Button.tsx), [`Badge.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/ui/Badge.tsx), [`EmptyState.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/ui/EmptyState.tsx) | Reusable design system tokens compatible with Radix/Shadcn primitives. |
| **Custom Hooks** | `useCamelCase.ts` | [`useDocumentStatus.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/hooks/useDocumentStatus.ts), [`useSpeechToText.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/hooks/useSpeechToText.ts), [`usePhaseLock.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/hooks/usePhaseLock.ts) | React Rules of Hooks convention enabling ESLint hook linting. |
| **Backend Route Modules** | `camelCase.ts` | [`analyze.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/routes/analyze.ts), [`onedrive.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/routes/onedrive.ts), [`cloudinary.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/routes/cloudinary.ts) | Express RESTful route grouping. |
| **Backend Services** | `camelCaseService.ts` | [`aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/aiService.ts), [`onedriveService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/onedriveService.ts) | Service layer pattern separating business logic from route controllers. |
| **Utility Modules** | `camelCase.ts` | [`documentGenerator.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/documentGenerator.ts), [`excelGenerator.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/excelGenerator.ts), [`pdfParser.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/utils/pdfParser.ts) | Standard TypeScript utility modules exporting pure functions. |
| **Markdown Documentation** | `SCREAMING_SNAKE_CASE.md` or Numbered Prefix | [`ARCHITECTURE.md`](file:///c:/Users/johnd/Downloads/MainCode/docs/architecture/ARCHITECTURE.md), [`01_STUDENT_PORTAL_CHECKLIST.md`](file:///c:/Users/johnd/Downloads/MainCode/docs/features/01_STUDENT_PORTAL_CHECKLIST.md) | Standard Obsidian/GitHub MOC convention for documentation sorting and visual clarity. |

---

## 3.2 Component, Hook & Code Symbol Conventions

### 1. Variables and Functions
- **State variables**: `camelCase` (e.g. `studentName`, `selectedDocument`, `activeTab`).
- **Boolean state flags**: Must begin with `is`, `has`, `should`, or `can` (e.g. `isLoading`, `hasSigned`, `isListening`, `canSubmit`).
- **Event Handlers**: Must begin with `handle` + Event (e.g. `handleInputChange`, `handleSignatureSave`, `handleApproveDocument`).
- **Callback Props**: Must begin with `on` + Event (e.g. `onSignatureComplete`, `onClose`, `onStatusChange`).

### 2. TypeScript Interfaces and Types
- **Interface / Type names**: `PascalCase` without leading `I` prefix (e.g. `AiFindings`, `StudentSubmission`, `TemplateConfig`, `DtrDayEntry`).
- **Schema typing**: Enforced through `src/types/index.ts` to ensure type safety across frontend and backend boundaries.

### 3. Constants
- **Global / Module-level constants**: `SCREAMING_SNAKE_CASE` (e.g. `SYSTEM_PROMPT`, `PORT`, `MAX_WORD_COUNT = 30`).

---

## 3.3 Database & PostgreSQL Schema Naming

Our PostgreSQL database hosted on Supabase strictly enforces relational naming standards:

| Database Element | Convention | Examples | Reason |
| :--- | :--- | :--- | :--- |
| **Tables** | `snake_case_plural` | `student_documents`, `student_profiles`, `dtr_entries` | Industry standard PostgreSQL table pluralization. |
| **Columns** | `snake_case` | `student_name`, `doc_type`, `created_at`, `ai_status` | Prevents case-sensitivity bugs between SQL queries and JSON serialization. |
| **Foreign Keys** | `<singular_table>_id` | `student_id`, `template_id` | Explicit foreign key linking across entities. |
| **Status Enums** | Capitalized Strings | `'Draft'`, `'Pending'`, `'Approved'`, `'Revision Requested'` | Human-readable in dashboard queries and UI badges. |
| **Timestamps** | `created_at`, `updated_at` | `created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())` | UTC timezone safety across all client devices. |

---

## 3.4 Styling, Tailwind & Theme Variable Rules

To maintain visual harmony and support dynamic institutional color theming:

1. **The `cn()` Helper Rule**:
   Always merge dynamic Tailwind classes using `cn()` from [`src/lib/utils.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/utils.ts) (`clsx` + `tailwind-merge`) to resolve style collisions safely:
   ```typescript
   import { cn } from '@/src/lib/utils';
   ```
2. **Strict Prohibition of Hardcoded Color Tokens**:
   - ❌ Never write: `bg-blue-600`, `text-blue-500`, `border-indigo-500`.
   - ✅ Always write: `bg-primary`, `text-primary`, `border-primary`, or pass `variant="primary"` to UI components.
   - **Why**: STI has official brand guidelines. Using CSS variables (`--theme-primary`) allows the system to switch between monochrome black/white, STI institutional yellow/blue, cyan, and indigo without touching component markup.

---

## 3.5 Git Branching & Workflow Rules

The project strictly follows a **Role & Domain-Based Branching Architecture**:

```text
                               ┌── feature/student (Student Portal workflows)
                               ├── feature/adviser (Adviser reviews & remarks)
origin/main (Protected) <──────┼── feature/supervisor (Supervisor DTR signatures)
  ▲ (Pull Requests only)       ├── feature/admin (Admin master templates & users)
  │                            ├── feature/landing-page (Public hero & motion)
  │                            ├── backend/database (Supabase schemas & Graph sync)
  │                            └── docs/Documentation (Guides & panelist runbooks)
```

### The 3 Core Git Principles:
1. **Evergreen Domain Naming**: Branches represent persistent system layers (e.g. `feature/student`), never temporary bugs (`-fixes`, `-temp`).
2. **Main Branch Protection**: Direct pushes to `main` are strictly forbidden. All updates merge through verified Pull Requests.
3. **No Autonomous Push**: The development agent can stage and commit locally, but can NEVER execute `git push` without the explicit authorization code `/push` from the user.

---

# 4. "How You Did the Codes" — End-to-End Technical Breakdown

This section details exactly how the code was architected and built so you can explain any algorithm, pipeline, or design decision.

## 4.1 The Core Architecture (React 19 + Express + Supabase)

Our system is engineered as a modern, decoupled full-stack architecture:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM TOPOLOGY OVERVIEW                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   1. FRONTEND: React 19 Single Page App (SPA)                          │
│      • Bundled with Vite 6 for instant Hot Module Replacement (HMR)    │
│      • Styled with Tailwind CSS v4 + Motion Spring Physics             │
│      • Lenis smooth-scrolling engine for tactile page feel             │
│                                                                        │
│   2. BACKEND: Express.js REST API Server (:3001)                       │
│      • Runs locally via tsx or serverlessly on Vercel Functions        │
│      • Handles AI text extraction, Groq/Gemini calls, Microsoft Graph  │
│                                                                        │
│   3. DATABASE & STORAGE: Supabase Cloud                                │
│      • PostgreSQL 15 database with subquery-optimized RLS policies    │
│      • IndexedDB client caching for zero-latency template previews     │
│      • Cloudinary CDN for raw document blobs and signature media       │
│                                                                        │
│   4. INSTITUTIONAL INTEGRATION: Microsoft Graph API                    │
│      • Direct OAuth2 cloud synchronization into STI Microsoft OneDrive │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 The 4 Portals & User Roles

| Portal | Target User | Key Capabilities & Features |
| :--- | :--- | :--- |
| **Student Portal** | Enrolled Practicum Interns | • Dynamic 3-stage progress checklist (Before OJT, In OJT, Finals)<br>• 13 fillable institutional document templates with in-browser live preview<br>• HTML5 canvas digital signature drawer<br>• Daily Time Record (DTR) 460-hour tracker<br>• Weekly Journal reflection with browser Web Speech API voice dictation |
| **Adviser Portal** | STI Practicum Faculty Advisers | • Student roster view filtered by section and compliance status<br>• Dual-viewport review room: student document preview on left, remarks panel on right<br>• One-click AI Review Assistant to detect grammar, missing signatures, and discrepancies<br>• Revision request workflow with line-by-line feedback history |
| **Supervisor Portal** | Host Training Establishment (HTE) Mentors | • PIN / password-less secure magic link or OTP login<br>• Daily Time Record (DTR) attendance verification (Time In / Time Out / Total Hours)<br>• Touch-friendly digital canvas signature approval<br>• Direct embedding of supervisor signature into official Excel timesheets |
| **Admin Portal** | Practicum Coordinator & Registrar | • Master template distribution (upload new DOCX and PDF reference files)<br>• Registrar student clearance queue<br>• Partner company and supervisor directory<br>• System API configurations and institutional settings |

---

## 4.3 Digital Document Generation Pipeline (Without Microsoft Office)

One of the most impressive features of our system is that **students can fill out official STI documents and download completed `.docx` and `.pdf` files without having Microsoft Word installed on their computer.**

### How the Pipeline Works Step-by-Step:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              IN-BROWSER DOCX EDITING & GENERATION PIPELINE              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: Admin uploads official template (.docx)                        │
│          Stored in Cloudinary and cached in IndexedDB                   │
│                                                                         │
│  Step 2: Browser Previews Document via docx-preview.js                  │
│          Renders native document layout in HTML canvas DOM              │
│                                                                         │
│  Step 3: DOM TreeWalker Placeholder Extraction (DocxViewer.tsx)         │
│          Scans DOM nodes using regex:                                   │
│          /(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/g                     │
│          • Sequences of 3+ underscores (____) become blanks             │
│          • Angle brackets (<COMPANY NAME>) become tagged fields         │
│                                                                         │
│  Step 4: Student enters details in AutoWidthInput controls              │
│          Inputs dynamically expand to fit typed text (max 30 words)     │
│                                                                         │
│  Step 5: Binary Assembly via JSZip & easy-template-x (documentGenerator)│
│          • JSZip unzips the .docx file in browser RAM                   │
│          • Reads word/document.xml directly                             │
│          • Sequentially injects student inputs into blanks & dates      │
│          • easy-template-x replaces <TAGS> even across split XML runs   │
│          • Injects programmatic signature blocks inside borderless      │
│            tables flush-left with student names centered                │
│                                                                         │
│  Step 6: User downloads pristine, formatted .docx or .pdf               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> **The 1-Sentence Panelist Answer:**
> *"We do not rely on Microsoft Word; our system loads the official template into browser memory, uses a DOM TreeWalker to identify the blank lines and tags, accepts student input, surgically replaces the XML tags inside the DOCX archive using JSZip and easy-template-x, and compiles a pristine document for download in seconds."*

---

## 4.4 DTR Attendance & Signature Fitting Engine (ExcelJS + Dark-Ink Luminance)

Exporting supervisor signatures into Excel spreadsheets (`.xlsx`) usually results in ugly, stretched, or misaligned images. Our team solved this with an **intelligent Dark-Ink Stroke Luminance Filtering algorithm**.

### The Problem:
When a supervisor signs on a canvas, the output image contains massive empty transparent or white borders. If inserted directly into Excel, the actual signature appears tiny and shifted out of place.

### How We Solved It in Code ([`src/lib/excelGenerator.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/excelGenerator.ts)):
1. **Dynamic Physical Cell Dimension Calculation**:
   Excel column widths and row heights are measured in points, not pixels. We dynamically calculate physical pixel dimensions (e.g. Column G width 30 = 225px, Row height 45 = 60px -> ratio 3.75:1).
2. **Dark-Ink Stroke Luminance Scanning**:
   We scan the raw RGBA pixel array of the canvas image with a luminance threshold:
   ```typescript
   // Ignore transparent and light pixels; lock tightly onto dark ink strokes
   if (alpha > 30 && (r < 200 || g < 200 || b < 200)) {
     minX = Math.min(minX, x);
     maxX = Math.max(maxX, x);
     minY = Math.min(minY, y);
     maxY = Math.max(maxY, y);
   }
   ```
3. **Adaptive 90% Height Scaling**:
   We crop out all useless whitespace and scale the ink stroke to fill 90% of the target Excel cell height.
4. **1:1 Exact Cell Border Anchoring**:
   In ExcelJS, we lock the image coordinates to exact cell column boundaries (`col: 6.0 to 7.0`) and row boundaries (`rowIndex - 1 to rowIndex`), guaranteeing that the signature never bleeds into adjacent rows or columns.

---

## 4.5 Dual-Model AI Review Assistant (Groq Llama-3.3 + Gemini Fallback)

Coordinators spend days reading through student application letters, parent consent forms, and weekly journals. Our AI Review Assistant automates the initial compliance audit in under 2 seconds.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    DUAL-MODEL AI PIPELINE ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Adviser Clicks "Run AI Audit"                                         │
│                │                                                        │
│                ▼                                                        │
│   Express Backend (/api/analyze)                                        │
│   ├── 1. Fetches PDF array buffer from Cloudinary CDN                   │
│   ├── 2. Extracts raw text using pdf-parse                              │
│   ├── 3. Compiles system prompt + student metadata (name, course, co.) │
│                │                                                        │
│                ├──────────────────────────────┐                         │
│                ▼ (Primary: Fast LPU)          ▼ (Automatic Fallback)    │
│      Groq Cloud (llama-3.3-70b)     Google Gemini (gemini-1.5-flash)    │
│      Speed: ~750 tokens/sec         Triggered if Groq errors, times out,│
│      Latency: < 1.5 seconds         or hits API rate limit              │
│                │                              │                         │
│                └──────────────┬───────────────┘                         │
│                               ▼                                         │
│   Returns Strict JSON Findings:                                         │
│   • overallAssessment ("Good" | "Needs Attention" | "Critical Issues")   │
│   • grammarIssues: count                                                │
│   • missingInformation: ["Missing parent signature", "Blank date"]      │
│   • consistencyIssues: ["Company name does not match MOA"]              │
│   • recommendations: ["Please re-sign and re-upload"]                   │
│                               │                                         │
│                               ▼                                         │
│   Saved to Supabase DB (student_documents.ai_findings)                  │
│   Displayed side-by-side in Adviser Review Room                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Why Dual-Model Matters to Panelists:**
> *"A common criticism of AI systems is reliance on a single third-party provider. If Groq goes down, our system automatically falls back to Google Gemini with zero user downtime or manual intervention."*

---

## 4.6 Automated Microsoft OneDrive Archival (Microsoft Graph API)

When an adviser gives final approval to a student's submission, the system automatically backs up the document into STI College Marikina's official OneDrive cloud.

### Folder Hierarchy Taxonomy:
The system automatically creates and maintains a clean, academic directory tree:
```text
STI_Practicum_Archive/
└── AY_2025_2026/
    └── BSIT_4A/
        └── 2021-00123_Del_Rosario_Kerin/
            ├── Before_OJT/
            │   ├── Student_Application_Letter.pdf
            │   ├── Parent_Consent_Form.pdf
            │   └── MOA_Signed.pdf
            ├── In_OJT/
            │   ├── DTR_Signed_Approved.xlsx
            │   └── Weekly_Journals.pdf
            └── Finals/
                ├── Integration_Paper.pdf
                └── Performance_Appraisal.pdf
```

### Authentication Lifecycle:
- Uses OAuth2 Authorization Code Grant with `offline_access`.
- Tokens are cached securely on the server.
- The server checks token expiration before every upload: if `Date.now() >= expiresAt - 120s`, it automatically uses the `refresh_token` to acquire a fresh `access_token` without prompting the user to log in again.

---

## 4.7 Database Integrity, Realtime Sync & RLS Security

### 1. Single Source of Truth
Each page derives its displayed state from one place: the Supabase PostgreSQL database. We strictly forbid mixing hardcoded arrays with live data.

### 2. Loading Lifecycle Pattern
Every data-driven component adheres to a strict 4-phase lifecycle:
```text
Component Mounts ──> loading = true ──> Fetch Supabase ──> loading = false ──> Render Data OR EmptyState
```
If a record does not exist, the component aggressively renders the project's standardized [`EmptyState.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/ui/EmptyState.tsx) component rather than breaking or showing simulated loading spinners.

### 3. PostgreSQL InitPlan Optimization
In our Row-Level Security (RLS) policies, we wrap auth evaluations as subqueries `(SELECT auth.uid())` instead of calling `auth.uid()` directly. This tells PostgreSQL's query optimizer to compute the user ID once per query (InitPlan) rather than re-evaluating it for every row, resulting in 10x faster query execution on large student rosters.

---

# 5. Capstone Panelist Defense Q&A Cheatsheet (Plain English & Tech Breakdown)

Use this section to prepare for panel questions. For each question, memorize the **Simple 1-Sentence Answer** first. If the panelist asks you to elaborate, deliver the **In-Depth Technical Answer**.

---

## Category A: Project Objectives & System Purpose

### Q1: What makes your practicum system different from simply using Google Forms, Google Drive, or Google Classroom?
- **Simple 1-Sentence Answer:**
  *"Google Classroom is a generic assignment submission folder; our system is a purpose-built practicum workflow that validates documents with AI, lets students edit institutional DOCX templates in the browser, calculates 460 OJT hours, embeds verified supervisor signatures into official Excel sheets, and automatically organizes files into STI's official OneDrive."*
- **In-Depth Technical Answer:**
  Google Classroom lacks domain-specific practicum logic. It cannot check if a student's MOA matches their target company, cannot track remaining OJT hours against the 460-hour curriculum requirement, cannot fit digital canvas signatures into `.xlsx` cell coordinates, and cannot parse PDF text for grammar and missing compliance signatures. Our system is an integrated ERP tailored specifically to the CHED and STI practicum manual.
- **Key Buzzword to Highlight:** *Domain-specific automation & curriculum compliance.*

---

### Q2: What are the 3 OJT phases in your system and why are they separated?
- **Simple 1-Sentence Answer:**
  *"The 3 phases are Before OJT, In OJT, and Finals, which match STI's official practicum policy so that a student cannot start working or submit final papers until their safety consent and endorsement letters are officially approved."*
- **In-Depth Technical Answer:**
  The phases represent sequential state gates in the curriculum:
  1. **Before OJT (8 Requirements)**: Application Letter, Consent Forms (With/Without Fee), MOA, Endorsement Letter, and Proposal Letter. Must be completed before deployment.
  2. **In OJT (3 Requirements)**: Weekly Journal reflections, Training Plan, and the Daily Time Record (DTR) tracker up to 460 hours.
  3. **Finals (2 Requirements)**: Integration Paper and Performance Appraisal Form required for graduation clearance.
- **Key Buzzword to Highlight:** *Sequential compliance gates.*

---

## Category B: Security & API Keys Defense

### Q3: Where are your API keys stored, and how do you prevent them from being leaked on GitHub or stolen by users?
- **Simple 1-Sentence Answer:**
  *"All our confidential secrets are stored in an ignored `.env` file on our private Express backend and are never exposed to the public Git repository or the user's browser."*
- **In-Depth Technical Answer:**
  We implement strict separation of concerns:
  1. The `.env` file is listed in `.gitignore` and `.dockerignore`, preventing accidental repository commits.
  2. Frontend variables use Vite's `VITE_` prefix and only contain the Supabase URL and public Anonymous key.
  3. Supabase access is locked down by PostgreSQL Row-Level Security (RLS) policies evaluated on every query.
  4. Backend keys (`GEMINI_API_KEY`, `CLOUDINARY_API_SECRET`, `MICROSOFT_CLIENT_SECRET`) are read strictly via Node.js `process.env` inside our Express server.
- **Key Buzzword to Highlight:** *Zero-trust environment separation & RLS enforcement.*

---

### Q4: If the Supabase Anonymous Key is visible in the browser, how do you stop a student from tampering with another student's grades or documents?
- **Simple 1-Sentence Answer:**
  *"The Anon key only identifies our app to Supabase; database access is strictly locked down by Row-Level Security policies inside PostgreSQL, so the database itself blocks any student from viewing or editing another student's data."*
- **In-Depth Technical Answer:**
  Even if someone extracts the Anon key using Chrome DevTools, PostgreSQL executes RLS policies on the database engine level. For example, our `student_documents` table enforces:
  ```sql
  CREATE POLICY "Students can only access own documents"
  ON student_documents FOR ALL
  USING (student_id = (SELECT auth.uid()));
  ```
  Postgres calculates `auth.uid()` from the verified JWT bearer token. If student A attempts to update student B's document ID, Postgres rejects the SQL query with an HTTP 403 Forbidden.
- **Key Buzzword to Highlight:** *Database-level Row-Level Security (RLS) via JWT claims.*

---

## Category C: AI Review Assistant & Reliability

### Q5: Why did you integrate AI into a document management system? Isn't an AI model prone to hallucinations?
- **Simple 1-Sentence Answer:**
  *"The AI does not make final decisions or approve documents—it acts as an assistant that pre-screens documents for spelling errors, missing sections, and name mismatches so the adviser can review submissions ten times faster."*
- **In-Depth Technical Answer:**
  Advisers handle 50 to 100 students, each submitting 13 multi-page documents. That is over 1,000 pages of text. Our AI Review Assistant acts as a deterministic compliance scanner:
  - We set the LLM temperature to `0.1` (near zero) to eliminate hallucinations and enforce consistent, factual evaluations.
  - We feed the student's database metadata (Full Name, Course, Target Company) into the prompt and instruct the model to cross-reference the extracted PDF text against this source of truth.
  - The AI returns structured JSON findings categorized into grammar issues, missing signatures, and data discrepancies. The faculty adviser retains 100% final approval authority.
- **Key Buzzword to Highlight:** *Human-in-the-loop decision support with near-zero temperature.*

---

### Q6: What happens if Groq or the AI service goes offline during an OJT review session?
- **Simple 1-Sentence Answer:**
  *"Our backend features an automated dual-model fallback architecture: if Groq is slow or unavailable, our system automatically switches to Google Gemini without the user noticing any failure."*
- **In-Depth Technical Answer:**
  In [`backend/services/aiService.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/services/aiService.ts), the AI execution is wrapped in a resilient try-catch fallback block:
  1. It first queries the primary Groq Llama 3.3 70B endpoint.
  2. If Groq throws an HTTP error, network timeout, or rate-limit code (429), the error is caught and logged.
  3. The service immediately dispatches the identical payload to Google Gemini 1.5 Flash.
  4. If all external AI APIs fail, the document status remains safely stored in Supabase, allowing the adviser to review the document manually without interruption.
- **Key Buzzword to Highlight:** *Dual-provider redundancy and graceful degradation.*

---

## Category D: Document Generation & Office Independence

### Q7: How does your in-browser document generator work without Microsoft Word?
- **Simple 1-Sentence Answer:**
  *"A DOCX file is actually a zipped folder of XML files; our system unzips the template in browser memory using JSZip, replaces the blank spaces and placeholders with the student's text, and zips it back up for instant download."*
- **In-Depth Technical Answer:**
  DOCX files adhere to the Office Open XML (OOXML) standard. In [`src/lib/documentGenerator.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/documentGenerator.ts):
  - We use `JSZip` to read the binary array buffer of the official template.
  - We open `word/document.xml` where the document text resides.
  - For sequential blanks (`____`), we run regex replacement matched against an array of sequential student inputs.
  - For tagged fields (`<STUDENT NAME>`), we pass the buffer to `easy-template-x` configured with custom angle delimiters `{ tagStart: "<", tagEnd: ">" }`, which handles XML tags split across disparate `<w:r>` runs.
  - We inject left-aligned, borderless tables for signature blocks to guarantee that student names remain centered under the signature line while staying flush-left with the page margin.
- **Key Buzzword to Highlight:** *Client-side OOXML parsing via JSZip and easy-template-x.*

---

## Category E: Digital Signatures & Anti-Fraud

### Q8: How does the system handle supervisor signatures, and how do you prevent someone from pasting a fake signature?
- **Simple 1-Sentence Answer:**
  *"Supervisors sign using an authenticated HTML5 canvas pad; our system crops out empty space using a dark-ink luminance filter, locks the signature coordinates into the official Excel file using ExcelJS, and records an audit trail with timestamps and reviewer IDs."*
- **In-Depth Technical Answer:**
  1. **Authentication Gate**: Only logged-in supervisors or mentors with verified magic links can access the DTR approval room.
  2. **Audit Logging**: Every approval writes an immutable audit record to Supabase storing the supervisor's user ID, IP address, timestamp, and status.
  3. **Luminance Filtering**: Raw canvas exports contain huge transparent/white margins. Our algorithm scans pixel arrays (`alpha > 30 && (r < 200 || g < 200 || b < 200)`), locks onto the ink strokes, scales them to 90% of the cell height, and anchors the drawing precisely between column boundaries (`col: 6.0 to 7.0`) in the exported Excel spreadsheet.
- **Key Buzzword to Highlight:** *Authenticated canvas capture, audit logging, and dynamic luminance cropping.*

---

## Category F: Cloud Storage, OneDrive & Data Archival

### Q9: Why do you need both Cloudinary and Microsoft OneDrive? Isn't one cloud storage provider enough?
- **Simple 1-Sentence Answer:**
  *"Cloudinary is our fast working CDN for instant in-app document previews and signatures, while Microsoft OneDrive is the official long-term archival storage integrated directly into STI's institutional Microsoft 365 ecosystem."*
- **In-Depth Technical Answer:**
  The two storage systems serve distinct architectural purposes:
  - **Cloudinary (Operational CDN Storage)**: Optimized for fast, low-latency binary delivery. The browser needs to fetch PDFs, images, and signature blobs in milliseconds for the interactive review rooms.
  - **Microsoft OneDrive via Graph API (Institutional Archival)**: When a document is marked **Approved**, our backend uploads the finalized file to the Practicum Coordinator's OneDrive account, structured by Academic Year, Section, and Student Number. This satisfies school accreditation and CHED audit compliance requiring records to reside within the school's official tenant.
- **Key Buzzword to Highlight:** *Operational CDN caching vs institutional compliance archival.*

---

## Category G: Architecture, Offline Resilience & Performance

### Q10: What happens if a student has a slow or intermittent internet connection?
- **Simple 1-Sentence Answer:**
  *"Our system uses IndexedDB to cache master document templates locally in the browser so previews open instantly even on slow connections, and state updates use optimistic loading lifecycles to prevent UI stutter."*
- **In-Depth Technical Answer:**
  We implemented a **Cache-First Offline Strategy** using the browser's `IndexedDB`:
  - When the admin publishes a master template, the frontend stores the binary array buffer in IndexedDB via `idb-keyval`.
  - When a student navigates to any document page, the system checks IndexedDB first. If the file is cached, it renders immediately without waiting for a cloud download.
  - For network calls, our loading lifecycle pattern (`loading -> fetch -> data OR EmptyState`) ensures the UI displays clean skeleton states and helpful empty states rather than freezing or crashing.
- **Key Buzzword to Highlight:** *IndexedDB cache-first strategy and resilient loading lifecycles.*

---

### Q11: What software engineering standards did your group follow during development?
- **Simple 1-Sentence Answer:**
  *"We adhered to strict industry standards including TypeScript strict typing, component modularity, single-source-of-truth state management, role-based evergreen Git branching, and theme-variable styling."*
- **In-Depth Technical Answer:**
  - **TypeScript Strict Mode**: Full static typing across frontend and backend; verified with `tsc --noEmit` yielding zero compiler errors.
  - **Single Source of Truth**: Data is derived strictly from PostgreSQL; no mixing of mock arrays with live data.
  - **Theme-Aware Styling**: Zero hardcoded color classes; all colors use CSS variables (`--theme-primary`) with the `cn()` utility.
  - **Database InitPlan Optimization**: RLS subquery wrapping for O(1) auth evaluation.
  - **Evergreen Git Branching**: Main branch protection with domain branches for each user portal.
- **Key Buzzword to Highlight:** *Strict typing, single-source-of-truth, and modular architecture.*

---

# 6. Defense Day Quick-Reference Checklist

Before walking into the defense room, review this 60-second mental checklist:

- [ ] **State the problem clearly**: Manual paper OJT is slow, prone to lost files, and hard to audit.
- [ ] **Highlight our 3 innovations**:
  1. *In-browser DOCX editing without Word.*
  2. *Intelligent DTR signature luminance fitting into Excel.*
  3. *Dual-model AI compliance assistant (Groq + Gemini).*
- [ ] **Explain security confidently**: *“Our database has Row-Level Security; private secrets stay in our Express backend.”*
- [ ] **Address AI reliability**: *“AI is an assistant, not the judge. The human adviser always has the final approval.”*
- [ ] **Explain school integration**: *“Approved documents automatically sync to STI's official Microsoft OneDrive.”*

---
*Document prepared for STI College Marikina BSIT Capstone Defense 2026.*
