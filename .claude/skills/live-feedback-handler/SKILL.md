---
name: live-feedback-handler
description: Handle user complaints in real time while system is running. Classify severity, hotfix or queue, restart server, notify user. Use when users report issues on live localhost.
---

# Live Feedback Handler Skill

**Purpose**: Users are using the system on localhost:3000 and reporting issues. This skill classifies complaints, applies hotfixes for critical issues, queues non-critical ones, and notifies the user.

**When to use**: User reports a bug, complaint, or issue while the server is running and they're actively using the product.

---

## Phase 1: DISCOVER
### Sub-Agent: `ComplaintClassifier` (model: haiku)
- **Tools**: Read, Grep, Glob
- **Prompt**: Parse the user complaint. Find the affected file(s) by searching codebase for keywords from the complaint. Classify: type (ui_bug, api_error, missing_feature, performance, confusion, crash), severity (critical, high, medium, low). Count affected files.
- **Output**: `{ type, severity, user_message, affected_files[], file_count }`
- **Gate**: type AND severity classified

## Phase 2: PLAN
### Sub-Agent: `HotfixDecider` (model: haiku)
- **Tools**: Read
- **Prompt**: Decide action based on severity and file count. IF severity=critical/high AND file_count <= 3 → "hotfix". IF severity=medium/low OR file_count > 3 → "queue". Output the exact plan.
- **Output**: `{ action: "hotfix"|"queue", plan_steps[]|queue_reason, priority }`
- **Gate**: decision made

## Phase 3: IMPLEMENT
### Sub-Agent: `HotfixWriter` (model: haiku)
- **Tools**: Read, Write, Edit, Bash
- **Prompt**: IF hotfix: edit the affected file(s). Fix the specific issue. Run `npm test`. IF queue: append to `.claude/local/feedback-queue.md` with timestamp, severity, description.
- **Output**: `{ files_changed[], test_pass: boolean, queued: boolean, queue_position }`
- **Gate**: fix applied AND test passes, OR issue queued

## Phase 4: VERIFY
### Sub-Agent: `HotfixVerifier` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: IF hotfix was applied: restart server (kill old process, `npm start`). Verify fix on localhost:3000 by checking the affected endpoint/page. IF queued: verify queue entry exists.
- **Output**: `{ server_restarted: boolean, issue_resolved: boolean, verification_method }`
- **Gate**: issue resolved OR queue confirmed

## Phase 5: DELIVER
### Sub-Agent: `UserNotifier` (model: haiku)
- **Tools**: Read, Edit
- **Prompt**: Notify user with appropriate message. IF fixed: "Fixed: [what]. Refresh localhost:3000." IF queued: "Acknowledged: [issue]. Queued as [priority]. Will fix in next cycle." Update skills-self-update with lesson if applicable.
- **Output**: `{ notification, fix_summary, lesson_added: boolean }`
- **Gate**: user notified

---

## Severity Classification Table

| User Says | Type | Severity | Action |
|-----------|------|----------|--------|
| "page is blank / white screen" | crash | Critical | Hotfix NOW |
| "server is down / can't connect" | server_down | Critical | Restart server |
| "button does nothing / no response" | ui_bug | High | Hotfix |
| "error shows raw JSON / stack trace" | api_format | High | Hotfix |
| "form won't submit" | ui_bug | High | Hotfix |
| "getting 500 error" | api_error | High | Hotfix |
| "slow to load / takes forever" | performance | Medium | Queue |
| "confusing text / don't understand" | ux | Medium | Queue |
| "missing feature X / can't find Y" | missing_feature | Medium | Queue |
| "color is wrong / font looks off" | cosmetic | Low | Queue |
| "would be nice if..." | enhancement | Low | Queue |

---

## Hotfix Rules (Strict Scope)

- MAX 3 files changed per hotfix
- MAX 50 lines changed per hotfix
- IF hotfix would change > 3 files → QUEUE instead, never hotfix
- Must run `npm test` before restarting server
- Must restart server after ANY backend file change (Express no hot-reload)
- Must verify on localhost:3000 after restart
- Never claim "fixed" without verification

---

## Feedback Queue Format

File: `.claude/local/feedback-queue.md`
```markdown
## Live Feedback Queue

| # | Timestamp | User Report | Severity | Type | Affected Files | Status | Fix |
|---|-----------|-------------|----------|------|----------------|--------|-----|
| 1 | 2026-03-11 14:30 | "Submit button does nothing" | High | ui_bug | src/www/js/app.js | FIXED | Wired onclick handler |
| 2 | 2026-03-11 14:45 | "Error shows raw JSON" | Medium | api_format | src/www/js/results.js | TODO | Format error display |
```

---

## Integration with skills-self-update

After every hotfix:
1. Add lesson to relevant SKILL.md
2. Format: `**[Live Feedback]**: User reported [X]. **Fix**: [Y]. **Prevention**: [Z].`
3. IF same complaint appears 3+ times → update `.claude/rules/guardrails.md` with prevention rule
4. Commit skill update with hotfix

---

## Contingency

IF hotfix breaks other tests:
  → Revert hotfix (`git checkout -- <file>`)
  → QUEUE the issue instead
  → Notify user: "Fix caused other issues. Queued for deeper fix. Current workaround: [if any]"

IF server won't restart after hotfix:
  → Revert ALL hotfix changes
  → Restart server with original code
  → QUEUE issue as Critical
  → Notify user: "Server restored. Issue requires deeper investigation."

---

## Failure Table

| Failure | Action | Max Retries |
|---------|--------|-------------|
| Hotfix breaks tests | Revert, queue issue | 1 |
| Server won't start | Revert all changes, restart | 1 |
| Can't find affected file | Ask user for more detail | 0 |
| Too many files affected | Queue, don't hotfix | 0 |

---

## Cheap-Model Guardrails

- Parse complaint literally — do not interpret beyond what user said
- Search for keywords from complaint in codebase (Grep) before guessing files
- Hotfix = minimal change only. No refactoring, no improvements, no adjacent fixes
- Always run `npm test` before server restart
- Always restart server after backend changes
- Queue is the safe default — hotfix only when criteria met exactly
- Max 10 tool calls for the entire hotfix flow
