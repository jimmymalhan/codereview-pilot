# Execution Guardrails - Master Production Delivery Machine
**Project:** Claude Debug Copilot v3.0 Integration
**Branch:** `feature/integration-website`
**Scope:** 10,000+ agents, 1000+ teams, 100% parallelization
**Confidence Target:** 100% on all gates

---

## 🚫 ABSOLUTE RULES (Never Break)

### 1. Video Code MUST Be Gone
- ✅ All video recording agents removed
- ✅ All audio/TTS generation code removed
- ✅ All ffmpeg references removed
- ✅ All demo-server.js references removed
- ❌ DO NOT re-add any video-related code
- ❌ DO NOT propose video features
- ❌ DO NOT reference recording/audio/ffmpeg anywhere

**Verification:** No "video", "recording", "ffmpeg", "TTS", "audio" in code or docs

### 2. Permission Handling (Feature Branch Only)
- ✅ Auto-accept ALL dangerous operations on `feature/integration-website`
- ❌ NEVER auto-accept on `main` branch
- ❌ ALWAYS ask for approval before merging to main
- ❌ NEVER push to main without user approval
- ⚠️ If confused about branch, check `git rev-parse --abbrev-ref HEAD`

**Verification:** Always verify current branch before executing dangerous ops

### 3. No Permission Requests on Feature Branch
- ❌ DO NOT ask "Can I run npm test?"
- ❌ DO NOT ask "Can I edit src/server.js?"
- ❌ DO NOT ask "Can I create a worktree?"
- ✅ DO just execute and report results
- ✅ DO provide confirmation of what ran
- ✅ DO report failures with full context

**Verification:** Zero permission requests = smooth execution

### 4. Documentation Updates Are Continuous
- ✅ Update docs as work happens
- ✅ Auto-commit incremental changes
- ❌ DO NOT wait for permission to update docs
- ❌ DO NOT delay documentation
- ✅ DO create changelog entries after each major task

**Verification:** Every task leaves docs in better state than it started

### 5. Parallel Execution MUST Stay Parallel
- ✅ All 4 buckets conceptually ready to run simultaneously
- ✅ Bucket 2-4 start as soon as gates are ready
- ❌ DO NOT serialize work that can run in parallel
- ❌ DO NOT wait for perfect completion before next bucket starts
- ✅ DO overlap bucket execution where possible

**Verification:** Buckets start as gates pass, not after perfect completion

### 6. Quality Gates Are Pass/Fail Only
- ✅ 100% pass = proceed
- ❌ 99% pass = blocked until 100%
- ❌ "Good enough" = NOT acceptable
- ✅ Evidence-based gates (tests, coverage, reviews)
- ❌ NO subjective gates ("looks good")

**Verification:** Every gate backed by measurable proof

### 7. Zero Sensitive Data Anywhere
- ❌ NO API keys in code
- ❌ NO passwords in docs
- ❌ NO credentials in test files
- ❌ NO secrets in git history
- ✅ All secrets in .env (local only)
- ✅ All secrets in .gitignore

**Verification:** Scan all commits before pushing: `git diff main -- '*.js' '*.md' '*.json'`

### 8. Agent Definitions MUST Have 100% Confidence
- ❌ "The agent probably can handle X"
- ✅ "The agent can X because [proof]"
- ✅ Each agent has clear capabilities and constraints
- ✅ Each team has clear dependencies
- ✅ Each task has clear success criteria

**Verification:** Every agent/team/task has documented proof of capability

---

## 🤖 AGENT EXECUTION RULES

### CEO Agent (Master Coordinator)
**Capabilities:**
- Create execution plan
- Coordinate 1000+ teams
- Make go/no-go decisions at each bucket gate
- Approve major milestone completions
- Escalate blockers

**Constraints:**
- Cannot execute code directly
- Cannot approve own decisions (requires review)
- Cannot skip quality gates
- Must maintain 100% transparency

### Product Manager Agent
**Capabilities:**
- Prioritize features
- Represent business requirements
- Provide stakeholder feedback
- Make product decisions

