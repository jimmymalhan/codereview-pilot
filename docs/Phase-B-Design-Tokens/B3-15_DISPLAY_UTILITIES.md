# B3-15: Display & Visibility Utilities

## Overview
Display and visibility utility classes for layout control.

## Display Properties
```css
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.inline-grid { display: inline-grid; }
.hidden { display: none; }
```

## Visibility
```css
.visible { visibility: visible; }
.invisible { visibility: hidden; }
```

## Overflow
```css
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-visible { overflow: visible; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }
```

## Position
```css
.static { position: static; }
.fixed { position: fixed; }
.absolute { position: absolute; }
.relative { position: relative; }
.sticky { position: sticky; }
```

## Responsive Display

### Hide on Mobile
```css
.hidden-sm {
  @media (max-width: 640px) { display: none; }
}
```

### Show on Mobile Only
```css
.show-sm {
  @media (min-width: 640px) { display: none; }
}
```

### Hide on Desktop
```css
.hidden-lg {
  @media (min-width: 1024px) { display: none; }
}
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
