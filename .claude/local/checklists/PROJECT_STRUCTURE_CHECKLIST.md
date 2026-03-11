# Project Structure Checklist (Local Only)

| ID | Task | Status | Files to inspect | Files allowed to change | Verification |
|----|------|--------|------------------|-------------------------|--------------|
| 1 | Orchestration UI interactive (approve, status) | DONE | src/www/orchestration.html, src/www/styles/app.css | same | Start review, Approve buttons work; status dropdown works |
| 2 | Approval flow tests | DONE | tests/integration/orchestration-endpoints.test.js | same | npm test orchestration-endpoints |
| 3 | .gitignore expand | DONE | .gitignore | .gitignore | PHASE_1_TEST_OUTPUT.txt, IMPLEMENTATION_REPORT.md ignored |
| 4 | Core agents in repo | SKIP | .claude/agents/core/ | - | Already present; personal in .claude/agents/personal/ |
| 5 | Separate personal agents | SKIP | .claude/agents/ | - | agents/** already gitignored |

## Skip conditions
- Task 1: Orchestration page has action buttons and they call API
- Task 2: 38 tests pass in orchestration-endpoints
- Task 3: git status shows no PHASE_1_TEST_OUTPUT.txt
- Task 4-5: .gitignore has .claude/agents/**
