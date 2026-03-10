# B3-02: Spacing Scale & Layout System

## Overview
Base spacing unit and derived spacing scale for consistent layouts.

## Base Unit
```css
--space-unit: 4px;  /* Base unit for all spacing */
```

## Spacing Scale (4px × multiplier)

### 0 (None)
```css
--space-0: 0;
```

### 4px (xs)
```css
--space-1: 4px;     /* 1 × 4 */
```

### 8px (sm)
```css
--space-2: 8px;     /* 2 × 4 */
```

### 12px (md)
```css
--space-3: 12px;    /* 3 × 4 */
```

### 16px (lg)
```css
--space-4: 16px;    /* 4 × 4 */
```

### 20px (xl)
```css
--space-5: 20px;    /* 5 × 4 */
```

### 24px (2xl)
```css
--space-6: 24px;    /* 6 × 4 */
```

### 32px (3xl)
```css
--space-8: 32px;    /* 8 × 4 */
```

### 40px (4xl)
```css
--space-10: 40px;   /* 10 × 4 */
```

### 48px (5xl)
```css
--space-12: 48px;   /* 12 × 4 */
```

### 64px (6xl)
```css
--space-16: 64px;   /* 16 × 4 */
```

## CSS Variables
```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

## Semantic Spacing

### Gaps (Between items)
```css
--gap-sm: var(--space-2);   /* 8px */
--gap-md: var(--space-4);   /* 16px */
--gap-lg: var(--space-6);   /* 24px */
```

### Padding (Inside elements)
```css
--padding-sm: var(--space-2);
--padding-md: var(--space-4);
--padding-lg: var(--space-6);
```

### Margins (Around elements)
```css
--margin-sm: var(--space-2);
--margin-md: var(--space-4);
--margin-lg: var(--space-6);
```

## Common Patterns

### Padding in Components
```css
.button {
  padding: var(--space-2) var(--space-4);  /* 8px 16px */
}

.card {
  padding: var(--space-6);  /* 24px */
}

.modal {
  padding: var(--space-8);  /* 32px */
}
```

### Margin Between Elements
```css
h1 { margin-bottom: var(--space-6); }
p { margin-bottom: var(--space-4); }
section { margin-bottom: var(--space-8); }
```

### Gaps in Layouts
```css
.row {
  gap: var(--space-4);  /* 16px */
}

.grid {
  gap: var(--space-6);  /* 24px */
}
```

## Responsive Spacing

### Mobile Adjustments
```css
@media (max-width: 640px) {
  :root {
    --gap-lg: var(--space-4);   /* Reduce large gap */
    --padding-lg: var(--space-4);
  }
}
```

## Testing Spacing
- [ ] All spacing uses variables
- [ ] No hardcoded px values
- [ ] Consistent gaps between items
- [ ] Proper padding in components
- [ ] Responsive spacing verified

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
