# B3-16: Cursor & Interaction States

## Overview
Cursor styles and interactive element states.

## Cursor Styles
```css
.cursor-auto { cursor: auto; }
.cursor-default { cursor: default; }
.cursor-pointer { cursor: pointer; }
.cursor-move { cursor: move; }
.cursor-text { cursor: text; }
.cursor-wait { cursor: wait; }
.cursor-not-allowed { cursor: not-allowed; }
.cursor-help { cursor: help; }
```

## Interactive Elements

### Button Cursor
```css
button, a, [role="button"] {
  cursor: pointer;
}
```

### Disabled Cursor
```css
button:disabled,
a:disabled,
input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

### Text Selection
```css
input, textarea {
  cursor: text;
}
```

## Pointer Events

### Disable Pointer Events
```css
.pointer-events-none {
  pointer-events: none;
}
```

### Enable Pointer Events
```css
.pointer-events-auto {
  pointer-events: auto;
}
```

## User Select

### Allow Selection
```css
.select-text {
  user-select: text;
}
```

### Prevent Selection
```css
.select-none {
  user-select: none;
}
```

### Select All
```css
.select-all {
  user-select: all;
}
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
