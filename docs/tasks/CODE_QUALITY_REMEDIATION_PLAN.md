# Plan: Code Quality and Production Readiness Remediation

[← Back to Tasks Hub](README.md) | [Active Tasks](TASKS.md) | [Document Review Center](DOCUMENT_REVIEW_CENTER_PLAN.md)

**Status:** Prioritized from repository audit  
**Audit baseline:** Commit `0f178fd` on September 20, 2026  
**Validated baseline:** standard TypeScript checks passed; Auth 48/48; Editor 86/86

---

## 1. Audit Diagnosis

The repository compiles and has a comparatively strong authentication/editor persistence foundation. The primary risk is **repo fragility caused by disconnected workflow state**, followed by **verification confidence gaps** and **large-file maintenance hotspots**.

| Finding | Severity | Evidence | Confidence |
| :--- | :---: | :--- | :---: |
| Core workflow screens still use mock/component state | Critical | Weekly Journal, DTR, Company, MOA, Endorsement, Evaluation | High |
| Revision upload creates an unrelated submission | High | `StudentReviewSession.tsx` calls generic `uploadSubmission` without a parent/case | High |
| Supervisor signature is global browser `localStorage` data | High | Same `supervisor_saved_signature` key across DTR and Journal | High |
| Upload UI and storage contracts disagree | High | UI: `.doc`/15 MB; storage: PDF/DOCX/XLSX/10 MB | High |
| Runtime test count overstates behavioral coverage | Medium | Many source-string `includes()` assertions; little rendered/browser interaction | High |
| Strict TypeScript is disabled and `any` usage is concentrated in editor code | Medium | 329 `any` matches; strict check exposes real type/nullability errors and dead code | High |
| Several files are oversized and high-conflict | Medium | 3,506-line toolbar; 1,990-line Student Dashboard; 1,077-line editor | High |
| OneDrive refresh token is stored as plaintext JSON on disk | Medium | File is gitignored, but not encrypted or managed as a production secret | High |

---

## 2. Remediation Principles

- Fix data integrity and authorization before visual refactors.
- Replace mock state with one authoritative database source; never mix mock fallback with live queries.
- Make contracts consistent across UI, domain service, database, and storage.
- Introduce stricter checks incrementally; do not attempt a repository-wide rewrite in one commit.
- Refactor large files only behind behavior-preserving tests.
- Every AI workstream owns explicit files and acceptance gates.

---

## 3. P0 — Workflow and Data Integrity

### 3.1 Build the shared workflow foundation

Implement [Document Review Center Plan](DOCUMENT_REVIEW_CENTER_PLAN.md) first.

- [ ] Stable review case ID and immutable revisions.
- [ ] Transactional state transitions and append-only events.
- [ ] Assigned reviewer enforcement through RLS/RPCs.
- [ ] Persistent comments, attachments, and revision history.
- [ ] Remove mock state from Weekly Journal as the first three-role slice.

### 3.2 Repair revision semantics

- [ ] Replace generic revision uploads with `uploadRevision(caseId, expectedRevision, file)`.
- [ ] Preserve the old file and comments.
- [ ] Link every revision to the logical case and increment on the server.
- [ ] Reset the review route when content changes.
- [ ] Prevent simultaneous/stale revision creation.

### 3.3 Unify the upload contract

Create one shared configuration, for example `src/config/documentUploadPolicy.ts`, used by picker labels, input `accept`, client validation, service validation, and server/storage validation.

- [ ] Decide supported types per document family.
- [ ] Use one maximum size per type; remove 15 MB versus 10 MB disagreement.
- [ ] Validate extension, MIME type, magic bytes/signature, and actual parsed structure where practical.
- [ ] Remove orphan storage files when metadata creation fails.
- [ ] Add tests for unsupported `.doc`, spoofed MIME, oversize files, and retry cleanup.

**P0 exit:** A revision remains in one case, routes to the right reviewer, survives refresh, and cannot be accessed by an unassigned role.

---

## 4. P0 — Signature and Credential Safety

### 4.1 Replace the global Supervisor signature cache

Current risk: a shared browser key can expose or reuse one Supervisor's signature under another account.

- [ ] Immediately namespace any temporary cache by authenticated user ID and clear it on logout.
- [ ] Do not treat browser `localStorage` as the authoritative signature record.
- [ ] Store the signature as a private, user-owned object or require a fresh signature/explicit confirmation for each approval policy.
- [ ] Bind every applied signature to actor ID, reviewed revision, server timestamp, and review event.
- [ ] Require an authenticated assigned Supervisor at application time; never accept caller-supplied attribution.
- [ ] Add cross-account browser tests proving Supervisor B cannot see or apply Supervisor A's signature.

### 4.2 Harden OneDrive token storage

- [ ] Replace plaintext refresh-token JSON with an encrypted database secret, managed secret store, or platform-supported credential store.
- [ ] Separate development token handling from production behavior.
- [ ] Add token rotation/revocation and connection-owner audit metadata.
- [ ] Ensure logs and errors never include access tokens, refresh tokens, authorization codes, or Microsoft response bodies containing secrets.

**Security exit:** No identity-bearing signature or renewable cloud credential depends on a global plaintext browser/disk file.

---

## 5. P1 — Verification That Tests Behavior

### 5.1 Establish a real release gate

Split scripts by responsibility:

- `typecheck`: client and server TypeScript;
- `lint`: ESLint/static rules, not a TypeScript/test alias;
- `test:auth`;
- `test:editor`;
- `test:workflow`;
- `test:ui` for component/browser interaction;
- `check`: typecheck + lint + all tests + production build.

### 5.2 Replace fragile source-string assertions

Keep a small number of architecture guard tests where text inspection is genuinely useful, but migrate functional claims to rendered/runtime tests:

