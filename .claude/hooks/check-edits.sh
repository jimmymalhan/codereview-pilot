#!/bin/bash

# Hook: check-edits.sh
# Purpose: Verify code changes match approved plan before commit
# Triggers: Before git commit (via settings.json hook)

set -e

echo "🔍 Verifying code changes match plan..."

# Get staged changes
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  echo "✓ No staged changes to verify"
  exit 0
fi

# Check: Rules can be updated anytime
RULE_CHANGES=$(echo "$STAGED_FILES" | grep -E "^\.claude/rules/" || true)
if [ ! -z "$RULE_CHANGES" ]; then
  echo "✓ Rules updated (allowed)"
fi

# Check: Test files included if code changed
CODE_CHANGES=$(echo "$STAGED_FILES" | grep -E "^src/" | grep -v "\.test\.js$" || true)
TEST_CHANGES=$(echo "$STAGED_FILES" | grep -E "\.test\.js$" || true)

if [ ! -z "$CODE_CHANGES" ] && [ -z "$TEST_CHANGES" ]; then
  echo "⚠️  Warning: Code changes without test changes"
fi

# Check: CHANGELOG.md updated if code/docs changed
DOC_CHANGES=$(echo "$STAGED_FILES" | grep -E "^\.claude/" || true)
CHANGELOG_CHANGED=$(echo "$STAGED_FILES" | grep -E "CHANGELOG.md" || true)

if [ ! -z "$CODE_CHANGES" ] || [ ! -z "$DOC_CHANGES" ]; then
  if [ -z "$CHANGELOG_CHANGED" ]; then
    echo "⚠️  Warning: Changes without CHANGELOG.md update"
  fi
fi

# Check: CONFIDENCE_SCORE.md updated if code changed
if [ ! -z "$CODE_CHANGES" ]; then
  CONFIDENCE_CHANGED=$(echo "$STAGED_FILES" | grep -E "CONFIDENCE_SCORE.md" || true)
  if [ -z "$CONFIDENCE_CHANGED" ]; then
    echo "⚠️  Warning: Code changes without CONFIDENCE_SCORE.md update"
  fi
fi

echo "✓ Edit verification complete"
exit 0
