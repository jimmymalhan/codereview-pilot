# B3-04: Animation Patterns & Effects

## Overview
Common animation patterns for UI interactions and transitions.

## Button Interactions

### Hover State
```css
button:hover {
  background-color: var(--button-primary-hover);
  transition: background-color var(--transition-quick);
  transform: translateY(-1px);
}
```

### Active State
```css
button:active {
  transform: translateY(0);
  transition: transform var(--transition-quick);
}
```

## Fade Animations

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

### Fade Out
```css
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-out {
  animation: fadeOut var(--duration-smooth) var(--easing-in);
}
```

## Slide Animations

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

### Slide Down
```css
@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-down {
  animation: slideDown var(--duration-smooth) var(--easing-out);
}
```

## Scale Animations

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

### Scale Out
```css
@keyframes scaleOut {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
}

.scale-out {
  animation: scaleOut var(--duration-smooth) var(--easing-in);
}
```

## Bounce Animations

### Bounce In
```css
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { transform: scale(1); }
}

.bounce-in {
  animation: bounceIn var(--duration-dramatic) cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Loading Animations

### Spinner
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## Transition Effects

### All Properties
```css
* {
  transition: all var(--transition-smooth);
}
```

### Specific Properties
```css
.element {
  transition: background-color var(--transition-quick),
              transform var(--transition-smooth);
}
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
