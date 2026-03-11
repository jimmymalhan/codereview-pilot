---
name: chaos-tester
description: Simulate end users, internal users, and engineers. Run multiple random tests on UI + backend to generate errors. Iterate on its own when issues found. Handoff to FixAgent when done.
argument-hint: [base-url or ""]
---

## Execution Standard (Apply to Every Skill)

- **Phases**: Create sub-agents in **four to five different phases** in every skill.
- **Auto-execute**: Do NOT wait for user to accept changes. Proceed automatically. Pausing does not guarantee execution will run.

## Phase 1: DISCOVER
### Sub-Agent: `SurfaceScout` (model: haiku)
- **Tools**: Grep, Glob, Read
- **Prompt**: Find all API endpoints in src/server.js and routes. Find UI forms, pages, fetch calls in src/www/. List: endpoints[], ui_forms[], pages[].
- **Output**: `{ endpoints[{path, method, body_schema}], ui_forms[], pages[], health_url }`
- **Gate**: >= 1 endpoint found

## Phase 2: PLAN
### Sub-Agent: `PersonaTestDesigner` (model: sonnet)
- **Prompt**: Design random test matrix for 3 personas:
  - **End-user**: Valid-looking incident text, form submits, typical flows. Random length, edge chars.
  - **Internal-user**: Batch requests, pagination params, export formats. Mix valid + boundary values.
  - **Engineer**: Invalid JSON, missing fields, huge payloads, odd Content-Type, malformed IDs.
  For each persona: 5–10 test variants. Randomize order. Output test plan.
- **Output**: `{ tests[{persona, endpoint, method, payload, expect_error: boolean}], iteration_max: 3 }`
- **Gate**: >= 5 tests per persona

## Phase 3: IMPLEMENT
### Sub-Agent: `ChaosRunner` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run tests via curl or node. For API: `curl -X METHOD -H "Content-Type: application/json" -d '...' http://localhost:3000/path`. Capture status, body, duration. For UI: use load-test pattern or headless curl to forms. Run in random order.
- **Output**: `{ results[{persona, endpoint, status, body_snippet, error_caught: boolean}], errors_found[] }`
- **Gate**: all tests executed

## Phase 4: VERIFY
### Sub-Agent: `ErrorClassifier` (model: haiku)
- **Prompt**: Classify each error: UI error (blank, crash), 4xx, 5xx, timeout, validation. Group by endpoint + persona. List reproducible vs flaky.
- **Output**: `{ errors_by_type[], reproducible[], flaky[], summary }`
- **Gate**: errors categorized

## Phase 5: ITERATE
### Sub-Agent: `ChaosIterator` (model: haiku)
- **Prompt**: IF errors_found AND iteration < max:
  - Vary tests: different random inputs, different order, concurrent vs sequential
  - Re-run Phase 3–4
  - Increment iteration
  - IF no new errors this round OR iteration >= max → STOP, handoff
  ELSE: Handoff to FixAgent with `{ type, scope, fixAgent: "FixAgent", urgency }` per error-detector format.
- **Output**: `{ iteration, new_errors_this_round, handoff: { errors[], next: "FixAgent" } }`
- **Gate**: handoff when done iterating

## Handoff

When iteration stops (no new errors or max reached):
1. **Invoke** `error-detector` with each reproducible error
2. **Invoke** `fix-pr-creator` with output → spawns FixAgent
3. **You** (user or lead agent) come in to fix after ChaosTester surfaces issues

## Personas

| Persona | Behavior | Goal |
|---------|----------|------|
| **End-user** | Normal flows, typos, long text | Find UX/validation gaps |
| **Internal-user** | Batch, pagination, export | Find backend edge cases |
| **Engineer** | Invalid input, fuzz | Find crashes, 5xx, timeouts |

## Max Iterations

- **Default**: 3
- **Cheaper plans**: 2
- After max: handoff to FixAgent; do not loop further

## Related Skills

- `error-detector` — Classify errors for fix routing
- `fix-pr-creator` — Spawn FixAgent on handoff
- `self-fix` — FixAgent iterates on its own
- `evidence-proof` — Capture test output
