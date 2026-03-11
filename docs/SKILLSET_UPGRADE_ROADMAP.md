# Skill Set Upgrade Roadmap

**Focus**: How to keep upgrading the skill set. Recommendations from Claude Code docs, ULTRA_ADVANCE_REVIEW, and SKILLSET_UPGRADE_PLAN.

---

## 1. New Skills to Add

| Skill | Purpose | Effort | Source |
|-------|---------|--------|--------|
| **health-checker** | Liveness, readiness, dependency probes | Medium | ULTRA_ADVANCE_REVIEW |
| **deploy-trigger** | Auto-trigger deploy on merge; CI/CD integration | Medium | ULTRA_ADVANCE_REVIEW |
| **changelog-writer** | Auto-generate CHANGELOG from commits/PRs | Low | ULTRA_ADVANCE_REVIEW |
| **dependency-updater** | npm audit fix, Dependabot-style, lock refresh | Low | ULTRA_ADVANCE_REVIEW |
| **test-gap-analyzer** | Map coverage gaps; untested paths; mutation hints | Medium | ULTRA_ADVANCE_REVIEW |
| **deep-research** | `context: fork` + Explore; thorough codebase research | Low | CLAUDE_CODE_ULTRA_ADVANCE |

---

## 2. Skill Quality Upgrades (Existing Skills)

| Upgrade | Skills | Action |
|---------|--------|--------|
| **argument-hint** | All with args | Add `argument-hint: [arg]` to frontmatter |
| **Supporting files** | plan-and-execute, pr-push-merge | Move templates to `skill/templates/`, reference in SKILL.md |
| **disable-model-invocation** | fix-pr-creator, auto-merge | Set true for side-effect-only skills |
| **Output contract schema** | critic, error-detector, consensus-resolver | Add JSON schema block to each |
| **allowed-tools** | Explore-style skills | Restrict to Read, Grep, Glob where read-only |
| **Compact** | All >400 lines | Split to reference.md; keep SKILL.md <500 lines |

---

## 3. Claude Code Patterns to Adopt

| Pattern | Skills to Update | Reference |
|---------|-----------------|-----------|
| **context: fork** | Add deep-research, codebase-scout | [Run skills in subagent](https://code.claude.com/docs/en/skills#run-skills-in-a-subagent) |
| **Dynamic `!`command``** | live-watchdog, error-detector | [Inject dynamic context](https://code.claude.com/docs/en/skills#inject-dynamic-context) |
| **user-invocable: false** | Background knowledge skills | [Control who invokes](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill) |
| **Bundled scripts** | lint-fixer, health-checker | [Add supporting files](https://code.claude.com/docs/en/skills#add-supporting-files) |

---

## 4. Next-Level Capabilities (Skill Concepts)

| Capability | Skill Concept | Why |
|------------|---------------|-----|
| **Causal debugging** | evidence-chain | Trace failure → root cause |
| **Regression guard** | regression-check | Per-PR: did this introduce failure? |
| **Spec-driven tests** | spec-to-tests | OpenAPI/Contract → auto-generate tests |
| **Cost per run** | cost-audit | Token/credit per phase, per agent |
| **Self-tune thresholds** | threshold-learner | Confidence decay, circuit N from history |

---

## 5. Integration Skills

| Skill | Purpose |
|-------|---------|
| **github-rules** | CODEOWNERS, branch protection, auto-merge rules |
| **observability** | OpenTelemetry, metrics export, trace correlation |
| **secrets-rotation** | Vault/integration, rotation hooks |

---

## 6. Upgrade Cadence

1. **Quick wins** (1–2 skills/session): changelog-writer, deep-research, argument-hint audit
2. **Medium** (1 skill/session): health-checker, deploy-trigger
3. **Larger** (plan first): test-gap-analyzer, dependency-updater, integration skills

---

## 7. YouTube-Derived Patterns (See YOUTUBE_SKILL_UPGRADES.md)

| Pattern | Source | Action |
|---------|--------|--------|
| **Six-step framework** | Nate Herk | Name→Goal→Steps→References→Rules→Self-improvement |
| **Feedback cycle** | All | Invoke→watch→feedback→fix skill→repeat |
| **Progressive loading** | Anthropic | Frontmatter ~100 tokens; SKILL.md <500 lines; refs on demand |
| **Token savings** | Nate Herk | Hardcode IDs, reference.md over web search, subagent delegation |
| **When to build** | Claude official | "Explaining same thing repeatedly = skill waiting to be written" |
| **Testing fixes** | Nate Herk | Wrong order→edit; missing context→refs; triggers too often→disable-model-invocation |

---

## 8. Related

- [SKILLSETS.md](./SKILLSETS.md) — Full skill reference
- [YOUTUBE_SKILL_UPGRADES.md](./YOUTUBE_SKILL_UPGRADES.md) — Video-derived upgrade patterns
- [SKILLSET_UPGRADE_PLAN.md](./SKILLSET_UPGRADE_PLAN.md) — Plan and execution log
- [ULTRA_ADVANCE_REVIEW.md](./ULTRA_ADVANCE_REVIEW.md) — Gaps, review checklist
- [CLAUDE_CODE_ULTRA_ADVANCE.md](./CLAUDE_CODE_ULTRA_ADVANCE.md) — Claude Code alignment
