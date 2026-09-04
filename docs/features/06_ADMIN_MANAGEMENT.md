---
title: "Admin Master Templates & Clearance Verification Documentation"
description: "Master Administrator Console, template distribution architecture, uniform 4-button action grid, and institutional clearance verification."
tags:
  - sti-ojt
  - admin-console
  - template-management
  - clearance-verification
  - user-management
aliases:
  - "Admin Management"
  - "Template Management"
  - "Clearance Verification"
created: 2026-08-26
updated: 2026-09-04
---

# âš™ï¸ Admin Master Templates & Clearance Verification Documentation

[←  Back to Features Hub](README.md) | [Documentation Hub](../README.md) | [Document Pipeline](02_DOCUMENT_PIPELINE.md) | [Document Workflows Spec](../architecture/DOCUMENT_WORKFLOWS.md) | [Backend Architecture](../architecture/BACKEND_AND_DATABASE.md)

A complete technical breakdown of the **Administrator Console**, master template distribution system, uniform 4-button action grid, and institutional clearance verification.

---

## ðŸŒŸ Feature Overview

The Administrator Console provides school administrators, program heads, and registrars with global oversight of the practicum system:

1. **Master Template Management**: Upload, replace, and distribute the 13 official master DOCX files and their companion PDF references.
2. **Clearance & Verification Queue**: Final stage gate where registrars verify that all practicum hours (460h) and documents are satisfied before clearing students for graduation.
3. **User & Partner Administration**: Manage student rosters, faculty adviser assignments, and host training establishment (HTE) partnerships.

---

## ðŸ—ï¸ Architecture & Template Distribution Dataflow

```mermaid
graph TD
    A[Admin Opens Templates.tsx] --> B[Renders 13 Template Cards]
    B --> C[4-Button Action Grid per Card]
    C --> D[Upload DOCX Master]
    C --> E[Upload PDF Reference / Backup]
    C --> F[Download DOCX Master]
    C --> G[Download PDF Reference]
    D --> H[Store in Cloudinary / Supabase templates Bucket]
    E --> H
    H --> I[Available Instantly Across All Student Workflows]
    I --> J[Student Opens StudentDocumentPage.tsx]
    J --> K[Pulls Latest Admin Master Template]
```

---

## ðŸ” How It Works Under the Hood

### 1. The Uniform 4-Button Action Grid

To eliminate hidden actions, ambiguous menus, and inconsistent card layouts, every template card in [`src/pages/admin/Templates.tsx`](../../src/pages/admin/Templates.tsx) exposes an identical 4-button action grid:

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                       MASTER TEMPLATE CARD ACTION GRID                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                             â”‚
â”‚  [Template Title: Student Application Letter]                               â”‚
â”‚  Phase: Before OJT   |   File Type: DOCX + PDF Reference   |  Status: Activeâ”‚
â”‚                                                                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”‚
â”‚  â”‚   â¬† Upload DOCX (Primary)     â”‚   â¬† Upload PDF (Primary)      â”‚          â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤          â”‚
â”‚  â”‚   â¬‡ Download DOCX (Outline)   â”‚   â¬‡ Download PDF (Outline)    â”‚          â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚
â”‚                                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- **Upload DOCX**: Replaces the master document used by `documentGenerator.ts` to generate student submissions.
- **Upload PDF Backup**: Serves as a reference layout and provides an automatic fallback download if the student's browser cannot render dynamic DOCX previews.
- **Download DOCX**: Allows coordinators to download the raw master document for off-platform edits.
- **Download PDF**: Allows students and faculty to view or print the blank official document directly.

---

### 2. Institutional Document Verification (`DocumentVerification.tsx`)

The final institutional gate before a student receives academic practicum credit:

- Aggregates completed student profiles with all 3 phases marked `Approved`.
- Displays verified total attendance hours (verified by the supervisor).
- Allows registrars to issue the **Final Practicum Clearance Stamp**.
- Automatically generates a completion record and archives the student's documentation.

---

## 🎯 Target Code Locator

| Component / Utility | File Location | Purpose |
| :--- | :--- | :--- |
| **Admin Dashboard** | [`src/pages/admin/AdminDashboard.tsx`](../../src/pages/admin/AdminDashboard.tsx) | System statistics, active student counts, charts |
| **Template Management** | [`src/pages/admin/Templates.tsx`](../../src/pages/admin/Templates.tsx) | Master template uploads and 4-button action grid |
| **Document Verification** | [`src/pages/admin/DocumentVerification.tsx`](../../src/pages/admin/DocumentVerification.tsx) | Registrar final clearance and graduation sign-off |
| **User Management** | [`src/pages/admin/UserManagement.tsx`](../../src/pages/admin/UserManagement.tsx) | User accounts, roles, and section assignments |
| **Company Management** | [`src/pages/admin/CompanyManagement.tsx`](../../src/pages/admin/CompanyManagement.tsx) | Host company directory and MOA validities |

---

## 💡 Important Rules & Design Invariants

1. **No Dropdowns for Actions**: Never hide upload/download buttons behind dropdown menus on template cards. Maintain the explicit 4-button grid.
2. **Synchronized Sizing**: All template cards must maintain identical height, grid padding, and button alignment regardless of title length.
3. **Template Storage Bucket**: All files are stored under Cloudinary (`practicum/templates`) and the Supabase `templates` storage bucket with public read access for authenticated students.

---

## Related Documentation & Cross-References

- [02. Digital Document Generation Pipeline](02_DOCUMENT_PIPELINE.md) — 13-template pipeline and dynamic generation
- [Document Workflows Architecture](../architecture/DOCUMENT_WORKFLOWS.md) — Official OJT template inventory
- [Backend & Database Architecture](../architecture/BACKEND_AND_DATABASE.md) — `template_metadata` table and storage policies
- [Cloudinary Document Storage Integration](../deployment/CLOUDINARY_INTEGRATION_SUMMARY.md) — CDN media storage and master template assets
