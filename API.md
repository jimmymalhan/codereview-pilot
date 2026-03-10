# API Documentation

## DebugOrchestrator

**File**: `src/orchestrator/orchestrator-client.js`

The main entry point for the debug copilot pipeline. Coordinates 8 internal modules: TaskManager, ApprovalStateMachine, BudgetEnforcer, AuditLogger, HeartbeatMonitor, AgentWrapper, ErrorHandler, and input validation.

### Constructor

```javascript
import { DebugOrchestrator } from './src/orchestrator/orchestrator-client.js';

const orchestrator = new DebugOrchestrator(config);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | `object` | `{}` | Optional configuration object |

### Methods

#### `initialize()`

Initialize the orchestration system. Must be called before submitting tasks.

```javascript
const result = await orchestrator.initialize();
// { status: 'initialized', modules: 8 }
```

#### `submitTask(taskInput)`

Submit a debugging task through the orchestration pipeline. Validates input, creates task, enforces budget.

```javascript
const result = await orchestrator.submitTask({
  type: 'debug',
  description: 'Database queries timing out',
  evidence: ['error.log:1-50', 'schema.sql:indexes']
});
// Success: { success: true, task: { taskId, type, status, ... } }
// Failure: { success: false, error: 'Task submission failed' }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `taskInput.type` | `string` | Task type: `debug`, `investigate`, `analyze` |
| `taskInput.description` | `string` | Incident description |
| `taskInput.evidence` | `Array<string>` | Evidence references (file:line format) |

#### `getTask(taskId)`

Retrieve a task by ID.

```javascript
const result = await orchestrator.getTask('task-123');
// { status: 'success', task: { taskId, type, status, evidence, ... } }
```

#### `updateTaskStatus(taskId, status)`

Update the status of an existing task. Logs state transition to audit trail.

```javascript
const result = await orchestrator.updateTaskStatus('task-123', 'completed');
// { status: 'success', updated: true }
```

#### `invokeAgent(agentId, taskId, taskInput)`

Invoke a specific agent through the agent wrapper lifecycle (validation, execution, sanitization, audit).

```javascript
const result = await orchestrator.invokeAgent('verifier', 'task-123', taskInput);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | `string` | Agent role: `router`, `retriever`, `skeptic`, `verifier` |
| `taskId` | `string` | Associated task ID |
| `taskInput` | `object` | Task data passed to the agent |

#### `sendHeartbeat(agentId, payload)`

Register an agent heartbeat for health monitoring.

```javascript
const result = await orchestrator.sendHeartbeat('router', { status: 'active' });
// { status: 'heartbeat_received', agentId: 'router' }
```

#### `queryAuditTrail(filters)`

Query the immutable audit trail with optional filters.

```javascript
const events = await orchestrator.queryAuditTrail({ event: 'state_transition' });
// Array of audit entries
```

#### `getBudgetStatus()`

Get current budget consumption across agents and organizations.

```javascript
const result = await orchestrator.getBudgetStatus();
// { status: 'success', budget: { orgDaily, orgReserved, ... } }
```

#### `getOrchestrationStats()`

Get a snapshot of orchestrator state (synchronous).

```javascript
const stats = orchestrator.getOrchestrationStats();
// {
//   isInitialized: true,
//   taskCount: 5,
//   agentStats: { ... },
//   budgetStatus: { used: 150, limit: 10000 },
//   heartbeatStatus: 4
// }
```

### OrchestratorError

Custom error class for orchestration failures.

```javascript
import { OrchestratorError } from './src/orchestrator/orchestrator-client.js';

throw new OrchestratorError('Budget exceeded', 'BUDGET_EXCEEDED');
// error.name === 'OrchestratorError'
// error.code === 'BUDGET_EXCEEDED'
```

---

## Skill Set APIs

### EvidenceVerifier

**File**: `src/skills/evidence-verifier.js`

Validates that diagnostic claims carry proper evidence citations with file:line references and ISO-8601 timestamps.

#### Constructor

```javascript
import { EvidenceVerifier } from './src/skills/evidence-verifier.js';

const verifier = new EvidenceVerifier({ repoRoot: '/path/to/repo' });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `repoRoot` | `string` | `process.cwd()` | Repository root for file existence checks |

#### `verify(claims)`

Run the full verification suite against claims.

```javascript
const report = verifier.verify([
  {
    text: 'Connection pool size is 10',
    citation: 'src/db/pool.js:42',
    timestamp: '2024-03-09T15:32:00Z'  // optional
  }
]);
// {
//   valid: true,
//   totalClaims: 1,
//   issues: []
// }
```

**Claim object fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | Yes | The claim statement |
| `citation` | `string` | Yes | File:line reference (e.g., `src/run.js:12`) |
| `timestamp` | `string` | No | ISO-8601 timestamp |

