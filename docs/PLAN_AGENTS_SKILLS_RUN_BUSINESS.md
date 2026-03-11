# Implementation Plan: Multi-Project Breakdown with Full Details

**Goal**: Idea → production, fully autonomous. Domain-expert agents. Live monitoring, self-fix, fix PRs. Minimal API credits. Model-agnostic: performs at its best whether using Haiku, Sonnet, or Opus. No limiting issues. Devise and plan only—no coding until approved.

---

## Model-Agnostic Design & Cost Guardrails

**Principle**: The system delivers top quality regardless of plan (cheap or expensive) or model (Haiku, Sonnet, Opus). It uses very few API credits and does not degrade when using cheaper models.

### Model-Tier Rules

| Tier | Model | When to Use | Credit Impact |
|------|-------|-------------|---------------|
| **Budget** | Haiku | Explore, QA, APIValidator, FixAgent, LiveWatchdog, most implementation | Lowest |
| **Standard** | Sonnet | Plan, CodeReviewer, Critic (final gate), complex reasoning | Medium |
| **Premium** | Opus | Only if user explicitly requests; never default | Highest |

**Guardrail**: Default to Haiku for 80%+ of subagent work. Reserve Sonnet for Plan + final review. Never auto-select Opus; only use when user says "use Opus" or equivalent.

### Cost Minimization (Non-Negotiable)

| Rule | How | Effect |
|------|-----|--------|
| **Grep before Read** | Search first; read only changed/relevant files | −30–50% tokens |
| **Skip completed** | Checklist with DONE; never redo finished items | −20–40% turns |
| **Tiered verification** | Quick (1 agent) / Standard (3) / Full (5) by change size | −40–80% on small changes |
| **Re-run only blockers** | After fix, re-run only agents that blocked | −60% on re-runs |
| **Minimal context** | Pass only changed paths + line ranges to spawns | −20% per spawn |
| **Inline over spawn** | &lt;3 files, &lt;50 lines → lead reviews inline | −5 spawns on trivial |
| **Haiku-first** | All subagents default Haiku unless critical | −50–70% vs Sonnet |
| **Compact prompts** | Skills &lt;500 lines; spawn prompts &lt;200 words | −15% tokens |
| **Batch discovery** | One Explore per phase, not per file | −N−1 Explorers |
| **skills-self-update** | Update in same turn; no respawn | −1 spawn per fix |

### Extra Guardrails for Cheaper Plans

When on a cheaper plan (fewer credits, rate limits):

1. **Strict spawn threshold**: Spawn only when 3+ independent tasks. Single task → lead agent does it.
2. **No Opus fallback**: If Plan/Critic would use Opus, use Sonnet instead. Never fail due to "need Opus."
3. **Poll interval**: Live-watchdog polls at 10 min (not 5) to reduce API calls.
4. **Max retries**: self-fix loop: max 2 retries (not 3) to cap credit burn.
5. **Defer optional agents**: security-auditor, compliance-checker, performance-optimizer, data-analyst—spawn only when task explicitly touches that domain.
6. **5-agent → 3-agent**: Merge CodeReviewer+Critic, APIValidator+EvidenceReviewer when on strict budget.

### Extra Guardrails for Opus (When Available)

When user chooses Opus (expensive model):

1. **Reserve for critical only**: Plan approval gate, final merge decision, high-stakes review. Do not use for Explore, QA, or routine fixes.
2. **Single Opus per flow**: At most one Opus invocation per idea→PR flow (e.g., final Critic gate).
3. **Explicit opt-in**: Skills and agents never default to Opus. User must say "use Opus" or similar.
4. **Fallback**: If Opus fails or is rate-limited, seamlessly fall back to Sonnet. No hard dependency.

### No Limiting Issues

| Concern | Mitigation |
|---------|------------|
| "Haiku can't do X" | Skills encode explicit checklists; prompts are concrete. Haiku follows steps. |
| "Need Opus for quality" | Quality comes from skills + verification loops, not model size. 5-agent verification gates output. |
| "Cheaper plan = worse output" | Tiered verification, inline review, strict spawn rules preserve quality. |
| "Rate limits block flow" | Poll less often; batch operations; defer optional agents. |
| "Token limit per request" | Minimal context; compact prompts; skills on-demand. |

### New Skill: cost-guardrails

**CREATE** `.claude/skills/cost-guardrails/SKILL.md`:

