# Workflow Router

## Purpose
Top-level workflow controller that routes all repo activity through 4 phases: DISCOVER → PLAN → IMPLEMENT → VERIFY. Every action in the repo must pass through this router. Nothing is standalone.

## Trigger
- Session start
- User gives any project instruction
- `run-the-business` or `plan-and-execute` invoked
- New roadmap item added
- PR merged or closed
- Test failure detected
- Skill drift detected

## Workflow Stage
**Phase 0 (Meta)** — Controls all other phases. This skill owns the workflow itself.

## Required Inputs
- Current repo state (git status, branch, recent commits)
- Roadmap state (ROADMAP_TODO.md, checkpoints, milestones)
- Open PR inventory
- Active branch inventory
- Test results (last npm test output)
- CONFIDENCE_SCORE.md current state

## Exact Output Format
```json
{
  "phase": "DISCOVER | PLAN | IMPLEMENT | VERIFY",
  "workers": [
    { "name": "WorkerName", "skill": "skill-name", "task": "description", "inputs": [], "expected_output": "format" }
  ],
  "dependencies": [
    { "blocked": "task-B", "waiting_for": "task-A" }
  ],
  "next_phase": "PLAN | IMPLEMENT | VERIFY | DONE",
  "blockers": [],
  "risks": []
}
```

## Commands to Run
```bash
git status
git branch -a
git log --oneline -10
npm test 2>&1 | tail -20
```

## Files to Inspect
- `.claude/ROADMAP_TODO.md`
- `.claude/CONFIDENCE_SCORE.md`
- `.claude/SKILLSETS.md`
- `README.md`
- `CHANGELOG.md`
- `.github/PROJECT_1.0.0_CHECKPOINTS.md`

## Proof Needed
- Worker assignments are complete (no task unassigned)
- Each worker has clear input and expected output
- Dependencies are acyclic (no circular waits)
- Phase transition criteria are explicit

## Fail Conditions
- Worker spawned without clear task description
- Recursive agent chains (worker spawning workers spawning workers)
- More than 10 workers in a single phase
- Phase transition without verifying previous phase outputs
- Task left unassigned

## Next Handoff
- DISCOVER phase → hand off to `repo-intelligence`, `roadmap-auditor`, `pr-triage`, `branch-hygiene`
- PLAN phase → hand off to `roadmap-to-execution`, `test-synthesizer`
- IMPLEMENT phase → hand off to `backend-engineer`, `frontend-engineer`, `cleanup-until-done`
- VERIFY phase → hand off to `end-to-end-verifier`, `milestone-checkpoint-sync`

## What to Cache
- Last routing decision (avoid re-routing same session)
- Worker results from completed phases
- Blocked items list

## What to Update on Success
- Master to-do list (mark completed items)
- `.claude/CONFIDENCE_SCORE.md` with phase completion evidence
- `CHANGELOG.md` if deliverable produced

## What to Update on Failure
- Master to-do list (mark blocked items with reason)
- `.claude/CONFIDENCE_SCORE.md` (lower confidence, add [UNKNOWN])
- Route failure to `failure-taxonomy` skill

## Token Thrift Rules
- Do NOT load all skills at session start; load only phase-relevant skills
- Use Haiku for DISCOVER workers; Sonnet for PLAN; Haiku for IMPLEMENT
- Batch file reads; never read same file twice in one phase
- Workers return structured output, not essays

## When NOT to Use
- Single-file edit with no workflow impact
- Reading a file to answer a question
- User explicitly says "just do X, no workflow"

## Architecture: No Recursive Nesting
```
WorkflowRouter (1 instance)
  ├── Phase 1 workers (5-10, flat)
  │   └── Each returns result to WorkflowRouter
  ├── Phase 2 workers (5-10, flat)
  │   └── Each returns result to WorkflowRouter
  ├── Phase 3 workers (5-10, flat)
  │   └── Each returns result to WorkflowRouter
  └── Phase 4 workers (5-10, flat)
      └── Each returns result to WorkflowRouter
```
Workers NEVER spawn sub-workers. Workers return results. Router decides next action.
