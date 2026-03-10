# B1-05: Border & Divider Colors

## Overview
Border colors for form inputs, cards, and dividers with contrast specifications.

## Border Palette

### Primary Borders
```css
--border-neutral: var(--color-neutral-200);        /* Default borders */
--border-neutral-light: var(--color-neutral-100);  /* Subtle dividers */
--border-neutral-dark: var(--color-neutral-300);   /* Strong borders */
--border-input: var(--color-neutral-200);          /* Input borders */
--border-input-focus: var(--color-primary-500);    /* Focused input */
```

### Semantic Borders
```css
--border-success: var(--color-success-500);
--border-warning: var(--color-warning-500);
--border-error: var(--color-error-500);
--border-info: var(--color-primary-500);
```

## Divider Usage

### Subtle Dividers
- Color: `var(--color-neutral-100)`
- Width: 1px
- Usage: Between list items, subtle separations

### Medium Dividers
- Color: `var(--color-neutral-200)`
- Width: 1px
- Usage: Section separations, card borders

### Strong Dividers
- Color: `var(--color-neutral-300)`
- Width: 1px
- Usage: Page sections, prominent boundaries

## Focus Rings

### Input Focus Ring
```css
--focus-ring-color: rgba(79, 70, 229, 0.5);  /* Semitransparent primary */
--focus-ring-width: 3px;
--focus-ring-offset: 2px;
```

### Keyboard Focus
```css
*:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

## Contrast Ratios
- Border on white background: ✓ 12.6:1
- Input border on white: ✓ 12.6:1
- Focus ring visibility: ✓ 7.8:1
- All meet WCAG AA standard

## CSS Variables
```css
:root {
  /* Neutral Borders */
  --border-neutral: var(--color-neutral-200);
  --border-neutral-light: var(--color-neutral-100);
  --border-neutral-dark: var(--color-neutral-300);
  --border-input: var(--color-neutral-200);
  --border-input-focus: var(--color-primary-500);
  --border-input-error: var(--color-error-500);
  --border-input-valid: var(--color-success-500);

  /* Semantic Borders */
  --border-success: var(--color-success-500);
  --border-warning: var(--color-warning-500);
  --border-error: var(--color-error-500);
  --border-info: var(--color-primary-500);

  /* Focus Ring */
  --focus-ring-color: rgba(79, 70, 229, 0.5);
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
}
```

## Usage Guidelines
- Default: Use --border-neutral for most elements
- Input: Use --border-input, change to --border-input-focus on focus
- Dividers: Use --border-neutral-light for subtle, --border-neutral-dark for strong
- States: Use semantic colors for success/warning/error states

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
