---
name: ten-pass-verification
description: 10 distinct checks before accept. Peers critique peers—each pass comments on PR with push-back. Run in parallel. Merge promptly when done. Don't leave PRs hanging.
---

## Purpose

Every change is verified by **10 distinct passes** (peers critiquing from different angles). All 10 must pass and comment. **Run in parallel** so PRs don't hang. **Merge promptly** when gates pass.

## HARD Rule: Comments on PR

- **Each pass MUST run** `gh pr comment --body "..."` with its result and any push-back/critique
- **Merge blocked** until all 10 passes have posted a comment on the PR
- **Push-back** — when a pass finds issues, the comment must list them so the author must address
- **No rubber-stamp** — Every comment must list what was verified. Never "PASS" alone. See `extreme-critique` skill.
- **Thorough before merge** — End-to-end checklist complete. Look for fails, edge cases. BLOCK on real issues.
- **Do NOT merge before 10 comments** — if fewer than 10 ten-pass comments exist on the PR, block merge
- **Per-agent GitHub identity** — Each pass uses its own GH token when posting. PR shows multiple contributors. See `github-agent-identities` skill.
- **Run critiques in parallel** — Passes 1–5 (five-agent), 6+7+10 (REVIEW), 8+9 run in parallel where possible. Don't sequence unnecessarily. Fast completion = no PRs hanging.
- **Merge promptly when done** — Once all 10 have commented and passed, merge immediately. Don't leave PRs open.

## The 10 Passes

| # | Pass | Source | Verifies | Must Post |
|---|------|--------|----------|-----------|
| 1 | **CodeReviewer** | five-agent | DRY, style, guardrails | `GH_TOKEN=${GH_TOKEN_CODERREVIEWER:-$GH_TOKEN} gh pr comment` |
| 2 | **APIValidator** | five-agent | API contract, endpoints | `GH_TOKEN=${GH_TOKEN_APIVALIDATOR:-$GH_TOKEN} gh pr comment` |
| 3 | **EvidenceReviewer** | five-agent | file:line valid, no invented | `GH_TOKEN=${GH_TOKEN_EVIDENCE_REVIEWER:-$GH_TOKEN} gh pr comment` |
| 4 | **QAReviewer** | five-agent | npm test, coverage | `GH_TOKEN=${GH_TOKEN_QA_REVIEWER:-$GH_TOKEN} gh pr comment` |
| 5 | **Critic** | five-agent | confidence ≥ 0.70, 6 fields | `GH_TOKEN=${GH_TOKEN_CRITIC:-$GH_TOKEN} gh pr comment` |
| 6 | **REVIEW Always** | REVIEW.md | API tests, evidence | `GH_TOKEN=${GH_TOKEN_REVIEW_ALWAYS:-$GH_TOKEN} gh pr comment` |
| 7 | **REVIEW Style** | REVIEW.md | Early returns, RFC 7807 | `GH_TOKEN=${GH_TOKEN_REVIEW_STYLE:-$GH_TOKEN} gh pr comment` |
| 8 | **npm test** | Bash | All tests pass | `GH_TOKEN=${GH_TOKEN_CI:-$GH_TOKEN} gh pr comment` with pass/fail |
| 9 | **Lint** | lint-fixer | npm run lint (or --fix); no violations | `GH_TOKEN=${GH_TOKEN_LINT:-$GH_TOKEN} gh pr comment` with pass/fail |
| 10 | **REVIEW Project** | REVIEW.md | Diagnosis: 6 fields; never invent | `GH_TOKEN=${GH_TOKEN_REVIEW_PROJECT:-$GH_TOKEN} gh pr comment` |

## Flow

```
Implementation done
       ↓
Run in PARALLEL (minimize wall time — don't leave PR hanging):
  • Passes 1–5 (five-agent) — spawn all 5 agents, each posts gh pr comment
  • Passes 6, 7, 10 (REVIEW) — run together
  • Pass 8 (npm test) + Pass 9 (lint) — run together
       ↓
All 10 commented on PR? → ACCEPT immediately (proceed to merge)
Any fail? → Fix → Re-run failed passes only → post new comment → merge when pass
< 10 comments? → Run missing passes, post comments. Do NOT leave PR hanging.
```

**Time-bound**: Ten-pass target: complete within 15 minutes. If blocked, escalate; don't leave PR open indefinitely.

## Pass 6–7, 10: REVIEW.md Checklist

**Always check** (Pass 6):
- New API endpoints have integration tests
- Error messages don't leak internal details
- Evidence: every claim has file:line; no invented fields
- Confidence score backed by test output when ≥ 0.70

**Style** (Pass 7):
- Early returns over nested conditionals
- Structured logging (JSON, traceId), not f-string
- Backend errors: type, message, traceId, suggestion, retryable per RFC 7807

**Project-specific** (Pass 10):
- Diagnosis output: root_cause, evidence, fix_plan, rollback, tests, confidence
- Never invent: APIs, tables, file paths, env vars, test results

## Doc ↔ Code

- **REVIEW.md** = Passes 6, 7, 10 (Always, Style, Project-specific)
- **ten-pass-verification** = This skill
- **docs/CODE_AND_DOCS.md** = Full mapping; docs and code together

## Integration

- **agent-task-assignment**: Passes 1–5 = CodeReviewer, APIValidator, EvidenceReviewer, QAReviewer, Critic — spawn all in parallel
- Invoked before `pr-push-merge` hands off PR
- Invoked during Phase 3 of `e2e-orchestrator` and `plan-and-execute`
- Replaces or extends five-agent-verification when thoroughness is required
- User does not need to supervise; 10 checks run automatically
