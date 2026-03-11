---
name: pr-reviewers
description: Production house workflow. Reviewers comment on PRs, push back, recommend tests. Iterate until production-level. Do NOT rush to merge. See docs/reviewers.md.
---

## Purpose

When a PR is ready to merge, **reviewers** come in, make comments, push back. Author iterates. Reviewers recommend additional tests. Merge only when reviewers recommend merge + all CI + recommended tests pass. If reviewers do not recommend merge → create new branch, work harder.

## Phase 1: REVIEW
### Sub-Agent: `ReviewerSpawner` (model: sonnet)
- **Tools**: Read, Grep
- **Prompt**: Spawn 5 reviewer agents (ProductionReviewer, BusinessReviewer, SecurityReviewer, CodeReviewer, QAReviewer). Each reviews PR diff. Output comments per reviewer.
- **Output**: `{ comments[{reviewer, file, line, comment, severity, recommend_merge: boolean, additional_tests[]}] }`
- **Gate**: all 5 reviewers responded

## Phase 2: ITERATE
### Sub-Agent: `CommentResolver` (model: haiku)
- **Tools**: Read, Edit, Bash
- **Prompt**: For each BLOCK or REQUEST_CHANGE comment: fix the issue. Commit fix. Push. Re-trigger reviewers on changed files.
- **Output**: `{ fixes_applied[], commits[], reviewers_re_run[] }`
- **Gate**: all blocking comments addressed OR max 3 iteration rounds

## Phase 3: RECOMMEND TESTS
### Sub-Agent: `TestRecommender` (model: sonnet)
- **Prompt**: Aggregate additional_tests from reviewers. Deduplicate. Output list of tests to add/run.
- **Output**: `{ tests_to_add[], tests_to_run[] }`
- **Gate**: list produced

## Phase 4: VERIFY
### Sub-Agent: `MergeGate` (model: haiku)
- **Prompt**: All reviewers recommend_merge? All CI green? All recommended tests pass? If YES → allow merge. If NO → exit with "Do not merge. Create new branch. Work harder. [list of blocking items]."
- **Output**: `{ merge_recommended: boolean, blocking_items[], create_new_branch: boolean }`
- **Gate**: merge_recommended=true to proceed

## Rules (HARD)

1. **Do NOT rush to merge** — Wait for reviewer recommendation.
2. **Iterate on every comment** — Address feedback. Trade on it.
3. **Run reviewer-recommended tests** — Before merge.
4. **If not recommended** — Create new branch (e.g. feature/<name>-v2). Work harder. Resubmit.
5. **Production-level** — Act like a production house. Business-level code only.

## Integration

- Invoked by pr-push-merge before Phase 5 (DELIVER)
- Uses five-agent-verification; reviewers extend with comments + recommend_merge + additional_tests
- See docs/reviewers.md for full workflow
