# Branch Hygiene

## Purpose
Classify every branch as active/stale/merged/abandoned/blocked/duplicate. Auto-delete merged-not-deleted branches. Produce delete recommendations for stale branches with evidence.

## Trigger
- DISCOVER phase (start of session)
- Post-merge (after any PR merges to main)
- Manual invocation

## Workflow Stage
Phase 1 (Discovery)

## Required Inputs
- Git remote URL (origin)
- Current branch name
- List of open PRs (`gh pr list`)

## Exact Output Format (JSON)
```json
{
  "branches": [
    {
      "name": "feature/example",
      "classification": "merged|stale|active|abandoned|blocked|duplicate",
      "lastCommitDate": "2026-01-15",
      "daysSinceLastCommit": 55,
      "mergedTo": "main|null",
      "hasOpenPR": false,
      "action": "delete|recommend-delete|keep|review",
      "evidence": "Merged via PR #34 on 2026-01-10"
    }
  ],
  "summary": { "deleted": 2, "recommended": 1, "kept": 3 }
}
```

## Commands to Run
```bash
git fetch --prune origin
git branch -a --merged main
git branch -a --no-merged main
git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:iso)' refs/remotes/origin/
gh pr list --state all --limit 100 --json headRefName,state,mergedAt
```

## Files to Inspect
- `.claude/CONFIDENCE_SCORE.md` — check for branch references
- `CHANGELOG.md` — verify merged work is logged

## Proof Needed
- `git branch -a --merged main` output for merged classification
- Commit date evidence for stale classification (>30 days no commit, no open PR)
- PR state from `gh pr list` for abandoned classification (closed without merge)

## Fail Conditions
- Deleting a branch with an open PR
- Deleting a branch not fully merged to main
- Classifying an active branch (commits in last 7 days) as stale

## Next Handoff
- `branch-cleanup` skill for executing deletions
- `pr-automation` skill if orphaned PRs found

## What to Cache
- Branch list with classifications (avoid re-fetching within same session)
- PR-to-branch mapping

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` — record cleanup performed
- `CHANGELOG.md` — note branches deleted

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — record failure reason, lower confidence

## Token Thrift Rules
- Use `git for-each-ref` with format strings, not raw `git log`
- Limit PR fetch to 100; paginate only if needed
- Skip branch detail inspection for branches already classified as merged

## When NOT to Use
- During active development on a feature branch (wait until PR merges)
- When git remote is unreachable (offline mode)
- For repos with fewer than 3 branches (not worth the overhead)
