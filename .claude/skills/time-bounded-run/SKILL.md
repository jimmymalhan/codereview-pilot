---
name: time-bounded-run
description: Max duration per phase. On timeout, save state and notify. Prevent runaway long runs.
---

# Time-Bounded Run Skill

**Principle**: Each phase has a max duration. If exceeded, save state, notify, stop.

## Default Limits

| Phase | Max (minutes) |
|-------|----------------|
| DISCOVER | 5 |
| PLAN | 10 |
| IMPLEMENT | 30 |
| VERIFY | 10 |
| DELIVER | 5 |
| **Total** | 60 |

## On Timeout

1. **Save state** to `.claude/local/state/<skill>-state.json`
2. **Notify user**: "Phase X timed out. State saved. Resume: say 'resume'"
3. **Stop** — Do not proceed to next phase

## State Format

```json
{
  "skill": "plan-and-execute",
  "phase": "IMPLEMENT",
  "phase_started_at": "ISO8601",
  "checklist_item": 5,
  "items_done": [1,2,3,4],
  "resume_command": "resume plan-and-execute"
}
```

## Related

- `session-resume` — Resume from saved state
- `contingency` — L5 (pause) saves state
