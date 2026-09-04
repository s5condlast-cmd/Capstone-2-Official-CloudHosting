---
title: STI Marikina Practicum Management System
tags: [sti-ojt, practicum-system, react19, supabase, onedrive, tailwindcss]
aliases: [Main-README, Project-Root]
created: 2026-08-26
updated: 2026-09-04
---

<div align="center">

<img src="public/images/Landing Page Icons/Logo.svg" alt="STI Practicum Management System Logo" width="100" height="100" />

# STI Marikina: Web-Based Practicum Management System

**Enterprise Web-Based OJT Workflow Engine, Interactive Template Pipeline & AI-Assisted Document Clearance**

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![OneDrive](https://img.shields.io/badge/Microsoft_OneDrive-Graph_API_Sync-0078D4?style=flat-square&logo=microsoftonedrive&logoColor=white)](https://onedrive.live.com/)

<p align="center">
  <a href="#-quick-start"><b>Quick Start</b></a> •
  <a href="docs/README.md"><b>Documentation Hub</b></a> •
  <a href="docs/features/README.md"><b>Feature Specifications</b></a> •
  <a href="docs/architecture/ARCHITECTURE.md"><b>System Architecture</b></a> •
  <a href="docs/tasks/TASKS.md"><b>Active Roadmap</b></a>
</p>

</div>

---

## 🌟 Executive Overview

The **STI Marikina Practicum Management System** is a full-stack, cloud-hosted web platform engineered to modernize, digitize, and accelerate the On-the-Job Training (OJT) lifecycle for STI College Marikina. The platform replaces paper-based workflows with interactive fill-in-the-blank digital document generation, real-time hour logging, digital supervisor canvas signatures, automated institutional Microsoft OneDrive sync, and dual-model AI-assisted grammar and compliance verification.

Built on React 19, Vite, Express, and Supabase PostgreSQL with strict Row Level Security (RLS), the system coordinates 4 distinct user roles through a role-based, reactive single-page architecture with dynamic theme switching and monochrome zinc aesthetic depth.

---

## 👥 Role Portals & Workflows

| Portal Role | Primary Capabilities | Core Deliverables |
| :--- | :--- | :--- |
| 🎓 **Student Portal** | Dynamic 3-stage progress checklist (Before OJT $\rightarrow$ In OJT $\rightarrow$ Finals), company placement tracker, weekly journal reflection, and real-time requirement status. | Fillable institutional letters, weekly journal entries, and signed DTR submission. |
| 🧑‍🏫 **Adviser Portal** | Assigned class section rosters, student submission queue, side-by-side dual-viewport review room, and review remarks with revision feedback history. | AI-assisted grammar audits, document endorsements, and practicum clearance sign-offs. |
| 🏢 **Supervisor Portal** | Intern attendance tracking, DTR daily log review, digital canvas signature signing, and intern evaluation scoring. | Supervisor-approved `.xlsx` timesheets with dark-ink luminance fitting and signed journals. |
| 🛡️ **Admin Portal** | Master template distribution (4-action grid for DOCX/PDF upload and download), student verification, registrar clearance queue, and institutional API key settings. | Official template governance, term settings, and centralized OneDrive synchronization. |

---

## ⚡ Core Technical Capabilities

### 📄 1. Interactive 13-Template Digital Pipeline

- **In-Browser Document Engine**: Students fill digital input fields (`AutoWidthInput`) directly over official university documents without downloading desktop software.
- **DOCX Preview & Wrapping**: Native `docx-preview` rendering with strict CSS container containment (`overflow-hidden`, responsive width constraints).
- **JSZip Serverless Generation**: Sequential blank injection (`blankEdits`), date replacement (`dateEdits`), and XML tag substitution via `easy-template-x` generating pristine `.docx` and `.pdf` files.
- **Print Stylesheet Protection**: `@media print` rules prevent input box truncation, rendering offscreen measurement text inline for crisp printing and PDF exports.

### ✍️ 2. Excel DTR Signature Fitting Protocol

- **Luminance Filtering**: Raw canvas signatures undergo RGBA alpha and luminance scanning (`alpha > 30 && (r < 200 || g < 200 || b < 200)`) to lock tightly onto dark ink strokes while trimming solid white background pixels.
- **Physical Cell Anchoring**: Generates official `.xlsx` timesheets via ExcelJS with exact two-cell border anchors (`col: 6.0` to `7.0`) ensuring signatures fit snugly into Column G without cell boundary distortion.

### 🤖 3. Dual-Engine AI Document Auditing

- **Multi-Provider AI Analysis**: Connects to Groq (`llama-3.3-70b-versatile`) and Google Gemini (`gemini-1.5-flash`) for automated document quality assessment.
- **Actionable Inspection**: Detects spelling, grammar, tone formality, and STI institutional guideline compliance, displaying findings in side-by-side review panels for coordinators.

### ☁️ 4. Microsoft OneDrive & Cloud Sync

- **Automated Archival**: Approved student letters, signed DTR timesheets, and signed MOAs automatically sync to the school's institutional Microsoft OneDrive account via Microsoft Graph API.
- **Token Engine**: Self-healing OAuth2 auto-refresh engine maintaining continuous cloud backup without manual administrator intervention.

---

## 🗺️ System Architecture

```text
+-----------------------------------------------------------------------------+
|                     SYSTEM TOPOLOGY & DATA PIPELINE                         |
+-----------------------------------------------------------------------------+
|                                                                             |
|   [Client Layer (React 19 + Vite)]                                          |
|   ├── Student Portal   (Checklist, Fillable Templates, Weekly Journal)      |
|   ├── Adviser Portal   (Dual-Viewport Review Room, AI Grammar Audit)        |
|   ├── Supervisor Portal (Attendance Review, Signature Canvas Approval)       |
|   └── Admin Portal     (Master Templates, Clearance Queue, API Settings)    |
|                              │                                              |
|                              ▼                                              |
|   [API Gateway & Serverless Layer (Express /api)]                           |
|   ├── /api/grammar-audit       ───► Groq (Llama-3.3) & Google Gemini AI     |
|   ├── /api/onedrive/sync       ───► Microsoft Graph API (OneDrive Archival) |
|   └── /api/storage/upload      ───► Cloudinary CDN & Media Storage          |
|                              │                                              |
|                              ▼                                              |
|   [Database & Security Layer (Supabase PostgreSQL)]                         |
|   ├── Auth Engine (JWT Sessions & Role Verification)                        |
|   ├── Row Level Security (RLS) Subquery Policies                            |
|   └── Storage Buckets (Templates, Documents, Signatures)                    |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 📚 Technical Documentation Hub

Comprehensive architectural specifications, dataflow diagrams, and development runbooks are organized in the [`docs/`](./docs/README.md) directory:

| Document | Description | Link |
| :--- | :--- | :--- |
| **Documentation Hub** | Master Map of Content (MOC) and central documentation index | [docs/README.md](./docs/README.md) |
| **System Architecture** | Full topology, component hierarchy, client SPA, and serverless Express backend | [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) |
| **System Map & Locator** | Granular code locator, component route registry, and problem-fix playbook | [SYSTEM_MAP.md](./docs/architecture/SYSTEM_MAP.md) |
| **Document Workflows** | 3-phase template inventory (13 documents), `StudentDocumentPage` rules, and DOCX pipeline | [DOCUMENT_WORKFLOWS.md](./docs/architecture/DOCUMENT_WORKFLOWS.md) |
| **Backend, DB & AI** | PostgreSQL schema, RLS subquery policies, storage buckets, and AI routes | [BACKEND_AND_DATABASE.md](./docs/architecture/BACKEND_AND_DATABASE.md) |
| **Feature Deep Dives** | Complete mechanics and dataflow diagrams for all 8 core platform features | [features/README.md](./docs/features/README.md) |
| **Refactoring Guidelines** | Coding standards, theme tokens, single-source-of-truth state, and Git rules | [REFACTORING_GUIDELINES.md](./docs/guidelines/REFACTORING_GUIDELINES.md) |
| **Active Tasks & Roadmap** | Ongoing sprint checklist, speech-to-text dictation, and template digitization | [TASKS.md](./docs/tasks/TASKS.md) |
| **Task History & Changelog**| Chronological record of completed milestones, refactors, and bug fixes | [TASK_HISTORY.md](./docs/tasks/TASK_HISTORY.md) |
| **Deployment Guide** | Vercel serverless configuration, environment checklist, and redeploy safeguards | [DEPLOYMENT_AND_VERCEL.md](./docs/deployment/DEPLOYMENT_AND_VERCEL.md) |

---

## 🌿 Git Branch Architecture

The repository enforces evergreen, role-based branch domains under strict **Option B** protection (direct pushes to `main` are forbidden; all merges occur via GitHub Pull Requests):

| Branch Name | Primary Purpose |
| :--- | :--- |
| **`main`** | Production-ready, stable baseline (PR merges only) |
| **`docs/Documentation`** | Documentation suite, architecture specifications, and panelist defense runbooks |
| **`feature/student`** | Student portal checklist, fillable templates, and weekly journal |
| **`feature/adviser`** | Adviser review sessions, document approval flows, and student roster |
| **`feature/supervisor`** | Supervisor attendance review, DTR digital signature approvals, and evaluations |
| **`feature/admin`** | Admin dashboard, master template configuration, and API key management |
| **`feature/landing-page`** | Public landing page, hero typography, 3D card carousel, and ScrollStack motion |
| **`backend/database`** | Supabase schemas, Postgres RLS policies, migrations, and OneDrive sync |

---

## 🛠️ Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm (v9+) or yarn
- **Git**: Configured for GitHub authentication

### 1. Clone & Install

```bash
git clone https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting.git
cd Capstone-2-Official-CloudHosting
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your API credentials:

```bash
copy .env.example .env
```

Ensure the following variables are configured in `.env`:

```env
# Supabase PostgreSQL & Auth
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Grammar & Compliance Auditing
VITE_GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-google-gemini-api-key

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Microsoft Graph / OneDrive Archival
MICROSOFT_GRAPH_CLIENT_ID=your-client-id
MICROSOFT_GRAPH_CLIENT_SECRET=your-client-secret
MICROSOFT_GRAPH_TENANT_ID=your-tenant-id
```

### 3. Run Development Server

Start both the Vite frontend (`port 3000`) and the Express serverless backend (`port 3001`):

```bash
npm run dev
```

### 4. Build & Verify

```bash
# TypeScript compiler type check
npm run lint

# Production bundle build
npm run build
```

---

## 📋 Academic Compliance & Attribution

Developed for the **College of Information and Communications Technology (CICT)** at **STI College Marikina** in partial fulfillment of the requirements for Capstone Project 2.

- **Institution**: STI College Marikina
- **Program**: Bachelor of Science in Information Technology (BSIT)
- **Repository**: [Capstone-2-Official-CloudHosting](https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting)
