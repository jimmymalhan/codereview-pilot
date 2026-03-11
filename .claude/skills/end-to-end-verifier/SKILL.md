# End-to-End Verifier

## Purpose
Verify entire workflow completion beyond green unit tests. Confirm: tests pass, docs match reality, milestones match checkpoints, skills match behavior, hooks enforce rules, and critical user workflows function correctly.

## Trigger
VERIFY phase of any task. Also triggered after roadmap item completion or milestone update.

## Workflow Stage
VERIFY (Phase 3).

## Required Inputs
- `task_id`: The task or roadmap item being verified.
- `changed_files`: List of files modified in this task.
- `claimed_behavior`: What the task claims to deliver.

## Exact Output Format (JSON)
```json
{
  "skill": "end-to-end-verifier",
  "task_id": "string",
  "surfaces": {
    "unit_tests": { "status": "pass|fail", "detail": "319 passing, 89% coverage" },
    "integration_tests": { "status": "pass|fail|skipped", "detail": "string" },
    "docs_match_reality": { "status": "pass|fail", "drift": ["list of mismatches"] },
    "milestones_match": { "status": "pass|fail", "drift": ["list of mismatches"] },
    "skills_match_behavior": { "status": "pass|fail", "drift": ["list of mismatches"] },
    "hooks_enforce_rules": { "status": "pass|fail", "detail": "string" },
    "critical_workflows": { "status": "pass|fail", "tested": ["workflow names"] }
  },
  "overall": "pass|fail",
  "blocking_issues": ["list of issues that block merge"]
}
```

## Commands to Run
- `npm test` — Unit and integration tests.
- `npm run test:ci` — CI-mode tests.
- `bash .claude/hooks/commit-precheck.sh` — Hook enforcement.
- `git diff main..HEAD` — Changed files for scope.
- `gh pr checks` — CI status if PR exists.

## Files to Inspect
- `.claude/CONFIDENCE_SCORE.md` — Evidence matches claims.
- `CHANGELOG.md` — Updated for this task.
- `README.md` — Matches current state.
- `.claude/SKILLSETS.md` — Skills referenced are accurate.
- `.claude/hooks/` — Hooks are executable and correct.

## Proof Needed
- Test output showing pass counts and coverage.
- Doc content matching actual behavior (not stale).
- Milestone/checkpoint alignment with code state.
- At least one critical user workflow tested end-to-end.

## Fail Conditions
- Any unit test fails.
- Docs claim behavior that code does not implement.
- Milestone says "done" but tests or proof are missing.
- Hooks are present but not enforcing rules.
- Critical workflow untested.

## Next Handoff
If pass: hand off to `consensus-gates` for merge readiness. If fail: hand off to `self-fix` with blocking issues list.

## What to Cache
- Last verification report per task (avoid re-running unchanged surfaces).
- Test output hash to detect if re-run is needed.

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` — Mark verified surfaces with evidence.
- `CHANGELOG.md` — Confirm entry exists for this task.

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — Lower score, list failures.
- Create `[UNKNOWN]` entries for unverified surfaces.
- Block merge via `consensus-gates`.

## Token Thrift Rules
- Run `npm test` once; parse output for multiple surfaces.
- Use `grep` over full file reads for doc checks.
- Skip unchanged surfaces from prior verification.

## When NOT to Use
- Single-file typo fix with no behavior change.
- Documentation-only changes with no code impact.
- When `evidence-proof` skill alone covers the scope.
