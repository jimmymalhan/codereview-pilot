# B3-01: Motion & Animation Tokens

## Overview
Duration, easing, and timing specifications for smooth animations.

## Duration Scale

### Quick (150ms)
```css
--duration-quick: 150ms;
```
Usage: Hover states, brief feedback, small movements

### Smooth (250ms)
```css
--duration-smooth: 250ms;
```
Usage: Standard animations, transitions, UI feedback

### Dramatic (400ms)
```css
--duration-dramatic: 400ms;
```
Usage: Large transformations, modals, important events

### Slowest (500ms)
```css
--duration-slowest: 500ms;
```
Usage: Page transitions, hero animations, emphasis

## Easing Functions

### Linear (No easing)
```css
--easing-linear: linear;
```
Usage: Continuous movement, progress bars

### Ease-In (Slow start, fast end)
```css
--easing-in: cubic-bezier(0.4, 0, 1, 1);
```
Usage: Elements exiting screen, fade out

### Ease-Out (Fast start, slow end)
```css
--easing-out: cubic-bezier(0, 0, 0.2, 1);
```
Usage: Elements entering screen, fade in, bounce

### Ease-In-Out (Slow start and end)
```css
--easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```
Usage: General transitions, balance, natural movement

## Transition Combinations

### Quick Transition
```css
--transition-quick: var(--duration-quick) var(--easing-out);
```

### Smooth Transition
```css
--transition-smooth: var(--duration-smooth) var(--easing-in-out);
```

### Dramatic Transition
```css
--transition-dramatic: var(--duration-dramatic) var(--easing-in-out);
```

## CSS Variables
```css
:root {
  /* Durations */
  --duration-quick: 150ms;
  --duration-smooth: 250ms;
  --duration-dramatic: 400ms;
  --duration-slowest: 500ms;

  /* Easing */
  --easing-linear: linear;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Transitions */
  --transition-quick: var(--duration-quick) var(--easing-out);
  --transition-smooth: var(--duration-smooth) var(--easing-in-out);
  --transition-dramatic: var(--duration-dramatic) var(--easing-in-out);
}
```

## Animation Specifications

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--duration-smooth) var(--easing-out);
}
```

### Slide Up
```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-up {
  animation: slideUp var(--duration-smooth) var(--easing-out);
}
```

### Scale In
```css
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.scale-in {
  animation: scaleIn var(--duration-smooth) var(--easing-out);
}
```

## Reduced Motion Respect
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Considerations
- Use transform and opacity (GPU-accelerated)
- Avoid animating layout properties
- Limit to 60 FPS (16.67ms per frame)
- Use will-change sparingly
- Test on mobile devices

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