**Issue object (when validation fails):**

| Field | Type | Description |
|-------|------|-------------|
| `claimIndex` | `number` | Index of the failing claim |
| `field` | `string` | Which field failed (`text`, `citation`, `timestamp`) |
| `message` | `string` | Human-readable error message |

---

### HallucinationDetector

**File**: `src/skills/hallucination-detector.js`

Detects claims about non-existent fields, APIs, or function signatures. Produces a risk score between 0.0 and 1.0.

#### Constructor

```javascript
import { HallucinationDetector } from './src/skills/hallucination-detector.js';

const detector = new HallucinationDetector({
  repoRoot: '/path/to/repo',
  schema: {
    user: { fields: ['id', 'email', 'name'], types: { id: 'integer', email: 'string' } },
    order: { fields: ['id', 'user_id', 'total'] }
  },
  knownAPIs: ['GET /api/users', 'POST /api/orders', 'GET /api/health']
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `repoRoot` | `string` | `process.cwd()` | Repository root for file lookups |
| `schema` | `object` | `null` | Entity schema map for field/type validation |
| `knownAPIs` | `Array<string>` | `[]` | Known API endpoint patterns (supports `*` wildcards) |

#### `detect(claims)`

Analyze claims and return a hallucination report.

```javascript
const report = detector.detect([
  {
    text: 'User has a phone field',
    referencedField: 'user.phone',        // checked against schema
    referencedAPI: 'POST /api/users',      // checked against knownAPIs
    functionSignature: {                    // checked against source
      file: 'src/app.js',
      name: 'createUser',
      params: ['name', 'email']
    },
    dataType: { field: 'user.id', expectedType: 'string' }  // checked against schema types
  }
]);
// {
//   riskScore: 0.5,
//   totalClaims: 1,
//   flaggedClaims: 1,
//   details: [{ claimIndex: 0, type: 'unknown_field', message: '...' }]
// }
```

**Detection types:**

| Type | Trigger |
|------|---------|
| `unknown_entity` | Entity not in schema |
| `unknown_field` | Field not on entity |
| `unknown_api` | API not in known list |
| `missing_file` | Referenced source file does not exist |
| `missing_function` | Function name not found in source |
| `param_mismatch` | Function parameter count differs |
| `type_mismatch` | Data type contradicts schema |

---

### ConfidenceScorer

**File**: `src/skills/confidence-scorer.js`

Combines evidence quality, hallucination detection, and contradiction analysis into a single confidence score.

**Scoring formula:**
```
finalScore = clamp(baseScore + evidenceBonus - hallucinationPenalty - contradictionPenalty, 0, 1)
```

| Component | Weight | Description |
|-----------|--------|-------------|
| `evidenceBonus` | 0.25 | `(validClaims / totalClaims) * 0.25` |
| `hallucinationPenalty` | 0.35 | `riskScore * 0.35` |
| `contradictionPenalty` | 0.20 | `(unresolvedCount / totalContradictions) * 0.20` |

#### Constructor

```javascript
import { ConfidenceScorer } from './src/skills/confidence-scorer.js';

const scorer = new ConfidenceScorer({ repoRoot: '/path/to/repo' });
// Or inject custom sub-skills:
const scorer = new ConfidenceScorer({
  evidenceVerifier: myVerifier,
  hallucinationDetector: myDetector
});
```

#### `score(input)`

Compute a confidence score for a diagnostic report.

```javascript
const result = scorer.score({
  baseScore: 0.85,
  claims: [
    { text: 'Pool size is 10', citation: 'src/db/pool.js:42' }
  ],
  contradictions: [
    { description: 'Could be DNS issue', resolved: true },
    { description: 'Memory leak possible', resolved: false }
  ]
});
// {
//   confidence: 0.82,
//   baseScore: 0.85,
//   evidenceBonus: 0.25,
//   hallucinationPenalty: 0.0,
//   contradictionPenalty: 0.10,
//   evidenceReport: { valid: true, ... },
//   hallucinationReport: { riskScore: 0.0, ... },
//   breakdown: '0.85 + 0.2500 - 0.0000 - 0.1000 = 0.82'
// }
```

---

## MCP Integration

### McpClient

**File**: `src/mcp/mcp-client.js`

Model Context Protocol client that manages transport, context providers, caching, and graceful degradation.

#### Constructor

```javascript
import { McpClient } from './src/mcp/mcp-client.js';

