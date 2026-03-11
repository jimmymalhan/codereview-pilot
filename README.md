# Code Review Pilot

**Evidence-first incident diagnosis. Root cause in 16-30 seconds.**

> Paste an incident. Get root cause, fix plan, rollback steps, and tests. Backed by evidence, not guesses.

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](tests/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Quick Start

```bash
npm install
npm start          # Run server (foreground)
npm run dev        # Run with auto-restart on crash/file changes — keeps localhost up
```

Open http://localhost:3000. Use **Try It** to diagnose an incident, or call the API directly.

```bash
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"incident": "Database query takes 45 seconds, CPU 100% on replicas"}'
```

---

## Product & Features

### What It Does

| Feature | Description |
|---------|-------------|
| **4-agent pipeline** | Router → Retriever → Skeptic → Verifier (evidence-first) |
| **Single incident** | `POST /api/diagnose`, JSON in, root cause and fix plan out |
| **Batch** | `POST /api/batch-diagnose`, up to 100 incidents per request |
| **Webhooks** | Register a URL; results delivered automatically |
| **Export** | JSON/CSV for runbooks and compliance |
| **Audit trail** | Immutable logs with trace IDs |
| **Orchestration UI** | View tasks, approvals, agents at `/orchestration.html` |

### How to Use

1. **Web UI**: Go to http://localhost:3000, scroll to **Try It**, describe the incident, click **Diagnose**.
2. **API**: `POST /api/diagnose` with `{"incident": "..."}` (10-2000 chars).
3. **Product section**: Scroll to **Integrate With Your Stack** for tabs: REST API, Batch, Webhooks, Export, All Endpoints.

### Use Cases

| Use Case | Example Input | What You Get |
|----------|---------------|--------------|
| **API / Latency** | "API latency spiked to 12s in us-east-1 after deploy v2.4.1, connection pool at 98%" | Root cause, fix plan, deployment-related bottlenecks |
| **Database** | "Database query takes 45 seconds, CPU 100% on read replicas" | Slow-query analysis, replication lag, indexing suggestions |
| **Auth / 5xx** | "API returns 500 on login, stack trace shows NullPointerException in session service" | Code path trace, error source, fix steps |
| **Payments** | "Payment processing failing, Stripe webhook timeout, retries exhausted" | Third-party integration diagnosis, retry/recovery plan |
| **On-Call / SRE** | "Pod restart loop in production, OOMKilled, memory limit 512Mi" | Resource diagnosis, scaling or leak recommendations |
| **CI / Flaky Tests** | "E2E checkout test fails intermittently, timeout after 30s" | Flakiness vs code bug, timeout/ordering suggestions |
| **Microservices** | "Service A calls B, B returns 503, circuit breaker open" | Cascade analysis, circuit breaker config, fallback options |

**Tip:** Include symptoms, timestamps, error messages, and environment (region, version) for better results.

---

## Integrate

### Option 1: REST API

```bash
# Single incident
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"incident": "API latency spiked to 12s after deploy v2.4.1"}'

# Batch (up to 100)
curl -X POST http://localhost:3000/api/batch-diagnose \
  -H "Content-Type: application/json" \
  -d '{"incidents": ["...", "..."]}'
```

Every response includes `X-Trace-Id` for end-to-end tracing.

### Option 2: Webhooks

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-service.com/hooks/diagnosis"}'
```

Pass `webhook` in the diagnose request to push results to your endpoint.

### Option 3: From Your Stack

Use any HTTP client (Python, Node, Go, bash). Set `Content-Type: application/json`. Full reference: http://localhost:3000/api-reference.html

---

## Claude Code Skills

This repo includes **66+ skills** in `.claude/skills/` for run-the-business automation, evidence-proof workflows, and ultra-automation.

| Doc | Purpose |
|-----|---------|
| [.claude/SKILLSETS.md](.claude/SKILLSETS.md) | Skill index; roles, user prompts, all governance |
| [REVIEW.md](REVIEW.md) | Code review guidelines for Claude Code Review |

**Use**: Open in Claude Code; skills load from `.claude/skills/`. Invoke with `/run-the-business`, `/plan-and-execute`, or any skill name. Default: maximum automation, auto-merge when CI green.

---

## Contribute

### 1. Set Up

```bash
git clone https://github.com/jimmymalhan/codereview-pilot.git
cd codereview-pilot
npm install
```

### 2. Run Tests

```bash
npm test              # Unit + integration
npm run test:ci       # CI mode (GitHub Actions)
npm run test:watch    # Watch mode
npm run test:e2e      # E2E (requires ANTHROPIC_API_KEY)
npm run load-test     # 20 concurrent diagnose requests (requires server running)
```

### 3. Make Changes

- Read [CLAUDE.md](CLAUDE.md) for project standards.
- For skill work: see [.claude/SKILLSETS.md](.claude/SKILLSETS.md) and `.claude/skills/`.
- Create a branch: `git checkout -b feature/your-feature`.
- Implement changes and add/update tests.
- Run `npm test` before committing.

### 4. Submit

- Commit with [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat(api): add X`, `fix(ui): Y`).
- Open a PR. CI runs tests on Node 18 and 20.
- Update [CHANGELOG.md](CHANGELOG.md) with what changed and why.

### Areas to Contribute

| Area | Examples |
|------|----------|
| **API** | New endpoints, validation, rate-limit tuning |
| **UI** | Try It form, orchestration dashboard, accessibility |
| **Pipeline** | Router, Retriever, Skeptic, Verifier logic |
| **Skills** | New skills in `.claude/skills/`; index in `.claude/SKILLSETS.md` |
| **Tests** | Unit, integration, E2E, rate-limit coverage |
| **Docs** | API reference, integration guides, examples |

---

## Architecture

```
Incident → Router → Retriever → Skeptic → Verifier → Root Cause + Fix Plan + Tests
```

- **Router**: Classifies type and severity.
- **Retriever**: Fetches evidence from codebase/logs.
- **Skeptic**: Proposes competing theories.
- **Verifier**: Produces final root cause and confidence (0-100).

---

## API Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/diagnose` | Single incident diagnosis |
| POST | `/api/batch-diagnose` | Batch (up to 100) |
| GET | `/api/diagnose/:id` | Retrieve by ID |
| GET | `/api/diagnose/:id/export` | Export JSON/CSV |
| GET | `/api/diagnostics` | List (paginated) |
| GET | `/api/audit-log` | Audit trail |
| POST | `/api/webhooks` | Register webhook |
| GET | `/health` | Health check |

Full docs: [api-reference.html](http://localhost:3000/api-reference.html)

---

## Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-...   # Required for diagnosis
PORT=3000                       # Default 3000
NODE_ENV=production             # Optional
```

Rate limit: 100 requests/hour per IP (configurable).

---

## Links

- **App**: http://localhost:3000
- **API Reference**: http://localhost:3000/api-reference.html
- **Orchestration**: http://localhost:3000/orchestration.html
- **Health**: http://localhost:3000/health

---

**Code Review Pilot** | Evidence first. Root cause in seconds. [MIT](LICENSE)
