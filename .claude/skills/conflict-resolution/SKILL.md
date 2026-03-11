---
name: conflict-resolution
description: Preserve local changes with git stash, pull from main, resolve conflicts, update PR. Use when main has moved ahead.
disable-model-invocation: true
---

## Phase 1: DISCOVER
### Sub-Agent: `ConflictDetector` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Check for conflicts: `git status`. Check if main has moved: `git fetch origin main && git log HEAD..origin/main --oneline`. Check uncommitted work.
- **Output**: `{ has_conflicts: boolean, main_ahead_by: number, uncommitted_files[] }`
- **Gate**: conflict status known

## Phase 2: PLAN
### Sub-Agent: `MergePlanner` (model: sonnet)
- **Prompt**: Plan resolution order: stash uncommitted → fetch main → merge/rebase → resolve conflicts → unstash → test → push.
- **Output**: `{ steps[], stash_needed: boolean, conflicts_expected[] }`
- **Gate**: plan created

## Phase 3: IMPLEMENT
### Sub-Agent: `ConflictResolver` (model: haiku)
- **Tools**: Bash, Read, Edit
- **Prompt**: Execute plan step by step. Resolve ONE conflicting file at a time. After each resolve, verify file is valid (no conflict markers). Use main as source of truth for non-feature changes.
- **Output**: `{ files_resolved[], stash_applied: boolean, merge_complete: boolean }`
- **Gate**: 0 conflict markers remaining

## Phase 4: VERIFY
### Sub-Agent: `MergeVerifier` (model: haiku)
- **Tools**: Bash
- **Prompt**: Run `npm test`. Start server. Verify health. Confirm no regressions.
- **Output**: `{ tests_pass: boolean, server_ok: boolean, regressions[] }`
- **Gate**: tests pass AND server healthy

## Phase 5: DELIVER
### Sub-Agent: `SyncPublisher` (model: haiku)
- **Prompt**: Push updated branch. Notify user of resolution. Report server status.
- **Output**: `{ pushed: boolean, branch, server_status }`
- **Gate**: branch pushed

## Contingency
IF conflict is unresolvable (binary file, massive divergence) → contingency L5 (ask user which version to keep).
IF merge breaks tests → revert merge, ask user for guidance.

---

# Conflict Resolution Skill

**Purpose**: Don't lose changes. Sync with main, resolve conflicts, keep PR mergeable.

## Flow

1. **Stash** – `git stash push -m "WIP before pull main"` (if uncommitted)
2. **Pull main** – `git fetch origin main && git merge origin/main` (or rebase per repo convention)
3. **Resolve** – Fix conflicts; run `npm test` after
4. **Unstash** – `git stash pop` if stashed
5. **Verify** – Full test suite, localhost
6. **Push** – Update PR branch

## When Main Updates

- Use main as source of truth
- Add feature branch updates to match main
- Don't lose PR changes
- Resolve all conflicts before push
- Run full test suite after merge
- Test localhost to confirm working

## Merge PR (After Approval)

```bash
# Merge to main, delete branch
git checkout main
git merge feature/branch-name
git push origin main
git branch -d feature/branch-name
git push origin --delete feature/branch-name  # remote
```
