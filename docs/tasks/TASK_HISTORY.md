# Task History & Changelog

A historical record of completed tasks, refactors, bug fixes, and architectural milestones for the **Capstone-2 CloudHosting OJT Management System**.

---

## 📅 September 2, 2026

### 🗓️ Add Event Modal & Date/Time Picker Polish
- [x] **shadcn DatePickerSimple Integration**:
  - Connected shadcn `<Popover>` + `<Calendar mode="single" captionLayout="dropdown" />` to the Add Event form.
  - Set default unselected state to `"Select date"` in muted placeholder typography until picked.
  - Synchronized date selection to update the event date instantly and close the popover.
- [x] **Interactive Month & Year Dropdowns**:
  - Added full 12-month selection (`Jan`–`Dec`) and 2020–2040 year range support in `components/ui/calendar.tsx`.
  - Fixed pointer event bug where the absolute navigation container (`nav`) blocked dropdown clicks: set `pointer-events-none` on `nav` and `pointer-events-auto` on arrows & dropdowns.
  - Sized and styled dropdown pills matching exact shadcn visual design with generous `p-4` popover padding.
- [x] **Time Field Formatting**:
  - Removed `step="1"` to eliminate seconds (`:00`) display, restricting input to clean hours and minutes (`10:30 AM`).
  - Set initial time to empty (`--:-- --`) so it doesn't pre-fill with forced values.
- [x] **Modal Form Simplification**:
  - Removed redundant Category dropdown from the Add Event dialog modal for faster event creation.
  - Preserved category filter cards on the main calendar view.

---

### 📱 Calendar Mobile Responsiveness
- [x] **Adaptive Heights**: Converted fixed `h-[calc(100vh-5.2rem)]` on mobile to adaptive `h-auto lg:h-[calc(100vh-5.2rem)]`.
- [x] **2-Row Responsive Toolbar**: Compact 2-row layout on mobile phones (`Today`, nav arrows, and title on top row; `+ Add Event` and view switcher on bottom row).
- [x] **Mobile Month View**: Replaced overflowing text with clean day numbers and colored category dot badges (`size-1.5 rounded-full`), plus a 1-tap **Selected Day Events List** underneath.
- [x] **Touch-scrollable Week View**: Wrapped week grid in `overflow-x-auto min-w-[520px]` container for smooth horizontal touch swipe.
- [x] **Fixed `isSameDayDate` Reference Error**: Hoisted top-level date comparison function with safe null checks.

---

## 📅 September 1, 2026

### 🎨 Calendar Page Alignment & UI Restoration
- [x] **Restored Sidebar Mini Calendar**: Re-implemented standard shadcn `<Calendar />` in sidebar.
- [x] **Circular Category Check Badges**: Converted rectangular badges to clean circular check chips matching shadcn design tokens.
- [x] **Editorial Header Typography**: Split header date into bold modern month/year typography.
- [x] **Header & Sidebar Cleanup**: Removed user email from header and navigation sidebar for a clean minimal layout.
- [x] **Expanded Search Palette**: Widened search command palette button for better touch targets and desktop accessibility.
- [x] **Sidebar Width Fix**: Fixed TypeScript error TS2451 by removing duplicate `SIDEBAR_WIDTH` declaration in `components/ui/sidebar.tsx`.

---

### 🚀 Git & Deployment
- [x] **Authorized Repository Push**: Staged, committed, and pushed 69 clean files to `origin/feature/landing-page-fixes` following explicit user authorization (`/push`).

---

## 📌 Upcoming Tasks
- [ ] **Role Dashboards Redesign (Option A)**:
  - [ ] Admin Dashboard (Cards, interactive metrics, activity table)
  - [ ] Student Dashboard (Progress metrics, quick requirements, submissions)
  - [ ] Adviser Dashboard (Pending reviews, student roster, approval queue)
  - [ ] Supervisor Dashboard (DTR approvals, evaluations, attendance charts)

