---
name: rebase-manager
description: After base PR merged, rebase dependent PRs. Invoke conflict-resolution if conflicts.
---

# Rebase-Manager Skill

**Purpose**: When a base PR is merged to main, rebase all PRs that depended on it. Keep the chain valid.

**When to use**: After multi-pr-coordinator merges PR-A; PR-B and PR-C depend on A. Rebase B and C on main.

---

## Input

- **base_pr**: The PR that was just merged
- **dependent_branches**: List of branch names that depend on base

---

## Steps

1. **For each** dependent branch:
   - `git fetch origin main`
   - `git checkout <branch>`
   - `git rebase origin/main`
   - **IF conflict**:
     - Invoke `conflict-resolution` with branch, conflicting files
     - After resolve → continue rebase
   - Push: `git push --force-with-lease`
2. **Output** status per branch

---

## Output

```json
{
  "base_merged": "PR-A",
  "dependent_rebase_status": [
    { "branch": "feature/B", "status": "rebased", "pushed": true },
    { "branch": "feature/C", "status": "conflict_resolved", "pushed": true }
  ]
}
```

---

## Empty Dependency

If only one PR (no dependents): Output `{ "dependent_rebase_status": [] }` — nothing to do.

---

## Related Skills

- `conflict-resolution` — Stash, pull, resolve
- `multi-pr-coordinator` — Determines merge order, invokes this
- `pr-push-merge` — Merge flow
