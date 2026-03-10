# B3-06: Focus States & Keyboard Navigation

## Overview
Focus ring specifications and keyboard navigation styles.

## Focus Ring Specification

### Ring Color
```css
--focus-ring-color: var(--color-primary-500);
```

### Ring Width
```css
--focus-ring-width: 3px;
```

### Ring Offset
```css
--focus-ring-offset: 2px;
```

## Focus Visible (Keyboard Only)

### Standard Focus Ring
```css
*:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

### Button Focus
```css
button:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Input Focus
```css
input:focus-visible {
  border-color: var(--color-primary-500);
  outline: 3px solid rgba(79, 70, 229, 0.1);
  outline-offset: 0;
}
```

### Link Focus
```css
a:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
  text-decoration: underline;
}
```

## Focus Within (Parent Focused)

### Form Focused
```css
.form:focus-within {
  border-color: var(--color-primary-500);
}
```

## Keyboard Navigation Order

### Tab Order
```html
<!-- Natural tab order (1, 2, 3) -->
<button>First</button>
<button>Second</button>
<button>Third</button>

<!-- Custom tab order (not recommended) -->
<button tabindex="1">First</button>
<button tabindex="2">Second</button>
```

## Skip Links

### Skip to Main Content
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
<main id="main-content">
  <!-- Content -->
</main>
```

### Skip Link Styling
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary-500);
  color: #FFFFFF;
  padding: var(--space-3);
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## Focus Indicators

### Clear Visual Indication
```css
:focus-visible {
  /* Use high contrast color */
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### No Outline (Mouse Only)
```css
:focus:not(:focus-visible) {
  outline: none;
}
```

## Dark Mode Focus Ring

### Dark Theme
```css
@media (prefers-color-scheme: dark) {
  *:focus-visible {
    outline-color: var(--color-dark-primary-200);
  }
}
```

## High Contrast Mode

### Increased Visibility
```css
@media (prefers-contrast: more) {
  *:focus-visible {
    outline-width: 4px;  /* Thicker */
    outline-color: #000000;
  }
}
```

## Testing Focus States
- [ ] Tab key navigates all interactive elements
- [ ] Focus ring is visible on all focused elements
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] No focus trap (can always tab away)
- [ ] Skip links work correctly
- [ ] Focus ring meets contrast requirements

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
