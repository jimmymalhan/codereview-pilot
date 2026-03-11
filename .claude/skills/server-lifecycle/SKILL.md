---
name: server-lifecycle
description: Laptop-aware server management. Check if server is up, start/restart, health check, notify user of status. Handles the reality that localhost is not always available.
---

# Server Lifecycle Skill

**Purpose**: Manage the Express server on a laptop that is not always on. Check status before work, restart after changes, notify user when done, save state for resume after sleep.

**When to use**: Before any task that needs localhost:3000, after any backend change, and at the end of every work session.

---

## Phase 1: DISCOVER
### Sub-Agent: `ServerProbe` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Check server status. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "DOWN"`. Check if npm start process exists with `pgrep -f "node src/server"`. Report status.
- **Output**: `{ server_running: boolean, health_status: number|"DOWN", pid: number|null, port: 3000 }`
- **Gate**: status known

## Phase 2: PLAN
### Sub-Agent: `LifecyclePlanner` (model: haiku)
- **Tools**: Read
- **Prompt**: Based on server status and current task, decide action. IF server down AND task needs it → "start". IF server up AND backend files changed → "restart". IF server up AND no changes → "skip". IF work done → "notify_status".
- **Output**: `{ action: "start"|"restart"|"skip"|"notify_status", reason }`
- **Gate**: action decided

## Phase 3: IMPLEMENT
### Sub-Agent: `ServerManager` (model: haiku)
- **Tools**: Bash
- **Prompt**: Execute the planned action. IF start: run `npm start` in background. IF restart: kill old process, wait 2s, start new. IF skip: do nothing. Wait 3s after start, then verify.
- **Output**: `{ action_taken, pid, started: boolean }`
- **Gate**: action completed

## Phase 4: VERIFY
### Sub-Agent: `HealthChecker` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Verify server health. Run `curl -s http://localhost:3000/health`. Check response. If health endpoint returns 200 → healthy. If not → report error.
- **Output**: `{ health_ok: boolean, response_code, endpoints_checked[], errors[] }`
- **Gate**: health verified

## Phase 5: DELIVER
### Sub-Agent: `AvailabilityNotifier` (model: haiku)
- **Tools**: Read, Edit
- **Prompt**: Notify user of server status using the appropriate template from User Notification Templates below. Save session state if work is complete.
- **Output**: `{ status_message, last_verified, state_saved: boolean }`
- **Gate**: user informed

---

## Server Commands

```bash
# Check if server is running
curl -s http://localhost:3000/health

# Start server (background)
npm start &

# Find server process
pgrep -f "node src/server"

# Kill server
pkill -f "node src/server"

# Restart server
pkill -f "node src/server"; sleep 2; npm start &
```

---

## Laptop-Aware Rules

### Before Any Work (Check First)
1. `curl -s http://localhost:3000/health || echo "DOWN"`
2. IF DOWN AND task needs server → start it
3. IF DOWN AND task does NOT need server → skip, save credits
4. IF UP → continue

### After Backend Changes (Always Restart)
Express does not hot-reload. After editing ANY file in `src/`:
1. Kill old process: `pkill -f "node src/server"`
2. Wait 2 seconds
3. Start new: `npm start &`
4. Wait 3 seconds
5. Verify: `curl -s http://localhost:3000/health`
6. IF health fails → check console output for errors

### After Work Complete (Always Notify)
Output to user with appropriate template below.

### When Laptop Sleeps / Closes
- Server process dies automatically — this is expected
- All code changes are saved in git — nothing is lost
- Checklist state saved in `.claude/local/` — resume exactly where left off
- Next session: Claude checks server status FIRST before doing anything

---

## User Notification Templates

### Server UP, Work Done
```
All changes applied. Server running at http://localhost:3000
Leave this terminal open to keep the server running.
Your laptop can sleep — all code is committed and safe.
Next session: I'll check what's done and resume where we left off.
```

### Server UP, Work In Progress
```
Progress: N/M items done. Server running at http://localhost:3000
Changes so far are committed. Remaining: [list items].
To continue: keep this session open.
To pause: your work is saved. Resume anytime with 'resume'.
```

### Server DOWN, Not Needed
```
All changes committed to git. Server not running (not needed for this task).
To start: npm start → http://localhost:3000
To resume later: run claude and say 'resume'.
```

### Server DOWN, Needs Restart
```
Server is not running. Starting it now...
[starts server]
Server running at http://localhost:3000. Health check: OK.
```

### Server Failed to Start
```
Server failed to start. Error: [error message].
Likely cause: [diagnosis].
Fix: [suggestion].
Run manually: npm start (to see full error output).
```

---

## Session Resume Protocol

When resuming after laptop sleep or new session:
1. Read `.claude/local/state/` for saved state files
2. Read `.claude/local/checklists/` for checklist progress
3. Run `git status` for uncommitted work
4. IF uncommitted work → ask user: commit or discard?
5. IF server needed for remaining tasks → start it
6. Resume from first TODO item in checklist
7. Output: "Resuming from item N/M. Remaining: [list]"

---

## Integration with Other Skills

Every skill that needs localhost adds to Phase 3 (before implementation):
```
Pre-check: curl -s http://localhost:3000/health || invoke server-lifecycle
```

Every skill adds to Phase 5 (after delivery):
```
Server status: [UP at localhost:3000 | DOWN (not needed)]
Resume: [instructions if work remains]
```

---

## Failure Table

| Failure | Action | Max Retries |
|---------|--------|-------------|
| Server won't start | Read error output, fix syntax, retry | 2 |
| Port already in use | Kill existing process, retry | 1 |
| Health check fails | Check server logs, report to user | 1 |
| Process dies immediately | Check for crash in src/server.js | 1 |

---

## Cheap-Model Guardrails

- Check server status with actual curl — never assume it's running
- After backend edit → MUST restart. No exceptions.
- Wait 3 seconds after start before health check
- Never start server if task doesn't need it (save resources)
- Always notify user of server status in Phase 5
- Save state before session end — laptop may sleep anytime
