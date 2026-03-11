---
name: five-agent-verification
description: Code review verified by 5 different agents before accept. All must pass. Use before merge or when accepting changes. Auto-accept starting now on feature branches.
---

## Phase 1: DISCOVER
### Sub-Agent: `ChangeSizer` (model: haiku)
- **Tools**: Bash, Grep
- **Prompt**: Count files changed (`git diff --name-only`), lines changed (`git diff --stat`), concerns touched (FE if src/www/, BE if src/server.js or src/routes/, test if tests/). Output counts.
- **Output**: `{ files_count, lines_count, concerns: ["FE","BE","test"] }`
- **Gate**: counts determined

## Phase 2: PLAN
### Sub-Agent: `TierDecider` (model: sonnet)
- **Prompt**: Pick verification tier based on change size. Quick (<3 files, <50 lines) = 1 agent. Standard (3-10 files) = 3 agents. Full (10+ files) = 5 agents. Output which agents to spawn with exact prompts.
- **Output**: `{ tier: "quick"|"standard"|"full", agents_to_spawn[], prompts[] }`
- **Gate**: tier selected

## Phase 3: IMPLEMENT
### Sub-Agent: `ReviewRunner` (model: haiku)
- **Prompt**: Spawn N agents in parallel per tier. Collect PASS/BLOCK from each. Quick: CodeReviewer only. Standard: CodeReviewer + QAReviewer + Critic. Full: all 5.
- **Output**: `{ results[{agent, pass: boolean, issues[]}] }`
- **Gate**: all spawned agents responded

## Phase 4: VERIFY
### Sub-Agent: `BlockResolver` (model: haiku)
- **Prompt**: IF any agent reported BLOCK → fix the specific issue → re-run ONLY that agent (not all). Max 2 re-runs per blocking agent.
- **Output**: `{ resolved[], still_blocked[], re_runs_used }`
- **Gate**: 0 still_blocked

## Phase 5: DELIVER
### Sub-Agent: `AcceptGate` (model: haiku)
- **Prompt**: Aggregate results. All PASS → ACCEPT. Any remaining BLOCK → REJECT with list. Update docs. Notify user.
- **Output**: `{ accepted: boolean, evidence[], blocking_issues[] }`
- **Gate**: decision made

---

## Contingency

IF all 5 agents BLOCK on different issues:
  → Invoke contingency L2 (simplify: address top 2 blocking issues only)
  → Re-run only resolved agents

IF rate limited during agent spawning:
  → Downgrade tier: Full → Standard → Quick
  → If Quick also fails → contingency L5 (pause)

---

# Five-Agent Verification Skill

**Purpose**: Every change is code-reviewed and verified by 5 distinct agents before acceptance. Auto-accept starting now on feature/* branches.

**When to use**: Before merge, after implementation, or when accepting changes. Run in Phase 3 (Review & Critique).

---

## The 5 Verification Agents

Run in parallel. All 5 must report PASS (or no blocking issues) for work to be accepted.

| # | Agent | Role | Verifies | Output |
|---|-------|------|----------|--------|
| 1 | **CodeReviewer** | Code quality, DRY, maintainability | No duplicate logic, clean style, guardrails | PASS / BLOCK + issues[] |
| 2 | **APIValidator** | API contract, endpoints | Request/response alignment, error formats | PASS / BLOCK + mismatches[] |
| 3 | **EvidenceReviewer** | Proof, citations, no invented claims | file:line valid, no hallucinated APIs/fields | PASS / BLOCK + unsupported[] |
| 4 | **QAReviewer** | Tests, coverage, critical flows | npm test pass, coverage, happy/error/retry paths | PASS / BLOCK + gaps[] |
| 5 | **Critic** | Quality gate, output contract | confidence >= 0.70, all 6 fields present | APPROVED / REJECTED |

---

## Verification Flow

```
Implementation done
       ↓
Spawn 5 agents in parallel
       ↓
Agent 1: CodeReviewer  ─┐
Agent 2: APIValidator   │
Agent 3: EvidenceReviewer├─→ Aggregate results
Agent 4: QAReviewer     │
Agent 5: Critic        ─┘
       ↓
All 5 PASS? → ACCEPT (proceed to push/merge)
Any BLOCK?  → Fix issues → Re-run 5 agents
```

---

## Agent Prompts (Copy to Spawn)

### Agent 1: CodeReviewer
```
Review changed files. Check: DRY, style, guardrails, no console.log, no commented-out code.
Output: { pass: boolean, issues: [{ file, line, issue }] }
PASS only if no blocking issues.
```

### Agent 2: APIValidator
```
Verify API contracts. Check: request/response alignment, error format, retry/timeout.
Output: { pass: boolean, mismatches: [] }
PASS only if no contract violations.
```

### Agent 3: EvidenceReviewer
```
Verify evidence. Check: all file:line citations exist, no invented APIs/fields.
Output: { pass: boolean, unsupported: [] }
PASS only if no hallucinated claims.
```

### Agent 4: QAReviewer
```
Verify tests. Run npm test. Check: coverage, happy/error/retry paths covered.
Output: { pass: boolean, gaps: [], coverage: N }
PASS only if tests pass and critical flows covered.
```

### Agent 5: Critic
```
Quality gate. Check: confidence >= 0.70, root cause + evidence + fix plan + rollback + tests present.
Output: { approved: boolean, blocking: [] }
APPROVED only if all fields present and confidence sufficient.
```

---

## Acceptance Rule

**ACCEPT** only when all 5 report PASS/APPROVED.
**BLOCK** if any agent reports blocking issues. Fix, then re-run.

---

## Auto-Accept (Starting Now)

On feature/* branch:
- Edits, Bash, git add/commit/push: **auto-accept** (no permission prompts)
- Code review (5 agents) runs as part of Phase 3
- After 5-agent verification passes → auto-accept proceeds to push
- Merge to main: still requires you to say "merge now"

---

## Integration

- Invoked during Phase 3 of `e2e-orchestrator`
- Required before `pr-push-merge` hands off PR link
- Spawn agents in parallel to minimize latency
