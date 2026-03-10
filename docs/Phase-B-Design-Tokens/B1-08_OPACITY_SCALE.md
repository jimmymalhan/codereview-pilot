# B1-08: Opacity Scale & Transparency

## Overview
Opacity values for transparency effects, overlays, and disabled states.

## Opacity Scale
```css
--opacity-0: 0%;        /* Fully transparent */
--opacity-10: 10%;      /* Minimal visibility */
--opacity-20: 20%;      /* Subtle effect */
--opacity-30: 30%;      /* Light effect */
--opacity-40: 40%;      /* Medium effect */
--opacity-50: 50%;      /* Half transparent */
--opacity-60: 60%;      /* Mostly visible */
--opacity-70: 70%;      /* Visible */
--opacity-80: 80%;      /* More visible */
--opacity-90: 90%;      /* Nearly opaque */
--opacity-100: 100%;    /* Fully opaque */
```

## Semantic Opacity

### Disabled States
```css
--opacity-disabled: 50%;  /* For disabled buttons, inputs */
```

### Hover Overlay
```css
--opacity-hover: 10%;  /* Subtle hover background */
```

### Focus Ring
```css
--opacity-focus: 50%;  /* Visible but not overwhelming */
```

### Backdrop
```css
--opacity-backdrop: 40%;  /* For modal backdrops */
```

## Color Opacity Combinations

### Primary with Opacity
```css
--color-primary-alpha-10: rgba(79, 70, 229, 0.1);
--color-primary-alpha-20: rgba(79, 70, 229, 0.2);
--color-primary-alpha-30: rgba(79, 70, 229, 0.3);
--color-primary-alpha-50: rgba(79, 70, 229, 0.5);
```

### Neutral with Opacity
```css
--color-neutral-alpha-10: rgba(17, 24, 39, 0.1);
--color-neutral-alpha-20: rgba(17, 24, 39, 0.2);
--color-neutral-alpha-30: rgba(17, 24, 39, 0.3);
--color-neutral-alpha-50: rgba(17, 24, 39, 0.5);
```

## CSS Variables
```css
:root {
  /* Opacity Scale */
  --opacity-0: 0%;
  --opacity-10: 0.1;
  --opacity-20: 0.2;
  --opacity-30: 0.3;
  --opacity-40: 0.4;
  --opacity-50: 0.5;
  --opacity-60: 0.6;
  --opacity-70: 0.7;
  --opacity-80: 0.8;
  --opacity-90: 0.9;
  --opacity-100: 1;

  /* Semantic */
  --opacity-disabled: 0.5;
  --opacity-hover: 0.1;
  --opacity-focus: 0.5;
  --opacity-backdrop: 0.4;

  /* Color Opacities */
  --color-primary-alpha-10: rgba(79, 70, 229, 0.1);
  --color-primary-alpha-20: rgba(79, 70, 229, 0.2);
  --color-primary-alpha-30: rgba(79, 70, 229, 0.3);
  --color-primary-alpha-50: rgba(79, 70, 229, 0.5);

  --color-neutral-alpha-10: rgba(17, 24, 39, 0.1);
  --color-neutral-alpha-20: rgba(17, 24, 39, 0.2);
  --color-neutral-alpha-30: rgba(17, 24, 39, 0.3);
  --color-neutral-alpha-50: rgba(17, 24, 39, 0.5);
}
```

## Usage Guidelines
- 10-20%: Subtle backgrounds, hover states
- 30-40%: Light overlays, disabled states
- 50%: Focus rings, modal backdrops
- 60-80%: Emphasis, slightly transparent text
- 100%: Fully opaque, default state

## Dark Mode
Opacity values remain consistent across light and dark themes. Opacity is theme-agnostic.

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
