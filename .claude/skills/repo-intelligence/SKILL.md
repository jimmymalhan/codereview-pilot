# Repo Intelligence

## Purpose
Single-pass repo state scanner. Produces a structured truth snapshot: files, branches, PRs, tests, coverage, stale items, drift. Used by workflow-router at the start of every phase cycle.

## Trigger
- Session start (first action)
- Before any phase transition
- After any PR merge or branch cleanup
- When `workflow-router` enters DISCOVER phase

## Workflow Stage
**Phase 1 (DISCOVER)** — First worker invoked. All other Phase 1 workers depend on this output.

## Required Inputs
- Repository root path
- Git remote URL (if available)

## Exact Output Format
```json
{
  "snapshot_time": "ISO-8601",
  "branch": { "current": "", "local": [], "remote": [], "merged_not_deleted": [], "stale": [] },
  "prs": { "open": [], "recently_closed": [], "stale": [] },
  "tests": { "suites": 0, "passed": 0, "failed": 0, "skipped": 0, "coverage_pct": 0 },
  "files": { "total": 0, "stale": [], "irrelevant": [], "needs_move": [] },
  "skills": { "total": 0, "orphaned": [], "missing_from_skillsets": [] },
  "hooks": { "total": 0, "active": [], "dead": [] },
  "docs": { "readme_stale": false, "confidence_stale": false, "changelog_stale": false },
  "roadmap": { "total_checkpoints": 0, "done": 0, "pending": 0, "unverified": 0 }
}
```

## Commands to Run
```bash
git status
git branch -a
git log --oneline -20
gh pr list --state open --limit 50 2>/dev/null || echo "gh not available"
npm test 2>&1 | tail -30
ls -la .claude/skills/ | wc -l
ls -la .claude/hooks/
```

## Files to Inspect
- `package.json` (version, scripts)
- `.claude/ROADMAP_TODO.md`
- `.claude/CONFIDENCE_SCORE.md`
- `.claude/SKILLSETS.md`
- `README.md`
- `.github/PROJECT_1.0.0_CHECKPOINTS.md`

## Proof Needed
- Every field in output is from actual command output or file read
- No invented counts or statuses
- [UNKNOWN] marker on anything not verifiable

## Fail Conditions
- Output contains invented data
- Commands not actually run (output fabricated)
- Stale items not detected when they exist
- Coverage percentage doesn't match npm test output

## Next Handoff
- Output → `workflow-router` (for phase routing)
- Output → `roadmap-auditor` (for roadmap-specific deep dive)
- Output → `pr-triage` (for PR classification)
- Output → `branch-hygiene` (for branch classification)

## What to Cache
- Full snapshot (valid for current session unless repo changes)
- Test output summary

## What to Update on Success
- Nothing — this skill is read-only, produces snapshot

## What to Update on Failure
- Flag [UNKNOWN] items in output
- Route to `workflow-router` with degraded snapshot

## Token Thrift Rules
- Run all commands in one batch (parallel bash)
- Use `tail -30` on test output, not full output
- Count files with `wc -l`, don't list all
- Skip node_modules, .git, coverage in file counts

## When NOT to Use
- Mid-implementation (snapshot is already current)
- Single-file edit (no need for full repo scan)
- When last snapshot is < 5 minutes old and no git changes
