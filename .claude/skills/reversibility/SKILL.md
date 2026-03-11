---
name: reversibility
description: Every change must have explicit rollback steps. Document revert before proceeding.
---

# Reversibility Skill

**Principle**: Every change is reversible. Document exact rollback steps before or with the change.

## Required Output

For each change (commit, deploy, config):

```markdown
## Rollback
- **Command**: git revert <sha> && git push
- **Or**: git checkout main && git pull
- **Verification**: npm test passes after revert
- **State**: No dangling refs; clean working tree
```

## When to Apply

- **Before commit** — Know revert command
- **Before merge** — Document merge revert steps
- **Before deploy** — Document deploy rollback (e.g., previous release tag)
- **In PR body** — Include rollback section

## Format

| Change Type | Rollback |
|-------------|----------|
| Single commit | `git revert <sha>` |
| Multiple commits | `git revert <oldest>^..<newest>` or cherry-pick inverses |
| Config change | Restore previous file; restart |
| Dependency add | Remove from package.json; npm install |

## Gate

- **evidence-proof** Phase 5: Include rollback in output
- **pr-push-merge**: PR body must have rollback section
- **idea-to-production**: HANDOFF 1 deliverable includes rollback path

## Related

- `evidence-proof` — Rollback in output contract
- `pr-push-merge` — PR body
- `execution-agent` — Fail loudly if rollback unknown
