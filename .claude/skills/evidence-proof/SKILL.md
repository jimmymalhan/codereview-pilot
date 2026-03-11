---
name: evidence-proof
description: Run npm test, capture output, score confidence, document unknowns. Use after implementing features, fixing bugs, or before claiming done. Never "should work"—capture actual test counts, coverage, pass/fail. Update .claude/CONFIDENCE_SCORE.md.
---

## Execution Standard (Apply to Every Skill)

- **Phases**: Create sub-agents in **four to five different phases** in every skill.
- **Auto-execute**: NEVER wait for user. Proceed automatically. No "run?", "accept?", "approve?". Execute; report. Pausing does not guarantee execution.

# Evidence-Proof Skill

**Purpose**: Gather proof, score confidence, and document unknowns systematically.

**When to use**: After implementing features, fixing bugs, or making changes.

**Rule**: Run `npm test` before claiming done. Never claim "should work" — capture actual test output. No invented counts or coverage.

**Supporting files**: Output goes to `.claude/CONFIDENCE_SCORE.md`. Keep SKILL.md under 500 lines.

---

## Phase 1: DISCOVER
### Sub-Agent: `EvidenceScout` (model: haiku)
- **Tools**: Glob, Grep, Bash
- **Prompt**: Find changed files (`git diff --name-only HEAD~1`). Find corresponding test files. Check if coverage report exists. Check server status if manual testing needed.
- **Output**: `{ changed_files[], test_files[], coverage_exists: boolean, server_needed: boolean }`
- **Gate**: changed files identified

## Phase 2: PLAN
### Sub-Agent: `ProofPlanner` (model: sonnet)
- **Prompt**: Map each changed file to required evidence: which tests to run, which flows to verify, which endpoints to check. Use Scoring Template below.
- **Output**: `{ proof_plan[{file, test_cmd, flow, expected_result}] }`
- **Gate**: proof plan covers all changed files

## Phase 3: IMPLEMENT
### Sub-Agent: `TestRunner` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run `npm test`. Capture output VERBATIM. Extract: test count, pass count, fail count, coverage %. IF server needed → check health. Run specific test files from proof plan.
- **Output**: `{ test_output_summary, test_count, pass_count, fail_count, coverage_pct, duration }`
- **Gate**: tests actually ran (output is real, not invented)

## Phase 4: VERIFY
### Sub-Agent: `ConfidenceScorer` (model: haiku)
- **Prompt**: Score confidence using rubric below. List unknowns. List residual risks. Update .claude/CONFIDENCE_SCORE.md with scoring template.
- **Output**: `{ confidence, evidence[], unknowns[], residual_risks[], rollback_path }`
- **Gate**: confidence is a number backed by actual test output

## Phase 5: DELIVER
### Sub-Agent: `EvidenceArchiver` (model: haiku)
- **Prompt**: Write scoring template to .claude/CONFIDENCE_SCORE.md. Notify user of confidence score, server status, and any remaining unknowns.
- **Output**: `{ confidence_score_updated, server_status, user_message }`
- **Gate**: CONFIDENCE_SCORE.md updated

---

## Contingency

IF npm test fails:
  → Do NOT lower confidence arbitrarily — report actual failure
  → Invoke contingency L1 (fix failing test)
  → IF still failing after 2 attempts → contingency L2 (simplify)

IF server needed but won't start:
  → Invoke server-lifecycle
  → IF still down → mark manual testing as [UNKNOWN], lower confidence

IF rate limited during test run:
  → Save evidence gathered so far
  → Contingency L5 (pause, save state)

---

## Process: Gather Evidence (6 Steps)

### 1. Run Tests
```bash
npm test                    # All tests with coverage
npm run test:ci             # CI mode (GitHub Actions simulation)
npm run test:watch          # Development watch mode
```

**Evidence to capture**:
- Test count: "319 passed, 973 total"
- Coverage: "89.87% lines"
- Failures: "2 failed in e2e-business-website.test.js"
- Duration: "54.74 seconds"

### 2. Manual Testing
```bash
npm start
# Visit http://localhost:3000
# Test critical workflows:
#  - Form submission and success
#  - Input validation errors
#  - Network error recovery
#  - Permission denied handling
```

**Evidence to capture**:
- ✅ Form loads without errors
- ✅ Submit button triggers loading state
- ✅ Results display all 4 stages
- ✅ Error message shows for invalid input
- ✅ Retry button works after error

### 3. Code Review
```bash
git diff HEAD~1              # See what changed
git log --oneline -5         # Recent commits
```

**Evidence to capture**:
- Files changed: [list paths]
- Lines added/removed: [counts]
- Critical paths modified: [yes/no]
- Tests updated: [yes/no]

### 4. Check Coverage Gaps
```bash
npm test 2>&1 | grep "uncovered"
# Or open coverage/lcov-report/index.html
```

