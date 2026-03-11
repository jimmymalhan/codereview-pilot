---
name: feedback-loop
description: Feed past failures into checklists and prompts. Avoid repeating known mistakes.
---

# Feedback Loop Skill

**Principle**: When a failure recurs, add it to a checklist or skill so it is checked next time.

## Flow

1. **Failure occurs** (e.g., CI red, test flake, API 500)
2. **Check** `.claude/local/feedback/` and `docs/FEEDBACK_LOG*.md` for same pattern
3. **If known** → Apply documented fix from feedback
4. **If new** → After fix, add to feedback: `**[Issue]**: What went wrong. **Fix**: What to do. **Prevention**: Checklist item.`

## Format

```markdown
## [Date] — [Issue type]
**Issue**: npm test fails on Node 18 due to ...
**Fix**: Add engine field to package.json
**Prevention**: Check Node version before claiming tests pass
```

## Integration

- `skills-self-update` — Add to SKILL.md when recurring
- `feedback-log` — Append to feedback file
- **Before retry** — Read feedback for same operation; apply prevention

## Related

- `skills-self-update` — Update skills from fixes
- `feedback-log` — Common feedback patterns
