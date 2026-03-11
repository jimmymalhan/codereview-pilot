---
name: session-resume
description: Resume work after laptop sleep, session end, or rate-limit pause. Load saved state, check what's done, skip completed, continue from where we left off.
---

# Session Resume Skill

**Purpose**: Resume work seamlessly after interruptions — laptop sleep, session timeout, rate-limit pause, or credit exhaustion. Zero wasted credits on rediscovery.

**When to use**: Start of every new session, after rate-limit pause, after laptop wake, or when user says "resume".

---

## Phase 1: DISCOVER
### Sub-Agent: `StateLoader` (model: haiku)
- **Tools**: Read, Glob, Bash
- **Prompt**: Load all saved state. Check: `.claude/local/state/*.json` for contingency state. `.claude/local/checklists/*.md` for checklist progress. `git status` for uncommitted work. `git log --oneline -3` for recent commits. Report what exists.
- **Output**: `{ state_files[], checklist_files[], uncommitted_files[], recent_commits[], server_needed: boolean }`
- **Gate**: state loaded

## Phase 2: PLAN
### Sub-Agent: `GapAnalyzer` (model: haiku)
- **Tools**: Read
- **Prompt**: Analyze loaded state. For each checklist: count DONE vs TODO vs BLOCKED. Identify first TODO item. Check if any DONE items are STALE (file modified after marking DONE). Plan resume order. Decide if server is needed.
- **Output**: `{ items_done, items_remaining, first_todo, stale_items[], server_needed: boolean, resume_plan[] }`
- **Gate**: gaps identified AND resume plan created

## Phase 3: IMPLEMENT
### Sub-Agent: `ResumeExecutor` (model: haiku)
- **Tools**: Bash, Read, Write, Edit
- **Prompt**: Execute resume steps. IF uncommitted work → ask user: commit or discard. IF server needed → invoke server-lifecycle. IF stale items → mark as TODO. Begin from first TODO item using the original skill's Phase 3.
- **Output**: `{ uncommitted_handled, server_started, stale_refreshed, current_item }`
- **Gate**: resume point reached

## Phase 4: VERIFY
### Sub-Agent: `ResumeVerifier` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Verify resume state is correct. Run `npm test` to confirm existing work still passes. Check server if needed. Confirm checklist is accurate.
- **Output**: `{ tests_pass: boolean, server_ok: boolean, checklist_accurate: boolean }`
- **Gate**: state verified

## Phase 5: DELIVER
### Sub-Agent: `ResumeNotifier` (model: haiku)
- **Tools**: Read
- **Prompt**: Notify user of resume status. Output: what was already done, what remains, current starting point, estimated scope.
- **Output**: `{ status_message, done_count, remaining_count, current_task, resume_ready: boolean }`
- **Gate**: user informed AND ready to continue

---

## State File Locations

| File | Purpose |
|------|---------|
| `.claude/local/state/<skill>-state.json` | Contingency saved state (failure recovery) |
| `.claude/local/checklists/*.md` | Checklist progress (TODO/DONE/SKIP/BLOCKED) |
| `.claude/local/feedback-queue.md` | Live feedback items not yet addressed |
| `.claude/local/cost-log.md` | Credit usage history |
| `docs/CONFIDENCE_SCORE.md` | Evidence and confidence from prior work |
| `CHANGELOG.md` | What was already changed |

---

## Resume Scenarios

### After Laptop Sleep
```
1. Load checklist → count DONE/TODO
2. git status → check for uncommitted work
3. npm test → confirm existing work passes
4. Start server if needed
5. Resume from first TODO
6. Output: "Resuming. N done, M remaining. Starting: [item]"
```

### After Rate-Limit Pause
```
1. Load .claude/local/state/<skill>-state.json
2. Read exact item and phase where paused
3. Check if rate limit is lifted (try one small API call)
4. IF still limited → notify user, wait
5. IF lifted → resume from exact saved phase and item
6. Output: "Rate limit cleared. Resuming item N, Phase P."
```

### After Credit Exhaustion
```
1. Load saved state
2. Output what was completed, what remains
3. Ask user: "Continue? This will use additional credits."
4. IF yes → resume from saved point
5. IF no → output full status and save
```

### After Session Timeout
```
1. Same as laptop sleep
2. Check git log for recent commits (might have committed before timeout)
3. Verify no partial edits left uncommitted
4. Resume from checklist state
```

---

## Stale Detection

A completed item is STALE if:
- The file it changed has been modified AFTER the item was marked DONE
- `git diff` shows the file has new changes
- Another item or hotfix touched the same file

IF stale:
- Change status from DONE → TODO
- Re-verify with `npm test`
- IF tests pass → change back to DONE
- IF tests fail → keep as TODO, fix in order

---

## User Messages

### Clean Resume (Everything Fine)
```
Welcome back. Checking previous progress...
- Checklist: N/M items done
- Tests: all passing
- Server: [starting now | not needed]
Resuming from: [item description]
```

### Resume with Issues
```
Welcome back. Found some issues:
- [2 files with uncommitted changes — commit or discard?]
- [1 stale item needs re-verification]
- [Server was down — restarting]
After resolving: will resume from item N.
```

### Nothing to Resume
```
No saved state found. Starting fresh.
What would you like to work on?
```

---

## Failure Table

| Failure | Action | Max Retries |
|---------|--------|-------------|
| State file corrupted | Ignore state, resume from checklist | 0 |
| Checklist missing | Start fresh, ask user for task | 0 |
| npm test fails on existing work | Fix failing tests first, then resume | 2 |
| Server won't start | Invoke server-lifecycle | 1 |
| Uncommitted work conflicts | Ask user: commit, stash, or discard | 0 |

---

## Cheap-Model Guardrails

- Load state files ONCE at start — do not re-read during session
- Never redo completed items unless STALE
- Run `npm test` ONCE to verify — not per item
- Ask user about uncommitted work — do not auto-decide
- Max 8 tool calls for entire resume flow
- After resume: hand off to the original skill's Phase 3, do not restart from Phase 1
