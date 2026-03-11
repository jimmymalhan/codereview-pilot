---
name: circuit-breaker
description: After N consecutive failures on same operation, stop and hand off. Prevent runaway retries on broken services.
---

# Circuit Breaker Skill

**Principle**: Fail fast. After N consecutive failures, open the circuit. Stop. Hand off. Do not retry blindly.

## States

| State | Meaning | Action |
|-------|---------|--------|
| **Closed** | Normal | Run operation |
| **Open** | N failures reached | Stop. Hand off to FixAgent or user. Do not retry. |
| **Half-open** | After cool-down | One probe attempt |

## Default Thresholds

- **N**: 3 consecutive failures
- **Cool-down**: 5 minutes before half-open
- **Cheaper plans**: N=2

## When to Apply

- `npm test` fails 3x in a row on same branch → Open, hand off
- API call returns 5xx three times → Open, hand off
- `gh pr create` fails 3x → Open, hand off
- CI remains red after 3 fix attempts → Open (invoke FixAgent with circuit open)

## Output on Open

```json
{
  "state": "open",
  "operation": "npm test",
  "failures": 3,
  "last_error": "summary",
  "handoff": "FixAgent" | "user"
}
```

## Related

- `self-fix` — Respect circuit; after N retries, circuit opens
- `cost-guardrails` — Lower N on cheaper plans
