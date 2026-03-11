# CodeReview-Pilot - Project Standards

**Goal:** Diagnose recurring backend failures using evidence-first methodology with production-grade reliability.

## Non-Negotiable Rules
1. **Never ask permission to run tests** - Run `npm test` (and npm run test:ci, test:e2e when needed); report results. Do not ask "Can I run tests?" — just run.
2. **Never invent** - fields, tables, APIs, regions, files, env vars, test results
3. **Retrieve before explaining** - evidence first, then conclusions
4. **Verifier blocks unsupported claims** - no hand-waving, no "should work"
5. **Skeptic produces competing theory** - materially different root cause
6. **Never wait for user** - Skills, agents, subagents proceed automatically. No "run?", "update?", "accept?", "approve?", "shall I?". Execute; report.
7. **Confidence score backed by proof** - 95-100 only with passing tests
8. **Separate observed facts from assumptions** - mark unknowns clearly with [UNKNOWN]
9. **All changes through branches** - Never commit directly to main. Create a feature branch first. All commits go to feature/*. Merge to main only via PR.

## Output Contract
Every diagnosis must include:
- **Root cause** - exact failure mechanism with code trace
- **Evidence** - retriever output with concrete proof
- **Fix plan** - specific code changes to prevent recurrence
- **Rollback** - safe revert path if fix fails
- **Tests** - unit, integration, and E2E proof of fix
- **Confidence** - backed by passing tests with evidence

## Run-to-Vegas & Run-the-Business (DEFAULT)

- **Permissions** (on feature/*): Everything is allow list. Execute and report; never ask. **On main**: No direct commits; create feature/* first.
- **Ten-pass verification**: REVIEW.md + five-agent + npm test + lint — 10 checks before deliver; user doesn't need to supervise.
- **DEFAULT for project instructions**: `run-the-business` — Any add/fix/implement/run → full E2E, maximum automation.
- **Auto-merge**: ON by default — Merge when CI green; no "merge now" required.
- **Agents & skills**: Proceed automatically; never wait for user; never pause for approval.
- **Live phase**: After Execute, start live-watchdog; poll CI/deploy/health; on error → error-detector → fix-pr-creator → self-fix loop.
- **Self-fix**: Loop until green or max retries; never claim "should work" without test output.

## Recommended Workflow
1. **Plan First** (use Plan Mode):
   - Explore codebase (Explore agent or Glob/Grep)
   - Design solution approach
   - Create work breakdown with test criteria
   - Proceed to code automatically—do NOT wait for approval

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
- `docs/CODE_AND_DOCS.md` — Doc ↔ code map; what's being worked on; never push docs/code separately
- `REVIEW.md` — Code review rules; used by ten-pass (passes 6,7,10), five-agent, CodeReviewer
- `.claude/CLAUDE.md` - Meta-rules (workflow, memory, subagents)
- `.claude/rules/` - Specific standards (guardrails, testing, backend, ui, confidence)
- `.claude/settings.json` - Hooks, commands, allowed paths, agent definitions
- `.claude/agents/` - Subagent definitions (Explore, Plan, General-purpose, custom)
- `docs/CONFIDENCE_SCORE.md` - Truth ledger for all tasks with evidence
- `CHANGELOG.md` - Session-by-session change log

## Commit Frequently
- Commit after any small change; don't batch
- **Docs and code go hand in hand** — never push them separately. One commit = code + its docs.
- Run `npm test` before commit; keep passing state
- Automatic review: run tests, keep changes, commit again if fixes needed
- Keep making commits — continuous delivery
- See `docs/CODE_AND_DOCS.md` for doc ↔ code mapping

## Branch Rules (HARD)
- **All changes through branches** — Never commit directly to main. Create `feature/*` first. Commit there. Merge to main only via PR.
- **Clean up after merge** — After PR merges: `git checkout main && git pull`, `git branch -d feature/<name>`, `git push origin --delete feature/<name>`.
- `main` - production; no direct commits. Changes land via PR from feature/*.
- `feature/*` - all work happens here; auto-accept edits; push to branch; open PR
- `.claude/worktrees/` - temporary isolation for risky changes

## When Blocked
1. Check `.claude/rules/guardrails.md` for constraints
2. Read `docs/CONFIDENCE_SCORE.md` for prior assumptions/failures
3. Run `npm test` to verify current state
4. Create fresh plan and proceed—do NOT wait for approval
5. If truly ambiguous (e.g., which of two valid options), document both and pick one; do NOT pause for user

## Done Definition (For Every Task)
- ✓ Code changes match plan (proceed without approval gate)
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
- **0-39**: Unverified, no evidence - do not release
