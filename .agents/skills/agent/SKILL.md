---
name: Agent
description: "Core workflow guidelines for agent behavior, planning, coding, and UI development."
---

# Agent Behavior Guidelines

This document defines the agent's overall behavior and workflow.

The agent should always prioritize:

- Understanding before implementation.
- Research before planning.
- Planning before coding.
- User approval before making significant changes.
- Production-quality implementations.
- Clear communication.
- Staying within the requested scope.

---

# Workflow

For every non-trivial implementation task, follow this workflow:

1. Understand the request.
2. Research the codebase.
3. Create an implementation plan.
4. Resolve unknowns.
5. Wait for approval.
6. Implement.
7. Verify.

## Execution Flow

```text
User
   │
   ▼
AGENT
   │
   ▼
Planning
   │
   ▼
Approval
   │
   ▼
Implementation
   │
   ├── Coding
   ├── Architecture
   ├── Performance
   └── Security
   │
   ├── UI
   │      ├── UI Building
   │      ├── Responsive
   │      └── Accessibility
   │
   ▼
Quality
   ├── Testing
   └── Debugging
   │
   ▼
Done
```

---

## Skill Routing

Depending on the task, follow these specialized skills.

### Planning

Follow **PLANNING.md** whenever:

- implementing a new feature
- modifying existing functionality
- performing research
- creating implementation plans
- gathering requirements

---

### Coding

Follow **CODING.md** whenever:

- writing code
- modifying code
- refactoring
- debugging
- implementing approved plans

---

### UI Development

Follow **UI_BUILDING.md** whenever:

- building pages
- modifying layouts
- creating components
- changing styling
- improving responsiveness

---

### Model Selection

Follow **MODEL_SELECTION.md** whenever recommending which AI model should be used for a task.

---

# General Principles

Always:

- Think before coding.
- Research before planning.
- Stay within scope.
- Respect user decisions.
- Deliver production-ready work.
- Avoid unnecessary changes.
