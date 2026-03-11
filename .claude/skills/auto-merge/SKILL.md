---
name: auto-merge
description: When CI green, merge without asking. DEFAULT when run-the-business. No "merge now" required.
---

# Auto-Merge Skill

**Principle**: Merge PRs when CI green. No "merge now" required. **Default ON** when run-the-business.

## Modes

| Mode | Merge | Deploy | When |
|------|-------|--------|------|
| **auto-merge** (default) | Merge when CI green | Ask user | run-the-business |
| **full-auto** | Merge when CI green | Deploy when merge succeeds | FULL_AUTO=true |
| **safe** | Ask user | Ask user | User says "ask before merge" |

## When to Merge (auto-merge / full-auto)

1. **CI green** — `gh run list` or `gh pr checks` all pass
2. **Required reviewers** — If org requires, skip auto-merge unless configured
3. **Branch** — Only for `feature/*` or `fix/*` into main
4. **Conflict** — No conflicts with base

## Commands

```bash
# Check CI
gh pr checks
# Merge when green
gh pr merge --squash --auto
# Or: gh pr merge --squash  # when auto=true
```

## Configuration

- **Env or settings**: `AUTO_MERGE=true` or `FULL_AUTO=true`
- **Override**: User says "do not auto-merge" in session
- **Per-repo**: `.claude/settings.json` or branch rule

## Guards

- **main branch**: Never auto-merge INTO main from main
- **Protected branches**: Respect branch protection; may require manual merge
- **Deploy**: full-auto deploys only if `AUTO_DEPLOY=true` or script exists

## Integration

- `idea-to-production` — When auto-merge: skip HANDOFF 1 ask
- `live-watchdog` — When fix PR green: auto-merge fix PR
- `pr-push-merge` — When mode=auto-merge: merge after CI green
- `branch-permissions` — auto-merge adds merge to allowed on feature/* when enabled

## Related

- `idea-to-production` — HANDOFF 1
- `live-watchdog` — Fix PR flow
- `branch-permissions` — What's auto-allowed
