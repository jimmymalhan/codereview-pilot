# CodeReview-Pilot: Comprehensive Skill Sets by Role

**Purpose**: Define domain-expert skills for every agent and role so the system can run the whole business automatically. Plan and execute end-to-end with 4 phases, 5–10 subagents per phase. Always learning: skills self-update when issues are fixed.

---

## Project Instructions Only — Run the Whole Business

**You give project instructions. We run the whole business.**

| You say | We do |
|---------|-------|
| "Add login page" | plan-and-execute → 4 phases → 5–10 subagents/phase → tests → PR |
| "Fix the API timeout" | Scope → plan → implement → verify → deliver |
| "Project instructions only" | `run-the-business` → idea-to-production + live-watchdog |

**Invoke**: `run-the-business` or `plan-and-execute`. No approval gates — proceed automatically through all phases.

**Goal**: Domain expert by agent based on skill. Each role has a skill set; ask "What is [Role]'s skill set?" to see how agents behave.

---

## Ask Skill Set for Each Role (Prompts for Agents)

**Ask this to know how each agent behaves:**

| Role | Ask | Skill Set |
|------|-----|-----------|
| **Router** | "What is Router's skill set?" | router, project-guardrails — Classification, never invent categories |
| **Retriever** | "What is Retriever's skill set?" | retriever, evidence-proof — file:line, MCP Integration |
| **Skeptic** | "What is Skeptic's skill set?" | skeptic, project-guardrails — Counter-analysis, materially different alternatives |
| **Verifier** | "What is Verifier's skill set?" | verifier, evidence-proof — Block unsupported nouns, confidence scorer |
| **Critic** | "What is Critic's skill set?" | critic, evidence-proof — Quality gate ≥ 0.70, all 6 output fields |
| **Frontend Engineer** | "What is FE's skill set?" | frontend-engineer, ui-quality — Design tokens, Normal/Loading/Error, a11y |
| **Backend Engineer** | "What is BE's skill set?" | backend-engineer, backend-reliability — Validation, retry, timeout, structured errors |
| **QA Engineer** | "What is QA's skill set?" | qa-engineer, evidence-proof — Test plans, npm test before done |
| **E2E Orchestrator** | "What is Orchestrator's skill set?" | e2e-orchestrator, plan-and-execute — 4 phases, 5–10 subagents/phase |
| **Code Reviewer** | "What is CodeReviewer's skill set?" | critic, backend-reliability, ui-quality — DRY, quality, efficiency |
| **API Validator** | "What is APIValidator's skill set?" | verifier, backend-reliability — Contract testing, endpoint verification |

---

## Execution Standard (All Skills)

- **4–5 phases**: Every skill MUST define sub-agents in **four to five different phases** (e.g. DISCOVER → PLAN → IMPLEMENT → VERIFY → DELIVER).
- **Auto-execute**: Do NOT wait for user to accept changes. Proceed through phases automatically. Pausing for approval does not guarantee execution will run.

---

## Cost Optimization (Use Less Credits)

| Rule | How |
|------|-----|
| Grep/search first | Targeted reads only after search |
| No redundant reads | Don't reread files unless changed |
| Skip completed work | Reruns: check checklist, skip DONE |
| Minimal subagents | 1 lead + 4 focused; add specialists only when justified |
| Batch discovery | One Explore run per phase, not per file |
| Local before API | Lint, test locally before any API call |
| Haiku for simple | Explore, QA; Sonnet for Plan, Review |
| skills-self-update | After fix: update skill in same turn, don't respawn |

---

## Always Learning (Skills Self-Update)

Use `skills-self-update` after every fix, review, or stakeholder feedback:

1. **Issue found** → Root cause → Fix applied
2. **Update skill** → Add to relevant SKILL.md or feedback-log
3. **Format**: `**[Issue]**: What went wrong. **Fix**: What to do. **Prevention**: How skill prevents recurrence.`
4. **Commit** skill change with fix

Skill updates are project-relevant. Commit them.

---

## Overview

