# Google Docs reference layout adapted to the practicum editor

Date: 2026-09-18. Status: implementation plan only.

Visual reference: the Google Docs screenshot supplied by the user in this conversation. This screenshot, rather than a changing live Google Docs interface, defines the target arrangement. The title/header area is cropped; the proposed title row below is an adaptation for our system.

## Required result

Recreate the screenshot's compact menu row, single-row rounded formatting toolbar, left document navigation, white paper canvas, and right comment rail. Keep the practicum system's identity, theme selection, official templates, draft persistence, history, role permissions, review, and submission workflow.

**Menu order: File, Edit, View, Insert, Format, Tools. Extensions and Help are absent at every screen size.**

**The up-arrow/chevron immediately to the right of Editing is the fullscreen toggle.** It expands the whole editor workspace to fill the application viewport. It never collapses the toolbar. Its tooltip and accessible name explicitly say “Enter fullscreen” or “Exit fullscreen”.

This is a UI workstream under the [production and document-fidelity plan](RICH_EDITOR_PRODUCTION_PLAN.md). Visual similarity does not replace the DOCX/PDF release gates in that plan.

## Current implementation to reuse

- `StudentDocumentEditor.tsx` owns title, save status, exports, history, submission, and document role/mode state.
- `plate-editor.tsx` hosts Plate, paper, header/footer editing, comments, zoom, and an application fullscreen state with Escape handling.
- `fixed-toolbar.tsx` implements a horizontally scrolling toolbar; `fixed-toolbar-buttons.tsx` groups formatting controls and places mode/fullscreen at the end. Audit active component exports before refactoring this large file.
- `editor-commands.ts` is the shared formatting command entry point. Existing small toolbar components can be reused behind the new layout.
- Header/footer envelope persistence and submission serialization have changed since the earlier plan: current page code wires `onHeaderFooterChange`, unwraps stored envelopes, and passes header/footer settings to submission. Verify these paths rather than treating the earlier gaps as still unimplemented.
- Current comments use browser `localStorage` keys based on draft IDs. This is not shared reviewer synchronization and must be replaced before presenting comments as synchronized.
- Current reviewer UI detection includes a `mode=review` query parameter. UI mode selection must never grant edit/comment access; effective capabilities must come from authenticated server permissions and document state.

No current-browser visual score is claimed: this pass inspected the screenshot and source, not a running authenticated editor.

## Layout specification

| Region | Reference treatment | Adaptation and behavior |
| --- | --- | --- |
| Title/action row | Compact document identity above the menus; mostly outside the supplied crop | Back to repository, editable title, template/form code, save/lock status, History, and Submit. Use Duplicate as Draft for locked student submissions. |
| Menu row | Plain horizontal text menus close to the toolbar | Exactly the six approved menus. Reuse existing command handlers rather than maintaining separate menu behavior. |
| Formatting toolbar | Pale rounded strip spanning the workspace, compact icons and thin separators | About 48px high, 20px outer desktop inset, 24px radius, 18–20px icons and consistent 32px desktop control targets. One row at the reference width. |
| Left navigation | Back/collapse control, document navigation title, active rounded row, subordinate headings | Use “Document outline”, an active row showing the current document title, and a live heading tree. Template name/form code appears as metadata. A menu offers existing rename/duplicate actions when permitted. |
| Paper workspace | White rectangular paper, subtle 1px edge, very light surrounding canvas | Match the page appearance, but derive width, margins, and font from the actual official template. Dark theme changes the surrounding UI; the default document preview stays paper-white. |
| Comments | Soft comment cards on a right rail with avatar, author, time, and text | Show real persisted comments, anchor highlights, replies, and resolve state. The rail appears when comments exist or is opened deliberately. |
| Right-end toolbar controls | Editing dropdown, separator, up-chevron | Keep this cluster pinned and visible, with fullscreen last. Formatting overflow must not displace it. |

The screenshot is approximately 1917×765, with a left rail near 330px, paper from approximately x=375 to x=1397, and comments beginning near x=1428. Use these as visual proportions, not physical page measurements: browser zoom/device scale is unknown. At 100% application zoom, a Letter page is 816 CSS px wide; an A4 page follows its actual dimensions. Never widen the document's text area just to fill the screen.

Start with a 240–280px left rail, a 300–360px right rail, and 24–32px gutters at ordinary desktop widths. Scale rail allocation toward the reference proportions on wide screens. Center the page within the remaining document workspace; when rails close, recenter without changing the stored document geometry.

Use existing UI typography and semantic theme tokens. Match reference density, alignment, spacing, borders, and hover treatment while keeping our theme's active color and STI identity. Document fonts remain independent of UI fonts. No Google logo, account controls, Meet, or Google-specific sharing behavior is needed.

### Navigation decision

Our current unit of storage/submission is one draft/document. The screenshot's document-tab feature must not introduce hidden multiple bodies into that model. Ship the reference-style left navigation as a functional document outline: headings link to stable node IDs, follow heading order, and update after edits/undo/restore. Clicking a heading scrolls to it without modifying content. Empty documents show a short outline hint.

