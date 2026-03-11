---
name: idea-to-production
description: Idea → Execute → Production with merge/deploy handoffs. Use when user gives idea, "add feature", "fix bug", or wants full flow to production. Handoff 1: merge (user approves). Handoff 2: deploy (explicit approval). Cost-optimized.
argument-hint: [idea or task]
---

## Execution Standard (Apply to Every Skill)

- **Phases**: Define sub-agents in **four to five different phases** in every skill (e.g. DISCOVER → PLAN → IMPLEMENT → VERIFY → DELIVER).
- **Auto-execute**: Do NOT wait for user to accept changes. Proceed through phases automatically. It is not guaranteed to run automatically if you pause for approval.

## Phase 1: DISCOVER
### Sub-Agent: `IdeaClassifier` (model: haiku)
- **Tools**: Read, Grep
- **Prompt**: Parse idea into: feature/fix/refactor. Estimate scope (small/medium/large). Check if already done (CHANGELOG, git log). Check server status.
- **Output**: `{ type, scope, already_done: boolean, server_status }`
- **Gate**: type identified AND not already done

## Phase 2: PLAN
### Sub-Agent: `FlowDesigner` (model: sonnet)
- **Prompt**: Design full flow: which phases, which agents, which handoffs. Create master checklist. Apply cost-guardrails. Estimate credit usage.
- **Output**: `{ master_checklist[], handoff_points[], cost_estimate, model_tiers[] }`
- **Gate**: checklist has >= 1 item. Proceed automatically; do NOT wait for user approval (per Execution Standard).

## Phase 3: IMPLEMENT
### Sub-Agent: `ExecutionLead` (model: haiku)
- **Tools**: All
- **Prompt**: Invoke e2e-orchestrator with master checklist. Track progress through 4 phases. Handle live feedback interrupts.
- **Output**: `{ phases_complete, items_done, items_remaining }`
- **Gate**: all phases complete

## Phase 4: VERIFY
### Sub-Agent: `QualityGate` (model: haiku)
- **Prompt**: Run tiered verification (quick/standard/full based on change size). Confirm all agents pass. Score final confidence.
- **Output**: `{ verification_tier, all_pass: boolean, confidence, blockers[] }`
- **Gate**: all agents PASS

## Phase 5: DELIVER
### Sub-Agent: `HandoffBroker` (model: haiku)
- **Prompt**: HANDOFF 1: PR + localhost ready. Output real links only. Tell user server status and laptop-safe resume path. HANDOFF 2: merge ONLY after user says "merge now".
- **Output**: `{ pr_url, localhost_url, merge_status: "awaiting_approval", server_status, resume_instructions }`
- **Gate**: PR real, user notified, merge awaiting approval

## Contingency
IF any stage fails → contingency skill handles escalation automatically. IF credit budget hit → save state at current stage → output "Paused at stage N. Resume: /idea-to-production resume".

## Server Lifecycle
Before HANDOFF 1: verify server is UP and localhost works. Tell user: "Server running at localhost:3000. Leave terminal open. Laptop can sleep — code is committed."

---

# Idea → Execute → Production Skill

**Purpose**: Run the full business from idea to production. Codifies flow, handoff points, cost optimization, and quality gates.