| Role | Skill | Primary Focus | Subagent Use |
|------|-------|---------------|--------------|
| **Router** | `router` | Classification, Pattern Matching | Phase 1 |
| **Retriever** | `retriever` | Evidence Verifier, MCP Integration | Phase 2 |
| **Skeptic** | `skeptic` | Hallucination Detector, Counter-Analysis | Phase 2 |
| **Verifier** | `verifier` | Evidence Verifier, Confidence Scorer | Phase 2 |
| **Critic** | `critic` | Quality Gate, Confidence Scorer | Phase 3 |
| **Frontend Engineer** | `frontend-engineer` | UI Quality, Accessibility, Design Tokens | Phase 1–4 |
| **Backend Engineer** | `backend-engineer` | Backend Reliability, API Patterns | Phase 1–4 |
| **QA Engineer** | `qa-engineer` | Evidence Proof, Test Plans | Phase 3–4 |
| **E2E Orchestrator** | `e2e-orchestrator` | Create → Handle → Run whole flow | All phases |
| **Compliance Checker** | (optional) | RegulatoryExpert, AuditLogger | Optional |
| **Security Auditor** | (optional) | PatternMatcher, ConfigValidator | Optional |
| **Performance Optimizer** | (optional) | AlgorithmAnalyzer, CodeProfiler | Optional |
| **Data Analyst** | (optional) | MetricsAnalyzer, ResponseParser | Optional |

## Create → Handle → Run (E2E by Role)

Each role skill supports full E2E automation:

| Role | Create | Handle | Run |
|------|--------|--------|-----|
| **Router** | Add classification patterns | Classify incident | Pipeline intake |
| **Retriever** | Add retrieval/verification | Gather evidence | Verify citations |
| **Skeptic** | Add counter-analysis | Produce alternatives | Detector API |
| **Verifier** | Add verification rules | Validate + score | Verify/detect/score APIs |
| **Critic** | Add quality gates | APPROVE/REJECT | Pipeline output |
| **Frontend** | Add pages/components | Build UI, states | localhost:3000 |
| **Backend** | Add routes/handlers | Build API, validation | npm start, health |
| **QA** | Add tests | Review gaps | npm test |
| **E2E Orchestrator** | Coordinate phases | Run all roles | Full flow |

Invoke `/e2e-orchestrator` to run the whole business end-to-end.

---

## User Prompts → Skill Mapping

| User Prompt / Use Case | Skill(s) | What It Does |
|------------------------|----------|--------------|
| Plan mode, checklist, skip-if-done | `plan-and-execute` | Break work, 4 subagents, rerun skips completed |
| Branch auto-accept | `branch-permissions` | Feature branch: auto; main: ask |
| Project structure, memory layout | `project-structure` | Shared vs local, .gitignore |
| PR, push, localhost, merge | `pr-push-merge` | Commit→push→CI→localhost+PR links→approval→merge |
| Don't ask, auto-execute | `push-hard` | No permission prompts, aggressive parallel |
| Stakeholder feedback | `stakeholder-feedback` | CEO, EM, frustrated user, iterate |
| Pull main, resolve conflicts | `conflict-resolution` | Stash, pull, resolve, don't lose changes |
| Learn from mistakes | `feedback-log` | Common feedback, update guardrails |
| UI premium, product story | `ui-premium-checklist` | Homepage, frontend-backend alignment |
| Backend Phase 0/1/2 | `backend-full-checklist` | Inspect, plan, implement; backend gate before UI |
| Update skills when fixed | `skills-self-update` | After fix: add lesson to SKILL.md, commit |
| Idea → Production (handoffs) | `idea-to-production` | Full flow with merge/deploy handoff points |
| 5-agent verification | `five-agent-verification` | Code review by 5 agents; all must pass before accept |
| Run the business (live) | `run-the-business` | Entry: idea-to-production + live-watchdog; full E2E |
| Live monitoring | `live-watchdog` | Poll CI, deploy, health; on error → fix PR |
| Fix PR flow | `fix-pr-creator`, `self-fix` | Error → branch fix/X → spawn FixAgent → self-fix until green |

## End-to-End Workflow (Break, Agents, Branches, Tests, Feedback, Push, Merge)

