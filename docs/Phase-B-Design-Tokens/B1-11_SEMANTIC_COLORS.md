# B1-11: Semantic Color Meanings

## Overview
Semantic mapping of colors to meanings, avoiding color-only communication.

## Semantic Intent

### Success
- **Color**: Green (#10B981)
- **Meaning**: Positive outcome, action completed
- **Usage**: Checkmarks, success messages, valid input
- **Icon**: Check circle
- **Alternative**: Combine with ✓ symbol, "Completed" text

### Warning
- **Color**: Amber (#F59E0B)
- **Meaning**: Caution, requires attention
- **Usage**: Warnings, pending states, requires confirmation
- **Icon**: Exclamation triangle
- **Alternative**: Combine with ⚠️ symbol, "Caution" text

### Error
- **Color**: Red (#EF4444)
- **Meaning**: Failure, invalid, stop
- **Usage**: Errors, failures, invalid input
- **Icon**: X circle
- **Alternative**: Combine with ✕ symbol, "Error" text

### Info
- **Color**: Blue (#4F46E5)
- **Meaning**: Information, neutral, action
- **Usage**: Info messages, help text, primary actions
- **Icon**: Info circle
- **Alternative**: Combine with ℹ️ symbol, "Note" text

## Color + Text Pairing

### Never Color-Only
```html
<!-- Bad: Color only, inaccessible -->
<div style="color: red">Invalid</div>

<!-- Good: Color + text/icon -->
<div style="color: var(--color-error-500)">
  ✕ Invalid email address
</div>
```

### Status Indicators
```html
<!-- Good: Icon + color + text -->
<div class="status-success">
  <span class="icon">✓</span>
  <span class="text">Request approved</span>
</div>
```

## Color Meanings by Category

### Contextual Colors
| Color | Meaning | Icon | Text Label |
|-------|---------|------|-----------|
| Green | Success | ✓ | "Completed" |
| Amber | Warning | ⚠ | "Caution" |
| Red | Error | ✕ | "Error" |
| Blue | Info | ℹ | "Note" |
| Gray | Neutral | — | "Pending" |

## CSS Color Semantics
```css
/* Always pair colors with semantic meaning */
.alert-success {
  background-color: var(--bg-success);
  border-left: 4px solid var(--color-success-500);
  color: var(--text-success);
}
.alert-success::before {
  content: "✓ ";
  font-weight: bold;
}

.alert-error {
  background-color: var(--bg-error);
  border-left: 4px solid var(--color-error-500);
  color: var(--text-error);
}
.alert-error::before {
  content: "✕ ";
  font-weight: bold;
}
```

## Accessibility Requirements
- Never use color alone to convey information
- Always pair with icon, text label, or symbol
- Provide text alternative for all status indicators
- Test with colorblind simulators
- Verify contrast ratios (4.5:1 minimum)

## Testing Colorblind
Validated with:
- Protanopia (Red-blind): Success/Warning/Error still distinguishable
- Deuteranopia (Green-blind): Still use text labels
- Tritanopia (Blue-yellow): All combinations tested

---
**Status**: ✓ Complete | **Phase**: B1 | **Date**: 2026-03-10
