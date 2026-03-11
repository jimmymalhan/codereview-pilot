---
name: github-agent-identities
description: Each agent has its own GitHub identity. Agents post PR comments and commits as distinct contributors. Convince agents in PR threads before merge.
---

# GitHub Agent Identities (HARD)

**Purpose**: Each agent/sub-agent posts to GitHub as a **distinct contributor**. PR comments and commits show multiple different authors—CodeReviewer, APIValidator, EvidenceReviewer, QAReviewer, Critic, etc. Agents critique; author convinces them in PR threads before commit/merge.

---

## Rule (HARD)

- **One identity per agent** — CodeReviewer, APIValidator, EvidenceReviewer, QAReviewer, Critic, and other sub-agents each use their own GitHub token when posting.
- **Multiple contributors visible** — PR must show comments from different GitHub users (different agent accounts).
- **Convince before merge** — When an agent BLOCKs, author addresses. Agent re-checks and posts follow-up (PASS or still BLOCK). No merge until all agents are convinced.

---

## Agent → GitHub Identity Mapping

| Agent | GitHub Username | Token Env Var | Use For |
|-------|-----------------|---------------|---------|
| CodeReviewer | @codereview-pilot-codereviewer | `GH_TOKEN_CODERREVIEWER` | Pass 1, PR comments |
| APIValidator | @codereview-pilot-apivalidator | `GH_TOKEN_APIVALIDATOR` | Pass 2, PR comments |
| EvidenceReviewer | @codereview-pilot-evidence | `GH_TOKEN_EVIDENCE_REVIEWER` | Pass 3, PR comments |
| QAReviewer | @codereview-pilot-qa | `GH_TOKEN_QA_REVIEWER` | Pass 4, PR comments |
| Critic | @codereview-pilot-critic | `GH_TOKEN_CRITIC` | Pass 5, PR comments |
| REVIEW Always | @codereview-pilot-review | `GH_TOKEN_REVIEW_ALWAYS` | Pass 6 |
| REVIEW Style | @codereview-pilot-style | `GH_TOKEN_REVIEW_STYLE` | Pass 7 |
| npm test | @codereview-pilot-ci | `GH_TOKEN_CI` | Pass 8 |
| Lint | @codereview-pilot-lint | `GH_TOKEN_LINT` | Pass 9 |
| REVIEW Project | @codereview-pilot-project | `GH_TOKEN_REVIEW_PROJECT` | Pass 10 |

**Fallback**: If agent-specific token not set, use `GH_TOKEN` or `GITHUB_TOKEN`. Comment body MUST still identify agent: `**[CodeReviewer]** PASS — ...`

---

## Posting PR Comments (Per-Agent Token)

```bash
# CodeReviewer posts (Pass 1)
GH_TOKEN="${GH_TOKEN_CODERREVIEWER:-$GH_TOKEN}" gh pr comment $PR_NUMBER --body "**[CodeReviewer]** PASS — DRY, style OK. No issues."

# APIValidator posts (Pass 2)
GH_TOKEN="${GH_TOKEN_APIVALIDATOR:-$GH_TOKEN}" gh pr comment $PR_NUMBER --body "**[APIValidator]** BLOCK — Endpoint /api/X missing error format."

# EvidenceReviewer posts (Pass 3)
GH_TOKEN="${GH_TOKEN_EVIDENCE_REVIEWER:-$GH_TOKEN}" gh pr comment $PR_NUMBER --body "**[EvidenceReviewer]** PASS — All file:line citations valid."

# QAReviewer posts (Pass 4)
GH_TOKEN="${GH_TOKEN_QA_REVIEWER:-$GH_TOKEN}" gh pr comment $PR_NUMBER --body "**[QAReviewer]** PASS — npm test 319/319. Coverage OK."

# Critic posts (Pass 5)
GH_TOKEN="${GH_TOKEN_CRITIC:-$GH_TOKEN}" gh pr comment $PR_NUMBER --body "**[Critic]** APPROVED — confidence 0.87, all 6 fields present."
```

**Script helper** (optional): `.claude/scripts/gh-pr-comment-as-agent.sh`
```bash
# Usage: gh-pr-comment-as-agent.sh <agent_name> <pr_number> "<body>"
# Sets GH_TOKEN from agent's env var, then runs gh pr comment
```

---

## Git Commits (Per-Agent Author)

For commits made by a specific agent:

```bash
git -c user.name="CodeReviewer" -c user.email="codereviewer@codereview-pilot.bot" commit -m "fix: address CodeReviewer feedback"
git -c user.name="APIValidator" -c user.email="apivalidator@codereview-pilot.bot" commit -m "fix: align error format per APIValidator"
```

**Author mapping** (for commit attribution):
| Agent | user.name | user.email |
|-------|-----------|------------|
| CodeReviewer | CodeReviewer | codereviewer@codereview-pilot.bot |
| APIValidator | APIValidator | apivalidator@codereview-pilot.bot |
| EvidenceReviewer | EvidenceReviewer | evidencereviewer@codereview-pilot.bot |
| QAReviewer | QAReviewer | qareviewer@codereview-pilot.bot |
| Critic | Critic | critic@codereview-pilot.bot |

---

## Setup: Create Machine User Accounts

1. **Create GitHub accounts** (or use GitHub App for org):
   - codereview-pilot-codereviewer
   - codereview-pilot-apivalidator
   - codereview-pilot-evidence
   - codereview-pilot-qa
   - codereview-pilot-critic
   - (Optional: more for REVIEW passes, CI, Lint)

2. **Generate PATs** (Personal Access Tokens):
   - Each account: Settings → Developer settings → Personal access tokens
   - Scope: `repo` (full control)
   - Store in `.env` (never commit):
   ```
   GH_TOKEN_CODERREVIEWER=ghp_xxx
   GH_TOKEN_APIVALIDATOR=ghp_xxx
   GH_TOKEN_EVIDENCE_REVIEWER=ghp_xxx
   GH_TOKEN_QA_REVIEWER=ghp_xxx
   GH_TOKEN_CRITIC=ghp_xxx
   ```

3. **Add accounts as repo collaborators** (read/write) or ensure PAT has access.

4. **Optional**: Use fewer accounts (e.g. 5 for five-agent) and share tokens for REVIEW passes if preferred.

---

## Convincing Flow (Critique → Response → Re-check)

When an agent BLOCKs:

1. **Agent posts**: `**[APIValidator]** BLOCK — Endpoint /api/X missing error format.`
2. **Author fixes** code, commits (or posts reply): "Fixed in commit abc123. Error format added."
3. **Agent re-runs**, posts follow-up: `**[APIValidator]** Re-check: PASS. Error format aligned.`
4. **Repeat** until all agents PASS. No merge until every agent has approved.

**Reply pattern**: Agent can reply to its own comment, or post new comment with "Re-check:" prefix. PR thread shows the discussion.

---

## Integration

- **ten-pass-verification**: Each pass uses agent-specific `GH_TOKEN` when posting.
- **five-agent-verification**: Each agent uses its token for `gh pr comment`.
- **pr-comments-live**: When posting as specific agent, use that agent's token.
- **consensus-gates**: "Multiple contributors" = different GitHub identities (different tokens).
