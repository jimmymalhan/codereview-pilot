---
name: backend-engineer
description: APIs, handlers, validation, retry, timeout, structured errors. Use when creating routes, handlers, or reviewing backend. Express/Node patterns. Error format: type, message, traceId, suggestion, retryable. Project customization via PROJECT.md.
---

## Phase 1: DISCOVER
### Sub-Agent: `APIScout` (model: haiku)
- **Tools**: Grep, Glob, Read
- **Prompt**: Find all routes in src/server.js and src/routes/. List handlers, middleware. Find missing validation or error handling patterns.
- **Output**: `{ endpoints[], handlers[], missing_validation[], missing_error_format[] }`
- **Gate**: endpoints listed

## Phase 2: PLAN
### Sub-Agent: `BackendPlanner` (model: sonnet)
- **Prompt**: Design which endpoints to add/modify. For each: validation rules, error format, retry config, logging. Create checklist.
- **Output**: `{ endpoint_plan[{path, method, validation, errors, retry}], checklist[] }`
- **Gate**: plan has >= 1 endpoint

## Phase 3: IMPLEMENT
### Sub-Agent: `RouteBuilder` (model: haiku)
- **Tools**: Read, Write, Edit, Bash
- **Prompt**: Implement ONE endpoint at a time. Order: validation → handler → error format → logging. Copy-paste error template from skill (never invent). Run `npm test` after each edit.
- **Output**: `{ endpoint, files_changed[], test_pass: boolean }`
- **Gate**: endpoint works AND test passes

## Phase 4: VERIFY
### Sub-Agent: `APITester` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run `npm test`. Restart server (`pkill -f "node src/server"; sleep 2; npm start &`). Test happy/error/retry paths. Verify health: `curl http://localhost:3000/health`.
- **Output**: `{ test_output, endpoints_verified[], health_ok: boolean, coverage }`
- **Gate**: all endpoints respond correctly AND health returns 200

## Phase 5: DELIVER
### Sub-Agent: `BackendPackager` (model: haiku)
- **Prompt**: Update CHANGELOG. Commit. Notify user: server status, endpoints added, health check result.
- **Output**: `{ commit_sha, server_status, health_ok, endpoints_added[] }`
- **Gate**: committed AND health verified

## Contingency
IF endpoint breaks existing tests → contingency L1 (fix that endpoint only). IF health check fails after restart → check server logs, fix, retry (max 2).

## Live Feedback Handler
IF user reports "API returns 500" or "endpoint broken" → classify as High → hotfix the specific route → restart server → verify health → notify user "Fixed. Refresh."

## Server Lifecycle
MUST restart server after ANY file edit in src/. Express does not hot-reload. Always verify with `curl http://localhost:3000/health` after restart.

---

# Backend Engineer Skill

**Purpose**: Enable backend domain expertise for production APIs and server logic.

**When to use**: Creating or reviewing backend features, API routes, handlers, pipeline logic, or external integrations.

**Project customization**: Add `.claude/skills/backend-engineer/PROJECT.md` with project-specific rules (route patterns, error format, validation schemas). See docs/SKILLSETS.md → "Add Skills to Customize FE/BE".

## Create → Handle → Run (E2E)

### Create
- Add routes in `src/server.js` or `src/routes/`
- Add pipeline logic in `src/local-pipeline.js`
- Add custom skills in `src/custom-skills/`
- Validate inputs, add retry/timeout for externals
- Structure errors: type, message, traceId, suggestion, retryable

### Handle
- Every endpoint: validation → processing → response
- External calls: retry with backoff, timeout, fallback
- Log critical ops with structured format
- Ensure every new endpoint reachable from UI

### Run
```bash
npm test                    # Must pass
npm start                   # Server on :3000
curl http://localhost:3000/health
```
- Restart server after backend changes (no hot-reload)
- Verify health endpoint
- Test error paths (400, 403, 404, 503)
- Capture test output for CONFIDENCE_SCORE

## Domain Expertise

As a backend engineer with this skill, you are expert in:
- Express/Node.js patterns
- Request validation and error responses
- Retry with exponential backoff
- Timeout control
- Structured logging
- Idempotency for unsafe operations
- Graceful degradation

## Must-Do Checklist

### 1. Validation
Every endpoint must:
- Validate required fields and types
- Return `400` + message for invalid input
- Return `403` for unauthorized
- Return `404` if resource missing
- Validate state before transitions

### 2. Error Format
Every error must include:
```javascript
{
  error: 'error_code_name',
  message: 'User-friendly message',
  traceId: 'trace-xxx',  // when available
  status: 400|403|404|500|503,
  suggestion: 'What to do next',
  retryable: true|false,
  retryAfter: 2  // seconds, if retryable
}
```

### 3. External Calls
- Retry with exponential backoff (max 2 retries)
- Timeout (default 60s)
- Graceful fallback on failure

### 4. Structured Logging
```javascript
logger.info('operation_name', {
  traceId, userId, input: sanitizedInput, timestamp
});
```

### 5. Idempotency
For unsafe operations, use request ID to prevent double-processing.

### 6. API Surface
- Every supported endpoint must be reachable from the UI
- Restart server after backend changes (no hot-reload)
- Verify with `curl http://localhost:3000/health`

## File Locations

| Type | Path |
|------|------|
| Server | `src/server.js` |
| Routes | `src/routes/` or inline in server |
| Pipeline | `src/local-pipeline.js` |
| Custom skills | `src/custom-skills/` |

## Related Skills

- `backend-reliability` – Full reliability checklist
- `evidence-proof` – Run tests before claiming done

## Verification

Before claiming done:
- [ ] All inputs validated
- [ ] All errors have type, message, suggestion
- [ ] External calls have retry + timeout
- [ ] Structured logging for critical ops
- [ ] `npm test` passes
- [ ] Health endpoint verified
- [ ] Every new endpoint reachable from UI
- [ ] Aligns with `.claude/rules/backend.md` and `backend-proof.md`
