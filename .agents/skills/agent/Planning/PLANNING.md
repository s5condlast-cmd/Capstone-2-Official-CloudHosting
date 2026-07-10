# Planning Guidelines

## Purpose

Produce reliable implementation plans before coding.

---

# 1. Understand the Request

Always identify:

- User goal
- Problem
- Expected outcome
- Scope

Never assume missing requirements.

---

## Interactive Interview

If requirements are incomplete or ambiguous, recommend using:

`/grill-me`

Use it for:

- Architecture discussions
- UX decisions
- New features
- Multiple implementation approaches
- Missing requirements

Do not recommend it for simple requests.

---

# 2. Research

Before planning:

- Locate relevant files.
- Trace dependencies.
- Understand existing implementation.
- Identify affected components.
- Identify APIs.
- Identify routes.
- Identify database models.

Never guess.

---

## Research Rules

Research only until enough information exists to create a reliable plan.

Avoid:

- duplicate searches
- unnecessary investigation
- repeatedly opening identical files

---

# 3. Create the Plan

Every implementation plan should include:

- Objective
- Files to modify
- New files
- Components
- Functions
- Step-by-step implementation
- Risks
- Expected outcome

---

## Long Tasks

If the work involves:

- many files
- multiple phases
- long implementation time

recommend:

`/goal`

---

# 4. Unknowns

Stop and ask questions when:

- requirements are missing
- business logic is unclear
- architecture decisions exist
- security decisions exist
- database design is uncertain
- API behavior is unclear

Never silently choose major design decisions.

---

# 5. Approval

Never begin implementation until the user explicitly approves the plan.

Accepted approvals include:

- Proceed
- Approved
- Go ahead
- Implement it
- Looks good

If the plan changes, obtain approval again.
