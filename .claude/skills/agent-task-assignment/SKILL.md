---
name: agent-task-assignment
description: Assign every agent and sub-agent to skill-sets. All tasks run in parallel when independent. Nothing left unassigned or hanging.
---

# Agent Task Assignment (HARD)

**Purpose**: Every task has an assigned agent. Agents run in parallel when tasks are independent. No work left hanging. Skill-sets drive who does what.

---

## Rule (HARD)

- **Assign everything** — Every skill phase, every checklist item, every ten-pass → has an assigned agent/sub-agent. Nothing unassigned.
- **Parallel by default** — When tasks are independent, spawn agents in parallel. Do NOT sequence when parallel is possible.
- **Do not leave hanging** — Every task gets an owner. If a phase has 5 sub-tasks → spawn 5 agents. No "we'll do it later."

---

## Skill → Agent Assignment (Spawn Table)

### ten-pass-verification (Run ALL in parallel)

| Pass | Agent/Sub-Agent | Spawn |
|------|-----------------|-------|
| 1 | CodeReviewer | Spawn with five-agent batch |
| 2 | APIValidator | Spawn with five-agent batch |
| 3 | EvidenceReviewer | (Use EvidenceReviewer role or Retriever+evidence-proof) |
| 4 | QAReviewer | qa-engineer |
| 5 | Critic | CodeReviewer (critic skill) |
| 6 | REVIEW Always | General-Purpose + REVIEW.md |
| 7 | REVIEW Style | General-Purpose + REVIEW.md |
| 8 | npm test | Bash (no spawn) |
| 9 | Lint | Bash (no spawn) |
| 10 | REVIEW Project | General-Purpose + REVIEW.md |

**Parallel groups**: (1,2,3,4,5) together | (6,7,10) together | (8,9) together

### five-agent-verification (Spawn ALL 5 in parallel)

| Agent | From settings.json | Spawn when |
|-------|--------------------|------------|
| CodeReviewer | optional | ten-pass pass 1 |
| APIValidator | optional | ten-pass pass 2 |
| EvidenceReviewer | Retriever + evidence-proof | ten-pass pass 3 |
| QAReviewer | qa-engineer | ten-pass pass 4 |
| Critic | CodeReviewer (critic) | ten-pass pass 5 |

**Rule**: Spawn all 5 in same turn. Do NOT run one after another.

### pr-push-merge (Sub-agents already defined)

| Phase | Sub-Agent | Runs |
|-------|-----------|------|
| 1 | CommitScout | DISCOVER |
| 2 | PRPlanner | PLAN |
| 3 | CommitExecutor | IMPLEMENT |
| 4 | CIWatcher | VERIFY |
| 5 | PRPublisher | DELIVER |

### e2e-orchestrator (Phase 3 = ten-pass, spawn parallel)

| Phase | Agents to spawn | Parallel? |
|-------|-----------------|------------|
| 1 | BusinessScout (Explore) | — |
| 2 | PhaseArchitect (Plan) | — |
| 3 | **CodeReviewer + APIValidator + qa-engineer + frontend-engineer + backend-engineer** (all 5+ in parallel) | YES |
| 4 | FlowVerifier | — |
| 5 | HandoffPackager | — |

### plan-and-execute (Spawn when independent)

| Phase | Sub-Agent | Parallel spawn when |
|-------|-----------|---------------------|
| 1 | ScopeScout | — |
| 2 | ChecklistBuilder | — |
| 3 | TaskExecutor | **Multiple TaskExecutors when checklist has 2+ independent items** (no file overlap) |
| 4 | ProofCollector | — |
| 5 | PRPackager | — |

**Rule**: If checklist items 2, 3, 4 touch different files → spawn 3 TaskExecutors in parallel. Do NOT run one-by-one when parallel is possible.

### run-the-business (Full parallel stack)

When user gives project instruction:
- **Plan** spawns → Explore + ScopeScout (parallel)
- **Implement** spawns → frontend-engineer + backend-engineer + qa-engineer (parallel if FE+BE+test files don't overlap)
- **Verify** spawns → CodeReviewer + APIValidator + QAReviewer + Critic (parallel)
- **Deliver** spawns → PRPackager + LiveWatchdog (parallel after merge)

---

## Optional Agents: When to Spawn (Updated)

| Agent | Phase | Spawn when | With |
|-------|-------|------------|------|
| CodeReviewer | 3 | ten-pass / five-agent | APIValidator, QAReviewer, Critic (parallel) |
| APIValidator | 2 or 3 | API touchpoints / ten-pass | CodeReviewer, others (parallel) |
| frontend-engineer | 2 | UI changes in scope | backend-engineer, qa-engineer (parallel) |
| backend-engineer | 2 | API/backend changes | frontend-engineer, qa-engineer (parallel) |
| qa-engineer | 3 | ten-pass / test gaps | CodeReviewer, APIValidator (parallel) |
| LiveWatchdog | 5 | After execute, run-the-business | Polls CI/health |
| FixAgent | — | fix-pr-creator spawns | On CI red |
| RebaseResolver | — | multi-pr-coordinator | After base PR merge |
| ChaosTester | 3 | Pre-release fuzz | Phase 3 verification |

**Old rule (REMOVE)**: "Spawn only with 3+ independent tasks"
**New rule**: Spawn when phase runs. If phase has 2+ independent tasks → spawn 2+ agents in parallel.

---

## DAG Integration

- **dag-executor**: Use for plan-and-execute checklist when items have dependencies.
- **Parallel level**: Items with same dependency level → run in parallel.
- **Example**: Items 1,2,3 depend on nothing → spawn 3 agents. Item 4 depends on 1,2,3 → wait for those, then run 4.

---

## Integration

- **settings.json**: "Spawn optional agents when their phase runs. Run in parallel. No minimum task count."
- **e2e-orchestrator**: Phase 3 spawns CodeReviewer, APIValidator, qa-engineer, frontend-engineer, backend-engineer in parallel.
- **plan-and-execute**: Phase 3 spawns multiple TaskExecutors when checklist items are independent.
- **ten-pass-verification**: Passes 1–5 run in parallel; 6+7+10 run in parallel; 8+9 run together.
