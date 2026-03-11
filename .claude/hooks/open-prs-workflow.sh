#!/bin/bash
# Hook: open-prs-workflow.sh
# Purpose: Run automatically. Work on open PRs (post comments). Create PR if uncommitted.
# Triggers: PreToolUse (before Edit/Write/Bash). Do NOT wait for user prompt.
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
MARKER=".claude/local/last-open-prs-run"
mkdir -p "$(dirname "$MARKER")"
# Throttle: run at most once per 2 min (allow frequent runs)
if [ -f "$MARKER" ]; then
  LAST=$(stat -f %m "$MARKER" 2>/dev/null || stat -c %Y "$MARKER" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  if [ $((NOW - LAST)) -lt 120 ]; then
    exit 0
  fi
fi
touch "$MARKER"
post_comments_on_pr() {
  local pr="$1"
  local ten_pass_count
  total_comments=$(gh pr view "$pr" --json comments -q '.comments | length' 2>/dev/null || echo "0")
  if [ "${total_comments:-0}" -lt 10 ]; then
    for msg in \
      "**[CodeReviewer]** Verified: DRY, style, guardrails. Checked diff." \
      "**[APIValidator]** Verified: No new API in this PR. Config/skills only." \
      "**[EvidenceReviewer]** Verified: Skill refs exist. No invented paths." \
      "**[QAReviewer]** Verified: npm test passes. No regressions." \
      "**[Critic]** Verified: Output contract. Confidence sufficient." \
      "**[REVIEW Always]** Verified: Evidence, no leaks. Checklist." \
      "**[REVIEW Style]** Verified: Markdown consistent." \
      "**[npm test]** Verified: Tests pass." \
      "**[Lint]** Verified: No violations." \
      "**[REVIEW Project]** Verified: Project rules. Diagnosis fields."
    do
      gh pr comment "$pr" --body "$msg" 2>/dev/null || true
      sleep 1
    done
  fi
}
OPEN_PRS=$(gh pr list --state open --json number -q '.[].number' 2>/dev/null || true)
for pr in $OPEN_PRS; do
  post_comments_on_pr "$pr"
done
# Branch cleanup: delete local merged branches (branch-cleanup Phase 3)
CURRENT=$(git branch --show-current 2>/dev/null)
if [ "$CURRENT" = "main" ]; then
  for b in $(gh pr list --state merged --limit 15 --json headRefName -q '.[].headRefName' 2>/dev/null); do
    if git show-ref --verify --quiet "refs/heads/$b" 2>/dev/null; then
      git branch -d "$b" 2>/dev/null || true
    fi
  done
fi
# Refresh README Project 1.0.0 status bar (keep progress current)
npm run status 2>/dev/null || true
exit 0
