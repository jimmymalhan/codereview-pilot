---
name: branch-cleanup
description: Clean up merged branches and abandoned PRs. 5 phases with sub-agent owners. Run after merge or as part of full-cycle-automation.
---

# Branch Cleanup Skill

**Purpose**: Delete merged branches, close abandoned PRs. Keep repo tidy. Every phase has a sub-agent owner.

---

## Phase 1: DISCOVER

### Sub-Agent: `BranchScout` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run `gh pr list --state merged --limit 20`. Run `git branch -a`. Run `git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short) | %(committerdate:short)'`. List: merged PR branches, unmerged feature/* older than 7 days, branches already on main.
- **Output**: `{ merged_branches[], stale_branches[], on_main: boolean }`
- **Gate**: at least one branch or PR to consider
- **Owner**: BranchScout

## Phase 2: PLAN

### Sub-Agent: `BranchPlanner` (model: haiku)
- **Tools**: Read
- **Prompt**: For each merged branch: safe to delete? (PR merged, branch not current). For stale branches: check if PR exists; if no PR and >7 days → candidate for close. Never delete main, never delete current branch.
- **Output**: `{ to_delete[], to_close_pr[], skip[], reason[] }`
- **Gate**: plan has at least one action or explicit "none"
- **Owner**: BranchPlanner

## Phase 3: IMPLEMENT

### Sub-Agent: `BranchCleaner` (model: haiku)
- **Tools**: Bash
- **Prompt**: For each branch in to_delete: `git branch -d <branch>` (local) or `git push origin --delete <branch>` (remote). For each PR in to_close_pr: `gh pr close <number> --comment "Closed: stale. Reopen if needed."`. Switch away from branch before deleting if current.
- **Output**: `{ deleted[], closed[], errors[] }`
- **Gate**: actions executed
- **Owner**: BranchCleaner

## Phase 4: VERIFY

### Sub-Agent: `CleanupVerifier` (model: haiku)
- **Tools**: Bash
- **Prompt**: Re-run `git branch -a`. Confirm deleted branches are gone. Confirm closed PRs show closed. Report any failures.
- **Output**: `{ verified: boolean, remaining[], failures[] }`
- **Gate**: verified or failures documented
- **Owner**: CleanupVerifier

## Phase 5: DELIVER

### Sub-Agent: `CleanupReporter` (model: haiku)
- **Prompt**: Summarize: "Deleted N branches. Closed M PRs." If patterns found (e.g. many stale branches), suggest skill update to `pr-push-merge` or `branch-cleanup` lessons.
- **Output**: `{ summary, branches_deleted, prs_closed, lesson_suggested }`
- **Gate**: summary output
- **Owner**: CleanupReporter

---

## Rules

- **Never delete main** — Skip main, master
- **Never delete current branch** — `git checkout main` first if needed
- **Merged PRs** — Branch can be deleted after PR merge
- **Stale** — feature/* with no PR and >7 days: consider close or leave
- **PR with branch** — Prefer closing PR first, then delete branch

---

## Integration

- **full-cycle-automation**: Phase 1 is branch-cleanup
- **pr-push-merge**: Phase 5 mentions "delete branch after merge" — branch-cleanup executes it
- **repository-audit-to-skillset**: Uses branch list for audit
