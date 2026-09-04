# Project Rules

## Alignment and Formatting Clarification

- **Identify Render Channels**: When the user reports layout or styling discrepancies in documents, clarify immediately whether the issue is visible on the **web application's React preview** or within the **downloaded/exported DOCX or PDF files**.
- **Interactive Alignment (`/grill-me`)**: Suggest the `/grill-me` slash command if there is layout ambiguity or if multiple attempts to resolve a visual bug have failed.
  - **Plain Language Standard**: When conducting a `/grill-me` interview, you MUST use **simple, everyday, easy-to-understand words**. Avoid dense technical jargon, complex code terminology, or confusing phrasing. Ask one simple question at a time, frame choices around visual behavior (e.g., *"Should the card stay fixed at the top or move away?"*), and keep questions short and clear so the user never gets confused.
- **Mandatory Post-Grill /goal Interactive Prompt**: Immediately after concluding any `/grill-me` interview and finalizing the implementation plan, the agent MUST call the `ask_question` tool with an interactive choice asking the user:
  1. *Execute using `/goal` mode* (Autonomous, extra-thorough end-to-end execution without stopping until 100% complete)
  2. *Execute using standard step-by-step mode* (Standard execution with intermediate checkpoints)
  The agent is strictly FORBIDDEN from beginning code changes or execution until the user explicitly responds to this `ask_question` prompt, regardless of any automated artifact approval hooks.
- **Goal Mode**: Suggest the `/goal` slash command when the user wants to initiate a complex, long-running task that requires the agent to be extra thorough and not stop until the goal is fully achieved.

## DOCX Template Editing Pattern

When implementing or modifying browser-based DOCX editing and generation in this repository (e.g., using `docx-preview` and `easy-template-x`), follow this established pipeline for handling non-standard templates (such as `_________` and `<PLACEHOLDER>`):

1. **Preview & Wrapping (`DocxViewer.tsx`)**:
   - **Layout Constraints**: The `docx-preview` library injects hardcoded widths and paddings (e.g., 816px) which will overflow responsive web containers. Always apply strict CSS overrides (e.g. `[&_section]:!w-full [&_section]:!max-w-full [&_section]:!box-border`) to the parent container to force the document to fit. Do not use `!p-0` as it destroys the document's native margins. Add `overflow-hidden` to the parent wrapper as a fallback.
   - Immediately after `renderAsync` resolves, query and remove all `<header>` elements from the container, as they should not be visible in the preview.
   - Use a `TreeWalker` to find and wrap non-standard text nodes in `.editable-placeholder` spans.
   - Use the regex `/(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/g` to capture square brackets, literal blanks (3+ underscores), angle brackets, and standalone 'Date' paragraphs.
   - For `_{3,}`, increment and assign a `data-blank-index` attribute to track its exact sequential position in the document.
   - For standalone 'Date' paragraphs, increment and assign a `data-date-index`.
   - For bracketed placeholders, assign a `data-original` attribute storing the original text.
   - CRITICAL: Do NOT add any visual styling (e.g., backgrounds, borders, hover effects) to `.editable-placeholder` spans, and ensure they are NOT clickable or editable (`contentEditable="false"`, `pointer-events-none`). The preview must remain strictly read-only and look exactly like the native document.

2. **Data Extraction (`DocumentWorkflow.tsx`)**:
   - Query `.editable-placeholder` elements.
   - Store inputs for `data-blank-index` items in a sequential `blankEdits` array.
   - Store inputs for `data-date-index` items in a sequential `dateEdits` array.
   - Store inputs for `<...>` angle brackets in an `angleData` dictionary, stripping the `<` and `>` from the key.

