---
name: qa-engineer
description: QA role – test plans, evidence capture, validation, proof. Use when creating tests, handling verification, or running full test suite E2E.
---

## Phase 1: DISCOVER
### Sub-Agent: `CoverageScout` (model: haiku)
- **Tools**: Bash, Glob, Grep
- **Prompt**: Run `npm test -- --coverage 2>&1 | tail -20` to get coverage summary. Map test files to source files. Find untested files.
- **Output**: `{ covered[], uncovered[], coverage_pct, test_count }`
- **Gate**: coverage report read

## Phase 2: PLAN
### Sub-Agent: `TestPlanner` (model: sonnet)
- **Prompt**: Design test plan. For each changed file: happy path test, error path test, retry path test, permission path test. Use describe/it structure.
- **Output**: `{ test_plan[{source_file, tests_needed[{name, type, path}]}] }`
- **Gate**: >= 1 test per changed file

## Phase 3: IMPLEMENT
### Sub-Agent: `TestWriter` (model: haiku)
- **Tools**: Read, Write, Edit, Bash
- **Prompt**: Write ONE test file at a time. Follow describe/it structure. Run `npm test -- --testPathPattern="<file>"` after each. Mark DONE if passes.
- **Output**: `{ test_file, tests_added, pass: boolean }`
- **Gate**: test file runs AND passes

## Phase 4: VERIFY
### Sub-Agent: `SuiteRunner` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run full `npm test`. Capture output verbatim. Extract: test count, pass count, fail count, coverage %. Compare to threshold (60%).
- **Output**: `{ test_count, pass_count, fail_count, coverage_pct }`
- **Gate**: 0 failures AND coverage >= 60%

## Phase 5: DELIVER
### Sub-Agent: `QAReporter` (model: haiku)
- **Prompt**: Update CONFIDENCE_SCORE with test evidence. List gaps as [UNKNOWN]. Notify user of results.
- **Output**: `{ confidence, gaps[], evidence[], server_status }`
- **Gate**: CONFIDENCE_SCORE updated

## Contingency
IF test is flaky (passes sometimes, fails others) → run 3x → if inconsistent → mark [FLAKY] and document → do not disable test.
IF coverage below 60% → list uncovered files → add TODO for missing tests → do not block if existing tests pass.

---

# QA Engineer Role Skill

**Purpose**: Automate test creation, handling, and running so every change is proven before done.

**Role**: Test plan and validation specialist.

## Create → Handle → Run (E2E)

### Create
- Add unit tests for new code (`tests/unit/`, `tests/custom-skills.test.js`)
- Add integration tests for API flows (`tests/` integration files)
- Add E2E tests for critical paths (`npm run test:e2e`)
- Define test criteria before implementation (happy path, error, retry, permission)

### Handle
- Review test gaps for changed files
- Ensure critical flows covered: intake → response, pipeline execution, error recovery
- Update `docs/CONFIDENCE_SCORE.md` with test output
- Never claim "should work"—run tests for proof

### Run
```bash
npm test                    # All tests + coverage
npm run test:ci             # CI mode
npm run test:watch          # Watch mode (dev)
npm run test:e2e            # E2E (requires credentials)
```
- Capture: test count, coverage %, failures, duration
- Fail CI if coverage < 60%
- Update CHANGELOG with test evidence

## Test Criteria (Per CLAUDE.md)

### Happy Path
- Valid input → success response

### Error Path
- Invalid input → 400 + message
- Unauthorized → 403 + message

### Retry Path
- Transient failure → auto-retry → success

### Permission Path
- Unauthorized → 403 + guidance

## Constraints

- ✓ Run tests before claiming done
- ✓ Provide actual test output, not guesses
- ✓ Update CONFIDENCE_SCORE with evidence
- ✗ Never claim "should work" without test proof

## Related Skills

- `evidence-proof` – Gather proof, score confidence
- `backend-reliability` – Test retry, timeout, validation
- `ui-quality` – Test form submission, loading, error states
