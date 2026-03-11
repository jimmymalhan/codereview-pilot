---
name: secrets-scan
description: Block commit if secrets detected in diff. Scan for API keys, tokens, .env patterns.
---

# Secrets Scan Skill

**Principle**: Never commit secrets. Scan before every commit. Block if detected.

## Patterns to Block

| Pattern | Example |
|---------|---------|
| API key | `api_key="sk-..."`, `API_KEY=...` |
| Bearer token | `Bearer eyJ...` |
| AWS | `AWS_SECRET_ACCESS_KEY=`, `AKIA...` |
| Generic secret | `secret=`, `password=`, `token=` in code |
| .env content | Any line from .env in staged files |
| Hex token | 32+ char hex string in config |

## When to Run

- **Before** `git commit` — Scan `git diff --cached`
- **Gate**: If match → BLOCK commit, output: "Secret detected in [file:line]. Remove before committing."
- **Allowlist**: `// no-secrets-scan` or `# pragma: allow-secret` for test fixtures only

## Implementation

```bash
# Pre-commit check
git diff --cached -U0 | grep -iE '(api_key|secret|password|token|bearer|AKIA|sk-)' && exit 1
```

Or use `gitleaks` / `detect-secrets` if available.

## Output on Block

```json
{
  "blocked": true,
  "reason": "secrets_detected",
  "files": ["src/config.js:12"],
  "message": "Remove secrets before committing."
}
```

## Related

- `pr-push-merge` — Run before commit
- `branch-permissions` — Block .env, secrets
- `execution-agent` — Fail before continuing
