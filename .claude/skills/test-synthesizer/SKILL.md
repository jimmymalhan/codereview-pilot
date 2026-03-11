# Test Synthesizer

## Purpose
Generate missing tests for untested code paths. Map existing tests to source files. Identify test gaps. Produce test skeletons for critical flows that lack coverage.

## Trigger
- PLAN phase when roadmap-auditor finds untested checkpoints
- After any new source file is created without a corresponding test
- When coverage drops below 60% threshold
- When end-to-end-verifier finds untested critical flows

## Workflow Stage
**Phase 2 (PLAN)** — Produces test plan. **Phase 3 (IMPLEMENT)** — Generates test code.

## Required Inputs
- repo-intelligence snapshot (coverage report)
- List of changed/new source files
- `.claude/rules/testing.md` (test standards)
- Existing test file inventory from tests/

## Exact Output Format
```json
{
  "coverage_current": { "statements": 0, "branches": 0, "functions": 0, "lines": 0 },
  "untested_files": [
    { "file": "", "reason": "", "priority": "critical|high|medium|low", "suggested_test_file": "" }
  ],
  "test_gaps": [
    { "source_file": "", "missing_tests": ["happy_path", "error_case", "retry", "permission"], "test_file": "" }
  ],
  "test_skeletons": [
    { "test_file": "", "describe_blocks": [], "test_count": 0 }
  ]
}
```

## Commands to Run
```bash
npm test -- --coverage --coverageReporters=json-summary 2>&1 | tail -40
```

## Files to Inspect
- `jest.config.js` (test configuration, coverage thresholds)
- `tests/` directory structure
- Coverage report in `coverage/coverage-summary.json`
- `.claude/rules/testing.md` (required test categories)

## Proof Needed
- Coverage numbers from actual npm test output
- File existence verified for each untested file
- Test categories from testing.md matched against existing tests

## Fail Conditions
- Generating tests for files that don't exist
- Claiming coverage without running npm test
- Missing critical flow tests (request intake, pipeline, error recovery)
- Not following test file naming convention from testing.md

## Next Handoff
- Test skeletons → `qa-engineer` or `general-purpose` for implementation
- Coverage report → `confidence-score` for evidence update

## What to Cache
- Coverage summary (valid until source changes)
- Test-to-source mapping

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` with new coverage numbers

## What to Update on Failure
- Flag untested critical flows as [UNKNOWN] risks

## Token Thrift Rules
- Use coverage JSON summary, not full report
- Map tests by naming convention (module.test.js → module.js) rather than reading each file
- Generate skeleton structure, not full test implementations

## When NOT to Use
- All files have corresponding tests and coverage ≥ 60%
- Change is documentation-only with no source file impact
