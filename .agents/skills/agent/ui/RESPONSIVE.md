# Responsive Design Guidelines

## Purpose
Ensure the UI adapts flawlessly from mobile devices to large desktop screens using Tailwind CSS.

---

# 1. Mobile-First Approach
- Always write base Tailwind classes for mobile devices first.
- Scale up for larger screens using standard breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.
- Example: `flex-col md:flex-row`.

---

# 2. Layout Structures
- Prefer `flex` and `grid` layouts over fixed positioning.
- Use `gap-` utilities to manage spacing instead of margin hacks.
- For grid layouts changing by device: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

---

# 3. Preventing Overflow
- Avoid horizontal scrolling at all costs.
- Ensure long text in buttons or input fields has `flex-wrap` or `break-words`.
- For print-specific views, ensure `display: inline` is used for form values to allow them to wrap naturally like text.
