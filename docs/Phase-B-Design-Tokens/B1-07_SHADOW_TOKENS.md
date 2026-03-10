# B1-07: Shadow & Elevation Tokens

## Overview
Shadow system for creating visual hierarchy and depth perception.

## Shadow Levels

### Level 0 (No Shadow)
```css
--shadow-none: none;
```

### Level 1 (Subtle)
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
```

### Level 2 (Cards)
```css
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
               0 1px 2px 0 rgba(0, 0, 0, 0.06);
```

### Level 3 (Elevated)
```css
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
```

### Level 4 (Floating)
```css
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
```

### Level 5 (Overlay)
```css
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Elevation Map

| Elevation | Shadow | Usage |
|-----------|--------|-------|
| 0dp | none | Flat elements |
| 1dp | --shadow-sm | Text, icons |
| 2dp | --shadow-base | Cards, subtle elements |
| 4dp | --shadow-md | Elevated cards |
| 8dp | --shadow-lg | Floating elements |
| 16dp | --shadow-xl | Modals, dropdowns |

## Color-Specific Shadows

### Primary Shadows
```css
--shadow-primary: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
```

### Success Shadows
```css
--shadow-success: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
```

### Error Shadows
```css
--shadow-error: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
```

## CSS Variables
```css
:root {
  /* Shadows */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
                 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
               0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Colored Shadows */
  --shadow-primary: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
  --shadow-success: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
  --shadow-error: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
}
```

## Dark Mode Adaptation
Shadows automatically adapt in dark mode with reduced opacity:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.4),
                   0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
                 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  }
}
```

## Usage Guidelines
- No shadow: Flat backgrounds, text
- Shadow-sm: Subtle emphasis
- Shadow-base: Standard cards, containers
- Shadow-md: Elevated cards, tooltips
- Shadow-lg: Floating action buttons
- Shadow-xl: Modals, critical overlays

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
