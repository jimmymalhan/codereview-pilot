#!/usr/bin/env bash
set -euo pipefail
input="$(cat)"
file="$(echo "$input" | jq -r '.tool_input.file_path // empty')"
if [[ "$file" == *.env || "$file" == *package-lock.json || "$file" == *pnpm-lock.yaml ]]; then
  echo "Blocked protected file: $file" >&2
  exit 2
fi
exit 0
