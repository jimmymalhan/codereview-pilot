# Incident Response Procedures

**Status**: APPROVED
**Version**: 1.0
**Date**: 2026-03-08
**Owner**: Security/Compliance Officer
**Companion Document**: SECURITY_SPECIFICATION.md (Section 3)

---

## Purpose

Step-by-step procedures for responding to security incidents in the Paperclip integration. Each procedure follows the DETECT > TRIAGE > CONTAIN > ERADICATE > RECOVER > ANALYZE flow.

---

## Procedure 1: Unauthorized Access Detected (P0)

**Trigger**: Audit log shows action by unknown actor, or actor accessing paths outside their allowlist.

### Step 1: DETECT (SLA: 15 minutes)
1. Alert fires from audit trail anomaly detection or monitoring dashboard
2. On-call engineer acknowledges alert within 5 minutes
3. Open dedicated incident Slack channel: `#incident-YYYY-MM-DD-unauthorized-access`

### Step 2: TRIAGE (SLA: 15 minutes from detection)
1. Identify the unauthorized actor (agent name, user ID, or unknown entity)
2. Identify what was accessed (files, APIs, data)
3. Determine scope: single event or ongoing pattern?
4. Classify: confirmed unauthorized access vs. misconfiguration vs. false positive
5. If confirmed: escalate to Security Officer + CTO + CEO immediately

### Step 3: CONTAIN (SLA: 1 hour from detection)
1. **Kill affected agent processes**: `pkill -f 'paperclip.*<agent_name>'`
2. **Revoke affected API keys**: rotate ANTHROPIC_API_KEY immediately (do not wait for 30-day cycle)
3. **Disable Paperclip task routing**: pause all new task submissions
4. **Isolate audit logs**: export current audit log to secure external store before any further changes
5. **Block network access**: if external exfiltration suspected, isolate the host from network
6. Log all containment actions in audit trail (use emergency logging if primary is compromised)

### Step 4: ERADICATE
1. Identify root cause: how did unauthorized access occur?
   - Compromised API key?
   - Agent definition modified to bypass access control?
   - Paperclip vulnerability?
   - Misconfigured file access rules?
2. Remove the threat vector:
   - If key compromise: new key generated, old key revoked, all sessions invalidated
   - If agent tamper: restore agent definitions from known-good git commit
   - If Paperclip vulnerability: contact Paperclip security team, apply patch or workaround
3. Verify eradication: run audit chain integrity check, confirm no further unauthorized events

### Step 5: RECOVER
1. Restore agent definitions from verified git commit: `git checkout <known-good-sha> -- .claude/agents/`
2. Deploy new API key via handoff procedure (SECURITY_SPECIFICATION.md Section 1.3)
3. Re-enable Paperclip task routing
4. Run Phase 2 integration tests to verify system is functional
5. Monitor closely for 24 hours: set alert thresholds to high sensitivity

### Step 6: ANALYZE (SLA: 24 hours for RCA)
1. Construct timeline: first unauthorized event through containment
2. Determine data exposure: what was accessed, was anything exfiltrated?
3. Identify root cause and contributing factors
4. Document lessons learned
5. Propose remediation actions (new controls, updated access rules, etc.)
6. Publish post-incident report within 48 hours
7. Schedule follow-up review in 2 weeks to verify remediation effectiveness

### Notification
- Internal: Security Officer, CTO, CEO, Engineering Lead -- within 1 hour
- External (if user data affected): Legal review, then user notification within 4 hours
- Regulatory (if applicable): Within 72 hours per GDPR Art. 33

---

## Procedure 2: Audit Chain Integrity Failure (P1)

**Trigger**: Weekly integrity check or real-time monitor detects broken hash chain or invalid signature.

### Step 1: DETECT (SLA: 30 minutes)
1. Alert fires from audit chain verification job
2. On-call engineer acknowledges alert
3. Notify Security Officer

### Step 2: TRIAGE (SLA: 30 minutes from detection)
1. Identify the break point: which event has invalid hash or signature?
2. Determine scope: single entry or range of entries?
3. Check: is this data corruption (storage issue) or tampering (security issue)?
4. If tampering suspected: escalate to P0 and follow Procedure 1

### Step 3: CONTAIN (SLA: 2 hours from detection)
1. Export all audit logs to immutable external store immediately
2. Snapshot the Paperclip audit storage
3. Pause new audit log writes if corruption is ongoing
4. Do NOT delete or modify any existing log entries

