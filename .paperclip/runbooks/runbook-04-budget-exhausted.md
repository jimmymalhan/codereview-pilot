# Runbook #4: Budget Exhausted

**Severity**: CRITICAL (at 100%), WARNING (at 75%, 90%)
**Trigger**: Organization token budget reaches threshold (75%, 90%, or 100%)
**Alert**: `BudgetWarning75`, `BudgetCritical90`, `BudgetExhausted`
**Expected Resolution Time**: Next day (midnight UTC reset) or user override
**On-Call Authority**: Can pause non-critical tasks independently; budget increase requires CEO approval

---

## Symptoms

- Budget consumption gauge shows >= 75% / 90% / 100%
- At 100%: New task submissions are rejected with "budget exceeded" error
- Budget burn rate panel shows accelerating consumption
- Per-agent budget breakdown may show one agent consuming disproportionately

---

## Step-by-Step Response

### At 75% Threshold (WARNING)

### Step 1: Monitor and Assess (< 2 minutes)
- [ ] Acknowledge alert
- [ ] Check budget dashboard: current usage, burn rate, time to exhaustion
- [ ] Post in #paperclip-ops: "Budget at 75%. Monitoring burn rate."

### Step 2: Analyze Consumption
```bash
# Get current budget status
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/budget/status" \
  | jq '{used, limit, percentage, reset_time, burn_rate_per_hour}'

# Get per-agent breakdown
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/budget/by-agent" \
  | jq '.[] | {agent_name, tokens_used, percentage_of_total}'
```

- [ ] Identify if one agent or task is consuming disproportionately
- [ ] Calculate estimated time to 90% and 100% at current burn rate
- [ ] If burn rate is normal and exhaustion is near end of day: no action needed
- [ ] If burn rate is abnormally high: investigate cause

### Step 3: (75% only) No action required unless burn rate is abnormal
- [ ] Continue monitoring
- [ ] Set reminder to check at 85% if no alert fires

---

### At 90% Threshold (CRITICAL)

### Step 4: Prepare for Exhaustion (< 5 minutes)
- [ ] Acknowledge PagerDuty alert
- [ ] Post in #paperclip-ops: "Budget at 90%. Preparing contingency."
- [ ] Identify in-flight tasks and their estimated remaining token cost
- [ ] Identify non-critical tasks that can be paused

### Step 5: Prioritize Tasks
```bash
# List all active tasks with budget impact
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks?state=in_progress" \
  | jq '.[] | {id, type, agent, tokens_consumed, estimated_remaining}'
```

- [ ] Categorize tasks: CRITICAL (must complete) vs NON-CRITICAL (can pause)
- [ ] Critical tasks: active incident investigations, in-progress approvals
- [ ] Non-critical tasks: routine analysis, non-urgent diagnostics

---

### At 100% Threshold (CRITICAL)

### Step 6: Stop New Tasks Immediately (< 1 minute)
- [ ] Acknowledge PagerDuty alert
- [ ] Post in #paperclip-ops: "BUDGET EXHAUSTED. New task submission paused."

```bash
# Verify Paperclip has auto-paused new submissions
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/budget/status" \
  | jq '{paused, reason}'

# If auto-pause did not trigger, manually pause
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks/pause-submissions" \
  -d '{"reason": "budget_exhausted"}'
```

### Step 7: Handle In-Flight Tasks
```bash
# Check in-flight tasks
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks?state=in_progress" \
  | jq '.[] | {id, type, tokens_consumed, can_complete_within_budget}'
```

- [ ] If in-flight tasks can complete within remaining tokens: let them finish
- [ ] If in-flight tasks will exceed budget: pause the most expensive non-critical tasks

```bash
# Pause a specific non-critical task
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}/pause" \
  -d '{"reason": "budget_exhausted", "resume_after": "budget_reset"}'
```

### Step 8: Notify Stakeholders
- [ ] Notify user/team lead of budget exhaustion
- [ ] Provide options:
  1. **Wait for reset**: Budget resets at midnight UTC (safe, tasks delayed)
  2. **Request budget increase**: CEO approval required (fast, costs money)
  3. **Reprioritize**: Cancel non-critical tasks to free budget for critical work

### Step 9: If Budget Increase Requested
- [ ] Escalate to CEO with justification:
  ```
  Subject: Budget Increase Request - Paperclip Integration

  Current status: Budget 100% exhausted
  Remaining tasks: {count} critical tasks blocked
  Reset time: {midnight UTC, X hours away}
  Requested increase: {amount} tokens ({percentage}% of daily limit)
  Justification: {reason tasks cannot wait for reset}

  Options:
  A) Wait for midnight reset ({X} hours)
  B) Increase daily limit by {amount} (cost: ~${estimate})
  C) One-time token grant of {amount}
  ```

### Step 10: Post-Reset Recovery
After budget resets (midnight UTC or manual increase):
- [ ] Verify budget has reset
- [ ] Resume paused tasks
- [ ] Process queued tasks in priority order
- [ ] Post in #paperclip-ops: "Budget reset. Resuming normal operations."

```bash
# Resume paused submissions
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks/resume-submissions"

# Resume individually paused tasks
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks/{task_id}/resume"
```

---

## Prevention

After resolution, assess whether budget is appropriately sized:
- [ ] Review past 7 days of consumption data
- [ ] Check if budget was consumed by normal operation or anomaly
- [ ] If normal: recommend increasing daily limit (CEO decision)
- [ ] If anomaly: investigate the high-consumption task/agent
- [ ] Consider implementing per-agent budget caps at 80% (safety margin per Backend Engineer condition)

---

## Escalation

**On-call can handle independently:**
- Pause non-critical task submissions
- Monitor and wait for midnight reset
- Notify user of budget situation

**Escalate to Engineering Lead:**
- Budget consumption pattern is abnormal (single task consuming >50% of budget)
- Budget enforcement mechanism is not working (tasks accepted after 100%)

**Escalate to CEO:**
- Budget increase request (any amount)
- Recurring daily exhaustion (budget sizing issue)
- Budget overages >10% of daily limit

---

## Communication Templates

**Slack - 75% Warning:**
> Budget notice: Organization token budget at 75%. Burn rate: {X} tokens/hour. Estimated exhaustion: {time}. Monitoring.

**Slack - 90% Critical:**
> Budget alert: Organization token budget at 90%. Preparing to pause non-critical tasks if 100% is reached. {count} active tasks in progress.

**Slack - 100% Exhausted:**
> BUDGET EXHAUSTED: Token budget at 100%. New task submission paused. In-flight critical tasks continuing. Budget resets at midnight UTC ({X} hours). Contact CEO for emergency budget increase if needed.

**Slack - Reset/Resumed:**
> Budget reset: Organization token budget has reset. Resuming task submission. {count} queued tasks being processed.

**Email - CEO Budget Increase:**
> Subject: URGENT - Paperclip Budget Increase Required
>
> Daily token budget exhausted at {time}. {count} critical tasks blocked. Requesting {amount} token increase. Justification: {reason}. Alternative: wait {X} hours for midnight reset.
