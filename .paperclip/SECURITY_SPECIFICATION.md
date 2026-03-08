# Security Specification: Paperclip Integration

**Status**: APPROVED BY SECURITY OFFICER
**Version**: 1.0
**Date**: 2026-03-08
**Owner**: Security/Compliance Officer
**Scope**: Encryption, audit trail, incident response, and compliance for Phases 2-4

---

## 1. Encryption Specification

### 1.1 Transport Encryption (In Transit)

| Property | Requirement |
|----------|-------------|
| Protocol | TLS 1.3 minimum (TLS 1.2 REJECTED) |
| Cipher suites | TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256 |
| Key exchange | X25519 or P-256 ECDHE only |
| Certificate validation | Full chain validation against trusted CA bundle |
| Certificate pinning | Pin Paperclip API leaf certificate SHA-256 fingerprint |
| Pin update mechanism | Backup pin for rotation; update pins 14 days before cert expiry |
| HSTS | Enforce strict-transport-security on all endpoints |
| Downgrade protection | Reject any connection below TLS 1.3 |

**Implementation Notes**:
- Node.js `https` agent must be configured with `minVersion: 'TLSv1.3'`
- Certificate pinning implemented via `checkServerIdentity` callback in Node.js tls options
- Pin storage: hardcoded in source (not .env) for integrity; rotate via code deployment

### 1.2 Encryption at Rest

| Property | Requirement |
|----------|-------------|
| Algorithm | AES-256-GCM |
| Key derivation | HKDF-SHA256 from master key |
| IV/Nonce | 96-bit random nonce per encryption operation; never reused |
| Authentication tag | 128-bit GCM tag verified on every read |
| Scope | All Paperclip-stored task data, audit logs, agent outputs |

**What is encrypted at rest**:
- Task payloads (incident descriptions, agent outputs)
- Audit log entries (stored in Paperclip)
- Agent configuration data transmitted to Paperclip
- Budget and usage records

