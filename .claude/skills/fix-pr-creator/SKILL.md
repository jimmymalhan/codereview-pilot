---
name: fix-pr-creator
description: Create fix branch (fix/<type>-<short-id>), spawn FixAgent, commit, push, open PR. Use when error-detector outputs type, scope, fixAgent. Invoked by live-watchdog.
argument-hint: [error-id or type-id]
description: Create fix branch (fix/<type>-<short-id>), spawn fix agent, commit, push, open PR.
---

# Fix-PR-Creator Skill

**Purpose**: Automatically create a fix branch and PR when an error is detected. Spawns FixAgent to apply the fix.

**When to use**: When error-detector outputs type, scope, fixAgent. Invoked by live-watchdog or self-fix.

---

## Input

From `error-detector`:
```json
{
  "type": "test|build|lint|deploy|health",
  "scope": "single_file|multiple_files|config|dependency",
  "fixAgent": "FixAgent",
  "urgency": "critical|high|medium|low"
}
```

---

## Branch Naming

`fix/<type>-<short-id>`

- **type**: From error-detector (test, build, lint, deploy, health)
- **short-id**: First 8 chars of timestamp or random, e.g. `fix/test-a1b2c3d4`

---

## Steps

1. **Create branch** from current base (main or feature)
2. **Spawn FixAgent** with error context (type, scope, CI output)
3. **FixAgent** edits files, runs tests, commits
4. **Push** branch
5. **Open PR** — `gh pr create` or API
6. **Output** PR URL

---

## Output

```json
{
  "branch": "fix/test-a1b2c3d4",
  "pr_url": "https://github.com/.../pull/N",
  "fix_agent_complete": true
}
```

---

## Related Skills

- `error-detector` — Provides input
- `self-fix` — If fix PR CI red, re-invoke
- `conflict-resolution` — If base moved
- `rebase-manager` — For dependent PRs
