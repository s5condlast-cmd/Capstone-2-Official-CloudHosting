# 📄 Rich Document Editor — Master Architecture, UI Specification & Production Plan

[← Back to Tasks Hub](README.md) | [Documentation Hub](../README.md) | [Active Tasks](TASKS.md) | [Task History](TASK_HISTORY.md)

**Status:** Unified Master Specification & Production Plan  
**Scope:** Student Document Editor (`/student/editor`), Plate.js v53 Primitives, Google Docs Layout Adaptation, and DOCX/PDF Template Fidelity  
**Companion Implementations:** `src/pages/student/StudentDocumentEditor.tsx`, `src/components/editor/plate-editor.tsx`, `src/components/plate-ui/*`, `src/components/editor/serializers/docxSerializer.ts`

---

## 📑 Table of Contents

1. [Executive Summary & Target Contract](#1-executive-summary--target-contract)
2. [Google Docs Reference Layout & UI Specification](#2-google-docs-reference-layout--ui-specification)
3. [Verified Runtime Baseline & Component Audit](#3-verified-runtime-baseline--component-audit)
4. [Document Envelope & Serialization Engine](#4-document-envelope--serialization-engine)
5. [Interactive Browser Acceptance Matrix](#5-interactive-browser-acceptance-matrix)
6. [Production Release Gates](#6-production-release-gates)

---

## 1. Executive Summary & Target Contract

The Student Document Editor provides in-browser authoring and editing for official university practicum templates without requiring desktop Microsoft Office.

### The Document Fidelity Contract

Official university DOCX/PDF templates are the top priority. Students must be able to fill and customize these templates without losing official institutional wording, logos, tables, signatures, formatting, or pagination structure.

1. **Exact Preservation**: Official text, entered field values, required elements, and document revision must be preserved with 100% fidelity.
2. **Page & Layout Fidelity**: Strict enforcement of approved page geometry (Letter/A4), line wrapping, table widths, headers/footers, and signature blocks.
3. **Authority of Rendered Artifact**: The final rendered PDF/DOCX artifact represents the authoritative submission reviewed by academic coordinators.
4. **Resilient Persistence**: Changes auto-save locally to IndexedDB with optimistic concurrency control (OCC) synchronization to Supabase PostgreSQL (`editor_drafts`, `editor_draft_versions`).

---

## 2. Google Docs Reference Layout & UI Specification

The editor interface adapts the familiar Google Docs layout into the STI practicum system's visual language:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ← Repository  |  Document Title (Editable)   [Template Code]  [Saved / Revision] │
│  File   Edit   View   Insert   Format   Tools             [History]  [Submit]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  [Undo/Redo] [Print] [Format Brush] | [Styles] [Font] [Size] [B I U] | [Align/List]...│
├───────────────┬──────────────────────────────────────────────────┬───────────────┤
│               │                                                  │               │
│  DOCUMENT     │                  PAPER CANVAS                    │   COMMENTS    │
│  OUTLINE      │                                                  │   RAIL        │
│               │   ┌──────────────────────────────────────────┐   │               │
│  - Heading 1  │   │  Header: Moveable Logo + Official Text   │   │  [Thread 1]   │
│  - Heading 2  │   │                                          │   │  Adviser note │
│  - Section A  │   │  Body Content (Plate.js Rich Blocks)     │   │  [Reply / OK] │
│               │   │                                          │   │               │
│               │   │  Footer: Page [X] of [Y]                 │   │               │
│               │   └──────────────────────────────────────────┘   │               │
│               │                                                  │               │
└───────────────┴──────────────────────────────────────────────────┴───────────────┘
```

### Layout Components

1. **Header & Identity Row**:
   - **Back Action**: Quick return to Student Document Repository (`/student/documents`).
   - **Document Title**: Inline editable title with automatic filename sanitization (`sanitizeDocumentFilename`).
   - **Status Badges**: Real-time cloud sync status (*Saved*, *Saving...*, *Offline*), revision count, and submission lock indicator.
   - **Actions**: Document History Drawer trigger, Duplicate as Draft (for locked submissions), and Final Submission button.

2. **Menu Bar**:
   - Exactly 6 menus: **File**, **Edit**, **View**, **Insert**, **Format**, **Tools**.
   - *Extensions* and *Help* are intentionally omitted at all viewports.
   - Menus trigger established Plate editor commands rather than maintaining duplicate execution logic.

3. **Rounded Formatting Toolbar**:
   - Single-row rounded strip (~48px height, 24px border-radius, 32px control targets).
   - Contains: Undo/Redo, Print preview, Block styles (Normal, H1–H3), Font family selector, Font size picker, Text marks (Bold, Italic, Underline, Strikethrough, Code, Color, Highlight), Lists (Bulleted, Numbered, Checklist, Toggle), Table generator, Link dialog, Media inserter, and Speech-to-text dictation.
   - **Pinned Right End**: Mode dropdown (*Editing*, *Suggesting*, *Viewing*), vertical separator, and Fullscreen toggle arrow (`Maximize2` / `Minimize2`).

4. **Left Rail — Document Outline**:
   - Collapsible outline rail (240–280px) displaying hierarchical headings extracted from live Plate editor nodes.
   - Clicking a heading smoothly scrolls the paper canvas to the target node.

5. **Center — Paper Workspace**:
   - Realistic drop-shadowed white paper sheet centered in an ambient canvas.
   - Standard Letter (816px) or A4 width at 100% zoom with user-selectable zoom scaling (50% to 200%).
   - Preserves paper appearance across light and dark theme modes.

6. **Right Rail — Synchronized Comments**:
   - Soft comment cards (300–360px) supporting anchored node highlights, author roles, threaded replies, and resolution workflows.

---

## 3. Verified Runtime Baseline & Component Audit

### Installed Baseline
- **Runtime**: `platejs@53.3.11`, React 19, Tailwind CSS v4.
- **Automated Test Coverage**: **67/67** tests passing in `npm run test:editor`.

### Verified Capabilities (Compiler & Automated Test Proven)

| Area | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Paragraphs & Headings (H1–H6)** | Verified | Plate native block renderers and transforms registered. |
| **Inline Formatting (B, I, U, S, Code, Highlight)** | Verified | Leaf renderers active; Plate v53 transforms covered by runtime tests. |
| **Typographic Styling (Size, Color, BgColor, Sub/Superscript)** | Verified | Leaf properties registered and serialized to DOCX runs. |
| **Lists (Bulleted, Numbered, Checklist, Toggle)** | Verified | Proper `ul/ol > li` tree nesting; empty line unwrap to paragraph. |
| **Block Reordering & Movement** | Verified | Verified with `moveNodes` Plate transform tests. |
| **Tables, Links, Dividers, Dates** | Verified | Complete React node renderers; void nodes preserve Slate children. |
| **Word Header & Footer Serialization** | Verified | Native Word header/footer with moveable logo, alignment, and page numbering. |
| **Autosave & OCC Revision Tracking** | Verified | IndexedDB debounced local caching; optimistic concurrency control on cloud sync. |
| **Snapshots & Version Restore** | Verified | Immutable snapshots in `editor_draft_versions`; clean state remounting. |
| **Sanitization & Word Count** | Verified | `sanitizeDocumentFilename` and `countWords` pass all boundary test cases. |

---

## 4. Document Envelope & Serialization Engine

To eliminate discrepancies between draft editing, Word downloads, and submitted artifacts, the editor enforces a unified **Document Envelope**:

```typescript
interface DocumentEnvelope {
  schemaVersion: 1;
  templateId: string;
  revision: number;
  body: PlateNode[];
  headerFooter: {
    firstPageOnly?: boolean;
    headerText?: string;
    footerText?: string;
    logoUrl?: string;
    logoAlignment?: 'left' | 'center' | 'right';
  };
  pageSettings: {
    paperSize: 'letter' | 'a4';
    margins: { top: number; bottom: number; left: number; right: number };
    orientation: 'portrait' | 'landscape';
  };
}
```

### DOCX Serialization Engine (`docxSerializer.ts`)

1. **Font Size Metric Conversion**: Accurately maps CSS pixel values to Word half-points (e.g., `16px` $\rightarrow$ 24 half-points / 12pt).
2. **Table Geometry**: Serializes explicit cell column widths, `colSpan`, `rowSpan`, and header styling.
3. **Hyperlinks**: Serializes Plate inline link elements into Word `ExternalHyperlink` instances.
4. **Header & Footer Integration**: Serializes native Word Header and Footer sections with offset-derived logo alignment and dynamic `PageNumber` fields.

---

## 5. Interactive Browser Acceptance Matrix

Before production release, the following interactive behaviors must be verified on a running browser instance with authenticated accounts:

- [ ] **Hyperlink Workflow**: Link creation, URL validation, inline editing, opening in new tab, and unlink actions.
- [ ] **Table Operations**: Dynamic grid insertion, row addition/deletion, column addition/deletion, cell merging, and cell selection.
- [ ] **Media Assets**: Image insertion via local file upload and remote URL; image crop and resize handles.
- [ ] **Voice Dictation**: Web Speech API activation, permission prompt handling, interim transcription, and text insertion into active cursor selection.
- [ ] **Responsive Navigation**: Smooth collapsing of outline and comment rails on standard laptop and tablet screens.
- [ ] **Multi-Tab Concurrency**: Simultaneous editing warning and graceful conflict resolution (*Keep Local* vs *Load Remote*).
- [ ] **Submission Locking**: Submitting a document transitions editor into read-only viewing mode with *Duplicate as Draft* fallback.

---

## 6. Production Release Gates

1. **Gate 1 — Serialization Fidelity**: Every official university template exports to DOCX/PDF with matching margins, fonts, and table geometries.
2. **Gate 2 — Zero-Loss Storage**: Offline-to-online reconciliation preserves 100% of user edits without silent overwrites.
3. **Gate 3 — Verification Suite**: `npm run lint`, `npm run test:auth`, and `npm run test:editor` execute with 0 errors.
4. **Gate 4 — Coordinator Approval**: End-to-end review lifecycle verified between Student authoring and Academic Adviser sign-off.
