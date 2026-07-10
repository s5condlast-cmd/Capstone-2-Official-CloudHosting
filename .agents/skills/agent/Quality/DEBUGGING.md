# Debugging Guidelines

## Purpose
Effectively troubleshoot and fix issues within the Vite, React, and Tailwind ecosystem.

---

# 1. Vite & React
- Watch the Vite console logs for Hot Module Replacement (HMR) errors or syntax failures.
- Use React DevTools to inspect component trees and ensure props are passed down correctly.

---

# 2. Routing & Authentication
- If a page fails to load or redirects unexpectedly, verify the `ProtectedRoute.tsx` wrapper and ensure the `allowedRole` matches the current session.
- Check `localStorage` for the `'practicum_session'` key. If authentication is failing, simulate a login to reset the session state.

---

# 3. Styling & Tailwind
- Use the browser's element inspector to debug styling issues.
- When dynamic classes are failing to apply, ensure you are using the `cn()` utility (`clsx` + `tailwind-merge`) from `src/lib/utils.ts` to prevent class conflicts.
- Verify that dark mode classes (`dark:`) are explicitly defined where needed.
