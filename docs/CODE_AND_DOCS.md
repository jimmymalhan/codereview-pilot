# Code ↔ Docs Map

**Purpose**: Single source of truth. Docs and code go hand in hand—never push separately. Ultra-clear mapping of what document drives what code.

---

## Current Work (What's Being Worked On)

| Focus | Docs | Code | Status |
|-------|------|------|--------|
| **Branch-only (HARD)** | FEATURE_BRANCH_PERMISSIONS.md, guardrails.md | branch-aware-permissions.sh (feature/* only), settings.json | Active |
| **Ten-pass verification** | REVIEW.md, ten-pass-verification/SKILL.md | pr-push-merge, e2e-orchestrator, General-Purpose | Active |
| **Evidence-first diagnosis** | CLAUDE.md, guardrails.md | src/local-pipeline.js, Router/Retriever/Skeptic/Verifier | Core |
| **No merge until 100%** | guardrails.md, CLAUDE.md, confidence.md | pr-push-merge Phase 4; block merge until local+CI+QA+confidence 100% | Active |

---

## Doc → Code Mapping

| Document | Drives | Files |
|----------|--------|-------|
| **REVIEW.md** | Code review rules; ten-pass passes 6, 7, 10 | .claude/skills/ten-pass-verification/SKILL.md, five-agent-verification |
| **CLAUDE.md** | Project standards, workflow, output contract | All agents; .claude/rules/ |
| **.claude/CLAUDE.md** | Meta-rules, Plan Mode, subagents | .claude/settings.json subagents |
| **.claude/settings.json** | Hooks, branch permissions, allowed commands | branch-aware-permissions.sh, PreToolUse hooks |
| **FEATURE_BRANCH_PERMISSIONS.md** | Permission policy (branch-only; no main commits) | branch-aware-permissions.sh is_auto_accept_branch |
| **docs/SKILLSETS.md** | Skill reference, role prompts | .claude/skills/*/SKILL.md |
| **ten-pass-verification/SKILL.md** | 10 checks before deliver | pr-push-merge Phase 3, e2e-orchestrator Phase 3 |
| **.claude/rules/guardrails.md** | Anti-hallucination | All skills, evidence-proof |
| **.claude/rules/testing.md** | Test requirements | qa-engineer, pr-push-merge |
| **.claude/rules/confidence.md** | Confidence scoring; merge gate (100% before merge) | critic, verifier, pr-push-merge Phase 4 |

---

## Execution Rules

- **Never ask permission to run tests** — Run `npm test` (and test:ci, test:e2e when needed); report results. Do not ask "Can I run tests?"
- **Docs and code go hand in hand** — Never push them separately.

## Commit Rule

**Docs and code go hand in hand. Never push them separately.**

- Changing a skill? Update SKILLSETS.md in same commit
- Changing branch permissions? Update FEATURE_BRANCH_PERMISSIONS.md in same commit
- Adding a feature? Update CHANGELOG.md + relevant docs in same commit
- Single commit per logical change: code + its docs together
