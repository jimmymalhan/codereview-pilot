# YouTube-Derived Skill Upgrades

**Source**: Transcripts from FE/BE skills, Anthropic deep dive, Claude official, Nate Herk masterclass, Multi-PR/PR automation. Extracted patterns for upgrading CodeReview-Pilot skills.

---

## 1. Six-Step Skill Building Framework (Nate Herk)

| Step | Action |
|------|--------|
| 1. **Name & trigger** | What is it called? Natural-language phrase that fires it |
| 2. **Goal** | One sentence: what will this accomplish by the end? |
| 3. **Step-by-step** | Exact manual process, order, decisions |
| 4. **Reference files** | What context? Style guides, brand assets, current priorities |
| 5. **Rules** | What could go wrong? Guardrails and constraints |
| 6. **Self-improvement loop** | Run → watch → feedback → fix skill → repeat |

**Apply**: Use when creating new skills or auditing existing ones. Add "Six-step checklist" to skills-self-update.

---

## 2. Progressive Context Loading (Anthropic, Nate Herk)

**Level 1**: Search phase – only `name` + `description` (YAML frontmatter, ~100 tokens)  
**Level 2**: Match found – read full SKILL.md  
**Level 3**: On demand – load scripts, references, templates only when needed

**Implications**:
- Keep frontmatter clear and specific for matching
- Move detailed material to `reference.md`; keep SKILL.md <500 lines
- Point to paths in skill; reference files can live outside skill folder

---

## 3. Token & Cost Savings (Nate Herk, Zubair)

| Pattern | Action |
|---------|--------|
| **Hardcode constants** | List IDs, API endpoints, env keys in skill instead of fetching every run |
| **Reference doc over web search** | Scrape docs to `reference.md`; read file instead of HTTP |
| **Subagent delegation** | Delegate heavy lookups to specialized subagent; main agent gets summary only |
| **Scripts in skill** | Save Python/Node scripts inside skill; reuse instead of regenerate |

**Apply**: backend-engineer, retriever, critic – add constants/reference pattern. pr-push-merge – hardcode gh repo paths if stable.

---

## 4. Feedback Cycle (All Videos)

```
Invoke skill → Watch agent work → Give feedback → Fix skill → Run again
```

- First 5–10 runs: watch closely; identify wasted tokens, wrong order, missing context
- Add rules for repeated mistakes
- Add reference files for missing tone/style/context
- Skills improve with use

**Apply**: skills-self-update already captures post-fix. Add "feedback-cycle" section: after each run, optionally review and propose skill edits.

---

## 5. When to Build a Skill (Claude Official)

> "If you find yourself explaining the same thing to Claude repeatedly, that's a skill waiting to be written."

- Repeating prompts → skill
- Same process, different inputs → skill
- Team standards (commit format, PR review structure) → skill

---

## 6. Frontmatter Options (Nate Herk, Claude Docs)

| Key | Use |
|-----|-----|
| `disable-model-invocation` | Skill triggers too often; side-effect-only |
| `allowed-tools` | Restrict to Read, Grep, Glob for read-only skills |
| `argument-hint` | Guide required args |
| `user-invocable: false` | Background/knowledge skill; only via other skills |
| `model` | Force Haiku for cheap, Sonnet for complex |
| `context: fork` | Run in subagent |
| `agent` | Tie to specific agent |

---

## 7. Parallel Subagent Pattern (Zubair GEO Audit)

- Phase 2: "Main contractor hires 5 subcontractors"
- Run 5 subagents in parallel, each a different task
- Main skill orchestrates; subagents return summaries

**Apply**: plan-and-execute, e2e-orchestrator – already use 5–10 subagents/phase. Ensure parallel where possible (dag-executor).

---

## 8. Skill Location: Project vs Global

- **Project** (`.claude/skills/`): Team standards, repo-specific
- **Global** (`~/.claude/skills/`): Personal preferences, commit style, tone – follow you everywhere

---

## 9. Testing & Debugging Fixes (Nate Herk)

| Symptom | Fix |
|---------|-----|
| Wrong steps or order | Edit SKILL.md instructions |
| Missing tone/style/context | Add reference files |
| Same mistake repeatedly | Add rule |
| Struggles with tool/MCP | Create reference doc |
| Skill not triggering | Check YAML; make description more specific |
| Skill triggers too often | `disable-model-invocation: true` |
| Works but could improve | Run repeatedly; nitpick; refine |

---

## 10. References (Video URLs)

| Video | ID | Focus |
|-------|-----|-------|
| Skills for FE/BE | wqH1hTkA6qg | GEO audit, 5 parallel subagents |
| Anthropic deep dive | CEvIs9y1uog | Skills = folders, scripts as tools, progressively disclosed |
| What are skills? | bjdBVZa66oU | Personal vs project, on-demand loading |
| Master 95% in 28 min | zKBPwDpBfhs | Six-step framework, feedback cycle, token savings |
| PR automation | bjdBVZa66oU | (Claude official) |
| Multi-PR workflows | zKBPwDpBfhs | (Nate Herk) |

---

## 11. Applied Upgrades (This Repo)

- [ ] Add six-step checklist to skills-self-update
- [ ] Add feedback-cycle guidance to SKILLSET_UPGRADE_ROADMAP
- [ ] Audit skills >400 lines → split to reference.md
- [ ] Add argument-hint to skills with required args
- [ ] Create skill-builder meta-skill (optional) – helps build new skills via guided questions
