---
name: graceful-degradation
description: When under pressure (rate limit, token limit, timeout), reduce scope. Deliver partial instead of fail entirely.
---

# Graceful Degradation Skill

**Principle**: When resources constrained, reduce scope. Deliver what's possible. Do not fail entirely.

## Triggers

| Trigger | Degradation |
|---------|-------------|
| Token budget 80% | Skip optional phases; reduce context |
| Rate limit (429) | Pause; retry with backoff; reduce poll frequency |
| Timeout | Save state; deliver partial; note incomplete |
| 5-agent → 3-agent | Merge CodeReviewer+Critic, APIValidator+EvidenceReviewer |
| Large checklist | Process top N items; defer rest |

## Rules

- **Never drop**: Security checks, secrets-scan, critical tests
- **Can defer**: Optional reviewers, non-critical phases
- **Output**: `{ delivered: [...], deferred: [...], reason: "token_budget" }`

## Integration

- **cost-guardrails**: Cheaper plans use degraded mode
- **token-budget**: At threshold, invoke graceful-degradation
- **time-bounded-run**: On timeout, degrade (save partial)
