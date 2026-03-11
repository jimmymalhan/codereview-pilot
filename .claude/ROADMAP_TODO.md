# ROADMAP 1.0.0 — Self-Maintained To-Do

**Updated by**: Agents, run-24-7, plan-and-execute. Automation consumes this.

---

## Pending Checkpoints (1)

- [x] LS-001 Skeleton component
- [x] LS-006 StepProgressBar component
- [x] PUI-001 Wire SkeletonList into App (OrchestrationDashboard)
- [x] PUI-002 Wire StepProgressBar into App (LoadingOverlay)
- [x] FC-010 WCAG AA (accessibility.css, axe-core tests)
- [x] DT-010 Document design tokens in CLAUDE.md
- [ ] FC-007 Lighthouse ≥90 (CI job commits lighthouse-score.json when ≥90)

---

## Automation Loop

1. Open PRs → post comments, merge when consensus
2. Branch cleanup → delete merged, close stale
3. Roadmap → org-feedback-loop → plan-and-execute
4. Tests → npm test, npm run test:agents
5. Skillset → self-update from feedback
6. Repeat 24/7

---

## External Test Feedback

- **Relevant**: Valid flows — critical feedback on edge cases
- **Irrelevant**: Invalid input, wrong endpoint — upset feedback on UX
- Log to `.claude/local/test-feedback.log`
