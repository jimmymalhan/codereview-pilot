---
name: branch-permissions
description: Branch-aware auto-accept. On feature branches: auto-allow edits and safe commands. On main/master: ask for approval. Use .claude/settings.local.json and hooks.
disable-model-invocation: true
---

## Phase 1: DISCOVER
### Sub-Agent: `BranchDetector` (model: haiku)
- **Tools**: Bash
- **Prompt**: Identify current branch: `git branch --show-current`. Check if feature/* or main/master. Read .claude/settings.json for branch permissions.
- **Output**: `{ branch, is_feature: boolean, permissions }`
- **Gate**: branch identified

## Phase 2: PLAN
### Sub-Agent: `PermissionMapper` (model: haiku)
- **Prompt**: Map branch to permission set. feature/* → auto-accept. main/master → ask for approval. List what's auto vs ask.
- **Output**: `{ auto_accept[], ask_approval[], branch_type }`
- **Gate**: permissions mapped

## Phase 3: IMPLEMENT
### Sub-Agent: `PermissionEnforcer` (model: haiku)
- **Prompt**: Apply permissions. On feature/*: proceed without prompts. On main: require confirmation for edits/bash.
- **Output**: `{ permissions_applied, branch }`
- **Gate**: permissions active

## Phase 4: VERIFY
### Sub-Agent: `PermissionVerifier` (model: haiku)
- **Prompt**: Verify hook exists and works: `.claude/hooks/branch-aware-permissions.sh`. Confirm settings match.
- **Output**: `{ hook_exists: boolean, settings_match: boolean }`
- **Gate**: verified

## Phase 5: DELIVER
### Sub-Agent: `PermissionReporter` (model: haiku)
- **Prompt**: Output current permissions state to user.
- **Output**: `{ branch, auto_actions[], ask_actions[] }`
- **Gate**: user informed

---

# Branch-Aware Permissions Skill

**Purpose**: Auto-accept on feature branches; ask on main/master.

## Behavior

### If branch is feature/* (any feature branch)
- **Auto-accept end-to-end** – Run the business without permission prompts
- Auto-allow: Edit, Write, Bash for all task work
- Auto-allow: git add, git commit, **git push** (to feature branch)
- Auto-allow: npm install, npm test, npm run, npm start, node
- **Still ASK for**: git reset --hard, git merge main, rm -rf, .env/secrets, deploy, npm publish

### If branch is main/master
- Do NOT use bypass
- ASK for edits and bash that change repo state
- Allow read-only inspection without approval

## Implementation

1. Use `.claude/settings.local.json` (local only, not committed)
2. Use PreToolUse hook to check `git branch --show-current`
3. Choose allow vs ask based on branch

## Toggle Off

```bash
rm .claude/settings.local.json
```

## Required

- Keep config local to machine
- Do not block work; ask on protected branches
- Document which actions are auto vs ask
