---
name: consensus-resolver
description: When multiple agents disagree, resolve via rules. No deadlock.
---

# Consensus Resolver Skill

**Principle**: Multiple agents (e.g., 5-agent verification) may disagree. Resolve deterministically.

## Resolution Rules

| Scenario | Resolution |
|----------|------------|
| All agree PASS | PASS |
| All agree REJECT | REJECT |
| Majority PASS (≥3/5) | PASS with minority noted |
| Majority REJECT | REJECT; list blockers |
| Tie (2-2-1) | REJECT (conservative) |
| One critical blocker | REJECT regardless of majority |

## Critical Blockers (Override Majority)

- Security issue
- Data loss risk
- Test failure
- Secret exposure

## Output

```json
{
  "consensus": "pass" | "reject",
  "votes": {"CodeReviewer": "pass", "APIValidator": "reject", ...},
  "blockers": [],
  "minority_concerns": []
}
```

## Integration

- **five-agent-verification**: Use consensus-resolver when opinions differ
- **skeptic vs verifier**: When they conflict, escalate or use evidence weight
