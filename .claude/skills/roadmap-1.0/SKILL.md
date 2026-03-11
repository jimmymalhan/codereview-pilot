---
name: roadmap-1.0
description: Pending work for 1.0.x. References FRONTEND_TASK_BREAKDOWN.csv. Run when planning next work or when user asks about roadmap.
---

# Roadmap 1.0 Skill

**Purpose**: Track and automate pending work for 1.0.x releases. Source: `FRONTEND_TASK_BREAKDOWN.csv`. Integrates with full-cycle-automation and repository-audit-to-skillset.

---

## Source

| File | Content |
|------|---------|
| `FRONTEND_TASK_BREAKDOWN.csv` | Phase 1-4 tasks: Design tokens, Motion utilities, Style factory, React core, Component migration, Loading states, etc. |
| `package.json` | Current version (1.0.1) |

---

## Phases (from CSV)

1. **Design Tokens** (DT-001 to DT-010) — Color, typography, motion, spacing, shadow, border-radius
2. **Motion Utilities** (MU-001 to MU-010) — staggerAnimation, generateKeyframes, delayedAnimation, easeAnimation
3. **Style Factory** (SF-001 to SF-013) — generateThemeStyles, createResponsiveStyles, getContrastRatio
4. **React Core** (RC-001 to RC-015) — App.jsx, ThemeProvider, UIStateProvider, Layout, ThemeToggle
5. **React Integration** (RI-001 to RI-007) — index.jsx, ErrorBoundary
6. **Component Migration** (CM-001 to CM-009) — Migrate existing to React Context
7. **Motion Components** (MC-001 to MC-019)
8. **Loading States** (LS-001+) — Skeleton, ProgressBar

---

## When to Invoke

- User asks "what's next for 1.0?" or "roadmap"
- `repository-audit-to-skillset` Phase 2 identifies roadmap gaps
- `plan-and-execute` scopes new frontend work
- `run-the-business` default: check roadmap for unassigned P0 tasks

---

## Automation

- **Read** FRONTEND_TASK_BREAKDOWN.csv for pending tasks (STATUS=pending)
- **Map** task IDs to phases; suggest skill/agent (Design-Team→frontend-engineer, QA-Team→qa-engineer)
- **Output**: `{ pending_count, phase, next_tasks[], suggested_agent }`
- **Do NOT** execute 370+ tasks in one session; batch by phase (e.g. DT-001 to DT-007)

---

## Integration

- `full-cycle-automation`: After branch-cleanup, optionally check roadmap for next P0
- `frontend-engineer`: When creating UI, reference design tokens from CSV
- `code-skill-mapping`: Roadmap tasks → skills (e.g. DT → design-tokens skill when it exists)
