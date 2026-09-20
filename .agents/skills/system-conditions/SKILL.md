---
name: system-conditions
description: "Authoritative design system conditions and brand specifications: exact brand and neutral color palette (#2563eb, #1e40af, #dcfce7, #16a34a, #ea580c, #7c3aed, #000000 to #ffffff), Satoshi 500 display & Inter UI typography, 4px base spacing, container border invariants (#e5e5e5), and strict Do/Don't visual constraints."
version: 1.0.0
---

# System Design Conditions & Brand Specifications

An authoritative design specification and enforcement skill that sets the exact visual standards, palette tokens, typography rules, spacing geometry, and component constraints for the entire platform.

---

## 1. Color Palette

### Brand Colors
The brand colors deliver clarity and decisive action across all screens.

| Token | Hex | Role & Usage Rule |
| :--- | :--- | :--- |
| **Electric Blue** | `#2563eb` | Primary brand color — logo, links, key metric highlights, active states, icon accents. Saturated blue against white gives the system its one moment of visual voltage. |
| **Deep Sapphire** | `#1e40af` | Primary action button background, high-emphasis CTA fill — the single committed action color, used sparingly so it earns attention. |

### Accent Colors
Accents provide subtle nuance and clear categorization. They are supporting accents, never primary surface fills.

| Token | Hex | Role & Usage Rule |
| :--- | :--- | :--- |
| **Soft Mint** | `#dcfce7` | Gray outline accent for tags, dividers, and focused UI edges. Use as a supporting accent, not as a status color. |
| **Vivid Green** | `#16a34a` | Green text accent for links, tags, and emphasized short phrases. Supporting accent, not a status indicator. |
| **Tangerine** | `#ea580c` | Orange text accent for links, tags, and emphasized short phrases. |
| **Lavender** | `#7c3aed` | Violet text accent for links, tags, and emphasized short phrases. |
| **Conic Spectrum** | *Gradient* | Decorative gradient — used as a full-spectrum conic gradient on brand visuals and logo only. **Never on UI elements**. |

### Neutrals (The Structural Backbone)
Neutrals define all surfaces, containers, dividers, and reading typography.

| Token | Hex | Role & Usage Rule |
| :--- | :--- | :--- |
| **Primary Action Fill** | `#000000` | High-contrast neutral action fill for primary buttons on light surfaces. Use as the primary filled action background. |
| **Midnight Ink** | `#0a0a0a` | Primary button text, high-emphasis buttons, nav text — near-black for maximum contrast. |
| **Charcoal** | `#171717` | Body text, button text, default heading color — slightly softer than pure black. |
| **Graphite** | `#262626` | Secondary text, icon strokes, subtle UI elements. |
| **Slate** | `#404040` | Tertiary text, nav hover states, subdued iconography. |
| **Steel** | `#525252` | Muted body text, helper text, less-prominent labels. |
| **Fog** | `#737373` | Placeholder text, disabled states, link text in rest state. |
| **Silver** | `#a3a3a3` | Disabled iconography, decorative strokes, very light dividers. |
| **Pebble** | `#c8c8c8` | Medium-contrast borders, control outlines, and structural separators. Do not promote it to the primary CTA color. |
| **Smoke** | `#d4d4d4` | Stronger borders for emphasis containers and secondary button outlines. |
| **Ash** | `#e5e5e5` | Hairline borders on cards, inputs, and dividers — the structural line that holds the system together. |
| **Paper Mist** | `#f5f5f5` | Subtle alt-surface for nested cards, secondary panels, and hover fills. |
| **Canvas White** | `#ffffff` | Page background, card surfaces, popover panels — the absolute base of every screen. |

---

## 2. Typography & Typographic Scale

### Scale Rationale
- **Ratio**: Major Second (`1.125`) based on a `14px` base.
- **Hierarchy Structure**:
  - `48px`: `48px · 500 · 1.0` (Display Hero)
  - `40px`: `40px · 500 · 1.05` (Major Section Display)
  - `36px`: `36px · 500 · 1.11` (Page Title Display)
  - `30px`: `30px · 600 · 1.2` (Sub-display Headline)
  - `24px`: `24px · 600 · 1.25` (Card & Section Headline)
  - `20px`: `20px · 600 · 1.3` (Sub-section Header)
  - `16px`: `16px · 400/500 · 1.5` (Canonical Body Text)
  - `14px`: `14px · 400/500/600 · 1.43` (Dense Data, Table Rows, Inputs)
  - `12px`: `12px · 500/600 · 1.33` (Badges, Micro-labels, Captions)
  - `11px`: `11px · 600 · 1.3` (Timestamps, Secondary Metadata)

### Font Families & Strict Usage Boundaries

