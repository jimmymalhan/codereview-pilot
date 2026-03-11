# Blast Radius

## Purpose
Before any edit, calculate blast radius: what files are affected, what tests cover them, what could break. Prevent unintended regressions by understanding impact before changing code.

## Trigger
- Pre-edit hook (before modifying any source file)
- Manual invocation before refactoring
- Pre-PR review

## Workflow Stage
Phase 1 (Discovery) — must complete before Phase 2 (Implementation)

## Required Inputs
- `filePath` — the file about to be edited
- `changeType` — add/modify/delete/rename

## Exact Output Format (JSON)
```json
{
  "targetFile": "src/server.js",
  "changeType": "modify",
  "riskLevel": "low|medium|high|critical",
  "affectedFiles": [
    { "path": "src/routes/diagnose.js", "relationship": "imports-from", "impact": "direct" },
    { "path": "tests/server.test.js", "relationship": "tests", "impact": "direct" }
  ],
  "testCoverage": {
    "hasTests": true,
    "testFiles": ["tests/server.test.js"],
    "coveragePercent": 85
  },
  "exportedSymbols": ["app", "startServer"],
  "importedBy": ["src/run.js"],
  "riskFactors": ["High import count", "No integration test"],
  "recommendation": "Safe to edit with existing test coverage"
}
```

## Commands to Run
```bash
grep -r "require.*<filename>\|import.*<filename>" src/ tests/ --include="*.js" -l
grep -r "describe\|it(" tests/ --include="*.test.js" -l | xargs grep "<module-name>"
npm test -- --coverage --collectCoverageFrom="<filePath>"
```

## Files to Inspect
- The target file itself (exports, side effects)
- All files that import/require the target
- All test files that reference the target module
- `package.json` — scripts that invoke the target
- `.claude/rules/api.md` — if target is an API route

## Proof Needed
- Import/require graph showing all dependents
- Test file list covering the target
- Coverage percentage for the target file
- List of exported symbols that could break consumers

## Fail Conditions
- Editing a file with zero test coverage without flagging risk as "high" or "critical"
- Editing a file imported by 5+ modules without flagging risk as "high"
- Renaming an export without checking all consumers
- Missing a test file that covers the target

## Next Handoff
- `evidence-proof` skill (run tests after edit to verify no regression)
- `migration-guard` skill (if breaking changes detected)
- `rollback-check` skill (document revert path)

## What to Cache
- Import graph for the session (avoid re-scanning unchanged files)
- Test-to-source mapping

## What to Update on Success
- Nothing — blast-radius is read-only analysis

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — lower confidence if blast radius was missed

## Token Thrift Rules
- Use `grep` for import scanning, not full file reads
- Cache import graph; only re-scan changed files
- Skip node_modules, .git, dist, build
- Read only exports section of target file, not entire contents

## When NOT to Use
- For documentation-only changes (*.md files)
- For test file edits (tests don't have downstream dependents)
- For .claude/skills/ changes (no runtime impact)
- For config files with no code imports (.eslintrc, .prettierrc)