3. **Document Generation (`documentGenerator.ts`)**:
   - **Static JSZip**: Always `import JSZip from 'jszip'` statically at the top of the file. Do NOT use dynamic imports `await import('jszip')` as Vite dev servers may fail silently on resolution.
   - **Inject Blanks**: Use JSZip to open the `.docx` array buffer, read `word/document.xml`, and sequentially replace `/_{3,}/g` matches with the corresponding values from `blankEdits`.
   - **Inject Dates**: Use JSZip to sequentially replace `/>(\s*Date\s*:?\s*)</g` with the corresponding values from `dateEdits`.
   - **Inject Angle Tags**: Pass the resulting buffer to `easy-template-x` configured with custom delimiters: `new TemplateHandler({ delimiters: { tagStart: "<", tagEnd: ">" } })`. Pass the `angleData` to gracefully replace `<SCHOOL NAME>` tags even when split across underlying XML elements.
   - **Programmatic Signature Blocks (`documentGenerator.ts`)**: Always wrap left-aligned signature blocks (line, name, title) inside a `Table` with `borders` set at the **Table level** (`top`, `bottom`, `left`, `right`, `insideHorizontal`, `insideVertical` set to `BorderStyle.NONE`). Set table and cell width to tightly match the line length (e.g. `2800 DXA` for 24 underscores), and explicitly clear cell margins (`margins: { left: 0, right: 0 }`). Center text (`AlignmentType.CENTER`) inside the cell. This keeps the signature block flush-left against the page margin under "Respectfully yours," while keeping student names centered under the line.

## Printable Form Field Patterns (`AutoWidthInput`)

- **Print Strategy (`@media print`)**: In print stylesheets (`index.css`), hide raw `<input>` elements (`display: none !important`) and display the offscreen measurement `<span>` (`[data-print-text]`) as visible inline text. Chrome's print engine truncates `<input size={1}>` to 1 character width (~15px) if rendered directly.
- **Placeholder Suppression**: For optional print fields (such as `<Signature>`), use `hidePlaceholderInPrint` on `AutoWidthInput` so `data-print-text` is omitted when empty, preventing raw placeholder strings like `<Signature>` from appearing on printed or saved PDF documents.
- **State Independence**: Always assign unique state keys to separate document placeholders (e.g., `companyName` vs `salutationName`). Never reuse state keys across distinct fields.
- **Word Count Restrictions**: Enforce a strict **30-word limit** in `handleInputChange` for fill-in-the-blank document inputs to preserve letter layout structure.

## Student Document Workflows

When adding new document requirement workflows to the student portal (e.g., MOA, Consent Forms, Application Letters):

- **Never duplicate the layout UI:** Always use the generic `StudentDocumentPage` layout component located at `src/components/compose/StudentDocumentPage.tsx`.
- Pass all required configuration to the component, including the `templates` array, `status`, `submissionInfo`, and `adviserFeedback`.
- If a document requires dynamic instructions before uploading (e.g., explaining fees), use the `instructionsModal` property on the template object rather than building a custom modal.
- **Dynamic Database State Syncing:** Always query the database (`submissionStorage`) on mount/change to fetch the latest submission record for the active student and selected template. Merge the database status, adviser feedback remarks, and comments history array dynamically to override the default hardcoded props.

## Template Document Organization

When referencing or creating UI for templates, always adhere to the three official template phases and their required documents. Never hardcode generic placeholders like "Resume"; use the exact template names corresponding to the actual system architecture:

1. **Before OJT Templates**:
   - Student Application Letter
   - Parent Consent Form (With Fee)
   - Parent Consent Form (Without Fee)
   - Student Consent Form (With Fee)
   - Student Consent Form (Without Fee)
   - MOA Template
   - Endorsement Letter
   - Proposal Letter
2. **In OJT Templates**:
   - Journal Template
   - DTR Form
   - Training Plan Form
3. **Final Templates**:
   - Integration Paper Template
   - Performance Appraisal Template

## Weekly Journal Speech-to-Text Invariant

- **Strict Scope**: Speech-to-text (Web Speech API) voice dictation is strictly reserved for the **Weekly Journal reflection entry** (`WeeklyJournal.tsx`).
- **Do Not Apply to Letter Templates**: Never inject speech-to-text controls into the other 12 institutional fill-in-the-blank document templates (such as Application Letter, MOA, Endorsement, and Consent Forms) as these require precise formal written text.

