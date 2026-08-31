---
name: systematic-debugging
description: "The gold-standard 4-phase root-cause isolation and debugging protocol. Forbids trial-and-error edits, enforces rigorous dataflow tracing, reproduces errors, and verifies fixes with automated checks."
version: 1.0.0
---

# Systematic Debugging Protocol

The **Systematic Debugging Protocol** is the industry-standard engineering runbook designed to isolate and eliminate software defects, visual glitches, layout misalignments, and runtime errors without guesswork.

---

## The Prime Directive: Never Guess, Always Trace

> [!CAUTION]
> **Strict Rule**: You are strictly forbidden from applying speculative "trial-and-error" edits. Before modifying any code, you must systematically trace the execution flow, identify the exact root cause, and prove why the failure is occurring.

---

## The 4-Phase Debugging Lifecycle

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   1. REPRODUCE  │ ──> │    2. TRACE     │ ──> │   3. ISOLATE    │ ──> │   4. VERIFY     │
│  State & Scope  │     │ Dataflow & RAF  │     │ Exact Root Line │     │ Automated Lint  │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

### Phase 1: Reproduce & Scope
1. **Identify the exact trigger**:
   - What user action initiates the bug? (e.g., scrolling past 200px, clicking a submit button, loading on a 1536×695 viewport).
2. **Determine the rendering channel**:
   - Web application React preview?
   - Downloaded DOCX or exported PDF document?
   - Supabase network API call?

---

### Phase 2: Trace the Execution Pipeline
1. **Frontend & Animation Trace**:
   - Inspect CSS properties for animation lag (`transition-all`, `transition-transform` on elements driven by JavaScript `requestAnimationFrame`).
   - Check if multiple smooth-scroll engines are active simultaneously (CSS `scroll-behavior: smooth` vs. Lenis/GSAP).
   - Check stacking contexts and sequential `zIndex` values.
2. **Backend & Network Trace**:
   - Inspect network request/response payloads, status codes (401 RLS denial, 404 missing resource), and latency.
   - Inspect auth token claims and session expiration.
3. **Data Hydration Trace**:
   - Check component state lifecycles: `loading -> fetch -> data OR EmptyState`.
   - Ensure single source of truth (no hardcoded mock arrays mixed with live queries).

---

### Phase 3: Root-Cause Isolation
1. Formulate a single, falsifiable hypothesis:
   - *"The card lags because Tailwind's `transition-all duration-300` forces a 300ms delay on every RAF `translate3d` calculation."*
2. Confirm the hypothesis by inspecting the exact lines of code.
3. Implement the minimal, clean, non-breaking fix.

---

### Phase 4: Verification Gatekeeping
1. **Automated Compiler Check**:
   - Run `npm run lint` (`tsc --noEmit`) to verify 0 syntax, type, or import errors.
2. **Regression Check**:
   - Confirm that related components, exports, or styles remain fully functional and uncorrupted.
3. **Walkthrough & Log**:
   - Document the root cause, what was changed, and how it was verified.
