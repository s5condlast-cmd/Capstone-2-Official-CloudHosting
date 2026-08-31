---
name: alignment-auditor
description: Comprehensive diagnostic and auditing skill to detect, debug, and resolve code syntax errors, layout/motion misalignments, CSS-JS transition conflicts, Supabase connection failures, and state hydration issues.
version: 1.0.0
---

# Alignment & Integrity Auditor Skill

The **Alignment Auditor** is a specialized diagnostic and quality-assurance skill designed to systematically scan, debug, and resolve visual misalignments, animation conflicts, syntax/type errors, network/connection failures, and data sync issues across the application.

---

## 1. Visual & Motion Alignment Diagnostics

### A. The "CSS Transition vs. JS Transform" Trap
* **Symptom**: Elements lag behind scroll, bounce in reverse, or appear to move *inside/underneath* preceding elements.
* **Root Cause**: An element undergoing active JavaScript/RAF transform updates (e.g., `translate3d`, `scale`, `rotate`) has a CSS transition applied (such as Tailwind's `transition-all` or `transition-transform`). The browser interpolates every frame with a delay (e.g., 300ms), breaking synchronous positioning.
* **Audit & Fix**:
  1. Inspect animated wrappers for `transition-all`, `transition-transform`, or `transition: all`.
  2. Scope transitions strictly to color/opacity properties on hover: `transition-colors duration-200` or `transition-opacity`.
  3. Ensure JS-driven animated elements explicitly declare `card.style.transition = 'none'` during scroll loops.

### B. Scroll Engine Collisions
* **Symptom**: Stuttering scroll, jittery card snapping, or erratic scroll wheel acceleration.
* **Root Cause**: Conflicting scroll engines running simultaneously—such as CSS `scroll-behavior: smooth` in stylesheets fighting a JavaScript smooth-scrolling engine like **Lenis** or GSAP ScrollTrigger.
* **Audit & Fix**:
  1. Remove `scroll-behavior: smooth;` from the CSS scroller when Lenis is active.
  2. Ensure only one engine controls wheel events and frame-by-frame interpolation.

### C. Stacking Context & Layer Inversion (`z-index`)
* **Symptom**: Incoming cards or overlays render behind stationary elements or clip beneath parent containers.
* **Root Cause**: Missing explicit `zIndex` assignments or parent elements having `overflow: hidden` / `transform-style: flat` flattening 3D stacking contexts.
* **Audit & Fix**:
  1. For stacking cards or sequential layers, assign explicit sequential `zIndex`: `card.style.zIndex = `${i + 1}``.
  2. Verify parent containers allow 3D depth: `transform-style: preserve-3d` and `perspective: 1000px`.

### D. Zero-Height & Container Collapse
* **Symptom**: Document viewers (e.g., `@embedpdf/react-pdf-viewer`, `docx-preview`, Canvas) render as blank black/white boxes (0px height).
* **Audit & Fix**:
  1. Explicitly assign `className="w-full h-full"` and `style={{ width: '100%', height: '100%' }}` directly on the viewer wrapper.
  2. Override library hardcoded widths (e.g., `[&_section]:!w-full [&_section]:!max-w-full [&_section]:!box-border`).

---

## 2. Code Syntax & Type Integrity Checks

### A. TypeScript Zero-Error Gatekeeping
* **Protocol**: Run `npm run lint` (`tsc --noEmit`) before completing any task.
* **Common Failures & Remediation**:
  * `Cannot find name 'cn'`: Ensure `import { cn } from '@/src/lib/utils';` is present.
  * React 19 Motion Props: Never extend `React.ButtonHTMLAttributes` or `React.HTMLAttributes` directly on `motion.*` components due to `onAnimationStart` signature conflicts. Use `Omit<HTMLMotionProps<'button'>, 'ref' | 'children'>`.
  * Unclosed JSX tags: Check self-closing elements (`<img ... />`, `<input ... />`).

### B. Module & Library Resolution
* **Static vs. Dynamic Imports**:
  * Always use static imports for core utilities (e.g., `import JSZip from 'jszip'`).
  * Never use dynamic runtime imports `await import('jszip')` inside document generators as Vite bundling may fail silently.

---

## 3. Connection, Network & Supabase Health Checks

### A. Supabase Client & Environment Integrity
* **Audit**:
  1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present and correctly formatted in `.env`.
  2. Ensure the Supabase client (`src/lib/supabase.ts`) exports a unified singleton instance.

### B. RLS Authorization & InitPlan Performance
* **Audit**:
  1. **Security**: Never check `user_metadata` in RLS policies or trigger functions. Always use `auth.uid()` or protected JWT claims via `(SELECT auth.jwt() -> 'app_metadata' ->> 'role')`.
  2. **Performance**: Wrap `auth.uid()` as `(SELECT auth.uid())` so Postgres calculates user identity once per query instead of re-evaluating per row.

### C. Storage Bucket & File Access Alignment
* **Audit**:
  1. Verify user submission buckets do NOT have public `SELECT` listing enabled.
  2. Provide `INSERT` permissions for student uploads, restrict `SELECT` to authenticated staff, and rely on public/signed CDN URLs for file viewing.

---

## 4. Data State & Hydration Alignment

### A. Single Source of Truth
* **Rule**: Never mix mock data arrays with live database queries on the same page.
* **Lifecycle**:
  $$\text{Mount} \longrightarrow \text{loading = true} \longrightarrow \text{Fetch Supabase} \longrightarrow \text{loading = false} \longrightarrow \text{Database Data} \lor \text{EmptyState}$$
* **Fail Safe**: If a database record is not found, render `src/components/ui/EmptyState.tsx`. Never silently fall back to mock data.

### B. Export & Document Generation Alignment
* **Word (DOCX)**: Use `TreeWalker` to extract blanks (`_{3,}`), dates (`Date:`), and `<TAGS>` without adding interactive styling to read-only previews.
* **Excel (XLSX)**: Use dark ink luminance filtering (`alpha > 30 && (r < 200 || g < 200 || b < 200)`) for canvas signature cropping and anchor exactly 1:1 on cell boundaries (`col: 6.0` to `7.0`).

---

## 5. Rapid Diagnostic Triage Runbook

When any misalignment, visual bug, or error occurs, execute this 4-step triage sequence:

```text
STEP 1: Check Compilation & Typings
  └─ Run `npm run lint` (tsc --noEmit) to detect syntax, prop, or import errors.

STEP 2: Inspect CSS & Animation Conflicts
  └─ Search for `transition-all`, `transition-transform`, or `scroll-behavior: smooth` on active RAF/Lenis elements.
  └─ Verify `zIndex` sequential ordering and `card.style.transition = 'none'`.

STEP 3: Validate Supabase & Network State
  └─ Check console/network requests for 401/403 RLS rejections or 404 missing bucket files.
  └─ Verify environment keys and auth session validity.

STEP 4: Verify Single Source of Truth
  └─ Confirm data originates from Supabase database state rather than hardcoded mock objects.
```
