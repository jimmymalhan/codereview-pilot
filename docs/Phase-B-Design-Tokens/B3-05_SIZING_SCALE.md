# B3-05: Component Sizing Scale

## Overview
Standard sizing scale for UI components like buttons, inputs, and icons.

## Size Scale

### Extra Small (32px)
```css
--size-xs: 32px;
```
Usage: Compact buttons, small icons

### Small (40px)
```css
--size-sm: 40px;
```
Usage: Small buttons, secondary actions

### Medium (44px)
```css
--size-md: 44px;
```
Usage: Standard buttons, form inputs

### Large (48px)
```css
--size-lg: 48px;
```
Usage: Large buttons, prominent actions

### Extra Large (56px)
```css
--size-xl: 56px;
```
Usage: Big buttons, hero actions

## Button Sizing

### Small Button
```css
.btn-sm {
  height: var(--size-sm);   /* 40px */
  padding: 0 var(--space-3);
  font-size: var(--font-size-xs);
}
```

### Medium Button
```css
.btn-md {
  height: var(--size-md);   /* 44px */
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
}
```

### Large Button
```css
.btn-lg {
  height: var(--size-lg);   /* 48px */
  padding: 0 var(--space-5);
  font-size: var(--font-size-base);
}
```

## Input Sizing

### Small Input
```css
.input-sm {
  height: var(--size-sm);   /* 40px */
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
}
```

### Medium Input
```css
.input-md {
  height: var(--size-md);   /* 44px */
  padding: 0 var(--space-4);
  font-size: var(--font-size-base);
}
```

### Large Input
```css
.input-lg {
  height: var(--size-lg);   /* 48px */
  padding: 0 var(--space-5);
  font-size: var(--font-size-lg);
}
```

## Icon Sizing

### Small Icon (16px)
```css
--icon-sm: 16px;
```

### Medium Icon (20px)
```css
--icon-md: 20px;
```

### Large Icon (24px)
```css
--icon-lg: 24px;
```

### X-Large Icon (32px)
```css
--icon-xl: 32px;
```

## Touch Targets

### Minimum Touch Target
```css
button, a, input {
  min-height: 44px;  /* iOS/Android standard */
  min-width: 44px;
}
```

### Comfortable Touch Target
```css
button {
  min-height: var(--size-md);  /* 44px */
}
```

## CSS Variables
```css
:root {
  /* Sizes */
  --size-xs: 32px;
  --size-sm: 40px;
  --size-md: 44px;
  --size-lg: 48px;
  --size-xl: 56px;

  /* Icons */
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 32px;
}
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
