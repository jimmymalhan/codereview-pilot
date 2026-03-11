---
name: full-cycle-automation
description: Complete automation loop: branch cleanup → PR comments → merge → learn from mistakes → upgrade skillset. All skills have agents; all agents have 4-5 phases with sub-agent owners. Runs automatically.
argument-hint: [|resume]
---

# Full Cycle Automation

**Purpose**: Everything runs automatically. Cleanup branches → Comment on PRs → Merge → Learn from mistakes → Upgrade skillset → Repeat. Every skill has agents; every agent has 4-5 phases; every phase has a sub-agent owner.

---

## Execution Standard (HARD)

- **All skills have agents** — Every skill defines sub-agents for its phases
- **All agents have 4-5 phases** — DISCOVER → PLAN → IMPLEMENT → VERIFY → DELIVER
- **Every phase has an owner** — At least one sub-agent owns each phase
- **Auto-execute** — No approval gates. Proceed through full cycle automatically.

---

## Phase 1: BRANCH CLEANUP

**Owner**: `branch-cleanup` skill → BranchScout, BranchPlanner, BranchCleaner, CleanupVerifier, CleanupReporter

### Sub-Agents
| Phase | Sub-Agent | Model | Owner |
|-------|-----------|-------|-------|
| DISCOVER | BranchScout | haiku | List merged branches, stale branches, open PRs |
| PLAN | BranchPlanner | haiku | Decide which to delete, which to keep |
| IMPLEMENT | BranchCleaner | haiku | `git branch -d`, `gh pr close` |
| VERIFY | CleanupVerifier | haiku | Confirm deleted, no orphaned refs |
| DELIVER | CleanupReporter | haiku | Post summary; update skillset if patterns found |

### Invoke
`branch-cleanup` skill (5 phases, 5 sub-agents)

---

## Phase 2: PR COMMENTS & CRITIQUES

**Owner**: `ten-pass-verification` + `pr-comments-live` + `github-agent-identities`

### Sub-Agents
| Phase | Sub-Agent | Model | Owner |
|-------|-----------|-------|-------|
| DISCOVER | PRScout | haiku | Find open PRs needing comments |
| PLAN | CritiquePlanner | sonnet | Which passes to run; parallel schedule |
| IMPLEMENT | CritiqueRunner | haiku | Spawn CodeReviewer, APIValidator, etc.; each posts `gh pr comment` |
| VERIFY | CommentVerifier | haiku | Confirm 10 comments on PR |
| DELIVER | CommentReporter | haiku | Report PR ready for merge when all pass |

### Invoke
`ten-pass-verification` (10 passes), `five-agent-verification`, `pr-comments-live`, `github-agent-identities`

---

## Phase 3: MERGE

**Owner**: `pr-push-merge` Phase 5 + `consensus-gates`

### Sub-Agents
| Phase | Sub-Agent | Model | Owner |
|-------|-----------|-------|-------|
| DISCOVER | MergeScout | haiku | PRs with 10 comments + consensus |
| PLAN | MergePlanner | haiku | Merge order (base first) |
| IMPLEMENT | Merger | haiku | `gh pr merge`, `git branch -d` |
| VERIFY | MergeVerifier | haiku | Confirm merged, branch deleted |
| DELIVER | MergeReporter | haiku | Report merged PRs |

### Invoke
`pr-push-merge` Phase 5, `consensus-gates`

---

## Phase 4: LEARN FROM MISTAKES

**Owner**: `skills-self-update` skill

### Sub-Agents
| Phase | Sub-Agent | Model | Owner |
|-------|-----------|-------|-------|
| DISCOVER | LessonFinder | haiku | What went wrong; which fix applied |
| PLAN | LessonPlanner | haiku | Which skill to update |
| IMPLEMENT | LessonWriter | haiku | Add lesson to SKILL.md |
| VERIFY | LessonVerifier | haiku | Confirm lesson present, no duplicate |
| DELIVER | LessonCommitter | haiku | Commit skill update |

### Invoke
`skills-self-update` (after any fix, CI failure, or merge)

---

## Phase 5: UPGRADE SKILLSET

**Owner**: `repository-audit-to-skillset` + `user-feedback-to-skillset`

### Sub-Agents
| Phase | Sub-Agent | Model | Owner |
|-------|-----------|-------|-------|
| DISCOVER | AuditScout | haiku | Run `gh pr list`, `git branch`, `git log` |
| PLAN | AuditPlanner | sonnet | Map data to skills; identify updates |
| IMPLEMENT | SkillUpgrader | haiku | Update SKILL.md files, SKILLSETS.md |
| VERIFY | UpgradeVerifier | haiku | Confirm skills updated |
| DELIVER | UpgradeCommitter | haiku | Commit skill upgrades; CHANGELOG |

### Invoke
`repository-audit-to-skillset`, then update relevant skills

---

## Full Cycle Flow

```
START (run-the-business or /full-cycle-automation)
       ↓
1. BRANCH CLEANUP (branch-cleanup skill, 5 phases)
   → Delete merged branches, close abandoned PRs
       ↓
2. PR COMMENTS (ten-pass, five-agent, pr-comments-live)
   → All agents comment on PRs with critiques
       ↓
3. MERGE (pr-push-merge Phase 5, consensus-gates)
   → Merge when 10 comments + consensus; delete branch
       ↓
4. LEARN (skills-self-update, 5 phases)
   → Add lessons from fixes, failures, merges
       ↓
5. UPGRADE SKILLSET (repository-audit-to-skillset, 5 phases)
   → Audit repo; update skills from evidence
       ↓
REPEAT or DONE
```

---

## When to Run

- **Automatically** when `run-the-business` is invoked
- **On schedule** via cron or trigger (if configured)
- **Manually** `/full-cycle-automation` or "run full cycle"

---

## Skill → Agent → Phase Owner Summary

| Skill | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|-------|---------|---------|---------|---------|---------|
| branch-cleanup | BranchScout | BranchPlanner | BranchCleaner | CleanupVerifier | CleanupReporter |
| pr-push-merge | CommitScout | PRPlanner | CommitExecutor | CIWatcher | PRPublisher |
| ten-pass/five-agent | (parallel spawn) | CritiquePlanner | CodeReviewer, APIValidator, etc. | CommentVerifier | CommentReporter |
| skills-self-update | LessonFinder | LessonPlanner | LessonWriter | LessonVerifier | LessonCommitter |
| repository-audit-to-skillset | AuditScout | AuditPlanner | SkillUpgrader | UpgradeVerifier | UpgradeCommitter |

**Rule**: Every skill has 4–5 phases. Every phase has at least one sub-agent owner.

---

## Integration

- **run-the-business**: Invokes full-cycle-automation as default loop
- **idea-to-production**: Uses phases 2–3 (comments, merge); after merge → Phase 1, 4, 5
- **live-watchdog**: On error → fix → Phase 4 (learn) → Phase 5 (upgrade)
