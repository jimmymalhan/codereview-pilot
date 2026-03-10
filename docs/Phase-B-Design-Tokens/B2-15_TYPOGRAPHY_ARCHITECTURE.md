# B2-15: Typography System Architecture

## Overview
Technical architecture and implementation strategy for typography system.

## CSS Variable Hierarchy

```
Typography System
├── Font Families (Base)
│   ├── --font-sans (primary)
│   ├── --font-serif (secondary)
│   └── --font-mono (code)
├── Font Sizes (Scale)
│   ├── --font-size-xs through --font-size-4xl
│   └── Modular scale: 1.125x ratio
├── Font Weights (Hierarchy)
│   ├── --font-weight-light through --font-weight-extrabold
│   └── 300, 400, 500, 600, 700, 800
├── Line Heights (Readability)
│   ├── --line-height-tight through --line-height-loose
│   └── 1.2, 1.5, 1.75, 2
├── Letter Spacing (Emphasis)
│   ├── --letter-spacing-tight through --letter-spacing-wider
│   └── -0.02em, 0em, 0.05em, 0.1em
└── Semantic Tokens (Usage)
    ├── --text-heading-primary
    ├── --text-body
    └── --text-code
```

## Implementation Layers

### Layer 1: Primitive Tokens
```javascript
// design-tokens.js
const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: '"Georgia", "Times New Roman", serif',
  mono: '"Courier New", monospace'
};

const sizes = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px'
};

const weights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800
};
```

### Layer 2: Semantic Tokens
```javascript
const typography = {
  heading: {
    primary: `${sizes['4xl']} / ${weights.bold}`,
    secondary: `${sizes['2xl']} / ${weights.semibold}`
  },
  body: {
    primary: `${sizes.base} / ${weights.normal}`,
    secondary: `${sizes.sm} / ${weights.normal}`
  }
};
```

### Layer 3: Component Styles
```css
h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: 1.1;
}

p {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
}
```

## CSS Variable Naming Convention

### Pattern: `--{category}-{property}-{variant}`

Examples:
- `--font-size-base` (category: font, property: size, variant: base)
- `--font-weight-bold` (category: font, property: weight, variant: bold)
- `--line-height-tight` (category: line, property: height, variant: tight)
- `--text-heading-primary` (category: text, property: heading, variant: primary)

## Dark Mode Implementation

### Inherited from Light Theme
```css
/* Typography tokens remain unchanged across themes */
:root {
  --font-size-base: 16px;
  --font-weight-normal: 400;
  --line-height-normal: 1.5;
}

@media (prefers-color-scheme: dark) {
  /* Only color tokens change */
  :root {
    --text-body: #E2E8F0;  /* Light text for dark bg */
  }
}
```

## File Structure
```
src/www/
├── design-tokens.js          # All tokens exported
├── styles/
│   ├── typography.css        # Typography rules
│   ├── utilities.css         # Utility classes
│   └── components.css        # Component styles
└── components/
    ├── Button.jsx
    ├── Card.jsx
    └── Form.jsx
```

## Export Strategy

### JavaScript Export
```javascript
export const typographyTokens = {
  fontFamilies: { ... },
  fontSizes: { ... },
  fontWeights: { ... },
  lineHeights: { ... },
  letterSpacing: { ... }
};
```

### CSS Output
```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, ...;
  --font-size-base: 16px;
  --font-weight-normal: 400;
  --line-height-normal: 1.5;
  /* ... all tokens */
}
```

## Verification Checklist

- [ ] All typography tokens defined
- [ ] CSS variables properly named
- [ ] Dark mode pairs verified
- [ ] Contrast ratios validated
- [ ] Font sizes tested at all breakpoints
- [ ] Line heights tested for readability
- [ ] Font loading performance optimized
- [ ] Utility classes generated
- [ ] Component patterns documented
- [ ] Tests passing

## Performance Optimization

### Font Loading
```javascript
// Only load system fonts (no web fonts)
// Load time: 0ms (already installed)
// Performance impact: Negligible
```

### CSS Variable Performance
```javascript
// CSS variables are native, not calculated
// Query time: <1ms
// Update time: <1ms per variable
```

## Maintenance

1. Update tokens in design-tokens.js
2. Run verification tests
3. Update CSS variables
4. Test in light and dark mode
5. Verify contrast ratios
6. Update CHANGELOG
7. Commit changes

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
