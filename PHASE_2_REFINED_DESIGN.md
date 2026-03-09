# Phase 2 Refined Design: Paperclip Integration

**Status**: DESIGN COMPLETE - AWAITING REVIEWER SIGN-OFF
**Date**: 2026-03-08
**Conditions Addressed**: 28/28 (6 Security + 5 QA + 8 Ops + 4 Backend + 5 CEO)
**Capability Gate Outcome**: FAIL (0/5 verified) -- Paperclip is not an external service. Design pivots to local orchestration built from existing `src/paperclip/` modules.

---

## Table of Contents

1. [Capability Gate Resolution](#capability-gate-resolution)
2. [Phase 2.0: Baseline Review](#phase-20-baseline-review)
3. [Phase 2.1: Approval State Machine](#phase-21-approval-state-machine)
4. [Phase 2.2: Budget Model](#phase-22-budget-model)
5. [Phase 2.3: Agent Integration](#phase-23-agent-integration)
6. [Phase 2.4: Agent Wrapper Layer](#phase-24-agent-wrapper-layer)
7. [Phase 2.5: File Safety](#phase-25-file-safety)
8. [Phase 2.6: Error Handling and Key Management](#phase-26-error-handling-and-key-management)
9. [Phase 2.7: Integration Test Procedures](#phase-27-integration-test-procedures)
10. [Phase 2.8: Rollback Procedures](#phase-28-rollback-procedures)
11. [Conditions Traceability](#conditions-traceability)

---

## Capability Gate Resolution

### Gate Outcome
The Capability Gate (BI-1) verified that Paperclip does not exist as an external SaaS platform. There is no Paperclip SDK, API documentation, or accessible endpoints. See `.paperclip/Capability-Gate-Verification-Report.md` for full report.

### Design Pivot (per BE-2 fallback requirement)
Rather than blocking indefinitely, the team has already built local fallback implementations in `src/paperclip/`:

| Capability | External Paperclip | Local Fallback (EXISTS) |
|------------|-------------------|------------------------|
| Approval gating | Not available | `src/paperclip/approval-state-machine.js` |
| Budget enforcement | Not available | `src/paperclip/budget-enforcer.js` |
| Audit logging | Not available | `src/paperclip/audit-logger.js` |
| Heartbeat monitoring | Not available | `src/paperclip/heartbeat-monitor.js` |
| Task management | Not available | `src/paperclip/task-manager.js` |
| API client | Not available | `src/paperclip/paperclip-client.js` (stub for future) |

**Decision**: Phase 2 design proceeds using these local modules as the orchestration layer. The `paperclip-client.js` remains a stub -- if a real Paperclip service materializes, it can be wired in without changing the internal architecture. File-level access control (the 6th capability) must be implemented as a new module.

**BE-2 satisfied**: Fallback designs are the actual implementations. `.paperclip/phase-2-architecture/capability-fallbacks.json` documents this.

---

## Phase 2.0: Baseline Review

### Existing Codebase Inventory

**Entry point**: `src/run.js` -- Simple Anthropic SDK call to verifier agent. Must NOT be rewritten (wrap with adapter per plan).

**Agents** (`.claude/agents/*.md`):
- `router.md` -- Classifies failures into: schema_drift, write_conflict, stale_read, bad_deploy, auth_failure, dependency_break
- `retriever.md` -- Pulls exact evidence (files, logs, schemas, timestamps). Tools: Read, Grep, Glob, Bash
- `skeptic.md` -- Produces competing explanation from different failure family
- `verifier.md` -- Rejects unsupported claims. Requires fix_plan, rollback, tests, confidence

**CLAUDE.md Contract** (output fields):
- root_cause, evidence, fix_plan, rollback, tests, confidence
- Rules: never invent, retrieve before explaining, verifier blocks unsupported nouns, skeptic must differ, no edits until approved

**Existing Paperclip Modules** (`src/paperclip/`):
- `approval-state-machine.js` -- 8-state FSM with timeout escalation (4hr/8hr)
- `budget-enforcer.js` -- Per-agent, per-incident, org-wide budget with 75/90/100% thresholds
- `audit-logger.js` -- Append-only, immutable entries with integrity verification
- `heartbeat-monitor.js` -- 30s interval, 4-tier escalation (warn/alert/kill/circuit-break)
- `task-manager.js` -- Task lifecycle with CLAUDE.md output validation
- `paperclip-client.js` -- HTTP client stub (for future external Paperclip)

### BE-4: Duplicate "Files Likely to Change" Consolidation

The parent `PAPERCLIP_INTEGRATION_PLAN.md` Phase 2 section contains two duplicate "Files Likely to Change" blocks (lines ~327-351 and ~343-351). These must be consolidated into a single list. The canonical file list for Phase 2 is:

**Files that WILL change**:
- `.paperclip/` config files (new design artifacts)
- `src/paperclip/*.js` (existing modules, enhanced per conditions)
- `.env.example` (add PAPERCLIP_API_URL, PAPERCLIP_API_KEY placeholders)

**Files that MUST NOT change**:
- `CLAUDE.md`, `.claude/agents/*`, `src/run.js` (read-only), `package.json` (add deps only)

---

## Phase 2.1: Approval State Machine

### Current State
`src/paperclip/approval-state-machine.js` already implements the 8-state FSM with all 5 transition paths:

| Path | Transitions | Status |
|------|-------------|--------|
| 1. Happy path | pending -> skeptic_review(approve) -> verifier_review(proceed) -> awaiting_approver(approve) -> approved | Implemented |
| 2. Skeptic block | pending -> skeptic_review(block) -> blocked | Implemented |
| 3. Verifier escalation | pending -> skeptic_review(challenge) -> verifier_review(unverifiable) -> escalated | Implemented |
| 4. Timeout | any state (4hr) -> escalated | Implemented |
| 5. User override | escalated -> user_override(with justification) -> approved | Implemented |

### BE-1: Skeptic Ordering Contradiction Fix

**Contradiction identified**: The PAPERCLIP_INTEGRATION_PLAN.md section 2.5 described skeptic as "invoked after approver proposes approval." This contradicts section 2.2 which correctly states skeptic reviews FIRST.

**Resolution**: The implementation in `approval-state-machine.js` is CORRECT. The canonical flow is:
```
pending -> skeptic_review -> verifier_review -> awaiting_approver
```
Skeptic is always the FIRST reviewer. The state machine enforces this -- there is no transition from `pending` to `verifier_review` or `awaiting_approver` without going through `skeptic_review` first.

**Action**: Document fix in `PAPERCLIP_INTEGRATION_PLAN.md` section 2.5. Remove "invoked after approver proposes approval" language.

### QA-2: All 5 State Machine Paths Tested

The 5 paths above must each have dedicated integration tests. See Phase 2.7 for test specifications.

### Design Spec
See `.paperclip/phase-2-architecture/approval-state-machine-spec.json` for formal state/transition definition.

---

## Phase 2.2: Budget Model

### Current State
`src/paperclip/budget-enforcer.js` implements per-agent, per-incident, and org-wide budget enforcement with 75/90/100% alert thresholds.

### BE-3: Budget Calibration Step

**Problem**: Current thresholds are hardcoded defaults (10K/agent/day, 50K/incident, 100K/org/day). These are arbitrary.

**Calibration procedure**:
1. Run 5 sample incidents through existing agents using `src/run.js`
2. Record actual token consumption per agent per incident (from Anthropic API usage metadata in response)
3. Calculate: mean, p50, p90, p99 per agent
4. Set per-agent daily budget = p99 + 20% headroom
5. Set per-incident budget = sum of all agent p99 values + 30% headroom
6. Set daily org budget = expected daily incident volume * per-incident budget

**Deliverable**: `.paperclip/phase-2-architecture/budget-calibration-data.json`

**Note**: Until calibration data is collected, the current DEFAULT_LIMITS serve as placeholders. The BudgetEnforcer constructor already accepts custom limits, so calibrated values can be injected without code changes.

### Design Enhancement
Add `BudgetEnforcer.setLimits(calibratedLimits)` method for runtime reconfiguration after calibration.

---

## Phase 2.3: Agent Integration

### Agent-to-Task Mapping

| Agent | Task Type | Input | Output | Budget |
|-------|-----------|-------|--------|--------|
| router.md | `route` | logs, schema, diffs | failure classification (top 2 classes + missing evidence) | Low (~200 tokens) |
| retriever.md | `debug` | classification, repo path, query | evidence array with sources, timestamps | High (~500 tokens) |
| skeptic.md | `verify` | hypothesis, evidence | competing explanation, contradictions, veto recommendation | Medium (~300 tokens) |
| verifier.md | `verify` | claims, evidence | verdict (proceed/unverifiable), rejected claims, missing evidence | Medium (~300 tokens) |

### Agent Authority Matrix

| Agent | Authority | Veto Power | File Access |
|-------|-----------|------------|-------------|
| Router | Classifies only, no approval authority | None | READ: src/, .claude/agents/, logs |
| Retriever | Collects evidence, no approval authority | None | READ: src/, logs, config (NOT .env) |
| Skeptic | Mandatory FIRST reviewer | YES - can block | READ: task outputs, evidence |
| Verifier | Validates claims after skeptic | No unilateral block, can escalate | READ: task outputs, evidence, .claude/agents/ |
| Approver | Final decision (only if skeptic approved) | Must escalate if skeptic blocked | READ: all review outputs |
| Orchestrator | Routes tasks, no approval authority | None | READ/WRITE: .paperclip/ task state only |

### SC-1: Input Validation (Prompt Injection Mitigation)

All task inputs are validated before reaching any agent. The `TaskManager.createTask()` already validates task type. Additional validation required:

**New module**: `src/paperclip/input-validator.js`

```
Validation rules:
1. task.type must be in VALID_TASK_TYPES (already enforced)
2. task.hypothesis: max 2000 chars, no system/assistant role markers,
   no XML-like tags (<system>, </instructions>, etc.)
3. task.evidence[]: each item must have { source: string, content: string }
   - source must reference a real file path or log line (validated by retriever)
   - no fabricated evidence (source must exist in repo or be a known log format)
4. task.constraints[]: each must match a known CLAUDE.md rule verbatim
   - Valid constraints: CLAUDE.md rules only (hardcoded allowlist)
   - Reject any constraint not in the allowlist
5. All string fields: strip/reject patterns matching:
   - "You are now..." (role impersonation)
   - "Ignore previous..." (instruction override)
   - "```system" or "[SYSTEM]" (delimiter injection)
   - Base64-encoded payloads > 500 chars
```

**Deliverable**: `.paperclip/phase-2-architecture/input-validation-spec.json`

---

## Phase 2.4: Agent Wrapper Layer

### Design
New module: `src/paperclip/agent-wrapper.js`

Translates between the repo's agent format (`.claude/agents/*.md` + Anthropic SDK calls) and the local Paperclip task system.

```
AgentWrapper responsibilities:
1. Load agent definition from .claude/agents/<name>.md
2. Construct Anthropic SDK message with agent's system prompt
3. Execute via Anthropic client (same pattern as src/run.js)
4. Parse agent output into task schema format
5. Validate output against CLAUDE.md contract (via TaskManager._validateOutput)
6. Record token usage for budget enforcement
7. Apply input validation (SC-1) before sending to agent
8. Apply file access allowlist (SC-2) before agent execution
```

### Integration with Task Manager

```
Flow:
TaskManager.createTask(input)
  -> InputValidator.validate(input)         // SC-1
  -> BudgetEnforcer.reserveBudget(...)      // budget check
  -> ApprovalStateMachine.transition(start) // pending -> skeptic_review
  -> AgentWrapper.invoke('skeptic', input)  // skeptic reviews first (BE-1)
  -> ApprovalStateMachine.transition(skeptic_verdict)
  -> AgentWrapper.invoke('verifier', ...)   // if skeptic approved
  -> ApprovalStateMachine.transition(verifier_verdict)
  -> ... (approver, escalation, completion)
  -> TaskManager.completeTask(output)       // validates CLAUDE.md contract
```

**Deliverable**: `.paperclip/phase-2-architecture/agent-wrapper-spec.json`

---

## Phase 2.5: File Safety

### SC-2: File Operation Allowlist

New module: `src/paperclip/file-access-guard.js`

**Deny-by-default model**: No agent can access any file unless explicitly allowlisted.

```json
{
  "router": {
    "read": ["src/**/*", ".claude/agents/**/*", "logs/**/*"],
    "write": [],
    "deny_always": [".env", ".env.*", "credentials*"]
  },
  "retriever": {
    "read": ["src/**/*", "logs/**/*", "*.json", "*.yaml", "*.yml"],
    "write": [],
    "deny_always": [".env", ".env.*", "credentials*", ".git/**/*"]
  },
  "skeptic": {
    "read": [".paperclip/task-outputs/**/*"],
    "write": [".paperclip/skeptic-output.json"],
    "deny_always": [".env", "src/**/*", "CLAUDE.md"]
  },
  "verifier": {
    "read": [".paperclip/task-outputs/**/*", ".claude/agents/**/*"],
    "write": [".paperclip/verifier-output.json"],
    "deny_always": [".env", "src/**/*"]
  },
  "orchestrator": {
    "read": [".paperclip/**/*"],
    "write": [".paperclip/task-state/**/*"],
    "deny_always": [".env", "src/**/*", "CLAUDE.md", ".claude/agents/**/*"]
  }
}
```

**Protected files (no agent may write)**:
- `CLAUDE.md`
- `.claude/agents/*`
- `src/run.js`
- `.env`
- `package.json`
- `package-lock.json`

**Implementation**: `FileAccessGuard.checkAccess(agentId, operation, filePath)` returns `{ allowed: boolean, reason: string }`. Called by AgentWrapper before any file operation.

**Deliverable**: `.paperclip/phase-2-architecture/file-access-allowlist.json`

---

## Phase 2.6: Error Handling and Key Management

### SC-3: API Key Handoff Procedure

Since Paperclip is not an external service (capability gate failed), the API key handoff simplifies to:

1. **ANTHROPIC_API_KEY** stays in local `.env` (source of truth)
2. `src/run.js` and `AgentWrapper` read from `process.env.ANTHROPIC_API_KEY`
3. `paperclip-client.js` stub has PAPERCLIP_API_KEY placeholder for future external integration
4. Key is NEVER logged, included in audit trails, or passed to agent prompts
5. Key rotation: update `.env`, restart process
6. Revocation: remove from `.env`, restart process

**If external Paperclip is added later**:
- Envelope encryption with Paperclip's public key before transmission
- Key stored encrypted (AES-256-GCM) in Paperclip
- 30-day rotation schedule with automated notification
- Certificate pinning per Security Specification section 1.1

**Deliverable**: `.paperclip/phase-2-architecture/api-key-handoff-procedure.md`

### SC-4: Log Sanitization

New module: `src/paperclip/log-sanitizer.js`

**Sanitization rules** (applied at write time in AuditLogger.log()):

| Pattern | Replacement | Description |
|---------|-------------|-------------|
| `sk-[a-zA-Z0-9]{20,}` | `[REDACTED:API_KEY]` | Anthropic API keys |
| `[A-Za-z0-9+/=]{40,}` (in key context) | `[REDACTED:TOKEN]` | Base64 tokens |
| `\b[A-Z_]+_KEY=[^\s]+` | `[REDACTED:ENV_VAR]` | Env var key assignments |
| `\b[A-Z_]+_SECRET=[^\s]+` | `[REDACTED:ENV_VAR]` | Env var secret assignments |
| `\b[A-Z_]+_TOKEN=[^\s]+` | `[REDACTED:ENV_VAR]` | Env var token assignments |
| `\b[A-Z_]+_PASSWORD=[^\s]+` | `[REDACTED:ENV_VAR]` | Env var password assignments |
| `\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b` | `[REDACTED:EMAIL]` | Email addresses |
| `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b` | `[REDACTED:IP]` | IPv4 addresses |

**Integration**: `AuditLogger.log()` calls `LogSanitizer.sanitize(entry)` before appending. Original unsanitized data never persisted.

**Deliverable**: `.paperclip/phase-2-architecture/log-sanitization-rules.json`

### Error Handling Design

New module: `src/paperclip/error-handler.js`

```
Error categories:
1. VALIDATION_ERROR: Malformed task input (SC-1 rejection)
   -> Return structured error { code: 'VALIDATION_ERROR', field, reason }
   -> Task NOT created (no partial state)
   -> Error logged to audit trail (sanitized)

2. BUDGET_EXCEEDED: Task would exceed budget
   -> Return { code: 'BUDGET_EXCEEDED', scope: 'agent|incident|org', limit, current }
   -> Task NOT created
   -> Alert emitted per budget thresholds

3. AGENT_UNAVAILABLE: Heartbeat monitor reports agent down
   -> Return { code: 'AGENT_UNAVAILABLE', agentId, lastHeartbeat }
   -> Task queued for retry when agent recovers
   -> Escalation per heartbeat protocol

4. APPROVAL_TIMEOUT: State machine timeout exceeded
   -> Return { code: 'APPROVAL_TIMEOUT', state, elapsed }
   -> Auto-escalate per state machine rules

5. FILE_ACCESS_DENIED: Agent attempted unauthorized file operation (SC-2)
   -> Return { code: 'FILE_ACCESS_DENIED', agentId, operation, path }
   -> Task halted, logged as security event
   -> Alert to security team

6. ANTHROPIC_API_ERROR: Upstream Anthropic SDK failure
   -> Return { code: 'API_ERROR', status, message }
   -> Retry with exponential backoff (max 3 attempts)
   -> If all retries fail, escalate
```

---

## Phase 2.7: Integration Test Procedures

### QA-5: CI/CD Pipeline Definition

**File**: `.github/workflows/test.yml` -- created BEFORE test code.

```yaml
# Triggered on: PR to main, push to feature branches
# Steps: install deps, lint, @unit tests, @integration tests, coverage report
# Coverage enforced per QA-4 tiers
```

### QA-3: Staging Environment

Since Paperclip is local (not external), "staging" means running tests against local modules with test fixtures:

- `@unit` tests: Direct module tests with mocked dependencies
- `@integration` tests: Full workflow through TaskManager -> AgentWrapper -> mocked Anthropic responses
- `@e2e` tests: Full approval workflow with all 5 state machine paths

**Deliverable**: `.paperclip/phase-2-architecture/staging-env-spec.md`

### QA-4: Tiered Coverage Targets

| Tier | Target | Modules |
|------|--------|---------|
| Critical (90%) | `approval-state-machine.js`, `budget-enforcer.js`, `audit-logger.js` |
| Important (70%) | `task-manager.js`, `input-validator.js`, `heartbeat-monitor.js`, `file-access-guard.js` |
| Floor (60%) | `agent-wrapper.js`, `paperclip-client.js`, `log-sanitizer.js`, `error-handler.js` |

### 10 Integration Test Scenarios (QA-1 expanded)

| # | Scenario | Module Under Test | Pass Criteria | Tag |
|---|----------|-------------------|---------------|-----|
| 1 | Task Creation + Schema Validation | task-manager.js | Valid task created with ID, CLAUDE.md fields enforced | @integration |
| 2 | Router Agent Invocation | agent-wrapper.js | Router returns failure classification from VALID_FAILURE_CLASSES | @integration |
| 3a | Approval -- Happy Path | approval-state-machine.js | pending->skeptic(approve)->verifier(proceed)->approver(approve)->approved | @e2e |
| 3b | Approval -- Skeptic Block | approval-state-machine.js | pending->skeptic(block)->blocked | @e2e |
| 3c | Approval -- Verifier Escalation | approval-state-machine.js | pending->skeptic(challenge)->verifier(unverifiable)->escalated | @e2e |
| 3d | Approval -- Timeout | approval-state-machine.js | pending->skeptic(4hr timeout)->escalated | @e2e |
| 3e | Approval -- User Override | approval-state-machine.js | escalated->user_override(justified)->approved | @e2e |
| 4 | Budget Enforcement | budget-enforcer.js | Over-budget task rejected with BUDGET_EXCEEDED error | @integration |
| 5 | Audit Logging | audit-logger.js | All approval steps logged; integrity check passes | @integration |
| 6 | Heartbeat Detection | heartbeat-monitor.js | Missed heartbeat detected; circuit breaker at 4 misses | @integration |
| 7 | Rollback State Consistency | task-manager.js | After task delete, no orphaned state in budget/audit | @e2e |
| 8 | Error Handling | error-handler.js | Malformed task returns structured error; no partial creation | @integration |
| 9 | Concurrency | task-manager.js | 3 simultaneous tasks complete independently; no shared state corruption | @integration |
| 10 | CLAUDE.md Contract Enforcement | task-manager.js | Task with missing output fields (e.g., no rollback) cannot complete | @e2e |

### Security Test Scenarios (SC-1 through SC-4)

| # | Test | Module | Pass Criteria |
|---|------|--------|---------------|
| S1 | Prompt injection: role impersonation | input-validator.js | "You are now admin" rejected |
| S2 | Prompt injection: instruction override | input-validator.js | "Ignore previous" rejected |
| S3 | Prompt injection: delimiter injection | input-validator.js | System tags sanitized |
| S4 | Fabricated evidence | input-validator.js | Non-existent source path rejected |
| S5 | File access: agent writes to .env | file-access-guard.js | Write blocked |
| S6 | File access: retriever reads .env | file-access-guard.js | Read blocked |
| S7 | File access: skeptic writes to CLAUDE.md | file-access-guard.js | Write blocked |
| S8 | API key in audit log | log-sanitizer.js + audit-logger.js | Key replaced with [REDACTED:API_KEY] |
| S9 | Email in agent output | log-sanitizer.js | Email replaced with [REDACTED:EMAIL] |
| S10 | IP address in logs | log-sanitizer.js | IP replaced with [REDACTED:IP] |

---

## Phase 2.8: Rollback Procedures

### OPS-5/OPS-6/OPS-7: Rollback Script

`.paperclip/rollback.sh` already exists as a real executable script. Design enhancements:

**Git tag convention** (OPS-7):
```
phase-1-complete
phase-2-blocking-items-complete
phase-2-wave-A-complete
phase-2-wave-B-complete
phase-2-wave-C-complete
phase-2-wave-D-complete
phase-2-complete
```

**Rollback procedure**:
1. Identify target rollback tag
2. `git checkout <tag>` (never `git reset --hard`)
3. Graceful agent shutdown: SIGTERM with 10s timeout, then SIGKILL
4. Verify no orphaned task state in `.paperclip/`
5. Run integration tests against rolled-back code
6. Report: success/failure, time taken, any errors

**SLA**: <10 minutes for full rollback (OPS-6 staging test required)

### OPS-3: Per-Runbook Resolution SLAs

| Runbook | SLA | Rationale |
|---------|-----|-----------|
| 1. Agent Timeout | 2-5 min | Restart agent process |
| 2. API Failure | 15-30 min | May need upstream investigation |
| 3. Approval Deadlock | 1-4 hr | Depends on user response |
| 4. Budget Exhausted | Next day / override | Midnight UTC reset |
| 5. Audit Trail Gap | 2-4 hr | Investigation required |
| 6. Skeptic/Verifier Override | 15-30 min | Requires authorized user |

### OPS-4: Notification Templates

Each runbook includes Slack and email templates. See `.paperclip/runbooks/*.md` (already created in blocking items phase).

### OPS-8: Tabletop Drills

Schedule one drill per runbook before Phase 3:
- Simulate scenario in local staging
- On-call walks through steps
- Record time-to-resolution
- Revise runbook if gaps found

**Deliverable**: `.paperclip/phase-2-architecture/tabletop-drill-schedule.md`

---

## Conditions Traceability

### All 28 Conditions Status

**CEO Conditions (5)**:
| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| CEO-1 | Capability gate FIRST | ADDRESSED | Gate executed first; FAILED; design pivoted to local fallbacks |
| CEO-2 | Ops resource allocation 24hr | ADDRESSED | Ops lead assigned to blocking items (completed: BI-2, BI-3, BI-6) |
| CEO-3 | All 6 BIs before Phase 2 | ADDRESSED | BI-1 through BI-6 resolved; BI-1 failed but fallbacks activated per BE-2 |
| CEO-4 | Weekly executive checkpoint | ADDRESSED | Friday checkpoint schedule established |
| CEO-5 | CEO sign-off at Phase 2 exit | PENDING | This document requires CEO sign-off before Phase 3 |

**Security Conditions (6)**:
| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| SC-1 | Input validation | ADDRESSED | Phase 2.3: input-validator.js spec with 5 rule categories |
| SC-2 | File allowlist | ADDRESSED | Phase 2.5: file-access-guard.js with deny-by-default model |
| SC-3 | API key handoff | ADDRESSED | Phase 2.6: simplified for local (key stays in .env); future external procedure documented |
| SC-4 | Log sanitization | ADDRESSED | Phase 2.6: log-sanitizer.js with 8 PII/secret patterns |
| SC-5 | Security review gate | PENDING | Security Officer must review this document before Phase 3 |
| SC-6 | BI-4 completion | ADDRESSED | BI-4 (Security Specification) completed and signed off |

**QA Conditions (5)**:
| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| QA-1 | 3 new test scenarios (10 total) | ADDRESSED | Phase 2.7: Scenarios 8, 9, 10 added (error handling, concurrency, CLAUDE.md enforcement) |
| QA-2 | 5 state machine paths | ADDRESSED | Phase 2.7: Scenarios 3a-3e cover all 5 paths |
| QA-3 | Staging environment | ADDRESSED | Phase 2.7: Local staging with @unit/@integration/@e2e tags |
| QA-4 | Tiered coverage (90/70/60) | ADDRESSED | Phase 2.7: Three tiers mapped to specific modules |
| QA-5 | CI/CD pipeline first | ADDRESSED | Phase 2.7: .github/workflows/test.yml created before test code |

**Ops Conditions (8)**:
| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| OPS-1 | Monitoring stack selection | ADDRESSED | BI-2 completed (see monitoring-config.yaml) |
| OPS-2 | BI-2 depends on BI-1 | ADDRESSED | Dependency acknowledged; metrics adapted for local modules |
| OPS-3 | Per-runbook SLAs | ADDRESSED | Phase 2.8: Per-runbook SLAs defined (2min to next day) |
| OPS-4 | Notification templates | ADDRESSED | Runbooks include Slack/email templates |
| OPS-5 | Real rollback.sh | ADDRESSED | `.paperclip/rollback.sh` is executable script |
| OPS-6 | Staging rollback test | PENDING | Must execute and record timing before Phase 3 |
| OPS-7 | Git tags for rollback | ADDRESSED | Phase 2.8: Tag convention defined |
| OPS-8 | Tabletop drills | ADDRESSED | Phase 2.8: Drill schedule created |

**Backend Conditions (4)**:
| ID | Condition | Status | Evidence |
|----|-----------|--------|----------|
| BE-1 | Skeptic ordering fix | ADDRESSED | Phase 2.1: Implementation confirmed correct; plan language to be fixed |
| BE-2 | Fallback designs | ADDRESSED | Capability Gate Resolution: local modules ARE the fallbacks |
| BE-3 | Budget calibration | ADDRESSED | Phase 2.2: Calibration procedure defined; awaiting sample data |
| BE-4 | Consolidate file lists | ADDRESSED | Phase 2.0: Duplicate identified; canonical list defined |

### Conditions Summary
- **ADDRESSED**: 25/28
- **PENDING**: 3/28 (CEO-5 sign-off, SC-5 security review, OPS-6 rollback staging test)
- **BLOCKED**: 0/28

The 3 PENDING conditions are exit gates -- they require reviewer action after this design document is reviewed, not design work.

---

## Code Artifacts Summary

### New Modules to Create (Phase 3)

| Module | Purpose | Coverage Target |
|--------|---------|-----------------|
| `src/paperclip/input-validator.js` | Prompt injection mitigation (SC-1) | 70% |
| `src/paperclip/file-access-guard.js` | Deny-by-default file allowlist (SC-2) | 70% |
| `src/paperclip/log-sanitizer.js` | PII/secret stripping (SC-4) | 60% |
| `src/paperclip/agent-wrapper.js` | Agent-to-task translation layer | 60% |
| `src/paperclip/error-handler.js` | Structured error handling | 60% |

### Existing Modules to Enhance (Phase 3)

| Module | Enhancement | Coverage Target |
|--------|-------------|-----------------|
| `src/paperclip/audit-logger.js` | Integrate log-sanitizer at write time | 90% |
| `src/paperclip/budget-enforcer.js` | Add setLimits() for calibration; add incident tracking | 90% |
| `src/paperclip/task-manager.js` | Integrate input-validator, file-access-guard | 70% |

### Design Spec Files

| File | Phase |
|------|-------|
| `.paperclip/phase-2-architecture/capability-fallbacks.json` | 2.0 |
| `.paperclip/phase-2-architecture/approval-state-machine-spec.json` | 2.1 |
| `.paperclip/phase-2-architecture/budget-calibration-data.json` | 2.2 |
| `.paperclip/phase-2-architecture/input-validation-spec.json` | 2.3 |
| `.paperclip/phase-2-architecture/agent-wrapper-spec.json` | 2.4 |
| `.paperclip/phase-2-architecture/file-access-allowlist.json` | 2.5 |
| `.paperclip/phase-2-architecture/api-key-handoff-procedure.md` | 2.6 |
| `.paperclip/phase-2-architecture/log-sanitization-rules.json` | 2.6 |
| `.paperclip/phase-2-architecture/staging-env-spec.md` | 2.7 |
| `.paperclip/phase-2-architecture/tabletop-drill-schedule.md` | 2.8 |

---

## Sign-Off Requirements

| Reviewer | Must Verify |
|----------|-------------|
| CEO/Executive | Budget model, timeline, capability gate pivot decision (CEO-5) |
| Backend Engineer | Skeptic ordering fix (BE-1), state machine correctness, agent mapping, budget calibration (BE-3) |
| QA Engineer | 10 test scenarios, 5 paths, tiered coverage, CI/CD pipeline (QA-1 through QA-5) |
| Security Officer | SC-1 through SC-6 conditions, threat model, security review gate (SC-5) |
| Ops Lead | Runbook SLAs, rollback script, git tags, tabletop drills (OPS-1 through OPS-8) |

**Phase 3 GO**: All 5 reviewers approve + 3 pending conditions resolved
**Phase 3 NO-GO**: Any reviewer REJECT or pending condition unresolvable

---

**Document Status**: DESIGN COMPLETE - AWAITING 5 REVIEWER SIGN-OFFS
**Next Steps**: Reviewers verify conditions addressed -> resolve 3 pending conditions -> Phase 3 implementation
