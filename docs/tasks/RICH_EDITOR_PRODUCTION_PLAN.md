# Rich editor production readiness and document fidelity plan

Date: 2026-09-18. Status: proposed implementation plan; no application changes made.

UI companion: [Google Docs reference layout plan](GOOGLE_DOCS_EDITOR_UI_PLAN.md) specifies the user's screenshot-based layout, omits Extensions and Help, and assigns fullscreen to the arrow beside Editing. Its current-code notes supersede older persistence/submission observations below where those have since changed.

## Target and accuracy contract

The user confirmed that **official school DOCX/PDF templates are the first release priority**. Students must be able to complete those templates without losing official wording, logos, tables, signatures, formatting, or page layout. The adviser must receive exactly the document the student reviewed.

“100% accurate” means every approved template passes the agreed content and layout checks for supported inputs and a defined rendering environment. It cannot mean identical editable layout across every Word version, browser, font installation, and arbitrary imported PDF. Release claims must name the tested templates and environments.

For the first release:

- Require exact preservation of official text, entered field values, required elements, and document revision.
- Require approved page size, page count, line wrapping, table geometry, headers/footers, and signature positions for each reference fixture.
- Make final preview display the actual PDF artifact that will be downloaded/submitted. Any further edit invalidates that preview and requires regeneration.
- Keep the rich editing canvas useful and close to the output; final rendered preview is the authority for pagination.
- Treat unsupported features, missing fonts/assets, and overflowing fields as explicit errors or reviewed compatibility limitations, never silent success.
- Preserve PDF-only forms as PDFs. Offer an editable DOCX equivalent only after a separately authored school-approved version passes the same checks.

## Current evidence

This review used the current working tree, which already contains uncommitted editor changes. Existing changes were not modified. Source findings below are not a completed visual/browser audit.

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Official forms are represented by hand-authored Plate seed content | `src/config/editorTemplates.ts` | The seeds are not proof that the original template layout or wording is preserved. |
| Header/footer settings are outside the saved draft model; the page does not wire their change callback | `src/lib/documentHistoryStorage.ts`, `StudentDocumentEditor.tsx`, `plate-editor.tsx` | Reload/history can lose document settings even when body text is saved. |
| Download passes header/footer options, but submission does not | `StudentDocumentEditor.tsx`, `handleExportDocx` and `handleSubmit` | Downloaded and submitted DOCX can differ. |
| Toolbar export supplies its own title and omits document options | `src/components/plate-ui/export-toolbar-button.tsx` | Multiple export entry points can produce different artifacts; errors are swallowed. |
| PDF export calls `window.print()` | `docxSerializer.ts`, `printToPdf` | Output depends on browser/print settings and is not a stored, reproducible PDF generation pipeline. |
| DOCX uses one Letter section with fixed margins; scope is not applied to headers/footers | `docxSerializer.ts`, `serializeToDocx` | Per-template geometry and different-first-page behavior are not fully represented. |
| Font size parsing treats `px` and `pt` strings alike | `docxSerializer.ts`, `leafToRuns` | For example, 16px is exported as 16pt instead of 12pt. |
| Tables lose explicit widths, merges, and much cell formatting; lists serialize only level zero | `docxSerializer.ts`, table/list conversion | Complex forms and nested numbering cannot be assumed faithful. |
| Images only serialize from supported base64 URLs; crop and wrapping are not serialized | `docxSerializer.ts`, image conversion | URL images can disappear; displayed crop/position can differ in Word. |
| Inline links flatten to text, and unsupported blocks use a general paragraph fallback | `docxSerializer.ts`, `collectRuns` and `nodesToDocxChildren` | Visible editor features are not equivalent to supported document features. |
| Footer preview includes literal “Page 1 of 1”; print CSS defines page margins and content padding | `plate-editor.tsx`, `src/styles/print-document.css` | Page numbers are not calculated from output; physical print dimensions need browser verification. |
| Submission uploads before draft locking | `StudentDocumentEditor.tsx`, `handleSubmit` | Failures/retries need explicit handling to prevent duplicate or unmatched artifacts. |
| Multiple document-generation paths coexist | `src/lib/documentGenerator.ts`, `src/components/compose/DocumentWorkflow.tsx`, rich editor serializer | Template filling, preview, and submission need a shared document contract. |

Baseline: `npm.cmd run test:editor` passed **57/57** tests. Existing export checks include blob-size assertions and successful serialization; they do not establish document appearance. Database checks use the local test harness, not production Supabase. Only h5-named template assets were found in `public/templates`; verify the complete approved collection in template storage before certification. See also [the earlier component audit](../PLATE_EDITOR_COMPONENT_AUDIT.md), rechecking its historical findings against current code.

