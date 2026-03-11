---
name: commit-precheck
description: Before EVERY git commit, verify staged files. BLOCK task breakdowns, progress docs, implementation reports, and other non-feature files. Only feature files or template work belong in commits.
---

# Commit Precheck Skill

**Purpose**: Run before every `git commit`. BLOCK commits that include task breakdowns, progress dashboards, implementation reports, or other non-feature files. Keep repo clean—only feature code and templates.

---

## Rule: Check Before Every Commit

**Before running `git commit`**, run:
```bash
bash .claude/hooks/commit-precheck.sh
```
If exit code ≠ 0, **do NOT commit**. Unstage forbidden files with `git restore --staged <file>` and retry, or omit them from the commit. **Deleting** forbidden files (e.g. `git rm --cached`) is allowed—precheck only blocks adding or modifying them.

---

## Forbidden Files (Never Commit)

| Pattern | Reason |
|---------|--------|
| `*TASK_BREAKDOWN*` | Task breakdowns—planning only |
| `FRONTEND_TASK_BREAKDOWN.csv` | Task breakdown CSV |
| `PROGRESS_DASHBOARD*.md` | Progress tracking |
| `IMPLEMENTATION_*.md`, `IMPLEMENTATION_*.txt` | Implementation reports |
| `REFACTORING_*.md` | Refactoring notes |
| `E1-01_*.md`, `PHASE_*_*.md`, `PHASE_*_*.txt` | Architecture/phase output |
| `*_AUDIT_REPORT.md` | Audit reports |
| `LUXURY_UI_FEATURES.md` | Feature planning doc |
| `UI_QA_TEST_SUITE.md` | Test planning doc |
| `data/`, `incidents/`, `logs/`, `reference/` | Runtime data |
| `test-output.log`, `*.log` (in root) | Log files |
| `.claude/local/test-feedback.log` | Test feedback log |
| `.vscode/` | Editor config (optional per team) |

---

## Allowed (Feature / Template)

- `src/`, `tests/` — Feature code
- `package.json`, `package-lock.json` — Deps
- `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `REVIEW.md`, `LICENSE`
- `.claude/skills/`, `.claude/rules/`, `.claude/agents/`, `.claude/hooks/`, `.claude/settings.json`, `.claude/CLAUDE.md`, `.claude/SKILLSETS.md`
- `.github/` — Workflows, checkpoints
- `assets/`, `jest.config.js`, `.gitignore`, `.env.example`
- `scripts/` — Build/test scripts (e.g. `update-readme-status.js`, `continuous-test-matrix.js`)

---

## Integration

- **guardrails.md** — Hard rule: run commit-precheck before every commit
- **check-edits.sh** — Calls commit-precheck when verifying staged changes
- **run-the-business** — Agents run precheck before committing