- Model-tier rules (Haiku/Sonnet/Opus)
- Cost minimization table (grep first, skip completed, etc.)
- Extra guardrails for cheaper plans
- Extra guardrails for Opus
- "No limiting issues" mitigations
- Preload into Plan and General-Purpose agents

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Projects** | 6 |
| **Skills to CREATE** | 27 |
| **Skills to UPDATE** | 10 |
| **Agents to CREATE** | 3 |
| **Agents to UPDATE** | 9 |
| **Config files to UPDATE** | 4 |
| **Doc files to UPDATE** | 3 |

*+1 skill: cost-guardrails (model-agnostic, credit minimization)*

---

## Project Overview (6 Projects)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PROJECT 1: Skills Foundation (Pipeline & Evidence)                                  │
│  Create 11 skills • 0 updates • Est. 11 files (includes cost-guardrails)             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PROJECT 2: Skills for Run-the-Business & Live Flow                                  │
│  Create 7 skills • 0 updates • Est. 7 files                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PROJECT 3: Domain Expert Skills (FE, BE, QA, Review)                                │
│  Create 5 skills • 4 updates • Est. 9 files                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PROJECT 4: Automation & Self-Healing Skills                                         │
│  Create 4 skills • 3 updates • Est. 7 files                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PROJECT 5: Agents (Core, Optional, Project, New)                                    │
│  Create 3 agents • Update 9 agents • Est. 12 files                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  PROJECT 6: Config, Docs & Integration                                              │
│  Update settings.json, CLAUDE.md, SKILLSETS.md, .gitignore • Est. 4 files             │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# PROJECT 1: Skills Foundation (Pipeline & Evidence)

**Purpose**: Create pipeline, evidence, and guardrail skills that agents depend on. These are referenced by settings.json but may not exist in `.claude/skills/`.

## 1.1 Skill Count

| Action | Count | Skills |
|--------|-------|--------|
| **CREATE** | 11 | router, retriever, skeptic, verifier, critic, plan-and-execute, e2e-orchestrator, idea-to-production, project-structure, project-guardrails, **cost-guardrails** |

## 1.2 Skill Details

| # | Skill | Path | Purpose | Key Content |
|---|-------|------|---------|-------------|
| 1 | router | `.claude/skills/router/SKILL.md` | Incident classification | Classify to known types only; never invent categories; output: type, confidence, rationale |
| 2 | retriever | `.claude/skills/retriever/SKILL.md` | Evidence gathering | file:line citations; MCP integration; never invent paths |
| 3 | skeptic | `.claude/skills/skeptic/SKILL.md` | Hallucination detection | Counter-analysis; materially different alternatives; cite evidence |
| 4 | verifier | `.claude/skills/verifier/SKILL.md` | Evidence validation | Validate citations; block unsupported nouns; confidence scorer |
| 5 | critic | `.claude/skills/critic/SKILL.md` | Quality gate | confidence >= 0.70; all 6 output contract fields; APPROVE/REJECT |
| 6 | plan-and-execute | `.claude/skills/plan-and-execute/SKILL.md` | Plan mode, checklist | Break work; skip completed; 4 subagents; use cost-guardrails |
| 7 | e2e-orchestrator | `.claude/skills/e2e-orchestrator/SKILL.md` | 4 phases, subagents | Phase 1–4; 5–10 subagents/phase; Create→Handle→Run |
| 8 | idea-to-production | `.claude/skills/idea-to-production/SKILL.md` | Idea→Execute→Merge→Deploy | Handoffs; merge/deploy approval points |
| 9 | project-structure | `.claude/skills/project-structure/SKILL.md` | Shared vs local | .gitignore; layout; memory |
| 10 | project-guardrails | `.claude/skills/project-guardrails/SKILL.md` | Anti-hallucination | Never invent; cite evidence; [UNKNOWN], [ASSUMPTION] |
| 11 | cost-guardrails | `.claude/skills/cost-guardrails/SKILL.md` | Model-agnostic, credit minimization | Haiku-first; tiered verification; extra guardrails for cheap/Opus plans |

## 1.3 Visual Use Case: Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ROUTER    │────▶│  RETRIEVER  │────▶│   VERIFIER  │────▶│   CRITIC    │
│  (skill)    │     │  (skill)    │     │  (skill)    │     │  (skill)    │
├─────────────┤     ├─────────────┤     ├─────────────┤     ├─────────────┤
│ Classify    │     │ Gather      │     │ Validate    │     │ Gate        │
│ incident    │     │ evidence    │     │ citations   │     │ output      │
│ type        │     │ file:line   │     │ confidence  │     │ APPROVE/     │
│             │     │             │     │             │     │ REJECT       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       └───────────────────┴───────────────────┴───────────────────┘
                                    │
                          project-guardrails (wraps all)
