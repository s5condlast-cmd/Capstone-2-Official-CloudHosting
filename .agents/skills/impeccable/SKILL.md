---
name: impeccable
description: "Pixel-perfect precision and high-fidelity frontend craft. Enforces microscopic layout alignment, optical sizing, fluid typography, zero layout shift, and tactile feedback."
version: 1.0.0
---

# Impeccable Design & Engineering Skill

A relentless focus on **flawless execution, microscopic precision, and high-fidelity polish**. Where `taste-design` establishes the vision, `impeccable` guarantees zero-defect engineering and tactile perfection.

---

## The 6 Pillars of Impeccable Craft

### 1. Pixel-Perfect Alignment & Baseline Precision
- **Optical vs. Geometric Centering**:
  - Icons alongside text must be optically centered (`translate-y-[0.5px]` or flexbox `items-center` with explicit sizing).
  - Badges and pills must have balanced vertical padding that accounts for font cap-height.
- **Consistent Grid Rhythms**: Stick strictly to an 8-point / 4-point spacing scale (`p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`, `p-12`).

### 2. Zero Layout Shift (CLS = 0)
- **Explicit Media & Viewer Dimensions**:
  - All images, canvas containers, and `<PDFViewer>`/`<DocxViewer>` instances MUST have explicit width/height constraints or aspect-ratio boxes.
- **Skeleton & Loading States**:
  - Skeletons must mirror the exact dimensions, line-heights, and border-radii of the target content to eliminate jumping on data hydration.

### 3. Touch Target Ergonomics & Accessibility
- **Minimum Interactive Dimensions**: All buttons, icon buttons, and navigation anchors must meet the 44×44px touch target guideline (using padding or pseudo-elements if visual size is compact).
- **Keyboard Navigation & Focus Rings**:
  - Clear, customized focus rings (`focus-visible:ring-2 focus-visible:ring-primary/30 focus:outline-none`).
  - Standardized `tabIndex` and keyboard handlers (`Enter`, `Space`, `Escape`, `ArrowLeft`/`ArrowRight`).

### 4. Fluid Typography & Sub-Pixel Anti-Aliasing
- **Font Smoothing**: Enforce `antialiased` rendering on all text surfaces.
- **High-DPI Clarity**: Never allow blurry vector rasterization; SVG elements must use crisp viewport dimensions and `shape-rendering: geometricPrecision`.

### 5. 60–120fps Hardware Acceleration
- **Composite Layers**:
  - Use `transform-gpu` and `will-change-transform` on frequently animated elements.
  - Animate strictly `transform` and `opacity` to avoid browser layout re-calculations (reflows).
- **Smooth Easing Curves**:
  - Standardize on `cubic-bezier(0.16, 1, 0.3, 1)` or spring physics for seamless acceleration and gentle deceleration.

### 6. Tactile Polish Checklist
- [x] Hover elevation with realistic multi-step drop shadows.
- [x] Active pressed-down physics (`active:scale-[0.98]`).
- [x] Disabled state clarity (`disabled:opacity-40 disabled:cursor-not-allowed`).
- [x] Tooltip / popover positioning without clipping viewport edges.
- [x] Dark/light theme contrast ratio passing WCAG AA (min 4.5:1 for body, 3:1 for large text).
