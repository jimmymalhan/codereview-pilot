# Ultra-Advance: What Else & What to Review

**Purpose**: Gaps, next-level enhancements, and review checklist for the CodeReview-Pilot skillset and automation.

---

## 1. What Else (Ultra-Advance Roadmap)

### 1.1 Skills Not Yet Implemented (from PLAN)

| Skill | Purpose | Priority |
|-------|---------|----------|
| **deploy-trigger** | Auto-trigger deploy on merge; integrate with CI/CD | High |
| **health-checker** | Structured health probes (liveness, readiness, dependencies) | High |
| **changelog-writer** | Auto-generate CHANGELOG from commits/PRs | Medium |
| **dependency-updater** | npm audit fix, Dependabot-style, lock refresh | Medium |
| **lint-fixer** | Auto-fix lint errors before commit; ESLint --fix | High |
| **test-gap-analyzer** | Map coverage gaps; untested paths; mutation hints | Medium |
| **agent-orchestration** | Exists but may need DAG/spawn sequencing wiring | Check |

### 1.2 Next-Level Capabilities

| Capability | What | Why Ultra |
|------------|------|-----------|
| **Causal debugging** | Trace failure → root cause with evidence chain | Beyond pattern matching |
| **Regression guard** | Per-PR: "did this PR introduce this failure?" | Precise blame |
| **Spec-driven tests** | OpenAPI/Contract → auto-generate tests | Zero manual test authoring |
| **Cost per run** | Token/credit audit per phase, per agent | Budget awareness |
| **Self-tune thresholds** | Confidence decay, circuit-breaker N from history | Adaptive behavior |
| **Canary rollout** | Gradual deploy; rollback on error spike | Production safety |
| **Multi-repo sync** | Monorepo or cross-repo dependency ordering | Enterprise scale |
| **Compliance gates** | GDPR/HIPAA/PCI checkpoints in flow | Regulated domains |

### 1.3 Integration Gaps

| Integration | Current | Ultra-Advance |
|-------------|---------|---------------|
| **GitHub** | gh CLI, PR/CI | Auto-merge rules, branch protection, CODEOWNERS |
| **CI/CD** | npm test, test:ci | Deploy pipeline, env promotion, rollback hooks |
| **Observability** | structured-logging, audit-trail | OpenTelemetry, metrics export, trace correlation |
| **Secrets** | secrets-scan | Vault/integration, rotation hooks |
| **MCP** | Context providers | Full tool integration, custom tools |

---

## 2. Review Checklist

### 2.1 Skills Review

- [ ] **All SKILL.md** have YAML frontmatter: `name`, `description`
- [ ] **4–5 phases** defined where applicable (DISCOVER → PLAN → IMPLEMENT → VERIFY → DELIVER)
- [ ] **Output contracts** explicit (JSON schema or structured format)
- [ ] **Critical blockers** defined (e.g., consensus-resolver, secrets-scan)
- [ ] **Integration points** documented (related skills)
- [ ] **No invented** fields, APIs, or paths in examples
- [ ] **Compact** (<500 lines per skill where possible)

### 2.2 Agents Review

- [ ] **settings.json** — All agents have skills arrays; no typos
- [ ] **Agent .md files** — YAML frontmatter (name, description, tools, model, skills)
- [ ] **Phase alignment** — Optional agents have correct phase (1–4)
- [ ] **Model tier** — Haiku for Explore, QA, FixAgent; Sonnet for Plan, CodeReviewer, Critic
- [ ] **LiveWatchdog** — Has ultra-automation, auto-merge, failure-taxonomy
- [ ] **FixAgent** — Has handoff-protocol, failure-taxonomy, explainability
- [ ] **CodeReviewer** — Has consensus-resolver, explainability

### 2.3 Config Review

- [ ] **.gitignore** — All skill dirs explicitly unignored: `!.claude/skills/<name>/`
- [ ] **hooks** — branch-aware-permissions, update-confidence, check-edits
- [ ] **allowedCommands** — gh run list, gh run view, etc. if watchdog uses them
- [ ] **branchPermissions** — feature/* auto-accept; main: ask

### 2.4 Flow Review

- [ ] **Idea → Production** — idea-to-production includes Live Phase, merge/deploy handoffs
- [ ] **Fix PR Flow** — Error → error-detector → fix-pr-creator → FixAgent (self-fix loop)
- [ ] **5-agent verification** — Tiered (quick/standard/full); re-run only blockers
- [ ] **Multi-PR** — multi-pr-coordinator → rebase-manager → conflict-resolution
- [ ] **Ultra-automation** — ULTRA_AUTO=true enables full stack; no gates

### 2.5 Docs Review

- [ ] **SKILLSETS.md** — All skills in tables (Overview, User Prompts, Domain Expertise)
- [ ] **CHANGELOG.md** — Session changes; no internal notes
- [ ] **CONFIDENCE_SCORE.md** — Evidence; unknowns marked [UNKNOWN]
- [ ] **PLAN_AGENTS_SKILLS_RUN_BUSINESS.md** — Aligned with current impl

### 2.6 Tests & Evidence

- [ ] **npm test** passes
- [ ] **Coverage** ≥ 60%
- [ ] **Critical flows** verified: intake → response, pipeline, error recovery
- [ ] **No "should work"** — Only verified outcomes

---

## 3. Quick Verification Commands

```bash
# All tests pass
npm test

# Skill count
ls -1 .claude/skills | wc -l

# Agents in settings
jq '.subagents.core[].name, .subagents.optional[].name' .claude/settings.json

# Skill references (no typos)
jq -r '.subagents | .core, .optional | .[] | .skills[]' .claude/settings.json | sort -u
```

---

## 4. Confidence Before Release

| Check | Target |
|-------|--------|
| Skills documented in SKILLSETS | 100% |
| Agents have skills | 100% |
| npm test | Pass |
| No invented refs | 0 |
| Unknowns marked | All |

---

## 5. Related

- [SKILLSETS.md](./SKILLSETS.md) — Full skill reference
- [PLAN_AGENTS_SKILLS_RUN_BUSINESS.md](./PLAN_AGENTS_SKILLS_RUN_BUSINESS.md) — Implementation plan
- [CONFIDENCE_SCORE.md](./CONFIDENCE_SCORE.md) — Evidence ledger
