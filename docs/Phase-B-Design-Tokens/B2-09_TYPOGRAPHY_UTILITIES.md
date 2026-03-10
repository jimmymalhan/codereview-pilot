# B2-09: Typography Utility Classes

## Overview
Reusable typography utility classes for consistent text styling.

## Font Size Utilities
```css
.text-xs { font-size: var(--font-size-xs); }      /* 12px */
.text-sm { font-size: var(--font-size-sm); }      /* 14px */
.text-base { font-size: var(--font-size-base); }  /* 16px */
.text-lg { font-size: var(--font-size-lg); }      /* 18px */
.text-xl { font-size: var(--font-size-xl); }      /* 20px */
.text-2xl { font-size: var(--font-size-2xl); }    /* 24px */
.text-3xl { font-size: var(--font-size-3xl); }    /* 30px */
.text-4xl { font-size: var(--font-size-4xl); }    /* 36px */
```

## Font Weight Utilities
```css
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }
.font-extrabold { font-weight: var(--font-weight-extrabold); }
```

## Line Height Utilities
```css
.leading-tight { line-height: var(--line-height-tight); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }
.leading-loose { line-height: var(--line-height-loose); }
```

## Letter Spacing Utilities
```css
.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }
.tracking-wider { letter-spacing: var(--letter-spacing-wider); }
```

## Text Color Utilities
```css
.text-primary { color: var(--text-heading-primary); }
.text-secondary { color: var(--text-body-secondary); }
.text-tertiary { color: var(--text-body-tertiary); }
.text-muted { color: var(--text-muted); }
.text-success { color: var(--text-success); }
.text-warning { color: var(--text-warning); }
.text-error { color: var(--text-error); }
.text-info { color: var(--text-info); }
```

## Text Transform Utilities
```css
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }
.normal-case { text-transform: none; }
```

## Text Alignment Utilities
```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
```

## Text Decoration Utilities
```css
.underline { text-decoration: underline; }
.line-through { text-decoration: line-through; }
.no-underline { text-decoration: none; }
.italic { font-style: italic; }
.not-italic { font-style: normal; }
```

## Whitespace Utilities
```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.whitespace-nowrap { white-space: nowrap; }
.whitespace-pre { white-space: pre; }
.whitespace-pre-wrap { white-space: pre-wrap; }
.whitespace-pre-line { white-space: pre-line; }
.whitespace-normal { white-space: normal; }
```

## Break Utilities
```css
.break-words { word-break: break-word; }
.break-all { word-break: break-all; }
.break-normal { word-break: normal; }
```

## Usage Examples
```html
<!-- Font sizes -->
<h1 class="text-4xl font-bold">Title</h1>
<p class="text-base font-normal">Body text</p>
<small class="text-sm font-normal">Small text</small>

<!-- Colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<span class="text-success">Success message</span>

<!-- Transforms -->
<p class="uppercase tracking-wider">Important</p>

<!-- Truncation -->
<p class="truncate">Long text that will be truncated...</p>
<p class="line-clamp-2">Multi-line text clamped to 2 lines...</p>
```

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
