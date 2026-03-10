# GitHub Actions Testing Guide

## Workflow File
Location: `.github/workflows/test.yml`

## How It Works

### Triggers
Tests run automatically on:
- **Pull requests** to `main` branch
- **Pushes** to `main` branch
- **Manual dispatch** (can trigger manually)

### Matrix Testing
Tests run on multiple Node versions:
- Node 18 (LTS)
- Node 20 (LTS)
- Validates compatibility across versions

### Stages

1. **Checkout** - Get latest code
2. **Setup Node** - Install Node version
3. **Install Dependencies** - `npm ci`
4. **Run Tests** - `npm run test:ci` with coverage
5. **Upload Coverage** - Save coverage report
6. **Check Thresholds** - Verify coverage meets minimums

## Viewing Test Results

### In GitHub UI
1. Go to repository
2. Click "Actions" tab
3. Click workflow run name
4. View test results and logs

### Coverage Report
1. Go to workflow run
2. Click "Artifacts" section
3. Download `coverage-report`
4. Extract and open `index.html`

### Test Summary
Shows in PR status:
- ✅ All tests passed
- ❌ Some tests failed (click for details)
- ⚠️ Coverage below threshold (if configured)

## Coverage Thresholds

Enforced by Jest config in `jest.config.js`:

```
Global minimum: 60%
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

Module-specific:
- State machine: 90%
- Budget enforcer: 90%
- Audit logger: 85%
```

## Failure Scenarios

### ❌ Test Fails
**What it means**: Code doesn't work as expected

**Steps to fix**:
1. Check error message in GitHub Actions output
2. Run locally: `npm test`
3. Fix the code
4. Commit and push
5. GitHub Actions re-runs automatically

### ❌ Coverage Too Low
**What it means**: New code not tested

**Steps to fix**:
1. Check coverage report
2. Find uncovered lines
3. Write tests for those lines
4. Run locally: `npm test` to verify
5. Commit and push

### ❌ Timeout (>60 seconds)
**What it means**: Test hangs or is very slow

**Steps to fix**:
1. Check which test timed out
2. Run locally: `npm run test:watch`
3. Add timeout or fix slow code
4. Re-run locally to verify
5. Commit and push

### ⚠️ Node Version Conflict
**What it means**: Code works on one Node version but not another

**Steps to fix**:
1. Check which Node version failed
2. Run locally on that version: `nvm use 18` (if using nvm)
3. Debug the incompatibility
4. Test fix on both versions
5. Commit and push

## Before Pushing to Main

### Local Verification
```bash
# Run all tests
npm test

# Check coverage meets thresholds
npm test | grep -A 5 "Test Suites"

# Test critical workflows
npm start
# Manually test form, validation, error recovery
```

### Commit Checklist
- [ ] `npm test` passes with 100% tests passing
- [ ] Coverage meets thresholds (60% global)
- [ ] Manual testing completed
- [ ] CHANGELOG.md updated
- [ ] docs/CONFIDENCE_SCORE.md updated
- [ ] No console errors or warnings
- [ ] Rollback plan documented

### Push to Main
```bash
git add [files]
git commit -m "Description of changes"
git push origin main
```

### Monitor GitHub Actions
1. Watch for workflow to start (~1-2 seconds after push)
2. Monitor test execution (2-5 minutes)
3. Check for any failures
4. If failed, fix locally and push again

## CI/CD Pipeline

```
┌─ Code pushed to main
│
├─ Checkout code
├─ Setup Node 18 & 20
├─ Install dependencies
├─ Run tests (both versions)
├─ Upload coverage
├─ Check thresholds
│
└─ ✅ Success → Ready for release
   ❌ Failure → Fix locally and re-push
```

## Debugging CI Failures

### Step 1: Check Error Message
Click the failed job → read error output carefully.

