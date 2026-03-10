# A1-05: Primary CTA Strategy - Main Call to Action

**Task**: Design primary CTA - Main call to action
**Status**: ✅ COMPLETE
**Date**: 2026-03-09
**Owner**: Content Team (Team 1)
**Depends on**: A1-04 ✅ Complete

---

## CTA Button Design

### CTA Button Variants (Ranked by Strength)

#### Variant 1: "Diagnose Now"
- **Verb**: Diagnose (active, specific)
- **Urgency**: "Now" (immediate action)
- **Length**: 2 words (short, memorable)
- **Action**: Click → Form appears
- **Resonance**: Strong (matches headline)
- **Score**: 9/10

**When to use**: With headlines A or B (diagnosis-focused)

---

#### Variant 2: "Get Started"
- **Verb**: Get (simple, accessible)
- **Urgency**: "Started" (first step)
- **Length**: 2 words (short)
- **Action**: Click → Form or onboarding
- **Resonance**: Good (generic, safe)
- **Score**: 7/10

**When to use**: With headline C (accessibility-focused)

---

#### Variant 3: "Submit Incident"
- **Verb**: Submit (specific action)
- **Urgency**: Implied (action-oriented)
- **Length**: 2 words (short)
- **Action**: Click → Form with "incident" field
- **Resonance**: Very specific, tells user what to do
- **Score**: 8/10

**When to use**: With subheadline that says "Submit your incident"

---

#### Variant 4: "Try It Now"
- **Verb**: Try (low-risk, inviting)
- **Urgency**: "Now" (immediate)
- **Length**: 3 words (still short)
- **Action**: Click → Demo or form
- **Resonance**: Friendly, inviting, low pressure
- **Score**: 8/10

**When to use**: When you want to reduce perception of risk

---

#### Variant 5: "Analyze Your Incident"
- **Verb**: Analyze (specific, professional)
- **Urgency**: Implied
- **Length**: 3 words
- **Action**: Click → Form
- **Resonance**: Professional, specific
- **Score**: 7/10

**When to use**: With more technical audience

---

### Selected Primary CTA
**Recommendation**: "Diagnose Now"

- **Why**: Matches headline "Diagnose", includes urgency "Now"
- **Consistency**: Reinforces core message (speed + diagnosis)
- **Length**: Short and memorable (2 words)
- **Action**: Clear (user knows something will happen)
- **Resonance**: Matches user goal (diagnose incidents)

---

## CTA Placement Strategy

### Primary CTA (Diagnose Now)
- **Location**: Below subheadline, right-aligned (desktop) or full-width (mobile)
- **Visual**: Large button, high contrast color (action color)
- **Size**: 44px minimum height (touch-friendly mobile)
- **Spacing**: 20-30px above and below
- **Animation**: Subtle scale/shadow on hover (not distracting)

### Secondary CTAs
**Option 1** (Minimal): Just primary CTA
- Pros: Clean, focused, not confusing
- Cons: No fallback if user hesitant

**Option 2** (Conservative): Primary CTA + "Learn More"
- Primary: "Diagnose Now"
- Secondary: "Learn More" (scrolls to how-it-works)
- Pros: Gives exploration option
- Cons: Adds complexity

**Option 3** (Exploratory): Primary CTA + Multiple Options
- Primary: "Diagnose Now"
- Secondary 1: "Watch Demo" (→ video)
- Secondary 2: "How It Works" (→ section)
- Pros: Multiple entry points
- Cons: Dilutes focus

---

## CTA Destination

### Primary CTA ("Diagnose Now") Leads To

#### Option A: Diagnosis Form (Recommended)
```
Click "Diagnose Now" → Form appears (modal or scroll)
Form fields:
  - Incident description (textarea)
  - (Optional) Severity level
  - (Optional) Email for results

Submit → API call → Results shown
```

**Pros**: Immediate value, quick to get answer
**Cons**: Form validation, error handling needed

---

#### Option B: Guided Flow
```
Click "Diagnose Now" → Step 1 (incident details form)
→ Step 2 (confirmation of details)
→ Step 3 (results display)
```

**Pros**: Clearer process, less intimidating
**Cons**: More steps, longer flow

---

#### Option C: Sign-Up First
```
Click "Diagnose Now" → Sign-up or login required
→ Then diagnosis form
```

**Pros**: Captures user info
**Cons**: Friction, may reduce conversion

---

### Recommendation
**Use Option A (Diagnosis Form)**
- Allows users to try immediately (lowest friction)
- Can add sign-up/email collection after results (not required upfront)
- Matches subheadline promise ("Paste your incident → Get diagnosis")

---

## CTA Success Metrics

### Click-Through Rate (CTR)
- **Goal**: ≥30% of visitors click primary CTA
- **Measure**: Track with analytics
- **Target**: 30-40% CTR is excellent for B2B SaaS

### Form Submission Rate
- **Goal**: ≥20% of form visitors submit
- **Measure**: Track form completions
- **Target**: 20-25% is good (some friction is normal)

### Overall Conversion Rate
- **Goal**: ≥6% of visitors submit incident (CTR × submission rate)
- **Measure**: (Submitted incidents) / (Unique visitors)
- **Target**: 6% first week, 8% after optimization

---

## Mobile CTA Strategy

### Desktop
- Sticky: CTA stays visible at top as user scrolls
- or
- Below hero: CTA visible without scrolling

### Mobile (<768px)
- **Option 1**: CTA in hero (full width, no scroll needed)
- **Option 2**: Sticky CTA at bottom (always visible)
- **Option 3**: Both (below hero + sticky bottom)

**Recommendation**: Full-width in hero + sticky bottom on mobile
- Ensures CTA never more than scroll away
- Doesn't interfere with content
- Mobile-optimized touch target (44px+)

---

## Alternate CTA Strategies (If Needed)

### Strategy 1: Multiple CTAs Across Page
- Hero: "Diagnose Now" (primary)
- How-it-works section: "Try It Now" (secondary)
- Results showcase: "Diagnose Your Incident" (tertiary)

### Strategy 2: Time-Based Reveal
- Initially: Just "Diagnose Now"
- After 10 seconds on page: Secondary CTA appears
- After 30 seconds on page: Chat support option appears

### Strategy 3: Behavior-Based
- First-time visitor: "Get Started"
- Returning visitor: "Diagnose Now"
- Mobile: "Try Free"

---

## CTA Copy Variants (Final Runoff)

If "Diagnose Now" underperforms in testing, alternatives:

1. "Try For Free" (if you want to emphasize no-cost)
2. "Submit Incident" (if you want to be specific)
3. "Get Diagnosis" (if you want to emphasize output)
4. "Analyze Now" (if you want to sound professional)

---

## CTA Testing Plan (A1-07)

### Test Questions
- [ ] "What would happen if you clicked this button?"
- [ ] "Would you click this?" (Yes/Maybe/No)
- [ ] "Does the button text match what you expect?"
- [ ] "Does it feel urgent or low-pressure?"

### Success Criteria
- ✅ ≥80% of users can explain what happens when they click
- ✅ ≥60% say they would click
- ✅ No confusion about button action

---

## Sign-Off

✅ **A1-05 Complete**
- Primary CTA button text: "Diagnose Now" (recommended)
- 5 CTA variants drafted and ranked
- CTA destination strategy defined (Diagnosis Form recommended)
- Placement strategy documented (hero + sticky on mobile)
- Secondary CTA options provided
- Mobile optimization included
- Success metrics defined
- Testing plan for A1-07

**Key Decision**: "Diagnose Now" button leads to incident diagnosis form (lowest friction entry point).