- [ ] Open dropdowns and click their actions.
- [ ] Type, select, format, undo/redo, and verify Plate state.
- [ ] Upload header/body/footer images and verify bounds.
- [ ] Export DOCX and inspect document XML/relationships.
- [ ] Exercise PDF print layout in a browser.
- [ ] Submit, comment, request revision, resubmit, and approve across role sessions.
- [ ] Test responsive Review Center behavior in Chrome and Edge.

### 5.3 Add missing negative tests

- [ ] Student comment authorization and ownership.
- [ ] Unassigned reviewer access.
- [ ] Stale-stage/double-approval rejection.
- [ ] Same-name student isolation by UUID rather than display name.
- [ ] Upload type/size mismatch and orphan cleanup.
- [ ] Cross-account signature isolation.
- [ ] Revision chain and immutable historical files.

**P1 exit:** Passing tests demonstrate user-visible behavior and authorization, not merely that source text contains a label or class name.

---

## 6. P1 — Type Safety and Dead-Code Control

### Incremental strictness strategy

Do not enable every strict option repository-wide in one step. Create a strict configuration for new workflow modules first, then expand by directory.

1. Enable `strict`, `noImplicitAny`, and `strictNullChecks` for new `documentReview` types/service/components.
2. Enable `noUnusedLocals` and `noUnusedParameters` after removing dead imports/state in the touched feature.
3. Replace boundary `any` values with `unknown`, validation schemas, and explicit Plate/Supabase adapter types.
4. Add generated or maintained database row/RPC types.
5. Expand strict coverage to auth, storage services, pages, then the editor toolbar.

Immediate real type issues found by the audit should be fixed early:

- [ ] `AuthContext` refresh path may return `undefined` despite a non-undefined contract.
- [ ] Topbar accesses a possibly null user.
- [ ] Document Verification compares statuses outside the declared union.
- [ ] Templates may pass `undefined` to state expecting an array.
- [ ] Backend/document generator contain implicit-any parameters.

Track and reduce the `any` baseline from 329; new workflow code must add zero unapproved `any` usages.

**Type-safety exit:** New Review Center modules compile under strict mode, and the repository has an explicit ratchet preventing the baseline from increasing.

---

## 7. P2 — Hotspot Refactoring

Refactor only after behavioral coverage exists.

### `fixed-toolbar-buttons.tsx` — 3,506 lines

Split by capability:

- formatting controls;
- paragraph/list controls;
- insert/media controls;
- table controls;
- review/tools controls;
- shared popover primitives and toolbar state hooks.

Target: no capability module over roughly 400–500 lines; preserve one composition entry point.

### `StudentDashboard.tsx` — 1,990 lines

Extract:

- data/query hook;
- requirements derivation;
- todo persistence/service;
- calendar model;
- phase panels and cards;
- loading/error/empty presentation.

Remove demo fallback records once database queries are authoritative.

### Editor/header/footer modules

- Extract shared image selection, crop, resize, alignment, and serialization state.
- Share header/footer primitives instead of maintaining near-duplicate 1,000-line components.
- Keep DOCX/PDF conversion in pure testable adapters, separate from React event handling.

### Supervisor pages

- Move DTR and Journal business rules into domain services.
- Pages should render records and invoke typed commands, not own mock arrays or workflow mutation logic.

**P2 exit:** High-conflict files have clear capability boundaries and no workflow business rules embedded in JSX components.

---

## 8. P2 — Error Handling and Observability

- [ ] Replace `alert()` calls with accessible application feedback.
- [ ] Standardize user-safe errors separately from diagnostic logs.
- [ ] Introduce correlation IDs for submission/review/upload failures.
- [ ] Record security-sensitive administrative and review events without logging secrets or document contents.
- [ ] Add Error Boundary reporting and route-level recovery actions.
- [ ] Make offline/degraded mode explicit; never silently replace failed live data with demo data.

---

## 9. Recommended Delivery Order

```text
1. Upload contract + signature isolation emergency fix
2. Review case/revision schema and RLS
3. Shared review service
4. Central Review Center vertical slice
5. Behavioral workflow tests and release gate
6. Incremental strict TypeScript
7. Hotspot refactors
8. Remaining mock-backed workflows
```

Do not start broad toolbar/dashboard refactors while the workflow schema and Review Center are being merged; this would create unnecessary conflicts without improving the adviser's primary requirement.

---

## 10. AI Workstream Controls

- Freeze database stages and TypeScript contracts before parallel work.
- Assign exclusive file ownership and one integration owner.
- Require every workstream to state its allowed files, non-goals, and acceptance command.
- No AI may add mock fallback data to make an incomplete integration appear functional.
- No AI may weaken RLS, direct-update grants, MFA/session checks, upload validation, or tests to obtain a passing build.
- Merge small commits in dependency order and run the complete gate after integration.

Suggested parallel tracks after the contract freeze:

- Security: signature and OneDrive credential handling.
- Database: cases/revisions/comments/events/RLS.
- Domain: service/types/upload policy.
- UI: Review Center shell and role adapters.
- Verification: workflow/RLS/component/browser coverage.
- Refactoring: starts only after the vertical slice is stable.

---

## 11. Completion Metrics

- Zero production review screens backed by mock arrays.
- Zero unrelated rows created for a revision.
- Zero global browser signature keys.
- One upload policy shared across all layers.
- 100% of workflow mutations pass through tested RPC/service commands.
- Strict mode enabled for all new workflow code.
- New code adds no unapproved `any`.
- Release `check` runs type, lint, auth, editor, workflow, UI, and build gates.
- All critical role transitions have positive and negative authorization tests.
- Review state, comments, files, and history survive logout/login and another device.

