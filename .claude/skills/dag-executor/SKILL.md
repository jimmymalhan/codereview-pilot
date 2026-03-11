---
name: dag-executor
description: Dependency-ordered task graph. Run tasks in parallel when independent. Maximize throughput.
---

# DAG Executor Skill

**Principle**: Tasks have dependencies. Build a DAG. Run in topological order. Parallelize independents.

## Input

```json
{
  "tasks": [
    {"id": "A", "deps": [], "run": "..."},
    {"id": "B", "deps": ["A"], "run": "..."},
    {"id": "C", "deps": ["A"], "run": "..."},
    {"id": "D", "deps": ["B", "C"], "run": "..."}
  ]
}
```

## Execution

- **Level 0**: A (no deps)
- **Level 1**: B, C (parallel—both depend only on A)
- **Level 2**: D (after B and C)
- **Max parallel**: Configurable (e.g., 5)

## Integration

- **plan-and-execute**: Checklist items with dependencies → DAG
- **multi-pr-coordinator**: PRs as nodes; base first, dependents parallel when possible
- **e2e-orchestrator**: Phases as DAG; subagents within phase parallel

## Rules

- No cycles. Validate DAG before run.
- On task failure: stop dependents; optionally retry failed task
- Output: `{ completed[], failed[], skipped_because_failed[] }`
