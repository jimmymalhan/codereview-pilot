# B2-08: Text Decoration & Embellishment

## Overview
Text decorations including underlines, strikethrough, and emphasis styles.

## Underline Styles

### Link Underline
```css
a {
  text-decoration: underline;
  text-decoration-color: var(--text-link);
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}

a:hover {
  text-decoration-thickness: 2px;
}
```

### Focus Underline
```css
a:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  text-decoration: none;  /* Remove underline when focused */
}
```

## Text Transform

### Uppercase
```css
.uppercase {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--font-weight-medium);
}
```

### Capitalize
```css
.capitalize {
  text-transform: capitalize;
}
```

### Lowercase
```css
.lowercase {
  text-transform: lowercase;
}
```

### None (Reset)
```css
.text-none {
  text-transform: none;
}
```

## Strikethrough
```css
.strikethrough {
  text-decoration: line-through;
  text-decoration-color: var(--color-neutral-400);
  opacity: 0.6;
}
```

## Overline
```css
.overline {
  text-decoration: overline;
  text-decoration-color: var(--color-primary-500);
  text-decoration-thickness: 2px;
  text-overline-offset: -4px;
}
```

## Font Styles

### Italic
```css
em, .italic {
  font-style: italic;
}
```

### Normal (Reset Italic)
```css
.not-italic {
  font-style: normal;
}
```

## Text Shadow
```css
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}
```

## Code Styling
```css
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background-color: var(--bg-subtle);
  color: var(--text-code);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

pre code {
  padding: 1rem;
  border-radius: 6px;
  display: block;
}
```

## Subscript & Superscript
```css
sub {
  font-size: 0.8em;
  vertical-align: sub;
}

sup {
  font-size: 0.8em;
  vertical-align: super;
}
```

## Mark/Highlight
```css
mark {
  background-color: rgba(245, 158, 11, 0.3);
  color: inherit;
  padding: 0.2em 0.4em;
  border-radius: 2px;
}
```

## Truncation

### Single Line Truncate
```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Multi-line Clamp
```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## Accessibility
- Don't use text decoration alone for meaning
- Pair color with text decoration for emphasis
- Ensure sufficient contrast for decorated text
- Test with screen readers for clarity

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
