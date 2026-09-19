# Documentation guide

[Documentation home](README.md)

These rules keep the documentation readable in GitHub, editors, and Obsidian without requiring community plugins.

## Where a document belongs

| Content | Location |
| --- | --- |
| Central hub, vault rules, and panelist defense manual | `docs/` root |
| System design, database, integrations, deployment | `architecture/` |
| A complete user-facing workflow | `features/` |
| Coding, UI, review, or academic standards | `guidelines/` |
| Current work, roadmaps, specifications, or session history | `tasks/` |

Do not create loose files in `docs/` root unless they serve system-wide or academic defense purposes. Add feature and task documents to their respective section indexes and link them from `docs/README.md`.


## Recommended document shape

1. Use one level-one heading (`#`) that clearly names the subject.
2. Add one short purpose or status paragraph.
3. Add a compact navigation line back to the section index and documentation home.
4. Use level-two headings for major sections and level-three headings only when needed.
5. Prefer short paragraphs, tables for comparisons, and lists for actions.
6. Put long command output or diagrams in fenced code blocks.
7. End with related links only when they add a useful next step.

## Link rules

- Use standard relative Markdown links: `[System map](architecture/SYSTEM_MAP.md)`.
- Do not use `file://` links or absolute paths from one developer's computer.
- Do not use Obsidian-only `[[wiki links]]`; they do not render correctly on GitHub.
- Use repository-relative code links from the document's directory.
- Keep filenames stable. If a file must move, update inbound links in the same change.

## Status and history

- Put a date near the top of audits, diagnoses, and session reports.
- State whether a plan is proposed, in progress, implemented locally, or deployed.
- When newer work supersedes a report, link to the newer source rather than rewriting history.
- Never place passwords, tokens, private contact details, or copied credentials in the vault.

## Obsidian use

Open the `docs` directory as the vault. `README.md` is the home note. The vault uses only core features, standard Markdown links, a central `assets` attachment path, and reduced graph clutter.