**What is NOT encrypted at rest locally**:
- CLAUDE.md (public project rules, no secrets)
- Agent definition files (.claude/agents/*.md) -- contain no secrets
- PAPERCLIP_AUDIT.md -- contains no secrets (verified in Phase 1)

### 1.3 API Key Management

| Property | Requirement |
|----------|-------------|
| Current storage | .env file (local only, gitignored, pre-commit hook protected) |
| Target storage | Paperclip-managed secret store (Phase 2 migration) |
| Encryption method | Envelope encryption: API_KEY encrypted with Paperclip's RSA-2048+ public key |
| Rotation period | Every 30 days |
| Rotation mechanism | Zero-downtime dual-key window (see procedure below) |

**API Key Handoff Procedure (Local .env to Paperclip Secret Store)**:

```
Step 1: Generate new API key from Anthropic dashboard
Step 2: Encrypt new key with Paperclip's public key (envelope encryption)
Step 3: Upload encrypted key to Paperclip secret store via authenticated API
Step 4: Paperclip decrypts with its private key, stores in its vault
Step 5: Verify Paperclip can use the new key (test API call)
Step 6: Update local .env with new key (for local development fallback)
Step 7: Revoke old key from Anthropic dashboard after 24-hour grace period
Step 8: Log rotation event in audit trail
```

**Zero-Downtime Key Rotation Procedure**:

```
Hour 0:    Generate new API key (KEY_B); old key (KEY_A) still active
Hour 0-1:  Upload KEY_B to Paperclip secret store
Hour 1:    Configure Paperclip to use KEY_B for new requests
Hour 1-2:  Verify KEY_B works (test calls succeed)
Hour 2-24: Grace period -- both KEY_A and KEY_B valid at Anthropic
Hour 24:   Revoke KEY_A at Anthropic dashboard
Hour 24:   Remove KEY_A from all stores
Hour 24:   Audit log entry: "KEY_A revoked, KEY_B is sole active key"
```

**Key Rotation Alerting**:
- Day 25: Warning alert -- "API key rotation due in 5 days"
- Day 29: Urgent alert -- "API key rotation due tomorrow"
- Day 30: Critical alert -- "API key rotation overdue"
- Day 35: Escalation -- auto-notify CTO if key not rotated

### 1.4 mTLS Evaluation (Phase 2.1 Capability Gate)

During the Phase 2.1 Capability Gate call with Paperclip team, evaluate:
- [ ] Does Paperclip support mTLS for client authentication?
- [ ] Can we provision a client certificate for this integration?
- [ ] What is the certificate lifecycle management overhead?

**If mTLS is supported**: Implement as primary authentication; API key as fallback.
**If mTLS is not supported**: API key with envelope encryption is acceptable for Phase 2-3. Revisit mTLS in Phase 4.

---

## 2. Audit Trail Specification

### 2.1 Architecture

```
+-------------------+       +----------------------+       +-------------------+
| Agent Action      | ----> | Audit Logger         | ----> | Primary Store     |
| (task, approval,  |       | (sign + append)      |       | (Paperclip vault) |
| budget, override) |       |                      |       |                   |
+-------------------+       +----------+-----------+       +-------------------+
                                       |
                                       v
                            +----------+-----------+
                            | Weekly Export         |
                            | (encrypted, signed)  |
                            +----------+-----------+
                                       |
                                       v
                            +----------+-----------+
                            | Immutable External   |
                            | Store (S3 + Object   |
                            | Lock / Vault)        |
                            +----------------------+
```

### 2.2 Audit Log Entry Schema

Every auditable event produces a log entry with this structure:

```json
{
  "version": "1.0",
  "event_id": "<UUIDv4>",
  "timestamp": "<ISO8601 with timezone>",
  "event_type": "<see event types below>",
  "actor": {
    "type": "agent | user | system",
    "id": "<agent name or user ID>",
    "role": "<router | retriever | skeptic | verifier | approver | admin>"
  },
  "task": {
    "task_id": "<Paperclip task ID>",
    "incident_id": "<incident reference, if applicable>"
  },
  "action": {
    "description": "<human-readable action description>",
    "input_hash": "<SHA-256 of input data>",
    "output_hash": "<SHA-256 of output data>",
    "decision": "<approve | reject | escalate | override | null>",
    "justification": "<reason for decision, if applicable>"
  },
  "context": {
    "budget_consumed": "<tokens used for this action>",
    "budget_remaining": "<tokens remaining>",
    "files_accessed": ["<list of file paths read or written>"],
    "phase": "<Phase 2 | Phase 3 | Phase 4>"
  },
  "integrity": {
    "previous_event_hash": "<SHA-256 of previous log entry -- chain linkage>",
    "signature": "<HMAC-SHA256 or RSA signature of this entry>",
    "signing_key_id": "<key identifier used for signature>"
  }
}
```

### 2.3 Auditable Event Types

| Event Type | Trigger | Required Fields |
|------------|---------|----------------|
| `task.created` | New task submitted | task_id, actor, input_hash |
| `task.routed` | Router classifies task | task_id, decision (classification), actor |
| `task.retrieved` | Retriever gathers evidence | task_id, files_accessed, output_hash |
| `task.skeptic_review` | Skeptic produces alternative theory | task_id, decision, justification |
| `task.verified` | Verifier accepts or rejects | task_id, decision, justification |
| `task.approved` | Approver grants final approval | task_id, decision, actor |
| `task.rejected` | Any stage rejects | task_id, decision, justification, actor |
| `task.completed` | Task reaches terminal state | task_id, output_hash |
| `budget.consumed` | Tokens used | task_id, budget_consumed, budget_remaining |
| `budget.threshold` | Budget hits 75%, 90%, 100% | budget_remaining, threshold_level |
| `override.requested` | User requests skeptic/verifier override | task_id, actor, justification |
| `override.approved` | Override granted by authorized user | task_id, actor (CEO/eng lead), justification |
| `key.rotated` | API key rotation completed | old_key_hash, new_key_hash, actor |
| `agent.heartbeat_missed` | Agent missed 4 consecutive heartbeats | actor (agent), timestamp |
| `system.rollback` | Rollback executed | actor, phase, justification |
| `incident.detected` | Security incident detected | description, severity, actor |
| `incident.contained` | Incident contained | incident_id, containment_actions |

### 2.4 Integrity Controls

**Cryptographic Signatures**:
- Every audit log entry is signed with HMAC-SHA256 using a dedicated audit signing key
- Signing key is stored in Paperclip's secret store (not in .env)
- Signing key rotated every 90 days (separate from API key rotation)

**Hash Chain Linkage**:
- Each entry includes `previous_event_hash` (SHA-256 of the prior entry)
- First entry in chain uses a well-known genesis hash: SHA-256("PAPERCLIP_AUDIT_GENESIS_V1")
- Chain breakage triggers immediate `incident.detected` alert

**Tamper Detection**:
- Weekly integrity verification job: walk the hash chain, verify all signatures
- Any verification failure triggers critical alert and incident response
- Verification results logged as `system.integrity_check` event

**Append-Only Storage**:
- Paperclip audit store configured as append-only (no UPDATE or DELETE operations)
- Storage backend must support write-once-read-many (WORM) semantics
- If Paperclip does not natively support WORM: implement application-level append-only enforcement with deletion attempts logged as security events

### 2.5 Export and Backup

| Property | Requirement |
|----------|-------------|
| Export frequency | Weekly (every Sunday 02:00 UTC) |
| Export format | NDJSON (newline-delimited JSON), gzipped |
| Export encryption | AES-256-GCM with export-specific key |
| Export destination | S3 bucket with Object Lock (compliance mode) or equivalent |
| Object Lock retention | 2 years (matching retention policy) |
| Export verification | SHA-256 manifest file accompanies each export |
| Export monitoring | Alert if weekly export fails or is delayed >4 hours |

### 2.6 Retention Policy

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| Audit log entries | 2 years from creation | Automatic expiry after retention period |
| Weekly exports | 2 years from export date | S3 lifecycle policy |
| Incident records | 3 years (extended retention) | Manual review before deletion |
| Budget records | 1 year | Automatic expiry |

**GDPR Compatibility Note**:
- Audit logs may contain user identifiers (who approved, who overrode)
- To satisfy right-to-erasure: pseudonymize user identifiers in audit logs using a reversible mapping table
- Mapping table can be deleted to effectively anonymize logs while preserving audit chain integrity
- Incident descriptions containing PII must be sanitized before audit logging (see Section 4)

---

## 3. Incident Response Procedures

### 3.1 Severity Classification

| Severity | Definition | Examples | Response SLA |
|----------|-----------|----------|-------------|
| **P0 - Critical** | Active exploitation, data breach, or system compromise | Unauthorized access, data exfiltration, malicious code execution | Detection: 15min, Containment: 1hr |
| **P1 - High** | Security control failure with potential for exploitation | Audit chain broken, encryption failure, key exposure | Detection: 30min, Containment: 2hr |
| **P2 - Medium** | Security anomaly requiring investigation | Unusual override rate, unexpected file access, budget anomaly | Detection: 1hr, Containment: 4hr |
| **P3 - Low** | Minor security observation | Failed authentication attempt, configuration drift | Detection: 4hr, Containment: 24hr |

### 3.2 Response SLAs

| Phase | P0 SLA | P1 SLA | P2 SLA | P3 SLA |
|-------|--------|--------|--------|--------|
| **Detection** | 15 minutes | 30 minutes | 1 hour | 4 hours |
| **Containment** | 1 hour | 2 hours | 4 hours | 24 hours |
| **User notification** | 4 hours | 8 hours | 24 hours | 72 hours |
| **Root cause analysis** | 24 hours | 48 hours | 5 business days | 10 business days |
| **Post-incident report** | 48 hours | 5 business days | 10 business days | 20 business days |

### 3.3 Response Flow

```
DETECT ──> TRIAGE ──> CONTAIN ──> ERADICATE ──> RECOVER ──> ANALYZE
  │           │          │           │             │           │
  │           │          │           │             │           └─ Post-incident report
  │           │          │           │             └─ Restore normal operations
  │           │          │           └─ Remove threat, patch vulnerability
  │           │          └─ Isolate affected systems, pause agents
  │           └─ Classify severity (P0-P3), assign responder
  └─ Alert fires from monitoring, audit chain, or manual report
```

See `.paperclip/incident-response-procedures.md` for step-by-step procedures for each phase.

### 3.4 Escalation Matrix

| Condition | Notify | Escalate To | Timeline |
|-----------|--------|-------------|----------|
| P0 detected | Security Officer + CTO + CEO | All hands incident call | Immediate |
| P1 detected | Security Officer + Engineering Lead | Security team standup | Within 30 min |
| P2 detected | Security Officer | Engineering Lead (if needed) | Within 1 hour |
| P3 detected | On-call engineer | Security Officer (if pattern) | Within 4 hours |
| Containment SLA missed | Engineering Lead | CTO | Immediately on SLA breach |
| User notification SLA missed | Security Officer | CEO + Legal | Immediately on SLA breach |

### 3.5 Communication Plan

**Internal Communication**:
- P0/P1: Dedicated incident Slack channel created automatically
- P0/P1: Status updates every 30 minutes until containment
- P2/P3: Updates in security channel, daily summary

**External Communication (if user data affected)**:
- Legal review before any external communication
- User notification via email within SLA window
- Include: what happened, what data affected, what we are doing, what user should do
- Follow-up communication when RCA is complete

---

## 4. Data Handling and Sanitization

### 4.1 Log Sanitization Layer

All data passing through the logging pipeline must be sanitized before storage:

**PII Detection Patterns** (regex-based, applied before audit logging):

| Pattern | Type | Action |
|---------|------|--------|
| Email addresses | PII | Replace with `[EMAIL_REDACTED]` |
| IP addresses | PII | Replace with `[IP_REDACTED]` |
| API keys / tokens | Secret | Replace with `[KEY_REDACTED:<last4chars>]` |
| Credit card numbers | PCI | Replace with `[CC_REDACTED]` |
| Social security numbers | PII | Replace with `[SSN_REDACTED]` |
| Phone numbers | PII | Replace with `[PHONE_REDACTED]` |
| AWS/GCP/Azure credentials | Secret | Replace with `[CLOUD_CRED_REDACTED]` |
| JWT tokens | Secret | Replace with `[JWT_REDACTED]` |
| Connection strings | Secret | Replace with `[CONNSTR_REDACTED]` |

**Implementation**:
- Sanitization runs as a synchronous middleware before the audit logger
- Sanitization is applied to: `action.description`, `action.justification`, and any free-text fields
- Hash fields (input_hash, output_hash) are computed AFTER sanitization
- Raw unsanitized data is NEVER written to audit logs or application logs

### 4.2 Console Output Sanitization

The current `src/run.js` outputs full API responses via `console.log(JSON.stringify(result, null, 2))`. Phase 2 must:

1. Replace raw console.log with a structured logger
2. Apply the same PII sanitization patterns to all log output
3. Log at appropriate levels (DEBUG for full payloads in dev only, INFO for summaries in production)
4. Never log full API responses in production -- log only: model, usage tokens, stop_reason, and a truncated content preview (first 200 chars, sanitized)

### 4.3 Input Validation

All inputs to agents must be validated at the Paperclip task ingestion boundary:

| Validation | Rule | Action on Failure |
|------------|------|-------------------|
| Input length | Max 50,000 characters | Reject task with error |
| Character encoding | UTF-8 only | Reject task with error |
| Prompt injection markers | Detect common injection patterns | Flag for review, do not auto-process |
| File path references | Must match allowlist (see 4.4) | Strip unauthorized paths, log warning |
| Schema compliance | Task must match defined JSON schema | Reject task with validation errors |

### 4.4 File Access Control Per Agent

| Agent | Permitted Paths (Read) | Permitted Paths (Write) | Denied Paths |
|-------|----------------------|------------------------|-------------|
| router | src/**, .claude/agents/** | NONE | .env, .git/**, node_modules/**, .paperclip/** |
| retriever | src/**, .claude/agents/**, package.json | NONE | .env, .git/**, node_modules/** |
| skeptic | src/**, .claude/agents/** | NONE | .env, .git/**, node_modules/**, .paperclip/** |
| verifier | src/**, .claude/agents/**, CLAUDE.md | NONE | .env, .git/**, node_modules/** |
| system (Paperclip) | .paperclip/** | .paperclip/** | .env, .git/**, src/** (no direct modification) |

**Default policy**: DENY ALL. Only paths explicitly listed above are permitted.
**Enforcement**: Paperclip file-level access control API (to be verified in Phase 2.1 Capability Gate).
**Fallback** (if Paperclip lacks native file ACL): Implement wrapper layer that intercepts file operations and enforces allowlist before passing to underlying tool.

---

## 5. Compliance Analysis

### 5.1 SOC 2 Type II Alignment

| SOC 2 Criteria | Status | Implementation |
|----------------|--------|---------------|
| CC6.1 - Logical access | ADDRESSED | File access control per agent, API key management |
| CC6.2 - Authentication | ADDRESSED | API key + envelope encryption; mTLS evaluated |
| CC6.3 - Authorization | ADDRESSED | Agent role-based access, approval state machine |
| CC7.1 - System monitoring | ADDRESSED | Real-time dashboard, heartbeat monitoring |
| CC7.2 - Incident detection | ADDRESSED | Automated alerting, audit chain verification |
| CC7.3 - Incident response | ADDRESSED | Defined SLAs, escalation matrix, runbooks |
| CC8.1 - Change management | ADDRESSED | Phase gates, 5-reviewer approval, guardrails |

### 5.2 GDPR Compatibility

| GDPR Article | Requirement | Implementation |
|--------------|-------------|---------------|
| Art. 5(1)(f) - Integrity | Data protected against unauthorized processing | Encryption at rest and in transit |
| Art. 17 - Right to erasure | Delete personal data on request | Pseudonymization in audit logs; delete mapping table |
| Art. 25 - Data protection by design | Privacy built into system | PII sanitization layer, minimal data collection |
| Art. 30 - Records of processing | Maintain processing activity records | Audit trail with 2-year retention |
| Art. 32 - Security of processing | Appropriate technical measures | TLS 1.3, AES-256, access control, monitoring |
| Art. 33 - Breach notification | Notify authority within 72 hours | P0 incident response includes legal notification path |

### 5.3 HIPAA Assessment

**Not applicable** for current scope. This system processes backend engineering incident data, not protected health information (PHI). If scope changes to include health-related systems, a full HIPAA impact assessment is required before proceeding.

---

## 6. Security Review Gates

### 6.1 Phase 2 Exit Gate (Security Review)

Before Phase 3 begins, Security Officer must review and approve:

- [ ] File access control rules implemented per Section 4.4
- [ ] Audit trail architecture matches Section 2 design
- [ ] Encryption implementation matches Section 1 specification
- [ ] Log sanitization layer is functional and tested
- [ ] Input validation is implemented per Section 4.3
- [ ] API key handoff to Paperclip secret store is complete
- [ ] Phase 2.1 Capability Gate results confirm security features exist

### 6.2 Phase 3 Exit Gate (Security Review)

Before Phase 4 begins:

- [ ] All 7 integration test scenarios pass (including audit logging scenario)
- [ ] Penetration test of agent input handling (prompt injection testing)
- [ ] Audit chain integrity verified over Phase 3 test period
- [ ] Rollback tested and verified to not leave orphaned secrets
- [ ] On-call runbook for security incidents tested in staging

### 6.3 Phase 4 Exit Gate (Security Review)

Before production deployment:

- [ ] Full security audit of all code changes from Phase 2-4
- [ ] Compliance checklist signed off (SOC 2, GDPR)
- [ ] Incident response drill completed successfully
- [ ] Monitoring dashboards verified to catch all security events
- [ ] Key rotation procedure tested end-to-end

---

## 7. Open Items for Phase 2.1 Capability Gate

The following must be verified with Paperclip team:

1. Does Paperclip support file-level access control enforcement?
2. Does Paperclip support append-only audit storage (WORM)?
3. Does Paperclip support envelope encryption for secrets?
4. Does Paperclip support mTLS for client authentication?
5. Does Paperclip provide cryptographic signatures on audit entries?
6. What is Paperclip's own SOC 2/compliance certification status?
7. Where does Paperclip store data at rest (region, provider)?
8. Does Paperclip support custom retention policies?

**If any of items 1-3 are NOT supported**: Security Officer must evaluate alternative mitigations before Phase 2 design proceeds.

---

**Document Version**: 1.0
**Approved By**: Security/Compliance Officer
**Date**: 2026-03-08
**Next Review**: Phase 2 Exit Gate (~2026-03-17)
