---
name: repository-audit-to-skillset
description: Check PRs (open/closed), commits, and branches. Use the data to update the skill set. 5 phases with sub-agent owners. Run when asked to audit repository state or as Phase 5 of full-cycle-automation.
---

# Repository Audit → Skillset

**Purpose**: Check PRs, commits, and branches. Use that data to update the skill set. Evidence from the repo drives skill updates. Every phase has a sub-agent owner.

---

## Phase 1: DISCOVER

### Sub-Agent: `AuditScout` (model: haiku)
- **Tools**: Bash
- **Prompt**: Run `gh pr list --state all --limit 50`. Run `git branch -a`. Run `git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short) | %(committerdate:short) | %(subject)'`. Run `git log --all --oneline | head -60`. Collect raw data.
- **Output**: `{ open_prs[], closed_prs[], branches[], commits[] }`
- **Gate**: data collected
- **Owner**: AuditScout

## Phase 2: PLAN

### Sub-Agent: `AuditPlanner` (model: sonnet)
- **Tools**: Read
- **Prompt**: Map data to skills. Open PRs → consensus-gates, merge order. Closed PRs → merge vs closed patterns. Branches → branch-cleanup, pr-push-merge. Commits → naming-convention-product. Identify which skills need updates.
- **Output**: `{ skill_updates[], themes[], patterns[] }`
- **Gate**: at least one skill identified or "no updates needed"
- **Owner**: AuditPlanner

## Phase 3: IMPLEMENT

### Sub-Agent: `SkillUpgrader` (model: haiku)
- **Tools**: Read, Edit
- **Prompt**: For each skill in skill_updates: read SKILL.md, add lesson or update section. Update .claude/SKILLSETS.md if new skill or mapping changed.
- **Output**: `{ files_updated[], skills_updated[] }`
- **Gate**: updates applied
- **Owner**: SkillUpgrader

## Phase 4: VERIFY

### Sub-Agent: `UpgradeVerifier` (model: haiku)
- **Tools**: Read
- **Prompt**: Re-read updated SKILL.md files. Confirm lessons/updates present. No duplicates. SKILLSETS.md consistent.
- **Output**: `{ verified: boolean, issues[] }`
- **Gate**: verified
- **Owner**: UpgradeVerifier

## Phase 5: DELIVER

### Sub-Agent: `UpgradeCommitter` (model: haiku)
- **Tools**: Bash, Edit
- **Prompt**: Update CHANGELOG.md with "Skill update from repository audit: <skills>". Commit skill changes. Push to current branch.
- **Output**: `{ commit_sha, files_committed }`
- **Gate**: committed
- **Owner**: UpgradeCommitter

---

## Audit Commands (Reference)

```bash
# PRs (open + closed)
gh pr list --state all --limit 50

# Branches with last commit
git branch -a
git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short) | %(committerdate:short) | %(subject)'

# Commits across branches
git log --all --oneline | head -60
```

---

## Data to Extract

| Source | Extract | Use For |
|--------|---------|---------|
| **Open PRs** | Titles, branch names, staleness | Consensus gate, merge order, cleanup |
| **Closed PRs** | Merge vs closed-without-merge | Patterns, rollback lessons |
| **Branches** | Unmerged feature/*, fix/*, age | Cleanup-after-merge, branch hygiene |
| **Commits** | Types (feat, fix, docs), scope | Naming conventions, skill coverage |
| **Commit themes** | Recurring patterns | New skill or update existing |

---

## Apply to Skillset

1. **Branch clutter** → Update `pr-push-merge` or create `branch-hygiene`: delete merged branches; close abandoned PRs
2. **PR merge patterns** → Update `consensus-gates`: multiple comments, 100% consensus before merge
3. **Commit format** → Update `naming-conventions` (or create skill): feat(scope), fix(scope), docs
4. **Unmerged work** → Identify gaps; add to relevant skill (e.g., critiques, ten-pass) if work is blocked
5. **Recurring themes** → Create new skill if no existing fit; else update existing

---

## Workflow

```
Run audit (gh pr list; git branch; git log)
       ↓
Extract: open PRs, closed PRs, unmerged branches, commit themes
       ↓
Map to skills: Which skill(s) does this inform?
       ↓
Update .claude/skills/<name>/SKILL.md
       ↓
Update docs/SKILLSETS.md
       ↓
CHANGELOG.md (skill change from audit)
```

---

## Reference: Common Branch/PR Themes

| Theme | Skill(s) |
|-------|----------|
| Naming (branches, commits, PRs) | naming-conventions |
| Consensus before merge | consensus-gates |
| Clean up after merge | pr-push-merge |
| Critiques, stakeholders | critiques (if skill exists) |
| Ten-pass scope | ten-pass-verification |
| Small commits, small PRs | pr-push-merge |
| PR reviewers, don't rush | pr-reviewers |
| User feedback → skillset | user-feedback-to-skillset |

---

## Current State (From Audit 2026-03-11)

**Open PRs**: #21 (pr-reviewers-workflow), #20 (small-commits-small-prs)
**Unmerged branches**: feature/best-sales-guide-skill, feature/cleanup-after-merge-rule, feature/consensus-gates-required, feature/critiques-first-run-the-company, feature/critiques-mandatory-everywhere, feature/naming-conventions-ultra-clear, feature/ten-pass-end-to-end, fix/diagnosis-form-display
**Commit themes**: user-feedback-to-skillset, consensus-gates, ten-pass end-to-end, best-sales-guide, critiques-first, naming-conventions, cleanup, pr-reviewers, small commits/PRs, token conservation
**Skill updates from this**: Ensure consensus-gates, pr-push-merge, user-feedback-to-skillset, ten-pass-verification, cleanup-after-merge are all in skill set and referenced. Branches should be merged or cleaned per cleanup-after-merge rule.

---

## Preload

When Plan or General-Purpose runs repository audit or "check PRs/branches/commits", use this skill to ensure audit data flows into skill updates.