```

## 1.4 Dependencies & Order

- **project-guardrails** – No deps; create first
- **router, retriever, skeptic, verifier, critic** – Depend on project-guardrails
- **plan-and-execute** – Depends on project-guardrails, evidence-proof
- **e2e-orchestrator** – Depends on plan-and-execute
- **idea-to-production** – Depends on e2e-orchestrator
- **project-structure** – No deps
- **cost-guardrails** – No deps; create early; preload into Plan, General-Purpose

## 1.5 What to Watch For

- [ ] Each skill has YAML frontmatter: `name`, `description`
- [ ] Skills reference `.claude/rules/` where relevant
- [ ] idea-to-production includes handoff points (merge, deploy)
- [ ] e2e-orchestrator aligns with 4 phases in docs/SKILLSETS.md
- [ ] critic defines exact 6 output contract fields
- [ ] cost-guardrails: Model-tier table; never default to Opus; Haiku-first

---

# PROJECT 2: Skills for Run-the-Business & Live Flow

**Purpose**: Create the entry-point and live monitoring skills that enable "project instructions only" and real-time error detection → fix PR.

## 2.1 Skill Count

| Action | Count | Skills |
|--------|-------|--------|
| **CREATE** | 7 | run-the-business, live-watchdog, error-detector, fix-pr-creator, self-fix, rebase-manager, multi-pr-coordinator |

## 2.2 Skill Details

| # | Skill | Path | Purpose | Key Content |
|---|-------|------|---------|-------------|
| 1 | run-the-business | `.claude/skills/run-the-business/SKILL.md` | Entry: "project instructions only" | Invoke idea-to-production; start live-watchdog; full E2E |
| 2 | live-watchdog | `.claude/skills/live-watchdog/SKILL.md` | Poll CI/deploy/health | Interval polling; on error → error-detector |
| 3 | error-detector | `.claude/skills/error-detector/SKILL.md` | Classify error; route fix agent | Output: type, scope, fixAgent, urgency |
| 4 | fix-pr-creator | `.claude/skills/fix-pr-creator/SKILL.md` | Create fix branch + PR | Branch: fix/&lt;type&gt;-&lt;id&gt;; spawn fix agent |
| 5 | self-fix | `.claude/skills/self-fix/SKILL.md` | CI red → fix; conflict → resolve | Loop until green; max retries |
| 6 | rebase-manager | `.claude/skills/rebase-manager/SKILL.md` | Rebase dependent PRs | After base merge; call conflict-resolution |
| 7 | multi-pr-coordinator | `.claude/skills/multi-pr-coordinator/SKILL.md` | Order PRs by dependency | Merge sequence; rebase chain |

## 2.3 Visual Use Case: Live Watchdog → Fix PR

```
                    ┌──────────────────────────────────────────┐
                    │           LIVE WATCHDOG (skill)            │
                    │  Poll: CI status • Deploy • Health endpoint│
                    │  Interval: every N min (configurable)     │
                    └────────────────────┬─────────────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │  ERROR DETECTED?             │
                          │  • CI red                    │
                          │  • Deploy failed             │
                          │  • Health check fail         │
                          └──────────────┬───────────────┘
                                         │ YES
                          ┌──────────────▼───────────────┐
                          │  error-detector (skill)      │
                          │  Classify: test|build|lint   │
                          │  Output: type, scope, agent  │
                          └──────────────┬───────────────┘
                                         │
                          ┌──────────────▼───────────────┐
                          │  fix-pr-creator (skill)      │
                          │  1. Create fix/<type>-<id>   │
                          │  2. Spawn FixAgent           │
                          │  3. Commit, push, open PR    │
                          └──────────────┬───────────────┘
                                         │
                          ┌──────────────▼───────────────┐
                          │  self-fix (skill)            │
                          │  • CI red on fix PR?         │
                          │  • Spawn FixAgent again      │
                          │  • Loop until green          │
                          └─────────────────────────────┘
