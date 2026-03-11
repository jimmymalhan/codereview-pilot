---
name: multi-pr-coordinator
description: Order PRs by dependency. Merge base first. Invoke rebase-manager after each merge.
---

# Multi-PR-Coordinator Skill

**Purpose**: When plan produces multiple PRs, build dependency graph and merge in correct order. Rebase dependents after each base merge.

**When to use**: Plan created PR-A (base), PR-B (depends on A), PR-C (depends on A). Merge A first, then rebase B and C, then merge B and C.

---

## Input

- List of PRs from plan: `[{ pr_url, branch, depends_on: [] }]`

---

## Steps

1. **Build graph**: Parse depends_on; identify roots (no deps)
2. **Merge order**: Topological sort — roots first, then dependents
3. **For each** in order:
   - Merge PR (user approval or auto on feature branch)
   - **After merge** → Invoke `rebase-manager` with merged PR, dependent branches
   - Continue to next
4. **Output** merge sequence and status

---

## Single PR

If only one PR: Merge it. No rebase needed. Output `{ "merged": ["PR-A"], "rebase_manager_invoked": false }`.

---

## Output

```json
{
  "merge_order": ["PR-A", "PR-B", "PR-C"],
  "merge_status": [
    { "pr": "A", "merged": true, "dependents_rebased": ["B", "C"] },
    { "pr": "B", "merged": true, "dependents_rebased": [] },
    { "pr": "C", "merged": true, "dependents_rebased": [] }
  ]
}
```

---

## Related Skills

- `rebase-manager` — Rebase after base merge
- `conflict-resolution` — Called by rebase-manager
- `pr-push-merge` — Commit, push, CI, merge
- `idea-to-production` — May produce multi-PR plan
