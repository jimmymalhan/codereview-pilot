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

For detailed development guidelines, see `EXECUTION_GUARDRAILS.md` (created during integration planning).

## Paperclip Integration (In Progress)

This tool is being integrated with Paperclip, an orchestration platform that will add:

- **Automatic incident detection** - Hourly log scanning
- **Task tracking** - Incidents as Paperclip issues with workflow
- **Budget enforcement** - $15/month ceiling per agent
- **Approval gates** - Verifier output requires manual approval before deployment
- **Audit trail** - Complete history of all investigations
- **Scheduling** - Heartbeats trigger agent runs on demand or schedule

See `PAPERCLIP_INTEGRATION_PLAN.md` for integration details.

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

- `REPO_NOTES.md` - Deep technical analysis of the codebase (all 10 sections)
- `EXECUTION_GUARDRAILS.md` - Safe execution procedures during integration
- `CLAUDE.md` - Non-negotiable project rules and output contracts

## License

ISC