## Student Page Naming Conventions

When creating or referencing React components and filenames for student document pages, ALWAYS use their explicit, descriptive names matching their template (e.g., use `ProposalLetterToTheIndustry.tsx` instead of `Proposal.tsx`). Avoid generic mockups like `DocumentSubmission.tsx` or `Requirements.tsx`; instead, use the `DocumentWorkflow` architecture for each specific document page.

## Template Fallback and Download Patterns

When building document preview workflows (e.g. `DocumentWorkflow.tsx`), handle "Print / Save PDF" logic dynamically to avoid broken HTML-rendered prints:

1. **Native PDF Documents:** If a template is natively a PDF (e.g. `useDocxPreview === false`), clicking "Download PDF" MUST trigger a direct file download of the raw PDF buffer using `window.URL.createObjectURL(new Blob([docBuffer]))`. Never call `window.print()` for native PDFs as the browser dialogue will distort the canvas rendering.
2. **DOCX Documents with PDF Backups:** If a template is natively a DOCX, check Supabase Storage for a `${templateId}_pdf_backup` file. If the admin has uploaded this backup, download it directly for the student as a fallback. Only call `window.print()` if no PDF backup exists.
3. **Explicit Admin Template Actions:** In the Admin Templates page, DO NOT hide file management actions behind dropdown menus. **Every** template card must consistently expose an explicit 4-button action grid at the bottom:
   - **Upload DOCX** (primary style)
   - **Upload PDF** (primary style, acting as the backup/reference)
   - **Download DOCX** (secondary/outline style)
   - **Download PDF** (secondary/outline style)
   Maintain identical spacing, alignment, and sizing across all template cards for a consistent admin experience.

## Utility and Styling Conventions

- **Dynamic Class Helper (`cn`)**: When writing or updating React components that dynamically apply styles using the class helper, always verify that `import { cn } from '@/src/lib/utils';` is included at the top of the file to prevent compiler lookup errors (`Cannot find name 'cn'`).
- **Theme-Aware UI Styling**: When styling active states, primary actions, or highlighting icons, DO NOT hardcode specific colors (e.g., `bg-blue-600`, `text-blue-500`). Instead, use theme-aware Tailwind classes like `text-primary`, `bg-primary`, or utilize the `variant='primary'` prop on custom components (`Button`, `Badge`). This ensures the UI respects the dynamic CSS variables (`--theme-primary`) and can correctly default to monochrome black/white or apply custom colored themes.

## Refactoring and File Renaming Cleanups

When performing refactoring or file renaming operations (such as renaming legacy page files to descriptive names):

- **Delete Legacy Files**: Ensure old files are completely deleted from the disk and their corresponding exports are removed.
- **Git State Care**: If a file is marked as deleted or renamed in `git status`, do not run `git checkout` on the legacy file path as it will restore outdated versions and cause build conflicts.
- **Verification**: Run `npm run lint` (`tsc --noEmit`) immediately after any file renaming or refactoring to ensure no legacy imports, missing components, or duplicate exports exist.

## Backend Preference & Supabase Security Standards

- **Always use Supabase**: For any backend features involving databases, authentication, or file storage, always use the configured Supabase client instead of creating mock stores or local state.
- **RLS Authorization Security**: Never check `user_metadata` in RLS policies or trigger functions. Always use `auth.uid()` or check protected claims via `(SELECT auth.jwt() -> 'app_metadata' ->> 'role')`.
- **Auth Query Performance (InitPlan)**: In RLS policies, always wrap auth evaluations as subqueries `(SELECT auth.uid())` and `(SELECT auth.jwt())` so Postgres calculates the user identity once per query instead of per row.
- **Function Search Path**: All Postgres trigger functions must declare `SET search_path = public, pg_temp` and `SECURITY DEFINER` to prevent search path manipulation.
- **Storage Policy Scoping**: Do not grant blanket public `SELECT` on `storage.objects` for user submission buckets. Provide `INSERT` for uploads and restrict `SELECT` (listing) to authenticated staff/advisers while relying on public CDN URLs for individual file access.

