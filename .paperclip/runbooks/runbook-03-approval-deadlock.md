# Runbook #3: Approval Deadlock

**Severity**: WARNING (escalates to CRITICAL after 2 hours)
**Trigger**: Task stuck in "awaiting_approver" state for >2 hours
**Alert**: `ApprovalQueueBottleneck` (queue depth >5 for 5 minutes)
**Expected Resolution Time**: 1-4 hours
**On-Call Authority**: Can investigate and notify; must escalate to management for auto-approve/reject decisions

---

## Symptoms

- Task(s) stuck in "awaiting_skeptic", "awaiting_verifier", or "awaiting_approver" state
- Escalation queue depth rising (>5 items)
- Approval pipeline latency panel shows extended wait times
- Downstream tasks blocked waiting for approval

---

## Step-by-Step Response

### Step 1: Acknowledge and Assess (< 2 minutes)
- [ ] Acknowledge alert
- [ ] Post in #paperclip-ops: "Investigating approval pipeline delay"
- [ ] Check escalation queue dashboard for number of blocked tasks
- [ ] Identify which approval stage is the bottleneck (skeptic, verifier, or approver)

### Step 2: Identify Stuck Tasks (2-3 minutes)
```bash
# Query tasks in approval states
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks?state=awaiting_skeptic,awaiting_verifier,awaiting_approver" \
  | jq '.[] | {id, state, created_at, assigned_to, waiting_since}'
```

- [ ] Record task IDs, states, and how long each has been waiting
- [ ] Determine if this is a single stuck task or systemic issue

### Step 3: Diagnose Root Cause

**Single task stuck -- agent issue:**
```bash
# Check if the assigned reviewer agent is responsive
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/agents/{reviewer_agent}/status"
```
- If agent is unresponsive, follow Runbook #1 (Agent Timeout)
- If agent is responsive but task not progressing, check task complexity

**Multiple tasks stuck -- approver unavailable:**
- [ ] Check if human approver has been notified
- [ ] Check Slack #paperclip-approvals for pending notifications
- [ ] Check if approver is available (working hours, PTO, etc.)

**Systemic -- approval state machine issue:**
- [ ] Check for state machine errors in logs
- [ ] Verify approval workflow sequence is correct (skeptic -> verifier -> approver)
- [ ] Check if a previous override disrupted the state machine

### Step 4: Notify Approver(s) (if human approval pending)
- [ ] Send direct notification to approver via Slack:
  ```
  @{approver_name} - {count} task(s) awaiting your approval in Paperclip.
  Oldest task has been waiting {duration}. Please review at your earliest convenience.
  Task IDs: {list}
  ```
- [ ] If Slack notification sent, set 1-hour timer for response

### Step 5: Escalate if No Response (after 1 hour of user notification)
- [ ] Escalate to engineering lead or management
- [ ] Present options:
  1. **Wait**: Continue waiting for approver (low risk, delays tasks)
  2. **Auto-approve**: Management approves task(s) on behalf of approver (governance risk, log as override)
  3. **Reject**: Reject task(s) and re-queue (safe, but work is lost)

### Step 6: Implement Management Decision
**If auto-approve is chosen:**
```bash
# Governance override -- requires management authorization
# Log the override with full context
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}/approve" \
  -d '{
    "override": true,
    "authorized_by": "{management_name}",
    "justification": "Approval deadlock resolution - approver unavailable for {duration}",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

**If reject is chosen:**
```bash
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}/reject" \
  -d '{
    "reason": "Approval deadlock - approver unavailable. Task rejected for re-submission.",
    "authorized_by": "{management_name}"
  }'
```

### Step 7: Verify Resolution
- [ ] Confirm stuck tasks have moved out of approval state
- [ ] Confirm escalation queue depth is decreasing
- [ ] Verify no orphaned tasks remain
- [ ] Check that downstream tasks have unblocked

### Step 8: Post-Incident
- [ ] Post resolution in #paperclip-ops
- [ ] If override was used, log in audit trail with full justification
- [ ] If deadlock was caused by missing approver, recommend:
  - Backup approver assignment
  - Auto-escalation policy (if no response in X hours, escalate to backup)
  - Approval SLA definition

---

## Escalation

**Escalate to Engineering Lead if:**
- Approval state machine appears broken (not a human availability issue)
- Multiple tasks stuck in different stages simultaneously
- Override fails to resolve the deadlock

**Escalate to Management/CEO if:**
- Need authorization for governance override (auto-approve or reject)
- Approver has been unresponsive for >4 hours
- Override rate exceeds 20% in a day (systemic issue)

---

## Communication Templates

**Slack - Initial Investigation:**
> Investigating: {count} task(s) in approval queue for >{duration}. Checking approval pipeline and reviewer availability.

**Slack - Approver Notification:**
> @{approver_name} Approval required: {count} Paperclip task(s) awaiting your review. Oldest: {duration} in queue. Task IDs: {list}. Please approve/reject at your earliest convenience.

**Slack - Escalation to Management:**
> ESCALATION: Approval deadlock for {duration}. {count} tasks blocked. Approver {name} has not responded after notification. Requesting management decision: auto-approve, reject, or continue waiting.

**Slack - Resolved (normal):**
> RESOLVED: Approval queue cleared. {count} tasks approved by {approver_name} after {duration} wait.

**Slack - Resolved (override):**
> RESOLVED: Approval deadlock resolved via management override. {count} tasks {approved/rejected} by {management_name}. Override logged in audit trail. Original approver: {name}.
