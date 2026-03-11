# Roadmap Auditor

## Purpose
Compare roadmap claims against actual code, tests, docs, and checkpoints. Produce an exact mismatch list. Never trust status text — verify every claimed-done item against evidence.

## Trigger
- DISCOVER phase of workflow-router
- Before any roadmap item is marked complete
- Before any milestone is closed
- When CONFIDENCE_SCORE.md claims ≥80 on roadmap work

## Workflow Stage
**Phase 1 (DISCOVER)** — Runs after repo-intelligence, before plan phase.

## Required Inputs
- `.claude/ROADMAP_TODO.md`
- `.github/PROJECT_1.0.0_CHECKPOINTS.md`
- `CHANGELOG.md` (roadmap-related entries)
- `.claude/CONFIDENCE_SCORE.md`
- `README.md` (milestone/progress claims)
- repo-intelligence snapshot (file list, test results)

## Exact Output Format
```json
{
  "roadmap_version": "1.0.0",
  "total_checkpoints": 0,
  "verified_done": [],
  "claimed_done_but_unverified": [],
  "claimed_pending_confirmed": [],
  "contradictions": [
    { "surface_a": "ROADMAP_TODO", "claims": "done", "surface_b": "code", "shows": "missing", "evidence": "" }
  ],
  "confidence_inflation": [
    { "item": "", "claimed_confidence": 100, "justified_confidence": 0, "reason": "" }
  ],
  "doc_drift": [
    { "file": "", "claim": "", "reality": "" }
  ]
}
```

## Commands to Run
```bash
# Check if checkpoint files reference real code
grep -r "LS-001\|LS-006\|PUI-001\|PUI-002\|FC-007\|FC-010" .claude/ .github/ --include="*.md"
# Verify component files exist
ls -la src/www/components/Skeleton.jsx src/www/components/StepProgressBar.jsx 2>/dev/null
```

## Files to Inspect
- `.claude/ROADMAP_TODO.md` — authoritative pending list
- `.github/PROJECT_1.0.0_CHECKPOINTS.md` — full checkpoint list
- `.claude/CONFIDENCE_SCORE.md` — confidence claims vs evidence
- `CHANGELOG.md` — completion claims
- `README.md` — progress percentages
- Actual source files referenced by checkpoints

## Proof Needed
- For each "done" item: file exists + integrated + tests pass
- For each "pending" item: what's missing and why
- For CONFIDENCE_SCORE: does evidence support the claimed number?
- For README progress: does percentage match actual checkpoint count?

## Fail Conditions
- Accepting a claimed-done item without verifying the code exists
- Accepting a confidence score without verifying test evidence
- Missing a contradiction between two truth surfaces
- Not flagging inflated confidence

## Next Handoff
- Contradictions → `workflow-router` for re-planning
- Inflated confidence → update `CONFIDENCE_SCORE.md`
- Doc drift → `readme-reality-check`
- Unverified items → `test-synthesizer` for missing tests

## What to Cache
- Verified checkpoint statuses (valid for session)
- Contradiction list

## What to Update on Success
- Nothing directly — produces audit report for workflow-router

## What to Update on Failure
- Flag [UNKNOWN] items that could not be verified
- Route to `workflow-router` with partial audit

## Token Thrift Rules
- Grep for checkpoint IDs rather than reading full files
- Read only the sections of CHANGELOG that mention roadmap items
- Don't read full source files — just verify existence with ls

## When NOT to Use
- Single code change unrelated to roadmap
- When roadmap-auditor already ran this session and no git changes since
