---
name: stakeholder-feedback
description: Gather feedback from CEO, EM, product, frustrated users; incorporate into features; create feedback doc with themes, actions, what changed. Use for iteration and alignment.
---

## Phase 1: DISCOVER
### Sub-Agent: `FeedbackGatherer` (model: haiku)
- **Prompt**: Collect feedback themes from conversation. Classify by stakeholder type (CEO, EM, product, user, frustrated user).
- **Output**: `{ themes[], stakeholder_type, severity }`
- **Gate**: themes identified

## Phase 2: PLAN
### Sub-Agent: `ActionPlanner` (model: sonnet)
- **Prompt**: Map themes to concrete actions: code changes, UI updates, documentation, skill updates. Prioritize by severity.
- **Output**: `{ actions[{theme, change, priority, files}] }`
- **Gate**: actions planned

## Phase 3: IMPLEMENT
### Sub-Agent: `ActionWriter` (model: haiku)
- **Tools**: Read, Write, Edit
- **Prompt**: Update docs/FEEDBACK_LOG.md (or private equivalent) with themes, actions, and what changed. Add to feedback-log skill.
- **Output**: `{ doc_updated, actions_logged }`
- **Gate**: feedback documented

## Phase 4: VERIFY
### Sub-Agent: `ActionVerifier` (model: haiku)
- **Prompt**: Confirm actions are concrete (not vague). Confirm each action has a responsible skill/agent.
- **Output**: `{ concrete: boolean, assigned: boolean }`
- **Gate**: actions are concrete and assigned

## Phase 5: DELIVER
### Sub-Agent: `ActionPublisher` (model: haiku)
- **Prompt**: Commit feedback doc. Notify user of themes and actions. If live user → prioritize their feedback items.
- **Output**: `{ committed: boolean, themes_summary, live_user_priority[] }`
- **Gate**: committed and user notified

## Contingency
IF feedback contradicts existing rules → flag conflict, ask user which takes precedence.
IF live user feedback during session → invoke live-feedback-handler for immediate issues, queue strategic feedback for next cycle.

---

# Stakeholder Feedback Skill

**Purpose**: Incorporate feedback from multiple stakeholder types to improve product and alignment.

## Stakeholder Roles

| Role | Focus |
|------|-------|
| CEO | Strategic, business value |
| EM | Delivery, team, scope |
| Director | Vision, alignment |
| Product | Features, prioritization |
| Business user | Value, workflow |
| Sales | Conversion, objections |
| Frustrated user | Pain points, complaints |

## Process

1. **Gather** – Collect feedback (real or simulated via agents)
2. **Document** – Create doc: feedback themes, who said what
3. **Actions** – What was done in terms of features
4. **Remaining** – What stays open
5. **Alignment** – Summarize for vision, ambition, revenue focus

## Output Doc

Create (local-only): `docs/private/STAKEHOLDER_FEEDBACK.md` or similar:
- Feedback themes
- Actions taken
- Product behavior changes
- Open items
- Internal stakeholder notes

## Integration

- Add 100s of reviewer subagents if task justifies
- CEO, product, EM, frustrated-user agents critique work
- Update code based on feedback
- Update guardrails so same mistakes don't recur
