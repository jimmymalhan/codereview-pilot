# On-Call Authority Matrix
## Paperclip Integration - Operations Authority and Escalation

**Owner**: Operations/DevOps Lead
**Created**: 2026-03-08
**Status**: COMPLETE

---

## Authority Levels

### Level 1: On-Call Independent (No Escalation Needed)

On-call engineer can take these actions immediately without approval:

| Action | Scope | Blast Radius | Runbook |
|--------|-------|-------------|---------|
| Kill failing agent process | Single agent | Agent restarts, queued work reassigned | #1 |
| Restart crashed agent | Single agent | Brief interruption | #1 |
| Acknowledge and investigate alerts | All | None (read-only) | All |
| Switch to local-only mode (API failure) | System-wide | Paperclip governance suspended | #2 |
| Pause new task submission (system overwhelmed) | System-wide | New tasks queued, in-flight continue | #4 |
| Execute rollback script (`rollback.sh`) | System-wide | Reverts to previous phase state | #1, #2 |
| Restore from local-only mode | System-wide | Governance re-enabled | #2 |
| Monitor and wait for budget reset | Budget | No tasks during wait period | #4 |

**Decision criteria**: Limited blast radius, automatically reversible, or covered by documented runbook procedure.

---

### Level 2: Escalate to Engineering Lead

On-call must escalate to the Engineering Lead before taking action on:

| Situation | Trigger Threshold | Contact |
|-----------|-------------------|---------|
| Budget overages >10% of daily limit | Budget used > 110% of limit | Engineering Lead (Slack DM / phone) |
| Approval deadlock lasting >1 hour | Task stuck in approval >1hr | Engineering Lead (Slack DM) |
| Audit trail gaps (potential data loss) | `audit_gaps_detected > 0` | Engineering Lead + Security (email) |
| Paperclip API failures lasting >30 min | API down >30 min | Engineering Lead (Slack DM / phone) |
| Agent fails to recover after restart | Same agent fails 3x in 24hr | Engineering Lead (Slack DM) |
| Rollback script fails or SLA exceeded | Rollback >10 min or errors | Engineering Lead (phone) |
| State machine appears broken | Tasks stuck in unexpected states | Engineering Lead (Slack DM) |

**Decision criteria**: Moderate blast radius, potential data implications, or requires technical judgment beyond runbook scope.

---

### Level 3: Escalate to CTO / CEO

On-call must escalate to CTO or CEO for:

| Situation | Trigger Threshold | Contact |
|-----------|-------------------|---------|
| Security incident | Suspicious activity, failed encryption | CTO (phone, immediate) |
| Governance violations | Unauthorized override attempted | CEO (phone) |
| Service outage >1 hour | System down or degraded >1hr | CTO (phone) |
| Data loss or corruption | Confirmed data loss | CTO + CEO (phone, immediate) |
| Paperclip API outage >1 hour | Vendor issue, SLA violation | CTO (phone) |
| Budget increase required | Any amount | CEO (email or Slack) |
| Repeated outages (3+ per week) | Systemic reliability concern | CTO (meeting request) |
| Regulatory notification needed | Audit gap with compliance impact | CEO + Legal (email) |
| Skeptic/Verifier override authorization | User requests governance override | CEO or Eng Lead only |

**Decision criteria**: High blast radius, security implications, financial decisions, or compliance requirements.

---

## Escalation Contact List

| Role | Primary Contact | Backup Contact | Hours |
|------|----------------|----------------|-------|
| On-Call Engineer | {TBD - assign rotation} | {TBD} | 24/7 |
| Engineering Lead | {Name} - Slack / Phone | {Backup} | Business hours + on-call |
| CTO | {Name} - Phone | {Backup} | Business hours + emergency |
| CEO | {Name} - Phone / Email | N/A | Business hours + emergency |
| Security Officer | {Name} - Email | {Backup} | Business hours + on-call |
| Paperclip Support | {Support email/phone} | {Ticket portal} | Per SLA |

**Note**: Contact information to be filled in by management before Phase 2 go-live.

---

## On-Call Rotation

| Week | Primary On-Call | Secondary On-Call |
|------|----------------|-------------------|
| TBD | TBD | TBD |

**Rotation schedule to be established before Phase 3 go-live.**

Requirements:
- Minimum 2 engineers in on-call rotation
- Primary responds within 5 minutes (PagerDuty)
- Secondary available as backup within 15 minutes
- No engineer on-call for more than 7 consecutive days
- Handoff checklist at rotation change

---

## Escalation Flowchart

```
ALERT FIRES
    |
    v
On-Call Acknowledges (< 5 min)
    |
    v
Is it in Level 1 (Independent Actions)?
    |           |
   YES          NO
    |           |
    v           v
Execute        Is it in Level 2 (Engineering Lead)?
Runbook            |           |
    |             YES          NO
    v              |           |
Resolve &          v           v
Post in         Contact     Contact CTO/CEO
#paperclip-ops  Eng Lead    (Level 3)
                   |           |
                   v           v
                Get guidance   Get decision
                   |           |
                   v           v
                Execute &    Execute &
                Report       Report
```

---

## Override Rate Monitoring

Track governance override frequency to detect systemic issues:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Daily override rate | > 20% of tasks | Escalate to CTO for governance review |
| Weekly override rate | > 10% of tasks | Review skeptic/verifier calibration |
| Same task type overridden 3+ times | Pattern detected | Engineering Lead reviews task type |
| Same authorizer overrides 5+ times/week | Concentration risk | CEO reviews delegation |

---

## Quarterly Drill Schedule

| Quarter | Drill Scenario | Participants | Duration |
|---------|---------------|--------------|----------|
| Q1 2026 | Agent timeout + rollback | On-call + Eng Lead | 1 hour |
| Q2 2026 | API outage + local-only mode | On-call + Eng Lead | 1 hour |
| Q3 2026 | Budget exhaustion + escalation | On-call + CEO | 30 min |
| Q4 2026 | Full rollback to Phase 0 | All ops | 1 hour |

**First drill**: Schedule within 1 week of Phase 2 completion.

---

## Sign-Off

| Role | Approved | Date |
|------|----------|------|
| Operations/DevOps Lead (author) | YES | 2026-03-08 |
| Engineering Lead | PENDING | - |
| CTO | PENDING | - |
| CEO | PENDING | - |
