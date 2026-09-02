# 🎓 Student Portal & Practicum Checklist Documentation

A complete functional and technical breakdown of the **Student Dashboard**, interactive requirement checklist, host company deployment card, and completed tasks modal.

> 💡 **Executive Summary**: The student command center. Tracks stage-gated practicum milestones (Before, In, Finals), calculates host company attendance progress, and verifies approved requirements via an accessible modal dialog.

---

## 🌟 Feature Overview

The Student Portal serves as the primary workspace for practicum students. It structures the student journey across three sequential phases:

1. **Before OJT**: Pre-internship requirements (Application Letter, Parent/Student Consent, MOA, Endorsement, Proposal).
2. **In OJT**: Active placement documentation (Daily Time Records, Weekly Journals, Training Plan).
3. **Finals**: Exit compliance (Integration Paper, Performance Appraisal, Final Clearance).

```mermaid
graph TD
    A[Student Login] --> B[Student Dashboard]
    B --> C[Top Hero: Requirements Checklist]
    C --> D{Current Phase}
    D -->|Phase 1| E[Before OJT Requirements]
    D -->|Phase 2| F[In OJT Attendance & Journals]
    D -->|Phase 3| G[Final Clearance & Defense]
    B --> H[Active Placement Summary Bar]
    B --> I[Completed Tasks Modal]
    B --> J[Right Sidebar: Mini Calendar & Quick Stats]
```

---

## 🏗️ Architecture & Dataflow

```mermaid
graph TD
    subgraph 1. Mount Lifecycle
        M1[StudentDashboard.tsx Mounts] --> M2[Query submissionStorage]
        M2 --> M3[(Supabase DB)]
        M3 --> M4[Calculate Completion %]
    end

    subgraph 2. Phase Evaluation
        M4 --> P1[Before OJT: 8 Documents]
        M4 --> P2[In OJT: DTR & Journals]
        M4 --> P3[Finals: Clearance]
    end

    subgraph 3. Interactive UI Render
        P1 --> U1[Segmented Phase Tabs]
        P2 --> U2[Active Placement Progress 460h]
        P3 --> U3[Completed Tasks Dialog Modal]
    end
```

---

## 🔍 How It Works Under the Hood

### 1. Unified 9-Column Main Layout and 3-Column Sidebar

The dashboard uses a standardized grid layout matching the supervisor and adviser portals:

* **Main Column (`lg:col-span-9`)**:
  * **Top Greeting & Header**: Displays a personalized greeting (`Hi John, welcome back! 👋`) with an interactive Completed Tasks card on the right.
  * **Requirements Checklist Card**: Replaced legacy carousel slides with an actionable multi-phase checklist card featuring segmented phase controls and connected stepper nodes.
  * **Placement Status Card**: Displays the active host training establishment (HTE), supervisor contact, total rendered hours counter (`122 / 460 Hours`), visual progress bar, and a direct button to log today's DTR.
* **Sidebar (`lg:col-span-3`)**:
  * Compact monthly mini-calendar widget.
  * Upcoming practicum deadlines and announcements feed.

---

### 2. Completed Tasks Modal Dialog

When students click the **Completed Tasks** card in the header, an accessible Radix `<Dialog>` opens:

* Aggregates all documents with status `Approved` or `Verified`.
* Displays verification timestamps and document phase badges.
* Provides one-click navigation to view each approved document directly.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Dashboard as StudentDashboard.tsx
    participant Modal as Dialog (Radix UI)
    participant Storage as submissionStorage.ts
    participant Supabase as Supabase DB

    Student->>Dashboard: Clicks "Completed Tasks" card
    Dashboard->>Storage: getCompletedTasks(studentId)
    Storage->>Supabase: SELECT * FROM student_documents WHERE status='Approved'
    Supabase-->>Storage: Return approved records
    Storage-->>Dashboard: Return filtered task objects
    Dashboard->>Modal: Set isCompletedModalOpen = true
    Modal-->>Student: Renders interactive verified tasks list
```

---

## 🎯 Target Code Locator

| Entity / Logic | File Location | Purpose |
| :--- | :--- | :--- |
| **Main Page** | [`src/pages/student/StudentDashboard.tsx`](https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting/blob/feature/landing-page-fixes/src/pages/student/StudentDashboard.tsx) | Primary student dashboard component |
| **Standard Page Wrapper** | [`src/components/compose/StudentDocumentPage.tsx`](https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting/blob/feature/landing-page-fixes/src/components/compose/StudentDocumentPage.tsx) | Uniform wrapper for all 13 requirement pages |
| **Completed Tasks Dialog** | [`src/components/ui/dialog.tsx`](https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting/blob/feature/landing-page-fixes/src/components/ui/dialog.tsx) | Radix UI modal primitive for verified items |
| **State & Persistence** | [`src/utils/submissionStorage.ts`](https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting/blob/feature/landing-page-fixes/src/utils/submissionStorage.ts) | Reads/writes student submission records |

---

## 💡 Important Rules & Design Invariants

1. **Single Source of Truth**: Never mix hardcoded status arrays with live Supabase rows. Checklists must reflect the real status from `submissionStorage`.
2. **Phase Gating**: Students cannot advance to Final clearance documents until In OJT attendance requirements (460 hours) are verified by the supervisor.
3. **Responsive Sizing**: On mobile screens (`< 640px`), the 9/3 column grid collapses into a fluid single-column stack.
