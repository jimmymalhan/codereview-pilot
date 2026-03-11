---
name: plan-and-execute
description: Break work into checklist, skip completed, run 4-5 phases with subagents. Use when starting any task, "add X", "fix Y", reruns, or multi-agent workflows. Invoked by run-the-business when user gives project instructions.
argument-hint: [task description]
---

## Execution Standard (Apply to Every Skill)

- **Phases**: Create sub-agents in **four to five different phases** in every skill (e.g. DISCOVER → PLAN → IMPLEMENT → VERIFY → DELIVER).
- **Auto-execute**: Do NOT wait for user to accept changes. Run through phases automatically. Pausing for approval does not guarantee execution will proceed.

# Plan and Execute Skill

**Purpose**: Break work into tasks with a checklist, run phased sub-agents, skip completed work, handle failures with contingency, respond to live user feedback, and manage server lifecycle on a laptop.

**When to use**: Starting any task, resuming after pause, reruns, or multi-agent workflows. **Invoked by `run-the-business`** when user gives project instructions — we run the whole business automatically.

**4 phases, 5–10 subagents per phase** — Be very descriptive. See docs/SKILLSETS.md for full subagent prompts.

**Supporting files** (Agent Skills spec: load when needed):
- Checklist: `.claude/local/checklists/<task>.md`
- State: `.claude/local/state/plan-and-execute-state.json`
Keep SKILL.md under 500 lines; move detailed templates to references/ if needed.

---

## Phase 1: DISCOVER
### Sub-Agent: `ScopeScout` (model: haiku)
- **Tools**: Glob, Grep, Read
- **Prompt**: Find all files related to the task. Search using keywords from the task description. Check if work is already done: read `CHANGELOG.md` last 20 lines, read `.claude/local/checklists/` for existing checklists, run `git log --oneline -5`. List risks and unknowns.
- **Output**:
```json
{
  "files_related": ["src/file.js"],
  "already_done": [],
  "risks": ["[RISK] description"],
  "unknowns": ["[UNKNOWN] description"],
  "scope_size": "small|medium|large",
  "checklist_exists": false
}
```
- **Gate to Phase 2**: scope_size identified AND files listed
- **IF checklist_exists AND all items DONE**: output "No work needed" → STOP
- **IF checklist_exists AND some TODO**: skip to Phase 3 (resume from first TODO)

### Decision Rules (Concrete)
- IF task mentions 1-2 files → scope = small
- IF task mentions 3-5 files OR "add feature" → scope = medium
- IF task mentions 6+ files OR "refactor" OR "overhaul" → scope = large
- Max 10 Glob/Grep calls in this phase
- Output = file list only, no analysis prose

---

## Phase 2: PLAN
### Sub-Agent: `ChecklistBuilder` (model: sonnet)
- **Tools**: Read, Glob, Grep
- **Prompt**: Create a checklist from Phase 1 scope. Use the EXACT template below. Each item must have: id, task name, files to change, files forbidden, verification step, skip condition. Set all items to TODO.
- **Output**: Checklist file written to `.claude/local/checklists/<task-name>.md`
- **Gate to Phase 3**: checklist has >= 1 TODO item. Do NOT wait for user approval — proceed automatically (per Execution Standard).

### Checklist Template (EXACT — do not modify structure)
```markdown
## Checklist: <Task Name>
Created: <timestamp>
Status: IN_PROGRESS

| ID | Task | Files to Change | Forbidden Files | Status | Verify | Skip If |
|----|------|----------------|-----------------|--------|--------|---------|
| 1 | <description> | src/file.js | package.json | TODO | npm test passes | file already has this change |
| 2 | <description> | src/other.js | .env | TODO | curl returns 200 | endpoint already exists |
```

### Spawn Decision (Concrete Thresholds)
- scope = small (1-2 files): NO spawn. Lead does all work inline.
- scope = medium (3-5 files): Spawn max 2 sub-agents in Phase 3.
- scope = large (6+ files): Spawn max 4 sub-agents in Phase 3.
- NEVER spawn for: reading files, searching, single-file edits.

---

## Phase 3: IMPLEMENT
### Sub-Agent: `TaskExecutor` (model: haiku)
- **Tools**: Read, Write, Edit, Bash
- **Prompt**: Execute ONE checklist item at a time. Read the item. Edit ONLY the files listed in "Files to Change". Do NOT touch files in "Forbidden Files". After each edit, run `npm test`. Mark item DONE if tests pass. Mark BLOCKED if tests fail after 2 attempts.
- **Output**:
```json
{
  "item_id": 1,
  "files_changed": ["src/file.js"],
  "lines_changed": 15,
  "test_pass": true,
  "status": "DONE"
}
```
- **Gate to Phase 4**: ALL checklist items are DONE or SKIP, AND `npm test` passes
- **IF test fails**: fix ONLY the failing file (max 2 attempts), then invoke `contingency` if still failing

