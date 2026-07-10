# Architectural Patterns

## Purpose
Maintain consistent coding patterns and structure throughout the React project.

---

# 1. Component Composition
- Keep components small and focused on a single responsibility.
- Use established wrappers to handle business logic. For example:
  - `ProtectedRoute`: Wraps routes requiring specific role authentication.
  - `PhaseGuard`: Wraps components that depend on specific OJT phases.

---

# 2. Routing Hierarchy
- Follow the established `react-router-dom` object layout defined in `App.tsx`.
- Keep role-specific routes grouped under their respective path bases (`/admin`, `/adviser`, `/student`).

---

# 3. Tailwind Utilities
- Always use the `cn()` utility (`import { cn } from '@/src/lib/utils'`) when combining static and dynamic Tailwind classes.
- This ensures that conflicting classes (like `px-2` and `px-4`) are correctly merged by `tailwind-merge`.
