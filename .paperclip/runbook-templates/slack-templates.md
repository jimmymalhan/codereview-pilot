# Slack Message Templates for On-Call Communication
## Paperclip Integration - Operational Runbooks

**Owner**: Operations/DevOps Lead
**Channel**: #paperclip-ops (primary), #paperclip-approvals (approval-related)

---

## Runbook #1: Agent Timeout

### Initial Investigation
```
:warning: Investigating: Agent `{agent_name}` heartbeat missed at {timestamp}.
Checking agent status and logs. Will update in 5 minutes.
```

### Resolved
```
:white_check_mark: Resolved: Agent `{agent_name}` heartbeat recovered after {duration}.
Root cause: {frozen process | crash | network issue}.
No further action needed.
```

### Escalating
```
:rotating_light: Escalating: Agent `{agent_name}` unresponsive for {duration}.
Initial troubleshooting unsuccessful. Paging engineering lead.
Steps taken: {list actions}
```

---

## Runbook #2: API Failure

### Initial Investigation
```
:warning: Investigating: Paperclip API connectivity issues detected at {timestamp}.
Multiple agents affected. Checking API health and status page.
```

### Switched to Local-Only Mode
```
:large_orange_circle: UPDATE: Paperclip API confirmed down. Switched to local-only mode at {timestamp}.
Paperclip governance is suspended. Tasks processed locally with manual governance only.
Monitoring for API recovery.
```

### Recovered
```
:white_check_mark: RESOLVED: Paperclip API recovered at {timestamp}. Outage duration: {X} minutes.
Restored full Paperclip integration. Verifying agent reconnection and audit trail integrity.
```

---

## Runbook #3: Approval Deadlock

### Initial Investigation
```
:warning: Investigating: {count} task(s) in approval queue for >{duration}.
Checking approval pipeline and reviewer availability.
```

### Approver Notification (post in #paperclip-approvals)
```
@{approver_name} Approval required: {count} Paperclip task(s) awaiting your review.
Oldest: {duration} in queue. Task IDs: {list}.
Please approve/reject at your earliest convenience.
```

### Escalation to Management
```
:rotating_light: ESCALATION: Approval deadlock for {duration}. {count} tasks blocked.
Approver {name} has not responded after notification.
Requesting management decision: auto-approve, reject, or continue waiting.
```

### Resolved (normal)
```
:white_check_mark: RESOLVED: Approval queue cleared. {count} tasks approved by {approver_name} after {duration} wait.
```

### Resolved (override)
```
:white_check_mark: RESOLVED: Approval deadlock resolved via management override.
{count} tasks {approved/rejected} by {management_name}.
Override logged in audit trail. Original approver: {name}.
```

---

## Runbook #4: Budget Exhausted

### 75% Warning
```
:large_yellow_circle: Budget notice: Organization token budget at 75%.
Burn rate: {X} tokens/hour. Estimated exhaustion: {time}. Monitoring.
```

### 90% Critical
```
:warning: Budget alert: Organization token budget at 90%.
Preparing to pause non-critical tasks if 100% is reached.
{count} active tasks in progress.
```

### 100% Exhausted
```
:red_circle: BUDGET EXHAUSTED: Token budget at 100%. New task submission paused.
In-flight critical tasks continuing. Budget resets at midnight UTC ({X} hours).
Contact CEO for emergency budget increase if needed.
```

### Reset / Resumed
```
:white_check_mark: Budget reset: Organization token budget has reset.
Resuming task submission. {count} queued tasks being processed.
```

---

## Runbook #5: Audit Trail Gap

### Initial Alert
```
:rotating_light: CRITICAL: Audit trail gap detected at {timestamp}.
{count} events potentially missing. Investigating root cause.
Security team will be notified.
```

### Root Cause Identified
```
:large_orange_circle: UPDATE: Audit gap root cause: {lag | logger failure | API failure | data loss}.
Duration: {X} minutes. {count} tasks affected.
{Recovering from buffer | Manual reconstruction required}.
```

### Resolved
```
:white_check_mark: RESOLVED: Audit trail gap closed.
Root cause: {cause}. {count}/{total} events recovered.
Gap report filed. Security team notified for review.
```

---

## Runbook #6: Skeptic/Verifier Override

### Override Request Received
```
:large_blue_circle: Override request received for task {task_id} (blocked by {skeptic/verifier}).
Verifying authorization and collecting justification.
```

### Override Executed
```
:warning: OVERRIDE EXECUTED: Task {task_id} - {skeptic/verifier} block overridden by {name} ({role}).
Justification: {summary}. Full details logged in audit trail.
```

### Override Denied
```
:no_entry: Override denied for task {task_id}.
Reason: {reason}. Task remains in {state}.
Please address {skeptic/verifier} concerns and re-submit.
```

### High Override Rate Warning
```
:rotating_light: WARNING: Override rate at {X}% today ({count}/{total} tasks).
Exceeds 20% threshold. Escalating to CTO for governance process review.
```
