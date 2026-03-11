---
name: pr-automation
description: Automate PR creation, multi-PR workflows, and branch management. Use when creating new PRs, coordinating multiple PRs, or automating release workflows.
disable-model-invocation: true
---

# PR Automation Skill

**Purpose**: Automate creation of pull requests, working with multiple PRs, and branch/CI workflows.

**References**:
- [geo-seo-claude skills](https://github.com/zubair-trabzada/geo-seo-claude/tree/main/skills)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)

## Workflow: Create New PR

### Step 1: Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/<short-description>
# or: fix/<issue-number>
```

### Step 2: Changes
- Implement changes per approved plan
- Run `npm test` before committing
- Update `docs/CONFIDENCE_SCORE.md` with test evidence
- Update `CHANGELOG.md` with what changed and why

### Step 3: Commit
```bash
git add -A
git status  # verify
git commit -m "feat: descriptive message"
```

### Step 4: Push and Open PR
```bash
git push -u origin feature/<branch-name>
```

Then open PR via GitHub CLI or web:
- **Title**: `[Type] Short description` (e.g., `[feat] Add skillsets and FE/BE skills`)
- **Body**: What, why, how. CHANGELOG excerpt. Tests run. References to docs.

### Step 5: CI Check
- Wait for CI (GitHub Actions)
- Fix any failures before merge
- Do not merge if red

## Multi-PR Workflow

When multiple PRs depend on each other:

1. **Order by dependency**: Base PR first, dependents second
2. **Branch naming**: `feature/base-change`, `feature/dependent-change`
3. **Base branch**: Dependent PRs use `feature/base-change` as base, not `main`
4. **Document**: In PR body, list dependency chain

Example:
```
PR 1: feature/skillsets-base → main
PR 2: feature/skillsets-fe-be → feature/skillsets-base
PR 3: feature/skillsets-integration → feature/skillsets-fe-be
```

## Quality Gates Before PR

- [ ] `npm test` passes (319+ tests, 60%+ coverage)
- [ ] No `console.log` in production code
- [ ] No commented-out code
- [ ] `docs/CONFIDENCE_SCORE.md` updated
- [ ] `CHANGELOG.md` updated
- [ ] Rollback path documented in PR body or CONFIDENCE_SCORE

## Output Contract (Per CLAUDE.md)

Every PR should support:
- Root cause / what changed
- Evidence (test output)
- Fix plan / what was done
- Rollback (how to revert)
- Tests (what was verified)
- Confidence (score with evidence)

## Invocation

Invoke with: `/pr-automation [create|multi-pr|check]`

- `create` – Create new PR from current branch
- `multi-pr` – Plan dependency order for multiple PRs
- `check` – Run quality gates before pushing
