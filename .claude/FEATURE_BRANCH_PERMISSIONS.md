# Feature Branch Permission Policy
**Branch:** `feature/integration-website`
**Policy:** AUTO-EXECUTE ALL OPERATIONS - NO PERMISSION REQUESTS
**Status:** ✅ ACTIVE

---

## 🔓 PERMISSION LEVEL: MAXIMUM AUTO-EXECUTE

### On `feature/integration-website`:
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

### On `main` branch:
```
❌ ALWAYS ask for permission before:
  ❌ git push to main
  ❌ Creating/merging PRs to main
  ❌ Any state-changing commands
  ❌ Deleting files
  ❌ Modifying critical files (package.json, CLAUDE.md)

WAIT FOR USER APPROVAL - NEVER auto-execute on main
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
✅ NEW: [Report commit status, await user approval for main branch push]
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

## 🚫 EXCEPTIONS (Still Ask)

Even on feature branch, I WILL ask permission for:
1. **Merging to main** - requires your approval
2. **Pushing to main** - requires your approval
3. **Pushing to origin/feature/integration-website** - report commit status, wait for approval

**Note:** On feature branch, I'll execute and then report, rather than ask first.

### Clean Commits
- No permission requests for creating commits
- Commits are automatically cleaned (no planning docs, only project-relevant code)
- Commit messages are detailed and focused
- Repository stays clean with zero stale files
- All dangerous file cleanup happens automatically before commit

---

## 🔄 TRANSITION RULES

### Before Switching to Main
1. Update `.claude/settings.local.json` to `"defaultMode": "default"`
2. Then I'll ask for permission again (safe mode on main)

### If You Switch to Main Without Updating Settings
1. I will detect the main branch
2. I will switch back to asking for permission automatically
3. This is a safety feature

---

## 📝 REMEMBER

**Feature Branch (`feature/integration-website`):**
- 🟢 Just execute - no asking
- 🟢 Report results immediately
- 🟢 Auto-fix issues and continue
- 🟢 Update docs without asking
- 🟢 Run any command without asking
- 🟢 Maximum efficiency mode

**Main Branch (`main`):**
- 🔴 Always ask first
- 🔴 Wait for approval
- 🔴 Never auto-push
- 🔴 Safety first
- 🔴 Conservative mode

---

**Last Updated:** 2026-03-09
**Status:** ✅ ACTIVE
**Applies To:** feature/integration-website branch only
**Exceptions:** Merge/push to main always require approval
