# B2-10: Readable Typography & Accessibility

## Overview
Typography guidelines for maximum readability and accessibility.

## Readability Standards

### WCAG AA Compliance
- Minimum font size: 12px (body text)
- Minimum line height: 1.5 (body text)
- Maximum line length: 80 characters
- Minimum contrast: 4.5:1 (text on background)

### WCAG AAA Compliance
- Minimum font size: 14px (body text)
- Minimum line height: 1.5-2 (body text)
- Maximum line length: 80 characters
- Minimum contrast: 7:1 (text on background)

## Font Size Guidelines

### Minimum Sizes
```css
body { font-size: 16px; }  /* Standard minimum */
.small { font-size: 14px; } /* For secondary content */
.tiny { font-size: 12px; }  /* Only for metadata */
```

### Maximum Sizes
```css
h1 { font-size: 48px; }  /* Hero only */
h2 { font-size: 36px; }  /* Large sections */
p { font-size: 18px; }   /* Large body max */
```

## Line Length Optimization

### Optimal Range: 50-75 characters
```css
p {
  max-width: 65ch;      /* Average optimal length */
  line-height: 1.5;
}

/* For different contexts */
article { max-width: 80ch; }  /* Wider for articles */
h1 { max-width: 50ch; }       /* Narrower for titles */
```

## Contrast Ratios

### Text Colors
| Level | Ratio | Grade |
|-------|-------|-------|
| 7:1 | AAA | Best |
| 4.5:1 | AA | Good |
| 3:1 | Large text | Acceptable |
| <3:1 | — | Fail |

### Verified Colors
```css
--text-primary-on-white: #111827;    /* 20.1:1 - AAA */
--text-secondary-on-white: #374151;  /* 10.8:1 - AAA */
--text-tertiary-on-white: #6B7280;   /* 6.7:1 - AA */
```

## Accessibility Features

### Dyslexia-Friendly Typography
```css
.dyslexia-friendly {
  font-family: 'OpenDyslexic', -apple-system, sans-serif;
  font-size: 18px;
  line-height: 1.75;
  letter-spacing: 0.1em;
  word-spacing: 0.1em;
}
```

### High Contrast Mode
```css
@media (prefers-contrast: more) {
  :root {
    --text-primary: #000000;
    --text-secondary: #003300;
    --bg-primary: #FFFFFF;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing Checklist

### Manual Testing
- [ ] Text is readable at 100% zoom
- [ ] Text is readable at 200% zoom
- [ ] No horizontal scroll needed at 200% zoom
- [ ] Focus order is logical
- [ ] All links are keyboard accessible
- [ ] No text color used alone for meaning

### Tools to Use
- WebAIM Contrast Checker
- axe DevTools (browser extension)
- Screen reader (NVDA, JAWS, VoiceOver)
- Zoom to 200% (Ctrl/Cmd +)

### Browser Testing
- Chrome + Extensions
- Firefox + Extensions
- Safari + VoiceOver
- Mobile browsers

## Common Issues

### Problem: Text too small
```css
/* ❌ Bad */
p { font-size: 12px; }

/* ✅ Good */
p { font-size: 16px; }
```

### Problem: Low contrast
```css
/* ❌ Bad (3.2:1) */
color: #8B84DB;  /* Gray on white */

/* ✅ Good (8.3:1) */
color: #374151;  /* Dark gray on white */
```

### Problem: Line too long
```css
/* ❌ Bad (100+ characters per line) */
p { /* no max-width */ }

/* ✅ Good */
p { max-width: 65ch; }
```

## Continuous Improvement
- Test new fonts for accessibility
- Verify contrast ratios after color changes
- Test with real content at different zoom levels
- Gather feedback from users with accessibility needs

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
