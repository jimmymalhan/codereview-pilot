# Milestone Checkpoint Sync

## Purpose
Synchronize milestones, checkpoints, README progress, and CHANGELOG claims. When any checkpoint changes, update all surfaces. Detect drift between truth surfaces.

## Trigger
After `checkpoint-auditor` output, after any roadmap work, or when any truth surface is updated independently.

## Workflow Stage
VERIFY (Phase 3) or post-IMPLEMENT.

## Required Inputs
- `changed_surface`: Which truth surface was just updated (milestone, checkpoint, README, CHANGELOG).
- `current_state`: Summary of what changed.

## Exact Output Format (JSON)
```json
{
  "skill": "milestone-checkpoint-sync",
  "surfaces_checked": ["milestones", "checkpoints", "README", "CHANGELOG", "CONFIDENCE_SCORE"],
  "drift_detected": [
    {
      "surface_a": "README.md",
      "surface_b": "CHANGELOG.md",
      "field": "version",
      "value_a": "1.0.0",
      "value_b": "0.9.0",
      "action_taken": "Updated CHANGELOG to 1.0.0"
    }
  ],
  "sync_actions": ["list of updates made"],
  "remaining_drift": [],
  "status": "synced|partial|failed"
}
```

## Commands to Run
- `gh milestone list` — GitHub milestone state.
- `git log --oneline -20` — Recent commits for checkpoint context.
- `gh pr list --state all --limit 20` — PR state for milestone tracking.

## Files to Inspect
- `README.md` — Version, features listed, progress claims.
- `CHANGELOG.md` — Version entries, dates, change descriptions.
- `.claude/CONFIDENCE_SCORE.md` — Task completion claims.
- `.claude/skills/roadmap-1.0/SKILL.md` — Roadmap item status.
- `package.json` — Version field.

## Proof Needed
- Side-by-side comparison of version/status across all surfaces.
- Evidence that sync actions resolved drift (before/after).
- Remaining drift list must be empty for "synced" status.

## Fail Conditions
- Any surface claims a feature is "done" while another says "in progress."
- Version mismatch between package.json, README, and CHANGELOG.
- Milestone marked complete on GitHub but checkpoint shows incomplete.
- Remaining drift after sync attempt.

## Next Handoff
If synced: proceed to `consensus-gates`. If drift remains: hand off to `self-fix` with drift list.

## What to Cache
- Last known state of each surface (detect changes efficiently).
- Drift history (track recurring misalignments).

## What to Update on Success
- All truth surfaces aligned. Log sync actions in session context.
- `.claude/CONFIDENCE_SCORE.md` — Note surfaces are in sync.

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — List remaining drift as `[UNKNOWN]`.
- Block merge if version or completion status is inconsistent.

## Token Thrift Rules
- Read only the relevant sections of each file (offset/limit).
- Use `grep` for version strings instead of reading entire files.
- Skip surfaces that have not changed since last sync.

## When NOT to Use
- No roadmap or milestone work was done.
- Single-file code fix with no version or status implications.
- When `checkpoint-auditor` has already confirmed alignment.
