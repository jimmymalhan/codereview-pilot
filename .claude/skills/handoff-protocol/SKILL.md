---
name: handoff-protocol
description: Structured state transfer between agents. No context loss. Resume from exact point.
---

# Handoff Protocol Skill

**Principle**: When one agent hands off to another, transfer state in a structured format. Recipient can resume exactly.

## Handoff Schema (Compact—Less Context)

```json
{
  "from": "Plan",
  "to": "General-Purpose",
  "traceId": "string",
  "scope": { "files": [], "phase": "IMPLEMENT" },
  "findings": [],
  "next": "checklist_item_4",
  "resume": "resume plan-and-execute"
}
```

**Rule**: Pass only scope + findings. No full file contents. Recipient fetches what it needs. Use less memory.

## Validator (Before Handoff)

Ensure: from, to, traceId, scope, next present. scope must have phase. Reject if schema invalid.

## Less Context Rule

- Each agent receives: scope (files, phase) + findings from prior agent only
- Agent fetches files on demand. No pre-loading full context.
- Handoff state ≤ 500 chars when possible

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
