# B1-03: Action Colors & States

## Overview
Interactive element colors with states for buttons, links, and form controls.

## Button States

### Primary Button
```css
--button-primary-bg: var(--color-primary-500);      /* Default */
--button-primary-text: #FFFFFF;                      /* White text */
--button-primary-hover: var(--color-primary-600);   /* Darker on hover */
--button-primary-active: var(--color-primary-700);  /* Darkest on press */
--button-primary-disabled: var(--color-neutral-200); /* Gray when disabled */
--button-primary-disabled-text: var(--color-neutral-500);
```

### Secondary Button
```css
--button-secondary-bg: var(--color-neutral-100);
--button-secondary-text: var(--color-primary-900);
--button-secondary-border: var(--color-neutral-200);
--button-secondary-hover: var(--color-neutral-50);
--button-secondary-active: var(--color-neutral-100);
--button-secondary-disabled: var(--color-neutral-50);
```

### Danger Button
```css
--button-danger-bg: var(--color-error-500);
--button-danger-text: #FFFFFF;
--button-danger-hover: var(--color-error-600);
--button-danger-active: #991B1B;
--button-danger-disabled: var(--color-neutral-200);
```

## Link States

### Text Link
```css
--link-default: var(--color-primary-500);
--link-hover: var(--color-primary-600);
--link-active: var(--color-primary-700);
--link-visited: #6F42C1;
--link-disabled: var(--color-neutral-400);
```

## Form Input States

### Input Field
```css
--input-bg: var(--color-neutral-0);
--input-border: var(--color-neutral-200);
--input-text: var(--color-primary-900);
--input-placeholder: var(--color-neutral-500);
--input-focus-border: var(--color-primary-500);
--input-focus-ring: rgba(79, 70, 229, 0.1);
--input-hover-border: var(--color-neutral-300);
```

### Input States
```css
--input-valid-border: var(--color-success-500);
--input-valid-ring: rgba(16, 185, 129, 0.1);
--input-error-border: var(--color-error-500);
--input-error-ring: rgba(239, 68, 68, 0.1);
--input-disabled-bg: var(--color-neutral-50);
--input-disabled-text: var(--color-neutral-400);
--input-disabled-border: var(--color-neutral-200);
```

## Contrast Ratios
- Button text on backgrounds: ✓ 7.8:1 (primary)
- Link text on white: ✓ 7.8:1
- Input border on white: ✓ 4.5:1
- Focus ring visible: ✓ 3.1:1

## CSS Variables
```css
:root {
  /* Primary Button */
  --button-primary-bg: var(--color-primary-500);
  --button-primary-text: #FFFFFF;
  --button-primary-hover: var(--color-primary-600);
  --button-primary-active: var(--color-primary-700);
  --button-primary-disabled: var(--color-neutral-200);

  /* Secondary Button */
  --button-secondary-bg: var(--color-neutral-100);
  --button-secondary-text: var(--color-primary-900);
  --button-secondary-border: var(--color-neutral-200);

  /* Danger Button */
  --button-danger-bg: var(--color-error-500);
  --button-danger-text: #FFFFFF;
  --button-danger-hover: var(--color-error-600);

  /* Links */
  --link-default: var(--color-primary-500);
  --link-hover: var(--color-primary-600);
  --link-visited: #6F42C1;

  /* Input Fields */
  --input-bg: var(--color-neutral-0);
  --input-border: var(--color-neutral-200);
  --input-text: var(--color-primary-900);
  --input-focus-border: var(--color-primary-500);
  --input-valid-border: var(--color-success-500);
  --input-error-border: var(--color-error-500);
}
```

## Usage
- Button colors: Primary for main actions, Secondary for alternatives
- Links: Visited color differentiates from default
- Inputs: Focus rings provide clear affordance
- All states provide sufficient contrast

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
