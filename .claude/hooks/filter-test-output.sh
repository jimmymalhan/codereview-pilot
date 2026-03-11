#!/bin/bash
# Filter test output to show only failures. Reduces token cost when running tests.
# Optional: Enable in settings.json PreToolUse for Bash. See Claude Code costs doc.
# Input: JSON from stdin with tool_input.command
# Output: {} = no change; hookSpecificOutput = replace command with filtered version

input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$cmd" ]]; then
  echo '{}'
  exit 0
fi

# If running tests, show failures or brief success (saves tokens)
if [[ "$cmd" =~ ^(npm test|npm run test|npx jest|npx vitest) ]]; then
  filtered="$cmd 2>&1 | (grep -A 8 -E '(FAIL|✕|Error:|AssertionError)' | head -80) || tail -3"
  jq -n --arg c "$filtered" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "allow", updatedInput: {command: $c}}}' 2>/dev/null || echo '{}'
else
  echo '{}'
fi
exit 0
