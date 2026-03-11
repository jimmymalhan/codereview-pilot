---
name: naming-convention-product
description: Naming for branches, commits, and PRs based on core product and use cases. Use when creating branches, committing, or writing PR titles. Never use rule/process names.
---

# Product-Centric Naming Convention (HARD)

**Purpose**: All naming—branches, commits, PR titles—must reflect the **core product** and **use cases**, not rules, processes, or internal workflows. Names must make sense to someone reading what the product does.

**Core product**: Code Review Pilot — evidence-first incident diagnosis. Root cause in 16–30 seconds.

---

## Product Domains (Use for Scope)

| Domain | What It Is | Examples |
|--------|------------|----------|
| **diagnosis** | Single incident flow, root cause output | diagnose endpoint, diagnosis output contract |
| **pipeline** | 4-agent flow (Router, Retriever, Skeptic, Verifier) | orchestrator, agents, pipeline execution |
| **api** | REST endpoints | /api/diagnose, /api/batch-diagnose, /api/webhooks |
| **batch** | Batch diagnosis | batch-diagnose, up to 100 incidents |
| **webhook** | Webhook delivery | webhook registration, push results |
| **evidence** | Evidence-first, retriever, citations | file:line, evidence verifier, no invented claims |
| **audit** | Audit trail, trace IDs | trace IDs, immutable logs |
| **ui** | Web UI | Try It, orchestration dashboard, forms |
| **export** | JSON/CSV export | runbooks, compliance export |

---

## Use Cases (From Product)

| Use Case | Slug | Description |
|----------|------|-------------|
| API / Latency | `api-latency` | API latency spikes, connection pool |
| Database | `database` | Slow query, replication lag, indexing |
| Auth / 5xx | `auth-5xx` | 500 on login, NullPointerException, session |
| Payments | `payments` | Stripe webhook, retries exhausted |
| On-Call / SRE | `oncall-sre` | Pod restart, OOMKilled, memory limit |
| CI / Flaky Tests | `ci-flaky` | E2E intermittent, timeout, ordering |
| Microservices | `microservices` | Service A→B, 503, circuit breaker |

---

## Branch Naming

**Format**: `feature/<domain>-<what>` or `fix/<domain>-<issue>` or `feat/<use-case>-<what>`

**DO** — Product/use-case based:
- `feature/diagnosis-api-latency` — Diagnosis for API latency use case
- `feature/pipeline-retriever-evidence` — Retriever evidence extraction
- `feature/api-batch-endpoint` — Batch diagnose API
- `feature/webhook-registration` — Webhook registration
- `feature/ui-orchestration-dashboard` — Orchestration UI
- `fix/diagnosis-null-session` — Fix null in session trace
- `fix/evidence-file-line-citation` — Fix file:line citation format
- `feature/audit-trace-id` — Audit trail trace IDs

**DON'T** — Rule/process based:
- ~~`feature/consensus-gates-required`~~
- ~~`feature/branch-only-workflow`~~
- ~~`feature/ten-pass-pr-comments`~~
- ~~`feature/skills-pr-comments-live`~~

---

## Commit Messages

**Format**: `type(scope): description` — scope = product domain or use-case slug

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**DO** — Product/use-case scope:
- `feat(diagnosis): add latency symptom detection`
- `feat(pipeline): improve retriever evidence extraction`
- `fix(diagnosis): handle null in session service trace`
- `feat(api): add webhook registration endpoint`
- `feat(batch): support 100 incidents per request`
- `feat(evidence): correct file:line citation format`
- `feat(ui): orchestration dashboard for pipeline view`
- `fix(auth-5xx): trace NullPointerException path`
- `feat(oncall-sre): OOMKilled resource diagnosis`

**DON'T** — Rule/process scope:
- ~~`feat(skills): PR comments live`~~
- ~~`feat(rules): consensus gates`~~
- ~~`feat(branch-only): HARD rule`~~

---

## PR Titles

**Format**: Same as branch—product/use-case based. No rule names.

**DO**:
- `feat(diagnosis): API latency symptom detection`
- `feat(pipeline): Retriever evidence extraction`
- `fix(evidence): file:line citation validation`
- `feat(ui): Orchestration dashboard`

**DON'T**:
- ~~`feat(skills): consensus-gates-required`~~
- ~~`feat(rules): small commits, small PRs`~~

---

## Mapping: Rule/Process → Product Domain

When the change is about rules/processes, map to the closest product effect:

| If change is about… | Use scope/domain |
|--------------------|------------------|
| PR comments, merge gates, consensus | `diagnosis` (delivery flow) or `api` (if PR/CI related) |
| Ten-pass, five-agent, verification | `pipeline` (pipeline quality) or `evidence` (evidence checks) |
| Branch workflow, commit rules | `diagnosis` or `api` (delivery) |
| Skills, guardrails | `pipeline` (how diagnosis runs) |
| Lint, tests | `pipeline` or `evidence` |

---

## Integration

- **pr-push-merge**: Use product naming for commit message and PR title
- **user-feedback-to-skillset**: When user gives naming feedback → update this skill
- **CLAUDE.md**, **guardrails**: Reference this skill for branch/commit naming