```

## 2.4 Visual Use Case: Multi-PR Coordination

```
                    ┌──────────────────────────────────────────┐
                    │     multi-pr-coordinator (skill)          │
                    │  Input: List of PRs from plan            │
                    └────────────────────┬─────────────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │  BUILD DEPENDENCY GRAPH    │
                          │  PR-A (base)               │
                          │   ├── PR-B (depends on A)  │
                          │   └── PR-C (depends on A)  │
                          └──────────────┬─────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │  MERGE ORDER               │
                          │  1. Merge PR-A → main      │
                          │  2. rebase-manager: PR-B, C │
                          │  3. Rebase PR-B on main     │
                          │  4. Rebase PR-C on main     │
                          │  5. Merge PR-B, PR-C        │
                          └────────────────────────────┘
```

## 2.5 What to Watch For

- [ ] run-the-business is the single entry for "give me project instructions"
- [ ] live-watchdog specifies poll interval (e.g., 5 min)
- [ ] error-detector output format: `{ type, scope, fixAgent, urgency }`
- [ ] fix-pr-creator branch naming: `fix/<type>-<short-id>`
- [ ] self-fix defines max retries (e.g., 3)
- [ ] multi-pr-coordinator handles empty dependency (single PR)

---

# PROJECT 3: Domain Expert Skills (FE, BE, QA, Review)

**Purpose**: Create and update skills so Frontend, Backend, and QA agents are world-class domain experts. Top-notch quality, minimal issues on review.

## 3.1 Skill Count

| Action | Count | Skills |
|--------|-------|--------|
| **CREATE** | 5 | pr-push-merge, feedback-log, skills-self-update, five-agent-verification, conflict-resolution |
| **UPDATE** | 4 | backend-engineer, frontend-engineer, backend-reliability, ui-quality |

## 3.2 Create Details

| # | Skill | Path | Purpose | Key Content |
|---|-------|------|---------|-------------|
| 1 | pr-push-merge | `.claude/skills/pr-push-merge/SKILL.md` | Commit, push, CI, PR | Branch rules; CI green before merge; fix PR support |
| 2 | feedback-log | `.claude/skills/feedback-log/SKILL.md` | Common feedback, guardrails | Incorporate patterns; update guardrails |
| 3 | skills-self-update | `.claude/skills/skills-self-update/SKILL.md` | Learn from fixes | Add to SKILL.md; format: Issue, Fix, Prevention |
| 4 | five-agent-verification | `.claude/skills/five-agent-verification/SKILL.md` | 5-agent code review | Tiered verification; re-run only blockers |
| 5 | conflict-resolution | `.claude/skills/conflict-resolution/SKILL.md` | Stash, pull main, resolve | Rebase integration; automated resolve |

## 3.3 Update Details

| # | Skill | Path | What to Add/Change |
|---|-------|------|--------------------|
| 1 | backend-engineer | `.claude/skills/backend-engineer/SKILL.md` | OWASP, 12-Factor, RFC 7231/7807; "production-ready, minimal review issues"; idempotency, OpenTelemetry |
| 2 | frontend-engineer | `.claude/skills/frontend-engineer/SKILL.md` | WCAG 2.1 AA, Core Web Vitals, A11Y Project; "review-ready"; semantic HTML |
| 3 | backend-reliability | `.claude/skills/backend-reliability/SKILL.md` | Ensure retry, timeout, validation; align with backend-engineer |
| 4 | ui-quality | `.claude/skills/ui-quality/SKILL.md` | Ensure states (Normal, Loading, Error); accessibility; align with frontend-engineer |

## 3.4 Skill Box: Backend Engineer (World-Class)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  backend-engineer SKILL BOX                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Best Practice Sources (add to SKILL):                                   │
│  • OWASP Top 10 – Input validation, SQL injection, secrets               │
│  • 12-Factor App – Config, logs, processes                               │
│  • RFC 7231 – REST semantics                                             │
│  • RFC 7807 – Structured error format                                   │
│  • Idempotency – Request ID for unsafe ops                              │
│  • Retry – Exponential backoff                                           │
│  • OpenTelemetry – Structured logging                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Goal: "Minimal issues on review" – Production-ready on first pass       │
│  Constraints: Align with .claude/rules/backend.md, backend-proof.md     │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.5 Skill Box: Frontend Engineer (World-Class)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  frontend-engineer SKILL BOX                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Best Practice Sources (add to SKILL):                                   │
│  • WCAG 2.1 AA – Accessibility                                          │
│  • Core Web Vitals – LCP, INP, CLS                                       │
│  • A11Y Project – Patterns                                               │
│  • Semantic HTML – Correct elements                                      │
│  • Progressive enhancement – Works without JS                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Goal: "Review-ready" – No small/big issues when human reviews           │
│  States: Normal, Loading, Error for every interactive element            │
│  Constraints: Align with .claude/rules/ui.md, ui-proof.md               │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.6 What to Watch For

- [ ] backend-engineer: OWASP, 12-Factor, RFC refs in content
- [ ] frontend-engineer: WCAG, Core Web Vitals, A11Y refs
- [ ] five-agent-verification: Tiered (quick/standard/full); re-run only blockers
- [ ] pr-push-merge: Support fix PR branch naming
- [ ] conflict-resolution: Rebase flow; call from rebase-manager

---

# PROJECT 4: Automation & Self-Healing Skills

**Purpose**: Add skills that automate the business end-to-end—PR automation, checklist-driven work, stakeholder feedback. Update existing skills for live flow.

## 4.1 Skill Count

| Action | Count | Skills |
|--------|-------|--------|
| **CREATE** | 4 | ui-premium-checklist, backend-full-checklist, branch-permissions, push-hard |
| **UPDATE** | 3 | idea-to-production, e2e-orchestrator, evidence-proof |

## 4.2 Create Details

| # | Skill | Path | Purpose | Key Content |
|---|-------|------|---------|-------------|
| 1 | ui-premium-checklist | `.claude/skills/ui-premium-checklist/SKILL.md` | Premium UI, product story | Homepage; FE-BE alignment |
| 2 | backend-full-checklist | `.claude/skills/backend-full-checklist/SKILL.md` | Backend Phase 0/1/2 | Inspect, plan, implement; backend gate before UI |
| 3 | branch-permissions | `.claude/skills/branch-permissions/SKILL.md` | Auto-accept on feature | Feature branch: auto; main: ask |
| 4 | push-hard | `.claude/skills/push-hard/SKILL.md` | No permission prompts | Aggressive auto-execute |

## 4.3 Update Details

| # | Skill | Path | What to Add/Change |
|---|-------|------|--------------------|
| 1 | idea-to-production | `.claude/skills/idea-to-production/SKILL.md` | Live monitoring phase; error → fix PR; self-fix loop; rebase after merge |
| 2 | e2e-orchestrator | `.claude/skills/e2e-orchestrator/SKILL.md` | Live watchdog phase; fix PR flow; integrate fix-pr-creator |
| 3 | evidence-proof | `.claude/skills/evidence-proof/SKILL.md` | Ensure file:line; no invented claims; test proof before done |

## 4.4 Visual Use Case: Automation Skill Chain

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ branch-          │   │ push-hard        │   │ pr-push-merge    │
│ permissions      │───│                  │───│                  │
│ (skill)          │   │ (skill)          │   │ (skill)          │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ feature/*: auto  │   │ No permission    │   │ Commit→push→CI   │
│ main: ask        │   │ asks             │   │ →PR→merge        │
└──────────────────┘   └──────────────────┘   └────────┬─────────┘
                                                       │
                                                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ multi-pr-        │   │ rebase-manager   │   │ conflict-        │
│ coordinator      │───│                  │───│ resolution       │
│ (skill)          │   │ (skill)          │   │ (skill)          │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Order PRs        │   │ Rebase after     │   │ Stash, pull,     │
│ by dependency    │   │ base merge       │   │ resolve          │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

## 4.5 What to Watch For

- [ ] idea-to-production: Explicit "Live Phase" between Execute and Merge
- [ ] e2e-orchestrator: Phase 2.5 or Phase 3 includes live-watchdog
- [ ] evidence-proof: "Run npm test; never claim without output"
- [ ] branch-permissions: Align with `.claude/hooks/branch-aware-permissions.sh`

---

# PROJECT 5: Agents (Core, Optional, Project, New)

**Purpose**: Wire all skills into agents. Create new agents for live watchdog and fix flow. Update existing agents with correct skill arrays.

## 5.1 Agent Count

| Action | Count | Agents |
|--------|-------|--------|
| **CREATE** | 3 | LiveWatchdog, FixAgent, RebaseResolver |
| **UPDATE** | 9 | Explore, Plan, General-Purpose, CodeReviewer, APIValidator, frontend-engineer, backend-engineer, qa-engineer, + 4 project agents |

## 5.2 Create Agent Details

| # | Agent | File | Tools | Model | Skills |
|---|-------|------|-------|-------|--------|
| 1 | LiveWatchdog | `.claude/agents/live-watchdog.md` | Bash, Read, Grep | haiku | live-watchdog, error-detector, fix-pr-creator, **cost-guardrails** |
| 2 | FixAgent | `.claude/agents/fix-agent.md` | All | haiku | self-fix, conflict-resolution, evidence-proof, backend-reliability, ui-quality, **cost-guardrails** |
| 3 | RebaseResolver | `.claude/agents/rebase-resolver.md` | Bash, Read, Edit | haiku | rebase-manager, conflict-resolution |

## 5.3 Update Agent Details (settings.json)

| Agent | Add Skills | Remove |
|-------|------------|--------|
| Explore | cost-guardrails | — |
| Plan | run-the-business, multi-pr-coordinator, **cost-guardrails** | — |
| General-Purpose | self-fix, conflict-resolution, multi-pr-coordinator, **cost-guardrails** | — |
| CodeReviewer | — | — |
| APIValidator | — | — |
| frontend-engineer | backend-full-checklist | — |
| backend-engineer | — | — |
| qa-engineer | five-agent-verification | — |

## 5.4 Update Project Agents (.claude/agents/*.md)

| Agent File | Add Frontmatter | Skills Array |
|------------|------------------|---------------|
| security-auditor.md | `name`, `description`, `tools`, `skills` | project-guardrails, evidence-proof, backend-reliability |
| compliance-checker.md | Same | project-guardrails, evidence-proof |
| performance-optimizer.md | Same | project-guardrails, evidence-proof, backend-reliability |
| data-analyst.md | Same | project-guardrails, evidence-proof, retriever |

## 5.5 Visual: Agent → Skill Mapping (Full)

See full diagram in original plan. Key: Plan gets run-the-business, multi-pr-coordinator; General-Purpose gets self-fix, conflict-resolution, multi-pr-coordinator; frontend-engineer gets backend-full-checklist; qa-engineer gets five-agent-verification.

## 5.6 What to Watch For

- [ ] Project agents: YAML frontmatter before first `#`; valid YAML
- [ ] New agents: Match settings.json structure (name, description, tools, model, skills)
- [ ] Personal agents (~/.claude/agents/): Document that user must add skills manually
- [ ] No duplicate skills; no circular skill refs

