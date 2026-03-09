# Runbook #6: Skeptic/Verifier Override

**Severity**: WARNING
**Trigger**: Authorized user wants to approve a task despite skeptic or verifier block
**Alert**: Manual request (no automated alert -- user initiates override)
**Expected Resolution Time**: 15-30 minutes
**On-Call Authority**: Can facilitate the override process; authorization is restricted to CEO or Engineering Lead only

---

## Symptoms

- User requests override of a skeptic or verifier rejection
- Task is in "rejected_by_skeptic" or "rejected_by_verifier" state
- User believes the rejection is incorrect or the task is urgent enough to proceed

---

## Step-by-Step Response

### Step 1: Receive Override Request (< 2 minutes)
- [ ] Confirm the request came through an authorized channel (Slack, email, or in-person)
- [ ] Record: who is requesting, which task, which gate blocked it (skeptic or verifier)

### Step 2: Verify Authorization (2-3 minutes)

**Only the following roles can authorize an override:**
- CEO / Executive Sponsor
- Engineering Lead

**No one else can override skeptic or verifier decisions.** If the requester is not in the authorized list:
- [ ] Politely decline: "Override requires CEO or Engineering Lead authorization."
- [ ] Offer to escalate the request on their behalf
- [ ] Stop here if not authorized

### Step 3: Collect Required Information (5 minutes)
The authorizing person MUST provide:

- [ ] **Written justification**: Why should the skeptic/verifier block be overridden?
- [ ] **Risk acknowledgment**: They understand the skeptic/verifier raised valid concerns
- [ ] **Task ID**: Which specific task is being overridden
- [ ] **Urgency reason**: Why can't the task be re-submitted with the skeptic/verifier concerns addressed

**Template for authorizer to fill out:**
```
Task ID: ___________
Blocked by: [ ] Skeptic  [ ] Verifier
Skeptic/Verifier concerns: ___________
Justification for override: ___________
Risk acknowledgment: I understand the {skeptic/verifier} raised concerns about
  {specific concerns} and I accept the risk of proceeding.
Authorized by: ___________
Date/Time: ___________
```

### Step 4: Review the Rejection Details
```bash
# Get task details and rejection reason
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}" \
  | jq '{id, state, skeptic_review, verifier_review}'

# Get the specific rejection
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}/reviews" \
  | jq '.[] | {reviewer, decision, concerns, timestamp}'
```

- [ ] Read the skeptic/verifier's specific concerns
- [ ] Confirm the authorizer has seen these concerns before approving override

### Step 5: Implement the Override
```bash
# Execute governance override
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}/override" \
  -d '{
    "override_gate": "{skeptic|verifier}",
    "authorized_by": "{name}",
    "role": "{CEO|Engineering Lead}",
    "justification": "{written justification}",
    "original_concerns": "{skeptic/verifier concerns}",
    "risk_acknowledged": true,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

- [ ] Verify the override was accepted (HTTP 200)
- [ ] Verify the task has moved to the next approval stage

### Step 6: Log Override in Audit Trail
```bash
# Verify override is recorded in audit trail
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/events?task_id={task_id}&event_type=override" \
  | jq '.'
```

The audit record MUST contain:
- [ ] Task ID
- [ ] Which gate was overridden (skeptic or verifier)
- [ ] Who authorized it (name and role)
- [ ] Written justification
- [ ] Original skeptic/verifier concerns
- [ ] Timestamp

### Step 7: Monitor Override Rate
```bash
# Check daily override rate
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/events?event_type=override&since=$(date -u +%Y-%m-%d)T00:00:00Z" \
  | jq '. | length'
```

- [ ] If override rate > 20% of tasks in a day: escalate to CTO
  - High override rate indicates either:
    - Skeptic/verifier rules are too strict (need tuning)
    - Tasks are being submitted without proper preparation
    - Governance process is being bypassed systematically

### Step 8: Post-Override
- [ ] Post in #paperclip-ops:
  ```
  OVERRIDE: Task {task_id} - {skeptic/verifier} block overridden.
  Authorized by: {name} ({role})
  Justification: {brief summary}
  Override logged in audit trail.
  ```
- [ ] Notify the original skeptic/verifier agent owner that their decision was overridden (for improvement tracking)

---

## Escalation

**On-call facilitates but cannot authorize:**
- On-call verifies the requester's identity and role
- On-call collects justification and implements the override
- On-call logs everything in audit trail

**CEO or Engineering Lead authorizes:**
- Only they can make the override decision
- Must provide written justification

**Escalate to CTO if:**
- Override rate > 20% in a day
- Same task/type is repeatedly overridden (pattern)
- Override is requested for a security-sensitive task

---

## Denial Scenarios

**Deny override if:**
- Requester is not CEO or Engineering Lead
- Requester refuses to provide written justification
- Requester has not reviewed the skeptic/verifier's specific concerns
- The override would violate a CLAUDE.md rule (e.g., "verifier blocks unsupported nouns")
- The task involves security-sensitive operations without Security Officer review

**Denial response:**
> "Override denied. {Reason}. The task can be re-submitted after addressing the {skeptic/verifier}'s concerns: {list concerns}."

---

## Communication Templates

**Slack - Override Request Received:**
> Override request received for task {task_id} (blocked by {skeptic/verifier}). Verifying authorization and collecting justification.

**Slack - Override Executed:**
> OVERRIDE EXECUTED: Task {task_id} - {skeptic/verifier} block overridden by {name} ({role}). Justification: {summary}. Full details logged in audit trail.

**Slack - Override Denied:**
> Override denied for task {task_id}. Reason: {reason}. Task remains in {state}. Please address {skeptic/verifier} concerns and re-submit.

**Slack - High Override Rate Warning:**
> WARNING: Override rate at {X}% today ({count}/{total} tasks). Exceeds 20% threshold. Escalating to CTO for governance process review.
