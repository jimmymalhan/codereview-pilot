---
name: feedback-log
description: Incorporate common feedback, lessons learned, stakeholder input. Update skills and guardrails so agents don't repeat mistakes.
---

## Phase 1: DISCOVER
### Sub-Agent: `FeedbackCollector` (model: haiku)
- **Prompt**: Gather feedback from current session: user complaints, test failures, review findings, stakeholder input.
- **Output**: `{ feedback_items[], source, timestamp }`
- **Gate**: >= 1 feedback item

## Phase 2: PLAN
### Sub-Agent: `FeedbackMapper` (model: haiku)
- **Prompt**: Map each feedback to: which skill or rule should be updated. Check if feedback is already in the log (no duplicates).
- **Output**: `{ mappings[{feedback, target_file, is_new}] }`
- **Gate**: mappings created

## Phase 3: IMPLEMENT
### Sub-Agent: `FeedbackWriter` (model: haiku)
- **Tools**: Read, Edit
- **Prompt**: Add new feedback items to feedback-log. Update relevant skills if pattern recurs (3+ times).
- **Output**: `{ items_added, skills_updated[] }`
- **Gate**: feedback logged

## Phase 4: VERIFY
### Sub-Agent: `FeedbackVerifier` (model: haiku)
- **Prompt**: Confirm no duplicate entries. Confirm format is consistent.
- **Output**: `{ verified: boolean, duplicates: boolean }`
- **Gate**: verified

## Phase 5: DELIVER
### Sub-Agent: `FeedbackCommitter` (model: haiku)
- **Prompt**: Commit feedback changes. Notify user of patterns found.
- **Output**: `{ committed: boolean, patterns[] }`
- **Gate**: committed

---

# Feedback Log Skill

**Purpose**: Capture and apply recurring feedback so agents improve.

## Common Feedback (From Project)

1. **Surface every API endpoint in the UI** – Hidden endpoints = lost revenue
2. **Restart server after backend changes** – Express does not hot-reload
3. **Align frontend claims with backend reality** – If simulated, say "simulated"
4. **Test error formats end-to-end** – 400 → user-friendly message, not raw JSON
5. **Don't commit irrelevant files** – Plans, reports, checklists → .gitignore
6. **Test localhost + PR before handing off** – Verify links work
7. **Only output localhost/PR link if real** – Never invent
8. **Update guardrails from mistakes** – Add to skills so not repeated
9. **Plan first, then execute** – Don't code before checking
10. **Skip completed work** – Reruns should not redo

## Learn-From-Mistakes Rule

1. Record mistake in local note
2. Record fix pattern
3. Decide where it belongs:
   - CLAUDE.md if broad
   - .claude/rules/*.md if scoped
   - User-level agent if reusable
   - Local memory if project-specific
4. Do not duplicate lesson in multiple places

## Update Skills

Use `skills-self-update` when feedback recurs:
- Add to relevant SKILL.md (e.g. backend-reliability, ui-quality)
- Update docs/SKILLSETS.md
- Update .claude/rules/ if it's a guardrail
- Commit skill change with fix
