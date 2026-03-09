# Runbook #5: Audit Trail Gap

**Severity**: CRITICAL
**Trigger**: Audit logger detects missing decision record (`paperclip_audit_gaps_detected > 0`)
**Alert**: `AuditGapDetected`
**Expected Resolution Time**: 2-4 hours (investigation)
**On-Call Authority**: Can investigate and document; must escalate to security team for remediation

---

## Symptoms

- Monitoring dashboard "Audit Gap Status" shows value > 0
- Audit events rate may show sudden drop or gap in timeline
- Task completed but no corresponding approval record in audit trail
- Audit verification timestamp may be stale

---

## Step-by-Step Response

### Step 1: Acknowledge and Assess Severity (< 2 minutes)
- [ ] Acknowledge PagerDuty alert
- [ ] Post in #paperclip-ops: "CRITICAL: Audit trail gap detected. Investigating."
- [ ] This is a compliance-sensitive event -- treat with high priority

### Step 2: Identify the Gap (5-10 minutes)
```bash
# Query audit trail for gaps
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/gaps" \
  | jq '.[] | {gap_start, gap_end, missing_events, affected_tasks}'

# Get recent audit events to identify timeline
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/events?limit=50&order=desc" \
  | jq '.[] | {timestamp, event_type, task_id, agent_name}'

# Check audit verification status
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/verification" \
  | jq '{last_verified, status, gaps_found, integrity_hash}'
```

- [ ] Record: gap start time, gap end time, which events are missing
- [ ] Record: which tasks are affected by the gap
- [ ] Determine: is the gap still growing (ongoing) or historical (closed)?

### Step 3: Determine Root Cause

**Possible causes:**

**A) Audit lag (not data loss):**
- Events were generated but audit logger is behind
- Check audit logger process health
```bash
# Check audit logger status
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/logger/status" \
  | jq '{status, queue_depth, lag_seconds}'
```
- If lag < 5 minutes: likely transient, monitor for self-resolution

**B) Audit logger process failure:**
```bash
# Check if audit logger process is running
ps aux | grep 'paperclip.*audit'

# Check audit logger logs for errors
tail -50 /var/log/paperclip/audit-logger.log | grep -i 'error\|fatal'
```
- If process crashed: restart and check if events are recovered from queue

**C) Paperclip API audit endpoint failure:**
- Audit writes may have failed at the API level
- Check Paperclip API logs for audit write errors

**D) Actual data loss:**
- Events were not generated at all
- Most serious scenario -- requires manual reconstruction

### Step 4: Assess Impact
- [ ] How many tasks are affected?
- [ ] Were any approval decisions made during the gap?
- [ ] Were any governance overrides performed during the gap?
- [ ] Is there any secondary evidence (Slack messages, agent logs) that can reconstruct the timeline?

### Step 5: Attempt Recovery

**If audit lag (Cause A):**
- [ ] Wait for lag to resolve (monitor queue depth)
- [ ] Verify events appear once lag clears
- [ ] No further action needed

**If logger process failure (Cause B):**
```bash
# Restart audit logger
# (Exact command depends on Phase 2/3 implementation)

# Check if events were buffered and can be replayed
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/replay" \
  -d '{"from": "{gap_start_timestamp}", "to": "{gap_end_timestamp}"}'
```

**If actual data loss (Cause D):**
- [ ] Begin manual audit reconstruction
- [ ] Collect evidence from:
  - Agent logs (`/var/log/paperclip/{agent_name}.log`)
  - Paperclip API task history
  - Slack notifications sent during the gap period
  - Git commit history (if any code changes were made)
- [ ] For each affected task, reconstruct:
  - Task ID and type
  - Creation timestamp
  - Approval chain (who approved at each stage)
  - Final decision and timestamp
  - Any overrides applied

### Step 6: Document the Gap
Create a gap report regardless of cause:

```markdown
## Audit Trail Gap Report

**Gap ID**: GAP-{YYYY-MM-DD}-{sequence}
**Gap Start**: {timestamp}
**Gap End**: {timestamp}
**Duration**: {minutes}
**Root Cause**: {lag | logger failure | API failure | data loss}
**Tasks Affected**: {list of task IDs}
**Events Missing**: {count and types}
**Recovery**: {recovered from queue | manually reconstructed | unrecoverable}
**Reconstructed Events**: {count}
**Remaining Gaps**: {count, if any}
**Investigated By**: {on-call name}
**Timestamp**: {investigation timestamp}
```

### Step 7: Escalate to Security Team
- [ ] Send gap report to security team email: `${SECURITY_EMAIL_LIST}`
- [ ] Security team must:
  - Review the gap for compliance implications
  - Verify no unauthorized actions occurred during the gap
  - Sign off on any manually reconstructed records
  - Determine if external notification is required (regulatory)

### Step 8: Verify Resolution
- [ ] Confirm `paperclip_audit_gaps_detected` returns to 0
- [ ] Run manual audit verification:
```bash
# Trigger integrity verification
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/verify"

# Check result
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/audit/verification" \
  | jq '{status, last_verified, integrity_valid}'
```
- [ ] Confirm audit events are flowing normally (check events rate panel)

### Step 9: Post-Incident
- [ ] Post resolution in #paperclip-ops
- [ ] File gap report in audit archive
- [ ] If cause was process failure: recommend adding audit logger health to heartbeat monitoring
- [ ] If cause was data loss: recommend implementing audit event buffering/replay

---

## Escalation

**On-call handles independently:**
- Investigation and root cause identification
- Restarting audit logger process
- Documenting the gap

**Escalate to Engineering Lead:**
- Audit logger process repeatedly failing
- Gap recovery mechanisms not working
- Need to implement manual reconstruction

**Escalate to Security Team (mandatory):**
- Any confirmed audit trail gap (regardless of cause)
- Gaps during periods when governance overrides occurred
- Gaps that cannot be fully reconstructed

**Escalate to CTO/CEO:**
- Regulatory notification may be required
- Repeated audit gaps (systemic reliability issue)
- Gap during a security incident

---

## Communication Templates

**Slack - Initial:**
> CRITICAL: Audit trail gap detected at {timestamp}. {count} events potentially missing. Investigating root cause. Security team will be notified.

**Slack - Root Cause Identified:**
> UPDATE: Audit gap root cause: {cause}. Duration: {X} minutes. {count} tasks affected. {Recovering from buffer / Manual reconstruction required}.

**Slack - Resolved:**
> RESOLVED: Audit trail gap closed. Root cause: {cause}. {count}/{total} events recovered. Gap report filed. Security team notified for review.

**Email - Security Team:**
> Subject: AUDIT TRAIL GAP REPORT - {date}
>
> An audit trail gap was detected at {timestamp}. Duration: {X} minutes. Root cause: {cause}. {count} tasks affected. Please review attached gap report for compliance implications. Manual reconstruction records attached where applicable.
