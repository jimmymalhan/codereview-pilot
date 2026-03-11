---
name: confidence-score
description: Evidence-backed confidence scoring. 95-100 only with passing tests. Track in .claude/CONFIDENCE_SCORE.md. Use when claiming done, verifying work, or updating evidence ledger.
---

# Confidence Score (Evidence Ledger)

**Purpose**: Confidence levels backed by test results and evidence. 95-100 only when critical flows pass. Truth ledger for all tasks.

---

## Scoring Rules

| Score | Condition |
|-------|-----------|
| **95-100** | Critical flows verified; tests pass in CI; unknowns documented |
| **80-94** | Strong proof; minor open items; tests pass locally |
| **60-79** | Implemented but incomplete proof; some flows untested |
| **40-59** | Partial evidence; major gaps |
| **0-39** | Unverified; no evidence — do not release |

---

## Evidence Template

Before claiming done:
- [ ] `npm test` output (suites, passed, coverage)
- [ ] CI workflow result (Node 18, 20)
- [ ] Critical flow verification (list steps)
- [ ] Rollback path
- [ ] Unknowns marked [UNKNOWN]

---

## Ledger Location

`.claude/CONFIDENCE_SCORE.md` — Append session evidence. Format:

```markdown
## [Task] — Confidence X/100
### Evidence
- npm test: ...
- CI: ...
- Rollback: ...
### Unknowns
- [UNKNOWN] ...
```

---

## Integration

- **guardrails.md**: Update confidence ledger before claiming done
- **CLAUDE.md**: Done Definition includes confidence update
- **critic**: Quality gate ≥ 0.70; all 6 output fields
