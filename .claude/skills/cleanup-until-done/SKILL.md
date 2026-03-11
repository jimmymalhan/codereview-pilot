# Cleanup Until Done

## Purpose
Iterate on cleanup until nothing stale remains. No "good enough". No "follow-up later". Cleanup covers: stale PRs handled, stale branches deleted, irrelevant files classified, docs updated, skills updated, hooks verified. Loop until done condition met.

## Trigger
IMPLEMENT phase. Also triggered by `full-cycle-automation` or after `repository-audit-to-skillset`.

## Workflow Stage
IMPLEMENT (Phase 2). Loops until remaining items = 0.

## Required Inputs
- `scope`: What to clean (all, branches, prs, files, docs, skills, hooks).
- `dry_run`: Boolean — if true, report what would be cleaned without acting.

## Exact Output Format (JSON)
```json
{
  "skill": "cleanup-until-done",
  "iterations": 3,
  "scope": "all",
  "actions": [
    { "type": "branch_deleted", "target": "feature/old-experiment", "reason": "merged 30 days ago" },
    { "type": "pr_closed", "target": "#15", "reason": "stale, no activity 60 days" },
    { "type": "file_removed", "target": "docs/draft-plan.md", "reason": "non-feature file, stale" },
    { "type": "doc_updated", "target": "README.md", "reason": "removed reference to deleted feature" },
    { "type": "skill_updated", "target": "roadmap-1.0", "reason": "marked item complete" },
    { "type": "hook_verified", "target": "commit-precheck.sh", "reason": "executable and functional" }
  ],
  "remaining_items": 0,
  "done": true,
  "status": "complete|in_progress|blocked"
}
```

## Commands to Run
- `git branch -a` — List all branches (local + remote).
- `gh pr list --state open` — Open PRs for staleness check.
- `gh pr list --state closed --limit 50` — Recently closed for cleanup verification.
- `git log --all --oneline -50` — Activity context.
- `ls -la .claude/hooks/` — Hook presence and permissions.
- `bash .claude/hooks/commit-precheck.sh` — Hook functionality test.

## Files to Inspect
- `.claude/skills/` — All skill directories for staleness.
- `.claude/SKILLSETS.md` — Skill index accuracy.
- `README.md` — Claims match reality.
- `CHANGELOG.md` — Entries are current.
- `.claude/hooks/` — Hooks are executable.

## Proof Needed
- Branch list before and after cleanup.
- PR list before and after cleanup.
- Remaining items count = 0 for "complete" status.
- Each action has a documented reason.

## Fail Conditions
- Remaining items > 0 after max iterations (10).
- Deleted something that was still needed (no rollback).
- Hooks broken after cleanup.
- Tests fail after file removal.

## Next Handoff
If complete (remaining = 0): hand off to `end-to-end-verifier`. If blocked: hand off to `self-fix` with blocked items.

## What to Cache
- Cleanup state between iterations (avoid re-scanning cleaned items).
- Branch/PR inventory snapshots.

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` — Note cleanup complete with 0 remaining.
- `CHANGELOG.md` — Log cleanup actions if significant.
- `.claude/SKILLSETS.md` — Update if skills were modified.

## What to Update on Failure
- Log blocked items with reasons.
- Create tasks for items that need human decision.
- Do not mark as complete if anything remains.

## Token Thrift Rules
- Use `git branch` and `gh pr list` output directly — do not read individual PR details unless needed.
- Batch branch deletions into single commands.
- Stop iterating if no progress between iterations (blocked, not incomplete).

## When NOT to Use
- Mid-feature development (cleanup after feature is done).
- When `branch-cleanup` or `stale-file-cleanup` alone covers the scope.
- Dry-run mode for audit purposes only (use `repository-audit-to-skillset` instead).
