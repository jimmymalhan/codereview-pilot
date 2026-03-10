# Claude Debug Copilot - Project Standards

## Project Goal
Diagnose recurring backend failures using evidence-first methodology with production-grade reliability.

## Output Contract (All Deliverables Must Include)
- **Root cause** - exact failure mechanism with trace to code
- **Evidence** - retriever output with concrete proof
- **Fix plan** - specific code changes to prevent recurrence
- **Rollback** - safe revert path if fix fails
- **Tests** - unit, integration, and E2E proof of fix
- **Confidence** - backed by passing tests and verified workflows

## Non-Negotiable Rules
1. **Never invent** - fields, tables, APIs, regions, files, env vars, test results
2. **Retrieve before explaining** - evidence first, then conclusions
3. **Verifier blocks unsupported claims** - no hand-waving, no "should work"
4. **Skeptic produces competing theory** - materially different root cause
5. **No edits until plan approved** - review before changes
6. **Confidence score backed by proof** - 95-100 only with passing tests
7. **Separate observed facts from assumptions** - mark unknowns clearly

## Build & Test
```bash
npm install           # Install dependencies
npm start            # Run localhost server (http://localhost:3000)
npm test             # All tests (Jest with coverage)
npm run test:watch   # Watch mode for development
npm run test:ci      # CI mode (GitHub Actions)
npm run test:e2e     # E2E tests (requires API credentials)
```

## Critical Workflows (Must Test)
- **Request intake** - form submission → API call → response
- **Pipeline execution** - 4-agent orchestration → streaming output
- **Error recovery** - network failure → auto-retry → success
- **Permission check** - admin control → apply permission → verify
- **Audit logging** - action → immutable log entry → retrieval
- **Failure handling** - invalid input → validation error → user guidance

## Proof Requirements
- Unit tests for all helpers and orchestration modules
- Integration tests for pipeline and state machine
- E2E tests for critical user workflows
- Retry logic tested with simulated failures
- Permission validation tested with denied access
- Audit trail verified with log retrieval
- UI states tested locally before deployment

## Done Definition
- ✓ Code changes match approved plan
- ✓ All critical flows tested locally
- ✓ Tests pass in CI/CD pipeline
- ✓ No regressions in existing functionality
- ✓ docs/CONFIDENCE_SCORE.md updated with evidence
- ✓ CHANGELOG.md documents what changed and why
- ✓ Rollback path documented and tested
- ✓ Unknowns and residual risks listed

## Configuration Files
- `CLAUDE.md` - this file, project standards (~200 lines)
- `.claude/rules/` - specific concerns (ui, backend, testing, guardrails, confidence)
- `.claude/settings.json` - shared project config, hooks, MCP, permissions
- `.claude/settings.local.json` - local-only strategy (gitignored)
- `.claude/agents/` - subagent definitions (router, retriever, skeptic, verifier, etc.)
- `.claude/skills/` - reusable playbooks (ui-quality, backend-reliability, etc.)
- `.claude/commands/` - repeatable workflows (/plan, /execute, /score-confidence, etc.)
- `docs/CONFIDENCE_SCORE.md` - shared truth ledger for all tasks
- `.claude/rules/guardrails.md` - anti-hallucination rules

## Deployment Stages
| Stage | Proof | Gate |
|-------|-------|------|
| **POC** | Request → Process → Result | Workflow exists |
| **Product** | + Persistence, Retries, Recovery | Repeatable safely |
| **Production** | + Auditability, Permissions, Monitoring | Reliable + explainable |

## Confidence Scoring Rubric
- **0-39**: Guess, no evidence
- **40-59**: Partial evidence, some flows untested
- **60-79**: Implemented, incomplete proof
- **80-94**: Strong proof, minor open risks
- **95-100**: Critical flows verified, unknowns documented

## Documentation
- `README.md` - quick start
- `QUICKSTART.md` - real-time examples
- `docs/LOCAL_TESTING.md` - localhost testing guide
- `docs/GITHUB_TESTING.md` - GitHub Actions proof
- `docs/CONFIDENCE_SCORE.md` - task ledger with evidence
- `.claude/rules/` - reusable guardrails
- `CHANGELOG.md` - session-by-session record
- `ARCHITECTURE.md` - system design

## Branch Rules
- `main` - production, requires passing CI/CD
- `feature/*` - feature branches, reviewed before merge
- `.claude/worktrees/` - temporary work isolation

## When Blocked
- Check `.claude/rules/guardrails.md` for relevant constraints
- Read `docs/CONFIDENCE_SCORE.md` for prior assumptions and failures
- Update `.claude/settings.local.json` with new hypothesis
- Create fresh plan before coding

## Session Protocol
1. **Read** CLAUDE.md and `docs/CONFIDENCE_SCORE.md`
2. **Plan** - create work breakdown with review and QA steps
3. **Execute** - implement in separate commits
4. **Verify** - test critical flows locally and in CI
5. **Score** - update `docs/CONFIDENCE_SCORE.md` with evidence
6. **Document** - update CHANGELOG.md with what changed and why