**Evidence to capture**:
- Coverage by file
- Uncovered lines
- Coverage trend (improving/declining)

### 5. Verify Critical Flows
For each critical workflow in CLAUDE.md:
- ✅ Flow works end-to-end
- ✅ Error cases handled
- ✅ Recovery path tested
- ✅ State transitions valid

### 6. Document Unknowns
List anything not yet proven:
- [UNKNOWN] API behavior under high load
- [UNKNOWN] Response timeout in production network
- [UNKNOWN] User behavior on mobile ≤768px

## Confidence Scoring Rubric

### 95-100: Verified & Complete ✅
- All tests passing (100% of test suite)
- Critical workflows verified locally
- GitHub Actions passed on latest commit
- Coverage ≥ 85% for critical modules
- All unknowns documented
- Rollback path tested
- No hand-waving, no "should work"

### 80-94: Strong Evidence
- Code matches plan exactly
- Tests passing (≥95% of test suite)
- Coverage ≥ 75%
- Critical workflows verified manually or with E2E
- Minor unknowns documented
- Rollback path identified

### 60-79: Partial Implementation
- Code changes made
- Tests passing (≥90%)
- Coverage 60-75%
- Some critical flows untested
- Assumptions present
- Unknowns list growing

### 40-59: Incomplete
- Implementation in progress
- Tests passing for happy path only
- Coverage <60%
- Major flows untested
- Do not merge to main

### 0-39: No Evidence
- No tests run
- Changes without verification
- Do not use in production

## Scoring Template

```markdown
## [Feature/Fix Name]

**Observed**:
- Test result: npm test output
- GitHub Actions: workflow #XYZ passed/failed
- Manual testing: form submission works ✅
- Code review: X files, Y lines changed

**Tests run**:
- npm test: 319 passing, 973 total
- npm run test:ci: passed (Node 18, 20)
- Coverage: 89.87% lines

**Critical flows verified**:
- ✅ [Flow 1]: Manual test on localhost:3000
- ✅ [Flow 2]: Integration test "should X"
- ❌ [Flow 3]: Not yet tested

**Edge cases**:
- ✅ Invalid input: Validation works
- ✅ Network error: Retry succeeds
- ❌ Timeout: Not tested

**Error handling**:
- ✅ Happy path: Works
- ✅ Validation: Shows error
- ✅ Network: Retries automatically
- ❌ Permission: Not yet tested

**Unknowns**:
- [UNKNOWN] Behavior under load
- [UNKNOWN] Response time in production

**Residual risks**:
- Race condition if multiple users submit simultaneously
- Timeout could still occur on very slow networks

**Rollback**:
- git revert [commit] (safe, changes are isolated)
- Verify: npm test passes, UI loads

**Confidence**: 87/100
- Reason: Strong test evidence, manual verification done, minor unknowns documented
```

## Anti-Patterns (❌ Don't Do)

❌ "Should work" - MUST: Run tests and verify
❌ "Looks correct" - MUST: Run tests
❌ "Tests probably pass" - MUST: Show actual test output
❌ "100% confidence" - ONLY if all critical flows verified
❌ "No unknowns" - MUST: List at least residual risks
❌ Undocumented assumptions - MUST: List unknowns

## Good Patterns (✅ Do This)

✅ "npm test shows 319 passing"
✅ "GitHub Actions workflow #451 passed"
✅ "Manual test on localhost:3000 verified form submission"
✅ "Coverage 89.87% (threshold: 60%)"
✅ "[UNKNOWN] Load testing not done yet"
✅ "Rollback: git revert abc123def - verified safe"

## Lessons Learned (From Stakeholder Feedback)

1. **Run tests after every rename.** File renames and moves change import paths. Run `npm test` immediately after any git mv to catch breakage early.
2. **Don't claim sandbox limits — work around them.** If a command can't run in the current environment, provide the exact command for the user to run locally with zero placeholders.
3. **Verify changes are visible.** After editing UI files, confirm the change appears on `localhost:3000`. Don't assume the browser auto-refreshes or the server auto-reloads.
4. **Conventional commits are evidence.** Use `type(scope): description` format. The commit log IS the audit trail — sloppy messages erode trust.
5. **Idempotent checks save tokens.** Before editing, check if the work is already done. Read `CHANGELOG.md` and `git log` to avoid redoing completed tasks.
6. **Never invent test results.** Only report numbers from actual `npm test` output. "1117 passing" means you ran the command and saw that number.

## When Blocked

If you cannot gather evidence:
1. Mark it as [UNKNOWN]
2. Lower confidence score proportionally
3. Describe what would prove it
4. Continue with other evidence
5. Update .claude/CONFIDENCE_SCORE.md explaining why

Example:
```
Confidence: 65/100 - Code works locally but production environment
not tested. Cannot run E2E against production API without approval.
[UNKNOWN] Production behavior differs from localhost.
```
