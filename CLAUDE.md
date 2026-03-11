# CodeReview-Pilot - Project Standards

**Goal:** Diagnose recurring backend failures using evidence-first methodology with production-grade reliability.

## Non-Negotiable Rules
1. **Never invent** - fields, tables, APIs, regions, files, env vars, test results
2. **Retrieve before explaining** - evidence first, then conclusions
3. **Verifier blocks unsupported claims** - no hand-waving, no "should work"
4. **Skeptic produces competing theory** - materially different root cause
5. **No edits until plan approved** - review before changes
6. **Confidence score backed by proof** - 95-100 only with passing tests
7. **Separate observed facts from assumptions** - mark unknowns clearly with [UNKNOWN]

## Output Contract
Every diagnosis must include:
- **Root cause** - exact failure mechanism with code trace
- **Evidence** - retriever output with concrete proof
- **Fix plan** - specific code changes to prevent recurrence
- **Rollback** - safe revert path if fix fails
- **Tests** - unit, integration, and E2E proof of fix
- **Confidence** - backed by passing tests with evidence

## Run-the-Business & Live Monitoring

- **Entry skill**: `run-the-business` — Invoke idea-to-production; start live-watchdog; full E2E.
- **Live phase** (optional): After Execute, poll CI/deploy/health; on error → error-detector → fix-pr-creator → self-fix loop.
- **Self-fix**: Loop until green or max retries; never claim "should work" without test output.

## Recommended Workflow
1. **Plan First** (use Plan Mode):
   - Explore codebase (Explore agent or Glob/Grep)
   - Design solution approach
   - Create work breakdown with test criteria
   - Get approval before coding

2. **Code with Tests**:
   - Implement changes in separate commits
   - Write tests that verify critical workflows
   - Run locally: `npm test` before committing
   - Never claim "should work" - run tests to prove it

3. **Verify Critical Flows**:
   - Test request intake → response
   - Test pipeline execution (4-agent orchestration)
   - Test error recovery (network failure → retry)
   - Test permission checks, audit logging, failure handling

4. **Update Evidence**:
   - Run `npm test` to get passing test output
   - Update `docs/CONFIDENCE_SCORE.md` with test results
   - Update `CHANGELOG.md` with what changed and why
   - List unknowns and residual risks

## Build & Test Commands
```bash
npm install              # Install dependencies
npm start               # Start http://localhost:3000
npm test                # All tests (Jest, 60% coverage minimum)
npm run test:watch     # Watch mode for development
npm run test:ci        # CI mode (GitHub Actions)
npm run test:e2e       # E2E tests (requires API credentials)
```

## Configuration & Rules
- `.claude/CLAUDE.md` - Meta-rules (workflow, memory, subagents)
- `.claude/rules/` - Specific standards (guardrails, testing, backend, ui, confidence)
- `.claude/settings.json` - Hooks, commands, allowed paths, agent definitions
- `.claude/agents/` - Subagent definitions (Explore, Plan, General-purpose, custom)
- `docs/CONFIDENCE_SCORE.md` - Truth ledger for all tasks with evidence
- `CHANGELOG.md` - Session-by-session change log

## Branch Rules
- `main` - production, requires passing CI/CD and review
- `feature/*` - feature branches, auto-accept edits during development
- `.claude/worktrees/` - temporary isolation for risky changes

## When Blocked
1. Check `.claude/rules/guardrails.md` for constraints
2. Read `docs/CONFIDENCE_SCORE.md` for prior assumptions/failures
3. Run `npm test` to verify current state
4. Create fresh plan before coding
5. If stuck, ask for user clarification (use AskUserQuestion)

## Done Definition (For Every Task)
- ✓ Code changes match approved plan exactly
- ✓ Run `npm test` locally - all tests pass
- ✓ No regressions in existing tests
- ✓ `docs/CONFIDENCE_SCORE.md` updated with test results
- ✓ `CHANGELOG.md` updated with what changed and why
- ✓ Rollback path documented
- ✓ Unknowns marked with [UNKNOWN]

## Confidence Scoring (See .claude/rules/confidence.md)
- **95-100**: Critical flows verified, unknowns documented, tests passing in CI
- **80-94**: Strong proof, minor open items, tests passing locally
- **60-79**: Implemented but incomplete proof, some flows untested
- **40-59**: Partial evidence, major gaps
- **0-39**: Guess, no evidence - do not release
