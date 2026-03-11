---
name: self-fix
description: CI red → fix. Conflict → resolve. Loop until green. Max retries enforced.
---

# Self-Fix Skill

**Purpose**: When a fix PR is created but CI still red, loop: spawn FixAgent again, apply fix, push. Max retries to cap credit burn.

**When to use**: After fix-pr-creator opens a PR; CI runs and stays red. Invoke until green or max retries.

---

## Max Retries

- **Default**: 3
- **Cheaper plans**: 2
- **After max**: Stop, notify user, save state

---

## Flow

1. **Check** CI status on fix PR
2. **IF green** → DONE, notify user
3. **IF red** AND retries < max:
   - Spawn FixAgent with CI output, failed test names
   - FixAgent edits, commits, pushes
   - Re-check CI
   - Increment retry count
4. **IF red** AND retries >= max:
   - Save state to `.claude/local/state/self-fix-state.json`
   - Notify user: "Max retries reached. Manual intervention needed."
   - STOP

---

## Conflict Handling

If push fails (main moved, conflict):
1. **Invoke** `conflict-resolution` with branch name
2. **Resolve** — stash, pull, resolve, push
3. **Continue** self-fix loop (does not count as retry)

---

## Output

```json
{
  "status": "green|max_retries|blocked",
  "retries_used": 2,
  "pr_url": "https://...",
  "last_ci_status": "green",
  "state_saved": "path if max_retries"
}
```

---

## Related Skills

- `fix-pr-creator` — Creates initial fix PR
- `conflict-resolution` — Resolve push conflicts
- `cost-guardrails` — Max retries by plan
- `FixAgent` — Applies fixes