Do not display a nonfunctional plus button or a fake “Tab 1”. If true multi-tab documents are requested later, specify tab IDs, ordering, persistence, per-tab sections, combined export order, and submission semantics before enabling them. The outline rail itself is part of this release.

## Menu-to-system mapping

| Menu | Items to expose | System contract |
| --- | --- | --- |
| File | New from template, Rename, Duplicate as Draft, Save version, Version history, Download DOCX/PDF, Final preview, Print, Page setup | Use current draft/history/template services and the shared artifact pipeline. Page setup respects template locks. Keep Submit as the visible primary title-row action. |
| Edit | Undo, Redo, Cut, Copy, Paste, Select all, Find and replace | Operate on the active Plate selection. Clipboard actions use supported browser interaction and show shortcut guidance if unavailable. No silent clipboard failures. |
| View | Editing/Viewing mode, Zoom/Fit page width, Outline, Comments, Ruler, Fullscreen | These are view preferences, not document edits. All fullscreen entry points share one state. |
| Insert | Image, Table, Link, Date, Page break, Header/Footer, Page number, Comment; template field/signature actions where allowed | Expose only features that persist and have a defined DOCX/PDF representation for this template. |
| Format | Paragraph style, Font, Size, Text formatting/colors, Alignment, Line/paragraph spacing, Lists/indents, Clear formatting | Use the same commands and selection state as toolbar controls; protect locked official styles/regions. |
| Tools | Word count, Document validation, permitted spelling tools and journal voice typing when supported | Validation reuses template rules. Do not imply that optional spellcheck, AI, or speech capabilities exist before they are wired and tested. |

Menu state must reflect permissions and the current selection. Hide unsupported product capabilities; disable temporarily unavailable actions with an understandable reason. Menus must support keyboard navigation and return focus to the originating control/editor selection.

## Toolbar order and interactions

Use the screenshot order from left to right:

1. Search/find, Undo, Redo, Print, spelling action if supported, Paint format.
2. Zoom, paragraph style, font family, decrement/font-size input/increment.
3. Bold, Italic, Underline, text color, highlight color.
4. Link, Add comment, Image.
5. Alignment, line/paragraph spacing, checklist if supported, bulleted list, numbered list, decrease/increase indent, Clear formatting.
6. Flexible space, Editing dropdown, separator, fullscreen up-chevron.

Move specialized controls such as table operations and signature fields into Insert or contextual toolbars. Keep one link insertion control. Exclude emoji, video/audio blocks, and disclosure toggles from official-template mode unless their export behavior is explicitly approved.

Paint format needs defined behavior: capture supported inline/paragraph formatting, apply it to the next valid selection, and exit; Escape cancels without altering content. Add it after the shared command tests, or withhold it until functional.

Formatting controls preserve selection when opening popovers and display mixed values correctly. Font-size input accepts points, validates supported limits, and uses the canonical unit conversion defined in the fidelity plan. Zoom changes only presentation. Switching to Viewing leaves navigation, comments permitted by role, preview, export, and fullscreen usable.

### Fullscreen acceptance contract

- The final toolbar control sits immediately after Editing and its separator. Default icon is the reference up-chevron; fullscreen uses a down-chevron or clear exit icon.
- Clicking it expands the editor workspace to the viewport, hiding the surrounding application sidebar/header. The document identity/status/actions, menus, formatting toolbar, paper, and open editor rails remain available.
- This is application fullscreen, consistent with the existing implementation; browser tabs/address bar remain under browser control. It does not change browser zoom.
- Clicking again restores the previous shell layout. Escape closes the topmost popover/dialog first; with no overlay open, Escape exits fullscreen.
- Preserve selection, caret, scroll position, zoom, active document, open rails, unsaved content, undo history, and save jobs. Never remount the Plate editor to enter/exit.
- Use one workspace-owned fullscreen state and one command for the arrow and View menu. Prevent background page scrolling, restore it on exit/navigation, and restore focus sensibly.
- Ensure menu portals, tooltips, comments, and dialogs appear above the fullscreen layer and remain keyboard accessible. Background application controls must not remain in the focus order.
- Accessible name and tooltip: “Enter fullscreen” / “Exit fullscreen (Esc)”; expose the toggle state. Remain usable on locked and viewing documents.
- Test repeated toggling, Escape, an open menu/dialog, pending autosave, an active comment, route exit, narrow screens, and locked documents.

## Synchronization and permissions

Keep one owner for document state in the editor workspace/page. Menus, toolbar, keyboard shortcuts, and contextual controls consume a common command registry with `execute`, `canExecute`, and active/mixed state. Avoid independently managed copies of title, content, header/footer options, zoom, or mode.

Persist comments in the backend with document/revision linkage, author identity, timestamps, reply threads, resolved state, and stable content anchors. Map anchors through edits; if a range is deleted, preserve the thread as an explicitly detached comment. Update other authorized clients through the existing supported sync approach, with refetch after reconnect. Do not claim live presence or multiplayer editing without implementing them.

