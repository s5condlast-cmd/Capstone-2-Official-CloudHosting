---
name: taste-design
description: "Aesthetic taste, art direction, and visual discernment skill. Enforces editorial typography, intentional color harmony, spatial tension, tactile depth, and anti-bland UI design."
version: 1.0.0
---

# Taste Design Skill

A design philosophy and execution guide that elevates user interfaces from functional to memorable. **Taste** is not about decoration—it is about intentionality, restraint, typography mastery, and high visual discernment.

---

## The Core Principles of Taste

### 1. Typography as the Core Anchor
- **Type Hierarchy is Architecture**: Establish clear typographic scale (`display`, `h1`, `h2`, `h3`, `body`, `caption`, `mono`).
- **Never Default to Generic Pairings**: Pair expressive display type with high-legibility geometric or humanist body text.
- **Intentional Leading & Tracking**:
  - Tighten letter-spacing on display headlines (`tracking-tight` / `-0.02em` to `-0.04em`).
  - Loosen tracking on uppercase captions and badges (`tracking-wider` / `+0.05em` to `+0.1em`).
  - Ensure generous line-height on long-form body text (`leading-relaxed` or `1.6` to `1.7`).
- **No Italic Headings**: Headings should remain upright and confident. Use weight, accent underlines, or subtle tonal shifts for emphasis.

### 2. Sophisticated Color Curation & Restraint
- **60-30-10 Color Rule**:
  - **60% Base / Background**: Clean neutral canvases (e.g., crisp off-whites `#F8F9FA`, deep zinc `#09090B`, or warm paper `#FAFAF9`).
  - **30% Structural / Surface Tone**: Subtle cards, borders, dividers, and secondary text (`#F1F5F9`, `#E2E8F0`, `#64748B`).
  - **10% Accent Moment**: A single, purposeful accent color (e.g., Sky `#4F9CF9`, Amber `#F59E0B`, Emerald `#10B981`) used strictly for primary CTAs, active highlights, or status indicators.
- **Avoid 'AI Purple Gradients'**: Do not splash generic multi-color neon gradients indiscriminately. Prefer soft radial spotlights, directional lighting, or subtle monochromatic depth.

### 3. Spatial Tension & Breathing Room
- **Whitespace is a Feature**: Give hero elements and key content generous breathing room (`py-16`, `py-24`, `gap-8`, `gap-12`).
- **Asymmetry and Dynamic Layouts**: Break rigid, repetitive 3-box grids with asymmetrical callouts, staggered cards, or multi-span bento layouts.
- **Visual Weight Balancing**: Counterbalance heavy headings with airy, lightweight vector elements or refined badge pills.

### 4. Tactile Micro-Interactions
- **Subtle, Organic Motion**:
  - Micro-scale on hover (`scale-[1.02]`, `scale-105`).
  - Spring-dampened transitions (`cubic-bezier(0.16, 1, 0.3, 1)` or `type: 'spring', stiffness: 380, damping: 30`).
  - Tactile tap reactions (`active:scale-[0.98]`).
- **Physical Feel**: Subtle hairlines (`border-zinc-200/80`), multi-layered soft shadows (`shadow-sm hover:shadow-xl`), and frosted glass surfaces (`backdrop-blur-xl bg-white/90`).

### 5. Honest Copy & Zero Clutter
- Avoid placeholder fluff. Keep copy sharp, punchy, and meaningful.
- Avoid fake browser chrome or simulated traffic lights unless serving a real technical schematic.

---

## When to Invoke Taste Design
- Crafting hero sections, landing pages, and marketing experiences.
- Upgrading standard dashboard cards to premium, bespoke layouts.
- Designing high-contrast interactive components (carousels, modals, workflows).
