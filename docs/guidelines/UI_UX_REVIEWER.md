---
title: "UI / UX Reviewer & Design System Standards"
description: "Aesthetic taste, color palettes (Monochrome, Deep Sky & Warm Amber), theme-aware rules, Geist/Inter typography, and UI audit rubric."
tags:
  - sti-ojt
  - ui-ux
  - design-system
  - color-palette
  - typography
  - reviewer
aliases:
  - "UI UX Reviewer"
  - "Design Standards"
  - "UI Review Guidelines"
created: 2026-09-04
updated: 2026-09-04
---

# 🎨 UI / UX Reviewer & Design System Standards

[← Back to Documentation Hub](../README.md) | [Refactoring Guidelines](REFACTORING_GUIDELINES.md) | [System Architecture](../architecture/ARCHITECTURE.md) | [Live UI Review](UI_REVIEW.md)

This document establishes the official UI/UX review standards, aesthetic taste rules, and color palette architecture for the system. It also acts as the reference specification for the autonomous `ui_ux_reviewer` subagent and skill.

---

## 1. Aesthetic Taste & Visual Identity

The project enforces an intentional, editorial, and tactile design philosophy. We avoid generic, uninspired AI-generated layouts in favor of intentional hierarchy, thoughtful typography, and physical micro-feedback.

### The 60-30-10 Rule
1. **60% Neutral Canvas / Base**:
   - **Light Mode**: Crisp, high-clarity background (`oklch(0.988 0.002 240)` / `#FFFFFF`).
   - **Dark Mode**: Deep zinc backdrop (`oklch(0.145 0 0)` / `#09090B`).
2. **30% Structural & Surface Tone**:
   - Cards, sidebars, dividers, and dialogs (`oklch(0.96 0.003 240)` / `#F1F5F9`).
   - Crisp borders and hairlines (`oklch(0.915 0.004 240)` light, `oklch(1 0 0 / 10%)` dark).
3. **10% Purposeful Accent Moment**:
   - Reserved strictly for primary call-to-actions, active indicators, and critical metrics.
   - **No AI Neon Purple**: Never spray multi-color neon gradients indiscriminately. Lighting and highlights must be subtle, directional, and grounded.

---

## 2. Color Palette & Dynamic Theme Engine

All theme tokens are defined in [`src/index.css`](../../src/index.css) and switch dynamically via CSS custom properties (`--theme-primary`):

```
┌────────────────────────────────────────────────────────┐
│               ACTIVE SYSTEM PALETTES                  │
├───────────────────────┬────────────────────────────────┤
│ Monochrome (Default)  │ Primary: #09090B / #F4F4F5    │
│                       │ Accent:  Neutral Zinc #71717A  │
├───────────────────────┼────────────────────────────────┤
│ Deep Sky & Warm Amber │ Primary: #3B82C4 (Sky Blue)    │
│                       │ Accent:  #E8A33D (Warm Amber)  │
│                       │ Slate:   #4B5563 (Soft Slate)  │
├───────────────────────┼────────────────────────────────┤
│ Modern Blue           │ Primary: #2563EB               │
│                       │ Hover:   #1D4ED8               │
├───────────────────────┼────────────────────────────────┤
│ Indigo Professional   │ Primary: #4F46E5               │
│                       │ Hover:   #4338CA               │
├───────────────────────┼────────────────────────────────┤
│ STI Inspired          │ Primary: #1D4ED8               │
│                       │ Accent:  STI Yellow #FACC15    │
├───────────────────────┼────────────────────────────────┤
│ Slate + Cyan          │ Primary: #06B6D4               │
│                       │ Accent:  Slate #64748B         │
└───────────────────────┴────────────────────────────────┘
```

