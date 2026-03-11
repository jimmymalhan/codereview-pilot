---
name: ultra-automation
description: Maximum autonomy. Idea→production. No approval gates. ON by default when run-the-business. DAG, token-budget, consensus, handoff, degradation.
---

# Ultra-Automation Skill

**Principle**: Maximum autonomy. Idea → production. No gates. All advanced skills active. **ON by default** when run-the-business is invoked.

## Activation (Default)

- **When** run-the-business is used → ultra-automation is ON
- **Env** (optional override): `ULTRA_AUTO=true` or `FULL_AUTO=true`
- **To disable**: User says "plan only", "do not auto-merge", or "ask before merge"

## Active Stack

| Skill | Role |
|-------|------|
| auto-merge | Merge when CI green |
| dag-executor | Parallel, dependency-ordered tasks |
| token-budget | Cap tokens; save state at limit |
| consensus-resolver | Resolve agent disagreements |
| handoff-protocol | Structured state between agents |
| failure-taxonomy | Learn from failures |
| explainability | Rationale for decisions |
| graceful-degradation | Reduce scope under pressure |
| property-based-testing | Generative edge cases |
| structured-logging | Full observability |
| audit-trail | Immutable log |
| secrets-scan | Block commits |
| reversibility | Rollback always |

## Flow

1. **Idea** → plan-and-execute (DAG if parallelizable)
2. **Execute** → General-Purpose with all guards
3. **Verify** → 5-agent + consensus-resolver
4. **PR** → pr-push-merge + secrets-scan + reversibility
5. **Merge** → auto-merge when CI green (no ask)
6. **Deploy** → If FULL_AUTO and deploy script exists
7. **Watch** → live-watchdog; fix PR auto-merge on green

## Guards (Never Bypassed)

- secrets-scan — Block if secrets
- reversibility — Rollback documented
- Critical blockers in consensus — Reject

## Related

- `run-the-business` — Entry; invokes with ULTRA_AUTO
- `idea-to-production` — Full flow
- `auto-merge` — Merge without ask