### Scope Fence (Non-Negotiable)
- ONLY touch files listed in checklist item "Files to Change"
- NEVER edit files in "Forbidden Files"
- IF you discover something else broken → add NEW checklist item with status TODO → do NOT fix it now
- No refactoring adjacent code. No adding features not in checklist. No "improvements."

### Server Check (Before Implementation)
```
IF task involves backend files (src/server.js, src/routes/, src/pipeline/):
  → Check server: curl -s http://localhost:3000/health || echo "DOWN"
  → IF DOWN and needed → invoke server-lifecycle to start
  → After each backend file edit → plan server restart in Phase 4
```

---

## Phase 4: VERIFY
### Sub-Agent: `ProofCollector` (model: haiku)
- **Tools**: Bash, Read, Grep
- **Prompt**: Run full test suite. Capture actual output. Update CONFIDENCE_SCORE. List unknowns. IF backend files changed → restart server and verify health. Check server lifecycle.
- **Output**:
```json
{
  "test_count": 319,
  "pass_count": 319,
  "fail_count": 0,
  "coverage_pct": 89.87,
  "confidence": 87,
  "unknowns": ["[UNKNOWN] production behavior"],
  "server_restarted": true,
  "health_ok": true
}
```
- **Gate to Phase 5**: confidence >= 70 AND fail_count == 0 AND (server healthy OR server not needed)
- **IF confidence < 70**: list what's missing, do NOT proceed
- **IF fail_count > 0**: invoke `contingency` at Level 1

### Evidence Rules
- test_count and coverage MUST come from actual `npm test` output
- Never "should pass" — run it and report numbers
- Never invent coverage numbers
- If `npm test` can't run → mark [UNKNOWN] and lower confidence

---

## Phase 5: DELIVER
### Sub-Agent: `PRPackager` (model: haiku)
- **Tools**: Bash, Read, Edit
- **Prompt**: Update CHANGELOG.md with what changed. Update docs/CONFIDENCE_SCORE.md with evidence. Commit relevant files only (no plans, reports, checklists). Push to feature branch. Open PR if requested. Output server status and resume instructions.
- **Output**:
```json
{
  "commit_sha": "abc123",
  "files_committed": ["src/file.js", "CHANGELOG.md"],
  "pr_url": "https://github.com/...",
  "localhost_ok": true,
  "server_status": "UP at http://localhost:3000",
  "resume_instructions": "No remaining items."
}
```
- **Gate to DONE**: commit exists AND (PR real OR not requested) AND user notified of server status

### Laptop-Aware Notifications (Use Exact Template)

**Work Complete, Server UP:**
```
All changes applied and committed. Server running at http://localhost:3000.
Leave this terminal open to keep the server up.
Your laptop can sleep — code is committed and safe.
```

**Work Complete, Server Not Needed:**
```
All changes committed. Server not running (not needed).
To start: npm start → http://localhost:3000
```

**Work In Progress, Pausing:**
```
Progress: N/M items done. State saved.
Remaining: [list items].
To resume: say 'resume' in next session.
```

---

## Rerun Behavior (Skip-If-Done)

When invoked on a task that may already be partially done:

1. **Load checklist**: read `.claude/local/checklists/<task>.md`
2. **For each DONE item**: check if file is unchanged since marked DONE
   - IF file unchanged → SKIP (valid)
   - IF file changed after DONE → mark STALE → change to TODO
3. **For each SKIP item**: re-check skip condition
   - IF condition still true → keep SKIP
   - IF condition no longer true → change to TODO
4. **For each BLOCKED item**: check if blocker resolved
   - IF resolved → change to TODO
   - IF still blocked → keep BLOCKED, note in unknowns
5. **Resume from first TODO item** → Phase 3

---

## Contingency Integration

### Automatic Escalation
```
IF Phase 3 (IMPLEMENT) fails 2x on same item:
  → Invoke contingency skill at Level 1 (Retry)
  → Contingency handles L1 → L2 → L3 → L4 → L5 automatically
  → DO NOT retry manually after invoking contingency

IF Phase 4 (VERIFY) shows confidence < 50:
  → Invoke contingency at Level 2 (Simplify)
  → Reduce scope: mark non-critical items as [DEFERRED]

IF rate-limited at any phase:
  → Invoke contingency at Level 5 (Pause)
  → Save state, notify user, STOP
```

### State Preservation
Before any contingency escalation, save state to:
`.claude/local/state/plan-and-execute-state.json`
```json
{
  "skill": "plan-and-execute",
  "phase": 3,
  "checklist_item": 4,
  "total_items": 12,
  "items_done": [1, 2, 3],
  "items_remaining": [4, 5, 6, 7, 8, 9, 10, 11, 12],
  "failure_type": "test_failure",
  "resume_command": "resume plan-and-execute"
}
```

---

## Live Feedback Handler

