---
name: frontend-engineer
description: UI design, components, design tokens (CSS variables), accessibility (WCAG). Use when creating pages, forms, components, or reviewing frontend. Every element: Normal, Loading, Error states. Project customization via PROJECT.md in skill folder.
---

## Phase 1: DISCOVER
### Sub-Agent: `UIScout` (model: haiku)
- **Tools**: Glob, Grep, Read
- **Prompt**: Find all pages in src/www/pages/, components in src/www/js/, styles in src/www/css/ and src/www/styles/. Check if design tokens (CSS variables) exist. List what's present.
- **Output**: `{ pages[], components[], styles[], tokens_found: boolean }`
- **Gate**: pages listed

## Phase 2: PLAN
### Sub-Agent: `UIPlanner` (model: sonnet)
- **Prompt**: Design which pages/components to add/modify. For each component: define 3 states (Normal, Loading, Error). List accessibility needs. Create checklist.
- **Output**: `{ component_plan[{name, states[3], a11y_needs[]}], checklist[] }`
- **Gate**: every component has 3 states defined

## Phase 3: IMPLEMENT
### Sub-Agent: `ComponentBuilder` (model: haiku)
- **Tools**: Read, Write, Edit
- **Prompt**: Build ONE component at a time. Use CSS variables from design tokens (never hardcode colors). Implement states in order: Normal first, then Loading, then Error. Add ARIA labels.
- **Output**: `{ component, files_changed[], states_implemented[] }`
- **Gate**: 3 states present in code

## Phase 4: VERIFY
### Sub-Agent: `UITester` (model: haiku)
- **Tools**: Bash, Read
- **Prompt**: Run `npm start`. Check server health. Verify page loads on localhost:3000. Check keyboard nav (Tab through elements). Test form submission if applicable.
- **Output**: `{ localhost_ok: boolean, states_verified[], a11y_checks[] }`
- **Gate**: page loads AND states work

## Phase 5: DELIVER
### Sub-Agent: `UIPackager` (model: haiku)
- **Prompt**: Describe what's visible on localhost (evidence). Update CHANGELOG. Commit. Notify user: "Page live at localhost:3000/[path]. Refresh to see changes."
- **Output**: `{ pages_verified[], evidence[], commit_sha, server_status }`
- **Gate**: localhost verified

## Contingency
IF page won't load → check console for errors → fix ONE error → restart server → retry (max 2).
IF design tokens missing → create minimal token set from existing CSS → continue.

## Live Feedback Handler
IF user reports "button does nothing" or "page is blank" → classify as High → hotfix (wire handler or fix render) → restart if backend touched → verify on localhost → notify user.

## Server Lifecycle
After editing HTML/CSS/JS in src/www/: restart server if using Express static serving. Verify page loads after restart.

---

# Frontend Engineer Skill

**Purpose**: Enable frontend domain expertise for building production UI that aligns with CodeReview-Pilot standards.

**When to use**: Creating or reviewing frontend features, pages, components, forms, dashboards, or design systems.

**Project customization**: Add `.claude/skills/frontend-engineer/PROJECT.md` with project-specific rules (design tokens, API patterns, component paths). See docs/SKILLSETS.md → "Add Skills to Customize FE/BE".

## Create → Handle → Run (E2E)

### Create
- Add pages under `src/www/pages/`
- Add components/JS under `src/www/js/`
- Add styles under `src/www/css/` or `src/www/styles/`
- Wire API calls via `App.api()` or fetch
- Use design tokens (no hardcoded colors/fonts)

### Handle
- Implement Normal, Loading, Error for every interactive element
- Add labels, validation, `aria-describedby` for forms
- Align error display with backend `{ error, message }`
- Ensure skip link, keyboard nav, focus visible

### Run
```bash
npm start
# Open http://localhost:3000
# Test: form submit, loading, success, error, retry
```
- Verify every new page reachable and functional
- Test keyboard nav (Tab, Enter, Escape)
- Capture evidence for CONFIDENCE_SCORE

## Domain Expertise

As a frontend engineer with this skill, you are expert in:
- HTML/CSS/JS (vanilla and structured)
- Design tokens and theming
- Accessibility (WCAG 2.1 AA basics)
- Component states (Normal, Loading, Error)
- Form validation and error display
- API integration from the client
- Responsive and progressive enhancement

## Must-Do Checklist

### 1. Design Tokens
Use project design tokens from `src/www/` (CSS variables):
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-blue`, `--accent-blue-light`, `--accent-green`, `--accent-red`
- `--radius-sm`, `--radius-md`, `--font-mono`
- Do not hardcode colors or fonts

### 2. Every Page Must Have
- **Purpose** – One-sentence "what does this page do?"
- **Why it matters** – Business outcome for the user
- **Obvious next action** – Primary button or CTA visible

### 3. Every Interactive Component Must Have
- **Normal state** – Readable, clickable, current
- **Loading state** – Spinner, message, disabled button
- **Error state** – Clear message, icon, retry button

### 4. Forms
- Label every input
- Validate client-side when possible
- Show errors inline with clear messages
- Disable submit while loading
- Provide `aria-describedby` for help text

### 5. Accessibility
- `role`, `aria-label`, `aria-current` where appropriate
- Skip link for main content
- Keyboard navigation (Tab, Enter, Escape)
- Sufficient color contrast
- Focus visible on interactive elements

### 6. API Integration
- Handle loading and error states
- Show user-friendly error messages (not raw JSON)
- Retry button on transient failures
- Align with backend error format: `{ error, message, status }`

## File Locations

| Type | Path |
|------|------|
| Pages | `src/www/pages/` |
| JS | `src/www/js/` |
| CSS | `src/www/css/` |
| Styles | `src/www/styles/` |

## Related Skills

- `ui-quality` – Full UI checklist
- `evidence-proof` – Test on localhost before claiming done

## Verification

Before claiming done:
- [ ] Used design tokens (no hardcoded colors/fonts)
- [ ] Every page has purpose, why, next action
- [ ] Every component has Normal, Loading, Error
- [ ] Forms have labels, validation, error display
- [ ] Accessibility basics (roles, focus, skip link)
- [ ] Tested on `npm start` at http://localhost:3000
- [ ] Aligns with `.claude/rules/ui.md` and `ui-proof.md`
