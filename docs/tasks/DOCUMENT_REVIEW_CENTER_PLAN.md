# Plan: Centralized Document Review Center

[← Back to Tasks Hub](README.md) | [Active Tasks](TASKS.md) | [Code Quality Remediation](CODE_QUALITY_REMEDIATION_PLAN.md)

**Status:** Ready for implementation  
**Target:** Student, Company Supervisor, Coordinator/Adviser, and Admin portals  
**Primary outcome:** One persistent workspace containing every document review case, all sent and received files, all revisions, comments, decisions, and activity history.

---

## 1. Product Goal

Replace disconnected document tables and role-specific mock review pages with one shared Review Center. Each role sees the same authoritative review case through role-appropriate permissions and actions.

```text
┌────────────────────┬──────────────────────────────┬────────────────────────┐
│ Review Inbox       │ Active File / Revision       │ Conversation & History │
│                    │                              │                        │
│ Needs Action       │ PDF / DOCX / image preview   │ Comments               │
│ Waiting            │ Version selector             │ Sent/received files    │
│ Revision Required  │ Download / compare           │ Decisions and events   │
│ Approved           │ Metadata                     │ Reply / resolve        │
└────────────────────┴──────────────────────────────┴────────────────────────┘
```

The Review Center is a document inbox and conversation workspace, not another standalone editor. The rich editor remains responsible for authoring; the Review Center is responsible for submission, review, file exchange, revision, approval, and audit history.

---

## 2. Architectural Decisions

### ADR-1: One shared Review Center with role adapters

**Chosen:** A shared `DocumentReviewCenter` and shared domain service rendered through role-prefixed routes.

| Option | Benefit | Cost | Decision |
| :--- | :--- | :--- | :---: |
| Separate Student/Supervisor/Adviser/Admin pages | Fast initial mockups | Duplicated logic, inconsistent statuses, repeated bugs | Rejected |
| One shared component with permission-driven actions | One behavior model and lower maintenance | Requires a clear role/action contract | **Chosen** |

Routes:

- `/student/reviews` and `/student/reviews/:caseId`
- `/supervisor/reviews` and `/supervisor/reviews/:caseId`
- `/adviser/reviews` and `/adviser/reviews/:caseId`
- `/admin/reviews` and `/admin/reviews/:caseId`

### ADR-2: One logical case with immutable revisions

**Chosen:** A stable `review_case_id` represents the document conversation. Every resubmission creates a new immutable revision under that case.

```text
Review Case: Weekly Journal — Week 1
├── Revision 1 — returned by Supervisor
├── Revision 2 — approved by Supervisor
└── Revision 3 — approved by Adviser
```

This replaces the current behavior where a revision upload creates an unrelated `student_documents` row.

### ADR-3: Transactional workflow with an append-only audit log

**Chosen:** Supabase PostgreSQL RPCs enforce transitions and append review events in the same transaction. Do not introduce microservices, CQRS, or full event sourcing.

Trade-off: this keeps the current modular-monolith architecture and Supabase stack, while still preserving a defensible audit trail.

### ADR-4: Private files with short-lived signed access

All files remain in private storage. The server/database authorizes the caller before returning a signed URL. Browser-supplied owner IDs, reviewer IDs, roles, statuses, and external URLs are never trusted.

---

## 3. Review Case Data Model

Use the next available migration number at implementation time; coordinate it with the already proposed bulk-import migration.

### `document_review_cases`

- `id UUID PRIMARY KEY`
- `student_id UUID NOT NULL REFERENCES profiles(id)`
- `document_type TEXT NOT NULL`
- `template_id TEXT`
- `title TEXT NOT NULL`
- `review_route TEXT CHECK (review_route IN ('adviser_only','supervisor_then_adviser'))`
- `stage TEXT NOT NULL`
- `assigned_supervisor_id UUID REFERENCES profiles(id)`
- `assigned_adviser_id UUID REFERENCES profiles(id)`
- `current_revision_id UUID`
- `priority TEXT`
- `created_at`, `updated_at`, `closed_at`

### `document_revisions`

