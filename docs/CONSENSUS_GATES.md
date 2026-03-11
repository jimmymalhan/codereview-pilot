# Consensus Gates (HARD)

**Purpose**: No merge without 100% consensus. No idea, project, or task without stakeholder consensus. Multiple comments required on PRs. Block until all gates pass.

---

## PR Merge Gate (HARD)

- **Multiple comments required** — PR must have comments from skill sets, agents, sub-agents, or reviewers. At least 2+ distinct commenters (or 2+ agent/role reviews).
- **100% consensus required** — All reviewers must approve. No objections. No "request changes" unresolved.
- **Do NOT merge without consensus** — If any reviewer has not approved, block merge. If any objection exists, block merge.
- **Sources of comments**: Skill sets, agents, sub-agents, human reviewers, five-agent verification, ten-pass verification outputs. All count.

### Merge Checklist
- [ ] CI green (npm test, lint, etc.)
- [ ] Multiple comments on PR (2+ from agents, skills, or reviewers)
- [ ] 100% consensus — all have approved; no outstanding objections
- [ ] Ten-pass verification passed (where applicable)

**Rule**: Never merge a PR without satisfying all of the above. Consensus overrides auto-merge.

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
Multiple comments? (2+ from skills, agents, sub-agents, reviewers)
       ↓
100% consensus? (all approved, no objections)
       ↓
Yes → Proceed to merge
No  → Block. Get more comments. Resolve objections. Re-check consensus.

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

## Relation to Other Docs

- **pr-push-merge** — Phase 5: Merge only after consensus gate passes
- **ten-pass-verification** — Counts as agent/skill comments; contributes to multiple comments
- **five-agent-verification** — Counts as 5 comments; all must pass for consensus
- **critiques.md** — Stakeholder feedback required before design/project/assign; aligns with consensus gate
