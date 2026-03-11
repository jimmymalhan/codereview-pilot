---
name: pr-summary
description: Summarize a pull request with live diff and comments. Uses gh CLI. Run in forked Explore agent for isolation.
context: fork
agent: Explore
allowed-tools: Bash(gh *)
disable-model-invocation: false
argument-hint: [PR number or branch]
---

# PR Summary Skill

**Purpose**: Fetch live PR data (diff, comments) and summarize. Runs in isolated Explore agent. Uses Claude Code `context: fork` + dynamic `!`command`` injection.

## Pull Request Context

Fetch live data (replace $ARGUMENTS with PR number or leave empty for current branch):

- PR metadata: !`gh pr view $ARGUMENTS --json title,body,state,additions,deletions,files 2>/dev/null || gh pr view --json title,body,state,additions,deletions,files 2>/dev/null || echo '{"error":"No PR"}'`
- PR diff (name-only): !`gh pr diff $ARGUMENTS --name-only 2>/dev/null || gh pr diff --name-only 2>/dev/null || echo ""`
- PR diff (sample): !`gh pr diff $ARGUMENTS 2>/dev/null | head -200 || gh pr diff 2>/dev/null | head -200 || echo ""`

## Your Task

Summarize this pull request:

1. **What changed** — Files, scope (frontend/backend/tests)
2. **Risk areas** — Breaking changes, missing tests, error handling
3. **Verification** — What to run: npm test, manual check, etc.
4. **One-line summary** — For PR title or changelog

If $ARGUMENTS is empty, use current branch: `gh pr view --web` or detect from `git branch --show-current`.

## Output

```markdown
## Summary
[One-line]

## Changes
- [List files/categories]

## Risks
- [Any]

## Verify
- [ ] npm test
- [ ] ...
```

## Integration

- **pr-push-merge**: Invoke before "Create PR" to draft description
- **five-agent-verification**: Summary as input to reviewers
- **idea-to-production**: Phase 5 handoff context
