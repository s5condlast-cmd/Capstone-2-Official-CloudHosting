# System Design Conditions & Brand Specifications

> Authoritative reference guide for brand colors, neutral scale, typographic hierarchy, geometry, and component constraints.

---

## 1. Palette Specifications

### Brand
- **Electric Blue** (`#2563eb`): Logo, links, key metric highlights, active states, icon accents. Visual voltage on white surfaces.
- **Deep Sapphire** (`#1e40af`): Primary action button background, high-emphasis CTA fill. Used sparingly as the single committed action color.

### Accent (Supporting Only)
- **Soft Mint** (`#dcfce7`): Outline accent for tags, dividers, and focused UI edges.
- **Vivid Green** (`#16a34a`): Text accent for links, tags, and emphasized short phrases.
- **Tangerine** (`#ea580c`): Orange text accent for links, tags, and emphasized phrases.
- **Lavender** (`#7c3aed`): Violet text accent for links, tags, and emphasized phrases.
- **Conic Spectrum Gradient**: Full-spectrum conic gradient reserved exclusively for brand visual artwork and logo. **Forbidden on UI controls**.

### Neutrals
- **Primary Action Fill** (`#000000`): High-contrast neutral action fill for primary buttons on light surfaces.
- **Midnight Ink** (`#0a0a0a`): Primary button text, high-emphasis buttons, nav text.
- **Charcoal** (`#171717`): Body text, button text, default heading color.
- **Graphite** (`#262626`): Secondary text, icon strokes, subtle UI elements.
- **Slate** (`#404040`): Tertiary text, nav hover states, subdued iconography.
- **Steel** (`#525252`): Muted body text, helper text, less-prominent labels.
- **Fog** (`#737373`): Placeholder text, disabled states, link text in rest state.
- **Silver** (`#a3a3a3`): Disabled iconography, decorative strokes, light dividers.
- **Pebble** (`#c8c8c8`): Medium-contrast borders, control outlines, structural separators.
- **Smoke** (`#d4d4d4`): Stronger borders for emphasis containers and secondary button outlines.
- **Ash** (`#e5e5e5`): Hairline borders on cards, inputs, and dividers — the primary container boundary.
- **Paper Mist** (`#f5f5f5`): Subtle alt-surface for nested cards, secondary panels, and hover fills.
- **Canvas White** (`#ffffff`): Page background, card surfaces, popover panels.

---

## 2. Typography

- **Scale**: Major Second (`1.125`) from `14px` base.
- **Display Headings**: **Satoshi** (Weight 500, sizes 36px, 40px, 48px, line-height 1.0–1.11, letter-spacing normal, fallback: Inter 500 `-0.02em` or General Sans).
  - *Strict Rule*: Satoshi is display-only (36px+). Never use at body sizes.
- **Body & UI**: **Inter** (Weight 400 default body, 500 emphasis/buttons, 600 important UI labels; canonical body 16px / line-height 1.5, dense data 14px / 1.43, micro-labels 11–12px).
- **Code & Tech Specs**: **Geist Mono** (Weight 400, 500, sizes 12px, 14px, 24px, line-height 1.0–1.43).

---

## 3. Spacing & Shape Geometry

- **Grid**: Base unit `4px`, Compact density, Max container width `1200px`, Section gap `64px`, Card padding `16px`, Element gap `8px`.
- **Border Radii**:
  - `6px`: Inputs and textareas
  - `8px`: Buttons and primary triggers
  - `12px`: Cards and panels
  - `16px`: Large feature cards and modals
  - `9999px`: Pills, tags, badges, and status indicators
- **Elevation**: 1px solid `#e5e5e5` (Ash) container borders. No heavy drop shadows.

---

## 4. Invariants Summary

- Never use pure black (`#000000`) for body text — use `#171717` or `#0a0a0a`.
- Never use Electric Blue (`#2563eb`) as a wide background surface.
- Never use more than one chromatic accent per pill or component.
- Never spawn duplicate drafts when opening or editing an existing document.

