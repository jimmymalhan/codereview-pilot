# Evidence-Proof Skill

**Purpose**: Gather proof, score confidence, and document unknowns systematically.

**When to use**: After implementing features, fixing bugs, or making changes.

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

## When Blocked

If you cannot gather evidence:
1. Mark it as [UNKNOWN]
2. Lower confidence score proportionally
3. Describe what would prove it
4. Continue with other evidence
5. Update docs/CONFIDENCE_SCORE.md explaining why

Example:
```
Confidence: 65/100 - Code works locally but production environment
not tested. Cannot run E2E against production API without approval.
[UNKNOWN] Production behavior differs from localhost.
```
