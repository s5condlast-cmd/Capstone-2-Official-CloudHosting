---
title: "Capstone 2 Cloud Hosting Platform — All Sessions History & Learnings"
description: "Master chronological log of all engineering sessions, architectural milestones, commit history, and permanent learned guidelines."
tags:
  - sti-ojt
  - session-history
  - changelog
  - milestones
  - learned-rules
aliases:
  - "Session History"
  - "All Sessions"
  - "Work Logs"
created: 2026-08-26
updated: 2026-09-04
---

# Capstone 2 Cloud Hosting Platform — All Sessions History & Learnings

[← Back to Documentation Hub](../README.md) | [August 26 Session Summary](SESSION_SUMMARY_2026-08-26.md) | [Task History](../tasks/TASK_HISTORY.md) | [Active Tasks](../tasks/TASKS.md)

- **Project**: Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring for STI Marikina
- **Repository**: `https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting.git`
- **Tech Stack**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Motion (Framer Motion), Express / TSX, Supabase, Cloudinary, ExcelJS, docx-preview, easy-template-x

---

## 1. Master Session Chronology

### Session 1: Project Initialization & Core Architecture Setup

- **Date**: July 26, 2026
- **Commits**: `ac59423`, `cb9fadc`
- **Platform Genesis**: Initialized full-stack Vite + React + Express architecture with Supabase authentication and database integration.
- **Theme System**: Designed the Deep Sky Blue + Warm Amber design token hierarchy with Zinc depth layering for light and dark modes.
- **Navigation & Role-Based Routing**: Established multi-role routes for Students, Advisers, Supervisors, and Admin portals.

---

### Session 2: Supervisor Workflow & DTR Approval System

- **Date**: July 28, 2026
- **Commits**: `34eb10d` -> `79c3c77`
- **DTR Approval Architecture**: Implemented interactive daily time record (DTR) reviews with time-in/out verification, total hours tracking, and supervisor remarks.
- **Signature Removal & Action Modals**: Built right-sized, monochrome confirmation modals for revoking and clearing signature approvals with target log detail highlighting.
- **Layout Optimization**: Right-sized table columns and fixed action button dimensions to eliminate cumulative layout shifts (CLS) on data state updates.

---

### Session 3: Dynamic Excel DTR Export & Canvas Signature Fitting

- **Date**: July 28, 2026
- **Focus**: Spreadsheet generation engine (`excelGenerator.ts`)
- **Dark Ink Luminance Filtering**: Created an RGBA pixel array scanning algorithm (`alpha > 30 && (r < 200 || g < 200 || b < 200)`) to crop empty whitespace and isolate hand-drawn dark signatures.
- **Adaptive Scaling**: Automatically scales signature strokes to occupy 90% of target row cell height without distortion.
- **1:1 Cell Border Anchoring**: Anchored ExcelJS two-cell image bounds strictly between whole column boundaries (6.0 to 7.0) to prevent leftward shift bugs in Microsoft Excel.

---

### Session 4: Landing Page Visual Depth & Contrast Tuning

- **Date**: July 28, 2026
- **Commits**: `72d96d2`, `42622cf`, `eb5b09d`
- **Radial Grid Masks**: Applied subtle radial masks to background grid patterns for an ambient depth vignette.
- **Contrast & Legibility**: Tuned dark edge gradient overlays, card contrast levels, and text hierarchy for accessibility standards.

---

### Session 5: Hero Typography, Native Vector Assets, & Brush Highlights

- **Date**: August 18–19, 2026
- **Commits**: `91e6689`, `3735bb5`
- **Centered Hero Typography**: Redesigned landing page headline layout with centered alignment and crisp badge hierarchy.
- **Native Asset Protocol**: Reorganized all landing page vector assets into `public/images/Landing Page Icons/` to resolve Vite `ENOENT` bundling errors.
- **Custom Brush Highlights**: Integrated handcrafted SVG brush-stroke underline highlights behind key landing page phrases.

---

### Session 6: React 19 Type System & 4-Role Account Card Selector (`RoleDocumentSimulator`)

- **Date**: August 26, 2026
- **Focus**: TypeScript compiler error elimination, hero gradient enhancements, and modular 4-Role Account Card Selector
- **React 19 Typings**: Identified missing `@types/react@^19.0.0` and `@types/react-dom@^19.0.0` in `devDependencies` that caused TS7016 / TS7026 / TS7006 across [`AdminDashboard.tsx`](../../src/pages/admin/AdminDashboard.tsx).
- **Framer Motion Event Conflict Resolution**: Re-typed [`Button.tsx`](../../src/components/ui/Button.tsx) and [`Skeleton.tsx`](../../src/components/ui/Skeleton.tsx) with `Omit<HTMLMotionProps<...>, ...>` to eliminate `onAnimationStart` signature incompatibility with React 19.
- **UI Component Prop Extensibility**: Extended [`Input.tsx`](../../src/components/ui/Input.tsx) (`icon`), [`Card.tsx`](../../src/components/ui/Card.tsx) (`subtitle`), and [`Badge.tsx`](../../src/components/ui/Badge.tsx) (`destructive`, `default`, `secondary`, `primary`).
- **Interactive Simulator Component**: Built [`src/components/landing/RoleDocumentSimulator.tsx`](../../src/components/landing/RoleDocumentSimulator.tsx) orchestrating portal badges, active indicators, and interactive document simulation for Student, Academic Adviser, Practicum Admin, and Company Supervisor roles.
- **Zero-Error Verification**: 0 errors across `npm run lint` (`tsc --noEmit`) and clean production build (`npm run build`).

---

## 2. Learned Rules & Best Practices (`/learn`)

The following rules are permanently embedded in [`.agents/AGENTS.md`](../../.agents/AGENTS.md):

### 1. React 19 Core Type Declarations

React 19 projects must explicitly declare `@types/react@^19.0.0` and `@types/react-dom@^19.0.0` in `devDependencies`. Missing them disables the global `JSX.IntrinsicElements` interface and collapses contextual typing on array maps.

### 2. Framer Motion Prop Typing in React 19

When wrapping Motion elements (`motion.button`, `motion.div`), never inherit from `React.ButtonHTMLAttributes` or `React.HTMLAttributes` directly. Always use `Omit<HTMLMotionProps<'element'>, 'ref' | 'children'>` to prevent `onAnimationStart` type collisions.

### 3. Primitive Component Prop Extensibility

Reusable components (`Button`, `Badge`, `Card`, `Input`, `Skeleton`) must preserve standard variant aliases (`default`, `secondary`, `primary`, `destructive`, `outline`) and common convenience props (`icon`, `subtitle`) to maintain backward compatibility across all role portals.

### 4. Zero-Error Gatekeeping

Always run `npm run lint` (`tsc --noEmit`) to verify that the entire codebase compiles cleanly with 0 TypeScript errors before completing tasks.

---

## Related Documentation & Cross-References

- [August 26 Session Summary Checkpoint](SESSION_SUMMARY_2026-08-26.md) — Detailed TypeScript diagnosis and root cause analysis
- [Task History & Changelog](../tasks/TASK_HISTORY.md) — Milestone breakdown by feature
- [Active Tasks & Roadmap](../tasks/TASKS.md) — Current sprint roadmap
- [Master Documentation Hub](../README.md) — Central documentation portal
