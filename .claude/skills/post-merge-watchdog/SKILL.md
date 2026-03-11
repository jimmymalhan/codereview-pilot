# Post-Merge Watchdog

## Purpose
After any PR merge: trigger branch cleanup, refresh PR/branch inventories, update milestone and roadmap truth, verify no regressions, arm watchdog for next cycle.

## Trigger
Post-merge event. Detected via `gh pr list --state merged` or after `auto-merge` skill completes.

## Workflow Stage
Post-VERIFY (Phase 4). Runs automatically after merge.

## Required Inputs
- `merged_pr`: PR number that was just merged.
- `merged_branch`: Branch name that was merged.
- `base_branch`: Target branch (usually `main`).

## Exact Output Format (JSON)
```json
{
  "skill": "post-merge-watchdog",
  "merged_pr": 42,
  "merged_branch": "feature/api-retry",
  "checklist": {
    "branch_cleanup": { "status": "pass|fail", "detail": "local and remote deleted" },
    "pr_inventory_refreshed": { "status": "pass|fail", "detail": "3 open PRs remain" },
    "branch_inventory_refreshed": { "status": "pass|fail", "detail": "5 branches remain" },
    "milestone_updated": { "status": "pass|fail", "detail": "milestone 1.0 progress: 80%" },
    "roadmap_updated": { "status": "pass|fail", "detail": "item marked complete" },
    "regression_check": { "status": "pass|fail", "detail": "319 tests passing" },
    "watchdog_armed": { "status": "pass|fail", "detail": "next cycle ready" }
  },
  "overall": "pass|fail",
  "blocking_issues": []
}
```

## Commands to Run
- `git checkout main && git pull` — Sync main after merge.
- `git branch -d <merged_branch>` — Delete local branch.
- `git push origin --delete <merged_branch>` — Delete remote branch.
- `gh pr list --state open` — Refresh open PR inventory.
- `git branch -a` — Refresh branch inventory.
- `npm test` — Regression check on main.
- `gh milestone list` — Check milestone progress.

## Files to Inspect
- `CHANGELOG.md` — Merged PR reflected in changelog.
- `.claude/CONFIDENCE_SCORE.md` — Task marked complete.
- `.claude/skills/roadmap-1.0/SKILL.md` — Roadmap item status.
- `README.md` — Progress claims match reality.

## Proof Needed
- Branch deleted locally and remotely (command output).
- `npm test` output showing no regressions on main.
- Milestone and roadmap surfaces updated.

## Fail Conditions
- Branch not deleted after merge.
- Regression detected on main after merge.
- Milestone or roadmap not updated to reflect merge.
- Stale PRs remain without triage.
- Watchdog not armed for next cycle.

## Next Handoff
If pass: arm `live-watchdog` for CI/deploy monitoring. If regression: hand off to `self-fix` immediately. If cleanup incomplete: hand off to `cleanup-until-done`.

## What to Cache
- Last merge event timestamp and PR number.
- Branch inventory snapshot for diff detection.

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` — Mark task as merged and verified.
- `CHANGELOG.md` — Confirm entry exists for merged work.
- Branch and PR inventories refreshed.

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — Flag regression or incomplete cleanup.
- Create follow-up task for any incomplete checklist item.
- Alert via PR comment if regression found.

## Token Thrift Rules
- Run cleanup commands in parallel (branch delete + inventory refresh).
- Use `npm test` output for regression check — do not run additional test suites unless unit tests fail.
- Skip milestone update if no milestone is associated with the PR.

## When NOT to Use
- PR was closed without merging.
- Draft PR updates (not yet merged).
- When `branch-cleanup` skill is already handling the same branch.
