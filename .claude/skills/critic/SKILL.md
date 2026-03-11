---
name: critic
description: Quality gate. APPROVE only if root_cause, evidence, fix_plan, rollback, tests, confidence >= 0.70. Use when running final validation, 5-agent verification, or blocking low-confidence output. No partial approvals.
---

## Phase 1: DISCOVER
### Sub-Agent: `OutputCollector` (model: haiku)
- **Tools**: Read
- **Prompt**: Collect final output from pipeline. Check which of the 6 required fields are present: root_cause, evidence, fix_plan, rollback, tests, confidence.
- **Output**: `{ fields_present[], fields_missing[], confidence_value }`
- **Gate**: output collected

## Phase 2: PLAN
### Sub-Agent: `GateDesigner` (model: sonnet)
- **Prompt**: Define pass/fail for each field. Field is valid if: non-empty, has concrete content (not placeholder), confidence >= 0.70.
- **Output**: `{ gates[{field, present, valid, reason}] }`
- **Gate**: 6 gates defined

## Phase 3: IMPLEMENT
### Sub-Agent: `GateChecker` (model: haiku)
- **Prompt**: Check each gate. Is field present? Is it non-empty? Is confidence >= 0.70? Are all 6 fields present?
- **Output**: `{ gates_checked[], all_pass: boolean, blocking[] }`
- **Gate**: all 6 gates checked

## Phase 4: VERIFY
### Sub-Agent: `DecisionMaker` (model: haiku)
- **Prompt**: APPROVED if all 6 gates pass AND confidence >= 0.70. REJECTED with specific blocking issues listed. No partial approvals ever.
- **Output**: `{ decision: "APPROVED"|"REJECTED", blocking[], confidence }`
- **Gate**: decision made

## Phase 5: DELIVER
### Sub-Agent: `CriticReporter` (model: haiku)
- **Prompt**: Output final verdict. If REJECTED, list exactly which fields are missing/invalid and what would fix them.
- **Output**: `{ approved: boolean, blocking[], fix_suggestions[], confidence }`
- **Gate**: verdict delivered

## Contingency
IF output has 0 of 6 fields → REJECTED immediately. Do not attempt to fill in missing fields.
IF confidence is exactly on boundary (0.70) → APPROVED but flag as "marginal — add more evidence."

---

# Critic Role Skill

**Purpose**: Automate quality gating and output contract validation end-to-end.

**Role**: Quality Gate in the 4-agent diagnosis pipeline.

## Create → Handle → Run (E2E)

### Create
- Define quality gates (confidence >= 0.70, all fields present)
- Add blocking rules for missing/partial output
- No partial approvals—APPROVED or REJECTED only

### Handle
- Receive: full output contract (root cause, evidence, fix plan, rollback, tests, confidence)
- Check: confidence >= 0.70
- Check: all 6 fields present and non-empty
- Output: APPROVED or REJECTED with specific blocking issues

### Run
- Full pipeline: `node src/local-pipeline.js` or UI submit
- Verify Critic blocks when confidence < 0.70
- Verify Critic blocks when any field missing
- Verify APPROVED only when all gates pass

## Output Contract (Required Fields)

1. **Root Cause** – Why the incident occurred
2. **Evidence** – File:line citations from repo
3. **Fix Plan** – Specific steps to resolve
4. **Rollback Plan** – How to undo the fix
5. **Tests** – How to verify the fix
6. **Confidence** – Score >= 0.70

## Constraints

- ✓ Block if confidence < 0.70
- ✓ Block if any field missing
- ✓ List specific blocking issues when REJECTED
- ✗ No partial approvals

## Related Skills

- `evidence-proof` – Confidence backed by tests
- `backend-reliability` – Error handling for gate logic
