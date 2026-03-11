---
name: pr-push-merge
description: Commit (project-relevant only), push, npm run test:ci, provide localhost + PR links. Use when delivering, releasing, or after implementation. Merge when CI green (auto-merge default). Never invent links.
disable-model-invocation: true
argument-hint: [branch or ""]
---

**Uses** `execution-agent`: Enforce required fields (description, source prompt, web link, screenshot if frontend) before create. Fail loudly if missing.

**Uses** `lint-fixer`: Before commit, run lint fix when available (npm run lint --fix, eslint --fix).

**Uses** `secrets-scan`: Before commit, scan staged diff. Block if secrets detected.

**Uses** `reversibility`: PR body must include rollback section.

**Uses** `ten-pass-verification`: Before Phase 4, run 10-pass. **Each pass MUST post** `gh pr comment` with result and push-back. All 10 must pass AND comment. Merge blocked until 10 comments on PR.

**Uses** `pr-comments-live`: Post PR comment at same time as every commit, push, or update. Never work in silence.
**Uses** `parallel-execution`: Do multiple actions together (commit + push + comment); not one thing at a time.
**Uses** `naming-convention-product`: Commit message and PR title must use product domain (diagnosis, pipeline, api, evidence, ui) — never rule/process names.

## PR Comments (Every Phase)
After each phase: `gh pr comment --body "Phase N: <summary>"` — in parallel with the phase output. See `pr-comments-live` skill.

## Phase 1: DISCOVER
### Sub-Agent: `CommitScout` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run `git status`, `git diff --stat`. Find uncommitted changes. Check current branch. Verify not on main/master.
- **Output**: `{ branch, uncommitted_files[], staged_files[], on_main: boolean }`
- **Gate**: branch identified AND not on main

## Phase 2: PLAN
### Sub-Agent: `PRPlanner` (model: sonnet)
- **Prompt**: Plan commit scope: which files to stage (project-relevant only, no plans/reports). **Small PRs only** — one feature iteration per PR. Draft PR title and body. **Use product-centric naming**: scope = diagnosis, pipeline, api, evidence, ui, batch, webhook, audit (never rules like consensus-gates, ten-pass). Check if PR already exists.
- **Output**: `{ files_to_stage[], commit_message, pr_title, pr_body, pr_exists: boolean }`
- **Gate**: files selected AND message drafted (product scope)

## Phase 3: IMPLEMENT
### Sub-Agent: `CommitExecutor` (model: haiku)
- **Tools**: Bash
- **Prompt**: Stage files. Commit with message. Push to feature branch with -u flag. Create PR if requested (gh pr create).
- **Output**: `{ commit_sha, pushed: boolean, pr_url }`
- **Gate**: committed AND pushed

## Phase 4: VERIFY
### Sub-Agent: `CIWatcher` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Check CI status (gh run list). Verify localhost works (curl health). Report pass/fail.
- **Output**: `{ ci_status, localhost_ok: boolean, pr_url }`
- **Gate**: CI green AND localhost works

## Phase 5: DELIVER
### Sub-Agent: `PRPublisher` (model: haiku)
- **Prompt**: Output REAL PR link only (never invent). Output localhost URL only if verified. **Do NOT merge until 10 ten-pass critiques have commented.** Run critiques in parallel. **When gates pass, merge immediately** — do NOT leave PR hanging. See `consensus-gates` skill.
- **Output**: `{ pr_url, localhost_url, server_status, merge_status: "awaiting_10_pass_comments" | "awaiting_consensus" | "ready_to_merge" }`
- **Gate**: links are real. For merge: 10 ten-pass comments + consensus → merge same session. No indefinite wait.

## Contingency
IF push fails → check branch permissions → retry once → if still failing → contingency L5 (ask user).
IF CI fails → invoke contingency L1 (fix failing test) → re-push.

## Server Lifecycle
Phase 4 MUST verify localhost. Phase 5 MUST tell user: "Server running at localhost:3000. Leave terminal open."

---

# PR Push Merge Skill

**Purpose**: Complete delivery flow from commit to merge.

## Pre-Push Checklist

- [ ] `npm test` passes locally
- [ ] `npm run test:ci` passes (or equivalent)
- [ ] All relevant tests green
- [ ] Only project-relevant files in commit (no plans, reports, checklists)
- [ ] CHANGELOG updated with feature changes only
- [ ] README/docs updated if behavior changed
- [ ] Server starts: `npm start` → http://localhost:3000
- [ ] Manual smoke: forms, buttons, flows work

## Flow

1. **Commit** – Project-relevant only; conventional commits. **In parallel**: Post PR comment "Committed: <message>"
2. **Push** – To feature branch (never push direct to main). **In parallel**: Post PR comment "Pushed to <branch>"
3. **Run CI** – `npm run test:ci`; fix failures. **In parallel**: Post PR comment when CI status known
4. **Open PR** – Or update existing PR. **In parallel**: Post PR comment describing changes
5. **Provide** – Localhost URL (working) + PR link
6. **Consensus gate** – 10 ten-pass comments on PR required. Multiple comments (2+). 100% consensus. Do NOT merge without. See `consensus-gates` skill.
7. **Merge** – Only when 10 ten-pass comments exist on PR AND multiple comments AND 100% consensus. Never merge before 10-pass critiques have commented.
8. **Cleanup** – Delete branch after merge. Invoke `branch-cleanup` skill for full hygiene. Then `skills-self-update` (learn) and `repository-audit-to-skillset` (upgrade).

## Output Rules

- **Localhost**: Only output if server actually started and works
- **PR link**: Only output if PR actually created/updated
- **CI link**: Only output if CI actually ran
- Never invent links. Never claim 100% without evidence.

## Commit Rules

- Use repo standard commit style
- No personal strategy, AI attribution, or private workflow in messages
- No plans, reports, or internal notes in commits
