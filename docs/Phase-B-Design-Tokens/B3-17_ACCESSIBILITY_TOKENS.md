# B3-17: Accessibility & Inclusive Design Tokens

## Overview
Tokens for WCAG compliance and inclusive design.

## Reduced Motion

### Respect User Preference
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

### Motion-Safe Alternative
```css
@media (prefers-reduced-motion: no-preference) {
  .animate-fade {
    animation: fadeIn 300ms ease-out;
  }
}
```

## High Contrast

### Respect User Preference
```css
@media (prefers-contrast: more) {
  :root {
    --text-primary: #000000;
    --bg-primary: #FFFFFF;
    --border-neutral: #000000;
  }
}
```

## Dark Mode

### Auto-detect
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --text-primary: #FFFFFF;
  }
}
```

## Large Text

### Respect Zoom Level
```css
/* Base font size respects user zoom */
html {
  font-size: 16px;  /* Users can zoom */
}

/* Support up to 200% zoom */
@media (max-width: 320px) {
  html {
    font-size: 14px;  /* Prevent horizontal scroll */
  }
}
```

## Screen Reader Only

### Hide from Sighted Users
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Focus Visible

### Keyboard Navigation
```css
:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Hide focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

## Skip Links

### Skip to Main Content
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: var(--space-3);
  background: var(--color-primary-500);
  color: #FFFFFF;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## ARIA Labels

### Labeling Patterns
```html
<button aria-label="Close menu">×</button>
<div aria-live="polite" aria-label="Notifications">
  Updates appear here
</div>
```

## Color Blindness Support

### Not Color-Only
```css
/* ❌ Bad: Color only */
.error { color: red; }

/* ✅ Good: Color + pattern */
.error {
  color: #dc2626;
  border-left: 4px solid #dc2626;
}
.error::before {
  content: "✕ ";
}
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
