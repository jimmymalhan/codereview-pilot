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

**Uses** `ten-pass-verification`: Before Phase 4, run 10-pass (REVIEW.md + five-agent + npm test + lint). All must pass.

## Phase 1: DISCOVER
### Sub-Agent: `CommitScout` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run `git status`, `git diff --stat`. Find uncommitted changes. Check current branch. Verify not on main/master.
- **Output**: `{ branch, uncommitted_files[], staged_files[], on_main: boolean }`
- **Gate**: branch identified AND not on main

## Phase 2: PLAN
### Sub-Agent: `PRPlanner` (model: sonnet)
- **Prompt**: Plan commit scope: which files to stage (project-relevant only, no plans/reports). Draft PR title and body. Check if PR already exists.
- **Output**: `{ files_to_stage[], commit_message, pr_title, pr_body, pr_exists: boolean }`
- **Gate**: files selected AND message drafted

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
- **Prompt**: Output REAL PR link only (never invent). Output localhost URL only if verified. **Do NOT merge without 100% consensus.** Require multiple comments (2+ from skills, agents, sub-agents, or reviewers). All must approve. Block merge until consensus. See `docs/CONSENSUS_GATES.md`.
- **Output**: `{ pr_url, localhost_url, server_status, merge_status: "awaiting_consensus" | "ready_to_merge" }`
- **Gate**: links are real. For merge: block until multiple comments + 100% consensus.

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

1. **Commit** – Project-relevant only; conventional commits
2. **Push** – To feature branch (never push direct to main)
3. **Run CI** – `npm run test:ci`; fix failures
4. **Open PR** – Or update existing PR
5. **Provide** – Localhost URL (working) + PR link
6. **Consensus gate** – Multiple comments required (2+ from skills, agents, sub-agents, reviewers). 100% consensus required. Do NOT merge without consensus. See `docs/CONSENSUS_GATES.md`.
7. **Merge** – Only when multiple comments AND 100% consensus. Never merge without.
8. **Cleanup** – Delete branch after merge

## Output Rules

- **Localhost**: Only output if server actually started and works
- **PR link**: Only output if PR actually created/updated
- **CI link**: Only output if CI actually ran
- Never invent links. Never claim 100% without evidence.

## Commit Rules

- Use repo standard commit style
- No personal strategy, AI attribution, or private workflow in messages
- No plans, reports, or internal notes in commits