### When User Reports Issue During Execution
```
IF user reports bug/complaint while plan-and-execute is running:
  1. PAUSE current checklist item (save progress)
  2. Invoke live-feedback-handler skill
  3. live-feedback-handler classifies and handles (hotfix or queue)
  4. RESUME current checklist item after hotfix (or immediately if queued)
```

### Priority Override
- Critical/High live feedback → pause current work → hotfix → resume
- Medium/Low live feedback → queue → continue current work uninterrupted

---

## Subagent Model (Cost-Optimized)

| Phase | Sub-Agent | Model | Why |
|-------|-----------|-------|-----|
| 1. DISCOVER | ScopeScout | haiku | Read-only, simple search |
| 2. PLAN | ChecklistBuilder | sonnet | Needs reasoning for task decomposition |
| 3. IMPLEMENT | TaskExecutor | haiku | Follows checklist, mechanical work |
| 4. VERIFY | ProofCollector | haiku | Runs commands, captures output |
| 5. DELIVER | PRPackager | haiku | Git ops, template output |

### When to Spawn vs Inline
- 1 lead Claude + sub-agents ONLY when scope = medium or large
- scope = small → lead does everything inline, 0 spawns
- Optional team (3 teammates): ONLY if FE + BE + tests can run in parallel with zero file overlap

---

## Handoff Table

| When | Invoke Skill | Pass | Expect Back |
|------|-------------|------|-------------|
| Task fails 2x | `contingency` | failure_type, item_id, attempts | recovered: boolean, escalation_level |
| User reports bug | `live-feedback-handler` | user complaint text | hotfix_applied OR queued |
| Before any fix | `skills-self-update` | issue, fix, file | updated SKILL.md path |
| Before claiming done | `evidence-proof` | test output, files changed | confidence score |
| Git conflict | `conflict-resolution` | branch name, conflicting files | resolved: boolean |
| Before push | `pr-push-merge` | checklist status, test output | PR URL or BLOCKED |
| Server needed | `server-lifecycle` | action needed | server_ok: boolean |
| Resuming after pause | `session-resume` | saved state path | resume point |
| Rate limited | `cost-guardrails` | current usage | action: continue or pause |

---

## Failure Table

| Failure | Action | Max Retries |
|---------|--------|-------------|
| npm test fails (1 test) | Fix that ONE file, rerun | 2, then contingency L1 |
| npm test fails (many tests) | Contingency L2 (simplify scope) | 1 |
| Subagent returns empty | Log [UNKNOWN], continue without | 0 |
| Checklist file missing | Create from Phase 2 template | 1 |
| Checklist file corrupted | Regenerate from git diff | 1 |
| Git conflict | Invoke conflict-resolution | 1 |
| Server won't start | Invoke server-lifecycle | 2 |
| Rate limited (429) | Contingency L5 (pause, save state) | 0 |
| Credit exhausted | Contingency L5 (pause, save state) | 0 |
| Stuck > 2 retries on any item | Contingency L3 (isolate) | 1 |

---

## Cheap-Model Guardrails (Haiku-Safe)

### Execution
1. Phases IN ORDER: 1 → 2 → 3 → 4 → 5. Never skip a phase.
2. Check gate BEFORE proceeding. Gate fails → retry (max 2) → contingency.
3. ONE checklist item per turn in Phase 3. Never batch multiple items.
4. Run `npm test` after EVERY file edit in Phase 3. No exceptions.

### Output
5. Use EXACT output templates above. Do not rephrase or restructure.
6. Max 200 lines of output per phase.
7. Numbers MUST come from actual command output. Never invent test counts.
8. File paths MUST come from Glob/Grep results. Never guess paths.

### Decisions
9. IF unsure about anything → mark [UNKNOWN] and continue. Do not guess.
10. IF stuck after 2 retries → invoke contingency. Do not keep retrying.
11. IF file not in checklist "Files to Change" → DO NOT EDIT IT.
12. IF test fails → fix ONLY the failing test/file. No adjacent refactoring.

### Spawning
13. scope = small → 0 spawns (inline)
14. scope = medium → max 2 sub-agents
15. scope = large → max 4 sub-agents
16. Never spawn for: reads, searches, single-file edits

### Cost
17. Grep before Read. Always.
18. Max 10 tool calls per phase for Haiku agents.
19. Skip completed work: check checklist FIRST.
20. skills-self-update: same turn, no respawn.

### Server / Laptop
21. Check server before Phase 3 if task needs localhost.
22. Restart server after any backend file edit.
23. Phase 5 ALWAYS tells user: server status + resume instructions.
24. Save checklist state — laptop may sleep anytime.

### Live Feedback
25. User complaint during work → classify severity via live-feedback-handler.
26. Critical/High + <= 3 files → pause, hotfix, resume.
27. Medium/Low → queue, continue current work.
28. After hotfix → skills-self-update with live feedback lesson.

### Rate Limits
29. 429 → save state → notify user → STOP. Never retry in loop.
30. 503 → retry 2x → downgrade model → STOP.
31. Credit warning → finish current item only → save → STOP.
