# Refactoring & Development Guidelines

Engineering rules and conventions verified against the actual codebase. Follow these when modifying, refactoring, or extending the project.

---

## 1. Component Architecture Rules

### Student Pages

- **Always use `StudentDocumentPage`**: Every student requirement page MUST use [`src/components/compose/StudentDocumentPage.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/compose/StudentDocumentPage.tsx) as its layout wrapper. Never create standalone page layouts.
- **Descriptive filenames only**: Use the full template name (e.g. `ProposalLetterToTheIndustry.tsx`, `STIOJTEndorsementLetter.tsx`). Never use `Proposal.tsx`, `Requirements.tsx`, or `DocumentSubmission.tsx`.
- **Database state syncing**: On mount, always query `submissionStorage.getLatestDocumentByType()` to fetch the latest submission status. Override hardcoded default props with live data.

### Shared UI Components

- **EmptyState**: Always use [`src/components/ui/EmptyState.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/ui/EmptyState.tsx) for zero-data scenarios. Never render ad-hoc empty divs or raw text.
- **ErrorBoundary**: Wrap volatile sections with [`src/components/ui/ErrorBoundary.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/ui/ErrorBoundary.tsx).

---

## 2. Document Viewer Rules

### `@embedpdf/react-pdf-viewer` ([`EmbedPdfWorkspace.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/review/EmbedPdfWorkspace.tsx))

```tsx
// MANDATORY — viewer collapses to 0px without explicit sizing
<PDFViewer className="w-full h-full" style={{ width: '100%', height: '100%' }} ... />
```

### `docx-preview` ([`DocxViewer.tsx`](file:///c:/Users/johnd/Downloads/MainCode/src/components/review/DocxViewer.tsx))

The library injects hardcoded widths (816px). Override with:

```tsx
className="[&_section]:!w-full [&_section]:!max-w-full [&_section]:!box-border overflow-hidden"
```

- **Do NOT use `!p-0`** — it destroys native page margins
- After `renderAsync()`: remove all `<header>` elements
- `.editable-placeholder` spans: `pointer-events-none`, `contentEditable="false"`, no visual styling

---

## 3. Styling & Theme Conventions

### `cn()` Helper

Always import when merging Tailwind classes dynamically:

```typescript
import { cn } from '@/src/lib/utils';
```

Implementation: `clsx()` + `twMerge()` from [`src/lib/utils.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/lib/utils.ts).

### Theme-Aware Colors

**Never hardcode**: `bg-blue-600`, `text-blue-500`, `border-indigo-500`, etc.  
**Always use**: `text-primary`, `bg-primary`, `border-primary`, or `variant="primary"` on `Button`/`Badge`.

The theme system uses CSS variables (`--theme-primary`) set on `<html>`. Available themes:

- `default` — monochrome black/white
- `theme-blue`, `theme-indigo`, `theme-sti`, `theme-cyan`

Theme is initialized in `App.tsx` `useEffect()` and persisted in `localStorage` under `app-theme`.

---

## 4. State Management & Data Fetching

### Single Source of Truth

- Page data must come from Supabase (or its local fallback). Never mix hardcoded mock arrays with live database records in the same view.

### Loading Lifecycle

```text
Mount → loading = true → fetch from Supabase → loading = false → render data OR EmptyState
```

- **Never** use `setTimeout()` to simulate loading delays
- **Never** silently substitute mock data when a DB query fails — render EmptyState instead

### Action Spinners

- For user actions (Approve, Reject, Upload), show loading state on the specific button/card
- Do not trigger full-page skeleton reloads for individual actions

---

## 5. Custom Hooks Reference

| Hook | Source | Purpose |
| :--- | :--- | :--- |
| `useDocumentStatus(studentName, docType)` | [`src/hooks/useDocumentStatus.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/hooks/useDocumentStatus.ts) | Fetches latest submission status from `student_documents` table. Returns `{ status, isLoading, documentId, refreshStatus }` |
| `usePhaseLock()` | [`src/hooks/usePhaseLock.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/hooks/usePhaseLock.ts) | Manages OJT phase lock state (`beforeOjt`, `inOjt`, `finals`). Returns `{ locks, toggleLock }`. Currently all phases unlocked for testing. |
| `useSpeechToText()` | [`src/hooks/useSpeechToText.ts`](file:///c:/Users/johnd/Downloads/MainCode/src/hooks/useSpeechToText.ts) | Browser Web Speech API wrapper. Returns `{ isListening, transcript, interimTranscript, isSupported, startListening, stopListening, resetTranscript }` |

---

## 6. File Renaming & Deletion Protocol

1. **Delete obsolete files completely**: Remove from disk AND clean up all `import` statements in `App.tsx` and other parent modules
2. **Never `git checkout` deleted paths**: Restoring deleted files creates merge conflicts with outdated code
3. **Verify immediately**: Run `npm run lint` + `npm run build` after any rename/delete operation

---

## 7. Import Path Conventions

The project uses a `@/` path alias mapped to the project root:

```json
// tsconfig.json
"paths": { "@/*": ["./*"] }

// vite.config.ts
resolve: { alias: { '@': path.resolve(__dirname, '.') } }
```

Standard import patterns:

```typescript
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/src/components/ui/Button';
import { submissionStorage } from '@/src/lib/submissionStorage';
```

---

## 8. Build & Verification Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start Vite (port 3000) + Express backend (port 3001) concurrently |
| `npm run vite` | Start Vite only (port 3000) |
| `npm run backend` | Start Express backend only (tsx backend/server.ts) |
| `npm run lint` | TypeScript check: `tsc --noEmit` |
| `npm run build` | Production bundle: `vite build` → `dist/` |
| `npm run clean` | Remove `dist/` directory (cross-platform) |
| `npm run preview` | Preview production build locally |

---

## 9. Asset & Static File Organization Rules

### Landing Page Assets Directory

- **Native Path**: All landing page icons, illustrations, and logos must reside in and be referenced from `public/images/Landing Page Icons/`:
  - **Logo**: `/images/Landing Page Icons/Logo.svg`
  - **Post Icon**: `/images/Landing Page Icons/Landing Page Post.svg`
  - **Key Points Icon**: `/images/Landing Page Icons/Landing Page key Points.svg`
  - **Selfie Graphic**: `/images/Landing Page Icons/Landing Page Selfie.svg`
- **Strict File Discovery**: Always check existing folder locations before creating duplicate asset paths or assuming file locations. Always place files into their designated, correct order and directory.
- **Reference Integrity**: Reference assets directly by their native public folder path to avoid broken URLs and Vite `ENOENT` bundling errors.