### ⚠️ The Theme-Aware Invariant
- **NEVER hardcode raw Tailwind color classes** like `bg-blue-600`, `text-blue-500`, or `border-indigo-500` on interactive components or primary highlights.
- **ALWAYS use theme-aware classes**:
  - `bg-primary`, `text-primary`, `border-primary`, `ring-primary`
  - Or use the `variant="primary"` prop on foundational primitives like [`Button.tsx`](../../src/components/ui/Button.tsx) and [`Badge.tsx`](../../src/components/ui/Badge.tsx).
- When specific brand accents are intentional (e.g., Deep Sky or Warm Amber), reference the declared theme variables (`--color-sky-blue`, `--color-warm-amber`) rather than arbitrary hex values.

---

## 3. Typography & Optical Hierarchy

- **Typefaces**: **Geist Variable** (`--font-sans`) as primary, with **Inter** fallback.
- **Headlines & Section Titles**:
  - Upright and confident: **never italicize headings**.
  - Tight tracking: `tracking-tight` (`-0.02em` to `-0.03em`) on display text and headings.
  - Bold to Extrabold weights (`font-bold` / `font-extrabold`).
- **Badges, Status Tags & Small Caps**:
  - Loosened tracking: `tracking-wider` or `tracking-widest` (`+0.05em` to `+0.1em`).
  - Small uppercase style: `text-xs font-semibold uppercase`.
- **Body & Paragraph Text**:
  - Generous line-height (`leading-relaxed`).
  - Strict WCAG AA contrast (min 4.5:1 ratio).

---

## 4. Tactile Micro-Interactions & Physics

1. **Active Tap Feedback**: Every interactive button, pill, or card link must feel physically responsive:
   ```tsx
   className="active:scale-[0.98] transition-transform duration-100"
   ```
2. **Subtle Hover Scaling**: Gentle hover lift (`hover:scale-[1.01]` or `hover:scale-[1.02]`) paired with soft ambient shadows.
3. **Soft Ambient Shadows**: Avoid harsh, pitch-black drop shadows. Use the system's low-opacity ambient shadows:
   - `.soft-shadow` (subtle cards)
   - `.soft-shadow-md` (dropdowns & popovers)
   - `.soft-shadow-lg` (modals & elevated sheets)
4. **Zero Layout Shift (CLS = 0)**:
   - Skeletons must mirror exact layout heights and border-radii before data resolves.
   - All document canvas viewers (`<PDFViewer>`, `<DocxViewer>`) must have explicit container sizing.
5. **Zero-State Fallback**: Never render unstyled text for empty states; always import and render [`src/components/ui/EmptyState.tsx`](../../src/components/ui/EmptyState.tsx).

---

## 5. UI / UX Reviewer Checklist & Rubric

Audits conducted by developers or the `ui_ux_reviewer` subagent are scored across 5 pillars (total 100 points):

| Dimension | Points | Pass Criteria |
| :--- | :---: | :--- |
| **Theme & Color Fidelity** | 25 | Respects 60-30-10 rule; 0 hardcoded color classes; seamless switching between monochrome & colored themes. |
| **Typography & Hierarchy** | 20 | Upright headings; tight tracking on headlines; wide tracking on badges; WCAG AA contrast. |
| **Tactile Polish & Motion** | 20 | `active:scale-[0.98]` tactile clicks; spring/cubic-bezier easing; zero `transition-all` on RAF elements. |
| **Spatial Alignment & Grid** | 20 | 4pt/8pt grid discipline; optical alignment of icon/text baselines; clean container bounds. |
| **Accessibility & States** | 15 | Visible focus rings (`focus-visible:ring-2`); CLS = 0 with dimensioned skeletons; unified `EmptyState`. |

---

## 6. How to Run a UI / UX Review

You can run an automated UI/UX review at any time:
1. **Via Subagent**: Ask Antigravity to *"Run a UI review on [Component/Page] using the `ui_ux_reviewer` subagent"*.
2. **Via Skill**: The `ui-ux-reviewer` skill is permanently located in `.agents/skills/ui-ux-reviewer/SKILL.md`.
3. **Report Output**: Findings will follow the standard scorecard structure with exact file paths, before/after code fixes, and a prioritized action plan.
