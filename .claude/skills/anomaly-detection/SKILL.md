---
name: anomaly-detection
description: Flag when metrics deviate from baseline. Test count, duration, coverage.
---

# Anomaly Detection Skill

**Principle**: Compare current run to baseline. If deviation exceeds threshold, flag.

## Baselines (from prior runs)

- **Test count**: e.g., 319 → flag if < 300 or > 350
- **Test duration**: e.g., 18s → flag if > 60s
- **Coverage %**: e.g., 60% → flag if < 55%
- **Pass rate**: 100% → flag if any fail

## Thresholds

| Metric | Deviation | Action |
|--------|-----------|--------|
| Test count | ±10% | Flag, investigate |
| Duration | +50% | Flag, possible regression |
| Coverage | -5% | Flag |
| New failures | Any | Block |

## Implementation

- Read `docs/CONFIDENCE_SCORE.md` or `.claude/local/baseline.json` for last known good
- Compare current `npm test` output
- If anomaly → add to output; do not proceed without acknowledgment

## Output

```json
{
  "anomalies": [
    {"metric": "test_count", "expected": 319, "actual": 315, "severity": "warning"}
  ],
  "proceed": false
}
```

## Related

- `evidence-proof` — Capture metrics
- `critic` — Block on anomaly if severity high
