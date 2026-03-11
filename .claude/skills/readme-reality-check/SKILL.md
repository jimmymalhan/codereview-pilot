# README Reality Check

## Purpose
Verify every claim in README.md against actual repo state. Detect stale progress numbers, missing features, invented commands, broken links, and undisclosed limitations. README must match reality at all times.

## Trigger
- DISCOVER phase of workflow-router
- After any feature completion
- After any milestone update
- Before any release or PR to main
- When roadmap-auditor detects doc drift

## Workflow Stage
**Phase 1 (DISCOVER)** and **Phase 4 (VERIFY)** — Check before planning, verify after implementation.

## Required Inputs
- `README.md`
- `package.json` (scripts, version, dependencies)
- repo-intelligence snapshot
- roadmap-auditor output (checkpoint counts)
- Last npm test output

## Exact Output Format
```json
{
  "claims_verified": [
    { "claim": "", "section": "", "evidence": "", "match": true }
  ],
  "claims_stale": [
    { "claim": "", "section": "", "reality": "", "fix": "" }
  ],
  "claims_missing": [
    { "what": "", "why_needed": "" }
  ],
  "undisclosed": [
    { "what": "", "impact": "" }
  ]
}
```

## Commands to Run
```bash
# Verify npm scripts mentioned in README exist
node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).join('\n'))"
# Verify version
node -e "console.log(require('./package.json').version)"
# Check test counts
npm test 2>&1 | grep -E "Tests:|Suites:|coverage"
```

## Files to Inspect
- `README.md` — every section
- `package.json` — scripts, version
- `src/server.js` — endpoints listed in README
- `.claude/ROADMAP_TODO.md` — progress numbers

## Proof Needed
- Every command in README exists in package.json scripts
- Every API endpoint in README exists in server.js
- Progress percentages match actual checkpoint counts
- Version number matches package.json
- Test badge matches actual test results

## Fail Conditions
- README claims a command that doesn't exist in package.json
- README claims a feature that has no source file
- README shows a progress percentage that doesn't match checkpoints
- README doesn't mention known limitations (e.g., mock pipeline)

## Next Handoff
- Stale claims → Phase 4 `readme-updater` worker to fix
- Missing claims → `workflow-router` for planning
- Undisclosed items → `external-feedback-critic` for impact assessment

## What to Cache
- Verified README claims (valid until README or code changes)

## What to Update on Success
- Nothing directly — produces audit report

## What to Update on Failure
- Flag unverifiable claims as [UNKNOWN]

## Token Thrift Rules
- Don't read full server.js — grep for route patterns
- Don't run full test suite — use cached test output from repo-intelligence
- Compare README line-by-line only in sections with numbers/commands

## When NOT to Use
- README was just updated this session with verified data
- Change is purely in .claude/ files with no README impact
