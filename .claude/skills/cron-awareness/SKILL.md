---
name: cron-awareness
description: Time-of-day awareness for heavy runs. Prefer off-peak for batch tasks.
---

# Cron-Awareness Skill

**Principle**: Heavy tasks (batch diagnose, full test suite, large PR) run better at certain times.

## Guidelines

| Task | Prefer | Avoid |
|------|--------|-------|
| Full test suite | Off-peak, low API load | Peak hours |
| Batch API calls | Staggered, rate-aware | Burst |
| Large PR creation | When CI queue short | During other PRs |
| Live-watchdog poll | 5–10 min interval | < 2 min |

## Implementation

- **No hard block** — Advisory only
- **If user says "run now"** — Proceed
- **If scheduling** — Suggest: "Heavy task. Consider off-peak. Proceed now? (y/n)"
- **Poll interval**: live-watchdog uses 5 min default; 10 min on cheaper plans

## Related

- `cost-guardrails` — Poll interval, max retries
- `live-watchdog` — Poll CI, deploy, health
