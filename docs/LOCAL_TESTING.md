# Local Testing Guide

## Quick Start
```bash
# Install and run server
npm install
export ANTHROPIC_API_KEY=sk-ant-...  # Add your API key
npm start

# Open browser
http://localhost:3000
```

## Test Modes

### 1. Manual Testing (Recommended First)
Test the UI and workflows manually before automation.

#### Test Checklist
```
[ ] Server started without errors
[ ] Page loads at http://localhost:3000
[ ] Form visible and accepts input
[ ] Submit button is clickable
[ ] Loading state appears after submit
[ ] Results display after processing
[ ] All 4 stages visible (Router, Retriever, Skeptic, Verifier)
[ ] Error message shows if API key missing
[ ] Error message shows if network fails
[ ] Retry works after simulated failure
```

#### Critical Workflows to Test Manually
1. **Happy Path** (everything works)
   ```
   1. Enter valid incident: "API timeout in checkout service"
   2. Click Submit
   3. Watch loading state
   4. Verify results show all 4 stages
   5. Confirm root cause visible
   6. Check fix plan is reasonable
   ```

2. **Validation** (invalid input)
   ```
   1. Submit empty form
   2. Verify error message
   3. Submit <10 chars
   4. Verify error message
   5. Submit >2000 chars
   6. Verify error message
   ```

3. **Error Recovery** (network fails)
   ```
   1. Stop API service (Ctrl+C on separate terminal)
   2. Submit form
   3. Verify "Network error" message
   4. Verify retry suggestion
   5. Start API service again
   6. Click Retry
   7. Verify success after retry
   ```

4. **Permission Denied** (invalid API key)
   ```
   1. Clear ANTHROPIC_API_KEY
   2. Restart server
   3. Submit form
   4. Verify 403 or permission error
   5. Check error message guides to add credits
   ```

5. **Timeout** (slow API)
   ```
   1. Modify timeout in code to 5 seconds
   2. Submit form
   3. Wait for timeout
   4. Verify timeout message
   5. Verify retry suggestion
   ```

### 2. Automated Unit Tests
```bash
npm test
```

**What's tested**:
- Helper functions
- Input validation
- State machine transitions
- Error handling
- Retry logic

**Expected output**:
```
PASS  tests/integration-tests.test.js
PASS  tests/custom-agents.test.js
...
Test Suites: X passed, X total
Tests:       319 passed, 319 total
Coverage:    89.87% lines
```

### 3. Integration Tests
```bash
npm test -- --testPathPattern=integration
```

**What's tested**:
- Full pipeline orchestration
- Agent interaction
- State machine flow
- Budget enforcement
- Audit logging

### 4. E2E Tests (with Real API)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run test:e2e
```

**What's tested**:
- Real API calls
- Full user workflows
- End-to-end processing
- Error recovery with real API

⚠️ **Note**: E2E tests use API credits. Run sparingly.

### 5. Watch Mode (for Development)
```bash
npm run test:watch
```
Re-runs tests automatically when code changes.

## Test Results Interpretation

### ✅ Success
```
PASS  tests/integration-tests.test.js
Test Suites: 5 passed, 5 total
Tests:       319 passed, 319 total
```
All tests passing, ready for GitHub Actions.

### ⚠️ Partial Success
```
Test Suites: 5 passed, 5 total
Tests:       315 passed, 1 failed, 3 skipped
```
- **Failed test**: Fix before committing
- **Skipped test**: Re-enable or document why skipped
- **Coverage**: Check specific lines not covered

### ❌ Failed
```
FAIL  tests/integration-tests.test.js
  ● integration pipeline › should handle network error
    Expected retries to equal 3 but got 2