## EmbedPDF Viewer Pattern

When implementing or modifying the `@embedpdf/react-pdf-viewer` SDK (e.g., `<PDFViewer>`):

- **Explicit Sizing Required**: The viewer component does not have intrinsic dimensions. You MUST always apply explicit sizing (e.g., `className="w-full h-full"` and `style={{ width: '100%', height: '100%' }}`) directly to the `<PDFViewer>` component. Failure to do so will cause the canvas to collapse to 0px, resulting in a blank or black document area.

## Vercel Deployment & Redeploy Gotchas

When configuring Vercel deployment for this Vite + Express full-stack project:

1. **Explicit Output Directory**: Always ensure `"outputDirectory": "dist"` is explicitly set in `vercel.json` to prevent Vercel from searching for a `public/` directory if the user accidentally alters the framework preset.
2. **Serverless Backend Compatibility**: Express backends must export the `app` instance by default, and `app.listen()` must be wrapped in `if (!process.env.VERCEL)` to prevent port collisions in Vercel's serverless runtime. Place a proxy entrypoint at `api/server.ts` that re-exports the backend app.
3. **The "Redeploy" Trap**: If the user pushes a fix but Vercel still fails on the old commit, it is because clicking "Redeploy" in the Vercel dashboard re-runs the exact same commit hash. Do NOT assume the fix failed. Instead, instruct the user to force a fresh webhook trigger by pushing an empty commit: `git commit --allow-empty -m "force vercel update" && git push`.

## Git Push Authorization Protocol

- **NEVER** run `git push` autonomously.
- **NEVER** assume the user wants their code pushed to the remote repository, even if a task is fully complete and verified.
- You must stage and commit the code locally (if appropriate), but you must then **STOP** and inform the user that the code is ready to be pushed.
- You are strictly forbidden from executing a `git push` command until the user explicitly types the authorization code: `/push`.

## Unified Debug Protocol (`/debug`)

The `/debug` command is the master diagnostic and verification protocol that unifies **Architecture Scanning** (`/scan`), **Code & Quality Review** (`/review`), and **Systematic Root-Cause Debugging** (`/debug`) into a single command. It activates the **`systematic-debugging`** and **`alignment-auditor`** skills.

### 1. Scope Resolution

When `/debug` (or legacy `/scan`/`/review`) is invoked, resolve the target in the following order:

1. **User Prompt (Highest Priority)**: If the user specifies what to debug/review (e.g., `/debug UI`, `/debug authentication`, `/debug ScrollStack`), focus strictly on that target.
2. **Context References (`@`)**: If context references are provided (e.g., `/debug @Dashboard.tsx`), focus on those referenced items.
3. **Recent Changes**: If no target is specified, focus on the files, features, or components most recently modified or discussed.
4. **Conversation Context**: Infer the target from the ongoing conversation.

### 2. The 4-Phase Execution Pipeline

#### Phase 1: Architecture & Dataflow Scan

- Analyze what the target is, its dependencies, and how it fits into the overall system architecture.
- Trace data execution, state lifecycles (`loading -> fetch -> data OR EmptyState`), and potential risk areas.
- Identify the exact rendering channel (React Web Preview vs. DOCX/PDF export vs. Supabase API).

#### Phase 2: Code & Quality Review

- Review code against React 19 standards, TypeScript strict typing, and Supabase security standards.
- Inspect for CSS transition vs. JS transform conflicts (`transition-all` on RAF animated elements).
- Check scroll engine conflicts (CSS `scroll-behavior: smooth` vs. Lenis).
- Audit Supabase RLS policies for `(SELECT auth.uid())` InitPlan optimization and verify storage permissions.

#### Phase 3: Single Root-Cause Isolation & Fix

- Formulate a single, confirmed root-cause hypothesis without guesswork.
- Implement the minimal, clean, non-breaking fix.

#### Phase 4: Zero-Error Verification

- Execute `npm run lint` (`tsc --noEmit`) to verify 0 compiler/type errors.
- Confirm all related components, styles, and document generation pipelines remain untouched and fully operational.