Common errors:
- `ERR: Cannot find module 'x'` → missing dependency
- `Expected x but got y` → logic error
- `Timeout after 60000ms` → test too slow or infinite loop
- `Coverage below threshold` → need more tests

### Step 2: Reproduce Locally
```bash
npm test -- --testNamePattern="failing test name"
```

### Step 3: Check Environment
GitHub Actions uses Ubuntu Linux:
- File paths may differ from macOS
- Environment variables must be set in workflow
- Dependencies must be in package.json (not node_modules)

### Step 4: View Full Logs
In GitHub Actions UI:
1. Click job
2. Expand each step
3. Look for red error output
4. Copy full error message

### Step 5: Fix and Re-push
Fix locally, commit, push to main.
GitHub Actions runs automatically.

## Skipped Tests

If test is marked `skip` (xit, it.skip):
- GitHub Actions shows it as skipped ⊘
- Skipped tests don't count toward pass/fail
- Coverage impact: skipped code is not covered

**Rule**: Don't skip tests. If test is flaky:
1. Fix the flakiness (usually timing or mocking)
2. Remove skip marker
3. Commit with explanation in CHANGELOG.md

## Performance

Expected run times:
- Checkout: ~5 seconds
- Setup Node: ~10 seconds
- Dependencies: ~30-60 seconds (cached: ~10 seconds)
- Tests (Node 18): ~120 seconds
- Tests (Node 20): ~120 seconds
- **Total**: 3-5 minutes per workflow run

## Cost Considerations

GitHub Actions free tier includes:
- 2000 minutes/month for private repos
- Unlimited for public repos
- Matrix jobs count as separate minutes

Matrix test with 2 Node versions = 2x the time.

To reduce cost:
- Remove Node 18 if not needed
- Cache dependencies (already enabled)
- Run tests only on pull requests (not on every push)

## Caching

Dependencies are cached:
- First run: downloads npm packages (~60s)
- Subsequent runs: uses cache (~10s)
- Cache invalidates when package-lock.json changes

## Pre-Submission Checklist

```
Before pushing to main:

[ ] npm test passes locally
[ ] npm run test:ci passes
[ ] Coverage >= 60% global
[ ] Manual testing completed
[ ] API key properly handled (not in code)
[ ] CHANGELOG.md updated
[ ] docs/CONFIDENCE_SCORE.md updated
[ ] No secrets in code or logs
[ ] Rollback plan documented
[ ] Ready to push to main

After push:
[ ] GitHub Actions workflow triggered
[ ] Workflow completes (green ✅)
[ ] Coverage report generated
[ ] No test regressions
[ ] Code review approved (if required)
```

## Monitoring Live

```bash
# Check workflow status
gh workflow view test.yml

# List recent runs
gh run list --branch main

# View latest run results
gh run view [run-id]

# Cancel running workflow
gh run cancel [run-id]
```

(Requires GitHub CLI: `gh`)

## Artifact Retention

Coverage reports kept for **30 days**:
- Automatically deleted after 30 days
- Download before deletion if needed
- Can extend retention in workflow YAML

## Next Steps After Success

Once GitHub Actions passes:
1. Code is production-ready
2. Coverage meets thresholds
3. All Node versions compatible
4. Ready for release or merge to main
5. Safe to deploy to production

## Help & Troubleshooting

### Check GitHub Status
Some failures may be due to GitHub Actions outages:
- https://www.githubstatus.com

### Common Issues
| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check branch is main, check .github/workflows/test.yml syntax |
| Tests timeout | Check for infinite loops, increase timeout, optimize slow tests |
| Coverage too low | Find uncovered lines in report, write tests, commit |
| Dependency issues | Run `npm install` locally, verify package-lock.json committed |
| Permission denied | Check file permissions, check GitHub permissions for workflow |

### Get Help
1. Check error message in GitHub Actions logs
2. Reproduce locally with `npm test`
3. Check CLAUDE.md for standards
4. Check .claude/rules/ for relevant guardrails
