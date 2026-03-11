# PR Memory

## Purpose
Maintain a living record of all PR activity: what was merged, what was closed, what was learned, what patterns emerged. Feed lessons into skill updates. Prevent repeating past mistakes.

## Trigger
- After any PR merge
- After any PR close
- When pr-triage classifies PRs
- VERIFY phase of workflow-router

## Workflow Stage
**Phase 4 (VERIFY)** — Records outcomes after work is done.

## Required Inputs
- `gh pr list --state closed --limit 20` output
- PR comments and review feedback
- Test results from merged PRs
- Skill updates triggered by PR work

## Exact Output Format
```json
{
  "recent_prs": [
    {
      "number": 0, "title": "", "branch": "", "status": "merged|closed",
      "lessons": [], "skills_updated": [], "patterns": []
    }
  ],
  "recurring_patterns": [
    { "pattern": "", "frequency": 0, "skill_to_update": "" }
  ],
  "mistakes_to_avoid": []
}
```

## Files to Inspect
- Recent PR descriptions and comments (via gh API)
- `CHANGELOG.md` (merged PR entries)
- `.claude/skills/*/SKILL.md` (updated skills)

## Proof Needed
- PR data from actual gh API calls, not invented
- Patterns based on 2+ occurrences, not single instances

## Fail Conditions
- Recording a PR that doesn't exist
- Identifying a pattern from a single occurrence
- Not feeding lessons back into relevant skills

## Next Handoff
- Recurring patterns → `skills-self-update`
- Mistakes → `feedback-loop`
- Merged PRs → `branch-hygiene` for cleanup

## What to Cache
- PR history (append-only, valid across sessions)

## What to Update on Success
- Relevant SKILL.md files with new lessons
- `feedback-loop` with new patterns

## What to Update on Failure
- Flag [UNKNOWN] if gh API unavailable

## Token Thrift Rules
- Use gh --json for structured PR data
- Read only PR titles and labels, not full diffs
- Batch pattern detection across multiple PRs

## When NOT to Use
- No PR activity since last run
- gh CLI unavailable (degrade gracefully)
