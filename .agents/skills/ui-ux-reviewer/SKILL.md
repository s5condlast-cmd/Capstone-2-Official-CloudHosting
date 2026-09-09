---
name: ui-ux-reviewer
description: "Expert UI/UX reviewer and design auditor tailored specifically to this project's visual identity, monochrome & Deep Sky/Warm Amber palettes, theme-aware tokens, Geist/Inter typography, tactile micro-interactions, and zero-CLS standards."
version: 1.0.0
---

# UI / UX Reviewer & Design Auditor

A specialized diagnostic, audit, and elevation skill designed to guarantee that every screen, component, and interaction matches the project's **aesthetic taste, visual discernment, and theme-aware architecture**.

---

## 1. Aesthetic Taste & Visual Identity

### The 60-30-10 Color Hierarchy
- **60% Neutral Canvas / Base**:
  - Light mode: Crisp neutral background (`oklch(0.988 0.002 240)` / `#FAFAFA` / `#FFFFFF`).
  - Dark mode: Deep zinc backdrop (`oklch(0.145 0 0)` / `#09090B`).
- **30% Structural & Surface Tone**:
  - Cards, modals, sidebars, dividers, and secondary text (`#F1F5F9`, `#E2E8F0`, `oklch(0.96 0.003 240)`).
  - Borders: Crisp hairlines (`border-border`, `oklch(0.915 0.004 240)` light, `oklch(1 0 0 / 10%)` dark).
- **10% Purposeful Accent Moment**:
  - Reserved strictly for primary CTAs, active indicators, important badges, and key metric spotlights.
  - **No AI Purple Neon Slop**: Never apply indiscriminate multi-color neon gradients. Lighting must feel directional, organic, and grounded.

### System Color Palette & Tokens
The project supports dynamic theme switching rooted in `src/index.css`:

| Token / Theme | Primary Hex / Value | Accent / Companion | Tone / Character |
| :--- | :--- | :--- | :--- |
| **Monochrome (Default)** | `#09090b` (Light) / `#f4f4f5` (Dark) | Neutral zinc `#71717a` | Clean, editorial, timeless |
| **Deep Sky & Warm Amber** | `#3B82C4` (Deep Sky Blue) | `#E8A33D` (Warm Amber), `#4B5563` (Soft Slate) | Vibrant yet institutional, balanced warmth |
| **Modern Blue** | `#2563eb` (hover `#1d4ed8`) | `#60a5fa` | Tech-forward, crisp |
| **Indigo Professional** | `#4f46e5` (hover `#4338ca`) | `#818cf8` | Deep executive focus |
| **STI Inspired** | `#1d4ed8` (hover `#1e3a8a`) | `#facc15` (STI Yellow) | Institutional collegiate identity |
| **Slate + Cyan** | `#06b6d4` (hover `#0891b2`) | `#64748b` | Calm, analytical precision |

### Theme-Aware Invariant (Non-Negotiable)
- **NEVER** hardcode static Tailwind color classes for primary actions or active navigation (e.g. avoid `bg-blue-600`, `text-blue-500`, `border-indigo-500`).
- **ALWAYS** use theme-aware Tailwind classes:
  - Backgrounds: `bg-primary`, `bg-primary/10`, `bg-accent`
  - Foregrounds: `text-primary`, `text-primary-fg`, `text-foreground`, `text-muted-foreground`
  - Borders & Rings: `border-primary`, `ring-primary`, `border-border`
  - Component Variants: Use `variant="primary"` or `variant="outline"` on base primitives like `Button` and `Badge`.
- When custom colors like Deep Sky Blue or Warm Amber are intentionally used, reference the registered design tokens (`--color-sky-blue`, `--color-warm-amber`, `--color-soft-slate`) rather than arbitrary hex values.

---

## 2. Typography & Optical Hierarchy

### Font Family
- Primary: **Geist Variable** (`--font-sans: 'Geist Variable', sans-serif`) with **Inter** fallback.

### Typographic Rhythm
- **Display & Section Headlines**:
  - Always upright and confident. **Never italicize headings**.
  - Tight tracking: `tracking-tight` (`-0.02em` to `-0.03em`) on `h1`, `h2`, `h3`.
  - Weight: Bold to Extrabold (`font-bold` / `font-extrabold`).
- **Badges, Category Labels & Captions**:
  - Loosened tracking: `tracking-wider` or `tracking-widest` (`+0.05em` to `+0.1em`).
  - Style: `text-xs font-semibold uppercase`.
- **Long-Form Body Text**:
  - Generous line-height: `leading-relaxed` or `leading-7`.
  - High contrast: Minimum 4.5:1 ratio passing WCAG AA.
