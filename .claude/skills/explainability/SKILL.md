---
name: explainability
description: For critical decisions, output "why I did X". Enables debugging and trust.
---

# Explainability Skill

**Principle**: Critical decisions must include a short rationale. Enables auditing and debugging.

## When to Explain

| Decision | Explain |
|----------|---------|
| REJECT (Critic) | Why blocked |
| Skip phase | Why skipped |
| Choose approach A over B | Rationale |
| Merge vs rebase | Why |
| Auto-merge triggered | Conditions met |

## Format

```json
{
  "decision": "reject",
  "rationale": "Confidence 0.65 < 0.70 threshold; missing rollback in output.",
  "evidence": ["critic/output", "evidence-proof/confidence"]
}
```

## Length

- Max 2 sentences
- Cite evidence (file, agent, output)
- No speculation—only observed

## Integration

- **critic**: Append rationale to REJECT
- **consensus-resolver**: Explain tie-break
- **auto-merge**: Log why merge was triggered
- **circuit-breaker**: Explain why circuit opened
