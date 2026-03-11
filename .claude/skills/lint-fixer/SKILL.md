---
name: lint-fixer
description: Auto-fix lint errors before commit. Runs npm run lint --fix, eslint --fix, or project lint command. Use before commit/PR.
argument-hint: [path or . for all]
---

# Lint-Fixer Skill

**Purpose**: Fix lint errors automatically before commit. Reduces CI failures and manual fixes.

## Detection

1. Check `package.json` for scripts: `lint`, `lint:fix`, `lint --fix`
2. If ESLint: `npx eslint --fix` or `npm run lint -- --fix`
3. Fallback: `npm run lint` (some projects fix in-place)

## Execution

```bash
# Preferred: project script
npm run lint -- --fix 2>/dev/null || npm run lint:fix 2>/dev/null || npx eslint . --fix

# Scope to path
npx eslint $ARGUMENTS --fix 2>/dev/null || npm run lint -- --fix $ARGUMENTS
```

## Rules

- Run **before** git commit when pr-push-merge or execution-agent is active
- If lint fails after fix: report remaining issues; do NOT block commit for unfixable (e.g., complexity)
- Never invent lint rules—use project config (.eslintrc, eslint.config.js, package.json)

## Integration

- **pr-push-merge**: Run lint-fixer in Phase 4 before commit
- **execution-agent**: Add to PR creation checkpoint
- **five-agent-verification**: Lint pass is one gate

## Output

- Fixed: count of files fixed
- Remaining: list of unfixable issues (file:line)
- Command used: for reproducibility
