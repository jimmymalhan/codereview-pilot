---
name: run-the-business
description: DEFAULT for project instructions. You give instructions; we run the whole business. Maximum automation—no approval gates. Invokes idea-to-production + live-watchdog. Full E2E. Agents and skills proceed automatically; never wait for user.
argument-hint: [task or instructions]
---

# Run-the-Business Skill

**Purpose**: DEFAULT mode for project instructions. Maximum automation. Zero manual steps. No approval gates. Agents and skills proceed automatically through all phases—never pause, never ask "shall I proceed", never wait for user.

**Full Authority**: User has granted authority. Commit, push, merge, PR comments—execute. Do NOT claim "requires human authorization" or "I can't commit/push/merge." Only ask when credentials are missing (GH_TOKEN, etc.). Otherwise: run. Stop for nothing.

**When to use**: ANY project instruction: "add X", "fix Y", "run the project", "implement Z", or equivalent. Assume run-the-business unless user says "plan only" or "do not execute".

---

## Default: Maximum Automation

- **auto-merge**: ON — Merge when CI green; no "merge now" required
- **ultra-automation**: ON — Full advanced stack (DAG, consensus, handoff, etc.)
- **live-watchdog**: ON — Start immediately after execute
- **Agents**: Spawn automatically; proceed through phases without pausing
- **Skills**: Execute; never wait for approval between steps

---

## First Action (Every Turn—No Wait)

**Before responding to any user message:** Run `gh pr list --state open`. For each open PR: if <10 ten-pass comments, post them. If `git status` shows uncommitted: branch, commit, push, create PR, post comments. Hook `open-prs-workflow.sh` runs on PreToolUse. Do NOT wait for user to say "work on PRs."

**Signed test agents:** When localhost responds, run `npm run test:agents` (APIUseCaseTester, UIUseCaseTester, BackendUseCaseTester, LocalhostE2ETester). Critical feedback → .claude/local/test-feedback.log. Iterate based on feedback; never wait for user to tell you what to fix.

**Market research (founder perspective):** When founder wants market-driven updates or "what features from market"—spawn MarketResearchAgent. It researches the product's market, identifies features needed, adds to plan, and implements automatically. No wait.

## Flow

1. **Invoke** `full-cycle-automation` — Branch cleanup → PR comments → Merge → Learn from mistakes → Upgrade skillset (all automatic)
2. **Invoke** `idea-to-production` — Idea → Execute → Merge (auto when CI green) → Deploy (if FULL_AUTO)
3. **Start** `live-watchdog` — Poll CI, deploy, health endpoint
4. **Invoke** `continuous-test-feedback` — Spawn APIUseCaseTester, UIUseCaseTester, BackendUseCaseTester, LocalhostE2ETester. Run `npm run test:agents` when localhost responds. Consume critical feedback. Iterate without waiting for user.
5. **On error** → `error-detector` → `fix-pr-creator` → `self-fix` → `skills-self-update` (learn) → `repository-audit-to-skillset` (upgrade)
6. **Market research** (founder-driven): Spawn MarketResearchAgent → research → features_needed → add to plan → plan-and-execute → implement automatically
7. **Project 1.0.0 incomplete** — If `grep -c ",pending," FRONTEND_TASK_BREAKDOWN.csv 2>/dev/null || echo 0` > 0: invoke `org-chart` + `org-feedback-loop` → spawn org-role agents → collect critique/pushbacks → resolve conflicts → plan-and-execute → repeat until pending = 0. CSV excluded from repo; use milestones if missing. Fully automated; no user approval

---

## Entry Points

| User Says | Action |
|-----------|--------|
| Any project instruction (add, fix, implement, run) | DEFAULT: idea-to-production + live-watchdog + auto-merge |
| "Run the project" | Same (max automation) |
| "Project instructions only" | Same |
| "Full E2E" | Same |
| "Plan only" / "do not execute" | Plan mode only; no implementation |
| "Watch and fix" | Start live-watchdog only (if already executed) |
| "Market research", "what features from market", "founder wants updates" | Spawn MarketResearchAgent → research → plan → implement automatically |

---

## Output

- Real localhost URL when server is up
- PR links when PRs created
- Error status when watchdog detects failure
- Fix PR created automatically on CI/deploy/health failure

---

## Related Skills

- `full-cycle-automation` — Branch cleanup → PR comments → Merge → Learn → Upgrade (full loop)
- `branch-cleanup` — Delete merged branches, close stale PRs (5 phases)
- `ultra-automation` — Max autonomy; ON by default when run-the-business
- `idea-to-production` — Master flow
- `live-watchdog` — Poll and detect errors
- `error-detector` — Classify error, route fix agent
- `fix-pr-creator` — Create fix branch + PR
- `self-fix` — Loop until green
- `skills-self-update` — Learn from mistakes
- `repository-audit-to-skillset` — Upgrade skills from repo evidence
- `org-chart` — 50 roles from Junior to Founder; responsibilities, critique styles, agent mapping
- `org-feedback-loop` — Spawn org roles → critique → pushbacks → resolve → implement → repeat until 1.0.0
