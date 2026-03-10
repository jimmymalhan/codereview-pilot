# Deployment Guide

## Pre-Deployment Checklist

Before deploying Claude Debug Copilot to production, verify each item:

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] All 367 tests passing (`npm test`)
- [ ] Coverage thresholds met (global 60%+, critical modules 90%+)
- [ ] `ANTHROPIC_API_KEY` available in deployment environment
- [ ] No secrets in committed files (run `git log --all -p -- .env` to verify)
- [ ] Pre-commit hooks installed (`.claude/hooks/check-edits.sh`)
- [ ] CI pipeline green on target branch

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/jimmymalhan/claude-debug-copilot.git
cd claude-debug-copilot
npm install
```

### 2. Configure Environment

Create a `.env` file (never commit this file):

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Verify Installation

```bash
# Run all tests (should show 367 passed)
npm test

# Run the demo (works without API key)
node src/run.js
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for live agents) | Anthropic API key from console.anthropic.com |

### Jest Configuration

Test configuration is in `jest.config.js`:

- Test environment: Node
- ES module support via `--experimental-vm-modules`
- Coverage collected from `src/**/*.js` (excluding `src/run.js`)
- Coverage thresholds enforced per-module

### Budget Configuration

Default budget limits (configured in `BudgetEnforcer`):

| Limit | Default | Description |
|-------|---------|-------------|
| Organization daily | 10,000 | Total daily budget across all agents |
| Per-task | 100 | Maximum budget per individual task |

### Agent Definitions

Agent behavior is defined in `.claude/agents/`:

| Agent | File | Role |
|-------|------|------|
| Router | `.claude/agents/router.md` | Classifies failure type |
| Retriever | `.claude/agents/retriever.md` | Gathers evidence with file:line citations |
| Skeptic | `.claude/agents/skeptic.md` | Generates competing theory |
| Verifier | `.claude/agents/verifier.md` | Validates claims against evidence |

## Running in Production

### Programmatic Usage

```javascript
import { DebugOrchestrator } from './src/orchestrator/orchestrator-client.js';

const orchestrator = new DebugOrchestrator();
await orchestrator.initialize();

const result = await orchestrator.submitTask({
  type: 'debug',
  description: 'API returning 503 errors',
  evidence: ['logs/api.log:150-200', 'metrics/cpu.json']
});

if (result.success) {
  const diagnosis = await orchestrator.invokeAgent('verifier', result.task.taskId, result.task);
  console.log(diagnosis);
}
```

### CLI Usage

```bash
# Run the demo pipeline
node src/run.js

# Pipe incident details to an agent
echo "Database connection pool exhausted" | claude --agent router
```

### With MCP Context Providers

```javascript
import { createMcpClient } from './src/mcp/index.js';

const mcp = await createMcpClient({
  repoRoot: process.cwd(),
  logsDir: './logs',
  schemaDir: './data/schemas',
  metricsDir: './data/metrics'
});

// Fetch context from multiple sources in parallel
const context = await mcp.fetchMultiple([
  { name: 'repo', params: { path: 'src/db/' } },
  { name: 'logs', params: { pattern: 'ERROR' } },
  { name: 'schema', params: { table: 'users' } }
]);
```

## Monitoring

### Health Checks

The orchestrator provides built-in health monitoring:

```javascript
// Get orchestrator stats
const stats = orchestrator.getOrchestrationStats();
// { isInitialized, taskCount, agentStats, budgetStatus, heartbeatStatus }

// Send agent heartbeats
await orchestrator.sendHeartbeat('router', { status: 'active' });

// Query audit trail
const events = await orchestrator.queryAuditTrail({ event: 'error' });
```

### Budget Monitoring

```javascript
const budget = await orchestrator.getBudgetStatus();
// { status: 'success', budget: { orgDaily, orgReserved, ... } }
```

## Security

### Zero-Secrets Policy

- API keys stay in `.env` (never committed)
- Pre-commit hooks block `.env`, `package-lock.json`, and `pnpm-lock.yaml` commits
- Log sanitization automatically redacts credentials (API keys, bearer tokens, emails, IPs)
- File access guard enforces deny-by-default per agent role

### File Access Control

Each agent has explicit read/write permissions. The `FileAccessGuard` module enforces:

- Router and Retriever: read-only access to source and logs
- Skeptic and Verifier: read access to task outputs, write to specific output files
- No agent can read `.env` or write to `CLAUDE.md`

### Input Validation

All task inputs are validated for:
- Allowed task types (`debug`, `investigate`, `analyze`)
- Prompt injection detection (9 patterns)
- Schema conformance
- Constraint allowlist enforcement

## Troubleshooting

### Tests Failing

```bash
# Verify Node.js version (need 18+)
node --version

# Clear cache and reinstall
rm -rf node_modules
npm install
npm test
```

### ES Module Errors

All test commands must use `--experimental-vm-modules`:

```bash
# Correct
node --experimental-vm-modules node_modules/.bin/jest

# Incorrect (will fail with ES module errors)
npx jest
```

### API Key Issues

```bash
# Verify key is set
echo $ANTHROPIC_API_KEY

# Demo works without API key
node src/run.js

# Get key from: https://console.anthropic.com
export ANTHROPIC_API_KEY=sk-ant-...
```

### Coverage Threshold Failures

If coverage drops below thresholds:

1. Check `jest.config.js` for threshold values
2. Run `npm test` and review the coverage table
3. Add tests for uncovered branches in the failing module
4. Critical modules require 90%+ coverage: `approval-state-machine.js`, `budget-enforcer.js`

### Agent Not Responding

1. Verify `ANTHROPIC_API_KEY` is set
2. Check Claude Code CLI is installed: `claude --version`
3. Verify agent definitions exist: `ls .claude/agents/`
4. Check heartbeat status: `orchestrator.getOrchestrationStats().heartbeatStatus`
5. Review audit trail for errors: `orchestrator.queryAuditTrail({ event: 'error' })`

### Budget Exceeded

The orchestrator enforces per-task and daily organization budgets. If budget is exceeded:

1. Check current usage: `orchestrator.getBudgetStatus()`
2. Budget resets daily
3. Per-task limit is 100 units (configurable in BudgetEnforcer)
4. Organization daily limit is 10,000 units
