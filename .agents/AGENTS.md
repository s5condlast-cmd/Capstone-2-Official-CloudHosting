# Project Rules

## Alignment and Formatting Clarification
- **Identify Render Channels**: When the user reports layout or styling discrepancies in documents, clarify immediately whether the issue is visible on the **web application's React preview** or within the **downloaded/exported DOCX or PDF files**.
- **Interactive Alignment**: Suggest the `/grill-me` slash command if there is layout ambiguity or if multiple attempts to resolve a visual bug have failed. This helps align on design specs through an interactive interview.
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


## Student Document Workflows
 
When adding new document requirement workflows to the student portal (e.g., MOA, Consent Forms, Application Letters): 
- **Never duplicate the layout UI:** Always use the generic `StudentDocumentPage` layout component located at `src/components/compose/StudentDocumentPage.tsx`. 
- Pass all required configuration to the component, including the `templates` array, `status`, `submissionInfo`, and `adviserFeedback`. 
- If a document requires dynamic instructions before uploading (e.g., explaining fees), use the `instructionsModal` property on the template object rather than building a custom modal. 

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

## Student Page Naming Conventions

When creating or referencing React components and filenames for student document pages, ALWAYS use their explicit, descriptive names matching their template (e.g., use `ProposalLetterToTheIndustry.tsx` instead of `Proposal.tsx`). Avoid generic mockups like `DocumentSubmission.tsx` or `Requirements.tsx`; instead, use the `DocumentWorkflow` architecture for each specific document page.

## Template Fallback and Download Patterns

When building document preview workflows (e.g. `DocumentWorkflow.tsx`), handle "Print / Save PDF" logic dynamically to avoid broken HTML-rendered prints:
1. **Native PDF Documents:** If a template is natively a PDF (e.g. `useDocxPreview === false`), clicking "Download PDF" MUST trigger a direct file download of the raw PDF buffer using `window.URL.createObjectURL(new Blob([docBuffer]))`. Never call `window.print()` for native PDFs as the browser dialogue will distort the canvas rendering.
2. **DOCX Documents with PDF Backups:** If a template is natively a DOCX, check Supabase Storage for a `${templateId}_pdf_backup` file. If the admin has uploaded this backup, download it directly for the student as a fallback. Only call `window.print()` if no PDF backup exists.
3. **Admin Uploads:** In the Admin Templates page, provide an option to upload a "PDF Backup" exclusively for `.docx` templates.

## Utility and Styling Conventions

- **Dynamic Class Helper (`cn`)**: When writing or updating React components that dynamically apply styles using the class helper, always verify that `import { cn } from '@/src/lib/utils';` is included at the top of the file to prevent compiler lookup errors (`Cannot find name 'cn'`).

## Refactoring and File Renaming Cleanups

When performing refactoring or file renaming operations (such as renaming legacy page files to descriptive names):
- **Delete Legacy Files**: Ensure old files are completely deleted from the disk and their corresponding exports are removed.
- **Git State Care**: If a file is marked as deleted or renamed in `git status`, do not run `git checkout` on the legacy file path as it will restore outdated versions and cause build conflicts.
- **Verification**: Run `npm run lint` (`tsc --noEmit`) immediately after any file renaming or refactoring to ensure no legacy imports, missing components, or duplicate exports exist.
## Backend Preference
- **Always use Supabase**: For any backend features involving databases, authentication, or file storage, always use the configured Supabase client instead of creating mock stores or local state.

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
