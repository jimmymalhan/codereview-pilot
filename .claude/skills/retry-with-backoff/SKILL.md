---
name: retry-with-backoff
description: Exponential backoff for API calls, npm, gh. Use when 429, 503, or transient failures.
---

# Retry with Backoff Skill

**Principle**: On transient failure (429, 503, ECONNRESET), wait before retry. Do not hammer.

## Schedule

| Attempt | Wait (seconds) | Max |
|---------|----------------|-----|
| 1 | 0 | initial |
| 2 | 2 | 2^1 |
| 3 | 4 | 2^2 |
| 4 | 8 | 2^3 |
| 5 | 16 | 2^4 |
| Max retries | 5 | then fail |

## When to Retry

- **429** (rate limit) → Backoff, retry
- **503** (service unavailable) → Backoff, retry
- **ECONNRESET**, **ETIMEDOUT** → Backoff, retry
- **4xx** (except 429) → Do NOT retry
- **5xx** (except 503) → Retry once, then circuit breaker

## Implementation

```bash
# Example: retry with backoff
for i in 1 2 3 4 5; do
  if curl -s ...; then break; fi
  sleep $((2**i))
done
```

## Related

- `circuit-breaker` — After N failures, stop
- `backend-reliability` — Retry for external APIs
