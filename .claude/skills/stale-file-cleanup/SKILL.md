# Stale File Cleanup

## Purpose
Classify every file as required/stale/duplicate/generated/irrelevant/needs-move. Never delete blindly — require evidence before any removal. Keep the repo lean and navigable.

## Trigger
- DISCOVER phase (start of session)
- Repository audit
- Manual invocation

## Workflow Stage
Phase 1 (Discovery)

## Required Inputs
- Repository root path
- `.gitignore` contents
- `package.json` (scripts, dependencies)
- Active skill list (`.claude/SKILLSETS.md`)

## Exact Output Format (JSON)
```json
{
  "files": [
    {
      "path": "reference/old-notes.md",
      "classification": "required|stale|duplicate|generated|irrelevant|needs-move",
      "evidence": "Not imported by any src/ file. Last modified 90 days ago. No reference in package.json or SKILLSETS.md.",
      "action": "delete|move|keep|review",
      "duplicateOf": "null|path/to/original",
      "lastModified": "2025-12-01",
      "referencedBy": []
    }
  ],
  "summary": { "required": 40, "stale": 3, "duplicate": 1, "generated": 2, "irrelevant": 0, "needsMove": 1 }
}
```

## Commands to Run
```bash
ls -la *.md
ls -la reference/ data/ incidents/ 2>/dev/null
git log --diff-filter=M --since="60 days ago" --name-only --pretty=format:""
grep -r "require\|import" src/ --include="*.js" -l
```

## Files to Inspect
- Root-level `*.md` files (check if referenced by skills or docs)
- `reference/` directory (check for outdated references)
- `data/` directory (check for stale test data)
- `incidents/` directory (check for resolved incidents)
- `package.json` — scripts that reference files
- `.claude/SKILLSETS.md` — skills that reference files

## Proof Needed
- File not imported/required by any source file
- File not referenced in package.json scripts
- File not referenced by any skill in `.claude/skills/`
- Last modified date older than 60 days with no references
- Duplicate content verified by diff comparison

## Fail Conditions
- Deleting a file still imported by source code
- Deleting a file referenced in package.json
- Deleting a file referenced by an active skill
- Classifying a config file (.env, .eslintrc) as stale without checking usage
- Removing test fixtures still used by tests

## Next Handoff
- `commit-precheck` skill (verify deletions pass precheck)
- `branch-cleanup` skill (if cleanup triggers branch work)

## What to Cache
- File reference map (which files import/require which)
- Skill-to-file mapping from `code-skill-mapping`

## What to Update on Success
- `CHANGELOG.md` — record files removed/moved
- `.claude/CONFIDENCE_SCORE.md` — record cleanup evidence

## What to Update on Failure
- `.claude/CONFIDENCE_SCORE.md` — record why cleanup was blocked

## Token Thrift Rules
- Use `ls` and `grep` with targeted paths, not recursive full-repo scans
- Check references with grep before reading file contents
- Skip node_modules, .git, dist, build directories

## When NOT to Use
- During active feature development (wait until feature merges)
- On files modified in the last 7 days
- On config files without verifying they are unused
- When unsure if a file is referenced by CI/CD pipelines (check `.github/workflows/` first)
