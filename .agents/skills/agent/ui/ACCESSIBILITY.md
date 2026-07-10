# Accessibility Guidelines

## Purpose
Ensure the application is usable for everyone, including keyboard users and screen readers.

---

# 1. Semantic HTML
- Use proper HTML5 tags (`<article>`, `<section>`, `<nav>`, `<aside>`) to structure the page.
- Avoid using `<div>` for interactive elements; use `<button>` or `<a>` to ensure proper focus states and keyboard accessibility.

---

# 2. Icons & Labels
- When using `lucide-react` icons, accompany them with descriptive text whenever possible.
- If an icon is used as a standalone button (e.g., a trash can or edit pencil), always provide an `aria-label` or `title` attribute.

---

# 3. Contrast & Visibility
- Verify that text colors pass contrast requirements against their backgrounds.
- Always check both light mode (e.g., `text-zinc-900`) and dark mode (e.g., `dark:text-zinc-100`) to ensure legibility across themes.
