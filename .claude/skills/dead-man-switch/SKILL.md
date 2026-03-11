---
name: dead-man-switch
description: If no progress after X minutes, save state and notify. Recover from stuck runs.
---

# Dead Man's Switch Skill

**Principle**: If no observable progress for X minutes, assume hung. Save state. Notify. Stop.

## Threshold

- **Default**: 15 minutes no progress
- **Progress** = New file edited, test run, commit, phase complete

## Actions on Trigger

1. **Save state** to `.claude/local/state/dead-man-<timestamp>.json`
2. **Notify**: "No progress for 15 min. Run may be stuck. State saved. Say 'resume' to continue."
3. **Stop** current phase

## State Saved

```json
{
  "triggered_at": "ISO8601",
  "last_progress_at": "ISO8601",
  "skill": "plan-and-execute",
  "phase": 3,
  "checklist_item": 5,
  "resume_command": "resume plan-and-execute"
}
```

## Related

- `heartbeat-monitor` — Emit progress; dead-man checks for absence
- `time-bounded-run` — Phase timeout
- `session-resume` — Resume from saved state
