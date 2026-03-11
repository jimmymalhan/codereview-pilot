# MCP Routing

## Purpose
Route MCP (Model Context Protocol) calls to appropriate workflow stages. MCP is only allowed when it improves proof — never for decoration. Allowed uses: GitHub PR/issue context, branch/PR cleanup, milestone inspection, browser verification, contract probing. Every MCP call must produce an artifact. If MCP unavailable, degrade gracefully.

## Trigger
Workflow-router determines proof needs external data not available via local tools.

## Workflow Stage
Any stage (PLAN, IMPLEMENT, VERIFY) — only when local tools cannot provide the required proof.

## Required Inputs
- `proof_need`: What evidence is missing and why MCP is required.
- `mcp_target`: Which MCP server/tool to call (e.g., GitHub, browser, filesystem).
- `fallback_plan`: What to do if MCP is unavailable.

## Exact Output Format (JSON)
```json
{
  "skill": "mcp-routing",
  "mcp_target": "github|browser|filesystem",
  "proof_need": "string describing what evidence is needed",
  "mcp_call": "tool name and parameters used",
  "artifact_produced": "description of artifact (PR data, page content, etc.)",
  "fallback_used": false,
  "fallback_reason": null,
  "status": "success|degraded|failed"
}
```

## Commands to Run
- `gh pr list`, `gh pr view`, `gh issue list` — GitHub context via CLI fallback.
- MCP GitHub tools for PR comments, reviews, milestone data.
- MCP browser tools for live page verification.

## Files to Inspect
- `.claude/settings.json` — MCP server configuration.
- `.claude/rules/guardrails.md` — Proof requirements.

## Proof Needed
Every MCP call must produce a concrete artifact: PR data, issue body, page screenshot, contract shape, or branch list. No MCP call without artifact output.

## Fail Conditions
- MCP call produces no artifact.
- MCP used for decoration (no proof value).
- No fallback plan defined before calling MCP.
- MCP call fails and no graceful degradation occurs.

## Next Handoff
Return artifact to the requesting skill/agent (workflow-router, end-to-end-verifier, post-merge-watchdog).

## What to Cache
- MCP availability status per server (avoid repeated failed calls).
- Recent PR/issue data (TTL: 5 minutes).

## What to Update on Success
- Attach artifact to the proof chain in `.claude/CONFIDENCE_SCORE.md`.
- Log MCP call in session context for token accounting.

## What to Update on Failure
- Log failure reason and fallback action taken.
- Lower confidence score if proof gap remains unfilled.
- Record in `.claude/CONFIDENCE_SCORE.md` as `[UNKNOWN]`.

## Token Thrift Rules
- Never call MCP speculatively. Only call when proof need is identified.
- Prefer `gh` CLI over MCP GitHub tools when CLI suffices.
- Cache MCP results; do not re-fetch within same session.

## When NOT to Use
- Local tools (Glob, Grep, Read, Bash) can provide the same data.
- The proof need is cosmetic, not evidentiary.
- MCP servers are not configured in `.claude/settings.json`.
- The task is a simple file edit with no external dependency.
