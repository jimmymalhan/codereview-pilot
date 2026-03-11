# Implementation Guide: New Documentation & Agent Configuration

**Status**: ✅ Complete - Ready for use
**Date**: 2026-03-10

This guide explains the new documentation structure and how to use it effectively.

---

## What's Changed (Quick Summary)

| Item | Before | After | Change |
|------|--------|-------|--------|
| CLAUDE.md | 113 lines | 130 lines | Focused on project rules + workflow |
| Rules files | 9 files, 1971 lines | 5 files, 463 lines | Removed outdated, kept essential |
| Meta-rules | None | .claude/CLAUDE.md (230 lines) | New file for workflow + memory + agents |
| API standards | Mixed in rules | .claude/rules/api.md (85 lines) | New scoped file |
| CLI standards | None | .claude/rules/cli.md (70 lines) | New scoped file |
| Auto memory | 244 lines | 160 lines | Consolidated to essentials |
| Settings hooks | Empty | 3 real hooks | PreToolUse, OnSessionEnd, Notification |
| Subagents defined | 9 agents | 3 core + 2 optional | Clear roles and constraints |
| README | No workflow | Added workflow section | Problem, solution, target users, workflow |
| Feedback log | None | .claude/FEEDBACK_LOG.md | Weekly stakeholder feedback template |

---

## File Structure (Now)

```
.claude/
├── CLAUDE.md                    # META: Workflow, memory, subagent strategy
├── settings.json                # PROJECT: Hooks, commands, agents, config
└── rules/                       # PROJECT: Standards by concern
    ├── guardrails.md           # Anti-hallucination (92 lines)
    ├── testing.md              # Test requirements (110 lines)
    ├── backend.md              # Reliability (119 lines)
    ├── confidence.md           # Scoring rubric (131 lines)
    ├── ui.md                   # Design standards (138 lines)
    ├── api.md                  # API standards (85 lines) [NEW]
    └── cli.md                  # CLI standards (70 lines) [NEW]

Root/
├── CLAUDE.md                    # PROJECT RULES (non-negotiable, 130 lines)
├── README.md                    # Problem, solution, workflow, features
├── REFACTORING_SUMMARY.md      # What changed and why (this refactoring)
├── IMPLEMENTATION_GUIDE.md      # How to use the new structure (this file)

Auto Memory (persists across sessions):
└── ~/.claude/projects/.../memory/MEMORY.md  # Essential patterns only (160 lines)

Docs/
├── CONFIDENCE_SCORE.md          # Truth ledger with evidence
├── FEEDBACK_LOG.md              # Stakeholder feedback template [NEW]
└── [other docs]
```

---

## How to Use This

### For Reading Project Rules
**Step 1**: Read `CLAUDE.md` (5 min)
- Non-negotiable rules
- Output contract
- Recommended workflow
- Done definition

**Step 2**: Read `.claude/CLAUDE.md` (10 min)
- Why Plan Mode matters
- Auto memory strategy
- Subagent roles
- Verification criteria

**Step 3**: Check specific rule (5 min)
- `.claude/rules/guardrails.md` - Anti-hallucination standards
- `.claude/rules/testing.md` - Test requirements
- `.claude/rules/backend.md` - Reliability standards
- `.claude/rules/api.md` - REST API contract
- `.claude/rules/cli.md` - Command-line interface
- `.claude/rules/ui.md` - Design standards
- `.claude/rules/confidence.md` - Scoring rubric

### For Starting New Work
1. **Read** `CLAUDE.md` (project rules)
2. **Read** `.claude/CLAUDE.md` (workflow guidance)
3. **Check** `.claude/CONFIDENCE_SCORE.md` (prior work)
4. **Run** `npm test` (current state)
5. **Use** EnterPlanMode if task is non-trivial

### For Claude Agents (Recommended Workflow)

**Phase 1: Plan (EnterPlanMode)**
```
1. Use Explore agent to search codebase
2. Understand current implementation
3. Design solution approach
4. Identify test criteria
5. Present plan to user (ExitPlanMode)
```

**Phase 2: Execute (After Approval)**
```
1. Implement changes (General-purpose agent or solo)
2. Write tests for critical flows
3. Run: npm test (verify locally)
4. Commit with clear message
```

**Phase 3: Verify & Score**
```
1. Run: npm test (get output)
2. Update .claude/CONFIDENCE_SCORE.md (with evidence)
3. Update CHANGELOG.md (what changed, why)
4. Score confidence (only 95-100 if tests pass + evidence)
```

