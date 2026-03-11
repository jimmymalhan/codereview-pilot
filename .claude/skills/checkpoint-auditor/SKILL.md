# Checkpoint Auditor

## Purpose
Verify checkpoint counts across all truth surfaces (ROADMAP_TODO, PROJECT_1.0.0_CHECKPOINTS, CHANGELOG, README). Detect count mismatches, unchecked items that should be checked, and checked items without evidence.

## Trigger
- DISCOVER phase after roadmap-auditor
- Before any milestone close
- Before any release claim

## Workflow Stage
**Phase 1 (DISCOVER)** — Depends on roadmap-auditor output.

## Required Inputs
- `.claude/ROADMAP_TODO.md`
- `.github/PROJECT_1.0.0_CHECKPOINTS.md`
- `CHANGELOG.md` (checkpoint count claims like "25/29")
- `README.md` (progress percentages)

## Exact Output Format
```json
{
  "sources": {
    "roadmap_todo": { "total": 0, "checked": 0, "unchecked": 0 },
    "checkpoints_file": { "total": 0, "checked": 0, "unchecked": 0 },
    "changelog_claim": { "total": 0, "done": 0, "text": "" },
    "readme_claim": { "percentage": 0, "text": "" }
  },
  "mismatches": [
    { "between": ["source_a", "source_b"], "issue": "", "fix": "" }
  ],
  "authoritative_source": "roadmap_todo",
  "true_count": { "total": 0, "done": 0, "pending": 0 }
}
```

## Files to Inspect
- `.claude/ROADMAP_TODO.md`
- `.github/PROJECT_1.0.0_CHECKPOINTS.md`
- `CHANGELOG.md` (grep for checkpoint counts)
- `README.md` (grep for progress percentages)

## Proof Needed
- Exact line numbers where counts appear in each file
- Mathematical verification: claimed percentage matches actual ratio
- [x] items verified against source code existence

## Fail Conditions
- Accepting mismatched counts without flagging
- Not identifying which source is authoritative
- Claiming a count without reading the actual file

## Next Handoff
- Mismatches → `milestone-checkpoint-sync` to fix
- README drift → `readme-reality-check`

## Token Thrift Rules
- Grep for `[x]` and `[ ]` patterns rather than reading full files
- Count lines matching patterns, don't parse content

## When NOT to Use
- No checkpoint-related changes in current session
