---
title: "STI Marikina: Web-Based Practicum Management System with AI (v2.0)"
description: "A comprehensive web platform designed to streamline, track, and automate the student internship/practicum program at STI College Marikina."
tags:
  - sti-ojt
  - practicum-system
  - architecture
  - react19
  - supabase
  - cloudinary
aliases:
  - "Project Root"
  - "Main README"
created: 2026-08-26
updated: 2026-09-04
---

# STI Marikina: Web-Based Practicum Management System with AI (v2.0)

A comprehensive, state-of-the-art web platform designed to streamline, track, and automate the student internship/practicum program at STI College Marikina. Built with interactive components, robust security, and intelligent document validation assistance.

---

## ðŸ“š Technical Documentation & Architecture

Comprehensive guides and technical documentation are organized in the [`docs/`](./docs/README.md) directory:

- [**Documentation Center (MOC)**](./docs/README.md) — Master map of content and centralized documentation index.
- [**Tasks & Roadmap**](./docs/tasks/TASKS.md) — Active development tasks, feature checklist, and priorities.
- 📜 [**Task History & Changelog**](./docs/tasks/TASK_HISTORY.md) — Complete log of implemented features, bug fixes, and milestones.
- ðŸ—ï¸ [**System Architecture**](./docs/architecture/ARCHITECTURE.md) — High-level architecture, component hierarchy, directory layout, and data flow.
- ðŸ—ºï¸ [**System Map & Problem Register**](./docs/architecture/SYSTEM_MAP.md) — Granular code locator, component targets, and known problem-fix playbook.
- ðŸŒŸ [**Feature Guides & Architecture Diagrams**](./docs/features/README.md) — Detailed dataflow diagrams and mechanics for every core system feature.
- ðŸ“ [**Refactoring Guidelines**](./docs/guidelines/REFACTORING_GUIDELINES.md) — Essential development rules, styling standards, and single-source-of-truth state conventions.
- 📄 [**Document Workflows & Templates**](./docs/architecture/DOCUMENT_WORKFLOWS.md) — Complete 3-phase template inventory (11 documents), DOCX generation, and Excel DTR signature fitting.
- ðŸ—„ï¸ [**Backend, Database & AI**](./docs/architecture/BACKEND_AND_DATABASE.md) — Supabase schema, storage buckets, fallback persistence, and serverless AI review routes.
- 🚀 [**Deployment & Vercel Guide**](./docs/deployment/DEPLOYMENT_AND_VERCEL.md) — Vercel serverless configuration, environment variables checklist, and deployment gotchas.
- â˜ï¸ [**Cloudinary Integration**](./docs/deployment/CLOUDINARY_INTEGRATION_SUMMARY.md) — CDN media storage, signature upload handling, and document backups.

---

## ðŸŒŸ Key Capabilities & Features

- **Intelligent Document Auditing**: Features integrated AI grammar check panels and semantic content insights via Groq (`llama-3.3-70b-versatile`) and Google Gemini (`gemini-1.5-flash`) to assist advisers in reviewing student submissions.
- **OJT Phase Guards**: Dynamically locks/unlocks system options based on student progress stages (Before OJT $\rightarrow$ In OJT $\rightarrow$ Finals).
- **Built-in Template Engine**: Allows students to fill and generate structured, printable internship templates (DOCX, PDF, and signed Excel DTR) directly from their portal without layout corruption.
- **Cloudinary Cloud Document Storage**: High-speed CDN document repository for `.pdf`, `.docx`, and `.xlsx` submissions, supervisor-signed timesheets, and digital signatures with automatic cache fallbacks.
- **System Configuration Hub**: Provides administrators with fine-grained control over OJT requirements, required hours, academic terms, template uploads, and user assignments.
- **Modern Interactive UI**: Modern styling with Framer Motion animations, Tailwind CSS v4, dynamic theme switching, and full dark/light mode support.

---

## ðŸ‘¥ Roles & Workflows

### 1. Student Portal

Guided by a dynamic stage progression checklist, students can:

- **Before OJT**: Fill, download, and submit the Student Application Letter, Parent Consent Forms, Student Consent Forms, MOA, Endorsement Letter, and Proposal Letter.
- **In OJT**: Log and submit Daily Time Records (DTR), write Reflective Journals, and upload the Host Company Training Plan.
- **Finals**: Complete the Integration Paper and request supervisor Performance Appraisals.

### 2. Adviser Portal

Allows OJT Coordinators and Advisers to manage their cohort efficiency:

- **Class Dashboard**: Track the real-time progress of all assigned sections and students.
- **Document Review Room**: View and audit PDF, DOCX, and XLSX submissions using side-by-side viewports and AI-assisted analysis.
- **Evaluations & Endorsements**: Sign off on company MOAs, weekly journals, and endorsements.

### 3. Supervisor Portal

- **Daily Time Record (DTR) Approval**: Review student work hours, apply digital canvas signatures, and generate signed `.xlsx` files with luminance stroke fitting.
- **Weekly Journal Review**: Review and sign weekly student reflection logs.

### 4. Administrator Console

- **Template Management**: Upload, preview, and distribute official master DOCX/PDF templates.
- **Monitoring & Verification**: Real-time progress monitoring, document verification, and user management.

---

## ðŸ’» Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) (Tailwind CSS v4 & Base UI primitives)
- **Backend**: [Express.js](https://expressjs.com/) (Vercel Serverless `/api`)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS Security Policies & auth)
- **Cloud Blob Storage & CDN**: [Cloudinary](https://cloudinary.com/) (Primary document repository for `.pdf`, `.docx`, `.xlsx`, student signatures, and templates)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Document Engines**: `@embedpdf/react-pdf-viewer`, `docx-preview`, `easy-template-x`, `exceljs`, `docx`, `pdf-parse`
- **Animations & Icons**: `motion` (Framer Motion), `lucide-react`, `date-fns`

---

## ðŸ› ï¸ Local Development Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Getting Started

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting.git
   cd MainCode
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:

   Initialize your local configuration by copying `.env.example` to `.env`:

   ```bash
   copy .env.example .env
   ```

   Configure your environment variables:
   - **Supabase**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - **AI Assistance**: `VITE_GROQ_API_KEY` / `GEMINI_API_KEY`

4. **Run Development Server**:

   Start both the Vite frontend (`http://localhost:3000`) and the Express backend (`http://localhost:3001`):

   ```bash
   npm run dev
   ```

5. **Compile & Lint**:

   ```bash
   npm run lint     # TypeScript check (tsc --noEmit)
   npm run build    # Vite production bundle build
   ```
