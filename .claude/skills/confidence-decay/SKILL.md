---
name: confidence-decay
description: Stale evidence = lower weight. Re-run tests if evidence older than threshold.
---

# Confidence Decay Skill

**Principle**: Evidence ages. Tests from last week are less trustworthy than tests from last run.

## Decay Thresholds

| Age | Weight | Action |
|-----|--------|--------|
| < 1 hour | 1.0 | Full confidence |
| 1–24 hours | 0.8 | Accept if critical flow |
| 1–7 days | 0.5 | Re-run before release |
| > 7 days | 0.2 | Must re-run; do not trust |

## When to Apply

- **Before claiming done**: If last `npm test` > 1 hour ago → re-run
- **Before merge**: If CI run > 24 hours ago → re-trigger
- **Confidence score**: Multiply by decay factor for stale evidence

## Output

```json
{
  "evidence_age_hours": 2,
  "decay_factor": 0.8,
  "adjusted_confidence": 76,
  "action": "re_run_recommended" | "ok" | "must_rerun"
}
```

## Related

- `evidence-proof` — Run tests; decay affects confidence
- `critic` — Quality gate uses decay-adjusted confidence
