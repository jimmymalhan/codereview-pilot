# Testing Documentation

## Overview

- **Framework**: Jest 29.7.0 with ES module support (`--experimental-vm-modules`)
- **Assertion Library**: Jest built-in (`expect`)
- **Mocking**: Jest built-in + custom `MockOrchestratorApi`
- **Coverage Tool**: Istanbul (via Jest)
- **CI/CD**: GitHub Actions (`.github/workflows/test.yml`)

## Test Coverage Report

**367 total tests across 11 test suites -- 100% pass rate**

| # | Test Suite | File | Tests | Focus Area |
|---|-----------|------|-------|------------|
| 1 | Integration Tests | `integration-tests.test.js` | 89 | 10 scenario end-to-end pipeline: task creation, routing, approval workflows (all 5 state machine paths), budget enforcement, audit logging, heartbeat detection, rollback consistency, error handling, concurrent isolation, CLAUDE.md contract enforcement |
| 2 | Input Validator | `input-validator.test.js` | 50 | SC-1 compliance: task type validation, prompt injection detection (9 patterns), evidence validation, constraints allowlist, string sanitization, edge cases |
| 3 | File Access Guard | `file-access-guard.test.js` | 48 | SC-2 compliance: per-agent read/write permissions (router, retriever, skeptic, verifier, orchestrator), deny-by-default, protected file enforcement, glob pattern matching |
| 4 | Log Sanitizer | `log-sanitizer.test.js` | 25 | SC-4 compliance: PII/secret sanitization for 8 pattern types (API keys, env vars, emails, IPs, bearer tokens), object/nested sanitization, pattern detection |
| 5 | Error Handler | `error-handler.test.js` | 21 | Error classification (5 types), retry with exponential backoff, retryability rules, error logging, escalation actions, context preservation |
| 6 | Phase 4 Advanced | `phase-4.test.js` | 20 | Monitoring dashboard, performance optimizer (caching, metrics), extended agent framework (8 agents, plugins, custom agents), backward compatibility |
| 7 | Orchestrator Client | `orchestrator-client.test.js` | 18 | Local orchestrator: initialization (8 modules), task CRUD, agent invocation, heartbeat, audit trail, budget status, module coordination |
| 8 | Agent Wrapper | `agent-wrapper.test.js` | 14 | 10-step agent lifecycle: invoke 4 agents, input validation, output sanitization, concurrent lock, execution tracking, audit logging, error handling |
| 9 | MCP Client | `mcp-client.test.js` | -- | MCP client lifecycle: connect/disconnect, provider registration, context fetching with timeout and caching, graceful degradation |
| 10 | MCP Context Providers | `mcp-context-providers.test.js` | -- | Context providers: repo, logs, schema, metrics; file discovery, content retrieval, error handling |
| 11 | MCP Integration | `mcp-integration.test.js` | -- | End-to-end MCP pipeline: createMcpClient factory, multi-provider fetch, cache invalidation |

## Coverage Metrics

| Module | Statements | Branches | Functions | Lines | Target | Status |
|--------|-----------|----------|-----------|-------|--------|--------|
| **Global** | 89.87% | 83.07% | 85.07% | 89.9% | 60% | PASS |
| approval-state-machine.js | 97.91% | 95.23% | 100% | 97.91% | 90% | PASS |
| budget-enforcer.js | 96.22% | 90% | 100% | 96.22% | 90% | PASS |
| audit-logger.js | 95.23% | 89.47% | 100% | 94.59% | 85% | PASS |
| task-manager.js | 100% | 97.91% | 100% | 100% | -- | PASS |
| agent-wrapper.js | 95.23% | 76.47% | 100% | 95.23% | -- | PASS |
| error-handler.js | 97.95% | 90.32% | 100% | 97.87% | -- | PASS |
| heartbeat-monitor.js | 93.75% | 68.96% | 100% | 93.75% | -- | PASS |
| input-validator.js | 91.17% | 87.09% | 100% | 91.04% | -- | PASS |
| file-access-guard.js | 93.1% | 66.66% | 100% | 93.1% | -- | PASS |
| log-sanitizer.js | 88.88% | 71.87% | 100% | 88.37% | -- | PASS |
| orchestrator-client.js | 88.88% | 76.47% | 92.3% | 88.88% | -- | PASS |
| extended-agent-framework.js | 94.44% | 66.66% | 100% | 97.14% | -- | PASS |
| monitoring-dashboard.js | 81.08% | 53.33% | 68.75% | 82.85% | -- | PASS |
| performance-optimizer.js | 81.48% | 75% | 100% | 88% | -- | PASS |

