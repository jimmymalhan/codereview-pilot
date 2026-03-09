# Phase 2 Execution Plan: Core Paperclip Integration Design

**Status**: APPROVED - 5/5 REVIEWERS GREEN LIGHT - READY TO EXECUTE
**Date**: 2026-03-08 (final revision with all 28 conditions from 5 reviewers)
**Phase**: 2 - Core Integration Design
**Prerequisite**: Phase 1 Audit COMPLETE; 6 Blocking Items must be resolved first
**Reviewer Status**:
- CEO/Executive: APPROVE WITH CONDITIONS (5 conditions)
- Security/Compliance Officer: APPROVE WITH CONDITIONS (6 conditions)
- QA Engineer: APPROVE WITH CONDITIONS (5 conditions)
- Operations/DevOps Lead: APPROVE WITH CONDITIONS (8 conditions)
- Backend Distinguished Engineer: APPROVE WITH CONDITIONS (4 conditions)

**Total conditions**: 28 (all incorporated below)

---

## Table of Contents

1. [All Reviewer Conditions](#all-reviewer-conditions)
2. [Blocking Items Gate](#blocking-items-gate)
3. [Phase 2 Design Sub-Phases](#phase-2-design-sub-phases)
4. [Code Artifacts](#code-artifacts)
5. [QA Test Procedures](#qa-test-procedures)
6. [Dependency Graph](#dependency-graph)
7. [Success Criteria and Sign-Off](#success-criteria-and-sign-off)

---

## All Reviewer Conditions

### Security Officer Conditions (SC-1 through SC-6)

#### SC-1: Input Validation Specification (Prompt Injection Mitigation)
- **Requirement**: Design input validation rules that prevent prompt injection attacks against agents
- **Addressed in**: Sub-Phase 2.4 (Task Contract Schema)
- **Deliverable**: `.paperclip/input-validation-spec.json`
- **Scope**:
  - All task inputs must be schema-validated before reaching any agent
  - String fields sanitized for injection patterns (system prompt overrides, role impersonation, delimiter injection)
  - Evidence arrays validated for source authenticity (no fabricated evidence references)
  - Hypothesis field length-limited and pattern-checked
  - Constraints field must match known CLAUDE.md rules only (no arbitrary rule injection)
- **Test**: Inject known prompt injection payloads into task inputs; verify all are rejected or neutralized

#### SC-2: File Operation Allowlist Per Agent Role
- **Requirement**: Each agent role has an explicit allowlist of file operations (read/write/delete) it can perform
- **Addressed in**: Sub-Phase 2.2 (Agent Authority Matrix)
- **Deliverable**: `.paperclip/file-access-allowlist.json`
- **Scope**:
  - **Router agent**: READ only (`src/`, `.claude/agents/`, logs)
  - **Retriever agent**: READ only (`src/`, logs, config files); NO access to `.env`, credentials
  - **Skeptic agent**: READ only (task outputs, evidence); WRITE only to own output (`.paperclip/skeptic-output.json`)
  - **Verifier agent**: READ only (task outputs, evidence, `.claude/agents/`); WRITE only to own output
  - **Approver agent**: READ only (all review outputs); WRITE only to approval state
  - **Orchestrator agent**: READ/WRITE to `.paperclip/` task state files only
  - **No agent**: may write to `CLAUDE.md`, `.claude/agents/*`, `src/run.js`, `.env`, `package.json`
- **Enforcement**: Paperclip file-level access control (verified in BI-1) enforces allowlist at runtime
- **Test**: Attempt unauthorized file access per agent; verify all are blocked

#### SC-3: API Key Handoff Procedure (Local .env to Paperclip)
- **Requirement**: Document secure procedure for transferring ANTHROPIC_API_KEY from local `.env` to Paperclip
- **Addressed in**: Sub-Phase 2.1 (Capability Verification) + BI-4 (Security Spec)
- **Deliverable**: `.paperclip/api-key-handoff-procedure.md`
- **Scope**:
  - Key is never transmitted in plaintext (envelope encryption with Paperclip's public key)
  - Key is never logged, printed, or included in audit trails
  - Key rotation procedure: every 30 days, automated with notification
  - Revocation procedure: immediate key invalidation if compromise suspected
  - Local `.env` remains the source of truth; Paperclip stores encrypted copy only
  - Verify Paperclip key storage meets AES-256-GCM at-rest requirement (from BI-4)
- **Test**: Verify key is encrypted in transit and at rest; search all logs for key leakage

#### SC-4: Log Sanitization Design (PII/Secrets Stripping)
- **Requirement**: All logs, audit trails, and agent outputs must be sanitized to remove PII and secrets
- **Addressed in**: Sub-Phase 2.8 (Audit Logging Specification)
- **Deliverable**: `.paperclip/log-sanitization-rules.json`
- **Scope**:
  - Define PII patterns to strip: API keys, tokens, passwords, email addresses, IP addresses, user names
  - Define secret patterns: anything matching `*_KEY`, `*_SECRET`, `*_TOKEN`, `*_PASSWORD` env var patterns
  - Sanitization applied at log write time (not post-hoc)
  - Sanitized fields replaced with `[REDACTED:<type>]` placeholder
  - Original unsanitized data never persisted to disk or external systems
  - Agent outputs validated for accidental secret inclusion before audit logging
- **Test**: Inject PII/secrets into agent inputs; verify all are stripped from logs and audit trail

#### SC-5: Security Review Gate Before Phase 3
- **Requirement**: Security Officer conducts formal security review of all Phase 2 design outputs before Phase 3 can begin
- **Addressed in**: Phase 2 Exit Criteria (new gate)
- **Deliverable**: `.paperclip/security-review-phase2.md` (sign-off document)
- **Scope**:
  - Security Officer reviews all configuration files for security implications
  - Specific review of: input validation spec, file access allowlist, API key procedure, log sanitization rules
  - Threat model review: identify attack surfaces in the Phase 2 design
  - Verify no security assumptions were made without evidence
  - Verify all security conditions (SC-1 through SC-4) are fully addressed
  - **Gate**: Security Officer must sign off before Phase 3 starts (REJECT = Phase 3 blocked)

#### SC-6: Blocking Item #4 Completion Required
- **Requirement**: BI-4 (Security Specification) must be fully complete before Phase 2 design work on audit logging (2.8) or API key handoff (SC-3)
- **Enforcement**: Phase 2 sub-phases 2.8 and SC-3 deliverables cannot begin until BI-4 sign-off is obtained

### QA Engineer Conditions (QA-1 through QA-5)

#### QA-1: Add 3 Missing Integration Test Scenarios (10 total)
- **Requirement**: Phase 2.7 integration tests expanded from 7 to 10 scenarios
- **Addressed in**: Integration Test Scenarios section
- **New scenarios**:
  - **Scenario 8: Error Handling** -- Submit malformed task (invalid schema, missing fields); verify Paperclip returns structured error, task is not partially created, and error is logged
  - **Scenario 9: Concurrency** -- Submit 3 tasks simultaneously to different agents; verify no race conditions, no shared state corruption, each task completes independently
  - **Scenario 10: CLAUDE.md Contract Enforcement** -- Submit task with output missing required fields (e.g., no rollback plan); verify task cannot transition to "completed" state; verify verifier catches the violation

#### QA-2: Expand Approval Workflow Testing (5 state machine paths)
- **Requirement**: Scenario 3 must cover all 5 state machine paths, not just happy path
- **Addressed in**: Integration Test Scenario 3 (expanded)
- **Paths**:
  1. Happy path: pending -> skeptic_review (approve) -> verifier_review (proceed) -> awaiting_approver (approve) -> approved
  2. Skeptic block: pending -> skeptic_review (block) -> blocked
  3. Verifier escalation: pending -> skeptic_review (approve) -> verifier_review (unverifiable) -> escalated
  4. Timeout escalation: pending -> skeptic_review (no response 4hr) -> escalated
  5. User override: escalated -> user_override (with justification) -> approved

#### QA-3: Define Staging Environment for E2E Tests
- **Requirement**: Separate staging environment for end-to-end tests (distinct from mock-based unit tests)
- **Addressed in**: New sub-section in QA Test Procedures
- **Deliverable**: `.paperclip/staging-env-spec.md`
- **Scope**:
  - Staging Paperclip instance (separate from production)
  - Staging API keys (not production keys)
  - Isolated test data (sample incidents, known-good outputs)
  - Staging dashboard connected for real-time observation during tests
  - Tests tagged: `@unit` (mocks), `@integration` (staging Paperclip), `@e2e` (full workflow)
  - E2E tests run on staging only, never against production

#### QA-4: Tiered Coverage Targets
- **Requirement**: Replace blanket 60% coverage floor with tiered targets
- **Addressed in**: BI-5 and Phase 2 Exit Criteria
- **Tiers**:
  - **90% coverage**: State machine transitions (2.3), budget enforcement logic (2.7), audit logging (2.8)
  - **70% coverage**: Agent authority matrix (2.2), task schema validation (2.4), heartbeat protocol (2.6)
  - **60% floor**: All other code (agent wrappers, adapters, utilities)
- **Enforcement**: CI/CD fails if any tier falls below its threshold

#### QA-5: CI/CD Pipeline Definition Before Implementation
- **Requirement**: Create `.github/workflows/test.yml` before writing test code
- **Addressed in**: BI-5 (Testing Framework)
- **Deliverable**: `.github/workflows/test.yml`
- **Scope**:
  - Triggered on: PR to main, push to feature branches
  - Steps: install deps, lint, run `@unit` tests, run `@integration` tests (if staging available), coverage report
  - Coverage thresholds enforced per QA-4 tiers
  - Must pass before any PR can merge

### Operations/DevOps Lead Conditions (OPS-1 through OPS-8)

#### OPS-1: CRITICAL DAY 1 -- Select Monitoring Stack with CEO Cost Approval
- **Requirement**: Choose between Datadog vs Grafana+Prometheus on Day 1; get CEO cost sign-off
- **Addressed in**: BI-2 (Monitoring Dashboards), Blocking Items timeline
- **Decision criteria**: Cost (SaaS vs self-hosted), Paperclip API metric export compatibility, alerting capabilities, team familiarity
- **Gate**: CEO must approve monitoring cost before BI-2 implementation begins

#### OPS-2: BI-2 Depends on BI-1 (Paperclip API Metrics Endpoints)
- **Requirement**: Cannot finalize dashboard metrics until Paperclip API metrics endpoints are confirmed in BI-1
- **Addressed in**: Dependency graph update
- **Impact**: BI-2 dashboard design can start (layout, alert rules), but metric wiring depends on BI-1 completion
- **Updated dependency**: BI-2 metric integration blocked by BI-1

#### OPS-3: Per-Runbook Resolution SLAs (Replace Blanket <5 min)
- **Requirement**: Each runbook gets its own resolution SLA based on complexity
- **Addressed in**: BI-3 (Operational Runbooks)
- **Updated SLAs**:
  - Runbook 1 (Agent Timeout): **2-5 minutes**
  - Runbook 2 (Paperclip API Failure): **15-30 minutes** (or escalate)
  - Runbook 3 (Approval Deadlock): **1-4 hours** (depends on user response)
  - Runbook 4 (Budget Exhausted): **next day** (midnight reset) or user override
  - Runbook 5 (Audit Trail Gap): **2-4 hours** (investigation required)
  - Runbook 6 (Skeptic/Verifier Override): **15-30 minutes**

#### OPS-4: Slack/Email Notification Templates in All Runbooks
- **Requirement**: Each runbook includes pre-written notification templates for Slack and email
- **Addressed in**: BI-3 (Operational Runbooks)
- **Deliverable**: Each `.paperclip/runbooks/*.md` file includes a "Notifications" section with:
  - Slack message template (copy-paste ready, with severity, summary, action needed)
  - Email template (subject line, body, recipients)
  - Escalation notification template (for management escalation)

#### OPS-5: Implement Real rollback.sh (Not Pseudocode)
- **Requirement**: `.paperclip/rollback.sh` must be a working bash script with graceful shutdown, not pseudocode
- **Addressed in**: BI-6 (Operations Automation)
- **Deliverable**: `.paperclip/rollback.sh` -- executable script with:
  - `set -euo pipefail` for safety
  - Graceful agent shutdown (SIGTERM before SIGKILL, with timeout)
  - Git tag verification (restore to tagged phase checkpoint)
  - Phase 2 integration test execution post-rollback
  - Status report output (success/failure, time taken, any errors)
  - Dry-run mode (`--dry-run` flag for testing without changes)

#### OPS-6: Rollback Staging Test with Recorded Execution Time
- **Requirement**: Execute rollback in staging and record actual time; must verify <10 min SLA
- **Addressed in**: BI-6 (Operations Automation)
- **Deliverable**: `.paperclip/rollback-test-results.md` with:
  - Execution timestamp
  - Time to complete each rollback step
  - Total execution time (must be <10 minutes)
  - Post-rollback test results (Phase 2 integration tests must pass)
  - Any issues encountered and resolution

#### OPS-7: Git Tags for Rollback Points (Not git reset --hard)
- **Requirement**: Use `git tag` at each phase completion for safe rollback; never use `git reset --hard`
- **Addressed in**: BI-6 rollback script, Phase 2 exit criteria
- **Tag convention**:
  - `phase-1-complete` -- after Phase 1 audit
  - `phase-2-blocking-items-complete` -- after all 6 blocking items resolved
  - `phase-2-wave-A-complete` through `phase-2-wave-D-complete`
  - `phase-2-complete` -- after Phase 2 exit criteria met
- **Rollback**: `git checkout <tag>` instead of destructive reset

#### OPS-8: Tabletop Drills for On-Call Training
- **Requirement**: Schedule tabletop exercises simulating each runbook scenario
- **Addressed in**: BI-3 (Operational Runbooks)
- **Deliverable**: `.paperclip/tabletop-drill-schedule.md`
- **Scope**:
  - One drill per runbook (6 drills total)
  - Simulate scenario in staging, on-call engineer walks through steps
  - Record time to resolution, identify gaps in procedure
  - Revise runbook if gaps found
  - Schedule: complete all drills before Phase 3 start

### Backend Distinguished Engineer Conditions (BE-1 through BE-4)

#### BE-1: Fix Skeptic Invocation Ordering Contradiction
- **Requirement**: Resolve contradiction between sections 2.2 and 2.5 regarding when skeptic is invoked
- **Addressed in**: Sub-Phases 2.2 and 2.5 (clarification below)
- **Resolution**: The canonical ordering is defined in the approval state machine (2.3). Clarified as:
  - **2.2 (Authority Matrix)**: Skeptic is a mandatory reviewer with veto power. Skeptic reviews FIRST in the approval flow (before verifier and approver).
  - **2.5 (Delegation Mapping)**: Skeptic task type is "skeptic_review". Invoked by the approval state machine when task transitions from `pending` to `skeptic_review` state. NOT invoked by the approver agent.
  - **Canonical flow**: pending -> skeptic_review -> verifier_review -> awaiting_approver
  - **Previous contradiction**: 2.5 stated skeptic is "invoked after approver proposes approval" -- this is REMOVED. Skeptic always reviews before approver.

#### BE-2: Fallback Designs for Missing Paperclip Capabilities
- **Requirement**: For each critical Paperclip capability, design a fallback if the capability is missing or degraded
- **Addressed in**: Sub-Phase 2.1 (Capability Verification)
- **Deliverable**: `.paperclip/capability-fallbacks.json`
- **Fallbacks**:
  - **File ACL missing**: Implement file access control in `src/agent-wrapper.js` using Node.js fs permission checks before delegating to agent. Log all file access attempts.
  - **Budget enforcement missing**: Implement token counting in `src/paperclip-adapter.js` using Anthropic API usage metadata. Track per-agent totals locally. Hard-stop at limits via adapter layer.
  - **Audit logging missing/degraded**: Implement local append-only audit log in `.paperclip/audit-log.jsonl` with crypto signatures. Sync to Paperclip when available. Alert on sync gaps.
  - **Heartbeat missing**: Implement local heartbeat monitor in `src/heartbeat-monitor.js` that polls agent status. Use process signals (SIGTERM) for circuit breaker.
  - **Approval gating missing**: Implement approval state machine locally in `.paperclip/local-state-machine.js`. Queue approvals locally; sync to Paperclip when available.
- **Gate**: If 3+ capabilities are missing, escalate to CEO for vendor re-evaluation

#### BE-3: Budget Calibration Step (Measure Actual Token Consumption)
- **Requirement**: Before finalizing budget thresholds, measure actual token consumption from existing agent runs
- **Addressed in**: Sub-Phase 2.7 (Budget Enforcement Model) -- new calibration step
- **Deliverable**: `.paperclip/budget-calibration-data.json`
- **Procedure**:
  1. Run 5 sample incidents through existing agents (router, retriever, skeptic, verifier)
  2. Record actual token consumption per agent per incident
  3. Calculate: mean, p50, p90, p99 token usage per agent
  4. Set per-agent budget at p99 + 20% headroom
  5. Set per-incident budget at sum of all agent p99 values + 30% headroom
  6. Set daily org budget based on expected incident volume * per-incident budget
- **Gate**: Budget thresholds must be data-driven, not arbitrary. Calibration data required before budget-model.json is finalized.

#### BE-4: Consolidate Duplicate "Files Likely to Change" Sections
- **Requirement**: The parent PAPERCLIP_INTEGRATION_PLAN.md Phase 2 section has two duplicate "Files Likely to Change" blocks -- consolidate into one
- **Addressed in**: PAPERCLIP_INTEGRATION_PLAN.md (document fix)
- **Action**: Merge the two lists into a single consolidated "Files Likely to Change" section. Remove the duplicate. This execution plan uses the consolidated list in the Code Artifacts section.
- **Note**: This is a documentation fix, not a design change. The consolidated list is already reflected in this execution plan's Code Artifacts section.

### CEO/Executive Conditions (CEO-1 through CEO-5)

#### CEO-1: Capability Gate FIRST -- No Design Until Verified
- **Requirement**: Blocking Item #1 (Paperclip Capability Gate) must be executed and passed BEFORE any other blocking item or design work begins
- **Addressed in**: Execution sequencing (Phase 0 gate)
- **Impact**: Restructures execution into Phase 0 (capability gate) -> Phase 1 (remaining blocking items) -> Phase 2 (design). No parallel work on blocking items #2-6 until capability gate passes.
- **Gate**: If any critical Paperclip capability is missing, STOP everything and escalate to CEO immediately

#### CEO-2: Ops Resource Allocation Confirmed Within 24 Hours
- **Requirement**: Named Ops engineer assigned full-time to blocking items #2, #3, #6 within 24 hours of approval
- **Addressed in**: Resource allocation (immediate action)
- **Deliverable**: Written confirmation to CEO with assigned engineer name and availability commitment

#### CEO-3: All 6 Blocking Items Resolved Before Phase 2 Design (Non-Negotiable)
- **Requirement**: Zero exceptions -- all 6 blocking items must have documented sign-off before any Phase 2 design sub-phase begins
- **Addressed in**: Execution sequencing gate
- **Enforcement**: Phase 2 design cannot start until all 6 blocking items are marked COMPLETE with owner + reviewer + approver sign-off

#### CEO-4: Weekly Executive Checkpoint
- **Requirement**: 15-minute status update every Friday for CEO
- **Addressed in**: Ongoing governance
- **Format**: Current phase, blocking issues, budget status, timeline adherence, risk summary
- **First checkpoint**: Friday after execution begins

#### CEO-5: CEO Sign-Off Required at Phase 2 Exit Before Phase 3
- **Requirement**: CEO must personally approve Phase 2 design outputs before Phase 3 (code implementation) can begin
- **Addressed in**: Phase 2 Exit Criteria (additional gate)
- **Scope**: CEO reviews high-level design decisions, budget model, timeline, and risk assessment
- **Gate**: CEO REJECT = Phase 3 blocked until concerns addressed

### All Conditions Traceability Matrix (28 conditions)

| ID | Condition | Sub-Phase | Artifact | Owner |
|----|-----------|-----------|----------|-------|
| CEO-1 | Capability gate FIRST | Phase 0 | (sequencing) | CEO |
| CEO-2 | Ops resource allocation 24hr | Immediate | Confirmation | CEO + Ops |
| CEO-3 | All 6 BIs before Phase 2 | Gate | (enforcement) | CEO |
| CEO-4 | Weekly executive checkpoint | Ongoing | Status report | CEO |
| CEO-5 | CEO sign-off at Phase 2 exit | Exit | (approval) | CEO |
| SC-1 | Input validation (prompt injection) | 2.4 | `input-validation-spec.json` | Security |
| SC-2 | File operation allowlist | 2.2 | `file-access-allowlist.json` | Security |
| SC-3 | API key handoff | 2.1 + BI-4 | `api-key-handoff-procedure.md` | Security |
| SC-4 | Log sanitization | 2.8 | `log-sanitization-rules.json` | Security |
| SC-5 | Security review gate | Exit | `security-review-phase2.md` | Security |
| SC-6 | BI-4 hard prerequisite | Dependency | (enforcement) | Security |
| QA-1 | 3 new test scenarios (10 total) | BI-5 | Test code | QA |
| QA-2 | 5 state machine paths in Scenario 3 | BI-5 | Test code | QA |
| QA-3 | Staging environment spec | BI-5 | `staging-env-spec.md` | QA |
| QA-4 | Tiered coverage (90/70/60) | BI-5 | CI/CD config | QA |
| QA-5 | CI/CD pipeline definition first | BI-5 | `.github/workflows/test.yml` | QA |
| OPS-1 | Day 1 monitoring stack decision | BI-2 | Decision doc | Ops + CEO |
| OPS-2 | BI-2 depends on BI-1 | Dependency | (enforcement) | Ops |
| OPS-3 | Per-runbook SLAs | BI-3 | Runbook updates | Ops |
| OPS-4 | Slack/email templates | BI-3 | Runbook updates | Ops |
| OPS-5 | Real rollback.sh (not pseudocode) | BI-6 | `rollback.sh` | Ops |
| OPS-6 | Rollback staging test + timing | BI-6 | `rollback-test-results.md` | Ops |
| OPS-7 | Git tags for rollback (not reset) | BI-6 | Tag convention | Ops |
| OPS-8 | Tabletop drills | BI-3 | `tabletop-drill-schedule.md` | Ops |
| BE-1 | Fix skeptic ordering contradiction | 2.2 + 2.5 | Doc fix | Backend |
| BE-2 | Fallback designs for missing caps | 2.1 | `capability-fallbacks.json` | Backend |
| BE-3 | Budget calibration with real data | 2.7 | `budget-calibration-data.json` | Backend |
| BE-4 | Consolidate duplicate file lists | Doc fix | (cleanup) | Backend |

---

## Blocking Items Gate

**CRITICAL SEQUENCING (CEO-1)**: Blocking Item #1 (Capability Gate) must pass FIRST before any other blocking item begins. All 6 must be resolved before Phase 2 design (CEO-3).

### Phase 0: Capability Gate (BI-1 MUST BE FIRST per CEO-1)

This is the single blocking gate. If it fails, all subsequent work stops.

#### BI-1: Paperclip Capability Gate Verification
- **Owner**: Backend Distinguished Engineer + Paperclip Team
- **Timeline**: 2-3 days -- START IMMEDIATELY (target 2026-03-11)
- **Deliverable**: `.paperclip/compatibility-matrix.json` documenting 8 API capabilities
- **(BE-2)**: Also produce `.paperclip/capability-fallbacks.json` with fallback designs for each capability if missing
- **Must verify**: File ACL, task routing, budget enforcement, approval gating, audit logging, user escalation, heartbeat protocol, concurrent task handling
- **GATE PASS**: All 8 capabilities verified -> proceed to remaining blocking items
- **GATE FAIL**: Any critical capability missing -> STOP EVERYTHING, escalate to CEO immediately. If 3+ missing, evaluate alternative vendors.
- **Fail action**: STOP all work; escalate to CEO + CTO for alternative evaluation

### Phase 1: Remaining Blocking Items (PARALLEL -- only after Phase 0 gate passes)

Items #2-6 can execute in parallel once BI-1 capability gate is confirmed. CEO-2 requires Ops resource allocation confirmed within 24 hours.

#### BI-2: Monitoring Dashboards Deployment
- **Owner**: Operations/DevOps Lead
- **Timeline**: 3-5 days (target 2026-03-12)
- **NEW (OPS-1)**: CRITICAL DAY 1 -- Select monitoring stack (Datadog vs Grafana+Prometheus) and get CEO cost approval before implementation begins
- **NEW (OPS-2)**: Dashboard metric wiring depends on BI-1 (Paperclip API metrics endpoints). Design can start in parallel; metric integration blocked until BI-1 completes.
- **Deliverable**: Live dashboard with agent health, task flow, budget consumption, approval latency, escalation queue, audit trail status
- **Alerting**: Heartbeat missed (immediate), budget 75%/90%/100% (escalating), approval queue >5 (bottleneck), audit log gap (critical)
- **Fail action**: Phase 2 proceeds with degraded observability; must be resolved before Phase 3

### BI-3: Operational Runbooks
- **Owner**: Operations/DevOps Lead
- **Timeline**: 2-3 days (target 2026-03-11)
- **Deliverable**: 6 runbooks (agent timeout, API failure, approval deadlock, budget exhausted, audit trail gap, skeptic/verifier override)
- **NEW (OPS-3)**: Per-runbook resolution SLAs (not blanket <5 min):
  - Agent Timeout: 2-5 min | API Failure: 15-30 min | Approval Deadlock: 1-4 hr | Budget Exhausted: next day/override | Audit Gap: 2-4 hr | Override: 15-30 min
- **NEW (OPS-4)**: Each runbook includes Slack and email notification templates (copy-paste ready)
- **NEW (OPS-8)**: Schedule tabletop drills -- one drill per runbook, complete before Phase 3. Deliverable: `.paperclip/tabletop-drill-schedule.md`
- **Gate**: All 6 tested in staging, on-call engineer trained, tabletop drills scheduled

### BI-4: Security Specification
- **Owner**: Security/Compliance Officer
- **Timeline**: 2-3 days (target 2026-03-11)
- **Deliverable**: Encryption strategy (TLS 1.3, AES-256-GCM, envelope encryption), audit trail architecture (append-only, crypto-signed, 2-year retention), incident response procedures (15min detection, 1hr containment, 4hr notification)
- **NEW (SC-6)**: HARD prerequisite -- must be complete before sub-phase 2.8 and SC-3 deliverables can begin
- **Dependency**: Partially depends on BI-1 (Paperclip feature set)

### BI-5: Testing Framework and Integration Tests
- **Owner**: QA Engineer
- **Timeline**: 3-4 days (target 2026-03-12)
- **Deliverable**: Jest/Mocha installed, test fixtures, Paperclip API mocks, CI/CD integration
- **NEW (QA-1)**: 10 integration test scenarios (was 7; added error handling, concurrency, CLAUDE.md contract enforcement)
- **NEW (QA-2)**: Scenario 3 expanded to cover all 5 state machine paths
- **NEW (QA-3)**: Staging environment spec: `.paperclip/staging-env-spec.md` (separate from mock tests)
- **NEW (QA-4)**: Tiered coverage targets: 90% (state machine, budget, audit), 70% (authority, schema, heartbeat), 60% floor (others)
- **NEW (QA-5)**: `.github/workflows/test.yml` created BEFORE test code implementation
- **Gate**: CI/CD passing on main, tiered coverage thresholds met

### BI-6: Operations Automation
- **Owner**: Operations/DevOps Lead
- **Timeline**: 2-3 days (target 2026-03-11)
- **NEW (OPS-5)**: `.paperclip/rollback.sh` must be a real executable script with graceful shutdown (SIGTERM->SIGKILL), not pseudocode. Includes `--dry-run` mode.
- **NEW (OPS-6)**: Execute rollback in staging, record time. Deliverable: `.paperclip/rollback-test-results.md` with step-by-step timing.
- **NEW (OPS-7)**: Use `git tag` for rollback points at each phase completion. Never use `git reset --hard`. Tag convention: `phase-1-complete`, `phase-2-blocking-items-complete`, `phase-2-wave-{A..D}-complete`, `phase-2-complete`.
- **Deliverable**: `.paperclip/rollback.sh` (real script), on-call authority matrix, escalation flowchart, rollback test results
- **Gate**: Rollback tested in staging (<10 min verified), on-call trained, git tags documented

### Execution Sequencing (CEO-1 mandated)

```
PHASE 0: CAPABILITY GATE (BI-1 ONLY -- MUST BE FIRST)
═══════════════════════════════════════════════════════
Day 1 (2026-03-09):
  IMMEDIATE: Confirm Ops resource allocation to CEO (CEO-2)
  IMMEDIATE: CEO-4 weekly checkpoint schedule established (Fridays)
  START: BI-1 Capability Gate (Backend Engineer + Paperclip team call)

Day 2 (2026-03-10):
  CONTINUE: BI-1 (Capability testing + fallback designs per BE-2)

Day 3 (2026-03-11):
  COMPLETE: BI-1 (Sign-off + compatibility-matrix.json + capability-fallbacks.json)
  GATE CHECK: All 8 capabilities verified?
    → YES: Proceed to Phase 1 (remaining blocking items)
    → NO:  STOP. Escalate to CEO immediately.

PHASE 1: REMAINING BLOCKING ITEMS #2-6 (PARALLEL -- only after BI-1 passes)
════════════════════════════════════════════════════════════════════════════
Day 3 (2026-03-11) -- immediately after BI-1 gate passes:
  DECISION: OPS-1 monitoring stack selection + CEO cost approval
  START: BI-2 (Dashboard design; metric wiring uses BI-1 results per OPS-2)
  START: BI-3 (Runbook writing with per-runbook SLAs + notification templates)
  START: BI-4 (Security spec -- now has BI-1 feature confirmation)
  START: BI-5 (Create .github/workflows/test.yml FIRST per QA-5, then install framework)
  START: BI-6 (Write real rollback.sh per OPS-5 + git tag convention per OPS-7)

Day 4 (2026-03-12):
  CONTINUE: BI-2 (Dashboard staging deploy with Paperclip metrics)
  CONTINUE: BI-3 (Runbook testing + schedule tabletop drills per OPS-8)
  COMPLETE: BI-4 (Security sign-off -- unblocks 2.8 and SC-3)
  CONTINUE: BI-5 (Test fixtures + mocks + staging env spec per QA-3)
  COMPLETE: BI-6 (Rollback tested in staging per OPS-6, time recorded)

Day 5 (2026-03-13):
  COMPLETE: BI-2 (Dashboard live with all metrics)
  COMPLETE: BI-3 (On-call training + tabletop drill schedule)
  COMPLETE: BI-5 (10 test scenarios per QA-1, expanded Scenario 3 per QA-2, CI/CD passing)
  GIT TAG: phase-2-blocking-items-complete (per OPS-7)
  ALL 6 BLOCKING ITEMS RESOLVED (CEO-3 satisfied)
  CEO-4: First weekly checkpoint (Friday status update)
  Stakeholder meeting (afternoon)

PHASE 2 DESIGN: begins Day 6 (only after all 6 blocking items signed off)
```

---

## Phase 2 Design Sub-Phases

Phase 2 consists of 10 sub-phases (2.1 through 2.10), each producing design artifacts. These are design-only -- no production code changes until Phase 3.

### Sub-Phase 2.1: Paperclip Capability Verification
- **Input**: BI-1 compatibility matrix
- **Work**: Confirm Paperclip API supports file-level access control, task routing, budget enforcement, approval gating, audit logging
- **Output**: `.paperclip/compatibility-matrix.json` with verified API endpoints and request/response examples
- **Security (SC-3)**: Also produce `.paperclip/api-key-handoff-procedure.md` documenting secure key transfer from local `.env` to Paperclip (envelope encryption, rotation, revocation). Depends on BI-4.
- **Backend (BE-2)**: Also produce `.paperclip/capability-fallbacks.json` with fallback designs for each of the 5 critical capabilities (file ACL, budget, audit, heartbeat, approval gating)
- **Dependencies**: None (first sub-phase); SC-3 deliverable also depends on BI-4
- **Gate**: If any capability is missing, activate corresponding fallback from BE-2. If 3+ missing, STOP and escalate.

### Sub-Phase 2.2: Agent Authority Matrix
- **Input**: Existing `.claude/agents/*.md`, Paperclip capabilities
- **Work**: Define explicit approval authority and veto rules for skeptic, verifier, approver, orchestrator
- **Output**: `.paperclip/agent-authority.json`
- **Security (SC-2)**: Also produce `.paperclip/file-access-allowlist.json` defining per-agent file operation permissions (read/write/delete). No agent may write to protected files (CLAUDE.md, .claude/agents/*, .env, src/run.js, package.json)
- **Backend (BE-1)**: Skeptic ordering clarified -- skeptic reviews FIRST in approval flow (before verifier and approver). Canonical flow: pending -> skeptic_review -> verifier_review -> awaiting_approver. The contradiction where skeptic was described as "invoked after approver proposes approval" is REMOVED.
- **Key rules**:
  - Skeptic: mandatory FIRST reviewer, has veto power, override requires user escalation
  - Verifier: mandatory for claims (after skeptic approves), no unilateral block, can escalate to skeptic
  - Approver: final decision only if skeptic approves; must escalate if skeptic blocks
  - Orchestrator: routes tasks only, no approval authority
  - Tiebreaker: skeptic + verifier both block = user escalation (4-hour SLA)
- **Dependencies**: 2.1 (need confirmed API capabilities)

### Sub-Phase 2.3: Approval State Machine
- **Input**: Agent authority matrix (2.2)
- **Work**: Define formal state machine with states, transitions, and timeouts
- **Output**: `.paperclip/approval-state-machine.json`, `.paperclip/approval-state-machine.md` (visual)
- **States**: pending, skeptic_review, verifier_review, awaiting_approver, approved, blocked, escalated, user_override
- **Timeout**: 4 hours per state; 8 hours for user response before management escalation
- **QA (QA-2)**: All 5 transition paths must be explicitly tested:
  1. Happy path: pending -> skeptic_review (approve) -> verifier_review (proceed) -> awaiting_approver (approve) -> approved
  2. Skeptic block: pending -> skeptic_review (block) -> blocked
  3. Verifier escalation: pending -> skeptic_review (approve) -> verifier_review (unverifiable) -> escalated
  4. Timeout: pending -> skeptic_review (4hr timeout) -> escalated
  5. User override: escalated -> user_override (with justification) -> approved
- **Dependencies**: 2.2

### Sub-Phase 2.4: Task Contract Schema
- **Input**: CLAUDE.md output contract, Paperclip task model
- **Work**: Define task schema preserving all CLAUDE.md fields (root_cause, evidence, fix_plan, rollback, tests, confidence)
- **Output**: `.paperclip/task-schema.json`
- **Security (SC-1)**: Also produce `.paperclip/input-validation-spec.json` defining input sanitization rules against prompt injection (system prompt overrides, role impersonation, delimiter injection, fabricated evidence references, arbitrary rule injection)
- **Validation**: Task cannot complete unless all output fields non-empty and state = "approved". All inputs must pass SC-1 validation before reaching any agent.
- **Dependencies**: 2.1 (Paperclip schema capabilities)

### Sub-Phase 2.5: Agent Delegation Mapping
- **Input**: `.claude/agents/*.md`, task schema (2.4)
- **Work**: Map each repo agent to Paperclip task types with input/output contracts
- **Output**: `.paperclip/agent-mapping.json`, `src/agent-wrapper.js` (design spec)
- **Backend (BE-1)**: Skeptic invocation clarified -- skeptic task ("skeptic_review") is invoked by the approval state machine when task transitions from `pending` to `skeptic_review`. NOT invoked by the approver agent.
- **Mappings**:
  - router.md -> "classify_failure" task (invoked by orchestrator on task creation)
  - retriever.md -> "retrieve_evidence" task (invoked after classification; budget: 500 tokens/task)
  - skeptic.md -> "skeptic_review" task (invoked by state machine at `pending -> skeptic_review`; veto authority)
  - verifier.md -> "verify_claims" task (invoked by state machine at `skeptic_review -> verifier_review`; escalation authority)
- **Dependencies**: 2.2, 2.4

### Sub-Phase 2.6: Heartbeat Protocol
- **Input**: Paperclip heartbeat API (from 2.1)
- **Work**: Define heartbeat frequency, timeout, escalation ladder, circuit breaker
- **Output**: `.paperclip/heartbeat-config.json`
- **Spec**: 30s heartbeat, 2min timeout (4 missed), escalation ladder (warn -> alert ops -> kill + escalate)
- **Dependencies**: 2.1

### Sub-Phase 2.7: Budget Enforcement Model
- **Input**: Paperclip budget API (from 2.1), agent delegation mapping (2.5)
- **Work**: Define budget scopes (per-agent/day, per-incident, daily org), enforcement points, escalation thresholds
- **Output**: `.paperclip/budget-model.json`
- **Backend (BE-3)**: NEW calibration step -- before finalizing thresholds, run 5 sample incidents through existing agents and record actual token consumption. Deliverable: `.paperclip/budget-calibration-data.json` with mean/p50/p90/p99 per agent. Set budgets at p99 + 20% headroom (per-agent) and sum of p99 + 30% headroom (per-incident).
- **Thresholds**: 75% alert, 90% escalate, 100% hard stop (values derived from calibration data, not arbitrary)
- **Dependencies**: 2.1, 2.5

### Sub-Phase 2.8: Audit Logging Specification
- **Input**: Security spec (BI-4), Paperclip audit API (from 2.1)
- **Work**: Define audit event schema, immutability requirements, query interface, retention policy
- **Output**: `.paperclip/audit-logger.js` (design spec with crypto signing), `.paperclip/audit-schema.json`
- **Security (SC-4)**: Also produce `.paperclip/log-sanitization-rules.json` defining PII/secret stripping rules. Sanitization at write time, not post-hoc. Patterns: `*_KEY`, `*_SECRET`, `*_TOKEN`, `*_PASSWORD`, emails, IPs. Replaced with `[REDACTED:<type>]`.
- **Requirements**: Immutable, queryable, 2-year retention, cryptographic signatures, PII-free
- **Dependencies**: 2.1, BI-4 (HARD prerequisite per SC-6 -- cannot begin until BI-4 signed off)

### Sub-Phase 2.9: Manual vs Automated Boundaries
- **Input**: Agent authority (2.2), approval state machine (2.3)
- **Work**: Define which decisions are automated (classification, retrieval, reviews) vs manual (final approvals, budget overrides, escalations, governance overrides)
- **Output**: `.paperclip/governance.json`
- **Default**: "Always escalate to human" for initial Phase 2
- **Dependencies**: 2.2, 2.3

### Sub-Phase 2.10: Parallel Execution Contract
- **Input**: Agent delegation mapping (2.5), task schema (2.4)
- **Work**: Define isolation rules, concurrency matrix, merge strategy, serialization fallback
- **Output**: `.paperclip/parallel-execution-contract.json`
- **Key rules**:
  - retriever + skeptic: parallel OK (independent inputs)
  - skeptic + verifier: serial (verifier needs skeptic output)
  - orchestrator + router: serial (delegation chain)
  - Conflict fallback: switch to serial after 2+ conflicts/day
- **Dependencies**: 2.4, 2.5

---

## Code Artifacts to be Created

### Configuration Files (Phase 2 Design Outputs)

| File | Sub-Phase | Purpose |
|------|-----------|---------|
| `.paperclip/compatibility-matrix.json` | 2.1 | Verified Paperclip API capabilities |
| `.paperclip/capability-fallbacks.json` | 2.1 (BE-2) | Fallback designs for missing capabilities |
| `.paperclip/agent-authority.json` | 2.2 | Veto/approval rules per agent |
| `.paperclip/approval-state-machine.json` | 2.3 | State transitions and timeouts |
| `.paperclip/approval-state-machine.md` | 2.3 | Visual state machine diagram |
| `.paperclip/task-schema.json` | 2.4 | Task contract with CLAUDE.md fields |
| `.paperclip/agent-mapping.json` | 2.5 | Repo agent to Paperclip task mapping |
| `.paperclip/heartbeat-config.json` | 2.6 | Heartbeat protocol specification |
| `.paperclip/budget-model.json` | 2.7 | Budget scopes and enforcement |
| `.paperclip/budget-calibration-data.json` | 2.7 (BE-3) | Actual token consumption measurements |
| `.paperclip/audit-schema.json` | 2.8 | Audit event schema |
| `.paperclip/governance.json` | 2.9 | Manual vs automated boundaries |
| `.paperclip/parallel-execution-contract.json` | 2.10 | Isolation and concurrency rules |

### Security Condition Artifacts

| File | Condition | Purpose |
|------|-----------|---------|
| `.paperclip/input-validation-spec.json` | SC-1 | Prompt injection mitigation rules |
| `.paperclip/file-access-allowlist.json` | SC-2 | Per-agent file operation permissions |
| `.paperclip/api-key-handoff-procedure.md` | SC-3 | Secure key transfer procedure |
| `.paperclip/log-sanitization-rules.json` | SC-4 | PII/secrets stripping rules |
| `.paperclip/security-review-phase2.md` | SC-5 | Security review sign-off document |

### QA and Ops Condition Artifacts

| File | Condition | Purpose |
|------|-----------|---------|
| `.github/workflows/test.yml` | QA-5 | CI/CD pipeline definition |
| `.paperclip/staging-env-spec.md` | QA-3 | Staging environment specification |
| `.paperclip/rollback.sh` | OPS-5 | Real executable rollback script |
| `.paperclip/rollback-test-results.md` | OPS-6 | Rollback staging test timing record |
| `.paperclip/tabletop-drill-schedule.md` | OPS-8 | On-call training drill schedule |
| `.paperclip/runbooks/*.md` | OPS-3/4 | 6 runbooks with per-runbook SLAs + notification templates |

### Source Code Design Specs (Implemented in Phase 3)

| File | Sub-Phase | Purpose |
|------|-----------|---------|
| `.paperclip/audit-logger.js` | 2.8 | Audit trail with crypto signing (design spec) |
| `src/agent-wrapper.js` | 2.5 | Agent format translation layer (design spec) |
| `src/paperclip-adapter.js` | 2.5 | Adapter between repo logic and Paperclip (design spec) |

### Files That Must NOT Change

- `CLAUDE.md` -- project rules (read for constraints only)
- `.claude/agents/*` -- original agent implementations (wrap, do not modify)
- `src/run.js` -- entry point (wrap with adapter, do not rewrite)
- `package.json` -- core logic (add Paperclip client dependency only)

### Documentation Fix (BE-4)

- Consolidate duplicate "Files Likely to Change" sections in `PAPERCLIP_INTEGRATION_PLAN.md` Phase 2 into single list

---

## QA Test Procedures

### Phase 2 Design Verification Tests

Each sub-phase design output must pass these verification checks before sign-off:

#### V-2.1: Capability Compatibility
- [ ] All 8 Paperclip API capabilities verified with live demo
- [ ] API endpoints documented with request/response examples
- [ ] Compatibility matrix signed off by both Paperclip team and Backend Engineer
- [ ] (BE-2) Fallback designs documented for each capability

#### V-2.2: Task Schema Validation
- [ ] Schema includes all CLAUDE.md output fields (root_cause, evidence, fix_plan, rollback, tests, confidence)
- [ ] Schema enforces non-empty values for required fields
- [ ] Validation test confirms task cannot complete with missing fields

#### V-2.3: Agent Authority Matrix
- [ ] No unresolved deadlocks in authority rules
- [ ] All veto paths have explicit resolution
- [ ] Authority rules are deterministic (same input = same routing)
- [ ] (BE-1) Skeptic ordering confirmed: skeptic reviews FIRST, before verifier and approver

#### V-2.4: Approval State Machine (QA-2 expanded -- all 5 paths)
- [ ] Path 1 (Happy): pending -> skeptic_review (approve) -> verifier_review (proceed) -> awaiting_approver (approve) -> approved
- [ ] Path 2 (Skeptic block): pending -> skeptic_review (block) -> blocked
- [ ] Path 3 (Verifier escalation): pending -> skeptic_review (approve) -> verifier_review (unverifiable) -> escalated
- [ ] Path 4 (Timeout): pending -> skeptic_review (4hr timeout) -> escalated
- [ ] Path 5 (User override): escalated -> user_override (with justification) -> approved

#### V-2.5: Agent Delegation Mapping
- [ ] Each repo agent has exactly one Paperclip task type mapping
- [ ] Input/output contracts match task schema
- [ ] No agent overlap (each task type has one owner)
- [ ] (BE-1) Skeptic invocation confirmed: triggered by state machine, not by approver

#### V-2.6: Heartbeat and Budget
- [ ] Heartbeat: 30s interval, 2min timeout validated
- [ ] Budget: alerts at 75%, 90%, 100% thresholds confirmed
- [ ] Circuit breaker: agent marked unavailable after 4 missed heartbeats
- [ ] (BE-3) Budget thresholds derived from calibration data (not arbitrary)

### Integration Test Scenarios (10 scenarios -- QA-1 expanded)

These are documented in Phase 2 and executed against real Paperclip staging (QA-3):

| # | Scenario | Pass Criteria | Tags |
|---|----------|---------------|------|
| 1 | Task Creation + Schema Validation | Paperclip accepts valid task, returns proper ID, schema includes CLAUDE.md fields | @integration |
| 2 | Router Agent Invocation | Task routed to router, returns failure classification | @integration |
| 3a | Approval Workflow -- Happy Path | pending -> skeptic(approve) -> verifier(proceed) -> approver(approve) -> approved | @e2e |
| 3b | Approval Workflow -- Skeptic Block | pending -> skeptic(block) -> blocked | @e2e |
| 3c | Approval Workflow -- Verifier Escalation | pending -> skeptic(approve) -> verifier(unverifiable) -> escalated | @e2e |
| 3d | Approval Workflow -- Timeout | pending -> skeptic(4hr timeout) -> escalated | @e2e |
| 3e | Approval Workflow -- User Override | escalated -> user_override(justified) -> approved | @e2e |
| 4 | Budget Enforcement | Over-budget task rejected with proper error | @integration |
| 5 | Audit Logging | All approval steps logged with timestamps | @integration |
| 6 | Heartbeat Detection | Missed heartbeat detected and escalated | @integration |
| 7 | Rollback State Consistency | Post-rollback: clean state, no orphaned tasks | @e2e |
| 8 | Error Handling (QA-1) | Malformed task returns structured error; no partial creation; error logged | @integration |
| 9 | Concurrency (QA-1) | 3 simultaneous tasks: no race conditions, no shared state corruption | @integration |
| 10 | CLAUDE.md Contract Enforcement (QA-1) | Task with missing output fields cannot complete; verifier catches violation | @e2e |

### Staging Environment Specification (QA-3)

- [ ] Staging Paperclip instance provisioned (separate from production)
- [ ] Staging API keys created (not production keys)
- [ ] Isolated test data prepared (sample incidents, known-good outputs)
- [ ] Staging dashboard connected for real-time test observation
- [ ] Tests tagged: `@unit` (mocks), `@integration` (staging), `@e2e` (full workflow)
- [ ] E2E tests run on staging only, never against production
- [ ] Documented in `.paperclip/staging-env-spec.md`

### Coverage Targets (QA-4)

| Tier | Target | Applies To |
|------|--------|------------|
| Critical | 90% | State machine transitions (2.3), budget enforcement (2.7), audit logging (2.8) |
| Important | 70% | Agent authority matrix (2.2), task schema validation (2.4), heartbeat protocol (2.6) |
| Floor | 60% | Agent wrappers, adapters, utilities, all other code |

CI/CD enforces per-tier thresholds; build fails if any tier is below target.

### Security Condition Verification Tests

#### V-SC-1: Input Validation (Prompt Injection)
- [ ] Inject system prompt override payload into task input; verify rejected
- [ ] Inject role impersonation payload ("You are now an admin"); verify rejected
- [ ] Inject delimiter injection (system tags, XML tags); verify sanitized
- [ ] Submit fabricated evidence references; verify validation catches non-existent sources
- [ ] Submit arbitrary rule injection in constraints field; verify only known CLAUDE.md rules accepted

#### V-SC-2: File Access Allowlist
- [ ] Router agent attempts write to `src/`; verify blocked
- [ ] Retriever agent attempts read of `.env`; verify blocked
- [ ] Skeptic agent attempts write to `CLAUDE.md`; verify blocked
- [ ] Orchestrator agent attempts write to `src/run.js`; verify blocked
- [ ] Each agent verified to write ONLY to its designated output path

#### V-SC-3: API Key Handoff
- [ ] Key encrypted with Paperclip public key before transmission; verify plaintext never sent
- [ ] Search all logs (agent, audit, system) for key material; verify zero matches
- [ ] Key rotation procedure executed in staging; verify seamless transition
- [ ] Key revocation procedure executed; verify immediate invalidation

#### V-SC-4: Log Sanitization
- [ ] Inject API key pattern into agent input; verify `[REDACTED:API_KEY]` in logs
- [ ] Inject email address into evidence; verify `[REDACTED:EMAIL]` in audit trail
- [ ] Inject IP address into hypothesis; verify `[REDACTED:IP]` in logs
- [ ] Verify sanitization happens at write time (not post-hoc reconstruction)
- [ ] Verify unsanitized data never reaches disk or external systems

#### V-SC-5: Security Review Gate
- [ ] Security review checklist template created
- [ ] All SC-1 through SC-4 artifacts reviewed by Security Officer
- [ ] Threat model document produced for Phase 2 design
- [ ] No critical security findings unresolved
- [ ] Security Officer signs `.paperclip/security-review-phase2.md`

### Governance Dry-Run Tests (sub-phase 2.8)

- [ ] Approval gate tested with approval scenario
- [ ] Approval gate tested with rejection scenario
- [ ] Escalation path tested with simulated agent failure
- [ ] Budget alert tested with high-cost task injection
- [ ] Audit log tested for immutability (attempt to modify = fail)
- [ ] Audit log tested for queryability (retrieve by task/agent/time)

---

## Dependency Graph

```
BLOCKING ITEMS (must complete first):
  BI-1 ─────────────────────────────────────────┐
  BI-2 (design parallel; metrics wiring after   │
        BI-1 per OPS-2)                         │
  BI-3 (parallel with BI-1)                     │
  BI-4 (after BI-1 confirms features) ──────────┤
  BI-5 (parallel; CI/CD first per QA-5)         │
  BI-6 (parallel; real script per OPS-5)        │
                                                 │
ALL 6 BLOCKING ITEMS RESOLVED ◄──────────────────┘
  GIT TAG: phase-2-blocking-items-complete
         │
         ▼
PHASE 2 DESIGN SUB-PHASES:

  2.1 Capability Verification + BE-2 Fallbacks + SC-3 Key Handoff
   │
   ├──► 2.2 Agent Authority Matrix + SC-2 File Allowlist + BE-1 Skeptic Fix
   │     │
   │     ├──► 2.3 Approval State Machine (QA-2: all 5 paths)
   │     │     │
   │     │     └──► 2.9 Manual vs Automated Boundaries
   │     │
   │     └──► 2.5 Agent Delegation Mapping + BE-1 Skeptic Fix ◄── 2.4 Task Schema + SC-1
   │           │
   │           ├──► 2.7 Budget Enforcement + BE-3 Calibration
   │           │
   │           └──► 2.10 Parallel Execution Contract
   │
   ├──► 2.4 Task Contract Schema + SC-1 Input Validation
   │
   ├──► 2.6 Heartbeat Protocol
   │
   └──► 2.8 Audit Logging + SC-4 Log Sanitization ◄── BI-4 (HARD per SC-6)

  GIT TAGS: phase-2-wave-{A..D}-complete at each wave
  FINAL TAG: phase-2-complete
```

### Execution Waves

**Wave A** (can start immediately after blocking items): 2.1
**Wave B** (after 2.1): 2.2, 2.4, 2.6
**Wave C** (after 2.2 + 2.4): 2.3, 2.5, 2.8
**Wave D** (after 2.3 + 2.5): 2.7, 2.9, 2.10

Git tag created after each wave completion (OPS-7).

---

## Success Criteria and Sign-Off

### Phase 2 Exit Criteria

Phase 2 is COMPLETE when ALL of the following are true:

**Core Design:**
- [ ] All 6 blocking items resolved with documented sign-off
- [ ] All 13 configuration/design files created in `.paperclip/`
- [ ] All design specs for source code files documented
- [ ] Paperclip API capabilities verified and documented (2.1)
- [ ] Capability fallbacks designed for all critical features (BE-2)
- [ ] Task schema defined and validated against CLAUDE.md contract (2.4)
- [ ] Agent authority matrix has no deadlocks (2.2)
- [ ] Skeptic ordering contradiction resolved (BE-1)
- [ ] Approval state machine covers all 5 transition paths (2.3, QA-2)
- [ ] No invented fields, tables, APIs, regions, or files (per CLAUDE.md)
- [ ] Duplicate "Files Likely to Change" consolidated (BE-4)

**Security Conditions:**
- [ ] **SC-1**: Input validation spec complete with prompt injection test suite passing
- [ ] **SC-2**: File access allowlist defined and tested per agent role
- [ ] **SC-3**: API key handoff procedure documented and key leakage scan clean
- [ ] **SC-4**: Log sanitization rules defined and PII/secret injection tests passing
- [ ] **SC-5**: Security Officer formal review of all Phase 2 outputs complete and signed off
- [ ] **SC-6**: BI-4 confirmed complete before sub-phase 2.8 and SC-3 work began

**QA Conditions:**
- [ ] **QA-1**: All 10 integration test scenarios documented (was 7; added 3)
- [ ] **QA-2**: Scenario 3 covers all 5 state machine paths
- [ ] **QA-3**: Staging environment spec documented
- [ ] **QA-4**: Tiered coverage targets met (90/70/60)
- [ ] **QA-5**: `.github/workflows/test.yml` created and passing

**Ops Conditions:**
- [ ] **OPS-1**: Monitoring stack selected with CEO cost approval
- [ ] **OPS-2**: BI-2 metrics wired after BI-1 completion
- [ ] **OPS-3**: Per-runbook SLAs defined (not blanket)
- [ ] **OPS-4**: Notification templates in all runbooks
- [ ] **OPS-5**: Real rollback.sh script (not pseudocode)
- [ ] **OPS-6**: Rollback tested in staging with timing recorded (<10 min)
- [ ] **OPS-7**: Git tags at each phase checkpoint
- [ ] **OPS-8**: Tabletop drills scheduled

**Backend Conditions:**
- [ ] **BE-1**: Skeptic ordering contradiction resolved in 2.2 and 2.5
- [ ] **BE-2**: Capability fallbacks designed
- [ ] **BE-3**: Budget calibration with real token data
- [ ] **BE-4**: Duplicate file list consolidated

**CEO Conditions:**
- [ ] **CEO-1**: Capability gate (BI-1) completed FIRST before any other blocking item
- [ ] **CEO-2**: Ops resource allocation confirmed to CEO within 24 hours
- [ ] **CEO-3**: All 6 blocking items resolved before Phase 2 design began
- [ ] **CEO-4**: Weekly executive checkpoints established and held (Fridays)
- [ ] **CEO-5**: CEO personally signs off on Phase 2 design before Phase 3

**Final:**
- [ ] All governance dry-run tests passed (2.8)
- [ ] Design approved by all 5 reviewers and user
- [ ] CEO Phase 2 exit sign-off obtained (CEO-5)

### Sign-Off Requirements

| Reviewer | What They Approve |
|----------|-------------------|
| CEO/Executive | Business risk, budget model, timeline, monitoring cost (OPS-1), **CEO-1 through CEO-5 conditions enforced**, personal Phase 2 exit sign-off (CEO-5) |
| Backend Distinguished Engineer | Technical architecture, task schema, agent mapping, state machine, skeptic ordering (BE-1), fallbacks (BE-2), budget calibration (BE-3) |
| QA Engineer | 10 test scenarios (QA-1), 5 state machine paths (QA-2), staging spec (QA-3), tiered coverage (QA-4), CI/CD pipeline (QA-5) |
| Security/Compliance Officer | SC-1 through SC-6 conditions verified, threat model review, Phase 2 security sign-off |
| Operations/DevOps Lead | Monitoring (OPS-1/2), runbooks with SLAs and templates (OPS-3/4), rollback script and testing (OPS-5/6), git tags (OPS-7), tabletop drills (OPS-8) |

### Go/No-Go for Phase 3

**GO**: All exit criteria met, all 5 reviewers approve, all 28 conditions satisfied, CEO personal sign-off obtained (CEO-5), no critical findings unresolved
**NO-GO**: Any exit criteria failed, any reviewer votes REJECT, blocking items unresolved, any of 28 conditions not met, or CEO withholds sign-off

---

## Timeline Summary

```
PHASE 0: CAPABILITY GATE (CEO-1: must be first)
Days 1-3 (2026-03-09 to 2026-03-11):
  Day 1: Ops resource confirmed to CEO (CEO-2), BI-1 starts
  Day 3: BI-1 GATE CHECK -- pass or stop

PHASE 1: REMAINING BLOCKING ITEMS (CEO-3: all before design)
Days 3-5 (2026-03-11 to 2026-03-13):
  Day 3: BI-2 through BI-6 start in parallel (after BI-1 gate passes)
  Day 5: All blocking items complete
  GIT TAG: phase-2-blocking-items-complete
  CEO-4: First weekly checkpoint (Friday)

PHASE 2: DESIGN SUB-PHASES
Day 6 (2026-03-14): Wave A (2.1 + BE-2 fallbacks)
  GIT TAG: phase-2-wave-A-complete

Days 7-8 (2026-03-15 to 2026-03-16): Wave B (2.2 + SC-2 + BE-1, 2.4 + SC-1, 2.6)
  GIT TAG: phase-2-wave-B-complete

Days 9-10 (2026-03-17 to 2026-03-18): Wave C (2.3 + QA-2, 2.5 + BE-1, 2.8 + SC-4)
  GIT TAG: phase-2-wave-C-complete

Days 11-12 (2026-03-19 to 2026-03-20): Wave D (2.7 + BE-3 calibration, 2.9, 2.10)
  GIT TAG: phase-2-wave-D-complete
  CEO-4: Second weekly checkpoint (Friday)

Day 13 (2026-03-21): Integration tests (10 scenarios) + governance dry-run + security tests
Day 14 (2026-03-22): SC-5 security review, CEO-5 personal sign-off, Go/No-Go for Phase 3
  GIT TAG: phase-2-complete
```

**Total estimated duration**: 14 days (3 capability gate + 2 blocking items + 9 design)

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Paperclip API missing capabilities (BI-1 fails) | Medium | Critical - blocks all of Phase 2 | Early verification; fallback designs (BE-2); alternative vendor list |
| Agent authority deadlocks in state machine | Low | High - governance failure | Formal verification of all 5 transition paths (QA-2) |
| Budget model misaligned with actual costs | Medium | Medium - operational friction | Calibration with real token data (BE-3) before finalizing |
| Integration tests fail against real Paperclip | Medium | High - design revision needed | Run against staging (QA-3) first; iterate design |
| Reviewer rejects Phase 2 design | Low | Medium - delay | Incremental reviews per sub-phase, not batch |
| Prompt injection bypasses input validation (SC-1) | Medium | High - agent compromise | Defense-in-depth: schema validation + pattern matching + output verification |
| File allowlist too restrictive (SC-2) | Medium | Medium - operational friction | Start permissive within safe bounds; tighten based on testing |
| Log sanitization misses novel PII pattern (SC-4) | Low | Medium - compliance risk | Regular pattern library updates; manual audit log sampling |
| Monitoring stack cost exceeds budget (OPS-1) | Low | Medium - delayed BI-2 | Get CEO cost approval Day 1; have fallback to open-source stack |
| Rollback exceeds 10-min SLA (OPS-6) | Low | High - operational risk | Test in staging; optimize script; have manual fallback procedure |
| Skeptic ordering confusion re-emerges (BE-1) | Low | Medium - governance error | Canonical flow hardcoded in state machine; tested in all 5 paths |

---

**Document Status**: APPROVED - 5/5 REVIEWERS - READY TO EXECUTE
**All 28 conditions from 5 reviewers incorporated**
**Approval**: 5/5 expert reviewers voted APPROVE WITH CONDITIONS -- GREEN LIGHT
**Immediate actions**:
1. Confirm Ops resource allocation to CEO (CEO-2)
2. Backend Engineer starts BI-1 Capability Gate verification with Paperclip team TODAY
3. Remaining blocking items queue behind capability gate (CEO-1)
4. Weekly Friday checkpoints established (CEO-4)
