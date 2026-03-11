---
name: heartbeat-monitor
description: Periodic "I'm alive" checks during long runs. Detect stuck runs.
---

# Heartbeat Monitor Skill

**Principle**: During runs > 10 minutes, emit progress. If no progress for X minutes, assume stuck.

## When to Use

- **plan-and-execute** Phase 3 (IMPLEMENT) with many checklist items
- **e2e-orchestrator** full flow
- **ChaosTester** iteration loops

## Heartbeat Interval

- **Emit** every 5 minutes: "Phase X, item N/M, last activity: ..."
- **Stuck threshold**: 15 minutes with no progress
- **On stuck**: Save state, notify, suggest resume

## Output Format

```
[Heartbeat] plan-and-execute Phase 3 — Item 5/12 complete. Last: npm test passed for src/server.js.
```

## Implementation

- Track `last_activity_at` at each step
- Before each subagent spawn, check: if now - last_activity > 15 min → stuck
- Write heartbeat to `.claude/local/heartbeat.json` for external monitors

## Related

- `time-bounded-run` — Phase-level timeout
- `dead-man-switch` — No progress → stop
