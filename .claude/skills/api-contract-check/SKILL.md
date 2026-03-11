# API Contract Check

## Purpose
Verify that API request/response shapes in code match the documented contracts in `.claude/rules/api.md`. Catch contract drift before it reaches production.

## Trigger
- Any change to `src/server.js`, `src/routes/`, or `src/api-client.js`
- Any change to `.claude/rules/api.md`
- Pre-PR review for backend changes

## Workflow Stage
Phase 2 (Implementation) — validation during development

## Required Inputs
- Changed file paths (from `git diff --name-only`)
- `.claude/rules/api.md` contents (documented contract)
- Route handler source code

## Exact Output Format (JSON)
```json
{
  "status": "pass|fail",
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/diagnose",
      "documented": true,
      "violations": [
        {
          "type": "missing-field|extra-field|wrong-type|missing-status|wrong-status",
          "field": "traceId",
          "expected": "string in error responses",
          "actual": "not present in 500 handler",
          "location": "src/server.js:142"
        }
      ]
    }
  ],
  "undocumented": ["/api/health"],
  "summary": { "pass": 2, "fail": 1, "undocumented": 1 }
}
```

## Commands to Run
```bash
grep -nE "app\.(get|post|put|delete|patch)\(" src/server.js src/routes/*.js 2>/dev/null
grep -nE "res\.(json|send|status)\(" src/server.js src/routes/*.js 2>/dev/null
grep -nE "POST|GET|PUT|DELETE" .claude/rules/api.md
```

## Files to Inspect
- `src/server.js` — main route definitions
- `src/routes/*.js` — modular route handlers
- `.claude/rules/api.md` — documented contract (source of truth)
- `tests/server.test.js` — test assertions match contract
- `tests/integration/*.test.js` — integration test expectations

## Proof Needed
- Every route in code has a matching entry in api.md
- Every error status code in code matches api.md format
- Required fields in api.md are validated in route handlers
- Response shapes in tests match api.md documented output

## Fail Conditions
- Route exists in code but not documented in api.md
- Documented endpoint missing from code
- Error response missing required fields (error, message, traceId for 500s)
- Status code mismatch (code returns 400, api.md says 422)
- Required input validation missing (api.md says required, code doesn't check)
- Response field type mismatch

## Next Handoff
- `backend-reliability` skill (if contract violations in error handling)
- `migration-guard` skill (if contract change is breaking)
- `evidence-proof` skill (run tests to verify contract compliance)

## What to Cache
- Parsed api.md contract (endpoints, fields, status codes)
- Route list from source code

## What to Update on Success
- Nothing — contract check is read-only validation

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — record contract violations
- `.claude/rules/api.md` — update if code is correct and docs are stale
- `src/server.js` — fix if docs are correct and code drifted

## Token Thrift Rules
- Parse api.md once per session, cache the contract
- Use grep for route extraction, not full file reads
- Compare only changed endpoints, not all endpoints
- Skip unchanged files in diff

## When NOT to Use
- For frontend-only changes (no API impact)
- For test-only changes (unless test expectations changed)
- For documentation changes outside api.md
- For skill/config changes with no route modifications
