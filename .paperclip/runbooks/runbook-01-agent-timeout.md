# Runbook #1: Agent Timeout / Heartbeat Missed

**Severity**: CRITICAL
**Trigger**: Agent misses 4 consecutive heartbeats (>120 seconds since last heartbeat)
**Alert**: `AgentHeartbeatMissed` in monitoring dashboard
**Expected Recovery Time**: 2-5 minutes
**On-Call Authority**: Can resolve independently (no escalation needed for initial response)

---

## Symptoms

- Monitoring dashboard shows agent heartbeat status RED (>120s)
- PagerDuty alert fires: "Agent {agent_name} heartbeat missed"
- Tasks routed to the affected agent are not progressing
- Other agents may be unaffected (check all 4: router, retriever, skeptic, verifier)

---

## Step-by-Step Response

### Step 1: Acknowledge Alert (< 1 minute)
- [ ] Acknowledge PagerDuty alert
- [ ] Note which agent is affected and the timestamp
- [ ] Post in #paperclip-ops: "Investigating agent heartbeat miss for {agent_name}"

### Step 2: Check Agent Status in Paperclip Dashboard (1-2 minutes)
- [ ] Open Paperclip dashboard: `${PAPERCLIP_DASHBOARD_URL}`
- [ ] Navigate to Agent Health panel
- [ ] Check if agent is listed as "unavailable" or "error"
- [ ] Note the last known heartbeat timestamp

### Step 3: Check Agent Logs (1-2 minutes)
- [ ] Check agent process logs:
  ```bash
  # Check if agent process is running
  ps aux | grep 'paperclip.*agent.*{agent_name}'

  # Check recent logs
  tail -100 /var/log/paperclip/{agent_name}.log

  # Look for error patterns
  grep -i 'error\|exception\|fatal\|timeout' /var/log/paperclip/{agent_name}.log | tail -20
  ```
- [ ] Common error patterns:
  - `ECONNREFUSED` -- Network issue to Paperclip API
  - `ENOMEM` -- Memory exhaustion
  - `ETIMEDOUT` -- API timeout
  - `429 Too Many Requests` -- Rate limited
  - No recent logs -- Process may be frozen/crashed

### Step 4: Resolve Based on Diagnosis

**If agent process is frozen (no logs, process exists):**
```bash
# Graceful shutdown first (SIGTERM)
kill -15 $(pgrep -f 'paperclip.*agent.*{agent_name}')

# Wait 10 seconds
sleep 10

# Force kill if still running (SIGKILL)
kill -9 $(pgrep -f 'paperclip.*agent.*{agent_name}') 2>/dev/null

# Paperclip should automatically reassign queued work
```

**If agent process has crashed (no process found):**
```bash
# Check if Paperclip auto-restarted the agent
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/agents/{agent_name}/status"

# If not auto-restarted, notify Paperclip to respawn
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/agents/{agent_name}/restart"
```

**If network issue (ECONNREFUSED, ETIMEDOUT):**
```bash
# Test connectivity to Paperclip API
curl -s -o /dev/null -w "%{http_code}" "${PAPERCLIP_API_URL}/health"

# Test DNS resolution
nslookup $(echo ${PAPERCLIP_API_URL} | sed 's|https\?://||;s|/.*||')

# Check local network
ping -c 3 $(echo ${PAPERCLIP_API_URL} | sed 's|https\?://||;s|/.*||')
```

### Step 5: Verify Recovery (1-2 minutes)
- [ ] Confirm agent heartbeat resumes in monitoring dashboard
- [ ] Confirm heartbeat interval returns to < 30 seconds
- [ ] Check that queued tasks are being processed
- [ ] Verify no orphaned tasks remain in "classifying" or "awaiting" state

### Step 6: Post-Incident (5 minutes)
- [ ] Post resolution in #paperclip-ops:
  ```
  RESOLVED: Agent {agent_name} heartbeat recovered.
  Root cause: {frozen process | crash | network issue}
  Duration: {X} minutes
  Tasks affected: {count}
  Action taken: {kill/restart | network fix}
  ```
- [ ] If this is the 3rd occurrence in 24 hours, escalate to engineering lead

---

## Escalation

**Escalate to Engineering Lead if:**
- Agent does not recover after kill + restart
- Issue persists > 10 minutes
- Multiple agents are affected simultaneously
- Same agent has failed 3+ times in 24 hours

**Escalation template:**
```
ESCALATION: Agent {agent_name} heartbeat failure
Duration: {X} minutes (not recovering)
Steps taken: {list actions taken}
Current state: {describe current state}
Tasks affected: {count}
Requesting: Engineering investigation
```

---

## Communication Templates

**Slack - Initial Investigation:**
> Investigating: Agent `{agent_name}` heartbeat missed at {timestamp}. Checking agent status and logs. Will update in 5 minutes.

**Slack - Resolved:**
> Resolved: Agent `{agent_name}` heartbeat recovered after {duration}. Root cause: {cause}. No further action needed.

**Slack - Escalating:**
> Escalating: Agent `{agent_name}` unresponsive for {duration}. Initial troubleshooting unsuccessful. Paging engineering lead.
