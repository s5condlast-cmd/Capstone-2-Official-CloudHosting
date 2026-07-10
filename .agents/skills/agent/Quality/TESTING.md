# Testing Guidelines

## Purpose
Ensure code quality and layout stability using the current project setup.

---

# 1. Type Checking
Always run TypeScript compilation checks before finalizing an implementation to ensure no type errors have been introduced.
Run: `npm run lint` (which executes `tsc --noEmit`).

---

# 2. Manual Verification
As there is currently no automated testing framework (like Vitest or Jest) installed, you must rely on manual verification:
- Test functionality directly in the browser preview.
- Ensure that form inputs, buttons, and routing work as expected.
- Check both light and dark modes to ensure visual consistency.

---

# 3. Print Layout Testing
When modifying document layouts or PDF generation features:
- Ensure `.doc-preview-paper` margins and paddings are not pushing content into extra blank pages.
- Verify that `box-sizing: border-box` is respected.
- Ensure that the browser's native `window.print()` handles interactive elements properly (e.g., hiding edit buttons, removing backgrounds for ink-saving).
