# B2-11: Code & Monospace Typography

## Overview
Typography for code blocks, inline code, and monospace text.

## Monospace Font Stack
```css
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
```

## Inline Code
```css
code {
  font-family: var(--font-mono);
  font-size: 0.9em;                    /* Slightly smaller */
  background-color: var(--bg-subtle);
  color: var(--text-code);
  padding: 0.2em 0.4em;                /* Breathing room */
  border-radius: 3px;
  word-break: break-word;
}
```

## Code Blocks

### Default Code Block
```css
pre {
  background-color: var(--bg-muted);
  color: var(--text-body);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  line-height: 1.5;
}

pre code {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);  /* 14px */
  padding: 0;                       /* Reset inline padding */
}
```

### Highlighted Code Block
```css
.code-block {
  background-color: #1e293b;        /* Dark background */
  color: #e2e8f0;                   /* Light text */
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid var(--border-neutral);
}

.code-block code {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
}
```

## Syntax Highlighting

### Basic Colors
```css
.code-keyword { color: #e15e59; }    /* Red - keywords */
.code-string { color: #48c277; }     /* Green - strings */
.code-number { color: #c9a55d; }     /* Orange - numbers */
.code-comment { color: #5b6a7a; }    /* Gray - comments */
.code-function { color: #4fa6ed; }   /* Blue - functions */
```

## Line Numbers

### With Line Numbers
```html
<pre class="code-block"><code>
<span class="line-number">1</span> const greeting = 'Hello';
<span class="line-number">2</span> console.log(greeting);
</code></pre>
```

### CSS for Line Numbers
```css
.line-number {
  display: inline-block;
  width: 2.5rem;
  text-align: right;
  margin-right: 1rem;
  color: var(--text-body-tertiary);
  user-select: none;
}
```

## Keyboard Keys

### Keyboard Styling
```css
kbd {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background-color: var(--bg-subtle);
  border: 1px solid var(--border-neutral);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: var(--text-body);
}
```

### Example
```html
<p>Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save.</p>
```

## Diff/Patch Highlighting

### Added Lines
```css
.diff-add {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  display: block;
  padding: 0 0.5rem;
}

.diff-add::before {
  content: "+ ";
  user-select: none;
}
```

### Removed Lines
```css
.diff-remove {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: block;
  padding: 0 0.5rem;
}

.diff-remove::before {
  content: "- ";
  user-select: none;
}
```

## Terminal/Command Line

### Terminal Style
```css
.terminal {
  background-color: #0f172a;
  color: #10b981;
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 1rem;
  border-radius: 6px;
  line-height: 1.5;
}

.terminal::before {
  content: "$ ";
  color: #64748b;
  user-select: none;
}
```

## Accessibility

### Ensure Readability
```css
/* Adequate size for accessibility */
code, pre, kbd {
  font-size: 13px;  /* Minimum for code blocks */
}

/* Good contrast for code */
.syntax-keyword { color: #dc2626; }  /* Good contrast on dark */
```

## Performance Optimization

### Font Loading
```css
/* No web fonts needed for monospace */
--font-mono: 'Courier New', monospace;  /* System fallback */
```

### Line Height for Code
```css
pre {
  line-height: 1.6;  /* More space for code readability */
}
```

---
**Status**: ✓ Complete | **Phase**: B2 | **Date**: 2026-03-10
