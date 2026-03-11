---
name: handoff-protocol
description: Structured state transfer between agents. No context loss. Resume from exact point.
---

# Handoff Protocol Skill

**Principle**: When one agent hands off to another, transfer state in a structured format. Recipient can resume exactly.

## Handoff Schema

```json
{
  "from_agent": "Plan",
  "to_agent": "General-Purpose",
  "timestamp": "ISO8601",
  "traceId": "string",
  "state": {
    "phase": "IMPLEMENT",
    "checklist": [...],
    "items_done": [1, 2, 3],
    "items_remaining": [4, 5],
    "context": {},
    "blockers": []
  },
  "resume_command": "resume plan-and-execute",
  "required_inputs": []
}
```

## Validator (Before Handoff)

Ensure: from_agent, to_agent, timestamp, traceId, state, resume_command present. state must have phase and checklist or items_done/remaining. Reject handoff if schema invalid.

## Rules

- **Complete**: All required fields present
- **Validated**: Schema check before handoff (see Validator above)
- **Immutable**: Handoff record appended to audit-trail
- **Resumable**: Recipient has everything to continue

## Integration

- **plan-and-execute** → **General-Purpose**: Checklist + scope
- **FixAgent** → **self-fix**: Error context + retry count
- **live-watchdog** → **fix-pr-creator**: Error type, scope, urgency
- **time-bounded-run**, **dead-man-switch**: Handoff = state save
