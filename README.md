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

A five-agent pipeline that enforces evidence-first methodology:

1. **Router** - Classifies the failure type (schema drift, write conflict, stale read, bad deploy, auth failure, dependency break)
2. **Retriever** - Pulls exact evidence: file:line citations, log timestamps, schema definitions, payload fields
3. **Skeptic** - Generates a competing explanation from a different failure family to pressure the first diagnosis
4. **Verifier** - Blocks any claim not backed by retrieved evidence, requires root cause + fix plan + rollback + tests
5. **Critic** - Validates quality gates (confidence >= 0.70, evidence citations, fix plan, rollback, tests) before final output

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

## 🎬 Demo Video

See Claude Debug Copilot in action—watch the 4-agent pipeline diagnose a real backend failure in 20 seconds:

[![Claude Debug Copilot Demo](https://img.shields.io/badge/▶️%20Watch%20Demo-20.8s-blue?style=for-the-badge)](https://github.com/jimmymalhan/claude-debug-copilot/releases/tag/v1.0-demo)

**What the demo shows:**
- Submit a production incident (database connection pool exhaustion)
- Watch the 4-agent pipeline run in real-time:
  - **Router** classifies failure type
  - **Retriever** gathers evidence from logs and metrics
  - **Skeptic** challenges the diagnosis
  - **Verifier** validates root cause with 92% confidence
- Get actionable fix plan, rollback strategy, and test cases
- See the complete audit trail of every decision

**Video specs:** 20.8 seconds | 1920×1080 | Professional audio narration

[Download full video](https://github.com/jimmymalhan/claude-debug-copilot/releases/download/v1.0-demo/poc-demo.mp4) | [View release](https://github.com/jimmymalhan/claude-debug-copilot/releases/tag/v1.0-demo)

## Safety Constraints

The tool enforces five non-negotiable rules (see `CLAUDE.md`):

- **never invent fields, tables, APIs, regions, or files** - everything must be retrieved
- **retrieve before explaining** - no guessing
- **verifier blocks unsupported nouns** - claims must cite evidence
- **skeptic must produce a materially different theory** - not just shade on the first answer
- **no edits until the plan is approved** - human review gate

## Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
export ANTHROPIC_API_KEY=your-key-here
npm test  # Verify setup (319 tests should pass)
```

### Step 2: Diagnose Your First Incident
```bash
# Run the demo (no API key needed)
node src/run.js

# Or use with your incident details
echo "Database connection pool exhausted at 2:45 UTC, 50% error rate" | \
  claude --agent router
```

### Step 3: Follow the Pipeline
The 4-agent pipeline runs automatically:
- **Router** → Classifies the failure type
- **Retriever** → Pulls evidence (file:line, timestamps, logs)
- **Skeptic** → Challenges the diagnosis
- **Verifier** → Validates with evidence and confidence score

Get back: root cause, evidence, fix plan, rollback strategy, tests.

---

## Usage Examples

### Debugging a Production Incident (Real Example)

**Incident**: API returning 503 errors, ~20% failure rate in production
```bash
# Provide incident details
incident="
API errors: logs/api.log:2024-03-09 15:30-15:45
Database: show slow query log
Deploy: release notes v2.3.1
"

# Let agents diagnose
echo "$incident" | claude --agent router
# → Classification: likely write conflict or resource exhaustion

echo "$incident" | claude --agent retriever
# → Evidence: connection pool size = 10, current connections = 25, spike at 15:32

echo "$incident" | claude --agent skeptic
# → Alternative: memory leak, not connection pool

echo "$incident" | claude --agent verifier
# → Verdict: Connection pool exhaustion, fix = increase pool size to 50
```

### Using the Orchestrator (Programmatic)

```javascript
import { DebugOrchestrator } from './src/orchestrator/orchestrator-client.js';

const orchestrator = new DebugOrchestrator();
await orchestrator.initialize();

// Submit incident
const task = await orchestrator.submitTask({
  type: 'debug',
  description: 'Database queries timing out',
  evidence: ['error.log:1-50', 'schema.sql:indexes', 'metrics.json:cpu']
});

// Get root cause
const result = await orchestrator.invokeAgent('verifier', task.taskId, task);
console.log(result.root_cause);  // Actionable diagnosis
console.log(result.fix_plan);    // Exact code changes
console.log(result.confidence);  // 0.85 (85% confident)
```

### Running Tests

```bash
# All 319 tests (319/319 passing)
npm test

# Specific test suite
npm test -- tests/orchestrator-client.test.js

# Watch mode for development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Troubleshooting

### Tests Failing?
```bash
# Verify Node.js version (need 18+)
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### No API Key?
```bash
# The demo works without credentials
node src/run.js

# For full functionality, get your API key from:
# https://console.anthropic.com
export ANTHROPIC_API_KEY=your-key-here
npm test
```

### Agent Not Responding?
- Check ANTHROPIC_API_KEY is set: `echo $ANTHROPIC_API_KEY`
- Verify Claude Code CLI is installed: `claude --version`
- Check agent definition exists: `ls -la .claude/agents/`
- Run tests to validate setup: `npm test`

### Confidence Score Too Low?
- Provide more evidence (file paths, log snippets, timestamps)
- Ensure evidence files actually exist in repository
- Skeptic may have raised contradictions—review them
- Add more specific details about the failure timeline

---

## Before & After: Evidence-First Debugging

### BEFORE: Traditional AI Debugging
```
User asks:
→ "Why is my API timing out?"

AI responds:
→ "Probably your database connection pool is too small"
(sounds confident, no evidence)

Engineer digs for 2 hours:
→ Finds it was actually a DNS cache issue, not pool size

Cost: 2 hours of on-call time, user still confused
```

### AFTER: Claude Debug Copilot
```
User submits incident with evidence:
→ logs/api.log:2024-03-09 15:30-45
→ metrics/connections.json
→ deployment/v2.3.1-release-notes.md

Router classifies:
→ Top 2 likely: resource exhaustion OR stale read

Retriever gathers evidence:
→ Connection pool size = 10
→ Current connections = 25 (at spike time)
→ Pool limit exceeded at 15:32 UTC
→ Error rate: 20% (during surge)

Skeptic challenges:
→ "Could be DNS cache (different family)"
→ "Check: DNS TTL = 3600s, DNS queries = 0 (cached)"
→ "Verdict: Not DNS, consistent with connection pool"

Verifier validates:
→ Evidence: file:line for all claims
→ Root Cause: Connection pool exhaustion
→ Fix: Increase pool size from 10 → 50
→ Rollback: Revert size to 10
→ Tests: Verify pool accepts 50 connections
→ Confidence: 89%

Result: Actionable fix in 2 minutes, engineer is certain
```

---

## Data Flow: End-to-End

```
┌─────────────────────────────────────────────────────────────┐
│ INCIDENT REPORTED                                           │
│ "API returning 503 errors, 20% failure rate"               │
├─────────────────────────────────────────────────────────────┤
│ Evidence provided:                                          │
│  • logs/api.log (lines 150-200, timestamps 15:30-15:45)   │
│  • metrics/cpu.json (spike from 40% → 95%)                │
│  • src/db/connection-pool.js (current implementation)      │
│  • CHANGELOG.md (deployed v2.3.1 added connection pooling) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGENT 1: ROUTER (Classification)                            │
│ Task: Classify into failure families                       │
├─────────────────────────────────────────────────────────────┤
│ Output:                                                     │
│ • Top 1: Resource Exhaustion (connection pool)            │
│ • Top 2: Write Conflict (transaction lock)                │
│ • Missing Evidence: Current pool size, connection count   │
│ • Confidence: 0.65 (needs more evidence)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGENT 2: RETRIEVER (Evidence Gathering)                    │
│ Task: Find exact evidence with file:line citations        │
├─────────────────────────────────────────────────────────────┤
│ Output (with exact locations):                             │
│ • src/db/connection-pool.js:42 → DEFAULT_POOL_SIZE = 10  │
│ • logs/api.log:158 → "pool size=10, current=25"           │
│ • metrics/cpu.json → {"timestamp":"15:32","cpu":95}      │
│ • src/db/connection-pool.js:85 → Wait timeout = 5s       │
│ Confidence: 0.78 (specific evidence found)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGENT 3: SKEPTIC (Challenge the Diagnosis)                │
│ Task: Find competing explanation from different family    │
├─────────────────────────────────────────────────────────────┤
│ Output (Alternative Theory):                               │
│ • Could be: DNS cache (not connection pool)               │
│ • Evidence: No DNS queries in logs at 15:30-15:45         │
│ • But: Contradiction found—DNS lookup takes 10ms per req  │
│ • At 20% error rate, would see more DNS errors in logs    │
│ • Verdict: DNS theory contradicted by evidence            │
│ Confidence: 0.12 (alternative theory unlikely)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGENT 4: VERIFIER (Final Decision & Approval Gate)        │
│ Task: Block claims not backed by evidence                 │
├─────────────────────────────────────────────────────────────┤
│ VERIFIES:                                                   │
│ ✓ Root Cause: Connection pool exhaustion                  │
│   Evidence: file:line 42, logs:158, metrics timestamp     │
│                                                             │
│ ✓ Fix Plan:                                               │
│   Change src/db/connection-pool.js:42                     │
│   DEFAULT_POOL_SIZE = 10 → 50                             │
│                                                             │
│ ✓ Rollback Plan:                                          │
│   Revert DEFAULT_POOL_SIZE = 50 → 10                      │
│                                                             │
│ ✓ Tests:                                                  │
│   1. Verify pool accepts 50 concurrent connections       │
│   2. Verify wait timeout respected                        │
│   3. Load test with 60 concurrent requests               │
│                                                             │
│ Final Confidence: 0.89 (89% confident)                    │
│ APPROVED: True (ready to deploy)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ENGINEER REVIEW (Human Approval Gate)                      │
│ Decision: Deploy fix to production                         │
│ Rollback: Known and tested                                │
│ Confidence: 89% (backed by evidence)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
.claude/
├── agents/
│   ├── router.md         # Failure classifier
│   ├── retriever.md      # Evidence gatherer
│   ├── skeptic.md        # Competing theory generator
│   ├── verifier.md       # Claim validator + approval gate
│   └── critic.md         # Quality gate validator
└── hooks/
    └── check-edits.sh    # Prevents .env and lock file commits

src/
├── orchestrator/         # Local orchestration framework (14 modules)
│   ├── orchestrator-client.js    # Main client
│   ├── task-manager.js           # Task lifecycle
│   ├── approval-state-machine.js # Approval workflow
│   └── [11 more modules]         # Security, budget, audit, etc.
└── run.js               # Demo entry point

CLAUDE.md               # Project rules and output contracts
CHANGELOG.md            # Version history
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