# B1-12: Color Usage Guide & Best Practices

## Overview
Practical guidelines for applying colors consistently across the product.

## Button Colors

### Primary Action
```css
background-color: var(--color-primary-500);
color: #FFFFFF;
```
Usage: Main call-to-action, submit buttons, navigation

### Secondary Action
```css
background-color: var(--color-neutral-100);
border: 1px solid var(--color-neutral-200);
color: var(--color-primary-900);
```
Usage: Alternative actions, cancel buttons

### Tertiary Action
```css
background-color: transparent;
color: var(--color-primary-500);
border: 1px solid var(--color-neutral-200);
```
Usage: Less important actions, text-only buttons

## Color Application Rules

### Rule 1: Light Backgrounds (White)
Use dark text colors:
- Primary text: #111827
- Secondary text: #374151
- Links: #4F46E5

### Rule 2: Dark Backgrounds (Charcoal)
Use light text colors:
- Primary text: #F1F5F9
- Secondary text: #CBD5E1
- Links: #E0E7FF

### Rule 3: Colored Backgrounds
Use contrasting text:
- On primary blue: White text
- On success green: White text
- On warning amber: Dark text
- On error red: White text

### Rule 4: Interactive Elements
```css
/* States: Normal → Hover → Active → Disabled */
background-color: var(--color-primary-500);      /* Normal */
background-color: var(--color-primary-600);      /* Hover */
background-color: var(--color-primary-700);      /* Active */
background-color: var(--color-neutral-200);      /* Disabled */
opacity: 0.5;                                     /* Disabled */
```

## Card Design
```css
.card {
  background-color: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-base);
}

.card-title {
  color: var(--color-primary-900);
  font-weight: 600;
}

.card-text {
  color: var(--color-neutral-600);
}
```

## Form Input Design
```css
.input {
  background-color: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  color: var(--color-primary-900);
}

.input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input:invalid {
  border-color: var(--color-error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

## Status Indicators
```css
.badge-success {
  background-color: var(--color-success-500);
  color: #FFFFFF;
}

.badge-warning {
  background-color: var(--color-warning-500);
  color: #FFFFFF;
}

.badge-error {
  background-color: var(--color-error-500);
  color: #FFFFFF;
}
```

## Links in Context
```css
a {
  color: var(--color-primary-500);
  text-decoration: underline;
}

a:hover {
  color: var(--color-primary-600);
}

a:visited {
  color: #6F42C1;
}

a:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

## Hover States
```css
/* Subtle hover overlay */
.interactive:hover {
  background-color: var(--color-primary-alpha-10);
}

/* Or use opacity */
.interactive:hover::after {
  background-color: rgba(0, 0, 0, 0.05);
  opacity: 1;
}
```

## Disabled States
```css
.disabled {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-400);
  opacity: 0.6;
  cursor: not-allowed;
}
```

## Common Patterns

### Alert/Toast
```css
.alert-success {
  background-color: var(--bg-success);
  border-left: 4px solid var(--color-success-500);
  color: var(--text-success);
}
```

### Badge/Pill
```css
.badge {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  border-radius: 9999px;
}
```

### Tag
```css
.tag {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border-radius: 4px;
}
```

## Migration Path
1. Replace hardcoded colors with CSS variables
2. Use semantic tokens (`--button-primary-bg`)
3. Fallback to base tokens (`--color-primary-500`)
4. Update CHANGELOG with changes

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