### Step 4: ERADICATE
1. If storage corruption:
   - Identify failed storage component
   - Restore from most recent weekly export that passes integrity check
   - Replay events from application logs to fill gap (if possible)
2. If tampering:
   - Follow Procedure 1 (unauthorized access) for full investigation
   - Determine who had access to audit storage
   - Revoke and rotate audit signing key

### Step 5: RECOVER
1. Restore audit chain from last known-good state
2. Re-sign restored entries with new signing key if key was compromised
3. Resume audit logging
4. Run full integrity verification on restored chain
5. Monitor for 48 hours at high sensitivity

### Step 6: ANALYZE (SLA: 48 hours for RCA)
1. Document the gap: which events are missing or unverifiable?
2. Assess impact: were any decisions made based on tampered/missing records?
3. Identify root cause and remediation
4. Update integrity check frequency if needed (e.g., daily instead of weekly)
5. Publish post-incident report within 5 business days

---

## Procedure 3: API Key Exposure (P1)

**Trigger**: API key found in logs, committed to git, or detected in external scan.

### Step 1: DETECT (SLA: 30 minutes)
1. Pre-commit hook blocks commit containing key (prevention)
2. If hook bypassed: GitHub secret scanning alert, or manual discovery
3. On-call engineer acknowledges and notifies Security Officer

### Step 2: TRIAGE (SLA: 30 minutes from detection)
1. Determine which key was exposed (ANTHROPIC_API_KEY, Paperclip key, audit signing key)
2. Determine exposure scope: local log, git history, external service, public?
3. Check if key has been used by unauthorized party (review Anthropic usage dashboard)

### Step 3: CONTAIN (SLA: 2 hours from detection)
1. **Immediately rotate exposed key**:
   - Generate new key from provider dashboard
   - Update Paperclip secret store with new key
   - Update local .env
2. **Revoke exposed key** at provider (Anthropic, Paperclip)
3. If exposed in git:
   - Do NOT force-push to rewrite history (preserves audit trail)
   - Instead: revoke key (makes exposure harmless) and add to .gitignore if missing
4. If exposed in logs: purge affected log entries, update sanitization rules

### Step 4: ERADICATE
1. Identify how key was exposed:
   - Log sanitization missed a pattern?
   - Developer error (console.log of full response)?
   - .gitignore misconfiguration?
2. Fix the root cause:
   - Add missing sanitization pattern (SECURITY_SPECIFICATION.md Section 4.1)
   - Update pre-commit hook if needed
   - Add automated scanning for keys in CI/CD pipeline

### Step 5: RECOVER
1. Verify new key works in all environments
2. Run integration tests to confirm system is functional
3. Monitor Anthropic usage dashboard for 48 hours for unauthorized usage of old key
4. Confirm old key is fully revoked and returns 401

### Step 6: ANALYZE (SLA: 48 hours for RCA)
1. Document exposure window: when was key exposed, when was it revoked?
2. Assess unauthorized usage: any API calls made with exposed key?
3. Quantify impact: tokens consumed, data accessed
4. Update sanitization patterns and pre-commit hooks
5. Publish post-incident report

---

## Procedure 4: Agent Prompt Injection Attempt (P2)

**Trigger**: Input validation detects prompt injection markers, or agent produces unexpected output indicating manipulation.

### Step 1: DETECT (SLA: 1 hour)
1. Input validation flags suspicious content at task ingestion
2. OR: verifier agent rejects output that references non-existent entities (per CLAUDE.md rules)
3. On-call engineer reviews flagged content

### Step 2: TRIAGE (SLA: 1 hour from detection)
1. Examine the flagged input: what injection technique was attempted?
2. Did the injection succeed? Check agent output for:
   - References to files/APIs/regions not in evidence (verifier should catch this)
   - Attempts to access denied paths
   - Attempts to execute unauthorized commands
3. If injection succeeded: escalate to P1

### Step 3: CONTAIN (SLA: 4 hours from detection)
1. Reject the affected task
2. Log the injection attempt with full context (sanitized) in audit trail
3. If pattern is new: add to input validation rules immediately
4. If injection succeeded: isolate affected agent, review all outputs since last known-good state

### Step 4: ERADICATE
1. Update input validation patterns to catch this injection type
2. Review and strengthen agent system prompts if needed
3. Verify verifier agent correctly catches the output if injection bypasses input validation

### Step 5: RECOVER
1. Resume normal task processing
2. Monitor for similar injection patterns for 7 days

