# Plate Document Editor Component Audit

Audit date: 2026-09-16

Scope: the student document editor at `/student/editor`, the locally copied Plate UI components, editor persistence, history, export, and the claims in `docs/Change.md`.

## Reference baseline

- Project runtime: `platejs@53.3.11`.
- Official component catalogue: <https://platejs.org/docs/components>
- Official toolbar guide: <https://platejs.org/docs/toolbar>
- Official component/rendering API: <https://platejs.org/docs/api/core/plate-components>
- Official plugin component guide: <https://platejs.org/docs/plugin-components>

The official catalogue currently lists 47 editor UI components and 38 node components. The catalogue is broader than this portal needs, and the live documentation can target a newer Plate release than the pinned v53 runtime. Components must therefore be adopted selectively and verified against the installed API.

## Important finding about `docs/Change.md`

`docs/Change.md` is a historical implementation claim, not an accurate description of the current tree. In particular:

- `src/components/plate-ui/ai-menu.tsx` does not exist.
- `backend/routes/aiEditor.ts` does not exist.
- `/api/ai/editor-assist` is not mounted by `backend/server.ts`.
- The AI assistant was deliberately removed by commit `2644922`.
- The toolbar has since grown far beyond the older code snapshot embedded in the change log.

The editor should not be described as the complete official `@plate/editor-ai` template. It is a custom Plate v53 editor inspired by Plate UI.

## Functional status after remediation

### Verified by compiler and automated runtime tests

| Area | Status | Evidence |
| --- | --- | --- |
| Paragraphs and headings H1-H6 | Functional | Native Plate node renderers are registered. |
| Bold, italic, underline, strikethrough, code, highlight | Functional | Visible leaf renderers and Plate v53 transforms are covered by runtime tests. |
| Font size, text color, background color, subscript, superscript, keyboard text | Functional | Leaf renderers are registered and DOCX serialization supports the applicable text properties. |
| Alignment, line height, indentation | Functional in editor | Block properties are visibly rendered. |
| Bulleted and numbered lists | Functional | Commands now create valid `ul/ol > li` trees and toggle back to paragraphs. |
| Tables, links, divider, date, todo, toggle, media nodes | Renderable | Every toolbar-facing node has a React renderer; void nodes preserve Slate children. |
| Undo and redo | Functional | Plate's built-in history plugin and v53 transforms are present. |
| Fixed and floating formatting toolbars | Functional architecture | Both use Plate store version hooks; the floating toolbar uses the correct v53 mark API and viewport positioning. |
| Draft autosave and OCC revision tracking | Functional | Existing-draft revisions are initialized and acknowledged revisions flow back to page state. |
| Manual version and history restore | Functional | Pending edits flush before snapshots and restores. Restored content remounts the editor safely. |
| Submission lock revision | Functional | Locking uses the acknowledged server revision instead of `draft.revision + 1`. |
| Word count, filename sanitization, draft database security | Functional | Covered by the editor test suite. |

### Implemented but still needs interactive browser/device verification

These paths compile and have correct Plate wiring, but should still be exercised manually in Chrome/Edge with a real authenticated student account:

- Link create/edit/unlink/open behavior.
- Table grid insertion and row/column/cell operations.
- Image, video, audio, and attachment insertion from both URL and local upload.
- Speech-to-text permission, start/stop, and transcript insertion.
- Responsive overflow menu with the application sidebar open.
- Full-screen mode, canvas wheel zoom, print preview, Word export, and PDF print.
- Todo checkbox and toggle persistence after save/reload.
- Multi-tab warning and deliberate conflict-resolution choices.

### Partial or intentionally absent

| Plate catalogue capability | Current state |
| --- | --- |
| AI Menu, AI Toolbar Button, AI Leaf, Ghost Text | Absent. Do not re-enable without a reviewed API route, streaming model, auth/rate limits, and editor-safe insertion flow. |
| Suggestion Toolbar Button / Suggestion Leaf | The mode selector is UI-only; it does not track accept/rejectable text changes. |
| Comment Leaf / Block Discussion | Comments are local component state and are not anchored to ranges or persisted. |
| Block Selection, Context Menu, Draggable, Cursor/Remote Cursor Overlay | Not installed. |
| Import Toolbar Button | Not implemented. |
| Export Toolbar Button | Page-level DOCX and print-to-PDF exist; HTML, image, and Markdown export do not. |
| Media Preview, resize handles, captions, upload toast | Not implemented. Local media is embedded as a data URL rather than uploaded to durable object storage. |
| Slash/inline combobox, mentions, tags, search highlight | Not implemented. |
| Callouts, code blocks/drawings, columns, equations, Excalidraw, footnotes, TOC | Not implemented and not required for the practicum document scope. |
| Real-time multiplayer collaboration | Not implemented; current multi-tab logic warns rather than co-edits. |

## Recommended editor scope

The production editor should stay focused on formal practicum documents: structured text, lists, tables, links, limited media, comments/history, DOCX/PDF export, and reliable draft storage. Advanced Plate catalogue features should only be added when a portal requirement and persistence/export design exist for them.

