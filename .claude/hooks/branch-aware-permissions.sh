#!/bin/bash

# Branch-Aware Permissions Hook
# ==============================
#
# Purpose: Dynamically determine permission mode based on current git branch
# - Feature branches: Auto-allow safe local work
# - Main/master: Ask for approval on state-changing operations
#
# Called by Claude Code when checking permissions
# Used in: .claude/settings.local.json hooks configuration
#
# Exit codes:
#   0 = Allow (or pass decision to normal rules)
#   1 = Deny/Ask for approval
#   2 = Error (fall back to normal rules)

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

if [ -z "$BRANCH" ]; then
  # Not in a git repo, use default mode
  exit 2
fi

# Extract the tool and command from arguments
# Arguments come in format: "TOOL(command)" e.g., "Bash(npm test:*)"
FULL_ARGS="$*"
TOOL="${FULL_ARGS%(*}"
COMMAND="${FULL_ARGS#*\(}"
COMMAND="${COMMAND%\)}"

# Function to check if command matches pattern
matches_pattern() {
  local pattern="$1"
  local command="$2"

  # Simple wildcard matching
  case "$command" in
    $pattern) return 0 ;;
    *) return 1 ;;
  esac
}

# Function: Is this the auto-allowed feature branch?
is_feature_branch() {
  # Auto-execute is ONLY allowed on the specific feature branch requested by the user.
  # All other branches (including staging, develop, hotfix, release) are treated as protected.
  [[ "$BRANCH" == "feature/integration-website" ]]
}

# Function: Check if command is safe for auto-allow
is_safe_command() {
  local tool="$1"
  local cmd="$2"

  # Only consider Bash and Edit tools
  [[ "$tool" != "Bash" && "$tool" != "Edit" ]] && return 1

  # Safe bash commands for feature branches
  if [[ "$tool" == "Bash" ]]; then
    # Safe reads
    [[ "$cmd" == *"git status"* ]] && return 0
    [[ "$cmd" == *"git diff"* ]] && return 0
    [[ "$cmd" == *"git log"* ]] && return 0
    [[ "$cmd" == *"git branch"* ]] && return 0
    [[ "$cmd" == *"npm test"* ]] && return 0
    [[ "$cmd" == *"npm run"* ]] && return 0
    [[ "$cmd" == *"npm install"* ]] && return 0
    [[ "$cmd" == *"npm ci"* ]] && return 0
    [[ "$cmd" == *"node"* ]] && return 0
    [[ "$cmd" == *"grep"* ]] && return 0
    [[ "$cmd" == *"ls"* ]] && return 0
    [[ "$cmd" == *"find"* ]] && return 0
    [[ "$cmd" == *"cat"* ]] && return 0
    [[ "$cmd" == *"head"* ]] && return 0
    [[ "$cmd" == *"tail"* ]] && return 0
    [[ "$cmd" == *"wc"* ]] && return 0
    [[ "$cmd" == *"pwd"* ]] && return 0
    [[ "$cmd" == *"echo"* ]] && return 0

    # Safe git local changes
    [[ "$cmd" == *"git add"* ]] && return 0
    [[ "$cmd" == *"git commit"* ]] && return 0
    [[ "$cmd" == *"git checkout"* && "$cmd" != *"main"* && "$cmd" != *"master"* ]] && return 0

    # Linting and format checking
    [[ "$cmd" == *"prettier"* ]] && return 0
    [[ "$cmd" == *"eslint"* ]] && return 0
    [[ "$cmd" == *"jest"* ]] && return 0
  fi

  # Safe file edits
  if [[ "$tool" == "Edit" ]]; then
    # Allow src/ edits on feature branches
    [[ "$cmd" == *"src/"* ]] && return 0
    # Allow tests/ edits
    [[ "$cmd" == *"tests/"* ]] && return 0
    # Allow docs/ edits
    [[ "$cmd" == *"docs/"* ]] && return 0
    # Allow .claude/rules/ edits (our standards)
    [[ "$cmd" == *".claude/rules/"* ]] && return 0
  fi

  return 1
}

# Function: Check if command is dangerous (always ask)
is_dangerous_command() {
  local tool="$1"
  local cmd="$2"

  [[ "$tool" != "Bash" ]] && return 1

  # Always dangerous (on any branch)
  [[ "$cmd" == *"git push"* ]] && return 0
  [[ "$cmd" == *"git reset --hard"* ]] && return 0
  [[ "$cmd" == *"git rebase"* ]] && return 0
  [[ "$cmd" == *"git merge main"* ]] && return 0
  [[ "$cmd" == *"git merge master"* ]] && return 0
  [[ "$cmd" == *"git cherry-pick"* ]] && return 0
  [[ "$cmd" == *"rm -rf"* ]] && return 0
  [[ "$cmd" == *"git clean -f"* ]] && return 0

  # Secrets and credentials (any access via Bash is treated as dangerous)
  [[ "$cmd" == *".env"* ]] && return 0
  [[ "$cmd" == *"secrets"* ]] && return 0
  [[ "$cmd" == *"credentials"* ]] && return 0
  [[ "$cmd" == *"auth"* ]] && return 0
  [[ "$cmd" == *"token"* ]] && return 0
  [[ "$cmd" == *"key"* ]] && return 0
  [[ "$cmd" == *"password"* ]] && return 0

  # Production/deployment
  [[ "$cmd" == *"deploy"* ]] && return 0
  [[ "$cmd" == *"production"* ]] && return 0
  [[ "$cmd" == *"release"* ]] && return 0
  [[ "$cmd" == *"docker push"* ]] && return 0
  [[ "$cmd" == *"kubectl"* ]] && return 0
  [[ "$cmd" == *"npm publish"* ]] && return 0

  return 1
}

# Main logic
if is_feature_branch; then
  # FEATURE BRANCH (feature/integration-website ONLY):
  # Auto-allow all commands for aggressive execution on this branch.
  # All other branches, including staging/develop/hotfix, follow the protected-path logic below.
  exit 0
else
  # PROTECTED BRANCH (main, master, staging, develop, etc.):
  # Block dangerous commands unconditionally.
  if is_dangerous_command "$TOOL" "$COMMAND"; then
    exit 1
  fi

  # Allow commands that pass the safe-command whitelist (read-only tools,
  # npm test/run, linting, safe git ops, and doc/src/test file edits).
  if is_safe_command "$TOOL" "$COMMAND"; then
    exit 0
  fi

  # Everything else on a protected branch: ask for approval.
  exit 1
fi
