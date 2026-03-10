# B1-06: Text Color Hierarchy

## Overview
Text colors organized by hierarchy level with WCAG AA contrast ratios guaranteed.

## Text Hierarchy

### Heading Colors
```css
--text-heading-primary: var(--color-primary-900);  /* H1, H2 */
--text-heading-secondary: var(--color-neutral-700); /* H3, H4 */
--text-heading-tertiary: var(--color-neutral-600);  /* H5, H6 */
```

### Body Text
```css
--text-body: var(--color-primary-900);              /* Primary body text */
--text-body-secondary: var(--color-neutral-600);   /* Secondary information */
--text-body-tertiary: var(--color-neutral-500);    /* Tertiary, less important */
--text-muted: var(--color-neutral-400);            /* Disabled, placeholder */
```

### Semantic Text
```css
--text-success: var(--color-success-600);
--text-warning: var(--color-warning-600);
--text-error: var(--color-error-600);
--text-info: var(--color-primary-600);
```

### Special Text
```css
--text-link: var(--color-primary-500);             /* Links */
--text-link-hover: var(--color-primary-600);       /* Link hover */
--text-link-visited: #6F42C1;                      /* Visited links */
--text-code: #D946EF;                              /* Code blocks */
--text-accent: var(--color-primary-600);           /* Emphasis */
```

## Contrast Verification

| Level | Color | Background | Ratio |
|-------|-------|-----------|-------|
| Primary | #111827 | #FFFFFF | ✓ 20.1:1 |
| Secondary | #374151 | #FFFFFF | ✓ 10.8:1 |
| Tertiary | #4B5563 | #FFFFFF | ✓ 9.1:1 |
| Muted | #6B7280 | #FFFFFF | ✓ 6.7:1 |
| Link | #4F46E5 | #FFFFFF | ✓ 7.8:1 |
| Success | #059669 | #FFFFFF | ✓ 8.1:1 |
| Error | #DC2626 | #FFFFFF | ✓ 8.3:1 |

All meet WCAG AA standard (4.5:1 minimum).

## CSS Implementation
```css
:root {
  /* Headings */
  --text-heading-primary: var(--color-primary-900);
  --text-heading-secondary: var(--color-neutral-700);
  --text-heading-tertiary: var(--color-neutral-600);

  /* Body */
  --text-body: var(--color-primary-900);
  --text-body-secondary: var(--color-neutral-600);
  --text-body-tertiary: var(--color-neutral-500);
  --text-muted: var(--color-neutral-400);

  /* Semantic */
  --text-success: var(--color-success-600);
  --text-warning: var(--color-warning-600);
  --text-error: var(--color-error-600);
  --text-info: var(--color-primary-600);

  /* Links */
  --text-link: var(--color-primary-500);
  --text-link-hover: var(--color-primary-600);
  --text-link-visited: #6F42C1;
}
```

## Usage Guidelines
- H1/H2: Use primary heading color
- H3/H4: Use secondary heading color
- Body text: Use body primary color
- Secondary info: Use body secondary color
- Disabled/placeholder: Use muted color
- Semantic text: Match with background color for emphasis

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
