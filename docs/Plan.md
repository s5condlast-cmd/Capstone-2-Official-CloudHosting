# Plan: Safely Remove Retired Student Document Modules

## Objective

Remove the following ten student-facing modules completely without breaking shared administrator, adviser, supervisor, authentication, document-storage, or reporting functionality:

- Application Letter — `/student/application-letter`
- Consent Form — `/student/consent`
- Proposal Letter — `/student/proposal`
- Memorandum of Agreement — `/student/moa`
- Endorsement Letter — `/student/endorsement`
- Weekly Journal — `/student/journal`
- Daily Time Record — `/student/dtr`
- OJT Training Plan — `/student/training-plan`
- Integration Paper — `/student/completion`
- Performance Appraisal — `/student/evaluation`

## Safety boundaries

- Do not delete existing Supabase records or uploaded student documents during this change.
- Do not drop shared database tables, storage buckets, policies, or document services.
- Preserve `/supervisor/dtr` and `/supervisor/journal` unless their removal is requested separately.
- Preserve administrator template management and adviser/supervisor review features that still have valid uses.
- Preserve unrelated user changes in the working tree.
- Delete shared components, configuration, helpers, or assets only after a repository-wide dependency search proves that nothing remaining uses them.

## Implementation phases

### 1. Establish a baseline

- Record the current working-tree state with `git status`.
- Run TypeScript lint, relevant tests, and the production build.
- Record any pre-existing failures separately so they are not confused with removal regressions.

### 2. Remove application routes

- Remove the ten student route declarations from `src/App.tsx`.
- Remove their now-unused page imports.
- Confirm direct visits to retired URLs use the application's normal not-found behavior or safe student-dashboard fallback.

### 3. Remove navigation and UI entry points

Remove retired links, actions, cards, and labels from:

- Student sidebar implementations
- Student dashboard requirements, progress cards, tasks, and quick actions
- Command palette
- Notification dropdown
- Student generative/AI interface
- Site-header route-title mapping

Remove empty Before OJT, In OJT, or Finals navigation groups when they no longer contain active destinations.

### 4. Remove page components

After all imports and routes have been removed, delete:

- `src/pages/student/StudentApplicationLetter.tsx`
- `src/pages/student/LetterOfConsent.tsx`
- `src/pages/student/ProposalLetterToTheIndustry.tsx`
- `src/pages/student/MemorandumOfAgreement.tsx`
- `src/pages/student/STIOJTEndorsementLetter.tsx`
- `src/pages/student/WeeklyJournal.tsx`
- `src/pages/student/DTR.tsx`
- `src/pages/student/OJTTrainingPlan.tsx`
- `src/pages/student/IntegrationPaper.tsx`
- `src/pages/student/PerformanceAppraisal.tsx`

### 5. Audit supporting code and assets

Review, but do not automatically delete:

- Template-field and editor-template configuration
- PDF, DOCX, and spreadsheet templates
- Document-generation and Excel-export helpers
- Submission-storage utilities
- Shared document workflow and review components
- DTR signature and supervisor-review utilities

Remove an item only when it is exclusive to the retired student modules and has zero remaining runtime, test, or documentation references.

### 6. Preserve historical data

- Keep existing `student_documents` records and uploaded files available to authorized roles.
- Stop new submissions by removing the student entry points.
- Treat permanent record or file deletion as a separate migration requiring a backup and explicit approval.

### 7. Update documentation

Remove obsolete routes and active-feature descriptions from:

- README and student portal guides
- System map and architecture documents
- Document workflow documentation
- Panelist/system guide
- Current task lists

Keep historical task entries where useful, but mark the modules as retired instead of rewriting project history.

### 8. Verification checklist

- [x] Repository search returns no active references to the ten retired student URLs.
- [x] No imports reference the ten deleted page components.
- [x] Student navigation contains no dead links or empty phase groups.
- [x] Direct visits to retired routes are handled safely.
- [x] TypeScript lint passes.
- [x] Relevant unit and authentication tests pass.
- [x] Production build succeeds.
- [x] Student dashboard and remaining student routes render correctly.
- [x] Administrator and adviser pages still render correctly.
- [x] Supervisor DTR and weekly-journal review still work.
- [x] Existing Supabase records and stored documents remain untouched.
- [x] `git diff --check` reports no whitespace errors.

## Completion criteria

The removal is complete only when all ten student pages and their entry points are gone, no broken references remain, shared workflows continue to pass verification, and existing user data has not been deleted.