- `id UUID PRIMARY KEY`
- `case_id UUID NOT NULL REFERENCES document_review_cases(id)`
- `revision_number INTEGER NOT NULL`
- `source_kind TEXT CHECK (source_kind IN ('editor','upload','issued_document','signed_return'))`
- `source_draft_id UUID REFERENCES editor_drafts(id)`
- `legacy_student_document_id UUID REFERENCES student_documents(id)` for migration compatibility
- `file_path TEXT NOT NULL`
- `original_filename`, `mime_type`, `byte_size`, `checksum`
- `submitted_by UUID REFERENCES profiles(id)`
- `created_at`
- unique `(case_id, revision_number)`

### `document_comments`

- `id UUID PRIMARY KEY`
- `case_id UUID NOT NULL`
- `revision_id UUID` so comments remain attached to the reviewed version
- `author_id UUID NOT NULL`
- `message TEXT NOT NULL`
- `anchor JSONB` for selected text, page, section, or general feedback
- `parent_comment_id UUID` for replies
- `resolved_at`, `resolved_by`, `created_at`, `edited_at`

### `document_case_files`

Stores additional sent/received attachments that are not the primary revision:

- `case_id`, optional `comment_id`, `uploaded_by`
- `purpose`: `supporting_file`, `review_attachment`, `issued_copy`, or `signed_copy`
- private storage path, original name, MIME type, size, checksum, and timestamp

The UI calculates **Sent** or **Received** relative to the logged-in user from `uploaded_by`; direction is not hardcoded into the record.

### `document_review_events`

Append-only events:

- submission/resubmission;
- file attachment;
- comment/reply/resolve/reopen;
- Supervisor approval or revision request;
- Adviser approval or revision request;
- document issuance, signed-copy return, archive, or administrative audit.

Each event records case, revision, actor, actor role, action, previous stage, next stage, remarks, and server timestamp.

---

## 4. Workflow Contract

### Adviser-only documents

Used for Resume, Cover Letter, Application Letter, company details, MOA/Endorsement signed returns, and other school-reviewed requirements.

```text
submitted_to_adviser
  ├── adviser_revision_required ──► student resubmits ──► submitted_to_adviser
  └── approved
```

### Supervisor-then-Adviser documents

Used for Weekly Journal and DTR-derived documents.

```text
submitted_to_supervisor
  ├── supervisor_revision_required ──► student resubmits ──► submitted_to_supervisor
  └── supervisor_approved ──► submitted_to_adviser
                                ├── adviser_revision_required
                                │      └── student resubmits ──► submitted_to_supervisor
                                └── approved
```

Rules:

- A content revision invalidates earlier content approval and returns through the complete route.
- Revision requests require actionable remarks.
- Approval acts only on the current revision and expected current stage.
- Admin can inspect everything but cannot impersonate the routine reviewer.
- Assignment changes do not rewrite historical actors or decisions.
- Every state transition is performed by an RPC with an expected-stage check.

---

## 5. Shared Service Boundary

Create `src/lib/documentReviewService.ts` and shared types in `src/types/documentReview.ts`.

Pages may query through this service but must not directly update workflow tables.

Required operations:

- list cases using role-safe filters and pagination;
- load a case, current revision, files, comments, and events;
- create a case from editor submission or upload;
- upload a linked revision;
- attach and download secondary files;
- post/reply/resolve/reopen comments;
- approve or request revision as the assigned reviewer;
- mark issued documents and signed returns;
- generate short-lived authorized file URLs;
- subscribe to case changes or explicitly refresh after mutations.

All write methods return the authoritative server record. Optimistic UI may be added only after transactional behavior is tested.

---

## 6. Review Center UI

### Inbox column

- Search by student, document title/type, company, and submission ID.
- Filters: Needs Action, Waiting, Revision Required, Approved, and All.
- Badges for route stage, unread comments, revision count, and priority.
- Role-scoped data only; no mock fallback.
- Pagination or cursor loading rather than loading every historical record.

### Preview column

- PDF, DOCX, XLSX download state, and JPG/PNG preview as applicable.
- Current revision plus version selector.
- Metadata, checksum, uploader, submitted time, and download action.
- Clear unavailable/unsupported preview state without exposing a public URL.

### Conversation column

