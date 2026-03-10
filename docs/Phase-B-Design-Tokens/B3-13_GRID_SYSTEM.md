# B3-13: Grid System & Layout

## Overview
12-column grid system for page layouts.

## Grid Setup

### 12-Column Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);  /* 16px */
  max-width: var(--max-w-2xl);
}
```

## Column Spans

### Full Width (12 columns)
```css
.col-12 { grid-column: span 12; }
```

### Half Width (6 columns)
```css
.col-6 { grid-column: span 6; }
```

### Third Width (4 columns)
```css
.col-4 { grid-column: span 4; }
```

### Quarter Width (3 columns)
```css
.col-3 { grid-column: span 3; }
```

## Responsive Grid

### Mobile (1 column)
```css
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .col-6, .col-4, .col-3 {
    grid-column: span 1;
  }
}
```

### Tablet (2 columns)
```css
@media (min-width: 640px) and (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .col-6 { grid-column: span 1; }
  .col-4 { grid-column: span 1; }
}
```

### Desktop (12 columns)
```css
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(12, 1fr);
  }
}
```

## Flexbox Alternative

### Flex Grid (Simpler)
```css
.flex-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.flex-grid > * {
  flex: 1 1 calc(50% - var(--space-2));
}

.flex-grid.col-3 > * {
  flex: 1 1 calc(33.333% - var(--space-3));
}
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
