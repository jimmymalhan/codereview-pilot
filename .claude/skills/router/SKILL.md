---
name: router
description: Classify incidents to known types (Resource Contention, Memory Leak, Config Error, DNS, Concurrency, Deployment). Use when handling diagnosis intake, symptoms, incident classification, or pipeline routing. Never invent new categories.
---

## Phase 1: DISCOVER
### Sub-Agent: `PatternScout` (model: haiku)
- **Tools**: Grep, Read
- **Prompt**: Find existing classification patterns in `src/local-pipeline.js` and `src/pipeline/`. List known incident types.
- **Output**: `{ existing_types[], patterns[], file_locations[] }`
- **Gate**: types listed

## Phase 2: PLAN
### Sub-Agent: `ClassificationDesigner` (model: sonnet)
- **Prompt**: Map symptoms to types. Define decision tree. Never add new categories without evidence from codebase.
- **Output**: `{ decision_tree, new_patterns[], validation_rules[] }`
- **Gate**: decision tree has >= 1 path

## Phase 3: IMPLEMENT
### Sub-Agent: `PatternWriter` (model: haiku)
- **Prompt**: Add classification logic. Use exact output format: `{ type, confidence, rationale }`. Edit ONE file at a time. Run `npm test` after.
- **Output**: `{ patterns_added, files_changed[], test_pass: boolean }`
- **Gate**: code compiles AND tests pass

## Phase 4: VERIFY
### Sub-Agent: `ClassificationTester` (model: haiku)
- **Prompt**: Test each known type with sample input. Verify output format matches contract. Run `npm test`.
- **Output**: `{ types_tested[], all_pass: boolean, coverage }`
- **Gate**: all known types classified correctly

## Phase 5: DELIVER
### Sub-Agent: `RouterPackager` (model: haiku)
- **Prompt**: Update tests if needed. Commit. Update CHANGELOG. Notify user of server status.
- **Output**: `{ tests_pass, commit_sha, server_status }`
- **Gate**: npm test passes

## Contingency
IF unknown incident type encountered → classify as "Unknown" with confidence 0.3 → ask user to define category. Never invent categories.
IF classification logic breaks existing tests → contingency L1 (fix inline) → L2 (simplify).

---

# Router Role Skill

**Purpose**: Automate incident classification and routing so the pipeline handles every request correctly.

**Role**: Incident Classifier in the 4-agent diagnosis pipeline.

## Create → Handle → Run (E2E)

### Create
- Add new classification patterns to match symptom → type
- Extend known types only when evidence supports it
- Never invent categories—use: Resource Contention, Memory Leak, Config Error, DNS, Concurrency, Deployment

### Handle
- Receive raw incident (symptoms, timestamps, affected services)
- Match to known patterns via `src/local-pipeline.js` Router stage
- Output: `{ type, confidence, rationale }`
- Pass to Retriever with classification + timestamp

### Run
- `node src/local-pipeline.js` or `/api/diagnose` with incident text
- Verify Router output in pipeline result
- Ensure classification drives evidence gathering path

## Output Contract

```json
{
  "type": "Resource Contention|Memory Leak|Config Error|DNS|Concurrency|Deployment",
  "confidence": 0.0,
  "rationale": "Evidence-based reason"
}
```

## Constraints

- ✓ Classify to known types only
- ✓ Cite symptom patterns that triggered classification
- ✗ Never invent new categories without evidence
- ✗ Never output confidence without rationale

## File Locations

| Asset | Path |
|-------|------|
| Pipeline | `src/local-pipeline.js` |
| Router stage | Search for "Router" in pipeline |
| Run script | `node src/run.js` |
