---
name: extreme-critique
description: PR critiques must be thorough. Look for fails. BLOCK on real issues. No rubber-stamp. Use less context. Agents work together via compact handoff.
---

# Extreme Critique (HARD)

**Purpose**: PR comments must show real critique. Look for failures, edge cases, gaps. BLOCK when found. PASS only when genuinely satisfied. No rubber-stamp.

---

## Rule (HARD)

- **No rubber-stamp** — Never post "PASS" without checking. Every agent must: read diff, run checks, list what was verified.
- **BLOCK on real issues** — If you find: missing tests, invented claims, style violations, coverage gaps → BLOCK. List specifics.
- **Thorough before merge** — End-to-end checklist. All flows tested. Edge cases considered. No shortcuts.
- **Use less context** — Each agent gets: diff + scope only. No redundant files. Compact handoff.
- **Work together** — Handoff: `{ scope, findings[], next }`. Recipient resumes with minimal input.

---

## Comment Format (Required)

**PASS** (only when truly satisfied):
```
**[Agent]** PASS — Verified: [list what was checked]. No issues in [specific areas].
```

**BLOCK** (when issues found):
```
**[Agent]** BLOCK — [Issue 1]: file:line, [Issue 2]: file:line. Must fix before merge.
```

**CONCERN** (minor, doesn't block):
```
**[Agent]** PASS with CONCERN — [concern]. Consider [suggestion]. Not blocking.
```

**Never**: `**[Agent]** PASS` (no substance)

---

## Agent Scoping (Less Context)

| Agent | Input | Output |
|-------|-------|--------|
| CodeReviewer | `git diff` only | issues[] or PASS |
| APIValidator | routes + diff | mismatches[] or PASS |
| EvidenceReviewer | claims + grep file:line | unsupported[] or PASS |
| QAReviewer | test list + npm test output | gaps[] or PASS |
| Critic | output fields checklist | blocking[] or APPROVED |

**Handoff**: Pass only `{ scope, files[], findings[] }`. No full file contents.

---

## Thorough End-to-End Checklist (Before Merge)

- [ ] All 10 passes commented with substance (not "PASS" alone)
- [ ] At least one agent checked: happy path, error path, edge case
- [ ] npm test output in PR (not "passed" claim)
- [ ] No invented file:line; all citations verified
- [ ] Confidence ≥ 0.70 with evidence

---

## Integration

- **ten-pass-verification**: Each pass uses extreme-critique format
- **five-agent-verification**: Agents get minimal context; output substance
- **handoff-protocol**: Compact state; `{ scope, findings, next }`
- **consensus-gates**: Merge only when thorough checklist complete
