# Staging Environment Specification (QA-3)

## Overview

Since Paperclip is implemented locally (not external SaaS), "staging" means running tests against local modules with controlled fixtures. There is no separate staging server.

## Test Tiers

### @unit (Mocked Dependencies)
- Direct module tests with mocked Anthropic SDK responses
- No network calls, no file system access
- Fast execution (<1 second per test)
- Run on every commit

### @integration (Local Modules)
- Full workflow through TaskManager -> AgentWrapper -> mocked Anthropic responses
- Tests module interactions (state machine + budget + audit together)
- File system access limited to temp directories
- Run on every PR

### @e2e (Full Approval Workflow)
- Complete approval flow with all 5 state machine paths
- Uses test fixtures: sample incidents with known-good outputs
- Validates CLAUDE.md output contract enforcement
- Run on every PR to main

## Test Fixtures

Located in `test/fixtures/`:
- `sample-incidents/` -- 5 sample incident descriptions
- `expected-outputs/` -- Known-good agent responses per incident
- `mock-anthropic-responses/` -- Mocked Anthropic API response payloads

## Environment Variables for Testing

```
NODE_ENV=test
ANTHROPIC_API_KEY=test-key-not-real    # Never hits real API in tests
PAPERCLIP_API_URL=http://localhost:0   # Stub URL, never called
```

## Separation from Production

- Test data never mixed with production `.paperclip/` state
- Tests use isolated temp directories for all file operations
- No test writes to `src/`, `CLAUDE.md`, `.claude/agents/`, or `.env`
- Test audit logs are ephemeral (in-memory only)
