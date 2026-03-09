# Claude Debug Copilot

Most AI debugging workflows are polished fiction dressed up as confidence. Claude Debug Copilot takes the opposite path: evidence first, explanation second, ego last.

This tool turns Claude into a repo-aware debugging copilot that retrieves concrete evidence from logs, schema, code, and timestamps before making any claims. It challenges its own first answer through adversarial review and rejects unsupported assertions.

Built for backend engineers and on-call SREs tired of elegant hallucinations. Read the full article: [I Made Claude Prove Its Hallucination](https://newsletter.systemdesignlaws.xyz/p/i-made-claude-prove-its-hallucination)

## The Problem

In real systems, the expensive mistake is rarely a missing prompt. It's trusting a model that *sounds* right before it *is* right.

```text
Traditional AI Debugging:
question → answer (confident but often wrong)

Claude Debug Copilot:
retrieve → challenge → verify → explain (rigorous and checkable)
```

## How It Works

A four-agent pipeline that enforces evidence-first methodology:

1. **Router** - Classifies the failure type (schema drift, write conflict, stale read, bad deploy, auth failure, dependency break)
2. **Retriever** - Pulls exact evidence: file:line citations, log timestamps, schema definitions, payload fields
3. **Skeptic** - Generates a competing explanation from a different failure family to pressure the first diagnosis
4. **Verifier** - Blocks any claim not backed by retrieved evidence, requires root cause + fix plan + rollback + tests

**Output Contract:**
```json
{
  "root_cause": "string (required, backed by evidence)",
  "evidence": ["file:line", "log snippet", "timestamp"],
  "fix_plan": "string (exact code change)",
  "rollback_plan": "string (how to reverse)",
  "tests": ["test case 1", "test case 2"],
  "confidence": 0.85
}
```

## Safety Constraints

The tool enforces five non-negotiable rules (see `CLAUDE.md`):

- **never invent fields, tables, APIs, regions, or files** - everything must be retrieved
- **retrieve before explaining** - no guessing
- **verifier blocks unsupported nouns** - claims must cite evidence
- **skeptic must produce a materially different theory** - not just shade on the first answer
- **no edits until the plan is approved** - human review gate

## Setup

**Requirements:**
- Node.js 18+
- Anthropic API key (`ANTHROPIC_API_KEY` env var)
- Claude Code CLI (for using agent definitions)

**Installation:**
```bash
npm install
export ANTHROPIC_API_KEY=your-key-here
```

## Usage

### With Claude Code CLI (Recommended)

Use the agent definitions directly:
```bash
# Diagnose an incident
echo "Your incident description..." | claude --agent router

# Gather evidence
echo "Incident + router classification..." | claude --agent retriever

# Challenge the diagnosis
echo "Router output..." | claude --agent skeptic

# Verify claims
echo "All prior outputs..." | claude --agent verifier
```

### Standalone Demo

Run the verifier stage as a demo:
```bash
node src/run.js
```

This shows the verifier rejecting unsupported claims in JSON format.

## Repository Structure

```
.claude/
├── agents/
│   ├── router.md         # Failure classifier
│   ├── retriever.md      # Evidence gatherer
│   ├── skeptic.md        # Competing theory generator
│   └── verifier.md       # Claim validator + approval gate
└── hooks/
    └── check-edits.sh    # Prevents .env and lock file commits

src/
└── run.js               # Demo entry point (verifier only)

CLAUDE.md               # Project rules and output contracts
package.json            # Dependencies: @anthropic-ai/sdk, dotenv
README.md               # This file
```

## Files Committed vs. Ignored

**Committed (version controlled):**
- `.claude/agents/*` - Agent definitions
- `.claude/hooks/*` - Safety mechanisms
- `CLAUDE.md` - Project rules
- `src/run.js` - Demo code
- `package.json` and `package-lock.json`
- `README.md`

**Ignored (never committed):**
- `.env` - API keys and secrets
- `logs/`, `incidents/`, `data/` - Sample/test data
- `node_modules/` - Dependencies

## Guardrails

This repo enforces strict safety constraints:

- **Pre-commit hook** blocks edits to `.env`, `package-lock.json`, and `pnpm-lock.yaml`
- **CLAUDE.md rules** are non-negotiable and inherited by all agents
- **Agent definitions** are read-only during normal usage; changes require code review
- **Evidence verification** mandatory before any claim is approved


## Paperclip Integration Guide

Claude Debug Copilot integrates with **Paperclip AI** (https://github.com/paperclipai/paperclip), an orchestration platform that adds:
- **Task management** - Track debugging tasks from incident to resolution
- **Approval gates** - Require human review before deploying fixes
- **Budget control** - Enforce token limits per agent and organization
- **Audit trails** - Immutable logs of every decision and action
- **Security enforcement** - Deny-by-default file access, input validation, PII sanitization

### Quick Start (3 steps)

**Step 1: Initialize Paperclip**
```javascript
import { PaperclipClient } from './src/paperclip/paperclip-client.js';

const paperclip = new PaperclipClient();
await paperclip.initialize();
```

**Step 2: Submit a debugging task**
```javascript
const task = await paperclip.submitTask({
  type: 'debug',
  description: 'Database queries timing out in production at 2:45 UTC',
  evidence: ['error.log:1-50', 'schema.sql:table-indexes', 'metrics.json:cpu-usage']
});

console.log(`Task created: ${task.taskId}`);
```

**Step 3: Run the 4-agent pipeline**
```javascript
// Claude's 4-agent pipeline automatically routes through:
// Router → Retriever → Skeptic → Verifier
const verified = await paperclip.invokeAgent('verifier', task.taskId, ...);

// Result includes: root cause, evidence citations, fix plan, rollback, tests
console.log(verified.result);
```

### Real-World Workflow

Here's how Paperclip handles a real incident:

```javascript
// 1. Incident reported - submit as task
const incident = await paperclip.submitTask({
  type: 'debug',
  description: 'API returning 503 errors, ~20% failure rate',
  evidence: [
    'logs/api.log:2024-03-09 15:30-15:45',
    'src/db/connection-pool.js',
    'deployment/release-notes.md:v2.3.1'
  ]
});

// 2. Router classifies the failure type
const classified = await paperclip.invokeAgent('router', incident.taskId, incident);
// → "write_conflict" in transaction handling

// 3. Retriever pulls exact evidence
const evidence = await paperclip.invokeAgent('retriever', incident.taskId, classified);
// → file:line citations, log timestamps, schema definitions

// 4. Skeptic challenges the diagnosis
const challenge = await paperclip.invokeAgent('skeptic', incident.taskId, evidence);
// → Alternative theory: memory leak, not transaction conflict

// 5. Verifier validates the best theory
const verified = await paperclip.invokeAgent('verifier', incident.taskId, challenge);
// → Rejects both theories with evidence, identifies true root cause

// 6. Human approval required
const auditLog = await paperclip.queryAuditTrail({ taskId: incident.taskId });
// Review plan in audit trail, then:
await paperclip.updateTaskStatus(incident.taskId, 'approved');

// 7. Execute with budget enforcement + rollback plan
const budget = await paperclip.getBudgetStatus();
if (budget.available > 0) {
  // Deploy fix with pre-verified rollback procedure
  // All changes tracked in immutable audit trail
}

// 8. Complete audit trail
const final = await paperclip.queryAuditTrail({
  taskId: incident.taskId,
  event: 'task_completed'
});
// Contains: task_created → agent_invocations → approval_decision → execution → completion
```

### Common Tasks

#### Diagnose an incident
```javascript
const task = await paperclip.submitTask({
  type: 'debug',
  description: 'Database connections exhausted',
  evidence: ['connection-pool.log', 'database.yml', 'deployment-log']
});

// Pipeline runs automatically; check results:
const result = await paperclip.getTask(task.taskId);
```

#### Verify a fix before deployment
```javascript
const fixReview = await paperclip.submitTask({
  type: 'verify',
  description: 'Review connection pool fix in PR #1234',
  evidence: ['src/db/pool.js:50-150', 'tests/pool.test.js', 'CHANGELOG.md']
});

// Verifier validates fix against root cause
const approval = await paperclip.getTask(fixReview.taskId);
```

#### Track budget usage
```javascript
const status = await paperclip.getBudgetStatus();
console.log(`Daily limit: ${status.limit} tokens`);
console.log(`Used today: ${status.orgDaily} tokens`);
console.log(`Per-agent limit: ${status.agentLimit}`);
console.log(`Concurrent agents: ${status.concurrentAgents}`);
```

#### Query the audit trail
```javascript
const audit = await paperclip.queryAuditTrail({
  taskId: 'task-123',
  since: new Date(Date.now() - 3600000) // last hour
});

// Audit trail includes every action with timestamp:
// task_created, agent_invocation, approval_granted, execution, escalation, rollback
```

### Integration Options

**Option 1: Development (Local)**
```javascript
import { PaperclipClient } from './src/paperclip/paperclip-client.js';
// Uses local orchestration modules: src/paperclip/* (14 modules, fully tested)
// No external dependencies, all operations run locally
```

**Option 2: Production (Official Package)**
```bash
npm install @paperclipai/orchestration-security
```

```javascript
import { PaperclipClient } from '@paperclipai/orchestration-security';
// Maintained by Paperclip team, recommended for production deployments
```

### Architecture

Paperclip provides 6 core capabilities integrated into Claude Debug Copilot:

| Capability | How It Works | Your Benefit |
|---|---|---|
| **Task Management** | Create, track, route tasks through agent pipeline | Central hub for all debugging work |
| **Approval Gates** | 8-state workflow enforces human review | No AI decisions deployed without approval |
| **Budget Control** | Token limits per agent, org, and incident | Control costs, prevent runaway tokens |
| **Audit Trails** | Immutable logs of every decision and action | Complete transparency for compliance |
| **Security** | Deny-by-default access, input validation, sanitization | Prevents credential leaks and injection attacks |
| **Reliability** | Exponential backoff retry logic, health monitoring, graceful degradation | Handle failures without manual intervention |

### Testing the Integration

```bash
# Run full test suite (319 tests, all passing, 89.87% coverage)
npm test

# Test just Paperclip modules
npm test -- tests/paperclip-client.test.js

# Watch mode for development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Next Steps

1. **Start diagnosing** - Use `paperclip.submitTask()` to handle your next incident
2. **Integrate with your workflow** - Call Paperclip from your incident management system
3. **Go production** - Switch to official package when ready (`@paperclipai/orchestration-security`)
4. **Extend safely** - Add custom agents while respecting approval gates and budgets

## Philosophy

This is not another prompt wrapper. It's a tighter debugging loop for engineers who want:

- Fewer vibes, more evidence
- Fewer invented facts, more citations
- Fewer confident conclusions, more verified claims

**If a model cannot survive evidence, contradiction, and verification, it doesn't get to call itself useful.**

## Contributing

Issues and PRs welcome. Ensure:
- Agent definitions preserve all rules from `CLAUDE.md`
- Evidence is cited with file:line format
- Output follows the contract (root cause, evidence, fix, rollback, tests, confidence)
- No changes to `.env`, `src/run.js`, or `CLAUDE.md` without board approval

## Technical Documentation

- `CLAUDE.md` - Non-negotiable project rules and output contracts

## License

MIT