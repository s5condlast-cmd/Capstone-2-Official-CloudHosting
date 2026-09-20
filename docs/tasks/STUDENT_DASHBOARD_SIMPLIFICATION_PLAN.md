# Plan: Simplified Student Dashboard

[← Back to Tasks Hub](README.md) | [Active Tasks](TASKS.md) | [Document Review Center](DOCUMENT_REVIEW_CENTER_PLAN.md)

**Status:** Ready for implementation  
**Target:** Student Portal (`/student`)  
**Primary outcome:** A calm, focused dashboard that tells the student where they are, what needs attention, and what to do next within a few seconds.

---

## 1. Current UI Audit

The existing dashboard is visually polished at the component level but too dense as a whole. At 1,990 lines, `StudentDashboard.tsx` combines data access, requirement matching, progress calculations, local todo persistence, calendar logic, modals, and nearly every dashboard widget in one page.

### Main problems visible in the current screen

- Four equal-weight metric cards compete for attention.
- Practicum onboarding, resume-draft continuation, and requirements all present themselves as the primary task.
- Thirteen requirements are rendered as large cards directly on the dashboard.
- Calendar, manual todo list, announcements, contacts, recent submissions, and completed items create a second application inside the dashboard.
- Small labels, repeated borders, status pills, and metadata make the page difficult to scan.
- Most surfaces use the same visual weight, so important and optional information look equally urgent.
- The right sidebar is narrow, vertically long, and contains information already reachable elsewhere.
- Local fallback todos and demo values can disagree with database-backed document status.

### UX objective

The dashboard should answer only three questions:

1. **Where am I in the practicum process?**
2. **What needs my attention now?**
3. **Where do I go to complete it?**

Everything else should be available through the sidebar, Review Center, Documents, Calendar, or a secondary details page.

---

## 2. Simplified Information Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Welcome back, John                           [Open Documents]        │
│ BSIT • Student ID • Current phase                                    │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ Verified Hours   │ Requirements     │ Placement                     │
│ 120 / 500        │ 6 / 13 approved  │ Awaiting assignment           │
├─────────────────────────────────────────────────────────────────────┤
│ NEXT ACTION                                                         │
│ Continue Weekly Journal — draft saved 15 minutes ago    [Continue] │
├─────────────────────────────────────────┬───────────────────────────┤
│ Practicum Progress                      │ Needs Attention           │
│ Before OJT       6 / 8                  │ 2 revisions               │
│ In OJT           Locked                 │ 1 deadline this week      │
│ Final Phase      Locked                 │ [Open Review Center]      │
│ [View all requirements]                 │                           │
├─────────────────────────────────────────┴───────────────────────────┤
│ Recent Activity                                                     │
│ • Adviser requested changes on Application Letter                  │
│ • Parent Consent approved                                           │
│ • Weekly Journal draft saved                                        │
│ [View all activity]                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Desktop hierarchy

1. Compact greeting and one global action.
2. Three concise status metrics.
3. One prominent Next Action card.
4. Two-column Progress and Needs Attention section.
5. Short Recent Activity list.

### Mobile hierarchy

1. Greeting.
2. Horizontally scrollable or stacked three-metric summary.
3. Next Action.
4. Needs Attention.
5. Phase Progress.
6. Recent Activity.

No essential action may require horizontal page scrolling.

---

## 3. What Stays, Changes, and Moves

| Current section | Decision | New destination/behavior |
| :--- | :---: | :--- |
| Welcome header | Simplify | Name, program/ID, phase, and one `Open Documents` action |
| Four metric cards | Reduce | Three cards: Verified Hours, Requirements, Placement |
| Practicum onboarding banner | Merge | Placement metric plus Next Action when onboarding is blocking |
| Continue Working banner | Keep as dynamic Next Action | Only one highest-priority action is shown |
| Thirteen large requirement cards | Replace | Three compact phase rows and `View all requirements` |
| Recent submissions | Replace | Maximum five-item Recent Activity feed |
| Full mini calendar | Remove from dashboard | Calendar page; dashboard shows only the nearest deadline |
| Manual todo checklist | Remove from dashboard | System-generated Needs Attention list from real workflow state |
| Announcements card | Collapse/move | Latest urgent announcement only, otherwise Notifications page |
| Practicum contacts | Move | Profile/Help or dedicated contacts dialog/page |
| Completed-items modal | Remove | Completed requirements available through Documents filters |

The dashboard must not duplicate the full Document Repository or Review Center.

---

## 4. Next Action Priority Rules

Only one primary action appears. Calculate it from authoritative state in this order:

1. Revision requested by Supervisor or Adviser.
2. Required document with an approaching/overdue deadline.
3. Continue most recently edited draft.
4. Complete the next unlocked requirement in the current phase.
5. Submit company/placement details when prerequisites are approved.
6. Log attendance or submit the current Weekly Journal during In OJT.
7. Review approved/issued document when no creation action is pending.
8. Display an `All caught up` state when no action exists.

The action includes:

- one short title;
- one explanatory sentence;
- deadline or last-saved time when relevant;
- exactly one primary CTA;
- optional secondary `View details` text link.

Do not show multiple competing primary buttons.

---

## 5. Data and Component Architecture

### Extract a dashboard view model

Create `src/hooks/useStudentDashboard.ts` or `src/features/student-dashboard/useStudentDashboard.ts`.

It should load and derive:

- authenticated student profile and practicum phase;
- verified hours from approved attendance when available;
- requirement totals from the authoritative workflow/document records;
- placement assignment and approval state;
- next action;
- needs-attention items;
- recent activity;
- nearest deadline or urgent announcement.

