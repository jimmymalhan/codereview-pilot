---
name: verifier
description: Validate file:line citations, block unsupported nouns (invented APIs, fields). Score confidence from evidence. Use when verifying claims, checking citations, or running evidence validation. Every claim must cite real paths.
---

## Phase 1: DISCOVER
### Sub-Agent: `ClaimCollector` (model: haiku)
- **Tools**: Read
- **Prompt**: Collect all claims from Retriever output and Skeptic output. List each with source.
- **Output**: `{ claims[{text, source, has_citation}], total }`
- **Gate**: >= 1 claim collected

## Phase 2: PLAN
### Sub-Agent: `ValidationPlanner` (model: sonnet)
- **Prompt**: For each claim, plan validation: file_check (does file:line exist?), api_check (does endpoint exist?), schema_check (does field exist?). Assign check type.
- **Output**: `{ validation_plan[{claim, check_type, tool_to_use}] }`
- **Gate**: every claim has a check assigned

## Phase 3: IMPLEMENT
### Sub-Agent: `ClaimValidator` (model: haiku)
- **Tools**: Read, Grep, Glob
- **Prompt**: Validate each claim. Read file for file_check. Grep for api_check. Read schema for schema_check. Mark validated or blocked.
- **Output**: `{ validated[], blocked[], evidence[] }`
- **Gate**: all claims checked

## Phase 4: VERIFY
### Sub-Agent: `ConfidenceCalculator` (model: haiku)
- **Prompt**: Apply formula: base(0.5) + evidence(0.25 per verified) - hallucination(0.35 per blocked) - contradiction(0.20 per conflict). Output breakdown.
- **Output**: `{ confidence, formula_inputs, breakdown }`
- **Gate**: confidence is a number with formula shown

## Phase 5: DELIVER
### Sub-Agent: `VerifierReporter` (model: haiku)
- **Prompt**: Format output contract. Block if confidence < 0.70. List all blocked claims.
- **Output**: `{ verified: boolean, evidence[], confidence, blockedClaims[], issues[] }`
- **Gate**: output contract complete

## Contingency
IF all claims blocked → confidence = 0.0 → output REJECTED with list of unsupported claims. Do not fabricate passing results.
IF some claims can't be checked (file missing, etc.) → mark [UNVERIFIABLE], do not count as verified or blocked.

---

# Verifier Role Skill

**Purpose**: Automate evidence validation and confidence scoring end-to-end.

**Role**: Evidence Validator in the 4-agent diagnosis pipeline.

## Create → Handle → Run (E2E)

### Create
- Add verification rules for new claim types
- Wire Evidence Verifier + Hallucination Detector + Confidence Scorer
- Block unsupported nouns (invented APIs, fields, functions)
- All claims must be verifiable

### Handle
- Receive: root cause + evidence from Retriever and Skeptic
- Validate every citation exists
- Run Hallucination Detector on schema/API claims
- Score confidence: `base + evidence(0.25) - hallucination(0.35) - contradiction(0.20)`
- Output: verified evidence, validated schema refs, confidence

### Run
- `POST /api/verify-evidence` with claims
- `POST /api/detect-hallucinations` with field/API claims
- `POST /api/score-confidence` with base, claims, contradictions
- Full pipeline: verify Verifier output has all fields

## Output Contract

```json
{
  "verified": true,
  "evidence": [...],
  "confidence": 0.85,
  "blockedClaims": [],
  "issues": []
}
```

## Constraints

- ✓ Block unsupported nouns
- ✓ All claims verifiable
- ✓ Confidence formula applied
- ✗ No unverified claims pass

## Related Skills

- `evidence-proof` – Test flows, capture proof
- `backend-reliability` – API patterns for verify/detect/score endpoints
