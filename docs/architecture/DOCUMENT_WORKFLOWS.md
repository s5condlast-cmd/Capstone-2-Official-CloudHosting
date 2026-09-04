---
title: "Document Workflows & Template Generation Pipeline"
description: "Master 3-phase OJT template inventory (13 documents), DOCX TreeWalker scan, JSZip injection, ExcelJS signature fitting, and print CSS rules."
tags:
  - sti-ojt
  - templates
  - docx-generation
  - exceljs
  - signature-fitting
  - easy-template-x
aliases:
  - "Document Workflows"
  - "Template Pipeline"
  - "DOCX Generator Architecture"
created: 2026-08-26
updated: 2026-09-04
---

# Document Workflows & Template Generation Pipeline

[←  Back to Documentation Hub](../README.md) | [Architecture Overview](ARCHITECTURE.md) | [System Map](SYSTEM_MAP.md) | [Backend & Database](BACKEND_AND_DATABASE.md)

All template names, generation steps, and signature protocols verified against actual source code.

---

## 1. Official OJT Template Inventory

### Phase 1: Before OJT (8 templates)

| # | Template Name | File Type | FT-CRD Code | Student Page Component |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Student Application Letter | DOCX | `FT-CRD-137-01` | `StudentApplicationLetter.tsx` |
| 2 | Parent Consent Form (With Fee) | PDF | `FT-CRD-130-00` | `LetterOfConsent.tsx` |
| 3 | Parent Consent Form (Without Fee) | PDF | `FT-CRD-131-00` | `LetterOfConsent.tsx` |
| 4 | Student Consent Form (With Fee) | PDF | `FT-CRD-138-01` | `LetterOfConsent.tsx` |
| 5 | Student Consent Form (Without Fee) | PDF | `FT-CRD-139-01` | `LetterOfConsent.tsx` |
| 6 | MOA Template | PDF | `FT-CRD-128-01` | `MemorandumOfAgreement.tsx` |
| 7 | Endorsement Letter | DOCX | `FT-CRD-135-01` | `STIOJTEndorsementLetter.tsx` |
| 8 | Proposal Letter | DOCX | `FT-CRD-134-01` | `ProposalLetterToTheIndustry.tsx` |

### Phase 2: In OJT (3 templates)

| # | Template Name | File Type | FT-CRD Code | Student Page Component |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Journal Template | DOCX | `FT-CRD-167-00` | `WeeklyJournal.tsx` |
| 2 | DTR Form | XLSX (generated) | — | `DTR.tsx` |
| 3 | Training Plan Form (BSIT/BSCS/etc.) | DOCX | `FT-CRD-176-00` | `OJTTrainingPlan.tsx` |
| 3b | Training Plan Form (BSCpE) | DOCX | `FT-CRD-175-00` | `OJTTrainingPlan.tsx` |

### Phase 3: Final (2 templates)

| # | Template Name | File Type | FT-CRD Code | Student Page Component |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Integration Paper Template | PDF | `FT-CRD-127-01` | `IntegrationPaper.tsx` |
| 2 | Performance Appraisal Template | PDF | `FT-CRD-133-02` | `PerformanceAppraisal.tsx` |

> [!NOTE]
> Templates are stored in **Supabase Storage** (bucket: `templates`) and **Cloudinary** (`practicum/templates`), with local IndexedDB fallback. Student pages reference `/templates/FT-CRD-*` paths which are resolved dynamically at runtime by `templateStorage.ts`.

---

## 2. Student Document Page Architecture

Every student requirement page MUST use the shared layout: [`src/components/compose/StudentDocumentPage.tsx`](../../src/components/compose/StudentDocumentPage.tsx).

**Configuration pattern** (example from `StudentApplicationLetter.tsx`):

```tsx
const templates = [{
  name: "Student Application Letter",
  docUrl: "/templates/FT-CRD-137-01 Student Application Letter Template.docx",
  pdfUrl: "/templates/FT-CRD-137-01 Student Application Letter Template.pdf",
  useDocxPreview: true
}];
return <StudentDocumentPage templates={templates} status={status} ... />;
```

**What `StudentDocumentPage` provides:**

- Template selector (if multiple variants exist, e.g. consent forms)
- Status badge display (Draft / Pending / Approved / Revision Required)
- Adviser feedback display
- File upload button
- Launches `DocumentWorkflow` for preview + fill + generate

---

## 3. DOCX Template Generation Pipeline

Source: [`src/lib/documentGenerator.ts`](../../src/lib/documentGenerator.ts)

### Step 1: DocxViewer TreeWalker Scan

Source: [`src/components/review/DocxViewer.tsx`](../../src/components/review/DocxViewer.tsx)

After `renderAsync()` from `docx-preview`:

1. Remove all `<header>` elements from container
2. TreeWalker scans all text nodes for regex: `/(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/g`
3. Wraps matches in `<span class="editable-placeholder">`:
   - `_{3,}` ← ’ gets `data-blank-index` (sequential counter)
   - `^\s*Date\s*:?\s*$` ← ’ gets `data-date-index` (sequential counter)
   - `[brackets]` or `<angles>` ← ’ gets `data-original` attribute

