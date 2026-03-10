# B2-14: Typography Patterns & Components

## Overview
Reusable typography patterns for common UI elements.

## Hero Section

### Hero Title
```css
.hero-title {
  font-size: var(--font-size-4xl);        /* 36px */
  font-weight: var(--font-weight-bold);   /* 700 */
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
  color: var(--text-heading-primary);
  max-width: 45ch;
}
```

### Hero Subtitle
```css
.hero-subtitle {
  font-size: var(--font-size-lg);         /* 18px */
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
  color: var(--text-body-secondary);
  max-width: 65ch;
}
```

## Button Typography

### Button Text
```css
button {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);  /* 500 */
  line-height: 1.5;
  letter-spacing: 0.02em;
  text-transform: none;
}
```

## Form Labels

### Input Label
```css
label {
  font-size: var(--font-size-sm);         /* 14px */
  font-weight: var(--font-weight-medium); /* 500 */
  color: var(--text-body);
  margin-bottom: 0.5rem;
  display: block;
}
```

### Help Text
```css
.help-text {
  font-size: var(--font-size-xs);         /* 12px */
  color: var(--text-body-tertiary);
  margin-top: 0.25rem;
}
```

## Card Typography

### Card Title
```css
.card-title {
  font-size: var(--font-size-lg);         /* 18px */
  font-weight: var(--font-weight-semibold);
  color: var(--text-heading-primary);
  margin-bottom: 0.5rem;
}
```

### Card Description
```css
.card-description {
  font-size: var(--font-size-sm);         /* 14px */
  font-weight: var(--font-weight-normal);
  color: var(--text-body-secondary);
  line-height: 1.6;
}
```

## Navigation Typography

### Nav Link
```css
.nav-link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);  /* 500 */
  color: var(--text-body);
  text-decoration: none;
}

.nav-link:hover {
  color: var(--text-link-hover);
  text-decoration: underline;
}
```

## Badge Typography

### Badge Text
```css
.badge {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.2;
}
```

## Error Message Typography

### Error Text
```css
.error-message {
  font-size: var(--font-size-sm);         /* 14px */
  color: var(--text-error);
  font-weight: var(--font-weight-medium); /* 500 */
  margin-top: 0.5rem;
}
```

### Error Icon
```css
.error-message::before {
  content: '✕ ';
  margin-right: 0.5rem;
}
```

## Success Message Typography

### Success Text
```css
.success-message {
  font-size: var(--font-size-sm);
  color: var(--text-success);
  font-weight: var(--font-weight-medium);
  margin-top: 0.5rem;
}
```

## Breadcrumb Typography

### Breadcrumb Item
```css
.breadcrumb {
  font-size: var(--font-size-xs);         /* 12px */
  color: var(--text-body-tertiary);
  margin-right: 0.5rem;
}

.breadcrumb-separator {
  color: var(--text-body-tertiary);
  margin: 0 0.25rem;
}

.breadcrumb.current {
  color: var(--text-body-secondary);
  font-weight: var(--font-weight-medium);
}
```

## Modal Typography

### Modal Title
```css
.modal-title {
  font-size: var(--font-size-2xl);        /* 24px */
  font-weight: var(--font-weight-bold);
  color: var(--text-heading-primary);
  margin-bottom: 1rem;
}
```

### Modal Body
```css
.modal-body {
  font-size: var(--font-size-base);       /* 16px */
  line-height: 1.5;
  color: var(--text-body);
}
```

## Table Typography

### Table Header
```css
thead th {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold); /* 600 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-heading-secondary);
}
```

### Table Data
```css
tbody td {
  font-size: var(--font-size-sm);
  color: var(--text-body);
}
```

## Tooltip Typography

### Tooltip Text
```css
.tooltip {
  font-size: 12px;
  font-weight: var(--font-weight-normal);
  line-height: 1.4;
  color: #FFFFFF;
}
```

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
