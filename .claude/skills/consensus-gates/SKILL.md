---
name: consensus-gates
description: PR merge requires multiple comments and 100% consensus. Idea, project, and task creation require stakeholder consensus. Block until all gates pass. Use when merging PRs, creating ideas, projects, or tasks.
---

# Consensus Gates (HARD)

**Purpose**: No merge without 100% consensus. No idea, project, or task without stakeholder consensus. Multiple comments required on PRs. Block until all gates pass.

---

## PR Merge Gate (HARD)

- **10-pass comments required** — PR must have comments from all 10 ten-pass verification passes ON THE PR. Each pass must run `gh pr comment` with its result and any push-back. Merge blocked until all 10 have commented.
- **Multiple comments required** — In addition: PR must have comments from skill sets, agents, sub-agents, or reviewers. At least 2+ distinct commenters (or 2+ agent/role reviews).
- **100% consensus required** — All reviewers must approve. No objections. No "request changes" unresolved.
- **Do NOT merge without consensus** — If any reviewer has not approved, block merge. If any objection exists, block merge.
- **Critiques must push back on PR** — Ten-pass and five-agent outputs MUST be posted as PR comments. No silent verification.
- **Multiple contributors** — Each agent posts with its own GitHub identity (per-agent GH token). PR must show different commenters. See `github-agent-identities`.
- **Convince before merge** — When agent BLOCKs, author fixes. Agent re-checks, posts follow-up (PASS or still BLOCK). No merge until all agents are convinced.

### Merge Checklist
- [ ] CI green (npm test, lint, etc.)
- [ ] **10 ten-pass comments on PR** — All 10 passes have run `gh pr comment` with their result
- [ ] Multiple comments on PR (2+ from agents, skills, or reviewers)
- [ ] 100% consensus — all have approved; no outstanding objections
- [ ] Ten-pass verification passed (where applicable)

**Rule**: Never merge a PR without satisfying all of the above. **Merge only AFTER 10-pass critiques have commented.** Consensus overrides auto-merge.

**Do NOT leave PRs hanging** — Once all gates pass (10 comments, consensus), merge immediately. Don't wait for "later" or add artificial delays. Run critiques in parallel to finish quickly. Target: merge within 1 hour of PR ready.

---

## Idea / Project / Task Creation Gate (HARD)

- **No idea without consensus** — Do not create or formalize ideas without consensus of all relevant stakeholders.
- **No project without consensus** — Do not create projects without consensus of all relevant stakeholders.
- **No task without consensus** — Do not create or assign tasks without consensus of all relevant stakeholders.
- **Relevant stakeholders** — CEO, CTO, VPs, engineers (all sub-orgs), product, QA, design, security, ops, compliance, users—whoever is materially affected.

### Creation Checklist
- [ ] All relevant stakeholders identified
- [ ] All have provided feedback/approval
- [ ] 100% consensus reached
- [ ] Block until consensus. No creation without it.

---

## Flow

```
PR ready to merge
       ↓
Run ten-pass in PARALLEL — all critiques post comments quickly (target: <15 min)
       ↓
10 ten-pass comments on PR? Multiple comments? 100% consensus?
       ↓
Yes → Merge immediately. Do NOT leave PR hanging.
No  → Fix, re-run failed critiques, resolve objections. Merge as soon as gates pass.
```

**Merge promptly** — When all gates pass, merge the same session. No "PR approved, will merge tomorrow."

Idea / Project / Task proposed
       ↓
Relevant stakeholders identified
       ↓
All feedback collected
       ↓
100% consensus?
       ↓
Yes → Create / proceed
No  → Block. Do not create. Get consensus first.
```

---

## Integration

- **pr-push-merge** — Phase 5: Merge only after consensus gate passes
- **ten-pass-verification** — Counts as agent/skill comments; contributes to multiple comments
- **five-agent-verification** — Counts as 5 comments; all must pass for consensus
