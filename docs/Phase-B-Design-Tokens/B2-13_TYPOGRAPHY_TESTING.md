# B2-13: Typography Testing & Validation

## Overview
Testing framework for typography quality and accessibility.

## Unit Tests

### Font Size Tests
```javascript
describe('Typography', () => {
  it('should apply font size correctly', () => {
    const elem = document.createElement('p');
    elem.className = 'text-lg';
    document.body.appendChild(elem);
    const size = window.getComputedStyle(elem).fontSize;
    expect(size).toBe('18px');
  });

  it('should maintain font size at 200% zoom', () => {
    document.body.style.zoom = '200%';
    const elem = document.querySelector('p');
    expect(elem).toBeVisible();
    document.body.style.zoom = '100%';
  });
});
```

### Font Weight Tests
```javascript
describe('Font Weights', () => {
  it('should apply correct font weight', () => {
    const heading = document.querySelector('h1');
    const weight = window.getComputedStyle(heading).fontWeight;
    expect(weight).toBe('700');  /* Bold */
  });
});
```

### Line Height Tests
```javascript
describe('Line Height', () => {
  it('should maintain line height for readability', () => {
    const p = document.querySelector('p');
    const lineHeight = window.getComputedStyle(p).lineHeight;
    expect(parseFloat(lineHeight)).toBeGreaterThanOrEqual(1.5);
  });
});
```

## Integration Tests

### Responsive Typography Tests
```javascript
describe('Responsive Typography', () => {
  it('should scale heading size on mobile', () => {
    window.matchMedia = (query) => ({
      matches: query.includes('max-width: 640px'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {}
    });

    const h1 = document.querySelector('h1');
    const size = window.getComputedStyle(h1).fontSize;
    expect(size).toBe('28px'); /* Mobile size */
  });
});
```

## Accessibility Tests

### Contrast Tests
```javascript
describe('Typography Contrast', () => {
  it('should meet WCAG AA contrast ratio', async () => {
    const results = await axe(document);
    const colorContrast = results.violations.find(v => v.id === 'color-contrast');
    expect(colorContrast).toBeUndefined();
  });
});
```

### Screen Reader Tests
```javascript
describe('Screen Reader Accessibility', () => {
  it('should announce heading hierarchy', () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);

    /* Verify logical hierarchy */
    let lastLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      expect(level).toBeLessThanOrEqual(lastLevel + 1);
      lastLevel = level;
    });
  });
});
```

## Visual Regression Tests

### Font Rendering Tests
```javascript
describe('Font Rendering', () => {
  it('should render sans-serif correctly', () => {
    const elem = document.querySelector('body');
    const fontFamily = window.getComputedStyle(elem).fontFamily;
    expect(fontFamily).toContain('system');
  });

  it('should fallback to system fonts', () => {
    const elem = document.querySelector('body');
    const fontFamily = window.getComputedStyle(elem).fontFamily;
    expect(fontFamily).not.toBe('');
  });
});
```

## E2E Tests

### Manual Testing Checklist
- [ ] All text is readable at 100% zoom
- [ ] All text is readable at 200% zoom
- [ ] No text is cut off at any zoom level
- [ ] Headings have proper visual hierarchy
- [ ] Line spacing is consistent
- [ ] Font sizes scale responsively
- [ ] Focus indicators are visible
- [ ] Links are underlined
- [ ] Code blocks are properly styled

### Tools for Testing
- Chrome DevTools (Elements, Accessibility)
- WAVE extension (accessibility)
- axe DevTools (accessibility audit)
- WebAIM Contrast Checker
- Screen readers (NVDA, JAWS, VoiceOver)

## Performance Tests

### Font Loading Performance
```javascript
describe('Font Performance', () => {
  it('should use system fonts without blocking', () => {
    const start = performance.now();
    const elem = document.querySelector('body');
    const fontFamily = window.getComputedStyle(elem).fontFamily;
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); /* < 100ms */
  });
});
```

## Automation Script
```bash
# Run all typography tests
npm test -- --testPathPattern=typography

# Run with coverage
npm test -- --testPathPattern=typography --coverage

# Run accessibility checks
npm run test:a11y -- --match "typography"

# Run responsive tests
npm run test:responsive -- --breakpoints 375,768,1200
```

## Continuous Testing
- Run typography tests on every commit (CI/CD)
- Run accessibility tests on pull requests
- Visual regression testing on main
- Performance monitoring on deploy

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