---

## Subagent Strategy (Updated)

### Core Agents (Always Available)
| Agent | Model | Role | Tools | When to Use |
|-------|-------|------|-------|-------------|
| **Explore** | Haiku | Search codebase | Glob, Grep, Read | "Find API endpoints", "What handles auth?" |
| **Plan** | Sonnet | Research + design | All read tools | Plan Mode: understand scope + design |
| **General** | Haiku | Code + tests | All tools | Execute approved plans, write tests |

### Optional Specialized Agents (Max 3-5 total)
| Agent | When to Use |
|-------|-------------|
| **CodeReviewer** | Need parallel review while coding |
| **APIValidator** | Testing multiple API integrations |
| Custom agent | Only if you have 3+ independent parallel tasks |

### When to Spawn vs Work Solo
✅ **DO spawn agents when:**
- 3+ independent parallel tasks (no dependencies)
- Code review needed while you implement
- Specialized expertise required
- Large codebase exploration

❌ **DON'T spawn agents when:**
- Single task that's straightforward
- Work is sequential (depends on prior steps)
- Quick research/clarification
- Agent would duplicate your work

---

## Memory Best Practices

### What to Save (Keep ≤200 lines)
- ✅ Stable patterns confirmed 3+ times
- ✅ Key architectural decisions + file paths
- ✅ User preferences + workflow style
- ✅ Solutions to recurring problems
- ✅ Lessons learned from failures

### What NOT to Save
- ❌ Session-specific context (current task)
- ❌ Unverified conclusions (need more evidence)
- ❌ Duplicates of CLAUDE.md or rules
- ❌ Speculative or incomplete knowledge