- General and revision-specific comments.
- Replies and resolve/reopen controls.
- Sent/received attachments.
- Chronological activity timeline.
- Role-specific decision form requiring remarks for revision requests.

### Responsive behavior

- Desktop: three-column master-detail layout.
- Tablet: inbox plus detail drawer/tabs.
- Mobile: inbox route opens a full-page case with Preview, Comments, Files, and Activity tabs.
- Preserve the selected case in the URL so refresh and deep links work.

---

## 7. Migration from Current Components

Reuse/refactor rather than duplicating:

- `StudentReviewSession.tsx` becomes a thin route adapter or is replaced by the shared center.
- `UnifiedReviewSession.tsx` contributes review actions and preview patterns.
- `ReviewDocs.tsx` becomes the Adviser inbox adapter.
- `WeeklyJournalReview.tsx` and DTR review screens route into the shared case view after their live workflows exist.
- `submissionStorage.ts` remains a compatibility layer until uploads move to `documentReviewService`.

Migration sequence:

1. Add new tables/RPCs/RLS without deleting current records.
2. Backfill eligible `student_documents` into cases with one initial revision.
3. Add compatibility links from `editor_drafts.submission_id` to the new case/revision.
4. Ship the Student and Adviser routes behind the shared service.
5. Connect Supervisor Weekly Journal, then DTR.
6. Remove mock arrays and old mutation paths only after parity tests pass.

---

## 8. AI Workstreams and File Ownership

Work in separate branches/worktrees and freeze schema/type contracts before parallel UI work.

| Workstream | Exclusive ownership | Output |
| :--- | :--- | :--- |
| A — Schema/RLS | New migration and database tests | Tables, indexes, RPCs, grants, transition/RLS proof |
| B — Domain service | `documentReviewService.ts`, shared types | Typed reads/writes and upload compensation |
| C — Inbox shell | New Review Center shell/list/filter components | Responsive list, routing, loading/error/empty states |
| D — Preview/files | Preview, revision selector, attachment components | Authorized preview/download and file history |
| E — Conversation | Comments, replies, resolution, event timeline | Persistent conversation and audit UI |
| F — Role adapters | Routes/sidebar and role action policies | Student/Supervisor/Adviser/Admin integration |
| G — Verification | Database/domain/component/browser tests | Authorization, transitions, refresh, revision, file tests |

The integration owner alone edits `App.tsx`, `Sidebar.tsx`, and `package.json` to minimize merge conflicts.

---

## 9. Delivery Phases

### Phase 1 — Secure vertical slice

- Schema, RPCs, RLS, shared types, and service.
- Student submission/revision and Adviser review.
- Persistent comments, attachments, and history.
- One complete Adviser-only document flow.

### Phase 2 — Three-role continuity

- Connect Weekly Journal to Supervisor-then-Adviser routing.
- Replace `mockJournalSubmissions`.
- Add unread/activity events and reviewer queues.

### Phase 3 — Remaining document families

- DTR generated from verified attendance.
- Company details, MOA, Endorsement, issued copies, and signed returns.
- Evaluation attachments where needed.

### Phase 4 — Hardening

- Accessibility and responsive browser QA.
- Pagination, indexes, performance measurements, and error telemetry.
- Remove compatibility mutation paths and archive obsolete components.

---

## 10. Acceptance Matrix

- [ ] Student sees all their review cases and only their cases.
- [ ] Assigned reviewer sees only cases allowed by assignment and stage.
- [ ] Unassigned Supervisor/Adviser cannot query the case or obtain its signed file URL.
- [ ] A revision is linked to the same case and prior versions remain immutable.
- [ ] Comments identify their author and exact revision and survive refresh/new login.
- [ ] Sent/received files identify uploader, purpose, version, and timestamp.
- [ ] Reviewer cannot approve a stale revision or stale stage.
- [ ] Adviser cannot see Supervisor-gated content before Supervisor approval.
- [ ] Revision request requires remarks and routes back to the correct role.
- [ ] Admin has complete read-only audit visibility.
- [ ] DOCX/PDF/JPG/PNG validation is consistent in UI, service, storage, and database metadata.
- [ ] No review page uses mock arrays, hardcoded people, or local-only workflow state.