Coverage thresholds are enforced in `jest.config.js`:
- Global minimum: 60% (branches, functions, lines, statements)
- `approval-state-machine.js`: 90%
- `budget-enforcer.js`: 90%
- `audit-logger.js`: 85%

## Testing Capabilities

### Unit Tests

Each core module has dedicated test coverage:

- **Router Agent**: Task routing, classification, input validation
- **Retriever Agent**: Evidence retrieval, source access
- **Skeptic Agent**: Alternative theory generation, blocking
- **Verifier Agent**: Output verification, unsupported noun detection
- **Critic/Approval State Machine**: All 5 state machine paths (happy path, skeptic block, escalation, auto-approve prevention, timeout)

### Integration Tests

The `integration-tests.test.js` suite covers the full 4-agent pipeline end-to-end across 10 scenarios:

1. Task Creation and Schema Validation (6 tests)
2. Router Agent Invocation (4 tests)
3. Approval Workflow Sequencing -- all 5 state machine paths (12 tests)
4. Budget Enforcement (5 tests)
5. Audit Logging (7 tests)
6. Heartbeat Detection (6 tests)
7. Rollback State Consistency (3 tests)
8. Error/Failure Handling (7 tests)
9. Concurrent Agent Isolation (4 tests)
10. CLAUDE.md Contract Enforcement (7 tests)

### MCP Integration Tests

Three dedicated test suites validate the Model Context Protocol layer:

- **mcp-client.test.js**: Client lifecycle (connect, disconnect, reconnect), provider registration/deregistration, context fetching with timeout enforcement, response caching and cache invalidation, graceful degradation when MCP server is unavailable
- **mcp-context-providers.test.js**: All 4 context providers (repo, logs, schema, metrics), file discovery and content retrieval, directory scanning, error handling for missing files
- **mcp-integration.test.js**: End-to-end `createMcpClient()` factory, multi-provider parallel fetch via `fetchMultiple()`, cache behavior across providers

### Error Scenario Tests

All 9 production failure scenarios are covered in the error handler and integration tests:

- Validation failures (invalid type, missing fields, schema violations)
- Permission denials (file access, agent role violations)
- Timeout handling (heartbeat timeout, execution timeout)
- Resource exhaustion (budget limits, memory)
- Concurrent execution conflicts (lock contention)
- State machine invalid transitions
- Prompt injection attempts (9 patterns detected)
- Invented field/noun rejection
- Rollback consistency after failure

### Security Tests

- **SC-1 (Input Validation)**: `input-validator.test.js` -- 50 tests for prompt injection detection, schema validation, constraint allowlist
- **SC-2 (File Access)**: `file-access-guard.test.js` -- 48 tests for deny-by-default file access control per agent
- **SC-4 (Log Sanitization)**: `log-sanitizer.test.js` -- 25 tests for PII/secret redaction across 8 pattern types

### Performance Tests

- Evidence retrieval target: <500ms per query
- Error classification target: <200ms per classification
- Cache hit/miss tracking in performance optimizer
- Exponential backoff timing validation in retry logic

### CI Testing

GitHub Actions runs on every push/PR to `main`:

- Tests against Node.js 18 and 20
- Coverage thresholds enforced by Jest configuration
- Coverage report uploaded as artifact (30-day retention)
- See `.github/workflows/test.yml`

## How to Test

### Running the Full Test Suite

```bash
npm test
```

This runs all 11 test suites with coverage reporting.

### Running Specific Test Files

