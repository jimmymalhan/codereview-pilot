---
name: audit-trail
description: Append-only log of all agent actions. Immutable. For compliance and accountability.
---

# Audit Trail Skill

**Principle**: Every significant agent action is logged. Append-only. Tamper-evident.

## Log Location

- **File**: `.claude/local/audit/audit-<date>.jsonl`
- **Format**: One JSON object per line; append only
- **Rotation**: Daily or by size (e.g., 10MB)

## Events to Log

| Event | Fields |
|-------|--------|
| phase_start | traceId, agent, phase, skill, timestamp |
| phase_end | + outcome, duration_ms |
| commit | traceId, sha, branch, files[], timestamp |
| push | traceId, branch, remote, timestamp |
| pr_create | traceId, pr_url, branch, timestamp |
| pr_merge | traceId, pr_url, merged_by, timestamp |
| deploy | traceId, target, timestamp |
| error | traceId, error_type, message, context |

## Schema

```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "traceId": "string",
  "event": "phase_end|commit|push|pr_create|error|...",
  "agent": "string",
  "actor": "agent|user",
  "payload": {},
  "hash": "sha256(prev_hash + this_record)"
}
```

## Hash Chain

- Each record includes hash of (prev_hash + this_record)
- Enables tamper detection: recompute hashes to verify

## Integration

- `structured-logging` — Audit extends structured logs
- `pr-push-merge` — Log commit, push, pr_create
- `fix-pr-creator` — Log fix branch, pr
- `idea-to-production` — Log handoffs

## Related

- `structured-logging` — Base format
- Compliance (GDPR, SOC 2) — Audit supports accountability
