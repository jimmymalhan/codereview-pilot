---
name: structured-logging
description: JSON logs with traceId, agent, phase for debugging. Consistent format for all agent actions.
---

# Structured Logging Skill

**Principle**: Every agent action logs in a parseable, searchable format. Enables debugging and incident response.

## Log Format (JSON)

```json
{
  "timestamp": "ISO8601",
  "traceId": "uuid or session-id",
  "agent": "Plan|General-Purpose|FixAgent|...",
  "phase": "DISCOVER|PLAN|IMPLEMENT|VERIFY|DELIVER",
  "skill": "plan-and-execute",
  "action": "checklist_built|test_run|commit|...",
  "outcome": "success|failure|partial",
  "duration_ms": 1200,
  "details": {}
}
```

## Required Fields

| Field | Required | Example |
|-------|----------|---------|
| timestamp | Yes | 2025-03-10T14:30:00Z |
| traceId | Yes | Pass from parent; create if root |
| agent | Yes | General-Purpose |
| phase | Yes | IMPLEMENT |
| action | Yes | npm_test |
| outcome | Yes | success |

## Where to Write

- **File**: `.claude/local/logs/agent-<date>.jsonl` (append)
- **Or** stdout when `AGENT_LOG=1`
- **Trace propagation**: Pass traceId to subagents and API calls

## Integration

- Before each phase: log phase_start
- After each phase: log phase_end with outcome, duration
- On error: log with outcome=failure, details.error

## Related

- `audit-trail` — Immutable action log
- `evidence-proof` — Capture test output