```
Debug steps:
1. Run single test: `npm test -- --testNamePattern="should handle network error"`
2. Check test code for assertions
3. Check implementation for logic
4. Fix implementation or test
5. Re-run until passing

## Debugging Failed Tests

### Step 1: Run Single Test
```bash
npm run test:watch -- --testNamePattern="test name here"
```

### Step 2: Add Debug Output
```javascript
// In test file
console.log('Current state:', actualValue);
expect(actualValue).toBe(expectedValue);
```

### Step 3: Increase Timeout (if needed)
```javascript
it('should complete in time', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### Step 4: Check Implementation
```bash
git diff HEAD~1 src/module.js
```
Compare what changed vs what test expects.

### Step 5: Check Test
```bash
npm test -- --testNamePattern="test name" --verbose
```
See detailed assertion messages.

## Coverage Requirements

### Minimum Coverage
- **Global**: 60% across all files
- **Critical modules**: 85%+
- **State machine**: 90%+
- **Budget enforcer**: 90%+
- **Audit logger**: 85%+

### Check Coverage
```bash
npm test
# Look for coverage summary at end
```

### Coverage Report
```bash
# Generate HTML report
npm test
# Open coverage/lcov-report/index.html in browser
```

### Find Uncovered Lines
1. Open `coverage/lcov-report/index.html`
2. Click on file name
3. Red lines = uncovered
4. Green lines = covered

## Localhost Server States

### Running ✅
```
Server running on port 3000
✓ Ready for connections
✓ API key validated
✓ All modules loaded
```

### Error: Port Already in Use ❌
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
# Restart server
npm start
```

### Error: API Key Missing ❌
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

### Error: Dependencies Missing ❌
```bash
npm install
npm start
```

## Key URLs
- **Main UI**: http://localhost:3000
- **API Reference**: http://localhost:3000/api-reference.html
- **Health Check**: http://localhost:3000/health

## Console Logs
The browser console shows:
- Request details (input, stage info)
- Response data (parsed results)
- Errors (network, validation, API)
- Retry attempts
- Timing information

**Check console**:
1. Open Developer Tools (F12 or Cmd+Opt+J)
2. Click Console tab
3. Look for errors or warnings
4. Copy full error message for GitHub issue

## Performance Baseline
Expected timings on localhost:
- Form validation: <100ms
- Submit button response: <200ms
- Loading state: 1-2 seconds
- Router stage: 3-5 seconds
- Retriever stage: 4-6 seconds
- Skeptic stage: 5-7 seconds
- Verifier stage: 4-6 seconds
- **Total**: 16-24 seconds

If significantly slower:
1. Check network (wifi vs ethernet)
2. Check CPU usage (`top` command)
3. Check API quota (may be rate limited)
4. Check for browser extensions slowing load

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| Page won't load | Check npm start, check console errors, hard refresh (Cmd+Shift+R) |
| Form won't submit | Check API key, check console errors, check network tab in DevTools |
| Results not showing | Check console for errors, check server logs, check API response |
| Retries not working | Check retry logic in code, check timeout value, run integration tests |
| Coverage too low | Run `npm test` to find uncovered lines, add tests, commit coverage changes |
| Tests won't run | Check Node version (>=18), run `npm install`, check Jest config |
| E2E tests fail | Check API key, check API quota, check network, run with --verbose |

## Before Submitting PR

1. **Run all tests**
   ```bash
   npm test
   npm run test:ci
   ```

2. **Test locally**
   ```bash
   npm start
   # Test form submission, validation, error recovery, UI states
   ```

3. **Check coverage**
   ```bash
   npm test
   # Verify coverage meets thresholds
   ```

4. **Check console**
   ```bash
   # Open DevTools, verify no errors or warnings
   ```

5. **Update docs**
   ```bash
   # Update CHANGELOG.md, docs/CONFIDENCE_SCORE.md
   # Commit with meaningful message
   ```

6. **Push and verify GitHub Actions**
   ```bash
   # GitHub Actions runs same tests
   # Check workflow status: https://github.com/...
   ```

## Quick Commands Reference

```bash
npm install              # Install dependencies
npm start                # Run server (localhost:3000)
npm test                 # All tests with coverage
npm run test:ci          # CI mode (GitHub Actions)
npm run test:watch       # Development watch mode
npm run test:e2e         # E2E tests (requires API key)
git status               # Check modified files
git diff                 # See all changes
npm run test -- --verbose  # Detailed test output
npm run test -- -t "test name"  # Run single test
```