### Step 2: DocumentWorkflow Form Extraction

Source: [`src/components/compose/DocumentWorkflow.tsx`](../../src/components/compose/DocumentWorkflow.tsx)

Queries `.editable-placeholder` elements to build:

- `blankEdits[]` — values for `data-blank-index` items (sequential)
- `dateEdits[]` — values for `data-date-index` items (sequential)
- `angleData{}` — dictionary for `<TAG>` items (key = tag name without `<>`)
- `squareData{}` — dictionary for `[bracket]` items

### Step 3: Document Generation

Source: [`src/lib/documentGenerator.ts`](../../src/lib/documentGenerator.ts)

```typescript
documentGenerator.generateDocx(templateUrl, formData, blankEdits, angleData, squareData, dateEdits, templateId, title)
```

Pipeline:

1. Fetch DOCX template buffer (from Supabase via `templateStorage` or direct URL)
2. **JSZip** (static import): Open `.docx` ← ’ read `word/document.xml`
3. **Inject blanks**: Replace `/_{3,}/g` matches sequentially with `blankEdits[]`
4. **Inject dates**: Replace `/>(\s*Date\s*:?\s*)</g` sequentially with `dateEdits[]`
5. **Repackage JSZip** ← ’ output modified ArrayBuffer
6. **easy-template-x**: `new TemplateHandler({ delimiters: { tagStart: "<", tagEnd: ">" } })` ← ’ merge `angleData` to replace `<TAG>` placeholders even when split across XML runs
7. **Signature blocks** (for Application/Proposal letters): Built programmatically using the `docx` library with zero-border `Table` wrapper:
   - Cell width: `2800 DXA` for 24-underscore lines
   - Cell margins cleared: `{ left: 0, right: 0 }`
   - Text alignment: `AlignmentType.CENTER`
8. Return final `Blob`

> [!IMPORTANT]
> Always `import JSZip from 'jszip'` statically. Dynamic imports fail silently in Vite dev servers.

---

## 4. Printable Form Field Rules (`AutoWidthInput`)

- **Print CSS**: Under `@media print`, `<input>` elements are hidden (`display: none !important`) and `[data-print-text]` spans are shown inline
- **Placeholder Suppression**: `hidePlaceholderInPrint` prop omits `data-print-text` when field is empty
- **Word Limit**: 30 words max per fill-in-the-blank field
- **Unique State Keys**: Never reuse keys across different document fields

---

## 5. Excel DTR Generation & Signature Fitting

Source: [`src/lib/excelGenerator.ts`](../../src/lib/excelGenerator.ts)

### Exports

- `generateCSV(entry: WeeklyJournalEntry)` — CSV string for journal entries
- DTR spreadsheet generation via ExcelJS with embedded signatures

### Canvas Signature Fitting Protocol

1. **Cell dimensions**: Column G width 30 = ~225px, Row height 45 = ~60px
2. **Luminance filtering**: Scan RGBA pixels with `alpha > 30 && (r < 200 || g < 200 || b < 200)` to isolate dark ink strokes
3. **Adaptive scaling**: Fill 90% of target canvas height: `targetH = Math.round(rowHeightPoints * 1.33 * 2)`
4. **Cell anchoring**: Two-cell anchors from `col: 6.0` to `7.0`, `(rowIndex - 1)` to `rowIndex` — exact column boundaries, no fractional offsets

### Template Field Definitions

Source: [`src/components/review/templateFields.ts`](../../src/components/review/templateFields.ts)

Maps each FT-CRD template filename to its array of fillable field definitions. Used by `DocumentWorkflow.tsx` to render the right-side form panel.

---

## 6. Template Download/Print Fallback Rules

From `DocumentWorkflow.tsx`:

1. **Native PDF templates** (`useDocxPreview === false`): "Download PDF" triggers direct `Blob` download — never `window.print()`
2. **DOCX templates with PDF backup**: Check Supabase for `${templateId}_pdf_backup`. If found, download directly. If not, fall back to `window.print()`
3. **Admin Templates page**: Every template card exposes 4 explicit action buttons (Upload DOCX, Upload PDF, Download DOCX, Download PDF)

---

## Related Documentation & Cross-References

- [02. Digital Document Generation Pipeline](../features/02_DOCUMENT_PIPELINE.md) — Step-by-step user and technical workflow
- [03. DTR Attendance & Signature Fitting](../features/03_DTR_ATTENDANCE_SIGNATURE.md) — Timesheet generation and signature cropping
- [06. Admin Master Templates & Verification](../features/06_ADMIN_MANAGEMENT.md) — 4-button template management grid
- [Refactoring Guidelines](../guidelines/REFACTORING_GUIDELINES.md) — Component architecture and state standards
- [Backend & Database Architecture](BACKEND_AND_DATABASE.md) — Supabase storage buckets and tables
