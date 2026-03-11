---
name: backend-full-checklist
description: Phase 0 inspect, Phase 1 plan, Phase 2 implement end-to-end. Backend completion is delivery gate before UI. Use for full-stack delivery.
---

## Phase 1: DISCOVER (Phase 0 Inspect)
### Sub-Agent: `BackendInspector` (model: haiku)
- **Tools**: Glob, Grep, Read
- **Prompt**: Repo structure, entry points, user journeys. Architecture, integration boundaries. Missing pieces, placeholders. Map: product, modules, flows, gaps, risks.
- **Output**: `{ entry_points[], modules[], gaps[], risks[], placeholders[] }`
- **Gate**: project map created

## Phase 2: PLAN (Phase 1 Plan)
### Sub-Agent: `BackendPlanner` (model: sonnet)
- **Prompt**: Prioritized checklist: product goals, UI, backend, contracts, reliability, tests, docs. Per item: why, files, done definition, break risk.
- **Output**: `{ checklist[{item, files, done_def, risk}] }`
- **Gate**: checklist created

## Phase 3: IMPLEMENT (Phase 2 Implement)
### Sub-Agent: `BackendBuilder` (model: haiku)
- **Tools**: Read, Write, Edit, Bash
- **Prompt**: Complete user-facing + backend + contract for each feature. No half-wired flows. Validation, errors, loading, empty states. ONE feature at a time. Run `npm test` after each.
- **Output**: `{ feature, files_changed[], test_pass: boolean }`
- **Gate**: feature complete AND tests pass

## Phase 4: VERIFY
### Sub-Agent: `BackendTester` (model: haiku)
- **Tools**: Bash
- **Prompt**: Run `npm test`. Restart server. `curl http://localhost:3000/health`. Test all endpoints. Verify no stubs or fake responses remain.
- **Output**: `{ tests_pass, health_ok, stubs_remaining[], coverage }`
- **Gate**: 0 stubs AND tests pass AND health OK

## Phase 5: DELIVER
### Sub-Agent: `BackendPackager` (model: haiku)
- **Prompt**: Update CHANGELOG. Commit. Notify user: server status, health check, backend completion status.
- **Output**: `{ commit_sha, server_status, backend_complete: boolean }`
- **Gate**: committed AND backend 100% before UI proceeds

## Contingency
IF endpoint breaks other endpoints → contingency L1 (fix inline). IF backend can't be completed (external dependency missing) → mark [BLOCKED], proceed with what's available, document.

## Server Lifecycle
MUST restart server after every backend file change. MUST verify health. Backend must be 100% before any UI work proceeds.

---

# Backend Full Checklist Skill

**Purpose**: Complete backend before UI. End-to-end trace through all layers.

## Phase 0 – Inspect

- Repo structure, entry points, user journeys
- Architecture, integration boundaries
- Missing pieces, dead ends, placeholders
- What works, what's optional
- Project map: product, modules, flows, gaps, risks

## Phase 1 – Plan

- Prioritized checklist: product goals, UI, backend, contracts, reliability, tests, docs
- Per item: why, files involved, done definition, break risk

## Phase 2 – Implement

- Complete user-facing + backend + contract for each feature
- No half-wired flows
- Validation, errors, loading, empty states
- Tests: happy path, validation fail, empty, loading, API fail, retry

## Critical Gate

- **Backend 100% complete before PR ready**
- No stub handlers, fake responses, TODO paths
- UI only exposes completed backend

## Real-Time Diagnosis

- Diagnosis from live inputs, not pre-baked
- Use current evidence, logs, state
- Remove/isolate fake diagnosis paths
