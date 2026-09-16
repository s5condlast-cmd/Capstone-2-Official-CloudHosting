# Documentation home

[Project overview](../README.md) | [Architecture](architecture/README.md) | [Features](features/README.md) | [Guidelines](guidelines/README.md) | [Tasks](tasks/README.md)

Use this page as the starting point for both GitHub and the Obsidian vault. All links use standard relative Markdown so they work in either application.

## Start here

| I want to... | Open |
| --- | --- |
| Understand the system | [Architecture overview](architecture/ARCHITECTURE.md) |
| Find a page, route, service, or database area | [System map](architecture/SYSTEM_MAP.md) |
| Follow a feature workflow | [Feature index](features/README.md) |
| Set up or deploy the application | [Deployment guide](architecture/DEPLOYMENT_AND_VERCEL.md) |
| Work on the current backlog | [Active tasks](tasks/TASKS.md) |
| Review coding and UI conventions | [Guidelines index](guidelines/README.md) |
| Prepare for the capstone defense | [Panelist defense guide](PANELIST_DEFENSE_AND_SYSTEM_GUIDE.md) |
| Read the capstone manuscript | [Main document](guidelines/Main_Document.md) |

## Current implementation notes

These documents describe work that is active or still needs deployment verification.

| Document | Purpose |
| --- | --- |
| [Authentication implementation handoff](AUTH_IMPLEMENTATION_HANDOFF.md) | Implemented authentication changes and remaining cloud activation steps |
| [Document editor plan](Plan.md) | Repository and Plate editor implementation plan |
| [Active tasks](tasks/TASKS.md) | Current development roadmap |

## Reference and historical reports

These are evidence records. Read the current handoff or task list before treating an old finding as unresolved.

| Document | Purpose |
| --- | --- |
| [Code and connection audit — 2026-09-14](CODE_AND_CONNECTION_AUDIT_2026-09-14.md) | Point-in-time integration and security audit |
| [Login diagnosis and repair plan](LOGIN_DIAGNOSIS_AND_PLAN.md) | Original authentication defects; superseded by the auth handoff where noted |
| [Task history](tasks/TASK_HISTORY.md) | Completed milestones and changes |
| [All sessions history](tasks/ALL_SESSIONS_HISTORY.md) | Older session summaries and lessons |

## Browse by section

- [Architecture and infrastructure](architecture/README.md)
- [Feature specifications](features/README.md)
- [Engineering and academic guidelines](guidelines/README.md)
- [Tasks and project history](tasks/README.md)
- [Documentation conventions](DOCUMENTATION_GUIDE.md)

## Vault layout

```text
docs/
|-- README.md                 Documentation home
|-- architecture/            System design, storage, and deployment
|-- features/                User-facing feature workflows
|-- guidelines/              Engineering rules, UI reviews, and manuscript
|-- tasks/                   Active work and historical logs
|-- *.md                     Cross-cutting plans, audits, and handoffs
`-- .obsidian/               Shared lightweight vault settings
```

Keep navigation shallow: start here, choose a section, then open the specific document. See the [documentation guide](DOCUMENTATION_GUIDE.md) before adding or reorganizing notes.
