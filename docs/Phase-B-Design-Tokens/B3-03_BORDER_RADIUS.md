# B3-03: Border Radius & Roundness

## Overview
Border radius scale for consistent corner treatments.

## Border Radius Scale

### None (0px)
```css
--radius-none: 0px;
```

### Small (4px)
```css
--radius-sm: 4px;
```

### Medium (6px)
```css
--radius-md: 6px;
```

### Large (8px)
```css
--radius-lg: 8px;
```

### X-Large (12px)
```css
--radius-xl: 12px;
```

### 2X-Large (16px)
```css
--radius-2xl: 16px;
```

### Full (50%)
```css
--radius-full: 50%;
```

## CSS Variables
```css
:root {
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 50%;
}
```

## Component Usage

### Buttons
```css
button {
  border-radius: var(--radius-md);  /* 6px */
}
```

### Cards
```css
.card {
  border-radius: var(--radius-lg);  /* 8px */
}
```

### Inputs
```css
input {
  border-radius: var(--radius-md);  /* 6px */
}
```

### Avatars
```css
.avatar {
  border-radius: var(--radius-full);  /* 50% */
}
```

### Badges
```css
.badge {
  border-radius: var(--radius-full);  /* 50% */
}
```

### Modals
```css
.modal {
  border-radius: var(--radius-xl);  /* 12px */
}
```

## Semantic Radius

### Subtle (Flat design)
```css
--radius-subtle: var(--radius-sm);  /* 4px */
```

### Standard (Normal)
```css
--radius-standard: var(--radius-md);  /* 6px */
```

### Prominent (More rounded)
```css
--radius-prominent: var(--radius-lg);  /* 8px */
```

### Pill (Very rounded)
```css
--radius-pill: var(--radius-full);  /* 50% */
```

## Responsive Radius

### Mobile (Larger radius)
```css
@media (max-width: 640px) {
  button {
    border-radius: var(--radius-lg);  /* Easier to tap */
  }
}
```

## Best Practices

### Touch Targets
- Buttons: --radius-md to --radius-lg
- Avatars: --radius-full for circular
- Badges: --radius-full for pills
- Cards: --radius-lg for subtle roundness

### Consistency
- All buttons same radius
- All cards same radius
- All inputs same radius
- All badges same radius

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
