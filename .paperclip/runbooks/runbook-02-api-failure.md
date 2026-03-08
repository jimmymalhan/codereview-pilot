# Runbook #2: Paperclip API Failure

**Severity**: CRITICAL
**Trigger**: Paperclip API returns 5xx errors or is unreachable
**Alert**: Multiple agent heartbeat misses or explicit API health check failure
**Expected Recovery Time**: 15-30 minutes (or escalate)
**On-Call Authority**: Can switch to local-only mode independently; escalate to CTO if >1 hour

---

## Symptoms

- Multiple agents losing heartbeat simultaneously
- API calls returning 500, 502, 503, or connection refused
- Tasks stuck in pending state (not being routed)
- Monitoring dashboard shows API connectivity errors

---

## Step-by-Step Response

### Step 1: Acknowledge and Confirm (< 2 minutes)
- [ ] Acknowledge PagerDuty alert
- [ ] Post in #paperclip-ops: "Investigating potential Paperclip API outage"
- [ ] Check Paperclip status page: `${PAPERCLIP_STATUS_PAGE_URL}`

### Step 2: Verify API Status (2-3 minutes)
```bash
# Health check
curl -v -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/health"

# Test task submission (read-only)
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/tasks?limit=1"

# Check response time
curl -s -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" \
  -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/health"
```

- [ ] Record HTTP status code and response time
- [ ] Determine if this is: total outage, partial degradation, or local network issue

### Step 3: Determine Scope

**If Paperclip status page shows incident:**
- [ ] Note the incident description and ETA
- [ ] Proceed to Step 4 (local-only mode)
- [ ] Monitor status page for updates

**If Paperclip status page shows healthy (possible local issue):**
```bash
# Test from different network path if available
# Check DNS
nslookup $(echo ${PAPERCLIP_API_URL} | sed 's|https\?://||;s|/.*||')

# Check if issue is TLS
openssl s_client -connect $(echo ${PAPERCLIP_API_URL} | sed 's|https\?://||;s|/.*||'):443 -servername $(echo ${PAPERCLIP_API_URL} | sed 's|https\?://||;s|/.*||') < /dev/null 2>&1 | head -5

# Check local firewall/proxy
curl -s --connect-timeout 5 "https://api.example.com" 2>&1 | head -5
```

### Step 4: Switch to Local-Only Mode (5 minutes)
If API is confirmed down and recovery is not imminent:

```bash
# Enable local-only mode (disable Paperclip routing)
# This allows the debug copilot to operate without Paperclip orchestration
export PAPERCLIP_ENABLED=false

# Restart the application in local mode
# Tasks will be processed by local agents without Paperclip governance
cd /path/to/claude-debug-copilot
node src/run.js  # Runs with local agents only
```

**Important limitations of local-only mode:**
- No Paperclip task orchestration or routing
- No approval state machine enforcement
- No budget tracking
- No centralized audit logging
- Manual governance only (CLAUDE.md rules still apply)

- [ ] Post in #paperclip-ops: "Switched to local-only mode. Paperclip governance suspended."
- [ ] Queue new incident tasks locally pending Paperclip recovery

### Step 5: Contact Paperclip Support (if SLA violated)
- [ ] Check SLA terms for response time commitment
- [ ] Contact Paperclip support:
  - Email: `${PAPERCLIP_SUPPORT_EMAIL}`
  - Urgent: `${PAPERCLIP_SUPPORT_PHONE}`
  - Ticket: `${PAPERCLIP_SUPPORT_PORTAL_URL}`
- [ ] Include in support request:
  ```
  Subject: API Outage - {org_name} - {timestamp}

  Observed behavior: {describe errors}
  HTTP status codes: {codes}
  Duration so far: {minutes}
  Impact: {number of agents affected, tasks blocked}
  Our API key prefix: {first 8 chars of API key}

  Requesting immediate investigation and ETA for resolution.
  ```

### Step 6: Monitor Recovery
```bash
# Poll health endpoint every 30 seconds
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
    "${PAPERCLIP_API_URL}/health")
  echo "$(date): HTTP $STATUS"
  if [[ "$STATUS" == "200" ]]; then
    echo "API RECOVERED"
    break
  fi
  sleep 30
done
```

### Step 7: Restore from Local-Only Mode (when API recovers)
```bash
# Re-enable Paperclip routing
export PAPERCLIP_ENABLED=true

# Restart application with Paperclip integration
cd /path/to/claude-debug-copilot
# Application restart procedure (Phase 2 will define exact steps)

# Verify agents reconnect
curl -s -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/agents" | jq '.[] | {name, status}'
```

- [ ] Verify all 4 agents reconnect and heartbeat resumes
- [ ] Process any locally queued tasks through Paperclip
- [ ] Verify audit trail has no gaps from the outage period

### Step 8: Post-Incident (10 minutes)
- [ ] Post resolution in #paperclip-ops
- [ ] Document outage timeline (start, detection, local-only switch, recovery, restore)
- [ ] Log any tasks that were processed without Paperclip governance
- [ ] Request post-mortem from Paperclip team if outage > 30 minutes

---

## Escalation

**Escalate to Engineering Lead if:**
- API is down > 30 minutes
- Local-only mode is not functioning
- Data inconsistency detected after recovery

**Escalate to CTO/CEO if:**
- API outage > 1 hour
- Paperclip support unresponsive
- Repeated outages (3+ in a week)
- SLA violation requiring contractual action

**Escalation template:**
```
ESCALATION: Paperclip API Outage
Duration: {X} minutes
Status page: {incident/healthy}
Current mode: {local-only / degraded}
Paperclip support contacted: {yes/no, ticket #}
Tasks affected: {count}
Requesting: {CTO decision on continued operation / vendor escalation}
```

---

## Communication Templates

**Slack - Initial:**
> Investigating: Paperclip API connectivity issues detected at {timestamp}. Multiple agents affected. Checking API health and status page.

**Slack - Local-Only Mode:**
> UPDATE: Paperclip API confirmed down. Switched to local-only mode at {timestamp}. Paperclip governance is suspended. Tasks will be processed locally with manual governance only. Monitoring for API recovery.

**Slack - Recovered:**
> RESOLVED: Paperclip API recovered at {timestamp}. Outage duration: {X} minutes. Restored full Paperclip integration. Verifying agent reconnection and audit trail integrity.

**Email - CTO Escalation:**
> Subject: ESCALATION - Paperclip API Outage > 1 hour
>
> Paperclip API has been unavailable for {duration}. System is operating in local-only mode (no governance). Paperclip support has been contacted (ticket #{number}). Requesting guidance on continued operation and vendor escalation.