## GitHub Repository & Branching Architecture

- **Main Repository:** The primary remote repository (origin) for the project must always be set to `https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting.git`.
- **Role & Domain-Based Branching:** The repository enforces dedicated, evergreen branches structured around the 4 core portal roles and primary system layers:
  - `feature/student`: Student Portal workflows, checklist, fillable templates, and Weekly Journal reflection.
  - `feature/adviser`: Adviser Portal workflows, student submission reviews, feedback, and remarks.
  - `feature/supervisor`: Supervisor Portal workflows, attendance review, and digital DTR signature approvals.
  - `feature/admin`: Admin Portal workflows, student management, template configuration, and API settings.
  - `feature/landing-page`: Public landing page, hero typography, 3D card carousel, and ScrollStack motion.
  - `backend/database`: Supabase database schemas, Postgres RLS policies, migrations, and Microsoft OneDrive sync.
  - `docs/capstone-panelist-guide`: Architecture guides, API key runbooks, and panelist defense preparation.
- **Evergreen Branch Naming Standard:**
  - Branch names must represent persistent system domains using `<type>/<description>` format.
  - **Never** name branches after temporary one-off bugs (e.g. avoid `-fixes`, `-cleanup`, `-refinements`, `-stats`).
  - Use evergreen names so any new push to that branch remains clean, relevant, and organized.
- **Main Branch Protection (Option B):**
  - Direct pushes to `main` are strictly forbidden.
  - Local `main` must remain clean and untouched.
  - All integrations into `main` must occur exclusively through GitHub Pull Requests (PRs) after review and verification.
- **Zero-Deletion Preservation:**
  - Historical branches (e.g. `phase-1-rendering-cleanup`, `supervisor-dtr-v2`, `rules` branches) are preserved for auditability and must never be deleted without explicit user authorization.

## Rendering State & Loading Lifecycles

When implementing UI that fetches data from the backend (Supabase), strictly adhere to the following rules to prevent UI stuttering, Layout Shifts, and data hallucinations:

1. **Single Source of Truth:** Each page must derive its displayed data from exactly one source: the backend database. Never mix arrays of hardcoded/mock data with live database records.
2. **Strict Loading Lifecycle:**
   - **Initial Load:** Component Mounts -> `loading = true` -> Fetch Database -> `loading = false` -> Render Database Data OR Empty State. (Never simulate loading with artificial `setTimeout` delays).
   - **User Actions:** For subsequent data refreshes (e.g., approve, reject), use localized loading indicators and update only the affected data rather than triggering a full-page loading skeleton.
3. **No Silent Fallbacks:** If a requested database record cannot be found, aggressively fail and render the project's standard `EmptyState` component. Do not silently substitute mock data or placeholders.
4. **Placeholder Constraints:** Do not render placeholder or hardcoded statistics if a backend data source exists for that metric. However, for dashboard metrics or UI components where no backend endpoint exists yet, it is acceptable to render placeholders to preserve the dashboard layout, provided they are clearly identifiable as static data.
5. **Shared EmptyState UI:** Always use the generic `src/components/ui/EmptyState.tsx` component when rendering zero-state scenarios (e.g., empty queues, no pending documents, 404s).

## Excel DTR Signature Fitting Protocol

When embedding supervisor or student canvas signatures into exported Excel spreadsheets (`.xlsx`) using ExcelJS:

1. **Dynamic Physical Cell Dimensions**: Calculate the exact physical pixel dimensions of the cell (e.g., Column G width 30 = 225px, Row height 45 = 60px -> ratio 3.75:1).
2. **Dark Ink Stroke Luminance Filtering**: When cropping signature canvas drawings, scan RGBA pixel arrays with a luminance filter (`alpha > 30 && (r < 200 || g < 200 || b < 200)`) to ignore solid white/light background pixels and lock tightly onto dark ink strokes.
3. **Adaptive Scale Condition**: Scale the ink stroke to fill 90% of the target canvas height (`targetH = Math.round(rowHeightPoints * 1.33 * 2)`), expanding narrow strokes/initials so they fill the cell box in full view.
4. **1:1 Cell Border Anchoring**: Span ExcelJS two-cell anchors from `col: 6.0` to `7.0` (exact column boundaries) and `(rowIndex - 1)` to `rowIndex`. Never use fractional offsets that cause Excel to shift the image frame to the left.
5. **Scope Scoping**: Restrict signature cropping to DTR Approval (`DTRApproval.tsx`) and spreadsheet generation (`excelGenerator.ts`); do not alter unrelated pages like Weekly Journal Review.

