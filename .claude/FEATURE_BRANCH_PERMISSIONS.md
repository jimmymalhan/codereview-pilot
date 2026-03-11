# Feature Branch Permission Policy
**Branch:** `feature/*` only (branch-only workflow)
**Policy:** All changes through branches. Never commit to main. Create feature/* first.
**Status:** ✅ ACTIVE

---

## 🌿 BRANCH-ONLY WORKFLOW (HARD)

**All changes through branches. Never commit directly to main. Create feature/* first. Merge to main only via PR.**

- **main**: No direct commits. If on main, create branch: `git checkout -b feature/<name>`
- **feature/***: Full auto-accept. Execute and report.
- Hook: `is_auto_accept_branch` = feature/* only (main excluded)
- settings.json: main autoAcceptEdits=false

---

## 🔓 PERMISSION LEVEL: MAXIMUM AUTO-EXECUTE

### On `feature/*` only:
```
✅ Auto-accept ALL operations without asking:
  ✅ npm test
  ✅ npm start
  ✅ npm run [any command]
  ✅ git commands (except force-push to main)
  ✅ File edits (src/, tests/, docs/, config/)
  ✅ File creation (any file on feature branch)
  ✅ File deletion (any file on feature branch)
  ✅ npm install / npm ci
  ✅ Bash commands
  ✅ Grep / Glob / Read tools
  ✅ All dangerous operations (rm -rf, etc.)

NO PERMISSION REQUESTS - JUST EXECUTE AND REPORT
```

### On `main` branch (HARD: no direct commits):
```
❌ No direct commits to main
❌ Create feature/* branch first
✅ All work happens on feature/*; merge to main via PR only
```

---

## 🎯 IMPLEMENTATION

### Current Settings
**File:** `.claude/settings.local.json`
```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  }
}
```

**Status:** ✅ ACTIVE - Auto-accept all on feature branch

---

## 📋 WHAT THIS MEANS

### For Editing
```
❌ OLD: "Can I edit src/server.js?"
✅ NEW: [just edit it and report]

❌ OLD: "Should I update CHANGELOG.md?"
✅ NEW: [just update it and report]

❌ OLD: "Is it okay to delete this file?"
✅ NEW: [just delete it and report why]
```

### For Running Commands
```
❌ OLD: "Can I run npm test?"
✅ NEW: [npm test] → report results

❌ OLD: "Should I start the server?"
✅ NEW: [npm start] → test and report

❌ OLD: "Can I install dependencies?"
✅ NEW: [npm install] → verify success
```

### For Committing
```
❌ OLD: "Can I commit these changes?"
✅ NEW: [git commit] → automatically create clean commits

❌ OLD: "Should I clean up before committing?"
✅ NEW: [rm planning docs] → [git commit] → automated cleanup

❌ OLD: "Do you want me to push?"
✅ NEW: [git push] → execute and report—never wait for approval
```

### For Dangerous Operations
```
❌ OLD: "Should I remove this file?"
✅ NEW: [rm file] → verify removal and explain why

❌ OLD: "Can I reset git state?"
✅ NEW: [git reset] → confirm state change

❌ OLD: "Should I run this script?"
✅ NEW: [run script] → report output and results
```

---

## ✅ WHAT YOU'LL SEE NOW

**Instead of asking:**
```
"Can I run npm test?"
```

**You'll see:**
```
Running tests...
[npm test output]
Result: 981/993 passing
Coverage: 89.87%
Continuing with next task...
```

---

## 🚫 NO EXCEPTIONS ON FEATURE BRANCH

On feature branch: NEVER ask. Execute and report.
- Push to origin/feature/* — execute, no wait
- Merge when CI green (auto-merge) — execute, no "merge now"
- All operations — execute, report results

### Clean Commits
- No permission requests for creating commits
- Commits are automatically cleaned (no planning docs, only project-relevant code)
- Commit messages are detailed and focused
- Repository stays clean with zero stale files
- All dangerous file cleanup happens automatically before commit

---

## 🔄 TRANSITION RULES (Run to Vegas)

All branches auto-accept. No transition needed. Execute and report on main and feature/*.

---

## 📝 REMEMBER

**Feature Branch (`feature/*`) and Main:**
- 🟢 Just execute - no asking
- 🟢 Report results immediately
- 🟢 Auto-fix issues and continue
- 🟢 Update docs without asking
- 🟢 Run any command without asking
- 🟢 Maximum efficiency mode

**Main Branch (`main`) — Branch-only (HARD):**
- 🔴 No direct commits
- 🔴 Create feature/* first; merge via PR only

---

**Last Updated:** 2026-03-10
**Status:** ✅ ACTIVE (Run to Vegas)
**Applies To:** main and feature/* — full auto-accept
**Verification:** ten-pass-verification (REVIEW.md + five-agent + npm test + lint) runs before deliver