---

# PROJECT 6: Config, Docs & Integration

**Purpose**: Update configuration and documentation so the full flow is discoverable and correct.

## 6.1 File Count

| File | Action | What to Do |
|------|--------|------------|
| `.claude/settings.json` | UPDATE | Add skills to Plan, General-Purpose, frontend-engineer, qa-engineer; add allowedCommands if needed |
| `.claude/CLAUDE.md` | UPDATE | Run-the-business default; live monitoring; self-fix; subagent table |
| `docs/SKILLSETS.md` | UPDATE | Quick reference; watchdog flow; fix PR flow; agent→skill table; cost optimization |
| `.gitignore` | UPDATE | Add `!.claude/skills/<name>/` for each new skill; `!.claude/agents/live-watchdog.md` etc. |

## 6.2 settings.json Details

| Section | Change |
|---------|--------|
| `subagents.core[0].skills` (Explore) | Add: cost-guardrails |
| `subagents.core[1].skills` (Plan) | Add: run-the-business, multi-pr-coordinator, cost-guardrails |
| `subagents.core[2].skills` (General-Purpose) | Add: self-fix, conflict-resolution, multi-pr-coordinator, cost-guardrails |
| `subagents.optional[2].skills` (frontend-engineer) | Add: backend-full-checklist |
| `subagents.optional[4].skills` (qa-engineer) | Add: five-agent-verification |
| `allowedCommands` | Add: `gh pr list`, `gh run list`, `gh run view` (if live watchdog uses gh) |

## 6.3–6.6 CLAUDE.md, SKILLSETS.md, .gitignore

See full plan. Add cost-guardrails to CLAUDE.md cost optimization section. Add model-tier rules to SKILLSETS.md.

---

# Additional Skills for Full Automation

Optional: deploy-trigger, health-checker, changelog-writer, dependency-updater, lint-fixer, test-gap-analyzer, stakeholder-feedback, agent-orchestration.

---

# Summary: Full Task List

- **CREATE** 27 skills (includes cost-guardrails)
- **UPDATE** 10 skills
- **CREATE** 3 agents
- **UPDATE** 9 agents
- **UPDATE** 4 config/doc files

**Execution Order**: Project 1 → 2 → 3 → 4 → 5 → 6

**Model-Agnostic & Cost**: cost-guardrails skill encodes Haiku-first, tiered verification, extra guardrails for cheap/Opus plans. No limiting issues regardless of model or plan.

**Do not start coding until this plan is approved.**
