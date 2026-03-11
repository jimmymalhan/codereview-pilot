---
name: skills-self-update
description: Update skill sets when issues are fixed. Always learning. Add lessons to SKILL.md, feedback-log, or rules. Use after every fix, review, or stakeholder feedback.
---

## Phase 1: DISCOVER
### Sub-Agent: `LessonFinder` (model: haiku)
- **Tools**: Read
- **Prompt**: Identify what went wrong or what was learned. Read the fix that was applied. Determine which skill should be updated.
- **Output**: `{ issue, fix_applied, affected_skill, lesson_type }`
- **Gate**: lesson identified

## Phase 2: PLAN
### Sub-Agent: `LessonPlanner` (model: haiku)
- **Tools**: Read
- **Prompt**: Map lesson to correct SKILL.md file. Check if duplicate lesson exists. Format using template: Issue, Fix, Prevention.
- **Output**: `{ target_skill_path, lesson_text, is_duplicate: boolean }`
- **Gate**: target identified AND not duplicate

## Phase 3: IMPLEMENT
### Sub-Agent: `LessonWriter` (model: haiku)
- **Tools**: Read, Edit
- **Prompt**: Add lesson to the "Lessons Learned" section of the target SKILL.md. Use exact format. If section doesn't exist, create it at the end.
- **Output**: `{ file_updated, lesson_added }`
- **Gate**: lesson written

## Phase 4: VERIFY
### Sub-Agent: `LessonVerifier` (model: haiku)
- **Tools**: Read
- **Prompt**: Re-read the updated SKILL.md. Confirm lesson is present and not duplicated. Confirm format is correct.
- **Output**: `{ verified: boolean, duplicates_found: boolean }`
- **Gate**: lesson verified AND no duplicates

## Phase 5: DELIVER
### Sub-Agent: `LessonCommitter` (model: haiku)
- **Tools**: Bash
- **Prompt**: Commit the skill update with the fix. Use message: "fix: update <skill> with lesson from <issue>".
- **Output**: `{ commit_sha, skill_updated }`
- **Gate**: committed

## Contingency
IF SKILL.md is too large (>300 lines) → move older lessons to feedback-log → keep only last 10 lessons in skill.

---

# Skills Self-Update Skill

**Purpose**: Keep skills updated when issues are found and fixed. Always be learning.

**Reference**: [geo-seo-claude](https://github.com/zubair-trabzada/geo-seo-claude/tree/main/skills) – skills evolve with audits; [Claude Code Skills](https://code.claude.com/docs/en/skills)

## When to Update

1. **After a fix** – Add the mistake + fix pattern to the relevant skill
2. **After review feedback** – Incorporate critique into skill constraints
3. **After stakeholder feedback** – Add to feedback-log, then to role skill if recurring
4. **After test failure** – Document root cause and prevention in qa-engineer or backend/frontend skill
5. **After CI failure** – Add to pr-push-merge or evidence-proof

## Update Flow

```
Issue found → Root cause identified → Fix applied → Update skill(s) → Commit skill change
```

## Where to Add Lessons

| Lesson Type | Add To |
|-------------|--------|
| API/backend pattern | `backend-reliability` or `backend-engineer` |
| UI/UX pattern | `ui-quality` or `frontend-engineer` |
| Evidence/proof | `evidence-proof` or `feedback-log` |
| Workflow/process | `plan-and-execute` or `pr-push-merge` |
| Cross-cutting | `feedback-log` (then propagate to role skills if recurring) |
| Project guardrail | `.claude/rules/guardrails.md` |

## Format (Add to Skill)

```markdown
## Lessons Learned (Updated [date])
- **[Issue]**: [What went wrong]. **Fix**: [What to do instead]. **Prevention**: [How skill prevents recurrence].
```

## Commit Rule

- Skill updates are project-relevant – commit them
- Keep lessons concise (1–2 sentences each)
- Do not duplicate across multiple skills; reference from feedback-log if shared
