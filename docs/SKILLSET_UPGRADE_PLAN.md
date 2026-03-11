# Skill Set Upgrade Plan: World-Class

**Date**: 2025-03-10  
**Goal**: Upgrade skill set to best-in-class based on Claude Code docs, agent orchestration best practices, and gap analysis.

---

## 1. Gaps from Claude Code Docs

| Gap | Source | Action |
|-----|--------|--------|
| No REVIEW.md | [Code Review](https://code.claude.com/docs/en/code-review) | Add REVIEW.md for review-specific rules |
| No `context: fork` skills | [Skills](https://code.claude.com/docs/en/skills) | Add pr-summary with fork + `!`command`` |
| No PreToolUse test filter | [Costs](https://code.claude.com/docs/en/costs) | Add filter-test-output.sh hook |
| CLAUDE.md length | [Features](https://code.claude.com/docs/en/features-overview) | Keep <200 lines; move to skills/rules |
| Agent teams pattern | [Agent Teams](https://code.claude.com/docs/en/agent-teams) | Document when to use vs subagents |

## 2. Gaps from Agent Orchestration Best Practices

| Principle | Source | Our Alignment |
|-----------|--------|---------------|
| Explicit handoffs (schema, validator) | Skywork, Sista | handoff-protocol — add schema in skill |
| Isolation (container, memory, limits) | Sista | Document in execution-agent |
| Memory management (long vs short term) | Skywork | Separate MEMORY.md vs conversation; document |
| Structured decision-making | Sista | consensus-resolver, critic — already codified |

## 3. High-Priority Skills Not Implemented (from ULTRA_ADVANCE_REVIEW)

| Skill | Effort | Impact |
|-------|--------|--------|
| lint-fixer | Low | High — ESLint --fix before commit |
| health-checker | Medium | High — liveness/readiness probes |
| deploy-trigger | Medium | High — CI/CD integration |

## 4. Skill Quality Upgrades

| Upgrade | Scope |
|---------|-------|
| `argument-hint` | All skills with args (idea-to-production, run-the-business, fix-issue) |
| Supporting files | Move checklist template to plan-and-execute/templates/ |
| `disable-model-invocation` | deploy, merge, fix-pr-creator — side-effect skills |
| Output contract schema | critic, error-detector, consensus-resolver — JSON schema in skill |

## 5. Execution Order

1. Add REVIEW.md (quick win)
2. Add lint-fixer skill (high value)
3. Add pr-summary with `context: fork` (Claude Code pattern)
4. Add filter-test-output hook script (cost reduction)
5. Update handoff-protocol with schema
6. Update SKILLSETS.md / docs with agent-teams guidance