TypeScript baseline: `npm.cmd run lint` also passed for the frontend and backend. No production build, authenticated browser QA, or reference-file visual comparison was performed during this planning task.

## Architecture to implement

Preserve official source templates and use one versioned document envelope to drive editing, generation, history, and submission:

```text
Approved template version + validated field values + permitted rich content
                              |
                    Immutable draft revision
                              |
           +------------------+------------------+
           |                                     |
  Original DOCX + field bindings         Original PDF + field bindings
           |                                     |
      Generated DOCX                    Filled PDF / bounded overlays
           |
   Qualified DOCX-to-PDF converter
           +------------------+------------------+
                              |
                   Validated artifact record
                              |
              Final preview / download / submission
```

Use Plate for approved editable text regions and freeform documents. For constrained forms, add template fields and locked official regions rather than reconstructing the whole form from paragraphs. Variable-length journals/reports need explicit overflow and continuation-page rules. Each template declares its permitted editing mode and export formats.

Create a versioned `DocumentEnvelope` containing schema version, template ID/version/source hash, locale, typed fields, rich content, sections/page geometry, styles, header/footer settings, and durable asset references. Keep draft revision and ownership in the persistence layer. Store complete envelopes in offline cache, cloud drafts, and immutable history. Migrate existing `content: object[]` drafts without destroying their original content; mark legacy drafts as unverified until reconciled to an approved template.

Artifact identity should include draft revision, canonical input hash, template version/hash, renderer identity/version where available, font manifest, and output checksums. Preserve the actual generated bytes; do not regenerate downloads from mutable current state. A PDF-source template needs no DOCX artifact unless an equivalent has been explicitly approved.

### Conversion decision

Run a short comparison on the official corpus before selecting infrastructure:

| Candidate | Why evaluate | Required decision evidence |
| --- | --- | --- |
| Isolated LibreOffice conversion worker with pinned version and fonts | Controllable deployment and rendering environment | Layout parity, font availability/licensing, resource costs, timeouts, and hosting outside request-limited serverless functions |
| Microsoft Graph DOCX-to-PDF conversion | Fits the repository's existing OneDrive integration | Tenant permission fit, storage/retention, throttling, latency, and corpus fidelity; upstream renderer version cannot be assumed controllable |

LibreOffice documents headless/file conversion parameters; Graph explicitly supports DOCX-to-PDF. Neither source promises this application's required fidelity. Choose based on measured results and operational fit. Do not silently fall back to a different renderer if the qualified one fails. [LibreOffice parameters](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html), [Microsoft Graph conversion](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content-format?view=graph-rest-1.0).

