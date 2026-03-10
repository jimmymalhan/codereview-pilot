# UI Quality Skill

**Purpose**: Build production-grade UI that non-technical users trust immediately.

**When to use**: Building or updating user-facing pages, forms, dashboards.

## Checklist: Every Page Must Have

### 1. Clear Purpose (One Sentence)
**What**:  "What does this page do?"

Examples:
- ✅ "Submit a system failure and get root cause analysis"
- ✅ "View the status of previous diagnosis requests"
- ❌ "Orchestration interface" (too technical)
- ❌ Missing purpose entirely

### 2. Why It Matters (Business Value)
**Why**: "What's the outcome for the user?"

Examples:
- ✅ "Get root cause, fix plan, and recovery steps"
- ✅ "Track progress and see when analysis is complete"
- ❌ "Execute 4-agent pipeline" (too technical)
- ❌ "Leverage orchestration" (empty)

### 3. Obvious Next Action
**Action**: "What should I do right now?"

Examples:
- ✅ [Submit Incident] button, prominently displayed
- ✅ [Retry Analysis] button after error
- ✅ [Download Report] button on results
- ❌ Multiple equally-important buttons (confusing)
- ❌ No clear button (hidden or unlabeled)

## UI States: Required for Every Component

Every interactive element must show:

### 1. **Normal State**
- Text is readable
- Button is clickable
- Form is visible
- Data is current

### 2. **Loading State**
- Spinner shows
- Message updates ("Analyzing incident...", "Running tests...")
- Button disabled
- Estimated time if known

```html
✅ GOOD:
<div class="spinner"></div>
<p>Analyzing your incident... (estimated 30 seconds)</p>

❌ BAD:
<p>Loading...</p>
```

### 3. **Error State**
- Clear error message
- Icon and color (red)
- Why it failed
- What to do next
- Retry button

```html
✅ GOOD:
<div class="error">
  ⚠️ Network error
  Your internet connection was interrupted.
  Try again or check your network.
  [Retry Now]
</div>

❌ BAD:
<p>Error 503</p>
```

### 4. **Success State**
- Confirmation message
- What happened
- Next steps
- Clear visual feedback

```html
✅ GOOD:
<div class="success">
  ✓ Analysis complete
  Root cause: Database connection timeout
  Next: Review fix plan and tests below
</div>

❌ BAD:
<p>Done</p>
```

### 5. **Empty State**
- Helpful message
- Example input
- Clear action
- No confusion

```html
✅ GOOD:
<div class="empty">
  <p>No incidents yet</p>
  <p>Example: "Database returns 500 errors after 2PM"</p>
  [Submit Your First Incident]
</div>

❌ BAD:
<p>No data</p>
```

### 6. **Disabled State**
- Grayed out
- Clear reason why
- When it becomes enabled

```html
✅ GOOD:
<button disabled title="Fill out all fields to submit">
  Submit Incident
</button>

❌ BAD:
<button disabled>Submit</button>
```

### 7. **Validation State**
- Real-time feedback
- Clear error message
- What's required
- How to fix it

```html
✅ GOOD:
<input placeholder="Describe your incident">
<span class="error">Minimum 10 characters (you have 5)</span>

❌ BAD:
<input>
(no feedback)
```

## Business Language (Replace Technical Terms)

| ❌ Technical | ✅ Business |
|-------------|-----------|
| API endpoint | Request |
| Orchestration | Process |
| Agent | Analyzer |
| Verifier | Reviewer |
| Async queue | Background task |
| State machine | Status |
| Rollback | Undo / Revert |
| Payload | Data |
| Authentication | Login |
| Authorization | Permissions |

## Layout: Desktop-First (1200px+)

### Wide Layout Pattern
```
┌─────────────────────────────────────────┐
│ Header: What this does                  │
├─────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────┐  │
│ │                      │  │ Results  │  │
│ │ Input Form           │  │          │  │
│ │                      │  │ (right   │  │
│ │ • Field 1            │  │  panel)  │  │
│ │ • Field 2            │  │          │  │
│ │ [Submit]             │  │          │  │
│ └──────────────────────┘  └──────────┘  │
└─────────────────────────────────────────┘
```

- Wide: Use full width for side-by-side
- Left: Input and controls
- Right: Results and output
- Mobile: Reject (<768px) with message "desktop only"

## Accessibility

Every page must have:
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] ARIA labels for buttons and fields
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] Focus indicators visible
- [ ] Error messages linked to fields
- [ ] Alt text for images
- [ ] Semantic HTML (not just <div> divs)

## Testing UI Locally

```bash
npm start
# Open http://localhost:3000
```

**Test Checklist**:
1. Page loads without errors
2. Purpose is clear (can explain in 1 sentence)
3. Form submission works
4. Loading state appears and disappears
5. Success message shows
6. Error message appears for invalid input
7. Retry button works after error
8. All buttons are clickable
9. No broken images or missing text
10. Keyboard navigation works (Tab through fields)

## Common UI Mistakes

### ❌ Technical Language
"Orchestration agent initiated async task execution"
→ ✅ "Processing your incident..."

### ❌ No Loading State
User submits → Nothing visible → Silent failure
→ ✅ Show spinner + "Analyzing... (30 seconds)"

### ❌ No Error Recovery
Network fails → "Error occurred"
→ ✅ "Network error. [Retry Now]"

### ❌ Unclear Purpose
Page shows data with no explanation
→ ✅ "Your recent diagnosis requests"

### ❌ Too Many Buttons
[Submit] [Cancel] [Clear] [Help] [Settings] [Back]
→ ✅ One primary action: [Submit Incident]

### ❌ Mobile Ignored
Site breaks on phone with no message
→ ✅ Show clear message: "This tool requires a larger screen"

## Lessons Learned (From Stakeholder Feedback)

1. **Edit the file users actually see.** If the user views `index.html`, don't update React components they'll never load. Verify the served route before editing.
2. **Dynamic over static.** Always render backend capabilities dynamically. Hard-coded feature lists go stale. Wire real API responses into the UI.
3. **Hover states must not blend.** Every interactive element needs a visually distinct hover. Never let `opacity`, animation, or gradient cause the element to disappear into the background.
4. **Restart the server after content changes.** Express may cache static files. After editing HTML/CSS, restart `node src/server.js` and confirm the change is live.
5. **Premium means deliberate.** Apple-quality polish comes from consistent spacing, font loading, multi-color accents, and dark/light theme coherence — not from adding more sections.
6. **Remove process artifacts immediately.** Phase docs, sprint checklists, and stakeholder meeting notes must never enter git tracking. Add ignore rules *before* the first commit.
7. **Show all backend products.** If the backend supports batch diagnosis, webhooks, analytics, audit logs, and exports, the UI must surface every one of them — otherwise the business loses revenue.

## Before Calling UI "Done"

- [ ] Purpose clear in 1 sentence
- [ ] Business value obvious
- [ ] Next action button prominent
- [ ] All states implemented (loading, error, success, empty, validation)
- [ ] Business language (no technical terms)
- [ ] Desktop layout 1200px+
- [ ] Mobile shows "desktop only" message
- [ ] Tested locally on http://localhost:3000
- [ ] Accessibility checks pass
- [ ] Error messages are helpful
- [ ] No confusing terminology
- [ ] Editing the correct served file (not an unused component)
- [ ] Server restarted and change verified live
- [ ] All backend-supported features visible in UI
