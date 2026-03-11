---
name: run-the-business
description: DEFAULT for project instructions. You give instructions; we run the whole business. Maximum automation—no approval gates. Invokes idea-to-production + live-watchdog. Full E2E. Agents and skills proceed automatically; never wait for user.
argument-hint: [task or instructions]
---

# Run-the-Business Skill

**Purpose**: DEFAULT mode for project instructions. Maximum automation. Zero manual steps. No approval gates. Agents and skills proceed automatically through all phases—never pause, never ask "shall I proceed", never wait for user.

**When to use**: ANY project instruction: "add X", "fix Y", "run the project", "implement Z", or equivalent. Assume run-the-business unless user says "plan only" or "do not execute".

---

## Default: Maximum Automation

- **auto-merge**: ON — Merge when CI green; no "merge now" required
- **ultra-automation**: ON — Full advanced stack (DAG, consensus, handoff, etc.)
- **live-watchdog**: ON — Start immediately after execute
- **Agents**: Spawn automatically; proceed through phases without pausing
- **Skills**: Execute; never wait for approval between steps

---

## Flow

1. **Invoke** `idea-to-production` — Idea → Execute → Merge (auto when CI green) → Deploy (if FULL_AUTO)
2. **Start** `live-watchdog` — Poll CI, deploy, health endpoint
3. **On error** → `error-detector` → `fix-pr-creator` → `self-fix` loop until green

---

## Entry Points

| User Says | Action |
|-----------|--------|
| Any project instruction (add, fix, implement, run) | DEFAULT: idea-to-production + live-watchdog + auto-merge |
| "Run the project" | Same (max automation) |
| "Project instructions only" | Same |
| "Full E2E" | Same |
| "Plan only" / "do not execute" | Plan mode only; no implementation |
| "Watch and fix" | Start live-watchdog only (if already executed) |

---

## Output

- Real localhost URL when server is up
- PR links when PRs created
- Error status when watchdog detects failure
- Fix PR created automatically on CI/deploy/health failure

---

## Related Skills

- `ultra-automation` — Max autonomy; ON by default when run-the-business
- `idea-to-production` — Master flow
- `live-watchdog` — Poll and detect errors
- `error-detector` — Classify error, route fix agent
- `fix-pr-creator` — Create fix branch + PR
- `self-fix` — Loop until green
