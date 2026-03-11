# Code Review Guidelines

**Purpose**: Review-specific rules for automated and human reviews. Used by Claude Code Review, five-agent verification, and CodeReviewer. See [Claude Code Review](https://code.claude.com/docs/en/code-review) and `docs/SKILLSETS.md`.

## Always check

- New API endpoints have corresponding integration tests
- Error messages don't leak internal details to users
- Evidence: every claim has file:line citation; no invented fields or paths
- Confidence score backed by test output when ≥ 0.70

## Style

- Prefer early returns over nested conditionals
- Use structured logging (JSON with traceId), not f-string interpolation
- Backend errors: type, message, traceId, suggestion, retryable per RFC 7807

## Skip

- Formatting-only changes in `*.lock` or generated files
- Changes under `.claude/` that are skill/rules updates (review for correctness only)

## Project-specific

- Diagnosis output: root_cause, evidence, fix_plan, rollback, tests, confidence (all 6 required)
- Never invent: APIs, tables, file paths, env vars, test results
