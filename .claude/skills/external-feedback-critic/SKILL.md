# External Feedback Critic

## Purpose
Give sharp, evidence-based feedback from an external user perspective. Test both relevant and irrelevant cases. Expose weakness without politeness. Cover: malformed requests, contradictory inputs, abuse-like edge cases, timeouts, partial failures, retry storms, UI state drift, accessibility.

## Trigger
VERIFY phase or invoked by `continuous-test-feedback`. Also triggered when new user-facing features are added.

## Workflow Stage
VERIFY (Phase 3). Can also run during IMPLEMENT for early feedback.

## Required Inputs
- `target_surface`: What to test (API endpoint, UI page, CLI command).
- `base_url`: Where the system is running (e.g., `http://localhost:3000`).
- `feature_description`: What the feature claims to do.

## Exact Output Format (JSON)
```json
{
  "skill": "external-feedback-critic",
  "target_surface": "string",
  "tests_run": [
    {
      "name": "malformed JSON body",
      "input": "{ broken json",
      "expected": "400 with validation error",
      "actual": "500 internal error",
      "verdict": "FAIL",
      "severity": "high"
    }
  ],
  "summary": {
    "total": 12,
    "pass": 8,
    "fail": 4,
    "blocking": 2
  },
  "verdict": "BLOCK|WARN|PASS",
  "weaknesses": ["list of exposed weaknesses"]
}
```

## Commands to Run
- `curl -X POST http://localhost:3000/api/diagnose -d '{}'` — Missing fields.
- `curl -X POST http://localhost:3000/api/diagnose -d '{"incident":"x"}'` — Too short.
- `curl -X POST http://localhost:3000/api/diagnose -H 'Content-Type: text/plain'` — Wrong content type.
- `npm test -- --testNamePattern="error"` — Error path tests.
- Rapid-fire requests to test retry storms and rate limiting.

## Files to Inspect
- `src/server.js` — Request handling and validation.
- `src/routes/` — Endpoint definitions.
- `public/` — UI pages for state drift checks.
- `.claude/rules/api.md` — Expected error contract.

## Proof Needed
- Actual HTTP responses for each test case (status code + body).
- UI screenshot or DOM state for accessibility and state drift tests.
- Evidence that error messages are user-friendly, not stack traces.

## Fail Conditions
- Any 500 error on malformed input (should be 400).
- Stack trace or internal details exposed to user.
- UI shows stale state after error recovery.
- No rate limiting on rapid-fire requests.
- Accessibility violation (missing ARIA labels, no keyboard nav).
- Contradictory inputs accepted without validation error.

## Next Handoff
If BLOCK: hand off to `self-fix` with failing test cases. If WARN: hand off to `qa-engineer` for prioritization. If PASS: hand off to `consensus-gates`.

## What to Cache
- Test case library (reuse across surfaces).
- Known weaknesses from prior runs (regression check).

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` — Note external feedback passed.
- `feedback-log` skill — Record test patterns that passed.

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — Lower score, list failures.
- `feedback-loop` skill — Add failure patterns to prevent recurrence.
- Create issues or tasks for blocking weaknesses.

## Token Thrift Rules
- Run curl commands in parallel for independent test cases.
- Use `npm test` output for error path coverage instead of re-testing manually.
- Skip tests for unchanged surfaces.

## When NOT to Use
- Internal-only tooling with no user-facing surface.
- Documentation-only changes.
- When `qa-engineer` has already run the same test matrix.
