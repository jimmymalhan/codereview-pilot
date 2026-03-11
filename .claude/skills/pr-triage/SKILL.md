# PR Triage

## Purpose
Classify every open PR as: keep, merge-ready, needs-update, duplicate, stale, superseded, or close-if-permitted. Update descriptions if stale. Link to roadmap/milestone if missing.

## Trigger
- DISCOVER phase of workflow-router
- After any PR merge (check remaining PRs)
- Session start (via open-prs-workflow hook)
- When branch-hygiene detects orphaned branches with PRs

## Workflow Stage
**Phase 1 (DISCOVER)** and **Phase 3 (IMPLEMENT/CLEAN)** — Discover to classify, implement to act.

## Required Inputs
- `gh pr list --state open` output
- `gh pr list --state closed --limit 20` output (for duplicate/superseded detection)
- Branch inventory from branch-hygiene
- Roadmap state from roadmap-auditor

## Exact Output Format
```json
{
  "open_prs": [
    {
      "number": 0,
      "title": "",
      "branch": "",
      "classification": "keep | merge-ready | needs-update | duplicate | stale | superseded | close-if-permitted",
      "reason": "",
      "action": "",
      "linked_roadmap_item": "",
      "age_days": 0
    }
  ],
  "actions_taken": [],
  "actions_blocked": [
    { "pr": 0, "action": "", "blocker": "" }
  ]
}
```

## Commands to Run
```bash
gh pr list --state open --json number,title,headRefName,createdAt,updatedAt --limit 50
gh pr list --state closed --json number,title,headRefName,mergedAt --limit 20
```

## Files to Inspect
- `.claude/ROADMAP_TODO.md` (link PRs to roadmap items)
- PR descriptions (via gh pr view)

## Proof Needed
- Classification based on actual PR content, not assumption
- Duplicate detection based on matching branch names or titles
- Stale = no updates in 7+ days AND not linked to active roadmap item

## Fail Conditions
- Closing a PR without confirming it's truly stale/superseded
- Classifying without reading the PR description
- Missing a duplicate PR
- gh credentials missing but claiming PRs were closed

## Next Handoff
- merge-ready PRs → `consensus-gates` for merge approval
- needs-update PRs → `workflow-router` for re-planning
- stale/superseded PRs → `cleanup-until-done` for closure
- close-if-permitted → require gh credentials; if missing, add to blocked-items report

## What to Cache
- PR classifications (valid until PR state changes)

## What to Update on Success
- PR descriptions updated if stale
- Roadmap links added to unlinked PRs

## What to Update on Failure
- Blocked items report with exact credential requirements

## Token Thrift Rules
- Use --json flag with gh to get structured data
- Don't read full PR diffs unless classification is ambiguous
- Batch gh API calls

## When NOT to Use
- No open PRs exist
- gh CLI not available and no GitHub credentials
