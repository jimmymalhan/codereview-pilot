---
name: user-feedback-to-skillset
description: All user feedback goes to the skill set. Update existing skills or create new skills. Do not create new docs for user input. Everything the user gives becomes part of the skill set. Use when receiving user feedback, preferences, or instructions.
---

# User Feedback → Skillset (META)

**Purpose**: Every user feedback is a skillset update. Everything the user gives goes to the skill set. Keep updating. Never create new docs for user input. Update skills or create new skills. The skill set is the single source of truth.

---

## Rule (HARD)

- **All user input → skillset** — User feedback, preferences, instructions, requirements: update the relevant skill or create a new skill.
- **Do not create new docs** — When user gives feedback, do NOT create `docs/something.md`. Update `.claude/skills/<name>/SKILL.md` or create `.claude/skills/<new-name>/SKILL.md`.
- **Everything becomes a skill** — Naming conventions, consensus gates, critiques, run-the-company, sales guide, ten-pass scope—all live in skills. Docs may mirror for reference, but skills are canonical.
- **Keep updating SKILLSETS.md** — When adding or updating skills, update `.claude/SKILLSETS.md` so the skill set stays discoverable.
- **Everything. Always.** — Every single thing the user gives you goes to the skill set. No exceptions. Keep updating.

---

## Workflow

```
User gives feedback
       ↓
Identify: New skill or update existing?
       ↓
Update .claude/skills/<name>/SKILL.md  OR  Create .claude/skills/<new-name>/SKILL.md
       ↓
Update .claude/SKILLSETS.md (add to table, role mapping, etc.)
       ↓
Update CHANGELOG.md (skill change)
       ↓
Never create docs/<new-feedback>.md
```

---

## When User Says

| User says | Do | Don't |
|-----------|----|--------|
| "Add X rule" | Create/update skill in .claude/skills/ | Create docs/X.md |
| "I want Y" | Add Y to relevant skill or new skill | Create standalone doc |
| "Change Z" | Update skill that covers Z | Create new doc for Z |
| "All feedback → skillset" | This skill. Apply everywhere. | Create meta-doc |
| "Keep updating the skill set" | Reinforce: everything → skillset. Update this skill. | Ignore or defer |
| "Everything needs to go to the skill set" | Same. Every user input → skill. No exceptions. | Create docs, leave out |
| "Check PRs, branches, commits" | Run `repository-audit-to-skillset`; use data to update skills | Create standalone audit doc |
| "Naming convention", "branch names", "commit format" | Update `naming-convention-product` skill | Create docs/naming.md |

---

## Preload

This skill should be preloaded or referenced by Plan, General-Purpose, and any agent that receives user input. Ensures all feedback flows into the skill set.