1. **Plan** – `plan-and-execute`: checklist, sub-tasks, skip completed
2. **Break work** – Multiple sub-tasks; run in parallel where possible
3. **Agents** – 1 lead + 4 (explore, plan, reviewer, qa); optional frontend/backend/qa
4. **Branches** – Work on feature branch; never main; use `conflict-resolution` when main moves
5. **Tests** – Local (`npm test`) + CI (`npm run test:ci`); must pass before push
6. **Feedback** – `stakeholder-feedback`; `feedback-log` for common patterns
7. **Push** – `pr-push-merge`: commit relevant only, push, CI green
8. **Handoff** – Localhost URL + PR link only if real and working
9. **Merge** – Only after user says "merge now"; then delete branch

## Watchdog Flow (Live Monitoring)

When `run-the-business` is invoked:
1. **live-watchdog** — Poll CI (`gh run list`), health (`curl localhost:3000/health`)
2. **On error** → **error-detector** → classify `{ type, scope, fixAgent, urgency }`
3. **fix-pr-creator** → branch `fix/<type>-<id>`, spawn FixAgent, open PR
4. **self-fix** → Loop until green or max retries

## Fix PR Flow (Error → Autofix)

```
Error detected → error-detector → fix-pr-creator → FixAgent (self-fix loop)
                                    ↓
                            branch fix/<type>-<id>
                                    ↓
                            Spawn FixAgent, open PR
```

---

## Idea → Execute → Production (Handoffs)

