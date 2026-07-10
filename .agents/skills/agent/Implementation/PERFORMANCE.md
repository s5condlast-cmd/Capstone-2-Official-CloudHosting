# Performance Guidelines

## Purpose
Ensure the application runs smoothly and efficiently, leveraging React and Vite optimizations.

---

# 1. Rendering Optimization
- Rely on React 19's native optimizations, but be mindful of large component trees.
- Use `useMemo` and `useCallback` when passing complex objects or functions to deeply nested child components to prevent unnecessary re-renders.

---

# 2. Animations
- When using `motion/react` (Framer Motion), stick to simple entrance and exit animations (`opacity`, `y` translation).
- Avoid animating properties that trigger heavy browser layout recalculations (like `width`, `height`, or `margin`).

---

# 3. Build & Import Efficiency
- Keep imports clean and direct to benefit from Vite's fast esbuild bundling.
- Avoid importing entire massive libraries if only a single utility is needed.
