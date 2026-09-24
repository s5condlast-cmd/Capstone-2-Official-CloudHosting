# Documentation Home

[Project Overview](../README.md) | [Architecture](architecture/README.md) | [Features](features/README.md) | [Guidelines](guidelines/README.md) | [Tasks & Roadmap](tasks/README.md)

Use this page as the central starting point for both GitHub and the Obsidian vault. All links use standard relative Markdown so they work across either environment.

---

## 🚀 Quick Access

| I want to... | Open | Key Topics |
| :--- | :--- | :--- |
| **Understand the system** | [Architecture overview](architecture/ARCHITECTURE.md) | Tech stack, system boundaries, and service topology |
| **Find any page, route, or service** | [System map](architecture/SYSTEM_MAP.md) | Complete directory tree, active routes, and database tables |
| **Follow a feature workflow** | [Feature specifications hub](features/README.md) | All 8 core portal feature pipelines and invariants |
| **Review authentication & security** | [Authentication & security](features/08_AUTHENTICATION_AND_SECURITY.md) | Two-step login, TOTP MFA, RLS policies, and admin provisioning |
| **Understand cloud archival** | [OneDrive integration](architecture/ONEDRIVE_INTEGRATION_SUMMARY.md) | Microsoft Graph OAuth2, token rotation, and directory hierarchy |
| **Set up or deploy the application** | [Deployment guide](architecture/DEPLOYMENT_AND_VERCEL.md) | Vercel serverless, environment keys, and build checks |
| **Work on current backlog & plans** | [Active tasks](tasks/TASKS.md) | Active sprint roadmap, acceptance criteria, and milestones |
| **Review coding & UI conventions** | [Guidelines index](guidelines/README.md) | React 19, theme tokens, UI scorecard, and manuscript |
| **Prepare for capstone defense** | [Panelist defense manual](PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md) | Defense Q&A, 11 API keys breakdown, and algorithms |
| **Read the capstone manuscript** | [Main manuscript](guidelines/Main_Document.md) | Academic thesis chapters, methodology, and citations |

---

## 📌 Master Implementation Specifications & Plans

These specifications define active systems, upcoming architectures, and production release gates:

| Document | Area | Summary |
| :--- | :---: | :--- |
| [Rich document editor plan](tasks/RICH_DOCUMENT_EDITOR_PLAN.md) | Document Pipeline | Master specification: Google Docs layout, Plate v53 runtime baseline, and template fidelity |
| [Bulk student roster import plan](tasks/BULK_ROSTER_IMPORT_PLAN.md) | Registrar / Admin | CSV/XLSX bulk account provisioning, chunking architecture, and security rules |
| [PocketBase migration plan](tasks/POCKETBASE_MIGRATION_IMPLEMENTATION_PLAN.md) | Self-Hosting / BaaS | Dual-backend adapter pattern, schema translation, and build automation |
| [Active tasks & roadmap](tasks/TASKS.md) | System-wide | Current sprint priorities, backlog, and verified acceptance items |
| [Task history & changelog](tasks/TASK_HISTORY.md) | Milestones / Changelog | Complete chronological record of all sessions, refactors, audits, and learned rules |

---

## 📂 Vault Structure

```text
docs/
├── README.md                            Documentation home (start here)
├── DOCUMENTATION_GUIDE.md               Documentation standards and vault rules
├── PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md Capstone defense manual & master technical runbook
│
├── architecture/                        System design, storage, and deployment
│   ├── README.md                        Section index
│   ├── ARCHITECTURE.md                  System topology & architecture overview
│   ├── SYSTEM_MAP.md                    Routes, components, and code map
│   ├── BACKEND_AND_DATABASE.md          Express APIs, Supabase PostgreSQL, and RLS
│   ├── POCKETBASE_SELF_HOSTING_ARCHITECTURE.md PocketBase self-hosting, tunnel ingress & security
│   ├── DOCUMENT_WORKFLOWS.md            Fillable templates & document lifecycle
│   ├── DEPLOYMENT_AND_VERCEL.md         Vercel serverless deployment guide
│   └── ONEDRIVE_INTEGRATION_SUMMARY.md  Microsoft Graph OneDrive sync & setup runbook
│
├── features/                            User-facing feature workflows (01 to 08)
│   ├── README.md                        Feature specifications index
│   ├── 01_STUDENT_PORTAL_CHECKLIST.md   Student dashboard & practicum checklist
│   ├── 02_DOCUMENT_PIPELINE.md          13-template digital document pipeline
│   ├── 03_DTR_ATTENDANCE_SIGNATURE.md   Daily Time Record & canvas signatures
│   ├── 04_AI_GRAMMAR_AUDIT.md           Dual-model AI review (Groq + Gemini)
│   ├── 05_ADVISER_SUPERVISOR_REVIEW.md  Review rooms, queues, and remarks
│   ├── 06_ADMIN_MANAGEMENT.md           User management, templates & clearance
│   ├── 07_CALENDAR_AND_EVENTS.md        Practicum calendar & event scheduling
│   └── 08_AUTHENTICATION_AND_SECURITY.md Two-step login, TOTP MFA, RLS & admin provisioning
│
├── guidelines/                          Engineering rules, UI standards, and manuscript
│   ├── README.md                        Guidelines section index
│   ├── REFACTORING_GUIDELINES.md        Code standards, React 19, and Git rules
│   ├── UI_UX_REVIEWER.md                Design system, theme tokens, and audit scorecard
│   └── Main_Document.md                 Capstone manuscript & academic proposal
│
└── tasks/                               Active work, plans, and session history
    ├── README.md                        Tasks section index
    ├── TASKS.md                         Active tasks roadmap
    ├── RICH_DOCUMENT_EDITOR_PLAN.md     Unified rich document editor master plan
    ├── BULK_ROSTER_IMPORT_PLAN.md       Bulk student roster import plan
    └── TASK_HISTORY.md                  Complete session history, milestones & master changelog
```

Keep navigation shallow: start here, choose a section, then open the specific document. See the [documentation guide](DOCUMENTATION_GUIDE.md) before adding or reorganizing notes.
