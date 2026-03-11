---
name: run-the-business
description: You give project instructions; we run the whole business. Entry for "project instructions only", "add feature", "fix bug", "run the project". Invokes idea-to-production and live-watchdog. Full E2E automation. Use when user says run/add/fix and wants zero manual steps.
argument-hint: [task or instructions]
---

# Run-the-Business Skill

**Purpose**: You give project instructions. We run the whole business. Zero manual steps. Entry point for fully autonomous flow.

**When to use**: User says "project instructions only", "run the project", "add X", "fix Y", or equivalent. Full E2E with live monitoring.

---

## Flow

1. **Invoke** `idea-to-production` — Idea → Execute → HANDOFF 1 (merge) → HANDOFF 2 (deploy)
2. **Start** `live-watchdog` — Poll CI, deploy, health endpoint
3. **On error** → `error-detector` → `fix-pr-creator` → `self-fix` loop until green

---

## Entry Points

| User Says | Action |
|-----------|--------|
| "Run the project" | idea-to-production + live-watchdog |
| "Project instructions only" | Same |
| "Full E2E" | Same |
| "Watch and fix" | Start live-watchdog only (if already executed) |

---

## Output

- Real localhost URL when server is up
- PR links when PRs created
- Error status when watchdog detects failure
- Fix PR created automatically on CI/deploy/health failure

---

## Related Skills

- `idea-to-production` — Master flow
- `live-watchdog` — Poll and detect errors
- `error-detector` — Classify error, route fix agent
- `fix-pr-creator` — Create fix branch + PR
- `self-fix` — Loop until green