**Constraints:**
- Cannot approve technical decisions alone
- Must align with engineering reality
- Cannot skip testing requirements

### Engineering Lead Agent
**Capabilities:**
- Design technical architecture
- Review code for quality
- Make technical decisions
- Coordinate backend/frontend work

**Constraints:**
- Cannot skip tests
- Cannot approve own PRs
- Must maintain code quality standards

### QA Lead Agent
**Capabilities:**
- Define test strategies
- Verify quality gates
- Run automated tests
- Coordinate manual testing

**Constraints:**
- Cannot approve release if tests fail
- Must test all edge cases
- Cannot skip security checks

### Individual Execution Teams (1000+ teams)
**Each team:**
- 1 Team Lead (coordinates work)
- 2 Backend Engineers (write backend code)
- 2 Frontend Engineers (write frontend code)
- 1 QA Engineer (writes/runs tests)
- 1 Integration Specialist (coordinates components)
- 1 Security Reviewer (checks for vulnerabilities)
- 1 Performance Reviewer (checks performance)

**Capabilities:**
- Execute assigned sub-tasks
- Coordinate internally
- Report progress
- Escalate blockers

**Constraints:**
- Cannot merge PRs
- Cannot approve own work
- Must achieve 100% test coverage on assigned code
- Must follow documented patterns

### Reviewer Teams (100+ teams)
**Each team:**
- 2 Code Reviewers
- 2 QA Reviewers
- 1 Security Auditor
- 1 Performance Auditor
- 1 Documentation Reviewer
- 1 Architecture Reviewer
- 1 Accessibility Reviewer
- 1 Compliance Reviewer

**Capabilities:**
- Review code quality
- Verify test coverage
- Check security/performance/accessibility
- Validate documentation
- Sign off on features

**Constraints:**
- Cannot approve work without evidence
- Must provide actionable feedback
- Cannot pass anything below standard

---

## 📊 QUALITY GATES (100% Pass/Fail)

### Bucket 1 Gates: Plan & Guardrails
```
GATE 1: Plan Completeness
├─ 1000+ sub-tasks identified? ✅/❌
├─ 4-bucket system defined? ✅/❌
├─ Team structure clear? ✅/❌
├─ Guardrails documented? ✅/❌
└─ All agents have 100% confidence defs? ✅/❌
STATUS: [must be all ✅ to proceed]
```

### Bucket 2 Gates: Execution & Ownership
```
GATE 2: Code Quality
├─ All tests passing locally? ✅/❌
├─ Coverage >= 85%? ✅/❌
├─ No linting errors? ✅/❌
├─ No console.logs in production code? ✅/❌
└─ No commented-out code? ✅/❌
STATUS: [must be all ✅ to proceed]

GATE 3: Security
├─ No API keys in code? ✅/❌
├─ No passwords in docs? ✅/❌
├─ All secrets in .env? ✅/❌
├─ .gitignore complete? ✅/❌
└─ No PII in logs? ✅/❌
STATUS: [must be all ✅ to proceed]

GATE 4: Integration
├─ All components integrated? ✅/❌
├─ No broken imports? ✅/❌
├─ All APIs working? ✅/❌
├─ All routes responding? ✅/❌
└─ localhost:3000 loads? ✅/❌
STATUS: [must be all ✅ to proceed]
```

### Bucket 3 Gates: Quality & Proof
```
GATE 5: Testing
├─ All unit tests passing? ✅/❌
├─ All integration tests passing? ✅/❌
├─ All E2E tests passing? ✅/❌
├─ Coverage >= 85%? ✅/❌
└─ No flaky tests? ✅/❌
STATUS: [must be all ✅ to proceed]

GATE 6: CI Pipeline
├─ All GitHub Actions passing? ✅/❌
├─ All status checks green? ✅/❌
├─ No warnings in build? ✅/❌
├─ Performance acceptable? ✅/❌
└─ Security scan passed? ✅/❌
STATUS: [must be all ✅ to proceed]

GATE 7: Feature Verification
├─ All features tested locally? ✅/❌
├─ Step-by-step docs complete? ✅/❌
├─ localhost:3000 working? ✅/❌
├─ GitHub PR link verified? ✅/❌
└─ All CI checks passing? ✅/❌
STATUS: [must be all ✅ to proceed]
```

