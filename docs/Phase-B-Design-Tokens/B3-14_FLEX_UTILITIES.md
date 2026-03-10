# B3-14: Flexbox Utilities

## Overview
Common flexbox layout patterns and utilities.

## Display Flex
```css
.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}
```

## Flex Direction
```css
.flex-row {
  flex-direction: row;
}

.flex-col {
  flex-direction: column;
}

.flex-row-reverse {
  flex-direction: row-reverse;
}

.flex-col-reverse {
  flex-direction: column-reverse;
}
```

## Flex Wrap
```css
.flex-wrap {
  flex-wrap: wrap;
}

.flex-nowrap {
  flex-wrap: nowrap;
}

.flex-wrap-reverse {
  flex-wrap: wrap-reverse;
}
```

## Justify Content
```css
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }
```

## Align Items
```css
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-baseline { align-items: baseline; }
.items-stretch { align-items: stretch; }
```

## Align Content
```css
.content-start { align-content: flex-start; }
.content-center { align-content: center; }
.content-end { align-content: flex-end; }
.content-between { align-content: space-between; }
.content-around { align-content: space-around; }
```

## Flex Basis
```css
.flex-auto { flex: auto; }
.flex-1 { flex: 1; }
.flex-none { flex: none; }
```

## Gap
```css
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
```

---
**Status**: ✓ Complete | **Phase**: B3 | **Date**: 2026-03-10
