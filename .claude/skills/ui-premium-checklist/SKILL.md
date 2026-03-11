---
name: ui-premium-checklist
description: Premium UI bar - product story, homepage sections, frontend-backend alignment, cinematic feel. Use when building or refining homepage and product UI.
---

## Phase 1: DISCOVER
### Sub-Agent: `HomepageScout` (model: haiku)
- **Tools**: Glob, Grep, Read
- **Prompt**: Find all homepage sections in src/www/index.html and related files. Check which sections exist, which are missing from the product story checklist below. Check design tokens.
- **Output**: `{ existing_sections[], missing_sections[], design_tokens_ok: boolean }`
- **Gate**: sections mapped

## Phase 2: PLAN
### Sub-Agent: `SectionPlanner` (model: sonnet)
- **Prompt**: Design section order, copy, CTA for each missing section. Ensure frontend-backend alignment: only show UI for implemented backend features. Checklist per section.
- **Output**: `{ section_plan[{name, copy, cta, backend_ready: boolean}], checklist[] }`
- **Gate**: plan covers all product story elements

## Phase 3: IMPLEMENT
### Sub-Agent: `SectionBuilder` (model: haiku)
- **Tools**: Read, Write, Edit
- **Prompt**: Build ONE section at a time. Use design tokens. Implement all states. If backend not ready for a section → skip that section (never market unsupported features).
- **Output**: `{ section_built, files_changed[], backend_aligned: boolean }`
- **Gate**: section renders AND backend supports it

## Phase 4: VERIFY
### Sub-Agent: `HomepageTester` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Start server. Verify every section loads on localhost:3000. Test every CTA button. Check keyboard nav. Describe what's visible (evidence).
- **Output**: `{ localhost_ok, sections_verified[], ctas_working[], a11y_ok: boolean }`
- **Gate**: all sections load AND CTAs work

## Phase 5: DELIVER
### Sub-Agent: `HomepagePackager` (model: haiku)
- **Prompt**: Update CHANGELOG. Commit. Notify user: "Homepage live at localhost:3000. [N sections, M CTAs verified]."
- **Output**: `{ commit_sha, sections_count, server_status }`
- **Gate**: committed AND localhost verified

## Contingency
IF section won't render → check for syntax errors in HTML → fix ONE error → restart server → retry (max 2).
IF backend not ready for a section → SKIP that section with note → never show UI for unimplemented backend.

## Live Feedback Handler
IF user reports "homepage looks wrong" or "section is broken" → classify, hotfix if <= 3 files, restart server, verify.

---

# UI Premium Checklist Skill

**Purpose**: Make UI premium, cinematic, aligned to backend capability.

## Product Story (Homepage)

- What the product is
- What problem it solves
- Who it is for
- Why it matters now
- How it works step by step
- What actions user can take
- What outcomes user gets
- What makes it different

## Critical Rule: Frontend-Backend Alignment

- **Only show UI for implemented backend capability**
- Every CTA → real flow
- Every feature card → real backend
- If backend incomplete → hide, gate, or relabel UI
- Never market unsupported features

## Sections to Add/Improve

- Hero, How it works, What you can do, Why now
- Who it is for, Use cases, What happens after click
- Real-time diagnosis (not canned)
- Why this is different, CTAs, FAQ

## Quality Bar

- Every button, link, form, tab, modal tested
- Happy path, validation, loading, error, retry
- No dead buttons, broken routes, console errors
- Accessibility, responsive
- Test localhost before handing off
