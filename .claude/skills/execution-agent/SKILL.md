---
name: execution-agent
description: Maximum determinism, minimal ambiguity. Dumb checklists over agentic reasoning. Use for any task execution. Enforced checkpoints; fail loudly if incorrect.
---

# Execution Agent Skill

**Principle**: Do the smallest possible task. A dumb checklist saves everyone's sanity. Replace memory or guesswork with enforced checkpoints.

---

## Principles (Non-Negotiable)

1. **Smallest possible task** — Avoid broad agentic reasoning. Prefer simple deterministic steps.
2. **Enforced checkpoints** — Replace memory or guesswork with scripts or functions that enforce required arguments.
3. **Fail before continuing** — If something can fail programmatically, it must fail and stop before proceeding.

---

## Execution Rules

- **Never rely on remembering instructions** from the prompt. Call scripts or functions that enforce required arguments.
- **If required information is missing** → stop, fix it, then proceed. Do not guess or infer.
- **If a script throws an error** → fix missing data and retry. Do not proceed until the command succeeds.
- **Conditionals must be deterministic** — e.g. if frontend changed → include screenshot; if not → write why. No ambiguity.

---

## Architectural Rule

**If a workflow can be written as a script, it must be a script.**

Use AI only for tasks requiring intelligence:
- Summarization
- Reasoning
- Classification
- Drafting text

Everything else must be:
- Deterministic
- Validated
- Fail loudly if incorrect

---

## Example: PR Creation Workflow

### Step 1 — Prepare required fields (checklist)

| Field | Required? | Source |
|-------|-----------|--------|
| PR description | Yes | Draft from changes |
| Source prompt | Yes | User message or task |
| Webserver link | Yes | `curl -s http://localhost:3000/health` → use if 200 |
| Screenshot | If frontend changed | Capture before create |
| Slack link | If request from Slack | User context |

### Step 2 — Enforce conditionals deterministically

- **If** change touches frontend (src/www/, *.html, *.css, *.jsx) → include screenshot
- **If** no frontend change → write explicit statement: "No frontend change; [reason]"

### Step 3 — Call CLI (or equivalent)

```bash
gh pr create --title "..." --body "..."  # with required fields
# Or project script: create-pr --description "..." --source-prompt "..." --web-link "..." --screenshot "..." --slack-link "..."
```

### Step 4 — Validation

- **If** script errors → fix missing data, retry. Do NOT proceed until success.
- **If** success → output PR URL only if real.

---

## Integration

- **plan-and-execute**: Use checkpoints between phases; never skip a gate.
- **pr-push-merge**: Required fields before create; fail if missing.
- **fix-pr-creator**: Required: type, scope, fixAgent. Stop if missing.
- **evidence-proof**: Required: actual test output. Fail if invented.

---

## Related Skills

- `plan-and-execute` — Checklist-driven; gates between phases
- `pr-push-merge` — PR creation with required fields
- `evidence-proof` — Enforce test output; no speculation
- `project-guardrails` — Never invent; cite evidence
