---
name: live-watchdog
description: Poll CI status, deploy status, and health endpoint at configurable intervals. On error → invoke error-detector.
---

# Live-Watchdog Skill

**Purpose**: Monitor project health at regular intervals. Detect CI red, deploy failures, health check failures.

**When to use**: After idea-to-production completes, or when user wants "watch and fix" mode.

---

## Poll Interval

- **Default**: 5 minutes (configurable)
- **Cheaper plans**: 10 minutes (reduce API calls)
- **On error**: Immediate retry after fix PR pushed

---

## What to Poll

| Source | Check | Command |
|--------|-------|---------|
| CI | GitHub Actions status | `gh run list --limit 1` |
| Deploy | (if configured) | Deploy endpoint or status |
| Health | Server responds | `curl -sf http://localhost:3000/health` |

---

## On Error Detected

1. **Invoke** `error-detector` with: CI output, health response, deploy status
2. **Output**: `{ type, scope, fixAgent, urgency }`
3. **Invoke** `fix-pr-creator` with error-detector output
4. **Loop**: `self-fix` until green

---

## Output Format

```json
{
  "status": "ok|error",
  "ci_status": "green|red|running",
  "health_status": "ok|fail",
  "last_check": "ISO8601",
  "next_check_in_seconds": 300
}
```

---

## Related Skills

- `error-detector` — Classify and route
- `fix-pr-creator` — Create fix PR
- `self-fix` — Retry until green
- `cost-guardrails` — Adjust poll interval for plan