**Reference**: [Claude Code Skills](https://code.claude.com/docs/en/skills), [Manage costs](https://code.claude.com/docs/en/costs.md), [Common workflows](https://code.claude.com/docs/en/common-workflows), [Subagents](https://code.claude.com/docs/en/sub-agents)

---

## Flow Overview

```
IDEA (user gives) → PLAN → EXECUTE (4 phases) → HANDOFF 1 (merge) → HANDOFF 2 (deploy)
         ↑                        ↑                     ↑                      ↑
    You provide              Auto (feature/*)       You approve             You approve
```

---

## Stage 1: Idea (Input)

**You provide**:
- Feature idea, bug fix, or task description
- Scope: what's in, what's out (optional)

**Claude does**:
- Invokes `plan-and-execute`: create checklist, break into sub-tasks
- Skips completed work if rerun (saves credits)
- Uses 1 lead + 4 subagents (Explore, Plan, Reviewer, QA) – [cost optimization](https://code.claude.com/docs/en/costs#delegate-verbose-operations-to-subagents)

---

## Stage 2: Execute (Auto on feature/*)

**Claude does** (auto-accept starting now on feature branch):
- Phase 1: Discovery (5–10 subagents)
- Phase 2: Implementation (5–10 subagents)
- Phase 3: **Review & Critique – 5-agent verification** (required before accept):
  1. CodeReviewer – DRY, style, guardrails
  2. APIValidator – API contract, error format
  3. EvidenceReviewer – Proof, citations, no invented claims
  4. QAReviewer – Tests pass, coverage, critical flows
  5. Critic – Quality gate, confidence >= 0.70
- Phase 4: Run & Verify (5–10 subagents)

**Accept** only when all 5 agents pass. Use `five-agent-verification` skill.

**Cost optimization** ([Claude Code costs](https://code.claude.com/docs/en/costs)):
- Grep first, targeted reads
- Haiku for Explore, QA; Sonnet for Plan, Review
- Delegate verbose ops (tests, logs) to subagents
- Update skills in same turn (skills-self-update) – no respawn
- Keep spawn prompts focused

**Quality gates**:
- `npm test` passes locally
- `npm run test:ci` passes
- Only project-relevant files committed
- CHANGELOG, README updated
- `skills-self-update` after any fix

**Output**: Localhost URL + PR link (only if real and working)

---

## Live Phase (Optional — After Execute)

When `run-the-business` is invoked, start live monitoring:

1. **Start** `live-watchdog` — Poll CI, deploy, health (interval: 5 min default)
2. **On error** → `error-detector` → `fix-pr-creator` → `self-fix` loop until green
3. **Rebase** — After base PR merged, `rebase-manager` for dependents
4. **Continue** until user stops or all green

**Invoke**: `run-the-business` skill for full E2E with live monitoring.

---

## HANDOFF 1: Merge to Main

**You approve** before this step. Claude will NOT merge without "merge now" or equivalent.

| Action | Who | When |
|--------|-----|------|
| Review PR | You | After Claude provides PR link |
| Approve / request changes | You | Manual |
| Say "merge now" | You | When ready |
| Merge + delete branch | Claude | Only after your approval |

**Claude does** (after approval):
- `git checkout main`
- `git merge feature/<branch>`
- `git push origin main`
- `git branch -d feature/<branch>`
- Use `conflict-resolution` if main moved ahead

---

## HANDOFF 2: Deploy to Production

**You approve** before this step. Claude will NOT deploy without explicit instruction.

| Action | Who | When |
|--------|-----|------|
| Merge to main | Claude (after you approve) | Handoff 1 |
| Trigger deploy / run release | You or Claude | Per repo convention |
| Deploy to production | You or CI | After merge |

**Claude does** (only if you explicitly ask):
- Run deploy script (e.g. `npm run deploy`) – **only with your approval**
- Report deploy status

**Blocked by default**: `deploy`, `npm publish`, production pushes – always ask. See [permissions](https://code.claude.com/docs/en/permissions).

---

## Cost Optimization (Least Credits)

Per [Claude Code costs](https://code.claude.com/docs/en/costs#reduce-token-usage):

1. **Grep before read** – Targeted reads only
2. **Skip completed work** – Reruns check checklist, skip DONE
3. **Model choice** – Haiku for simple; Sonnet for plan/review
4. **Subagent delegation** – Verbose output (tests, logs) stays in subagent
5. **Skills on-demand** – Instructions in skills, not all in CLAUDE.md
6. **Compact between tasks** – `/clear` or `/compact` when switching
7. **Specific prompts** – "Add validation to login" beats "improve codebase"
8. **Update in same turn** – skills-self-update without respawn

---

## Quality (Utmost)

1. **Evidence first** – Never claim without test proof
2. **Run tests** – `npm test`, `npm run test:ci` before handoff
3. **skills-self-update** – Learn from fixes, update SKILL.md
4. **feedback-log** – Incorporate common feedback
5. **stakeholder-feedback** – CEO, EM, frustrated user iteration (optional)
6. **Frontend–backend alignment** – UI only exposes implemented capability

---

## Invocation

```
/idea-to-production [idea or task description]
```

Or: "I have an idea: [X]. Run it to production." → Claude invokes this skill.

---

## Related Skills

- `five-agent-verification` – 5 agents verify code before accept (Phase 3)
- `plan-and-execute` – Break work, skip-if-done
- `e2e-orchestrator` – 4 phases, subagents
- `pr-push-merge` – Commit, push, CI, PR
- `conflict-resolution` – Stash, pull main, resolve
- `skills-self-update` – Learn from fixes
- `branch-permissions` – Auto-accept on feature/*
- `push-hard` – No permission asks
