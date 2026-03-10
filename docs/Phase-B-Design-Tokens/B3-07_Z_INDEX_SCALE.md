# B3-07: Z-Index Scale & Layering

## Overview
Organized z-index scale for consistent element layering.

## Z-Index Scale

### Base (0)
```css
--z-base: 0;
```

### Dropdown (10)
```css
--z-dropdown: 10;
```

### Sticky (20)
```css
--z-sticky: 20;
```

### Fixed (30)
```css
--z-fixed: 30;
```

### Modal Backdrop (40)
```css
--z-modal-backdrop: 40;
```

### Modal (50)
```css
--z-modal: 50;
```

### Popover (60)
```css
--z-popover: 60;
```

### Tooltip (70)
```css
--z-tooltip: 70;
```

### Notification (80)
```css
--z-notification: 80;
```

## Usage Map

### Content Layer
```css
.content {
  z-index: var(--z-base);  /* 0 */
}
```

### Dropdown Menu
```css
.dropdown {
  z-index: var(--z-dropdown);  /* 10 */
}
```

### Sticky Header
```css
.sticky-header {
  z-index: var(--z-sticky);  /* 20 */
  position: sticky;
  top: 0;
}
```

### Fixed Navigation
```css
.navbar {
  z-index: var(--z-fixed);  /* 30 */
  position: fixed;
  top: 0;
  width: 100%;
}
```

### Modal Backdrop
```css
.modal-backdrop {
  z-index: var(--z-modal-backdrop);  /* 40 */
  position: fixed;
  inset: 0;
}
```

### Modal
```css
.modal {
  z-index: var(--z-modal);  /* 50 */
  position: fixed;
}
```

### Popover/Tooltip
```css
.popover {
  z-index: var(--z-popover);  /* 60 */
  position: absolute;
}
```

### Tooltip
```css
.tooltip {
  z-index: var(--z-tooltip);  /* 70 */
  position: absolute;
}
```

### Notification
```css
.notification {
  z-index: var(--z-notification);  /* 80 */
  position: fixed;
}
```

## CSS Variables
```css
:root {
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-notification: 80;
}
```

## Best Practices

### Increments of 10
Allows room for edge cases without reordering

### Semantic Names
Use meaningful names (not z-1000, z-9999)

### Limit Layers
Most applications need only 4-5 layers

### Document Hierarchy
```
0: Normal content
10: Dropdowns
20: Sticky elements
30: Fixed navigation
40-50: Modals
60-70: Popovers/Tooltips
80: Notifications
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