```bash
# Run a single test file
npx jest tests/integration-tests.test.js

# Run tests matching a pattern
npx jest --testPathPattern="security"

# Run only file-access-guard tests
npx jest tests/file-access-guard.test.js

# Run MCP tests only
npx jest tests/mcp-client.test.js tests/mcp-context-providers.test.js tests/mcp-integration.test.js
```

Note: All commands require the `--experimental-vm-modules` flag for ES module support. The `npm test` script includes this automatically. For direct `npx jest` calls:

```bash
node --experimental-vm-modules node_modules/.bin/jest tests/file-access-guard.test.js
```

### Watch Mode

```bash
npm run test:watch
```

Re-runs tests on file changes. Useful during development.

### Coverage Reports

```bash
# Generate coverage report (included in npm test)
npm test

# View HTML coverage report
open coverage/lcov-report/index.html
```

Coverage output is written to the `coverage/` directory.

### CI-Specific Run

```bash
npm run test:ci
```

Produces text and lcov coverage reports suitable for CI pipelines.

### E2E Tests (Staging)

```bash
npm run test:e2e
```

Requires environment variables:
- `ANTHROPIC_API_KEY` -- Anthropic API key for live agent calls

E2E tests are not run in CI by default (requires credentials).

### Interpreting Test Results

Jest output shows:

- **PASS/FAIL** per test suite
- Individual test names with timing
- Coverage summary table (statements, branches, functions, lines)
- Threshold violations highlighted in red

A passing run looks like:

```
Test Suites:  11 passed, 11 total
Tests:        367 passed, 367 total
Snapshots:    0 total
Time:         ~17s
```

### Debugging Test Failures

```bash
# Run with verbose output
npx jest --verbose tests/error-handler.test.js

# Run a single test by name
node --experimental-vm-modules node_modules/.bin/jest -t "should classify validation errors"

# Debug with Node inspector
node --experimental-vm-modules --inspect-brk node_modules/.bin/jest tests/agent-wrapper.test.js
```

Common failure causes:
- **Import errors**: Check ES module syntax and `--experimental-vm-modules` flag
- **Timeout errors**: Some retry tests have 15s timeouts; ensure `jest.setTimeout` or per-test timeout is sufficient
- **Coverage threshold failures**: Check `jest.config.js` for per-module thresholds

## Test Fixtures

| Fixture | File | Purpose |
|---------|------|---------|
| Sample incidents | `tests/fixtures/sample-incidents.js` | 8 task/output fixtures (valid, invalid type, missing fields, invented fields) |
| Mock API | `tests/fixtures/mock-orchestrator-api.js` | Full mock orchestrator API with configurable failure modes |
| Incident data | `incidents/incident-001.txt` | Real incident input for manual testing |

### Manual Testing -- Example Incident

Input a task with evidence from `incidents/incident-001.txt`:

```json
{
  "type": "debug",
  "evidence": [
    {
      "source": "logs/api-server.log",
      "content": "ERROR: column \"user_id\" does not exist"
    },
    {
      "source": "migrations/003_add_user_id.sql",
      "content": "ALTER TABLE orders ADD COLUMN user_id INTEGER"
    }
  ],
  "hypothesis": "Schema migration 003 was not applied to production database"
}
```

Expected output contract (from CLAUDE.md):

```json
{
  "root_cause": "Schema migration 003 was not applied to production database",
  "evidence": [{"source": "...", "finding": "..."}],
  "fix_plan": "Apply migration 003 to production database",
  "rollback": "Revert migration: ALTER TABLE orders DROP COLUMN user_id",
  "tests": ["Verify user_id column exists", "Run API smoke test"],
  "confidence": "high"
}
```

## Test Quality Metrics

| Metric | Value |
|--------|-------|
| Total tests | 367 |
| Pass rate | 367/367 (100%) |
| Flake rate | 0% (all deterministic, no network calls) |
| Test suites | 11 |
| Statement coverage | 89.87% |
| Branch coverage | 83.07% |
| Function coverage | 85.07% |
| Line coverage | 89.9% |
| Coverage target (global) | 60%+ (exceeded) |
| Critical module coverage | 90%+ (state machine, budget enforcer) |
| Performance target | <500ms per query |
