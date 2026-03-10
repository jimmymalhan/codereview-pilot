# B2-12: Responsive Typography & Breakpoints

## Overview
Typography scaling across different screen sizes and devices.

## Font Size Scaling

### Mobile (< 640px)
```css
@media (max-width: 640px) {
  :root {
    --font-size-base: 15px;    /* Slightly smaller */
    --font-size-lg: 17px;
    --font-size-2xl: 20px;     /* Adjusted headings */
    --font-size-3xl: 24px;
    --font-size-4xl: 28px;     /* Smaller display */
  }

  h1 { font-size: var(--font-size-4xl); }  /* 28px */
  h2 { font-size: var(--font-size-3xl); }  /* 24px */
  h3 { font-size: var(--font-size-2xl); }  /* 20px */
  p { font-size: var(--font-size-base); }  /* 15px */
}
```

### Tablet (640px - 1024px)
```css
@media (min-width: 640px) and (max-width: 1024px) {
  :root {
    --font-size-base: 15px;
    --font-size-2xl: 22px;
    --font-size-3xl: 28px;
    --font-size-4xl: 32px;
  }
}
```

### Desktop (> 1024px)
```css
@media (min-width: 1024px) {
  :root {
    --font-size-base: 16px;    /* Full size */
    --font-size-2xl: 24px;
    --font-size-3xl: 30px;
    --font-size-4xl: 36px;
  }
}
```

## Line Height Adjustment

### Smaller Screens
```css
@media (max-width: 640px) {
  p { line-height: 1.6; }  /* More space needed */
  h1 { line-height: 1.15; }
}
```

### Larger Screens
```css
@media (min-width: 1024px) {
  p { line-height: 1.5; }  /* Standard */
  h1 { line-height: 1.1; }
}
```

## Line Length Adjustment

### Mobile
```css
@media (max-width: 640px) {
  p {
    max-width: 100%;  /* Use full width */
    margin-left: 1rem;
    margin-right: 1rem;
  }
}
```

### Tablet
```css
@media (min-width: 640px) and (max-width: 1024px) {
  p {
    max-width: 70ch;  /* Wider than mobile */
  }
}
```

### Desktop
```css
@media (min-width: 1024px) {
  p {
    max-width: 65ch;  /* Optimal */
  }
}
```

## Heading Responsive Scaling

### Progressive Enhancement
```css
/* Mobile first */
h1 { font-size: var(--font-size-2xl); }

/* Tablet */
@media (min-width: 768px) {
  h1 { font-size: var(--font-size-3xl); }
}

/* Desktop */
@media (min-width: 1200px) {
  h1 { font-size: var(--font-size-4xl); }
}
```

## Letter Spacing Adjustment

### Mobile (wider spacing)
```css
@media (max-width: 640px) {
  .uppercase { letter-spacing: 0.1em; }  /* More visible */
}
```

### Desktop (normal spacing)
```css
@media (min-width: 1024px) {
  .uppercase { letter-spacing: 0.05em; }  /* Standard */
}
```

## Margin/Padding Scaling

### Mobile
```css
@media (max-width: 640px) {
  h1 { margin-bottom: 1rem; }
  p { margin-bottom: 0.75rem; }
}
```

### Desktop
```css
@media (min-width: 1024px) {
  h1 { margin-bottom: 1.5rem; }
  p { margin-bottom: 1rem; }
}
```

## Fluid Typography (Advanced)

### Fluid Scale Between Breakpoints
```css
/* Scales smoothly between 15px and 16px */
body {
  font-size: clamp(15px, 2vw, 16px);
}

h1 {
  font-size: clamp(28px, 6vw, 36px);
}
```

## Testing Responsive Typography

### Manual Testing
- [ ] Mobile (375px) - readable, not too cramped
- [ ] Tablet (768px) - balanced proportions
- [ ] Desktop (1200px+) - optimal line length
- [ ] Zoom to 200% - text remains readable
- [ ] No horizontal scroll at any size

### Tools
- Chrome DevTools (device emulation)
- Safari responsive design mode
- responsivedesignchecker.com
- Actual devices (iPhone, iPad, Desktop)

## Browser Support
- ✓ Media queries: All browsers
- ✓ Fluid typography: Modern browsers
- ✓ Responsive units (vw): All modern browsers

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
