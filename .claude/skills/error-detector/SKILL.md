---
name: error-detector
description: Classify error from CI/deploy/health. Output type, scope, fixAgent, urgency. Route to correct fix agent.
---

# Error-Detector Skill

**Purpose**: Classify errors so the right fix agent is invoked. Never guess—output structured format only.

**When to use**: When live-watchdog or manual check detects CI red, deploy failed, or health check fail.

---

## Input

- CI run output or status
- Health endpoint response (or failure reason)
- Deploy status (if available)

---

## Output Format (Required)

```json
{
  "type": "test|build|lint|deploy|health|unknown",
  "scope": "single_file|multiple_files|config|dependency|unknown",
  "fixAgent": "FixAgent|RebaseResolver|other",
  "urgency": "critical|high|medium|low"
}
```

---

## Type Classification

| Type | When | fixAgent |
|------|------|----------|
| test | CI red from test failures | FixAgent |
| build | Build/npm fails | FixAgent |
| lint | Lint errors | FixAgent |
| deploy | Deploy pipeline fails | FixAgent or RebaseResolver |
| health | Health endpoint non-200 | FixAgent |
| unknown | Cannot classify | FixAgent |

---

## Scope Rules

- **single_file**: 1 file likely cause (e.g., one failing test)
- **multiple_files**: 2+ files or unclear
- **config**: package.json, tsconfig, eslint, etc.
- **dependency**: node_modules, lock file
- **unknown**: Cannot determine

---

## Urgency

- **critical**: Production down, health fail
- **high**: CI red on main or critical branch
- **medium**: CI red on feature branch
- **low**: Flaky, intermittent

---

## Related Skills

- `fix-pr-creator` — Uses this output
- `self-fix` — Retry loop
- `live-watchdog` — Invokes this
