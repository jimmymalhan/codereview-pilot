#!/bin/bash

# Commit Precheck Hook
# Purpose: BLOCK commits with task breakdowns, progress docs, implementation reports.
# Run before every git commit. Exit 1 = BLOCK (do not commit).

set -e

STAGED=$(git diff --cached --name-only 2>/dev/null || true)
[ -z "$STAGED" ] && exit 0

# Forbidden patterns (grep -E alternation)
FORBIDDEN='TASK_BREAKDOWN|FRONTEND_TASK_BREAKDOWN\.csv|PROGRESS_DASHBOARD|IMPLEMENTATION_|REFACTORING_|^E1-01_|^PHASE_[0-9]|_AUDIT_REPORT\.md|^LUXURY_UI_FEATURES\.md|^UI_QA_TEST_SUITE\.md|^data/|^incidents/|^logs/|^reference/|^test-output\.log|/test-feedback\.log|^\.vscode/'

VIOLATORS=$(echo "$STAGED" | grep -E "$FORBIDDEN" || true)
if [ -n "$VIOLATORS" ]; then
  echo "❌ COMMIT BLOCKED: Forbidden files staged. Remove before committing."
  echo "$VIOLATORS" | while read f; do echo "  - $f"; done
  echo "Run: git restore --staged <file>"
  exit 1
fi

exit 0