Keep `docx-preview` for convenience previews if useful. Its author documents HTML-rendering limitations, so use the generated PDF as the final layout reference. [docx-preview documentation](https://github.com/VolodymyrBaydalka/docxjs).

## Ordered implementation phases

Effort estimates are provisional engineering days for one developer with QA and a school template reviewer available. They exclude delays obtaining templates/fonts or provisioning conversion infrastructure. Re-estimate after Phase 0; approximately 5–8 engineering weeks overall.

### Phase 0 — Establish references and choose rendering (2–4 days)

- Inventory all 13 registered workflow entries: 12 editor-enabled templates and the DTR redirect. Preserve DTR's existing spreadsheet workflow.
- Reconcile editor IDs with admin template storage IDs, form codes, current school-approved files, and template revisions. Do not assume filenames or seed text are authoritative.
- For each template, record source format/hash, supported output formats, page dimensions, fonts, fixed wording, fields, validation, editable areas, and signature rules.
- Obtain approved reference DOCX and PDF outputs for blank, typical, and maximum-length valid data; include multi-page cases for journals, MOA, training plans, and reports.
- Benchmark converter candidates with the same fonts and fixture inputs. Record the Word version/environment used to approve DOCX appearance.
- Create a capability matrix: edit, persist, reopen, export DOCX, export PDF, and unsupported-feature behavior for every enabled feature.

**Exit:** every launch template has an approved reference or is explicitly withheld from release; conversion choice and supported environments are documented.

### Phase 1 — Preserve full state and unify artifact generation (4–6 days)

- Introduce the typed envelope and backwards-compatible migrations for drafts, versions, IndexedDB, RPC validation, and restore/duplicate/conflict paths.
- Persist header/footer-only edits, layout settings, field values, and asset references with the same revision as body content. Replace unchecked boundary casts with runtime schema validation.
- Route page controls, editor toolbar, repository download, and submit through one generation service. Include actual title, template version, document options, and explicit errors.
- Capture and acknowledge a complete immutable snapshot before generation. Freeze submission editing or reject if the current revision differs; never combine saved body text with unsaved settings.
- Persist export jobs and results with progress, retry, cancellation, checksum validation, and idempotency keys. A template/render failure must not return a generic replacement document.

**Exit:** save/reload, offline recovery, history restore, and all export entry points preserve the same complete snapshot and artifact identity.

### Phase 2 — Implement official-template fidelity (6–10 days)

- For DOCX forms, bind stable named fields/content controls in approved copies while preserving styles, numbering, headers/footers, relationships, sections, and untouched source parts. Retire positional blank replacement for certified templates.
- For PDF forms, fill existing form fields where available or use versioned, validated placement coordinates over original pages. Define font size, multiline behavior, checkbox/date/signature placement, and overflow rejection. Preserve source page boxes/rotation.
- Add locked official text and typed required fields: student/company data, dates, consent choices, tables, and signature areas. Validate bindings rather than guessing missing data.
- Normalize physical units: 1in = 72pt = 96 CSS px = 1440 twips. Store canonical values and convert at rendering boundaries. Provision approved fonts and fail visibly on unavailable required fonts.
- For editable rich regions/freeform export, implement paragraph styles, spacing before/after, exact/multiple line spacing, first-line/hanging indents, tabs, nested numbering/restarts, links, hard breaks, page breaks, and required section breaks.
- Implement template-required table column widths, merges, borders, padding, alignment, repeated header rows, and row-splitting rules.
- Preserve image aspect ratio, approved crop/position/wrap, and signature geometry. Resolve durable assets before generation; a missing asset must fail validation.
- Implement per-section headers/footers, first-page scope, and real page-number fields. Restrict free positioning if it cannot be preserved by the qualified pipeline.

**Exit:** all supported features pass structural checks and all launch templates match their approved output fixtures; unsupported controls are unavailable in those templates.

### Phase 3 — Final PDF preview and usable document editing (4–6 days)

- Produce downloadable PDFs through the qualified conversion/filling path. Keep browser printing as a separately labeled convenience action.
- Display the actual stored PDF in the existing viewer. Show generation status and the revision being previewed; mark it stale immediately on edits.
- Add template-aware page setup, visible boundaries, overflow warnings, and appropriate page/section-break controls. Derive final page count from the PDF.
- Complete keyboard editing, selection-safe formatting, undo/redo, table navigation, find/replace, and sanitized Word paste within allowed regions. Test IME input and long content.
- Add actionable validation navigation and clear save states distinguishing locally saved, syncing, cloud saved, conflict, and failed.
- Ensure toolbar labels/focus, keyboard-only workflows, screen-reader field errors, readable zoom, and small-screen editing/preview behavior.
- Persist and anchor comments with role permissions if comments ship. Keep suggestion mode unavailable until tracked changes, accept/reject, history, and export behavior are implemented. Multimedia blocks are excluded from formal-template mode unless a documented printable representation exists.

**Exit:** a student can complete, recover, validate, preview, and export each template without hidden formatting loss or misleading controls.

### Phase 4 — Reliable submission, security, and operations (4–6 days)

- Create an idempotent submission operation linking the acknowledged draft revision, validated artifact IDs, document record, and lock transition. Verify ownership and expected revision on the server.
- Since object storage and database writes are not one transaction, use staged uploads plus transactional database finalization, retry reconciliation, and expiry/cleanup of abandoned artifacts.
- Store DOCX and PDF siblings for DOCX-based submissions; make adviser preview use the same PDF the student approved. Preserve original-only PDF submissions where applicable.
- Test expired sessions, lost responses, concurrent tabs, save conflicts, interrupted uploads/conversion, duplicate submit clicks, and retries after a successful operation whose response was lost.
- Enforce file magic/MIME, size/decompression/page limits, image validation, safe links/paste, storage access controls, and restricted asset fetching. Isolate converters with resource/time limits and no unnecessary network access.
- Add structured operational metrics for saves, conversion duration/failures, queue depth, submission retries, and fidelity regressions. Avoid logging student document content.
- Provide backup/restore and renderer/template rollback runbooks. Preserve existing draft access during rollout and migration rollback.

**Exit:** retry/fault tests produce one correct submission, locked records resist unauthorized writes, and operational recovery is demonstrated.

### Phase 5 — Certification and staged release (3–5 days, after gates pass)

- Add automated structural DOCX tests that inspect XML for fields, styles, numbering, sections, tables, assets, and relationships; replace appearance claims based only on non-empty blobs.
- Render fixtures to PDFs and compare text, geometry, page count, and visual diffs against approved references. Preserve diff artifacts in CI for review.
- Exercise authenticated end-to-end flows: create, edit, reload, offline/reconnect, conflict resolution, restore, preview, export, submit, and adviser review.
- Verify current supported Chrome/Edge and explicitly selected mobile environments; check DOCX in the agreed Microsoft Word environment and any promised secondary reader.
- Release behind template-specific feature flags: internal accounts, small student pilot, then all certified templates. Roll back on content loss, mismatched preview/submission, or failed template certification.

**Exit:** all release gates below pass and school reviewers approve the rendered templates. Timeline completion alone is not a release criterion.

## Measurable release gates

These are proposed acceptance thresholds to finalize against the approved corpus in Phase 0, not claims of current performance.

| Area | Required evidence |
| --- | --- |
| Content correctness | 100% exact approved text/field values, ordering, dates, choices, assets, and required sections across fixtures; only explicitly defined whitespace normalization permitted. |
| Template coverage | Every enabled launch template has blank, typical, boundary-length, and invalid/overflow cases. Invalid cases block finalization with a useful error. |
| Layout fidelity | Exact page count, page size, approved line/page breaks; no clipping/overlap or missing elements. Target position/size error <= 1pt for critical fields, logos, tables, and signatures. |
| Visual regression | Fixed renderer/fonts/resolution; initial target <= 0.5% changed pixels per page after a documented antialiasing tolerance. Any missing content or critical geometry failure fails regardless of pixel score. No blanket masks over dynamic fields. |
| Artifact consistency | Final preview, download, and submission reference identical stored PDF bytes/checksum; DOCX and PDF derive from the same immutable revision/template/input hash. |
| Persistence | Body, fields, settings, and assets survive reload, crash recovery, account switching, restore, and conflict resolution; zero lost acknowledged saves in fault tests. |
| Submission | Exactly one finalized submission per idempotency key; no unlocked success state; staged leftovers are reconciled or removed. |
| Compatibility | DOCX opens without repair in the approved Word environment; generated PDFs have correct searchable text where authored as text, working links where applicable, and no unexpected font substitution. |
| Accessibility | Keyboard completion of all required editing/export flows; automated checks plus manual focus/screen-reader checks show no blocking issues. Define PDF tagging requirements before promising accessible PDFs. |
| Performance | Provisional workload: 20-page journal, 10 embedded images, 100-row table. Target p95 input latency < 100ms, cloud-save acknowledgment < 3s after debounce on the test network, artifact job completion < 30s at agreed pilot concurrency. Benchmark and set resource limits before release. |
| Build and security | Type checks, production build, existing suites, new fidelity/E2E tests, role/ownership checks, migration rehearsal, and converter fault tests all pass. |

## File-level work map

| Workstream | Existing entry points | Planned additions |
| --- | --- | --- |
| Model and templates | `src/config/editorTemplates.ts`, `src/types/structuredDocument.ts` | Document envelope/schema, approved template manifest, bindings and migrations; reconcile overlapping models explicitly |
| Persistence | `src/lib/documentHistoryStorage.ts`, `supabase/migrations/05_editor_drafts.sql` | New forward migration and updated RPCs; complete snapshot/history serialization |
| Editing | `src/components/editor/plate-editor.tsx`, `editor-kit.tsx`, `src/components/plate-ui/*` | Focused layout/field/asset modules, capability restrictions, complete controlled state |
| Generation | `src/components/editor/serializers/docxSerializer.ts`, `src/lib/documentGenerator.ts` | Shared artifact service, template adapters, conversion worker and job endpoints |
| Submission/review | `StudentDocumentEditor.tsx`, `submissionStorage.ts`, existing review pages | Idempotent finalization, artifact links, immutable PDF preview |
| Quality | `scripts/editor-*.test.ts`, `src/styles/print-document.css` | Approved fixture corpus, DOCX structural assertions, PDF diff harness, authenticated browser tests |

Implementation begins with reference collection and the converter comparison, followed by full-state persistence and unified generation. Additional toolbar features are accepted only when their persistence and export behavior are defined and tested. Arbitrary DOCX import, PDF-to-rich-text reconstruction, full Word feature parity, multiplayer editing, and AI rewriting are later projects unless a certified school template requires them.