## Landing Page Asset Organization Protocol

- **Native Directory**: All landing page icons, logos, and vector assets must be stored in and directly referenced from `public/images/Landing Page Icons/`:
  - Brand Logo: `/images/Landing Page Icons/Logo.svg`
  - Post Document Icon: `/images/Landing Page Icons/Landing Page Post.svg`
  - Key Points Icon: `/images/Landing Page Icons/Landing Page key Points.svg`
  - Selfie Graphic: `/images/Landing Page Icons/Landing Page Selfie.svg`
- **File Discovery & Correct Placement**: Always inspect existing folder structures before moving or duplicating assets. Put all files into their designated directory and reference them by their exact native paths to prevent broken links or Vite `ENOENT` bundling errors.

## TypeScript & React 19 Standards

- **Core Type Declarations**: React 19 projects must always include `@types/react@^19.0.0` and `@types/react-dom@^19.0.0` in `devDependencies`. Missing declarations cause widespread `JSX.IntrinsicElements` and callback parameter inference failures across all TSX files.
- **Framer Motion Component Integration**: When wrapping `motion` components (`motion.button`, `motion.div`, `motion.span`), do not extend standard `React.ButtonHTMLAttributes` or `React.HTMLAttributes` directly as React 19's `onAnimationStart` signature conflicts with Framer Motion's `AnimationDefinition`. Always type props as `Omit<HTMLMotionProps<'element'>, 'ref' | 'children'>`.
- **Component Prop & Variant Extensibility**: Foundational UI primitives (`Button`, `Badge`, `Card`, `Input`, `Skeleton`) must preserve standard variant aliases (`default`, `secondary`, `primary`, `destructive`, `outline`) and common layout props (`icon`, `subtitle`) to maintain compatibility across all admin, student, adviser, and supervisor sub-pages.
- **Zero-Error Verification Gatekeeping**: Before concluding any code modification, always execute `npm run lint` (`tsc --noEmit`) to verify that all modules, JSX types, and interfaces compile cleanly with zero errors.

## Strict Markdown & Documentation Formatting Standards

Whenever creating, modifying, or refactoring any Markdown file (`.md`), strictly adhere to the following `markdownlint` standards to prevent formatting warnings:

1. **Headings (MD022 & MD026)**:
   - Always surround headings (`#`, `##`, `###`, `####`) with exactly **one blank line above** and **one blank line below**.
   - Never end headings with trailing punctuation like colons (`:`) or periods (`.`). Write `### Key Architecture Decisions` instead of `### Key Architecture Decisions:`.

2. **Lists (MD032)**:
   - Always surround bulleted (`-`, `*`) and numbered (`1.`, `2.`) lists with a blank line before the first item and after the last item.

