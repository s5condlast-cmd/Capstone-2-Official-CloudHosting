# Security Guidelines

## Purpose
Safeguard the application against common vulnerabilities and ensure proper access control.

---

# 1. Role-Based Access Control (RBAC)
- Always enforce page-level access control using the `ProtectedRoute` component.
- Ensure the `allowedRole` prop correctly restricts views to `admin`, `adviser`, or `student`.

---

# 2. Authentication & Session
- Understand that the current authentication system is a prototype relying on `localStorage` (`practicum_session`).
- Do not store highly sensitive secrets or tokens in plain text in local storage in a production environment.

---

# 3. Input Sanitization
- Rely on React's native data binding (`{value}`) which automatically escapes strings to prevent Cross-Site Scripting (XSS).
- Avoid using `dangerouslySetInnerHTML` unless absolutely necessary and paired with a robust HTML sanitizer.