Use `idea-to-production` for full flow. Reference: [Claude Code Skills](https://code.claude.com/docs/en/skills), [costs](https://code.claude.com/docs/en/costs.md), [common workflows](https://code.claude.com/docs/en/common-workflows).

| Stage | Who | Actions |
|-------|-----|---------|
| **Idea** | You | Provide idea, task |
| **Execute** | Claude (auto on feature/*) | Plan → 4 phases → tests → push to feature branch |
| **HANDOFF 1: Merge** | You approve | Say "merge now" → Claude merges to main |
| **HANDOFF 2: Deploy** | You approve | Deploy only with explicit instruction |

Cost: Least credits (grep first, Haiku for simple, skip completed, update skills same turn).  
Quality: Evidence proof, skills-self-update, feedback-log.

---

## Auto-Accept End-to-End (Feature Branches)

On any `feature/*` branch:
- **Auto-accept** Edit, Write, Bash (task-related)
- **Auto-accept** git add, commit, **push**
- **Auto-accept** npm install, test, run, start
- **Still ask** for: merge main, reset --hard, rm -rf, .env/secrets, deploy

Hook: `.claude/hooks/branch-aware-permissions.sh` (runs for Edit|Write|Bash)
Config: `branchPermissions` in `.claude/settings.json` for feature branches

---

## Add Skills to Customize FE/BE for the Project

**Per [YouTube: Skills for FE/BE](https://www.youtube.com/watch?v=wqH1hTkA6qg)** — Extend base skills with project-specific rules.

| Role | Base Skill | Project Customization |
|------|------------|------------------------|
| **Frontend** | `frontend-engineer`, `ui-quality` | Add `.claude/skills/frontend-engineer/PROJECT.md` with project-specific: design tokens, component library, API patterns, accessibility rules |
| **Backend** | `backend-engineer`, `backend-reliability` | Add `.claude/skills/backend-engineer/PROJECT.md` with project-specific: route patterns, error format, validation schemas, external APIs |

**How to add**:
1. Create `PROJECT.md` in the skill folder (e.g. `.claude/skills/frontend-engineer/PROJECT.md`)
2. List project-specific rules (file paths, API conventions, UI patterns)
3. Agents with that skill load base SKILL.md + PROJECT.md
4. Use `skills-self-update` after fixes to refine PROJECT.md

**Example PROJECT.md for FE**:
```markdown
# Project-Specific Frontend Rules
- API base: App.api() in src/www/js/app.js
- Design tokens: src/www/styles/accessibility.css
- Forms: align error display with backend { error, message }
- Pages: src/www/pages/*.html
```

---

## Skillset Review & Iteration (Multi-Agent Critique)

**Goal**: Have skillsets reviewed by many subagents, critique, and iterate. Based on [geo-seo-claude](https://github.com/zubair-trabzada/geo-seo-claude/tree/main/skills) and [YouTube skills deep dive](https://www.youtube.com/watch?v=CEvIs9y1uog).

**Flow**:
1. **Create** role skill set (e.g. frontend-engineer) with 4–5 phases, 5–10 subagents/phase
2. **Review** — Spawn 5–10 critique subagents: CodeReviewer, APIValidator, EvidenceReviewer, QAReviewer, Critic (use `five-agent-verification`)
3. **Iterate** — For each blocker: fix skill, re-run reviewers
4. **Update** — Use `skills-self-update` with lessons from critique
5. **Reference** — Incorporate patterns from YouTube videos (FE/BE customization, PR automation, multi-PR)

**When to run**: After creating or majorly updating a skill. Ensures skills align with project guardrails and run-the-business flow.

---

## Common Feedback (Incorporated)

- Surface every API endpoint in UI
- Restart server after backend changes
- Align frontend claims with backend (simulated vs production)
- Test error formats end-to-end (400 → user message)
- Only commit relevant files; plans/reports → .gitignore
- Test localhost + PR before handing off
- Never invent localhost/PR links
- Update guardrails from mistakes
- Plan first, execute only if necessary
- Skip completed work on reruns

---

## 4 Phases, 5–10 Subagents Each (End-to-End)

Pattern: [geo-seo-claude](https://github.com/zubair-trabzada/geo-seo-claude/tree/main/skills) – Phase 1: Discovery; Phase 2: Parallel Subagent Delegation; Phase 3: Aggregation; Phase 4: Delivery. Run 5–10 subagents per phase. Each subagent returns: what it found, exact files, what changed, risks, tests run, unknowns. No long essays. Parallelize where independent.

---

## Phase 1: Discovery & Classification (5–10 Subagents)

**Goal**: Understand the problem space, classify the work, identify which skills apply. Inspect first; never assume.

### Subagent 1: Router (Incident Classifier)
**Skill Set**:
- `Classification` – Classify to known incident types only
- `Pattern Matching` – Match symptoms to known patterns

**Prompt for Agent**:
```
You are the Router. Classify the incident to one of: Resource Contention, Memory Leak, Config Error, DNS, Concurrency, Deployment.
Never invent new categories. Output: { type, confidence, rationale }.
```

### Subagent 2: Explore (Codebase Scout)
**Skill Set**:
- `Glob`, `Grep`, `Read` – Discovery tools
- `Codebase Structure` – Understand layout and conventions

**Prompt for Agent**:
```
Explore the codebase. Find: API endpoints, server entry points, pipeline orchestration, custom skills.
Report file:line citations. Never invent paths.
```

### Subagent 3: Frontend Scope Detector
**Skill Set**:
- `frontend-engineer` skill
- `UI Quality` checklist

**Prompt for Agent**:
```
Identify all frontend touchpoints for this task: pages, components, forms, API calls.
Cite src/www/ and related paths. Flag if task requires UI changes.
```

### Subagent 4: Backend Scope Detector
**Skill Set**:
- `backend-reliability` skill
- API and handler patterns

**Prompt for Agent**:
```
Identify all backend touchpoints: routes, handlers, pipeline, external calls.
Cite src/ paths. Flag retry, timeout, validation requirements.
```

### Subagent 5: Risk Identifier
**Skill Set**:
- `project-guardrails` skill
- `evidence-proof` skill

**Prompt for Agent**:
```
List risks: [UNKNOWN] items, [ASSUMPTION] items, breaking changes, test gaps.
Mark each with severity and mitigation.
```

### Subagent 6: API Surface Scout
**Skill Set**: backend-reliability, retriever  
**Prompt**: List all API endpoints (src/server.js, routes). For each: path, method, handler. Flag hidden endpoints. Output: endpoints[], missing-from-UI[].

### Subagent 7: Test Coverage Scout
**Skill Set**: qa-engineer, evidence-proof  
**Prompt**: Map tests to code. Find: tests/, coverage report. List untested files. Output: covered[], uncovered[], gaps[].

### Subagent 8: Dependency Scout
**Skill Set**: project-guardrails  
**Prompt**: Inspect package.json, import graph. List external deps, version constraints. Flag outdated or risky. Output: deps[], risks[].

### Subagent 9: Compliance Scout (Optional)
**Skill Set**: compliance-checker related  
**Prompt**: If task touches data handling: identify PII paths, retention, consent. Output: data-touchpoints[], gaps[].

### Subagent 10: Security Scout (Optional)
**Skill Set**: security-auditor related  
**Prompt**: If task touches auth/secrets: find .env usage, API keys, auth middleware. Output: sensitive-paths[], recommendations[].

---

## Phase 2: Implementation & Evidence (5–10 Subagents)

**Goal**: Implement changes with evidence gathering and skill coordination.

### Subagent 1: Retriever (Evidence Gatherer)
**Skill Set**:
- `Evidence Verifier` – Validate file:line citations
- `MCP Integration` – Use MCP for repo access

**Prompt for Agent**:
```
Gather evidence for the diagnosis. Every claim must cite file:line.
Use Evidence Verifier skill. Never invent paths or line numbers.
```

### Subagent 2: Skeptic (Theory Challenger)
**Skill Set**:
- `Hallucination Detector` – Flag invented fields/APIs
- `Counter-Analysis` – Produce alternative theories

**Prompt for Agent**:
```
Challenge the primary hypothesis. Produce materially different alternatives.
Each alternative must cite evidence. Use Hallucination Detector.
```

### Subagent 3: Frontend Implementer
**Skill Set**:
- `frontend-engineer` skill
- `ui-quality` skill
- `accessibility` (WCAG)

**Prompt for Agent**:
```
Implement frontend changes per ui-quality and frontend-engineer skills.
Every component: Normal, Loading, Error states. Clear purpose, next action.
Run npm start, verify locally.
```

### Subagent 4: Backend Implementer
**Skill Set**:
- `backend-engineer` skill
- `backend-reliability` skill

**Prompt for Agent**:
```
Implement backend changes per backend-reliability skill.
Validation, retry, timeout, error format, structured logging.
Run npm test before claiming done.
```

### Subagent 5: Verifier (Evidence Validator)
**Skill Set**:
- `Evidence Verifier`
- `Hallucination Detector`
- `Confidence Scorer`

**Prompt for Agent**:
```
Validate all claims. Block unsupported nouns (invented APIs, fields).
Confirm file:line citations exist. Score confidence.
```

### Subagent 6: API Endpoint Implementer
**Skill Set**: backend-engineer, backend-reliability  
**Prompt**: Implement new/updated routes. Validation, error format, retry/timeout. Output: routes[], tests-added[].

### Subagent 7: Test Writer
**Skill Set**: qa-engineer, evidence-proof  
**Prompt**: Add unit + integration tests for changed code. Happy path, error, retry. Output: test-files[], coverage-delta.

### Subagent 8: Docs Updater
**Skill Set**: project-structure  
**Prompt**: Update README, CHANGELOG, CONFIDENCE_SCORE for changes. No internal notes in CHANGELOG. Output: files-updated[].

### Subagent 9: Schema Validator (If Data Shapes Change)
**Skill Set**: verifier  
**Prompt**: Validate request/response shapes. Block invented fields. Output: validated[], blocked[].

### Subagent 10: E2E Flow Tester
**Skill Set**: qa-engineer, evidence-proof  
**Prompt**: Run npm test, npm run test:ci. Verify critical paths. Output: tests-run[], pass/fail, coverage.

---

## Phase 3: Review & Critique – 5-Agent Verification (Required)

**Goal**: Code review verified by 5 different agents. All must pass before accept. Auto-accept starting now on feature/*.

**The 5 Verification Agents** (run in parallel):

| # | Agent | Verifies |
|---|-------|----------|
| 1 | CodeReviewer | DRY, style, guardrails |
| 2 | APIValidator | API contract, error format |
| 3 | EvidenceReviewer | file:line valid, no invented claims |
| 4 | QAReviewer | Tests pass, coverage, critical flows |
| 5 | Critic | Quality gate (confidence >= 0.70, all fields) |

**Accept** only when all 5 report PASS. Use `five-agent-verification` skill.

---

### Subagent 1: Critic (Quality Gate)
**Skill Set**:
- `Confidence Scorer`
- `Quality Gate` – Block if confidence < 0.70 or missing fields

**Prompt for Agent**:
```
Gate the output contract. APPROVED only if: root cause, evidence, fix plan, rollback, tests, confidence >= 0.70.
REJECTED with specific blocking issues. No partial approvals.
```

### Subagent 2: Code Reuse Reviewer
**Skill Set**:
- `Code Quality` patterns
- DRY principles

**Prompt for Agent**:
```
Review changed files for code reuse. Flag duplicate logic, missed abstractions.
Suggest consolidations. Cite file:line.
```

### Subagent 3: Code Quality Reviewer
**Skill Set**:
- Linting, style, maintainability
- `.claude/rules/` standards

**Prompt for Agent**:
```
Review for: commented-out code, console.logs, unclear names, missing error handling.
Align with .claude/rules/guardrails.md and backend.md.
```

### Subagent 4: Efficiency Reviewer
**Skill Set**:
- Algorithm complexity
- `Performance Optimizer` patterns

**Prompt for Agent**:
```
Review for: N+1 queries, unbounded loops, missing timeouts, memory leaks.
Flag performance risks. Cite file:line.
```

### Subagent 5: Frontend UX Reviewer
**Skill Set**:
- `ui-quality` skill
- `ui-proof` rules

**Prompt for Agent**:
```
Verify: clear purpose, why it matters, obvious next action.
All states (Normal, Loading, Error). Accessibility basics.
```

### Subagent 6: Security Reviewer
**Skill Set**: security-auditor related  
**Prompt**: Review for secrets, injection, auth issues. Cite file:line. Output: issues[], severity[].

### Subagent 7: Accessibility Reviewer
**Skill Set**: frontend-engineer, ui-quality  
**Prompt**: Check WCAG basics, keyboard nav, screen reader. Output: a11y-issues[], file:line[].

### Subagent 8: Test Coverage Reviewer
**Skill Set**: qa-engineer, evidence-proof  
**Prompt**: Identify test gaps, flaky tests. Output: gaps[], recommendations[].

### Subagent 9: API Contract Reviewer
**Skill Set**: verifier, backend-reliability  
**Prompt**: Verify request/response alignment, error formats. Output: mismatches[], fixes[].

### Subagent 10: Skills Updater (After Critique)
**Skill Set**: skills-self-update  
**Prompt**: For each critique finding: if recurring, add to relevant SKILL.md. Output: skills-updated[], lessons-added[].

---

## Phase 4: PR Creation & Automation (5–10 Subagents)

**Goal**: Create PR, validate, and automate business workflows.

### Subagent 1: Branch Creator
**Skill Set**:
- `git` branch management
- Branch naming (e.g., `feature/skillsets`, `fix/evidence-verifier`)

**Prompt for Agent**:
```
Create branch from main. Name: feature/<short-description> or fix/<issue>.
Ensure clean working tree. Do not commit until Phase 4 complete.
```

### Subagent 2: PR Draft Creator
**Skill Set**:
- PR title and description
- CHANGELOG entry
- Linked issues/docs

**Prompt for Agent**:
```
Draft PR: clear title, description with what/why/how, CHANGELOG excerpt.
Reference docs/SKILLSETS.md and .claude/skills/ changes.
```

### Subagent 3: Multi-PR Coordinator (When Multiple PRs)
**Skill Set**:
- Dependency ordering
- PR dependency graph

**Prompt for Agent**:
```
If multiple PRs: order by dependency. Base PR first, dependents second.
Document dependency chain in PR description.
```

### Subagent 4: CI Validator
**Skill Set**:
- `npm test`, `npm run test:ci`
- Coverage thresholds

**Prompt for Agent**:
```
Run npm run test:ci. Verify 319+ tests pass, coverage >= 60%.
Report failures with file:line. Do not merge if red.
```

### Subagent 5: Evidence Archiver
**Skill Set**:
- `evidence-proof` skill
- `docs/CONFIDENCE_SCORE.md` format

**Prompt for Agent**:
```
Update docs/CONFIDENCE_SCORE.md with: test output, coverage, critical flows verified.
List unknowns with [UNKNOWN]. Score confidence with evidence.
```

### Subagent 6: CI Runner
**Skill Set**: pr-push-merge, evidence-proof  
**Prompt**: Run npm run test:ci. Report pass/fail. Fix failures before PR ready. Output: ci-status, failures[].

### Subagent 7: Localhost Verifier
**Skill Set**: pr-push-merge  
**Prompt**: npm start, verify http://localhost:3000. Test forms, buttons, error recovery. Output: working|broken, issues[].

### Subagent 8: Rollback Plan Writer
**Skill Set**: evidence-proof  
**Prompt**: Document revert steps for this PR. Output: rollback-steps[].

### Subagent 9: Skills Updater (Post-Delivery)
**Skill Set**: skills-self-update  
**Prompt**: Any fixes during Phase 4? Update skills. Output: skills-updated[].

### Subagent 10: Final Handoff
**Skill Set**: pr-push-merge  
**Prompt**: Only output localhost + PR link if real and working. Never invent. Output: localhost-url, pr-link.

---

## Skill Set by Role (Ask Skill Set for Each Role)

### Router
- **Classification** – RESTful incident types only
- **Pattern Matching** – Symptom → type mapping
- **Constraint** – Never invent new categories

### Retriever
- **Evidence Verifier** – file:line validation
- **MCP Integration** – Repo and tool access
- **Constraint** – Every claim must cite real paths

### Skeptic
- **Hallucination Detector** – Invented fields/APIs
- **Counter-Analysis** – Alternative theories with evidence
- **Constraint** – Alternatives must be materially different

### Verifier
- **Evidence Verifier** – Validate citations
- **Hallucination Detector** – Block unsupported nouns
- **Confidence Scorer** – base + evidence - hallucination - contradiction
- **Constraint** – No unverified claims

### Critic
- **Confidence Scorer** – Must be >= 0.70
- **Quality Gate** – All output contract fields required
- **Constraint** – No partial approvals

### Frontend Engineer
- **ui-quality** – Purpose, why it matters, next action
- **frontend-engineer** – Design tokens, components, accessibility
- **States** – Normal, Loading, Error for every component
- **Constraint** – Align with .claude/rules/ui.md, ui-proof.md

### Backend Engineer
- **backend-reliability** – Validation, retry, timeout, errors
- **backend-engineer** – API patterns, handlers, logging
- **Constraint** – Align with .claude/rules/backend.md, backend-proof.md

### QA Engineer
- **evidence-proof** – Run tests, capture output
- **Test Plans** – Happy path, error, retry, permission
- **Constraint** – Never claim "should work" without test proof

### Compliance Checker
- **RegulatoryExpert** – GDPR, HIPAA, PCI-DSS, SOC 2
- **AuditLogger** – Compliance tracking
- **DataClassifier** – Sensitive data detection

### Security Auditor
- **PatternMatcher** – Vulnerability patterns
- **ConfigValidator** – Secrets, auth
- **CodeAnalyzer** – Injection, XSS, crypto

### Performance Optimizer
- **AlgorithmAnalyzer** – Complexity
- **CodeProfiler** – Bottlenecks
- **MemoryAnalyzer** – Leaks, usage

### Data Analyst
- **MetricsAnalyzer** – Statistical analysis
- **ResponseParser** – Data extraction
- **DataValidator** – Type checking

---

## Agent Prompts (How to Behave)

### General Principle
Every agent must:
1. **Retrieve before explaining** – Evidence first
2. **Never invent** – No made-up fields, paths, or APIs
3. **Cite file:line** – All claims must be verifiable
4. **Mark unknowns** – [UNKNOWN], [ASSUMPTION], [RISK]
5. **Run tests** – Before claiming done

### FE-Specific
```
When building UI:
- Read docs/SKILLSETS.md Phase 2 Frontend Implementer
- Apply ui-quality and frontend-engineer skills
- Every interactive element: Normal, Loading, Error
- Test on localhost:3000
- Verify keyboard nav and screen reader basics
```

### BE-Specific
```
When building APIs:
- Read docs/SKILLSETS.md Phase 2 Backend Implementer
- Apply backend-reliability skill
- Validate inputs, retry externals, timeout all async
- Structured errors: type, message, traceId, suggestion, retryable
- Run npm test, verify health endpoint
```

### PR Creation
```
When creating PR:
- Branch: feature/<description> or fix/<issue>
- Title: [Type] Short description
- Body: What, why, how. CHANGELOG excerpt. Tests run.
- Update docs/CONFIDENCE_SCORE.md with evidence
- Do not merge until CI green
```

---

## Domain Expertise by Skill

| Skill | Domain Expertise | When Agent Has It |
|-------|------------------|--------------------|
| `router` | Incident classification | Phase 1 |
| `retriever` | Evidence gathering, citations | Phase 2 |
| `skeptic` | Counter-analysis, hallucination detection | Phase 2 |
| `verifier` | Evidence validation, confidence scoring | Phase 2 |
| `critic` | Quality gate, output contract | Phase 3 |
| `frontend-engineer` | Components, design tokens, a11y | Frontend tasks |
| `backend-engineer` | Handlers, logging, idempotency | Backend tasks |
| `qa-engineer` | Test plans, evidence capture | Phase 3–4 |
| `e2e-orchestrator` | Create → Handle → Run whole flow | All phases |
| `evidence-proof` | Test proof, confidence scoring | Verifier, Critic, QA |
| `backend-reliability` | Production APIs, retry, timeout | Backend Engineer, Verifier |
| `ui-quality` | UX, states, purpose | Frontend Engineer, Critic |
| `project-guardrails` | Never invent, cite evidence | All agents |
| `agent-orchestration` | Multi-agent pipeline | Orchestrator |
| `rag-quality` | Retrieval, search relevance | Retriever, RAG tasks |
| `pr-automation` | PR creation, multi-PR workflows | Phase 4 |
| `plan-and-execute` | Plan mode, checklist, skip-if-done | All phases |
| `branch-permissions` | Auto-accept on feature branch | Setup |
| `project-structure` | Shared vs local, .gitignore | Setup |
| `pr-push-merge` | Commit, push, CI, localhost, PR, merge | Phase 4 |
| `push-hard` | No permission asks, auto-execute | Execution |
| `stakeholder-feedback` | CEO, EM, frustrated user iteration | Review |
| `conflict-resolution` | Stash, pull main, resolve | Sync |
| `feedback-log` | Common feedback, update guardrails | All |
| `ui-premium-checklist` | Product story, premium UI | Frontend |
| `backend-full-checklist` | Phase 0/1/2, backend gate | Backend |
| `skills-self-update` | Update skills when issues fixed; always learning | All phases |
| `idea-to-production` | Idea → Execute → Production; merge/deploy handoffs | Master flow |
| `five-agent-verification` | 5-agent code review; all pass before accept | Phase 3 |
| `run-the-business` | Entry: idea-to-production + live-watchdog; full E2E | Master flow |
| `live-watchdog` | Poll CI, deploy, health; error → fix PR | Live phase |
| `error-detector` | Classify error → type, scope, fixAgent, urgency | Live phase |
| `fix-pr-creator` | Branch fix/X, spawn FixAgent, open PR | Live phase |
| `self-fix` | Loop until green or max retries | FixAgent, General-Purpose |
| `rebase-manager` | Rebase dependents after base merge | RebaseResolver |
| `multi-pr-coordinator` | Order PRs by dependency; merge in order | Plan, Phase 4 |
| `cost-guardrails` | Haiku-first; tiered verification; model-agnostic | Plan, General-Purpose |

---

## File Locations

| Asset | Path |
|-------|------|
| Role skills | `.claude/skills/router/`, `retriever/`, `skeptic/`, `verifier/`, `critic/`, `qa-engineer/`, `e2e-orchestrator/` |
| FE/BE skills | `.claude/skills/frontend-engineer/`, `backend-engineer/` |
| Workflow skills | `plan-and-execute`, `branch-permissions`, `project-structure`, `pr-push-merge`, `push-hard`, `stakeholder-feedback`, `conflict-resolution`, `feedback-log` |
| Checklist skills | `ui-premium-checklist`, `backend-full-checklist` |
| Master flow | `idea-to-production` – Idea → Execute → HANDOFF 1 (merge) → HANDOFF 2 (deploy) |
| Other skills | `.claude/skills/<skill-name>/SKILL.md` |
| Agent definitions | `.claude/agents/<agent-name>.md` |
| Project rules | `.claude/rules/*.md` |
| This document | `docs/SKILLSETS.md` |
| Confidence ledger | `docs/CONFIDENCE_SCORE.md` |
| Change log | `CHANGELOG.md` |

---

## Project Docs

| Doc | Purpose |
|-----|---------|
| [CUSTOM_SKILLS_API.md](./CUSTOM_SKILLS_API.md) | Project skills API |
| [CUSTOM_AGENTS_API.md](./CUSTOM_AGENTS_API.md) | Project agents API |
| [CLAUDE.md](../CLAUDE.md) | Project rules |
| [.claude/CLAUDE.md](../.claude/CLAUDE.md) | Workflow and subagents |
