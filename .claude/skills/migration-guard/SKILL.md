# Migration Guard

## Purpose
Detect breaking changes in code: renamed exports, changed API signatures, removed fields, database schema changes. Ensure backward compatibility or require a migration plan before merging.

## Trigger
- Pre-edit on any `src/` file
- Pre-PR review for backend changes
- Any change to exported functions, API routes, or data schemas

## Workflow Stage
Phase 2 (Implementation) — validation during development

## Required Inputs
- `git diff` of changed files (staged or branch)
- File paths being modified
- Current exported symbols from changed modules

## Exact Output Format (JSON)
```json
{
  "status": "pass|fail|warn",
  "breakingChanges": [
    {
      "file": "src/api-client.js",
      "type": "renamed-export|removed-export|changed-signature|removed-field|type-change|removed-route",
      "symbol": "diagnoseIncident",
      "before": "diagnoseIncident(incident, options)",
      "after": "diagnoseIncident(incident)",
      "consumedBy": ["src/local-pipeline.js", "src/server.js"],
      "severity": "breaking|deprecation|safe",
      "migrationRequired": true
    }
  ],
  "backwardCompatible": false,
  "migrationPlan": "Required: update all 2 consumers to remove options parameter",
  "summary": { "breaking": 1, "deprecation": 0, "safe": 3 }
}
```

## Commands to Run
```bash
git diff HEAD --unified=0 -- src/
git diff HEAD -- src/ | grep -E "^[-+].*(module\.exports|export |function )"
grep -rnE "require\(.*<changed-module>\)|import.*from.*<changed-module>" src/ --include="*.js"
git diff HEAD -- src/ | grep -E "^-.*\.(get|post|put|delete)\("
```

## Files to Inspect
- Changed `src/` files (diff for removed/renamed exports)
- All files that import changed modules (consumer impact)
- `package.json` — version field (semver compliance)
- `.claude/rules/api.md` — API contract for route changes
- `tests/` — test expectations that may break

## Proof Needed
- Diff showing exact symbol changes (before/after)
- Consumer list for each changed export
- All consumers updated if breaking change proceeds
- Tests updated to match new signatures
- API docs updated if route changes

## Fail Conditions
- Removing an export without updating all consumers (BLOCK)
- Changing a function signature without updating callers (BLOCK)
- Removing an API route documented in api.md without updating docs (BLOCK)
- Removing a response field from an API endpoint (BLOCK)
- Introducing breaking change without migration plan (BLOCK)
- Changing error response format without updating tests (BLOCK)

## Next Handoff
- `api-contract-check` skill (if API routes changed)
- `blast-radius` skill (assess full impact)
- `evidence-proof` skill (run tests to verify consumers work)

## What to Cache
- Export map per module (symbol -> consumers)
- API route list from server.js

## What to Update on Success
- Nothing — migration guard is read-only validation

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — record breaking change found
- `CHANGELOG.md` — document breaking change and migration steps
- `.claude/rules/api.md` — update if API contract changed intentionally

## Token Thrift Rules
- Scan only changed files in diff, not entire src/
- Use grep for export/import detection, not full file reads
- Check only direct consumers (one level deep), not transitive
- Skip test files for export analysis (they are consumers, not producers)

## When NOT to Use
- For additive-only changes (new exports, new fields, new routes)
- For internal/private function changes (not exported)
- For test file changes (no downstream consumers)
- For documentation or skill changes
- For CSS/HTML-only changes
