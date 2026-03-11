# Security Review

## Purpose
Scan for secrets, injection vulnerabilities, auth issues, and PII exposure in code changes. Block commits and PRs that introduce security risks.

## Trigger
- Pre-commit hook (scan staged diff)
- Pre-PR (scan full branch diff against main)
- Manual invocation for audit

## Workflow Stage
Phase 3 (Review) — gate before merge

## Required Inputs
- `git diff` output (staged or branch diff)
- File list of changed files

## Exact Output Format (JSON)
```json
{
  "status": "pass|fail|warn",
  "issues": [
    {
      "file": "src/config.js",
      "line": 42,
      "severity": "critical|high|medium|low",
      "type": "secret|injection|auth|pii|hardcoded-credential",
      "description": "API key found in source code",
      "pattern": "sk-ant-api03-...",
      "recommendation": "Move to .env and add to .gitignore"
    }
  ],
  "summary": { "critical": 0, "high": 1, "medium": 0, "low": 0 },
  "blocked": true
}
```

## Commands to Run
```bash
git diff --cached --unified=0
git diff main...HEAD --unified=0
grep -nE "(sk-ant-|sk-|AKIA|ghp_|gho_|password\s*=\s*['\"]|api[_-]?key\s*=\s*['\"]|token\s*=\s*['\"]|secret\s*=\s*['\"])" -- ':!*.md' ':!*.lock'
grep -rnE "(eval\(|exec\(|child_process|innerHTML\s*=|dangerouslySetInnerHTML)" src/ --include="*.js"
grep -rnE "(console\.log.*password|console\.log.*token|console\.log.*secret|console\.log.*key)" src/ --include="*.js"
```

## Files to Inspect
- All files in `git diff` output
- `.env` and `.env.*` files (should be in .gitignore)
- `.gitignore` (verify sensitive patterns are excluded)
- `src/` JavaScript files for injection patterns
- `package.json` — check for known vulnerable dependencies

## Proof Needed
- Grep output showing no secret patterns in diff
- `.gitignore` includes `.env`, `*.pem`, `*.key`
- No `eval()`, `exec()`, or raw SQL concatenation in changed files
- No PII (email, SSN, phone) logged to console

## Fail Conditions
- Any secret pattern found in committed code (BLOCK)
- `.env` file staged for commit (BLOCK)
- `eval()` or `exec()` with user input (BLOCK)
- PII in log statements (BLOCK)
- Missing auth check on protected endpoint (BLOCK)
- Hardcoded credentials of any kind (BLOCK)

## Next Handoff
- `commit-precheck` skill (if pre-commit)
- `extreme-critique` skill (if PR review)
- `fix-pr-creator` skill (if issues found, create fix)

## What to Cache
- Known safe patterns (test fixtures, mock keys)
- .gitignore contents for session

## What to Update on Success
- Nothing — security review is read-only validation

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — record security issue found
- `CHANGELOG.md` — record security fix applied
- `.claude/rules/guardrails.md` — add new pattern if novel issue type

## Token Thrift Rules
- Scan only changed lines in diff, not entire files
- Use grep patterns, not file reads, for secret detection
- Skip binary files and lock files
- Stop at first critical issue (no need to find all if blocked)

## When NOT to Use
- For documentation-only changes (*.md with no code)
- For .claude/skills/ changes (no runtime secrets)
- For test fixture files with clearly fake credentials (verify they are fake first)
- When diff is empty (no changes to scan)
