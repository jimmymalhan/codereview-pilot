# B1-09: Gradient Tokens

## Overview
Predefined gradient combinations for backgrounds and visual emphasis.

## Linear Gradients

### Primary Gradient
```css
--gradient-primary: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%);
```

### Success Gradient
```css
--gradient-success: linear-gradient(135deg, var(--color-success-500) 0%, var(--color-success-600) 100%);
```

### Warning Gradient
```css
--gradient-warning: linear-gradient(135deg, var(--color-warning-500) 0%, var(--color-warning-600) 100%);
```

### Error Gradient
```css
--gradient-error: linear-gradient(135deg, var(--color-error-500) 0%, var(--color-error-600) 100%);
```

## Subtle Gradients

### Primary Subtle (to transparent)
```css
--gradient-primary-fade: linear-gradient(180deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0) 100%);
```

### Neutral Fade
```css
--gradient-neutral-fade: linear-gradient(180deg, rgba(17, 24, 39, 0.1) 0%, rgba(17, 24, 39, 0) 100%);
```

## Directional Gradients

### Top to Bottom
```css
--gradient-to-bottom: linear-gradient(180deg);
```

### Left to Right
```css
--gradient-to-right: linear-gradient(90deg);
```

### Diagonal
```css
--gradient-diagonal: linear-gradient(135deg);
```

## CSS Variables
```css
:root {
  /* Primary Gradients */
  --gradient-primary: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%);
  --gradient-success: linear-gradient(135deg, var(--color-success-500) 0%, var(--color-success-600) 100%);
  --gradient-warning: linear-gradient(135deg, var(--color-warning-500) 0%, var(--color-warning-600) 100%);
  --gradient-error: linear-gradient(135deg, var(--color-error-500) 0%, var(--color-error-600) 100%);

  /* Fade Gradients */
  --gradient-primary-fade: linear-gradient(180deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0) 100%);
  --gradient-neutral-fade: linear-gradient(180deg, rgba(17, 24, 39, 0.1) 0%, rgba(17, 24, 39, 0) 100%);

  /* Directional */
  --gradient-to-bottom: linear-gradient(180deg, var(--bg-base) 0%, transparent 100%);
  --gradient-to-top: linear-gradient(0deg, var(--bg-base) 0%, transparent 100%);
  --gradient-to-right: linear-gradient(90deg, var(--bg-base) 0%, transparent 100%);
  --gradient-to-left: linear-gradient(270deg, var(--bg-base) 0%, transparent 100%);
}
```

## Usage Guidelines
- Primary gradient: Hero sections, featured cards
- Semantic gradients: Status-specific backgrounds
- Fade gradients: Text overlays, progressive revelation
- Directional: Smooth transitions to transparent

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
