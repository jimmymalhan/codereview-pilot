---
name: retriever
description: Gather evidence with file:line citations. Grep first, then Glob, then Read. Use when gathering proof, validating claims, searching codebase, or running diagnosis evidence phase. Never invent paths. MCP integration for repo access.
---

## Phase 1: DISCOVER
### Sub-Agent: `SourceMapper` (model: haiku)
- **Tools**: Glob, Grep
- **Prompt**: Find all searchable sources: code files, logs, configs. Map search strategy: Grep first (cheapest), then Glob, then Read.
- **Output**: `{ sources[], search_tools[], max_results_per_tool }`
- **Gate**: >= 1 source found

## Phase 2: PLAN
### Sub-Agent: `SearchDesigner` (model: sonnet)
- **Prompt**: Design search plan. Order: Grep → Glob → Read. Max 5 Grep, 5 Glob, 10 Read calls. Define keywords from incident.
- **Output**: `{ search_plan[{query, tool, max_results}] }`
- **Gate**: plan has >= 1 search

## Phase 3: IMPLEMENT
### Sub-Agent: `EvidenceGatherer` (model: haiku)
- **Tools**: Grep, Glob, Read
- **Prompt**: Execute searches from plan. For every finding, record file:line citation. Validate each citation exists by reading the file. Never invent paths.
- **Output**: `{ evidence[{path, line, snippet}], validated: boolean }`
- **Gate**: all citations validated

## Phase 4: VERIFY
### Sub-Agent: `CitationChecker` (model: haiku)
- **Prompt**: Re-read each cited file:line. Confirm snippet matches actual content. Flag any that don't match.
- **Output**: `{ citations_checked, valid_count, invalid_count }`
- **Gate**: 0 invalid citations

## Phase 5: DELIVER
### Sub-Agent: `EvidencePackager` (model: haiku)
- **Prompt**: Format output contract. Pass evidence to Skeptic and Verifier. Notify user of server status.
- **Output**: `{ evidence[], totalClaims, validated: true }`
- **Gate**: output contract complete

## Contingency
IF no evidence found → mark [UNKNOWN], output empty evidence with confidence 0.2. Do not invent evidence.
IF over tool call limit (5 Grep + 5 Glob + 10 Read) → output what you have with [INCOMPLETE] marker.

---

# Retriever Role Skill

**Purpose**: Automate evidence gathering and citation validation end-to-end.

**Role**: Evidence Gatherer in the 4-agent diagnosis pipeline.

## Create → Handle → Run (E2E)

### Create
- Add retrieval patterns for logs, metrics, files
- Extend Evidence Verifier (`/api/verify-evidence`) for new citation types
- Wire MCP tools for repo access (Glob, Grep, Read)
- Never invent file paths—always validate

### Handle
- Receive: classification + timestamp from Router
- Search codebase, logs, metrics
- Output: list of `file:line` citations with evidence
- Pass to Skeptic and Verifier
- Use Evidence Verifier skill before emitting claims

### Run
- `npm start` → Submit incident at http://localhost:3000
- Or `node src/local-pipeline.js`
- Verify Retriever output includes valid file:line citations
- Call `/api/verify-evidence` to validate citations

## Output Contract

```json
{
  "evidence": [
    { "path": "src/file.js", "line": 42, "snippet": "..." }
  ],
  "totalClaims": 3,
  "validated": true
}
```

## Constraints

- ✓ Cite actual files using file:line format
- ✓ Use Evidence Verifier before emitting
- ✗ Never invent paths or line numbers
- ✗ Never emit unvalidated citations

## Related Skills

- `evidence-proof` – Run verification, capture proof
- `backend-reliability` – API error handling for verification endpoint
