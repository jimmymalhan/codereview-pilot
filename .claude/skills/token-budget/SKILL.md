---
name: token-budget
description: Hard cap on tokens per run. Stop before limit. Prevent runaway cost.
---

# Token Budget Skill

**Principle**: Each run has a token budget. When approaching limit, wrap up and save state.

## Default Budgets

| Run Type | Budget (tokens) |
|----------|-----------------|
| Single task | 100,000 |
| Full flow (idea→PR) | 500,000 |
| Fix PR | 50,000 |
| Cheaper plans | 50% of above |

## Enforcement

- **Checkpoint**: After each phase, estimate tokens used
- **Threshold**: At 80% → emit "approaching limit"; at 95% → save state, stop
- **State**: Write to `.claude/local/state/token-budget-<run>.json`

## Output

```json
{
  "budget": 500000,
  "used_estimate": 420000,
  "pct": 84,
  "action": "continue" | "wrap_up" | "stop",
  "state_saved": "path"
}
```

## Integration

- **plan-and-execute**: Check after each checklist item
- **cost-guardrails**: Token budget is part of cost control
- **time-bounded-run**: Complement with time limit