- **Monospace Elements**:
  - For hashes, document codes, timestamps, and IDs: `font-mono text-xs tracking-normal`.

---

## 3. Spatial Precision & Surface Craft

- **8-Point / 4-Point Grid**: All paddings, margins, and gaps must follow standard increments (`gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`, `p-4`, `p-6`).
- **Border Radii Hierarchy**:
  - Small pills & badges: `rounded-full` or `rounded-md` (`calc(var(--radius) * 0.8)`).
  - Cards & Containers: `rounded-xl` (`1rem`) or `rounded-2xl` (`1.5rem`).
  - Base input & button radius: `--radius: 0.625rem` (10px).
- **Tactile Shadows (Ambient, never harsh)**:
  - `.soft-shadow`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - `.soft-shadow-md`: `0 4px 12px -2px rgba(0, 0, 0, 0.06)`
  - `.soft-shadow-lg`: `0 12px 24px -4px rgba(0, 0, 0, 0.08)`
  - Anti-pattern: Solid black drop shadows (`shadow-[0_10px_20px_black]`).
- **Custom Pill Scrollbars**:
  - Always verify custom scrollbar styling (`::-webkit-scrollbar` width 4-6px, rounded thumb, Windows scroll buttons hidden).

---

## 4. Tactile Micro-Interactions & Motion Physics

- **Tactile Tap / Click Feedback**:
  - Every interactive element (button, card link, tab) must react to user touch: `active:scale-[0.98]` or `active:scale-95`.
- **Gentle Hover Scale**:
  - Subtle hover lift: `hover:scale-[1.01]` or `hover:scale-[1.02]`.
- **Hardware-Accelerated Easing**:
  - Smooth deceleration curves: `cubic-bezier(0.16, 1, 0.3, 1)` or spring physics (`stiffness: 380, damping: 30`).
  - No `transition-all` on elements animated by requestAnimationFrame (Lenis / RAF).
- **Zero Layout Shift (CLS = 0)**:
  - Explicit dimensions on image slots, PDF viewers (`<PDFViewer className="w-full h-full" ... />`), and DOCX viewers (`[&_section]:!w-full`).
  - Loading skeletons must match the target element's exact width, height, and border-radius.
- **Empty & Error States**:
  - Always utilize `src/components/ui/EmptyState.tsx` for zero-data states. Never output unstyled text.

---

## 5. Review Checklist & Audit Rubric

When performing an audit, evaluate across these 5 pillars:

| Pillar | Weight | Key Assessment Questions |
| :--- | :---: | :--- |
| **1. Visual Taste & Color Fidelity** | 25% | Does it obey the 60-30-10 rule? Are colors theme-aware (`text-primary`, `bg-primary`) without hardcoded hex values? Are shadows soft and ambient? |
| **2. Typographic Craft** | 20% | Is tracking tight on headings and wide on uppercase badges? Are headings upright and non-italic? Is line-height comfortable? |
| **3. Tactile Micro-Interactions** | 20% | Does every button/card have `active:scale-[0.98]`? Are hover transitions smooth spring physics? |
| **4. Layout Alignment & Precision** | 20% | Does it adhere to the 4/8pt grid? Are icon baselines optically aligned with text? Is CLS zero? |
| **5. Accessibility & State Lifecycles** | 15% | Does contrast pass WCAG AA? Are focus rings visible (`focus-visible:ring-2`)? Are loading skeletons and `EmptyState` used properly? |

---

## 6. Output Review Report Structure

When conducting a review, generate a report following this standard schema:

```markdown
# UI / UX Review: [Component / Page Name]

## Executive Summary & Scorecard
- **Overall Score**: [0-100]/100
- **Visual Taste & Colors**: [0-100]/100
- **Typographic Craft**: [0-100]/100
- **Tactile Polish & Motion**: [0-100]/100
- **Layout & Alignment**: [0-100]/100
- **Accessibility & Lifecycles**: [0-100]/100

## Strengths
- [Key strength 1 adhering to taste and theme tokens]
- [Key strength 2]

## Findings & Recommendations

### [Critical / High / Medium / Low]
#### [Issue Title]
- **Current State**: [Description + file reference]
- **Taste & Aesthetic Concern**: [Why it breaks the system's design guidelines]
- **Fix Recommendation**:
```tsx
// Before
<button className="bg-blue-600 text-white shadow-lg">Submit</button>

// After (Taste & Theme-Aware)
<Button variant="primary" className="active:scale-[0.98] soft-shadow-md">
  Submit
</Button>
```
- **Impact**: [Visual polish / consistency / performance gain]

## Prioritized Action Plan
1. **Quick Wins**: [Immediate 5-minute fixes]
2. **Medium Improvements**: [Component refactors]
3. **Long-Term Polish**: [Design system alignment]
```