### Bucket 4 Gates: Delivery & Cleanup
```
GATE 8: Documentation
├─ README action-oriented? ✅/❌
├─ CHANGELOG updated? ✅/❌
├─ Before/After documented? ✅/❌
├─ Testing steps exact? ✅/❌
└─ No irrelevant docs? ✅/❌
STATUS: [must be all ✅ to proceed]

GATE 9: Approval
├─ Product approval? ✅/❌
├─ Engineering approval? ✅/❌
├─ QA approval? ✅/❌
├─ Security approval? ✅/❌
└─ CEO approval? ✅/❌
STATUS: [must be all ✅ to merge]
```

---

## 🔍 VERIFICATION CHECKLIST (Never Skip)

### Before Merging to Main
- [ ] `git status` clean (no untracked files that should be committed)
- [ ] `npm test` passes 100% locally
- [ ] `npm run test:ci` passes in GitHub Actions
- [ ] `npm start` runs without errors
- [ ] localhost:3000 loads and all pages respond
- [ ] All features tested manually
- [ ] No video code anywhere (grep for "video", "ffmpeg", "TTS", "recording")
- [ ] No secrets in git history (scan all commits)
- [ ] No console.logs in production code
- [ ] No commented-out code
- [ ] CHANGELOG updated with all changes
- [ ] README is action-oriented and accurate
- [ ] Before/After data flow documented
- [ ] All team approvals received
- [ ] GitHub PR shows all checks passing

**Status:** ❌ Not yet verified (will verify before merge)

---

## 📝 DOCUMENTATION RULES

### CHANGELOG Entries (After Every Task)
```markdown
### [Date] - [Task Name]
- **What:** Concise description
- **Why:** Business/technical reason
- **Evidence:** Test results, links, metrics
- **Impact:** What changed, who is affected
- **Verification:** How to test/verify
```

### Commit Messages (Clear & Actionable)
```
[Bucket#][Feature] Short description

Longer explanation of what changed and why.

Changes:
- Item 1
- Item 2

Tests: 100/100 passing
Coverage: 85%
Verification: Test steps here
```

### README Updates (Action-Oriented)
```markdown
## Quick Start
1. Install: npm install
2. Start: npm start
3. Visit: http://localhost:3000
4. Test: npm test

## Features
- Feature 1: What it does
- Feature 2: How to use it
```

---

## 🚨 ERROR RECOVERY

### If Tests Fail
1. Identify failing test
2. Run locally: `npm run test:watch -- --testNamePattern="test name"`
3. Fix code or test
4. Re-run: `npm test`
5. Update CHANGELOG with issue and fix
6. Commit and proceed

### If CI Fails
1. Check GitHub Actions logs
2. Reproduce locally
3. Fix and commit
4. Push and wait for CI to go green
5. Never merge on red

### If Permissions Issues (Shouldn't Happen)
1. Verify current branch: `git rev-parse --abbrev-ref HEAD`
2. If on main: escalate to user (ALWAYS ask for main)
3. If on feature: proceed (auto-accept)
4. If confused: ask user for confirmation

### If Blockers Arise
1. Document blocker clearly
2. Escalate to CEO Agent
3. Do not proceed until approved
4. Add to MASTER_EXECUTION_PLAN.md

---

## ✅ SUCCESS CRITERIA

### For This Execution
1. ✅ Zero video code remaining
2. ✅ All 1000+ sub-tasks assigned and tracked
3. ✅ All 4 buckets have clear completion criteria
4. ✅ All 1000+ teams coordinated and working
5. ✅ 100% test coverage on all new code
6. ✅ All CI checks passing
7. ✅ All quality gates passing
8. ✅ localhost:3000 fully functional
9. ✅ GitHub PR ready for merge
10. ✅ User approval before merge to main

**Target Completion:** All gates 100% pass

---

**Last Updated:** 2026-03-09
**Owner:** Execution Machine (CEO Agent)
**Status:** ACTIVE - Ready for production delivery
