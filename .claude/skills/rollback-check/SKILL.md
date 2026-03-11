# Rollback Check

## Purpose
Before any change is committed, verify a safe rollback path exists. Document exact revert steps. Assess rollback risk. Block changes that have no safe revert.

## Trigger
- Pre-commit (via hook)
- Pre-PR creation
- Before any database or schema change
- When blast-radius reports high/critical risk

## Workflow Stage
**Phase 3 (IMPLEMENT)** — Runs alongside implementation. **Phase 4 (VERIFY)** — Confirms rollback is still safe.

## Required Inputs
- `git diff --staged` (what's being committed)
- blast-radius output (affected files and risk level)
- Current branch name

## Exact Output Format
```json
{
  "rollback_safe": true,
  "rollback_method": "git revert <commit> | manual steps",
  "rollback_steps": [],
  "risks": [
    { "risk": "", "severity": "low|medium|high", "mitigation": "" }
  ],
  "data_loss_possible": false,
  "requires_migration_rollback": false,
  "blocked": false,
  "block_reason": ""
}
```

## Commands to Run
```bash
git diff --staged --name-only
git log --oneline -5
```

## Files to Inspect
- Staged files (from git diff)
- `data/schema.sql` if database changes involved
- `package.json` if dependency changes

## Proof Needed
- Rollback steps tested or verified as safe
- No one-way operations (DROP TABLE, DELETE without backup)
- State machine transitions are reversible
- API changes are backward-compatible or versioned

## Fail Conditions
- No rollback path documented for a high-risk change
- Data-destructive operation without backup plan
- Breaking API change without versioning
- Schema migration without down migration

## Next Handoff
- Rollback plan → `evidence-proof` for documentation in CONFIDENCE_SCORE
- Blocked changes → `workflow-router` for re-planning

## What to Cache
- Rollback plan for current branch (valid until new commits)

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` rollback section

## What to Update on Failure
- Block commit and report why rollback is unsafe

## Token Thrift Rules
- Only read staged file names, not full diffs
- Check for schema/migration files by name pattern, not content
- Reuse blast-radius output if available

## When NOT to Use
- Documentation-only changes
- .claude/skills/ template updates (always safely revertible)
- Adding new test files (no rollback risk)
