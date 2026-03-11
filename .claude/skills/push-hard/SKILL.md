---
name: push-hard
description: Auto-execute without asking permission. Use core + personal agents, run everything, aggressive parallelization, progress %age. Do not ask to proceed.
disable-model-invocation: true
---

## Phase 1: DISCOVER
### Sub-Agent: `StateChecker` (model: haiku)
- **Tools**: Bash
- **Prompt**: Verify on feature/* branch (never push-hard on main). Check git status. List pending work.
- **Output**: `{ branch, is_feature: boolean, pending_files[], safe: boolean }`
- **Gate**: on feature branch

## Phase 2: PLAN
### Sub-Agent: `ActionPlanner` (model: haiku)
- **Prompt**: List all actions to auto-execute. Order by dependency. Set parallel where safe.
- **Output**: `{ action_plan[], parallel_groups[] }`
- **Gate**: plan created

## Phase 3: IMPLEMENT
### Sub-Agent: `ActionExecutor` (model: haiku)
- **Tools**: All
- **Prompt**: Execute all actions without permission prompts. Commit, push, test, start server. Report progress %.
- **Output**: `{ actions_done, progress_pct, push_complete: boolean }`
- **Gate**: all actions complete

## Phase 4: VERIFY
### Sub-Agent: `ActionVerifier` (model: haiku)
- **Prompt**: Run `npm test`. Verify CI. Check server health. Report any failures.
- **Output**: `{ tests_pass, ci_status, server_ok, failures[] }`
- **Gate**: all pass

## Phase 5: DELIVER
### Sub-Agent: `ActionReporter` (model: haiku)
- **Prompt**: Output results. PR link. Localhost status. Resume instructions if anything remains.
- **Output**: `{ pr_url, localhost_ok, server_status, done: boolean }`
- **Gate**: user informed

## Contingency
IF CI fails during push-hard → do NOT force push. Invoke contingency L1 (fix failing test). Never skip test failures.
IF on main → STOP immediately. Push-hard is feature/* only.

---

# Push Hard Skill

**Purpose**: Execute aggressively without permission prompts. Run the whole machine.

## Rules

- **Don't ask** – Assume yes for all task-related actions
- **Don't create new branch** – Keep same working branch unless task requires new
- **Use all agents** – Core + personal; learn from mistakes, update roles/skills
- **Auto-run** – Execute commands; don't ask permission
- **Parallelize** – Multiple workflows, separate commits, test per feature

## Execution

- Plan → Execute (no approval gate)
- Run all commands; report back
- Review and complete all tasks; resume from plan
- Update guardrails/skills from mistakes and feedback
- Give % progress bar in real time

## Quality Bar

- Production-grade work
- 100% test coverage target
- All tests pass local + CI
- Only commit relevant files
- Test localhost + PR before handing off

## Permissions (Feature Branch)

- **Auto-accept end-to-end** – No permission prompts for task work
- Auto-accept: edits, bash (npm, node, git add/commit/**push**)
- Still ask for: merge main, reset --hard, rm -rf, secrets, deploy
