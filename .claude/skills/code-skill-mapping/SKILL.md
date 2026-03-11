---
name: code-skill-mapping
description: Maps skills to code. What skill drives what file. Single source for skill→code relationships. Use when tracing governance to implementation.
---

# Code ↔ Skill Mapping

**Purpose**: Skill → code mapping. Skills drive implementation. No separate doc↔code map; skills are canonical.

---

## Skill → Code

| Skill | Drives | Files |
|-------|--------|-------|
| **consensus-gates** | PR merge, idea/project/task gates | pr-push-merge, CLAUDE.md, guardrails |
| **user-feedback-to-skillset** | All user input → skills | Plan, General-Purpose, all agents |
| **repository-audit-to-skillset** | PR/branch/commit audit → skills | Plan, General-Purpose |
| **ten-pass-verification** | 10 checks end-to-end | pr-push-merge, e2e-orchestrator |
| **pr-push-merge** | Commit, push, CI, consensus, merge | Phase 1-5 subagents |
| **evidence-proof** | file:line, no invent | Retriever, Verifier, critic |
| **project-guardrails** | Branch-only, never invent | branch-aware-permissions.sh, settings.json |
| **REVIEW.md** | Code review rules | ten-pass passes 6,7,10; five-agent |

---

## Configuration

- `.claude/settings.json` — Hooks, agents, skills
- `CLAUDE.md` — Project standards
- `.claude/rules/` — guardrails, testing, confidence
- `.claude/SKILLSETS.md` — Skill index (canonical)

---

## Rule

Skills and code go together. Changing a skill? Update code that implements it. Changing code? Ensure skill reflects it. Never push separately.
