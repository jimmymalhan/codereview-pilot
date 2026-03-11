---
name: parallel-execution
description: Do multiple things at once. Not one thing at a time. Run tests while committing; post PR comments while pushing; update skills while making code changes. Use when executing multi-step work.
---

# Parallel Execution (Not Sequential)

**Purpose**: Do everything in parallel. Not one thing at a time. User wants to see multiple streams of progress simultaneously.

---

## Rule (HARD)

- **Parallel, not sequential** — When possible, run multiple actions concurrently. Tests + commit. Push + PR comment. Skill update + code change. All at the same time.
- **Never block on single-thread** — If step B doesn't depend on step A, run A and B together.
- **User sees everything** — PR comments, commits, skill updates, test runs—happen together. Visibility.

---

## Parallel Patterns

| Instead of | Do |
|------------|-----|
| Commit → wait → push → wait → comment | Commit + push + PR comment in same turn |
| Run test → wait → fix → wait → commit | Run test + start fix; commit when both done |
| Update skill → then update code | Update skill and code in same batch |
| Phase 1 → Phase 2 → Phase 3 (strict order) | Phase 1 + Phase 2 sub-tasks that don't depend on 1 |
| Ten-pass: run 1, then 2, then 3… | Ten-pass: run passes 1–5 in parallel, 6+7+10 in parallel, 8+9 together |
| Wait for all critiques sequentially | All critiques run in parallel — merge promptly when done |

---

## PR Comments + Work

- **As you create updates** → Post PR comment
- **As you create PRs** → Post comment on PR describing what's in it
- **As you make changes** → Comment on PR: "Updating X..."
- **Same time** — Comment and change happen together

---

## Integration

- **pr-push-merge**: Phases can overlap where dependencies allow; each phase posts PR comment
- **ten-pass-verification**: All 10 passes run in parallel — don't leave PRs hanging
- **pr-comments-live**: Comments posted in parallel with every action
- **repository-audit-to-skillset**: Audit + skill updates in parallel