const client = new McpClient({
  timeoutMs: 5000,     // per-request timeout (default 5000)
  transport: null       // custom transport for testing/DI
});
```

#### `registerProvider(name, provider)`

Register a context provider. Provider must implement `{ fetch(params) -> Promise<ContextResult> }`.

```javascript
client.registerProvider('repo', {
  fetch: async (params) => ({
    type: 'repo',
    data: { files: ['src/app.js'] },
    source: 'local',
    timestamp: new Date().toISOString()
  })
});
```

#### `connect()` / `disconnect()`

Manage MCP server connection. Returns `true` on success, `false` on failure (graceful degradation).

```javascript
const connected = await client.connect();
await client.disconnect();
```

#### `fetchContext(providerName, params)`

Fetch context from a registered provider with timeout and caching.

```javascript
const result = await client.fetchContext('repo', { path: 'src/' });
// ContextResult | null
```

#### `fetchMultiple(requests)`

Fetch from multiple providers in parallel.

```javascript
const results = await client.fetchMultiple([
  { name: 'repo', params: { path: 'src/' } },
  { name: 'logs', params: { pattern: 'error' } },
  { name: 'schema', params: { table: 'users' } }
]);
// Map<string, ContextResult|null>
```

#### `clearCache(providerName?)` / `listProviders()` / `isConnected()`

Utility methods for cache management and introspection.

### createMcpClient Factory

**File**: `src/mcp/index.js`

Convenience factory that creates an McpClient with all 4 default context providers pre-registered.

```javascript
import { createMcpClient } from './src/mcp/index.js';

const client = await createMcpClient({
  repoRoot: '/path/to/repo',
  logsDir: '/path/to/logs',
  schemaDir: '/path/to/schemas',
  metricsDir: '/path/to/metrics',
  timeoutMs: 5000,
  transport: null
});

// Providers registered: 'repo', 'logs', 'schema', 'metrics'
```

### Context Providers

All providers implement the `{ fetch(params) -> Promise<ContextResult> }` interface.

| Provider | File | Purpose |
|----------|------|---------|
| `RepoContextProvider` | `src/mcp/context-providers/repo-context-provider.js` | File discovery and content retrieval from repository |
| `LogContextProvider` | `src/mcp/context-providers/log-context-provider.js` | Log file parsing and search |
| `SchemaContextProvider` | `src/mcp/context-providers/schema-context-provider.js` | Database schema lookups |
| `MetricsContextProvider` | `src/mcp/context-providers/metrics-context-provider.js` | Performance metrics retrieval |

---

## ExtendedAgentFramework

**File**: `src/orchestrator/extended-agent-framework.js`

Manages 8 agent roles with a capability matrix, plugin system, and dynamic agent loading.

### Base Agents (4 core)

| Agent | Capabilities | Read Access | Write Access |
|-------|-------------|-------------|--------------|
| `router` | classify, route, analyze | `src/**`, `logs/**` | none |
| `retriever` | fetch, search, aggregate | `src/**`, `*.json`, `*.md` | none |
| `skeptic` | challenge, verify, critique | `.orchestrator/task-outputs/**` | `.orchestrator/skeptic-output.json` |
| `verifier` | validate, confirm, sign-off | `.orchestrator/task-outputs/**`, `.claude/**` | `.orchestrator/verifier-output.json` |

### Extended Agents (4 additional)

| Agent | Capabilities | Read Access | Write Access |
|-------|-------------|-------------|--------------|
| `analyst` | analyze, report, trend | `src/**`, `logs/**`, `.orchestrator/**` | `.orchestrator/reports/**` |
| `executor` | execute, deploy, rollback | `.orchestrator/**`, `src/**` | `.orchestrator/task-state/**` |
| `monitor` | observe, alert, health-check | `.orchestrator/**`, `logs/**` | `.orchestrator/metrics/**` |
| `coordinator` | orchestrate, sequence, coordinate | `.orchestrator/**`, `src/**` | `.orchestrator/coordination/**` |

### Key Methods

```javascript
import { ExtendedAgentFramework } from './src/orchestrator/extended-agent-framework.js';

const framework = new ExtendedAgentFramework();

// List all agents
framework.getAllAgents();

// Get capability matrix
framework.getCapabilityMatrix();

// Register a plugin for an agent
framework.registerPlugin('router', 'custom-classifier', myPlugin);

// Load a custom agent dynamically
framework.loadCustomAgent('my-agent', {
  capabilities: { read: ['logs/**'], write: [], execute: ['custom-action'] }
});
```

---

## Output Contract

All diagnostic results must conform to this contract (enforced by CLAUDE.md):

```json
{
  "root_cause": "string (required, backed by evidence)",
  "evidence": ["file:line", "log snippet", "timestamp"],
  "fix_plan": "string (exact code change)",
  "rollback": "string (how to reverse)",
  "tests": ["test case 1", "test case 2"],
  "confidence": 0.85
}
```