### Step 6: ANALYZE (SLA: 5 business days for RCA)
1. Document the injection technique
2. Assess: was this targeted or automated scanning?
3. Update threat model with new attack vector
4. Add regression test for this injection pattern
5. Share findings with team (anonymized)

---

## Procedure 5: Budget Manipulation Attempt (P2)

**Trigger**: Monitoring detects abnormal token consumption pattern, or budget enforcement bypassed.

### Step 1: DETECT (SLA: 1 hour)
1. Budget monitoring alerts on anomaly: sudden spike, consumption exceeding expected rate
2. On-call engineer reviews budget dashboard

### Step 2: TRIAGE (SLA: 1 hour from detection)
1. Identify which agent or task is consuming abnormal tokens
2. Is this legitimate (complex incident) or malicious (token draining)?
3. Check if budget enforcement is working (was threshold alert triggered at 75%, 90%?)

### Step 3: CONTAIN (SLA: 4 hours from detection)
1. Pause the high-consumption task
2. Set temporary reduced budget limit (50% of daily)
3. Review task inputs for manipulation (may be combined with prompt injection)

### Step 4: ERADICATE
1. If budget enforcement bug: fix enforcement logic
2. If input manipulation: follow Procedure 4 additionally
3. Verify budget thresholds are correctly configured

### Step 5: RECOVER
1. Restore normal budget limits after investigation
2. Resume paused tasks if they are legitimate
3. Verify budget tracking is accurate

### Step 6: ANALYZE
1. Quantify: how many excess tokens were consumed?
2. Assess: financial impact and whether it was preventable
3. Update budget anomaly detection thresholds

---

## Procedure 6: Governance Override Abuse (P1)

**Trigger**: Override rate exceeds 20% in a day, or unauthorized user attempts override.

### Step 1: DETECT (SLA: 30 minutes)
1. Monitoring alerts on override rate threshold
2. OR: audit log shows override by non-authorized user

### Step 2: TRIAGE (SLA: 30 minutes from detection)
1. Review all overrides in the alert window
2. Verify each override was by an authorized user (CEO or Engineering Lead only)
3. Check justifications: are they substantive or boilerplate?

### Step 3: CONTAIN (SLA: 2 hours from detection)
1. If unauthorized user: revoke their override capability immediately
2. If excessive rate: temporarily disable override capability, require CEO approval for each
3. Flag all override-approved tasks for manual review

### Step 4: ERADICATE
1. If authorization control failure: fix access control to enforce CEO/Engineering Lead only
2. If process abuse: address with personnel management (not a technical fix)
3. Review whether overridden tasks had correct outcomes

### Step 5: RECOVER
1. Re-enable override capability with stricter controls
2. Implement rate limiting on overrides (max 3 per day without CEO approval)

### Step 6: ANALYZE
1. Review all overridden tasks: did any cause harm?
2. Assess whether override criteria are too strict (causing legitimate overrides)
3. Adjust process if needed; update runbook

---

## General Incident Record Template

All incidents must be documented using this template:

```
INCIDENT RECORD
===============
Incident ID:     INC-YYYY-MM-DD-NNN
Severity:        P0 / P1 / P2 / P3
Status:          Open / Contained / Resolved / Closed
Detected:        <ISO8601 timestamp>
Contained:       <ISO8601 timestamp>
Resolved:        <ISO8601 timestamp>
Closed:          <ISO8601 timestamp>

Summary:         <One-line description>

Timeline:
  HH:MM - <event>
  HH:MM - <event>
  ...

Root Cause:      <Description>
Impact:          <What was affected, scope of exposure>
Remediation:     <What was done to fix>
Prevention:      <What changes prevent recurrence>
Lessons Learned: <Key takeaways>

Responders:      <Names and roles>
Approved By:     <Security Officer sign-off>
```

---

## Drill Schedule

| Drill | Frequency | Participants | Success Criteria |
|-------|-----------|-------------|-----------------|
| P0 tabletop exercise | Quarterly | All responders | Complete exercise in <2 hours |
| Key rotation drill | Monthly (first rotation, then every 30 days) | Security + Ops | Zero-downtime rotation completed |
| Audit chain verification | Weekly (automated) | System | Full chain verified, no gaps |
| Rollback drill | Quarterly | Ops + Engineering | Rollback completed in <10 minutes |
| Prompt injection test | Monthly | QA + Security | All known patterns caught by input validation |

---

**Document Version**: 1.0
**Approved By**: Security/Compliance Officer
**Date**: 2026-03-08
