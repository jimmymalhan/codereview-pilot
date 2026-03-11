---
name: skeptic
description: Challenge primary hypothesis with materially different alternatives. Produce 2+ competing theories, each with evidence. Use when validating diagnosis, detecting hallucination, or running counter-analysis. Alternatives must differ in root cause mechanism.
---

## Phase 1: DISCOVER
### Sub-Agent: `ClaimScanner` (model: haiku)
- **Tools**: Read
- **Prompt**: List all claims from primary hypothesis. Identify which are verified vs assumed. Count assumptions.
- **Output**: `{ claims[], assumptions[], verified_count, assumed_count }`
- **Gate**: >= 1 claim found

## Phase 2: PLAN
### Sub-Agent: `AlternativeDesigner` (model: sonnet)
- **Prompt**: Design exactly 2 alternative theories. Each MUST differ in root cause mechanism (not just wording). Each must identify what evidence would support it.
- **Output**: `{ alternatives[{theory, how_different, evidence_needed}] }`
- **Gate**: exactly 2 alternatives designed

## Phase 3: IMPLEMENT
### Sub-Agent: `TheoryBuilder` (model: haiku)
- **Tools**: Grep, Read
- **Prompt**: Gather evidence for each alternative. Search codebase for supporting patterns. Every claim must cite file:line. Run Hallucination Detector on claims.
- **Output**: `{ alternatives[{theory, evidence[{path, line}], flagged_claims[]}] }`
- **Gate**: evidence gathered per alternative

## Phase 4: VERIFY
### Sub-Agent: `HallucinationChecker` (model: haiku)
- **Prompt**: Verify no invented fields/APIs/functions. Check every file:line citation exists. Flag any unsupported claims.
- **Output**: `{ checked_claims, hallucinations_found, valid_claims }`
- **Gate**: 0 hallucinations

## Phase 5: DELIVER
### Sub-Agent: `SkepticReporter` (model: haiku)
- **Prompt**: Format output contract. Include alternatives with evidence and flagged claims.
- **Output**: `{ alternatives[], flaggedClaims[], riskScore }`
- **Gate**: output contract complete

## Contingency
IF cannot find evidence for ANY alternative → output alternatives with [UNSUPPORTED] marker and riskScore 0.1.
IF both alternatives are too similar (same root cause, different wording) → discard and try again with different mechanism. Max 2 retries.

---

# Skeptic Role Skill

**Purpose**: Automate theory challenging and alternative hypothesis generation end-to-end.

**Role**: Theory Challenger in the 4-agent diagnosis pipeline.

## Create → Handle → Run (E2E)

### Create
- Add counter-analysis patterns
- Wire Hallucination Detector (`/api/detect-hallucinations`) for field/API checks
- Define "materially different" criteria—not minor variations
- Each alternative must cite evidence

### Handle
- Receive: initial root cause + evidence from Retriever
- Produce 1+ alternative theories with competing evidence
- Use Hallucination Detector on all claims
- Output: alternatives with file:line citations
- Pass to Verifier for validation

### Run
- Submit diagnosis request → verify Skeptic section in results
- Check `/api/detect-hallucinations` with test claims
- Ensure alternatives are materially different (not cosmetic)

## Output Contract

```json
{
  "alternatives": [
    {
      "theory": "Alternative root cause",
      "evidence": [{"path": "...", "line": 42}],
      "strength": "competing|weaker"
    }
  ],
  "flaggedClaims": [],
  "riskScore": 0.0
}
```

## Constraints

- ✓ Produce materially different theories
- ✓ Each alternative must cite evidence
- ✗ No minor variations only
- ✗ No claims without Hallucination Detector check

## Related Skills

- `evidence-proof` – Validate before emitting
- `project-guardrails` – Never invent
