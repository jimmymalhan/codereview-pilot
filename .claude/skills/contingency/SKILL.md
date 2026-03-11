---
name: contingency
description: Escalation ladder (L1-L5) when skills fail. Retry → Simplify → Isolate → Decompose → Pause. Handles rate limits, credit exhaustion, and unresolvable errors.
---

# Contingency Skill

**Purpose**: Automatic escalation when any skill fails after max retries. Prevents infinite loops, credit burn, and silent failures.

**When to use**: Automatically invoked when any phase fails 2x on the same item. Also invoked for rate limits, credit warnings, and unresolvable errors.

---

## Phase 1: DISCOVER
### Sub-Agent: `FailureClassifier` (model: haiku)
- **Tools**: Read, Grep, Bash
- **Prompt**: Classify the failure. Read error output. Determine type: test_failure, build_error, lint_error, timeout, rate_limit, scope_error, unknown. Count previous attempts on this item.
- **Output**: `{ failure_type, error_message, file, line, attempt_count, previous_fixes[] }`
- **Gate**: failure classified

## Phase 2: PLAN
### Sub-Agent: `EscalationPlanner` (model: haiku)
- **Tools**: Read
- **Prompt**: Pick escalation level based on failure_type and attempt_count. Use the Escalation Ladder below. Output the exact action to take.
- **Output**: `{ level, action, description, max_retries_at_level }`
- **Gate**: level selected AND action defined

## Phase 3: IMPLEMENT
### Sub-Agent: `RecoveryExecutor` (model: haiku)
- **Tools**: Read, Write, Edit, Bash
- **Prompt**: Execute the recovery action for the selected level. L1: fix inline. L2: reduce scope. L3: worktree. L4: split task. L5: save state only.
- **Output**: `{ action_taken, files_changed[], test_result, recovered: boolean }`
- **Gate**: action completed

## Phase 4: VERIFY
### Sub-Agent: `RecoveryVerifier` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Did the recovery work? Run `npm test`. Check if original failure is resolved. IF not → escalate to next level.
- **Output**: `{ recovered: boolean, test_pass: boolean, escalate_to: null|next_level }`
- **Gate**: recovery verified OR escalation decided

## Phase 5: DELIVER
### Sub-Agent: `StatePreserver` (model: haiku)
- **Tools**: Read, Write, Edit
- **Prompt**: Save current state to `.claude/local/state/`. Update checklist with failure status. Notify user with: what failed, what was tried, what's needed next, resume command.
- **Output**: `{ state_saved, state_file, resume_command, user_message }`
- **Gate**: state saved AND user notified

---

## Escalation Ladder

```
Level 1: RETRY INLINE (0 extra credits)
  |  fails
  v
Level 2: SIMPLIFY (0 extra agents)
  |  fails
  v
Level 3: ISOLATE (1 agent, worktree)
  |  fails
  v
Level 4: DECOMPOSE (1 agent, replan)
  |  fails
  v
Level 5: PAUSE & ASK USER (0 credits)
```

| Level | Trigger | Action | Extra Credits | Sub-Agent |
|-------|---------|--------|---------------|-----------|
| **L1: Retry** | 1st failure on an item | Fix the ONE failing test/file. Rerun `npm test`. | 0 | Lead inline |
| **L2: Simplify** | Failed 2x same item | Reduce scope: skip optional parts, do minimum viable. Mark skipped as [DEFERRED]. | 0 | Lead reassesses |
| **L3: Isolate** | Same error persists after L2 | Create git worktree. Try fix in isolation. If works → cherry-pick back. | 1 spawn | `IsolationWorker` (haiku) |
| **L4: Decompose** | 3 failures OR error outside skill scope | Break failing item into 3 smaller sub-tasks. Re-enter Phase 2 (PLAN) for each. | 1 spawn | `ProblemSplitter` (sonnet) |
| **L5: Pause** | L4 fails OR rate-limited OR credit exhausted | STOP all work. Save full state. Output resume instructions. Wait for user. | 0 | None |

---

## Rate-Limit Specific Escalation

| Situation | Escalation |
|-----------|------------|
| API returns 429 (rate limit) | Skip to L5 immediately. Save state. Output: "Rate limited. State saved. Resume: `/plan-and-execute resume`" |
| API returns 503 (overloaded) | L1: retry 2x with backoff (2s, 4s). If still failing → L5. |
| Credit budget approaching limit | Finish current item ONLY. Then L5. Output remaining items count. |
| Context window full | `/compact`. Reload CLAUDE.md + current item. Continue. If still full → L5. |
| Model downgrade needed | Sonnet → Haiku. Haiku → inline. All failing → L5. |

---

## State Preservation Format

Save to `.claude/local/state/<skill-name>-state.json`:
```json
{
  "skill": "plan-and-execute",
  "phase": 3,
  "checklist_item": 4,
  "total_items": 12,
  "items_done": [1, 2, 3],
  "items_remaining": [4, 5, 6, 7, 8, 9, 10, 11, 12],
  "last_success": "item-3",
  "failure_type": "test_failure",
  "failure_message": "npm test: 2 failed in src/server.test.js",
  "escalation_level": 2,
  "attempts_at_level": 1,
  "resume_command": "/plan-and-execute resume",
  "timestamp": "2026-03-11T14:30:00Z"
}
```

---

## Integration with Other Skills

Every skill adds this at the bottom of Phase 3 (IMPLEMENT):
```
IF Phase 3 fails 2x on same item:
  → Invoke contingency at Level 1
  → Contingency handles escalation automatically
  → DO NOT retry manually after invoking contingency
```

---

## Failure Table

| Failure | Action | Max Retries |
|---------|--------|-------------|
| Test failure (specific file) | L1: fix that file only | 2 |
| Test failure (cascading) | L2: simplify scope | 1 |
| Build error | L1: fix syntax | 2 |
| Lint error | L1: fix inline | 1 |
| Rate limit | L5: immediate pause | 0 |
| Credit exhausted | L5: immediate pause | 0 |
| Unknown error | L4: decompose | 1 |
| Subagent returns empty | Log [UNKNOWN], continue without that input | 0 |
| Git conflict | Invoke `conflict-resolution` skill | 1 |
| Checklist corrupted | Regenerate from template | 1 |

---

## Cheap-Model Guardrails

- Never retry more than 2x at any single level
- Never spawn more than 1 additional agent for recovery
- Always save state BEFORE escalating (checklist file must be updated)
- At L5: output MUST include exact resume command
- Never loop: if L5 reached, STOP. Do not restart from L1.
- Total max escalation path: L1 → L2 → L3 → L4 → L5. Max 8 attempts across all levels.