#### 1. Display Headings: Satoshi
- **Weight**: `500` (Medium) — confident and modern without shouting.
- **Sizes**: `36px`, `40px`, `48px`.
- **Line Height**: `1.0` to `1.11`.
- **Letter Spacing**: `normal`.
- **Fallback**: `Inter` (weight `500`, `letter-spacing: -0.02em`) or `General Sans`.
- **Strict Rule**: Satoshi is display-only (36px and above). **Never use Satoshi at body sizes (< 30px)**.

#### 2. Body & UI: Inter
- **Weights**: `400` (Default body), `500` (Emphasis & buttons), `600` (Important UI labels).
- **Sizes**: `8px` to `30px` (11 distinct values).
- **Line Height**: `1.33` to `1.56`.
- **Canonical Body**: `16px` at `line-height: 1.5` (the primary rhythm anchor).
- **Dense Data**: `14px` at `line-height: 1.43`.
- **Micro-labels**: `11px` to `12px`.

#### 3. Code & Technical Metadata: Geist Mono
- **Weights**: `400`, `500`.
- **Sizes**: `12px`, `14px`, `24px`.
- **Line Height**: `1.0` to `1.43`.
- **Fallback**: `JetBrains Mono` or `IBM Plex Mono`.
- **Role**: Code snippets, hashes, technical metadata, document version IDs.

---

## 3. Spacing & Shape Geometry

### Spacing Grid
- **Density**: `compact`.
- **Base Unit**: `4px`.
- **Max Container Width**: `1200px`.
- **Section Gap**: `64px` (`gap-16` / `space-y-16`).
- **Card Padding**: `16px` (`p-4` / `p-5`).
- **Element Gap**: `8px` (`gap-2`).

### Border Radius Vocabulary
Only the following border radii are permitted:

| Element Type | Value | Tailwind Equivalent |
| :--- | :--- | :--- |
| **Inputs & Textareas** | `6px` | `rounded-[6px]` or `rounded-md` |
| **Buttons & Action Triggers** | `8px` | `rounded-[8px]` or `rounded-lg` |
| **Cards & Content Panels** | `12px` | `rounded-[12px]` or `rounded-xl` |
| **Large Feature Cards & Modals** | `16px` | `rounded-[16px]` or `rounded-2xl` |
| **Tags, Badges, Pills & Indicators** | `9999px` | `rounded-full` |

> **Ad-hoc Rounding Rule**: Any radius outside `6px`, `8px`, `12px`, `16px`, or `9999px` is strictly forbidden.

---

## 4. Elevation & Container Boundary Rule

- **Hairline Borders Over Heavy Shadows**: Containers and cards rely on a `1px` solid border (`#e5e5e5` / `border-ash` or `border-border`) rather than simulated depth.
- **Harsh Drop Shadows Forbidden**: Do not use heavy black or high-blur drop shadows for card elevation.
- **Ambient Micro-Lift**: When hovering cards or interactive panels, apply subtle micro-shadow (`shadow-xs` / `shadow-2xs`) or gentle hairline shift, never solid dark shadows.

---

## 5. Non-Negotiable System Invariants (Do's & Don'ts)

### DO
1. **Use `#e5e5e5` (Ash)** for all container borders — 1px solid is the default structural line, not shadows.
2. **Reserve `#1e40af` (Deep Sapphire)** for exactly one primary action per surface — never use it decoratively.
3. **Use Satoshi weight 500** at 36–48px for display headlines; switch to Inter for everything 30px and below.
4. **Use 9999px radius** for all tags, badges, and pill-shaped indicators; `8px` for buttons; `12px` for cards; `16px` for large feature cards; `6px` for inputs.
5. **Use 16px as the canonical body text size** with `line-height: 1.5`; drop to `14px` for dense data and `11–12px` for micro-labels.
6. **Apply the soft tint palette** (`#dcfce7` mint, `#dbeaff` blue, light yellow) to small badge backgrounds and feature highlights — not to large surfaces.
7. **Keep imagery as product UI mockups and desaturated logos**; avoid stock photography and decorative illustrations.
8. **Re-use existing drafts**: Opening or saving a document must update the single active draft in place, preventing duplicate draft records.

### DON'T
1. **Don't use heavy drop shadows** for card elevation — the system relies on 1px borders, not depth, to define containers.
2. **Don't use pure black (`#000000`) for body text** — use `#171717` (Charcoal) or `#0a0a0a` (Midnight Ink) for softer, readable contrast.
3. **Don't apply Electric Blue (`#2563eb`) to large background fills** — it is a highlight color for links, key metrics, and icon accents, not a surface backdrop.
4. **Don't use multiple chromatic colors on a single component** — each pill or feature tag gets exactly one accent.
5. **Don't use Satoshi at body sizes** — Satoshi is display-only (36px+); Inter handles everything below 30px.
6. **Don't use radii outside the defined vocabulary** (`9999px`, `16px`, `12px`, `8px`, `6px`) — ad-hoc rounding breaks the system's geometric rhythm.
7. **Don't use color for decorative gradients on UI elements** — the conic spectrum gradient is reserved for the logo and brand visuals only.

