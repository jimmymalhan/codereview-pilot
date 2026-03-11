---
name: cost-guardrails
description: Model-tier rules, spawn thresholds, rate-limit handling, credit budget protection. Preloaded into all agents to minimize API credits.
---

# Cost Guardrails Skill

**Purpose**: Minimize API credits and prevent rate-limit failures across all agents and models.

**When to use**: Always. This skill is preloaded into every agent.

**When making changes**: Lower tokens. Use Read(offset,limit). Use Grep instead of full-file Read. Keep skills compact (<500 lines). filter-test-output reduces npm test tokens. Prefer Haiku.

---

## Phase 1: DISCOVER
### Sub-Agent: `UsageScout` (model: haiku)
- **Tools**: Read, Grep
- **Prompt**: Check current session state. Count: agents spawned, tool calls made, files read. Read `.claude/local/state/` for saved state.
- **Output**: `{ agents_spawned, tool_calls, files_read, saved_state_exists }`
- **Gate**: usage counted

## Phase 2: PLAN
### Sub-Agent: `CostPlanner` (model: haiku)
- **Tools**: Read
- **Prompt**: Based on task size, pick model tier and spawn threshold. Apply rules from Model-Tier Table and Spawn Rules below.
- **Output**: `{ model_tier, max_spawns, max_tool_calls_per_phase, inline_threshold }`
- **Gate**: tier selected

## Phase 3: IMPLEMENT
### Sub-Agent: `CostEnforcer` (model: haiku)
- **Tools**: Read, Grep
- **Prompt**: Enforce cost rules during execution. Track tool calls per phase. Warn at 80% of limit. Block at 100%.
- **Output**: `{ tool_calls_used, budget_remaining, warnings[] }`
- **Gate**: within budget

## Phase 4: VERIFY
### Sub-Agent: `CostVerifier` (model: haiku)
- **Tools**: Read
- **Prompt**: Compare actual usage vs planned. Flag overages. Log to `.claude/local/cost-log.md`.
- **Output**: `{ planned_calls, actual_calls, overage, savings[] }`
- **Gate**: usage logged

## Phase 5: DELIVER
### Sub-Agent: `CostReporter` (model: haiku)
- **Tools**: Read, Edit
- **Prompt**: Output cost summary to user. Suggest optimizations for next run.
- **Output**: `{ summary, suggestions[], credits_saved }`
- **Gate**: user informed

---

## Model-Tier Table

| Tier | Model | When to Use | Credit Impact |
|------|-------|-------------|---------------|
| **Budget** | Haiku | Explore, QA, APIValidator, FixAgent, most implementation | Lowest |
| **Standard** | Sonnet | Plan, CodeReviewer, Critic (final gate), complex reasoning | Medium |
| **Premium** | Opus | Only if user explicitly requests; never default | Highest |

**Rule**: Default to Haiku for 80%+ of subagent work. Reserve Sonnet for Plan + final review. Never auto-select Opus.

---

## Spawn Rules (Concrete Thresholds)

| Files Changed | Lines Changed | Spawn Rule |
|---------------|---------------|------------|
| 1-2 files | < 50 lines | Inline (lead does it, 0 spawns) |
| 3-5 files | 50-200 lines | Max 2 sub-agents |
| 6-10 files | 200-500 lines | Max 4 sub-agents |
| 10+ files | 500+ lines | Max 4 sub-agents + 1 reviewer |
| Any size | Any | Never spawn for: reading, searching, single-file edits |

---

## Tool Call Limits Per Phase

| Phase | Max Tool Calls (Haiku) | Max Tool Calls (Sonnet) |
|-------|----------------------|------------------------|
| Phase 1: DISCOVER | 10 | 15 |
| Phase 2: PLAN | 5 | 10 |
| Phase 3: IMPLEMENT | 15 per item | 20 per item |
| Phase 4: VERIFY | 10 | 10 |
| Phase 5: DELIVER | 8 | 8 |

---

## Rate-Limit Protection

| Situation | Action |
|-----------|--------|
| API returns 429 | Save state → notify user → STOP. Do NOT retry in loop |
| API returns 503 | Retry 2x with 2s/4s backoff → if still failing → downgrade model |
| Credit budget warning | Finish current item ONLY → save state → STOP |
| Context too large | `/compact` → reload CLAUDE.md + current checklist item → continue |

### Model Downgrade Path
```
Sonnet rate-limited → use Haiku for that phase
Haiku rate-limited → inline (lead does it, no spawn)
All rate-limited → STOP, save state, ask user
```

---

## Cost Optimization Rules (Non-Negotiable)

1. **Grep before Read** — search first, targeted reads only
2. **Skip completed work** — check checklist status FIRST
3. **No redundant reads** — do not reread files unless changed
4. **Batch discovery** — one Explore per phase, not per file
5. **skills-self-update in same turn** — never respawn for lesson update
6. **Compact between tasks** — `/clear` or `/compact` when switching
7. **Specific prompts** — "Add validation to login" beats "improve codebase"
8. **Delegate verbose ops** — test output, logs stay in subagent context

---

## Tiered Verification (Save Credits on Small Changes)

| Change Size | Verification Tier | Agents | Credits |
|-------------|------------------|--------|---------|
| < 3 files, < 50 lines | Quick | 1 (CodeReviewer only) | Lowest |
| 3-10 files | Standard | 3 (CodeReviewer + QA + Critic) | Medium |
| 10+ files | Full | 5 (all 5 verification agents) | Highest |

**After fix, re-run ONLY the agent(s) that blocked** — not all 5.

---

## Failure Table

| Failure | Action | Max Retries |
|---------|--------|-------------|
| Over tool call limit | Warn, finish current step, then stop phase | 0 |
| Rate limited (429) | Save state, notify user, STOP | 0 |
| Model unavailable (503) | Downgrade model, retry | 2 |
| Credit exhausted | Save state, output resume command, STOP | 0 |

---

## Cheap-Model Guardrails

- Never skip these rules — they apply to ALL models, ALL phases
- Haiku agents: max 10 tool calls per phase (enforced, not suggested)
- Never invent tool call results — if over limit, output what you have
- Save state before any STOP — user must be able to resume
- Output resume command: `/plan-and-execute resume`