The hook returns a typed view model. The page must not contain Supabase queries, document-name matching, mock people, or local workflow fallbacks.

### Proposed file structure

```text
src/features/student-dashboard/
├── StudentDashboardView.tsx
├── useStudentDashboard.ts
├── studentDashboard.types.ts
├── studentDashboard.selectors.ts
├── DashboardHeader.tsx
├── StatusSummary.tsx
├── NextActionCard.tsx
├── PhaseProgress.tsx
├── NeedsAttention.tsx
├── RecentActivity.tsx
└── StudentDashboardSkeleton.tsx
```

`src/pages/student/StudentDashboard.tsx` becomes a thin route component that renders loading, error, empty, and ready states.

### Single-source rules

- Do not use `INITIAL_TODOS_FALLBACK` for production workflow status.
- Do not derive progress by matching display strings when stable template/document IDs exist.
- Do not silently substitute demo values when Supabase fails.
- Use `EmptyState` and an explicit Retry action for unavailable data.
- Preserve local storage only for harmless personal display preferences, not institutional completion state.

---

## 6. Visual Design Rules

### Color

- Follow the 60/30/10 hierarchy: neutral canvas, quiet structural cards, purposeful accent only for the Next Action and active status.
- Use theme tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`) rather than hardcoded blue/green variants.
- Use semantic warning/error colors only for genuine deadlines or revision requests.

### Typography

- Page title: `text-2xl font-bold tracking-tight`.
- Metric values: `text-2xl` or `text-3xl`, not oversized display numbers.
- Card titles: `text-sm font-semibold`.
- Supporting copy: at least `text-xs`/`text-sm` with WCAG AA contrast; avoid dense `text-[9px]` information.
- Uppercase tracking is limited to small category labels.

### Spacing and surfaces

- Use a consistent 4/8-point grid with `gap-4`, `gap-6`, `p-4`, and `p-6`.
- Reduce nested bordered cards; use dividers and whitespace inside a larger surface.
- Use one radius hierarchy and soft shadows only where elevation communicates interaction.
- Keep primary content within a readable maximum width.

### Interaction and accessibility

- Every action is keyboard reachable with a visible focus ring.
- Add active/tap feedback without `transition-all` on dynamically animated elements.
- Skeletons match the final card dimensions to prevent layout shift.
- Status must never rely on color alone; include text and icon labels.
- Respect reduced-motion preferences.

---

## 7. Delivery Phases

### Phase 1 — Data contract and page skeleton

- [ ] Define typed dashboard view model and selectors.
- [ ] Move live queries and derivation out of the current page.
- [ ] Establish loading, error, empty, and ready states.
- [ ] Add selector tests for Next Action priority and phase progress.

### Phase 2 — Simplified layout

- [ ] Build the compact header and three-metric summary.
- [ ] Build one dynamic Next Action card.
- [ ] Replace thirteen requirement cards with phase progress rows.
- [ ] Add Needs Attention and Recent Activity summaries.
- [ ] Link Documents, Review Center, Calendar, and Notifications instead of embedding those applications.

### Phase 3 — Remove obsolete dashboard features

- [ ] Remove the mini calendar implementation.
- [ ] Remove the local manual todo manager and completed-items modal.
- [ ] Remove full announcements and contacts widgets.
- [ ] Remove demo fallback values and duplicate progress calculations.
- [ ] Delete unused imports, state, helpers, and styles exposed by the reduction.

### Phase 4 — Responsive and accessibility verification

- [ ] Test at 375 px, 768 px, 1024 px, 1366 px, and 1536 px.
- [ ] Verify keyboard order, focus visibility, contrast, screen-reader labels, and reduced motion.
- [ ] Verify loading/error/empty states without content jump.
- [ ] Run authenticated Chrome and Edge browser tests.

---

## 8. AI Workstream Safety

Because `StudentDashboard.tsx` is a high-conflict 1,990-line file, only one integration AI may edit it during extraction.

| Workstream | Ownership | Deliverable |
| :--- | :--- | :--- |
| A — View model | New dashboard hook, types, selectors, selector tests | Authoritative data and priority rules |
| B — Presentational components | New feature component directory | Header, summary, action, progress, attention, activity |
| C — Integration | Existing `StudentDashboard.tsx` only | Replace old page and delete obsolete code |
| D — QA | Browser/component tests and accessibility checklist | Responsive and interaction verification |

Freeze the view-model interface before A and B work in parallel. The integration owner merges components into the route after their isolated tests pass.

---

## 9. Acceptance Criteria

- [ ] A student understands their phase, hours, placement, and next action within five seconds.
- [ ] Only one primary Next Action CTA is visible.
- [ ] The dashboard contains no more than three top-level metrics.
- [ ] The dashboard does not render all thirteen requirement cards.
- [ ] Calendar, todo manager, announcements archive, and contacts directory are not embedded as full widgets.
- [ ] Revision requests and deadlines remain immediately visible.
- [ ] Documents and Review Center are reachable in one click.
- [ ] All institutional status comes from live persisted data.
- [ ] No mock or silent demo fallback is shown after a failed query.
- [ ] Desktop and mobile layouts have no overflow, clipped text, or layout shift.
- [ ] Keyboard and screen-reader users can reach and understand every action.
- [ ] Existing document/editor/review workflows remain unchanged by the visual simplification.

---

## 10. Non-Goals

- Do not add charts merely to fill space.
- Do not add another editable todo system.
- Do not reproduce the entire Calendar or Document Repository.
- Do not change workflow stages or database permissions in this UI task.
- Do not redesign the sidebar at the same time, except to add already approved destinations such as Document Reviews.
- Do not preserve a widget solely because it already exists; preserve only information that supports the dashboard's three questions.

