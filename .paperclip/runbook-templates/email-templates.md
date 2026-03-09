# Email Templates for Escalation Communication
## Paperclip Integration - Operational Runbooks

**Owner**: Operations/DevOps Lead

---

## Runbook #2: CTO Escalation - Paperclip API Outage >1 Hour

```
To: {CTO email}
Cc: {Engineering Lead email}
Subject: ESCALATION - Paperclip API Outage > 1 hour

Hi {CTO name},

Paperclip API has been unavailable since {timestamp} ({duration} so far).

Current status:
- System operating in local-only mode (Paperclip governance suspended)
- {count} tasks processed without governance during outage
- Paperclip support contacted: {yes/no} (ticket #{number})
- Paperclip status page: {incident description / shows healthy}

Impact:
- No task orchestration, approval gates, or budget tracking
- Audit trail has a gap for the outage period
- {count} tasks queued pending API recovery

Requesting guidance on:
1. Continue in local-only mode or pause all operations?
2. Escalate to Paperclip vendor management?
3. Trigger contractual SLA review?

On-call: {name}
Phone: {number}
```

---

## Runbook #4: CEO Budget Increase Request

```
To: {CEO email}
Cc: {Engineering Lead email}
Subject: URGENT - Paperclip Budget Increase Required

Hi {CEO name},

Daily token budget for Paperclip integration was exhausted at {timestamp}.

Current status:
- Budget: 100% consumed ({tokens_used}/{tokens_limit} tokens)
- New task submission: PAUSED
- In-flight tasks: {count} (critical tasks still completing)
- Budget resets: midnight UTC ({hours} hours away)

Blocked work:
- {count} tasks queued, cannot be processed until budget resets
- Critical items: {list any urgent tasks}

Options:
A) Wait for midnight UTC reset ({hours} hours) - $0 additional cost
B) Increase daily limit by {amount} tokens - estimated cost: ~${estimate}/day
C) One-time token grant of {amount} - estimated cost: ~${estimate}

Recommendation: {A/B/C} because {reason}

On-call: {name}
```

---

## Runbook #5: Security Team - Audit Trail Gap Report

```
To: {Security team email}
Cc: {CTO email}, {Engineering Lead email}
Subject: AUDIT TRAIL GAP REPORT - {date}

Security Team,

An audit trail gap was detected and investigated. Please review for compliance implications.

Gap details:
- Gap ID: GAP-{YYYY-MM-DD}-{sequence}
- Gap start: {timestamp}
- Gap end: {timestamp}
- Duration: {minutes} minutes
- Root cause: {audit lag | logger failure | API failure | data loss}

Impact:
- Tasks affected: {list of task IDs}
- Events missing: {count} ({event types})
- Approval decisions during gap: {yes/no - details}
- Governance overrides during gap: {yes/no - details}

Recovery:
- Events recovered: {count}/{total}
- Recovery method: {buffer replay | manual reconstruction | unrecoverable}
- Remaining gaps: {count, description}

Compliance assessment needed:
- [ ] Were any unauthorized actions taken during the gap?
- [ ] Is external notification required (regulatory)?
- [ ] Are manually reconstructed records acceptable for audit?

Full gap report attached.

Investigated by: {on-call name}
Date: {date}
```

---

## Runbook #6: Override Notification to Stakeholders

```
To: {Relevant stakeholders}
Subject: Governance Override Executed - Task {task_id}

A governance override was executed on the Paperclip integration.

Details:
- Task ID: {task_id}
- Blocked by: {Skeptic / Verifier}
- Original concerns: {skeptic/verifier concerns}
- Override authorized by: {name} ({role})
- Justification: {written justification}
- Timestamp: {timestamp}

This override has been logged in the audit trail.

No action required unless you have concerns about this override.

On-call: {name}
```

---

## General: Service Outage Notification

```
To: {Stakeholder distribution list}
Subject: Paperclip Integration - Service {Degradation/Outage} Notice

Team,

The Paperclip integration is currently experiencing {degradation/an outage}.

Status: {description}
Start time: {timestamp}
Duration so far: {minutes}
Impact: {description of impact on operations}
Current mitigation: {what on-call is doing}

Next update: {estimated time}

On-call: {name}
```

---

## General: Service Recovery Notification

```
To: {Stakeholder distribution list}
Subject: Paperclip Integration - Service Restored

Team,

The Paperclip integration has been restored to normal operation.

Outage start: {timestamp}
Recovery time: {timestamp}
Total duration: {minutes}
Root cause: {brief description}
Tasks affected: {count}

Post-incident review will be scheduled within 24 hours.

On-call: {name}
```
