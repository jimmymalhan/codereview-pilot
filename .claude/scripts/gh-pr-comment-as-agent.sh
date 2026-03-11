#!/usr/bin/env bash
# Post PR comment as a specific agent (uses agent's GH token when set).
# Usage: ./gh-pr-comment-as-agent.sh <agent> <pr_number> "<body>"
# Agents: CodeReviewer, APIValidator, EvidenceReviewer, QAReviewer, Critic,
#         REVIEW_ALWAYS, REVIEW_STYLE, CI, LINT, REVIEW_PROJECT

set -e
AGENT="$1"
PR_NUMBER="$2"
BODY="$3"

if [[ -z "$AGENT" || -z "$PR_NUMBER" || -z "$BODY" ]]; then
  echo "Usage: $0 <agent> <pr_number> '<body>'"
  exit 1
fi

# Map agent name to env var (uppercase, no spaces)
case "$AGENT" in
  CodeReviewer)     VAR="GH_TOKEN_CODERREVIEWER" ;;
  APIValidator)     VAR="GH_TOKEN_APIVALIDATOR" ;;
  EvidenceReviewer) VAR="GH_TOKEN_EVIDENCE_REVIEWER" ;;
  QAReviewer)       VAR="GH_TOKEN_QA_REVIEWER" ;;
  Critic)           VAR="GH_TOKEN_CRITIC" ;;
  REVIEW_ALWAYS)    VAR="GH_TOKEN_REVIEW_ALWAYS" ;;
  REVIEW_STYLE)     VAR="GH_TOKEN_REVIEW_STYLE" ;;
  CI)               VAR="GH_TOKEN_CI" ;;
  LINT)             VAR="GH_TOKEN_LINT" ;;
  REVIEW_PROJECT)   VAR="GH_TOKEN_REVIEW_PROJECT" ;;
  *)                VAR="GH_TOKEN" ;;
esac

TOKEN="${!VAR:-$GH_TOKEN}"
if [[ -z "$TOKEN" ]]; then
  TOKEN="$GITHUB_TOKEN"
fi

GH_TOKEN="$TOKEN" gh pr comment "$PR_NUMBER" --body "$BODY"