Derive Editing/Viewing and comment permissions from server-authorized document capabilities. A submitted artifact stays immutable; reviewer edits, if the workflow permits them, create a separate revision or review draft. A query string cannot unlock the submitted body. Hide Suggesting until real tracked changes and accept/reject behavior are supported; review comments remain available independently.

Keep the full existing autosave/conflict/history envelope. Store view preferences separately from document content and scope them by user where persisted. Every DOCX/PDF menu, print preview, and submission uses the generation contract in the production plan; label existing browser print honestly while deterministic PDF export is pending.

## Responsive behavior

| Available editor width | Behavior |
| --- | --- |
| >= 1440px | Full six-menu row and single-row toolbar; outline and comment rails may both be open. Center paper in the available middle region. |
| 1024–1439px | Collapse lower-priority formatting into a More menu; allow one docked rail when needed for paper space. Editing/fullscreen remain pinned. |
| 768–1023px | Rails become drawers; prioritize style/font size/basic marks and route other commands to overflow. Keep menu commands reachable. |
| < 768px | Compact title/actions, accessible menu trigger containing the same six menus, formatting overflow, one overlay rail at a time, larger touch targets. |

Use available container width rather than assuming the whole browser width, because the system sidebar changes available space. Do not shrink text to make toolbar buttons fit. Keep at least 44px touch targets on touch layouts. Page zoom and workspace panning must not introduce horizontal overflow in the application shell. On very narrow screens offer fit-width preview and a usable editing zoom.

## Implementation sequence and deliverables

| Phase | Deliverable | Acceptance |
| --- | --- | --- |
| 1. Command and state integration | Inventory current controls; define shared command registry/capabilities; consolidate fullscreen/view state; recheck current envelope fixes | Menu/toolbar actions use the same handlers; no permission bypass or loss of state |
| 2. Workspace shell and menu row | Compact title row, six menus, theme-aware background, paper layout, shell fullscreen | Screenshot hierarchy matches; no Extensions/Help; arrow next to Editing toggles fullscreen |
| 3. Formatting toolbar | Reference ordering, dropdowns, pinned mode/fullscreen, responsive overflow | No duplicate actions, clipped controls, lost selection, or nonfunctional icons |
| 4. Outline and synchronized comments | Live heading navigation, real comment rail, backend threads/anchors/permissions | Outline tracks edits; comments survive reload and are visible to authorized reviewers |
| 5. Integration and visual verification | Screenshots, interaction tests, save/export/submission regression checks | Visual and functional checks below pass; document fidelity gates remain enforced |

Suggested new modules: `DocumentWorkspace.tsx`, `DocumentMenuBar.tsx`, `DocumentOutline.tsx`, `DocumentCommentsRail.tsx`, and a shared `document-commands.ts`/workspace view-state hook. Refactor existing `plate-editor.tsx`, `fixed-toolbar.tsx`, `fixed-toolbar-buttons.tsx`, and `StudentDocumentEditor.tsx` around these boundaries. Reuse `CommentsDrawer` content where appropriate. Avoid replacing Plate or the storage layer merely to change the layout.

Provisional effort: 8–13 engineering days for the shell, commands, toolbar, outline, and QA; another 4–7 days for synchronized anchored comments if that backend remains absent. These estimates overlap with the production plan's editing/comments work and must not be counted twice. DOCX/PDF fidelity work remains a separate dependency for production certification.

## Verification and definition of done

- Capture the implemented editor at the reference viewport and at 1440px, 1280px, 1024px, and 390px, with browser/device scale and application zoom recorded. Compare the screenshot's menu baseline, toolbar order/density, paper edge, rail proportions, and whitespace. Record deliberate differences: our identity, theme, document outline semantics, role actions, template geometry, and fullscreen behavior.
- Approve a project-specific visual baseline after those differences are accepted; use automated screenshot diffs against that baseline for regressions. Do not use an arbitrary global similarity percentage to hide shifted controls or incorrect document geometry.
- Verify every exposed menu/toolbar command, keyboard navigation, mixed formatting selections, undo/redo, ruler/zoom, and narrow-screen overflow. No inert buttons or unavailable mode promises.
- Test the fullscreen contract above, including opening menus and dialogs while fullscreen and returning to the same caret/scroll state.
- Test cloud save/reload, offline recovery, conflict handling, history restore, header/footer-only edits, comment synchronization, final preview/export, submission locks, and adviser review.
- Test server-denied writes and misleading `mode=review` URLs to ensure visual mode never grants authority.
- Confirm exported documents exclude menus, navigation rails, and comment UI by default; retain the exact same template body/layout after the shell redesign.
- Run TypeScript checks, production build, existing editor suites, and focused new authenticated browser tests. Document checks not run or blocked by missing accounts/infrastructure.

The UI is ready when it matches the supplied arrangement with the listed system adaptations, all visible controls work, the fullscreen arrow behaves exactly as specified, and existing document data/workflows remain intact. Production document accuracy still requires the approved-template certification in the parent plan.
