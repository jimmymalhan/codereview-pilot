---
name: pr-comments-live
description: Post comments to the PR as work happens. Every commit, every update, every change—add a PR comment at the same time. Never work in silence. Use when committing, pushing, or updating PRs.
---

# PR Comments Live (Parallel to Work)

**Purpose**: Comments appear on the PR as work happens. No silent updates. Every commit, change, or update → post a PR comment at the same time. Visibility = comments in parallel with code.

---

## Rule (HARD)

- **Comments in parallel** — When creating/updating PRs, commits, or changes: post a PR comment at the same time. Not after. Not in batch. **As you do it.**
- **Every material change** → PR comment: "Committing X", "Pushed fix for Y", "Added Z to skill set"
- **Never work in silence** — If you're doing work that affects a PR, comment on the PR. User must see it happening.

---

## When to Comment

| Action | Comment |
|--------|---------|
| Commit | `gh pr comment --body "Committed: <message>"` |
| Push | `gh pr comment --body "Pushed: <summary>"` |
| **Ten-pass (each pass)** | `GH_TOKEN=${GH_TOKEN_<AGENT>:-$GH_TOKEN} gh pr comment --body "**[Agent]** PASS/BLOCK — ..."` (per-agent identity; see `github-agent-identities`) |
| Add/update skill | `gh pr comment --body "Skill update: <skill-name> — <what changed>"` |
| Fix/test | `gh pr comment --body "Fix: <brief>. Tests: pass/fail."` |
| Phase complete | `gh pr comment --body "Phase N done: <summary>"` |

---

## Command

```bash
# After commit, push, or any update:
gh pr comment --body "Committed: feat(skills): X. Tests pass."
```

---

## Parallel with Work

- **Not**: Do all work → then comment once at the end
- **Yes**: Commit → comment "Committed X" → Push → comment "Pushed" → Update skill → comment "Skill Y updated" — all in parallel flow

---

## Integration

- **github-agent-identities**: Each agent uses its own GH token → PR shows multiple contributors. See `.claude/skills/github-agent-identities/SKILL.md`.
- **ten-pass-verification**: Each of 10 passes MUST post with agent-specific token. Merge blocked until all 10 comment.
- **five-agent-verification**: Each of 5 agents MUST post with its token. Part of ten-pass. Convince agents in PR threads before merge.
- **pr-push-merge**: Each phase outputs to PR via comment
- **user-feedback-to-skillset**: When updating skill from feedback → PR comment
- **repository-audit-to-skillset**: When audit finds something → PR comment