3. **Code Fences & Blocks (MD031 & MD040)**:
   - Always surround fenced code blocks (```) with blank lines above and below.
   - Always specify a valid language tag (e.g. `tsx`, `ts`, `json`, `bash`, `mermaid`, `plaintext`). Never leave fenced code blocks bare without a language identifier.

4. **Tables (MD058 & MD060)**:
   - Always surround tables with a blank line before the header row and after the last row.
   - Include spaces inside table pipe delimiters (e.g. `| :--- | :--- |` and `| Col A | Col B |`).

5. **Spacing & Cleanliness (MD009 & MD012)**:
   - Never leave trailing whitespace at the end of any line.
   - Never use multiple consecutive blank lines (maximum 1 blank line between elements).

## User UI Taste & Design Invariants

When building or updating UI components, forms, modals, or dashboards, always adhere to the user's specific design aesthetic:

1. **Geometry & Curvature**:
   - **Interactive controls** (inputs, buttons, select triggers, day cells): Use `rounded-xl` and `h-9 px-3 text-sm`. Avoid tiny cramped buttons or rectangular pill shapes.
   - **Containers** (modals, dialogs, popovers, cards): Use `rounded-2xl shadow-2xl border border-border bg-popover`.

2. **Breathing Room & Edge Padding**:
   - Always provide generous container padding (`p-4` or `p-5`) for popovers, dropdowns, and cards. Elements must never touch or feel cramped against outer boundaries.

3. **Typography & Readability**:
   - Primary input text and labels: readable `text-sm font-semibold text-foreground/90` (never unreadable `text-[10px]` or `text-xs` for core inputs).
   - Placeholders: Use clear, natural text (`"Select date"`, `--:-- --`) in `text-muted-foreground`. Do not pre-fill forced default values unless specifically requested.
   - Headers: Clean, minimalist, and balanced with subtle hierarchy.

4. **Dropdowns & Selectors**:
   - Avoid heavy, bordered rectangular boxes around inline selectors.
   - Design dropdown triggers as clean text with a subtle chevron (`Sep ˅` `2026 ˅`) and a gentle hover background (`hover:bg-muted/50 rounded-md`).
   - Center navigation arrows (`<` and `>`) on the far ends with dropdowns centered in between.

5. **Soft Pill Selection States**:
   - **Current / Today**: Soft, subtle pill background (`bg-muted/80 text-foreground font-bold rounded-xl`).
   - **Selected Item**: Solid high-contrast primary pill (`bg-primary text-primary-foreground font-bold rounded-xl`).
   - **Outside / Inactive**: Soft muted gray (`text-muted-foreground/40`).

6. **Form Simplicity**:
   - Prioritize essential fields first. Omit redundant secondary inputs (like unnecessary categories) from quick-create modals to keep workflows fast and uncluttered.

## Microsoft OneDrive & Graph Integration Protocol

When integrating or troubleshooting Microsoft Graph API and OneDrive cloud storage in this repository:

1. **Credit-Card-Free Student Activation**: When setting up Azure subscriptions for academic projects, never direct students to the standard credit-card-gated Azure signup. Always instruct them to activate **Azure for Students** (`azure.microsoft.com/free/students`) using their official `.edu.ph` institutional email, which grants full Microsoft Entra ID access with $0 cost and zero payment info.
2. **Multi-Tenant Account Scope**: Always register Azure applications with `signInAudience`: `"AzureADandPersonalMicrosoftAccount"` (*"Accounts in any organizational directory and personal Microsoft accounts"*). This prevents AADSTS50020 tenant mismatch errors when testing across personal and school accounts.
3. **The SPO (SharePoint Online) Trap & Delegated Auth**: Pure Azure directories created by personal accounts lack SharePoint Online (SPO) licenses. As a result, client-credential application calls to `/drives` fail with `Tenant does not have a SPO license`. Always implement the OAuth2 Authorization Code flow with `offline_access Files.ReadWrite User.Read` targeting `/me/drive`, which works universally on both personal OneDrive and institutional OneDrive.
4. **Institutional Consent Lockdown**: School domains (`@marikina.sti.edu.ph`) strictly block student accounts from granting OAuth permissions to third-party apps (`Need admin approval`). For developer testing and demonstrations, advise using personal Microsoft accounts where the user has full self-consent authority.
5. **Web Platform Redirect URIs**: Always register callback endpoints (e.g. `http://localhost:3001/api/onedrive/auth/callback`) under the **Web** platform in the Azure Portal (never SPA or Mobile) to avoid `invalid_request: redirect_uri` errors.
6. **Token Leak Protection Invariant**: Token cache files (`backend/config/*token.json` and `*-token.json`) must remain permanently listed in `.gitignore`. Never commit or stage raw access or refresh tokens.
