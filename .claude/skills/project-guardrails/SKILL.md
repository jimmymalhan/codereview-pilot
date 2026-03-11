---
name: project-guardrails
description: Anti-hallucination guardrails, idempotent workflow, cost optimization, quality gates. Reusable across all agents.
---

## Phase 1: DISCOVER
### Sub-Agent: `GuardrailScout` (model: haiku)
- **Prompt**: Check CLAUDE.md, .claude/rules/, settings.json. Identify current guardrails. Find gaps: any rule referenced but not enforced?
- **Output**: `{ guardrails_active[], gaps[], rules_files[] }`
- **Gate**: guardrails mapped

## Phase 2: PLAN
### Sub-Agent: `GuardrailMapper` (model: haiku)
- **Prompt**: Map gaps to fixes. Prioritize by risk (anti-hallucination > cost > quality).
- **Output**: `{ fixes[{gap, fix, priority}] }`
- **Gate**: fixes planned

## Phase 3: IMPLEMENT
### Sub-Agent: `GuardrailEnforcer` (model: haiku)
- **Prompt**: Flag violations during execution. Check: invented paths? Missing evidence? Unsupported claims? Confidence without proof?
- **Output**: `{ violations[], clean: boolean }`
- **Gate**: 0 violations (or all flagged)

## Phase 4: VERIFY
### Sub-Agent: `GuardrailVerifier` (model: haiku)
- **Prompt**: Confirm no violations remain. Re-check flagged items.
- **Output**: `{ verified: boolean, remaining_violations[] }`
- **Gate**: verified

## Phase 5: DELIVER
### Sub-Agent: `GuardrailReporter` (model: haiku)
- **Prompt**: Output compliance status. List any new guardrails added.
- **Output**: `{ compliant: boolean, new_guardrails[], violations_fixed }`
- **Gate**: reported

## Contingency
IF guardrail conflict (two rules contradict) → flag to user, ask which takes precedence. Never silently resolve conflicts.

---

# Project Guardrails Skill – Code Review Pilot

**Purpose**: Provide a reusable, project‑specific guardrail playbook for this repo so that future agents and contributors:
- Don’t redo completed work.
- Don’t violate safety, security, or cost constraints.
- Always close the loop with tests, docs, and confidence evidence.

This file is intentionally kept **short** and references existing rules instead of duplicating them.

---

## 1. Project Snapshot (for Subagents)

- **Repo**: `code-review-pilot`
- **Stack**: Node.js (Express), React, Jest, Anthropic/agent orchestration layer.
- **Entry points**:
  - Backend: `src/server.js`
  - App UI: `src/www/App.jsx`
  - Marketing site: `src/www/WebsiteApp.jsx`
- **Key docs**:
  - Root `CLAUDE.md` – project non‑negotiables.
  - `.claude/CLAUDE.md` – meta‑workflow (plan → execute → verify).
  - `docs/CONFIDENCE_SCORE.md` – confidence ledger and evidence.
  - `CHANGELOG.md` – versioned behavior changes.

**Rule**: Before making any change, agents must skim these four to understand current behavior and what is already complete.

---

## 2. Idempotent Workflow Rule

**Goal**: If a prompt is re‑run, agents should **skip work that is already done** and focus only on deltas.

### Checklist

1. **Check status first**
   - [ ] Read `CHANGELOG.md` for the latest version entry.
   - [ ] Read the latest session in `docs/CONFIDENCE_SCORE.md`.
   - [ ] If a feature or fix is already described as complete with tests, treat it as done unless there is new evidence of breakage.
2. **Compare plan vs. reality**
   - [ ] If the user asks to "finish Phase C" or "wire the website," confirm that Phase C docs say "COMPLETE" before doing anything.
3. **Act only on gaps**
   - [ ] Add tests or docs only for missing coverage or newly added functionality.
   - [ ] Do not recreate components, endpoints, or tests that already exist and pass.

Mark anything uncertain as `[UNKNOWN]` in `docs/CONFIDENCE_SCORE.md` instead of guessing.

---

## 3. Safety & Permissions in This Repo

- **Protected files** are defined in `.claude/settings.json` (do not modify them directly unless the task explicitly requires it and tests are updated).
- The `branch-aware-permissions.sh` hook:
  - Keeps **main/master** strict.
  - Allows more freedom on feature branches so local iteration is fast.

**Rule**: Even if tools allow a command, **never**:
- Commit secrets or `.env` files.
- Force‑push to `main`/`master`.
- Remove or weaken validation/error handling without strengthening tests.

---

## 4. Cost Optimization Guardrails (Claude API & Tokens)

These patterns incorporate best practices shared by the Claude community (e.g., Reddit/Dev posts) and Anthropic guidance:

1. **Keep context lean**
   - Do not paste entire large files into every conversation; use targeted `Read`/`Grep`.
   - Keep `CLAUDE.md` and skills concise and modular so they load fast.
2. **Prefer local checks before API calls**
   - Run `npm test`, lint, and type checks locally instead of asking the model to infer whether code "should work."
3. **Use cheaper models for simple tasks**
   - Use lighter agents/models for:
     - File reads and small edits.
     - Simple refactors.
     - Searching for symbols.
   - Reserve heavier models for:
     - Architecture changes.
     - Complex debugging.
     - Multi‑step reasoning.
4. **Be specific, not vague**
   - Write focused prompts ("Add a test for X error case in Y file") instead of open‑ended "improve everything" prompts.
5. **Batch where possible**
   - Group related small edits or checks into a single iteration instead of many tiny ones.

These principles should be reused across other projects when setting up cost‑conscious guardrails.

---

## 5. Quality Gates (Never Skip)

For any non‑trivial change:

- [ ] **Tests**: Run `npm test` and ensure 0 failures. If new logic is added, add tests alongside it.
- [ ] **Docs**: Update `CHANGELOG.md` and, if behavior changed, `docs/CONFIDENCE_SCORE.md`.
- [ ] **Flows**: Re‑verify any user flows affected by the change (diagnosis, batch, analytics, website navigation).
- [ ] **Unknowns**: Add `[UNKNOWN]` entries for anything untested or out of scope.

Only raise confidence to 95–100 in `docs/CONFIDENCE_SCORE.md` when all these gates are satisfied and tests are passing.

---

## 6. Reuse Guidance

To reuse this skill in other repositories:

1. Copy the file into `.claude/skills/project-guardrails/SKILL.md`.
2. Update the **Project Snapshot** with that repo’s entrypoints and key docs.
3. Align **Quality Gates** to that repo’s test commands and coverage thresholds.
4. Keep the **Idempotent Workflow Rule** and **Cost Optimization Guardrails** as‑is—they are broadly applicable.

