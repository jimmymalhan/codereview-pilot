# Claude Code Ultra-Advance: Reference & Execution

**Purpose**: Align CodeReview-Pilot skills and agents with [Claude Code](https://code.claude.com/docs) patterns. Use for review and execution of ultra-automated workflows.

**Claude Code docs index**: https://code.claude.com/docs/llms.txt

---

## 1. Claude Code Alignment

### 1.1 Skills (SKILL.md)

| Claude Code Pattern | Our Implementation | Reference |
|---------------------|--------------------|-----------|
| YAML frontmatter: `name`, `description` | All `.claude/skills/*/SKILL.md` | [Skills](https://code.claude.com/docs/en/skills) |
| `disable-model-invocation: true` | deploy, fix-issue-style workflows | [Control who invokes](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill) |
| `context: fork` + `agent: Explore` | deep-research, pr-summary patterns | [Run skills in subagent](https://code.claude.com/docs/en/skills#run-skills-in-a-subagent) |
| `argument-hint`, `$ARGUMENTS` | idea-to-production, run-the-business | [Pass arguments](https://code.claude.com/docs/en/skills#pass-arguments-to-skills) |
| Supporting files (reference.md, scripts/) | Move templates to skill subdirs | [Supporting files](https://code.claude.com/docs/en/skills#add-supporting-files) |
| `allowed-tools` for read-only | Explore agent, safe-reader pattern | [Restrict tool access](https://code.claude.com/docs/en/skills#restrict-tool-access) |
| Dynamic context: `!`command`` | Fetch PR diff, live data | [Inject dynamic context](https://code.claude.com/docs/en/skills#inject-dynamic-context) |

**Bundled skills we can leverage**: `/batch` (git worktrees, 5–30 units), `/simplify` (3 review agents), `/loop` (recurring), `/debug`.

### 1.2 Subagents

| Claude Code Pattern | Our Implementation | Reference |
|--------------------|--------------------|-----------|
| `description` for auto-delegation | All `.claude/agents/*.md` | [Subagents](https://code.claude.com/docs/en/sub-agents) |
| `tools` allowlist / `disallowedTools` | Explore: Read, Grep, Glob only | [Control capabilities](https://code.claude.com/docs/en/sub-agents#control-subagent-capabilities) |
| `model: haiku` for cheap tasks | Explore, QA, FixAgent | [Choose model](https://code.claude.com/docs/en/sub-agents#choose-a-model) |
| `permissionMode: bypassPermissions` | Use sparingly for automation | [Permission modes](https://code.claude.com/docs/en/sub-agents#permission-modes) |
| `skills` preload | General-Purpose, Plan | [Preload skills](https://code.claude.com/docs/en/sub-agents#preload-skills-into-subagents) |
| `memory: user` for cross-session learning | Optional for CodeReviewer | [Persistent memory](https://code.claude.com/docs/en/sub-agents#enable-persistent-memory) |
| `Agent(agent_type)` restrict spawns | Coordinator patterns | [Restrict spawns](https://code.claude.com/docs/en/sub-agents#restrict-which-subagents-can-be-spawned) |

**Built-in agents**: Explore (read-only, Haiku), Plan (research), general-purpose (all tools).

### 1.3 Hooks

| Claude Code Pattern | Our Implementation | Reference |
|--------------------|--------------------|-----------|
| PreToolUse (Bash) | branch-aware-permissions | [Hooks](https://code.claude.com/en/hooks) |
| PostToolUse (Edit\|Write) | update-confidence, check-edits | [Hook events](https://code.claude.com/en/hooks#hook-events) |
| PreToolUse filter test output | Reduce token from verbose logs | [Costs: Offload to hooks](https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills) |
| SubagentStart / SubagentStop | Setup/cleanup per agent | [Subagent hooks](https://code.claude.com/docs/en/sub-agents#define-hooks-for-subagents) |

### 1.4 Common Workflows (Claude Code)

| Workflow | Claude Code Doc | Our Skill |
|----------|-----------------|-----------|
| Plan Mode (read-only, then implement) | [Plan Mode](https://code.claude.com/en/common-workflows#use-plan-mode-for-safe-code-analysis) | plan-and-execute |
| Explore → Plan → Implement → Commit | [Refactor workflow](https://code.claude.com/en/common-workflows) | idea-to-production |
| Create PR, resume from PR | [Create PR](https://code.claude.com/en/common-workflows#create-pull-requests) | pr-push-merge |
| Parallel git worktrees | [Parallel sessions](https://code.claude.com/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees) | /batch pattern, multi-pr-coordinator |
| Extended thinking | [Thinking mode](https://code.claude.com/en/common-workflows#use-extended-thinking-thinking-mode) | Add "ultrathink" to critical skills if needed |

### 1.5 Best Practices (Claude Code)

| Practice | Doc | Our Alignment |
|----------|-----|---------------|
| Give verification criteria | [Best practices](https://code.claude.com/en/best-practices) | evidence-proof, npm test before done |
| Explore first, then plan, then code | Same | plan-and-execute phases 1–2 before 3 |
| Specific context in prompts | Same | project-guardrails, file:line citations |
| CLAUDE.md concise, skills for specialized | Same | Keep CLAUDE.md <500 lines; skills on-demand |
| Hooks for deterministic actions | Same | branch-aware-permissions, update-confidence |
| CLI tools (gh, aws) over MCP when possible | [Configure environment](https://code.claude.com/en/best-practices#configure-your-environment) | gh for PR/CI in live-watchdog |

### 1.6 Costs (Claude Code)

| Strategy | Doc | Our Alignment |
|----------|-----|---------------|
| Grep before read | [Reduce token usage](https://code.claude.com/docs/en/costs#reduce-token-usage) | cost-guardrails, execution-agent |
| Delegate verbose ops to subagents | Same | Explore for discovery; QA for tests |
| Haiku for simple | Same | Explore, QA, FixAgent |
| Move CLAUDE.md content to skills | Same | SKILL.md under 500 lines |
| PreToolUse hook to filter test output | Same | Optional: filter-test-output.sh |
| Write specific prompts | Same | execution-agent: smallest task |

---

## 2. Execution Checklist (Review & Run)

### 2.1 Pre-Flight

- [ ] `npm test` passes
- [ ] On `feature/*` branch for auto-accept
- [ ] `AUTO_MERGE=true`, `ULTRA_AUTO=true` in settings or env

### 2.2 Invoke Run-the-Business

```
Add [feature] / Fix [bug] / Implement [task]
```

Default: idea-to-production + live-watchdog + auto-merge. No approval gates.

### 2.3 Phase Gates (Never Wait)

| Phase | Gate | Skill |
|-------|------|-------|
| DISCOVER | scope identified, files listed | plan-and-execute |
| PLAN | checklist ≥ 1 item | plan-and-execute |
| IMPLEMENT | phases complete | e2e-orchestrator |
| VERIFY | 5-agent PASS, tests green | five-agent-verification |
| DELIVER | PR real, merge when CI green | pr-push-merge, auto-merge |

### 2.4 Post-Delivery

- [ ] localhost URL real and working
- [ ] PR link real (gh pr view)
- [ ] CHANGELOG, CONFIDENCE_SCORE updated
- [ ] skills-self-update if fixes applied

---

## 3. Agent Teams vs Subagents

| Use subagents when | Use agent teams when |
|-------------------|----------------------|
| Focused task; only result matters | Teammates need to share findings, challenge each other |
| Quick research, verify claim, review file | Research with competing hypotheses, parallel code review |
| Lower token cost | Higher cost; each teammate is separate instance |

**Enable**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings. See [Agent Teams](https://code.claude.com/docs/en/agent-teams).

## 4. Gaps Addressed

| Gap | Status |
|-----|--------|
| `context: fork` skills | Added pr-summary with fork + dynamic context |
| `!`command`` preprocessing | pr-summary uses it |
| PreToolUse filter test output | filter-test-output.sh added (optional hook) |
| REVIEW.md | Added for Code Review customization |
| lint-fixer | Added; run before commit |
| handoff-protocol schema | Validator added |

---

## 5. Optional: Filter Test Output Hook

To reduce token cost when running tests, add to settings.json:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "bash .claude/hooks/filter-test-output.sh"}
        ]
      }
    ]
  }
}
```

Merge with existing PreToolUse (branch-aware-permissions). Order matters.

## 6. References

| Doc | URL |
|-----|-----|
| Claude Code overview | https://code.claude.com/docs |
| Skills | https://code.claude.com/docs/en/skills |
| Subagents | https://code.claude.com/docs/en/sub-agents |
| Common workflows | https://code.claude.com/en/common-workflows |
| Best practices | https://code.claude.com/en/best-practices |
| Costs | https://code.claude.com/docs/en/costs |
| Hooks | https://code.claude.com/en/hooks |
| Permissions | https://code.claude.com/en/permissions |
| Memory (CLAUDE.md) | https://code.claude.com/en/memory |

---

## 7. Related

- [SKILLSETS.md](./SKILLSETS.md) — Full skill reference
- [ULTRA_ADVANCE_REVIEW.md](./ULTRA_ADVANCE_REVIEW.md) — Roadmap, gaps, review checklist
