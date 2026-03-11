# Roadmap to Execution

## Purpose
Convert roadmap items into executable tasks. Each task has: owner role, assigned skill/agent, proof requirement, rollback path, cleanup impact, doc update requirement. Produce ordered execution plan with dependencies.

## Trigger
PLAN phase after `roadmap-auditor` completes. Also triggered when user requests implementation of roadmap items.

## Workflow Stage
PLAN (Phase 1).

## Required Inputs
- `roadmap_items`: List of roadmap items to convert (from roadmap-auditor or roadmap-1.0).
- `available_agents`: Which agents/roles are available for assignment.
- `current_state`: Output of `checkpoint-auditor` showing what is already done.

## Exact Output Format (JSON)
```json
{
  "skill": "roadmap-to-execution",
  "execution_plan": [
    {
      "task_id": "T-001",
      "roadmap_item": "LS-001: API retry logic",
      "owner_role": "backend-engineer",
      "assigned_agent": "General-Purpose",
      "assigned_skill": "backend-reliability",
      "dependencies": [],
      "proof_requirement": "npm test passes with retry tests covering 3 scenarios",
      "rollback_path": "Revert src/api-client.js to prior commit",
      "cleanup_impact": "None — new code only",
      "doc_updates": ["CHANGELOG.md", ".claude/CONFIDENCE_SCORE.md"],
      "estimated_complexity": "small|medium|large",
      "priority": 1
    }
  ],
  "dependency_graph": { "T-001": [], "T-002": ["T-001"] },
  "parallel_groups": [["T-001", "T-003"], ["T-002"]],
  "total_tasks": 5,
  "status": "ready|blocked"
}
```

## Commands to Run
- `git log --oneline -20` — What has been done recently.
- `gh issue list` — Open issues for context.
- `npm test` — Current test state baseline.

## Files to Inspect
- `.claude/skills/roadmap-1.0/SKILL.md` — Roadmap items and status.
- `.claude/CONFIDENCE_SCORE.md` — Prior task completion evidence.
- `CHANGELOG.md` — What has already shipped.
- `.claude/SKILLSETS.md` — Available skills for assignment.
- `.claude/agents/` — Available agent definitions.

## Proof Needed
- Each task has a concrete proof requirement (not vague "tests pass").
- Dependency graph is acyclic (no circular dependencies).
- Every task has a rollback path.
- All tasks assigned to a specific agent and skill.

## Fail Conditions
- Roadmap item has no clear acceptance criteria.
- Task assigned to nonexistent agent or skill.
- Circular dependency in task graph.
- No rollback path defined for a task.
- Task too large (must be broken into small commits).

## Next Handoff
Hand off execution plan to `dag-executor` for parallel execution. Individual tasks go to assigned agents via `agent-task-assignment`.

## What to Cache
- Execution plan for current session (avoid re-planning completed items).
- Dependency graph for rebase/reorder decisions.

## What to Update on Success
- `.claude/CONFIDENCE_SCORE.md` — Plan created with task count and assignments.
- Session context — Execution plan ready for `dag-executor`.

## What to Update on Failure
- Flag blocked roadmap items with `[BLOCKED]` and reason.
- Create follow-up to resolve blocking issues before re-planning.

## Token Thrift Rules
- Read only roadmap items that are not yet marked complete.
- Use `grep` to check CHANGELOG for already-shipped items.
- Do not re-plan tasks that have passing proof in CONFIDENCE_SCORE.

## When NOT to Use
- Single ad-hoc task (no roadmap context needed).
- Bug fix with no roadmap association.
- When `plan-and-execute` skill handles the task directly.
