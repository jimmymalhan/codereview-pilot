---
name: project-structure
description: Persistent memory layout, shared vs local-only files, .gitignore policy. Use when setting up project or deciding where to store files.
---

## Phase 1: DISCOVER
### Sub-Agent: `LayoutScout` (model: haiku)
- **Tools**: Glob, Read
- **Prompt**: Check .gitignore rules. Check file layout. Identify shared vs local-only files. Find misplaced files (plans in git, secrets exposed).
- **Output**: `{ gitignore_rules[], shared_files[], local_files[], misplaced[] }`
- **Gate**: layout mapped

## Phase 2: PLAN
### Sub-Agent: `LayoutPlanner` (model: haiku)
- **Prompt**: Plan corrections: move misplaced files, update .gitignore, organize directories. Never delete without asking.
- **Output**: `{ moves[], gitignore_adds[], dir_creates[] }`
- **Gate**: plan created

## Phase 3: IMPLEMENT
### Sub-Agent: `LayoutOrganizer` (model: haiku)
- **Tools**: Bash, Write, Edit
- **Prompt**: Execute plan. Move files. Update .gitignore. Create directories. Run `npm test` after.
- **Output**: `{ files_moved[], gitignore_updated, test_pass: boolean }`
- **Gate**: layout organized

## Phase 4: VERIFY
### Sub-Agent: `LayoutVerifier` (model: haiku)
- **Prompt**: Confirm .gitignore is correct. Confirm no secrets in git. Confirm structure matches conventions.
- **Output**: `{ gitignore_ok, secrets_safe, structure_ok }`
- **Gate**: verified

## Phase 5: DELIVER
### Sub-Agent: `LayoutCommitter` (model: haiku)
- **Prompt**: Commit structure changes. Notify user.
- **Output**: `{ commit_sha, changes_summary }`
- **Gate**: committed

---

# Project Structure Skill

**Purpose**: Keep shared vs personal clearly separated. Don't commit private work.

## Shared (Commit-Safe)

| Path | Use |
|------|-----|
| `CLAUDE.md` | Project rules, architecture, build/test |
| `.claude/settings.json` | Shared config |
| `.claude/rules/*.md` | Shared standards |
| `.claude/skills/*/SKILL.md` | Shared project skills |

## Local-Only (Gitignored)

| Path | Use |
|------|-----|
| `.claude/settings.local.json` | Personal permissions |
| `.claude/local/checklists/` | Checklists |
| `.claude/local/plans/` | Plans |
| `.claude/local/reports/` | Reports |
| `.claude/local/feedback/` | Feedback |
| `.claude/agent-memory-local/` | Local memory |
| `.claude/tmp/` | Scratch |
| `docs/private/` | Private docs |

## User-Scope (Not in Repo)

- `~/.claude/agents/role-*.md` – Personal agents
- `~/.claude/skills/*/SKILL.md` – Personal skills

## .gitignore Policy

Never commit:
- Plans, checklists, reports, review notes
- PROJECT_STATUS, TEST_PLAN, CONFIDENCE_SCORE (if local)
- FEEDBACK_LOG, REVIEW_NOTES, EXECUTION_PLAN
- Personal workflow hints, AI attribution

## Do Not Assume

- Files/folders exist
- Repo layout, .claude structure
- Tests pass, localhost exists
- Detect first, create only if justified