### Update Process
1. **Verify** before writing (is this actually true?)
2. **Search** first (does this already exist in memory?)
3. **Update** if wrong (correct the entry, don't duplicate)
4. **Remove** if outdated (keep only current patterns)
5. **Link** to separate files if too detailed (topic files)

### Example Memory Entry
```markdown
## Pattern: Always Plan Mode First
- Separation of planning (exploration) from coding prevents rework
- Use EnterPlanMode tool before starting non-trivial tasks
- Plan should include: scope, approach, test criteria, risks
- User prefers seeing plan before implementation

## User Preference: Tests First
- Always run `npm test` before committing
- Provide actual test output (not guesses)
- Never claim "should work" without test proof
```

---

## Confidence Scoring (Simplified)

**Only claim high confidence if:**
- ✅ All critical workflows tested locally
- ✅ Tests passing in npm test
- ✅ Provided test output as evidence
- ✅ Unknowns documented with [UNKNOWN]
- ✅ Rollback path verified as safe

**Example**:
```
Confidence: 92/100

Evidence:
- Ran `npm test`: 319 passing (89.87% coverage)
- GitHub Actions: workflow #451 passed
- Critical flows tested:
  ✓ Happy path: input → success
  ✓ Error path: invalid input → error message
  ✓ Retry logic: network failure → auto-retry → success

Unknowns:
[UNKNOWN] - Response behavior under extreme load (not tested)

Residual risks:
- Very slow network could timeout (mitigation: user can retry)
```

**Confidence levels:**
- **95-100**: All critical flows tested, passing, documented
- **80-94**: Strong proof, minor open items documented
- **60-79**: Implemented but some flows untested
- **40-59**: Partial evidence, significant gaps
- **0-39**: Guess, no evidence - don't release

---

## Hooks Overview (In .claude/settings.json)

### PreToolUse Hook
**Purpose**: Prevent dangerous edits, enforce testing
- Blocks edits to `.env`, `secrets.json`, `CLAUDE.md`
- Warns when committing without `npm test`
- Warns before push to main

### OnSessionEnd Hook
**Purpose**: Preserve critical context after compaction
- Saves `CLAUDE.md` and `.claude/CLAUDE.md`
- Keeps `.claude/CONFIDENCE_SCORE.md` in context
- Reloads auto memory

### Notification Hook
**Purpose**: Alert when user decision needed
- When blocked and clarification needed
- When confidence cannot be scored without evidence
- When code changes require approval
- When tests fail and need investigation

---

## Common Workflows

### Workflow 1: Fix a Bug
```
1. Read CLAUDE.md (rules)
2. Read .claude/CLAUDE.md (workflow)
3. Check .claude/CONFIDENCE_SCORE.md (prior work)
4. Run npm test (current state)
5. EnterPlanMode:
   - Search for bug location
   - Understand root cause
   - Design fix + test strategy
6. ExitPlanMode (get approval)
7. Implement + test
8. npm test (verify)
9. Update .claude/CONFIDENCE_SCORE.md
10. Update CHANGELOG.md
11. Confidence score 80+? Ready for PR
```

### Workflow 2: Add Feature
```
1. EnterPlanMode:
   - Explore related code
   - Design architecture
   - Identify test criteria
   - List risks/unknowns
2. ExitPlanMode (get approval)
3. Spawn optional agents:
   - General: implement code
   - CodeReviewer: review in parallel
4. Implement with tests
5. npm test (verify)
6. Update .claude/CONFIDENCE_SCORE.md
7. Update CHANGELOG.md
8. Confidence score 90+? Ready for merge
```

### Workflow 3: Performance Optimization
```
1. Measure current performance (baseline)
2. Identify bottleneck (profile with DevTools)
3. Design fix + expected improvement
4. Implement optimization
5. Measure new performance (verify improvement)
6. Write tests to prevent regression
7. Update .claude/CONFIDENCE_SCORE.md with metrics
8. Document before/after in CHANGELOG.md
```

---

## Feedback Collection (Weekly)

Every Friday, collect feedback in `.claude/FEEDBACK_LOG.md`:

1. **Collect** from stakeholders:
   - End users (bug reports, feature requests)
   - Engineering (technical debt, refactoring)
   - QA (test coverage, edge cases)
   - Product (roadmap, priorities)
   - Security (vulnerabilities, compliance)

2. **Categorize** by severity:
   - Critical (security, compliance, blocking)
   - High (major features, performance)
   - Medium (nice-to-have, minor bugs)
   - Backlog (future considerations)

3. **Plan** action items:
   - Assign owner
   - Set due date
   - Link to task/PR

4. **Execute** & track:
   - Update status (Pending, In Progress, Done)
   - Link to commits/PRs
   - Document resolution

5. **Close loop**:
   - Verify fix in production
   - Update stakeholder
   - Archive to FEEDBACK_LOG_ARCHIVE.md

---

## Quick Reference Checklists

### Before Committing Code
- [ ] Run `npm test` locally
- [ ] No console.logs in production code
- [ ] No commented-out code
- [ ] All critical flows tested
- [ ] Rollback path documented

### Before Creating PR
- [ ] All tests passing (npm test)
- [ ] GitHub Actions passing (check CI)
- [ ] .claude/CONFIDENCE_SCORE.md updated with evidence
- [ ] CHANGELOG.md updated with what changed
- [ ] No regressions in existing tests
- [ ] Unknowns marked with [UNKNOWN]

### Before Merging to Main
- [ ] Code review approval ✓
- [ ] All tests passing ✓
- [ ] No breaking changes ✓
- [ ] Documentation complete ✓
- [ ] Confidence score ≥ 80 ✓

### Before Releasing to Production
- [ ] All gates passed ✓
- [ ] Critical workflows tested locally ✓
- [ ] Rollback procedure tested ✓
- [ ] Monitoring/alerts in place ✓
- [ ] Stakeholder signoff ✓

---

## Getting Help

**Question about...** → **Check this file...**
- Project rules | CLAUDE.md
- Workflow | .claude/CLAUDE.md
- Testing | .claude/rules/testing.md
- APIs | .claude/rules/api.md
- CLI | .claude/rules/cli.md
- Design | .claude/rules/ui.md
- Scoring | .claude/rules/confidence.md
- Anti-hallucination | .claude/rules/guardrails.md
- Backend reliability | .claude/rules/backend.md
- Previous work | .claude/CONFIDENCE_SCORE.md
- Changes made | CHANGELOG.md
- This refactoring | REFACTORING_SUMMARY.md

---

## Next Steps

1. **Read** CLAUDE.md + .claude/CLAUDE.md (understand workflow)
2. **Bookmark** .claude/rules/ (quick reference)
3. **Use** Plan Mode on next task (validate workflow)
4. **Collect** feedback in .claude/FEEDBACK_LOG.md (weekly)
5. **Update** memory when discovering patterns (3+ confirmations)

**Questions?** See "Getting Help" section above or check specific rule file.

---

**Maintained by:** Claude Code
**Last Updated:** 2026-03-10
**Ready to use:** ✅ Yes
