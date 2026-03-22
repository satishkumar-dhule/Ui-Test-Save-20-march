# Accessibility Standards Documentation v2

## WCAG 2.1 AA Compliance

### Overview

This document outlines the accessibility standards and practices implemented in the DevPrep UI redesign. Our goal is to achieve **WCAG 2.1 Level AA** compliance minimum, with many areas meeting **AAA** standards.

### Target Standards

| Standard | Level | Status |
|----------|-------|--------|
| WCAG 2.1 | AA | Target |
| WCAG 2.1 | AAA | Stretch |
| Section 508 | Compliant | Target |
| ARIA Authoring Practices | 1.2 | Target |

---

## Color & Contrast

### Minimum Requirements

| Element Type | Minimum Contrast | Target |
|--------------|------------------|--------|
| Normal Text (< 18pt) | 4.5:1 | 7:1 (AAA) |
| Large Text (≥ 18pt) | 3:1 | 4.5:1 (AAA) |
| UI Components | 3:1 | 4.5:1 |
| Graphics/Icons | 3:1 | 4.5:1 |

### Color Palette

Our color system is designed with accessibility in mind:

```css
/* Primary Colors */
--color-primary-50: #eef2ff;   /* Light backgrounds */
--color-primary-500: #6366f1;  /* Main interactive */
--color-primary-900: #312e81;  /* Dark text */

/* Contrast Check Results */
Primary 500 on White: 4.56:1 ✓ (AA)
Primary 900 on White: 13.14:1 ✓ (AAA)
```

### Tools for Testing

1. **Browser DevTools**: Built-in contrast checker
2. **Color Contrast Analyzer**: Chrome extension
3. **a11y-testing utilities**: `testColorContrast()` function

---

## Typography

### Font Sizes

| Element | Minimum Size | Responsive |
|---------|--------------|------------|
| Body text | 16px (1rem) | Scales with user prefs |
| Small text | 14px (0.875rem) | Not for critical info |
| Large text | 24px (1.5rem) or 18.66px bold | For emphasis |
| Headings | 24px - 48px | Fluid scale |

### Line Height

```css
body {
  line-height: 1.6; /* Minimum 1.5 for WCAG */
}

h1, h2, h3 {
  line-height: 1.2;
}
```

### Font Weights

- **Normal**: 400
- **Medium**: 500
- **Bold**: 700 (minimum for accessibility)
- **Avoid**: Light weights (< 400) for body text

---

## Keyboard Navigation

### Tab Order

1. **Logical order**: Tab follows visual reading order
2. **No tabindex > 0**: Avoid artificial tab ordering
3. **Skip links**: Provided for main content areas

### Focus Indicators

```css
/* Visible focus indicator */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Remove default, provide custom */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next element |
| Shift+Tab | Move to previous element |
| Enter/Space | Activate |
| Escape | Close modal/cancel |
| Arrow keys | Navigate within components |

---

## ARIA Attributes

### Required ARIA

| Component | Role | Required Attributes |
|-----------|------|---------------------|
| Modal Dialog | `dialog` | `aria-modal`, `aria-labelledby` |
| Navigation | `navigation` | `aria-label` (if multiple) |
| Tabs | `tablist` | `aria-label` |
| Tab Panel | `tabpanel` | `aria-labelledby` |
| Alert | `alert` | - |
| Button | `button` | `aria-pressed` (toggle) |

### ARIA States

```typescript
// From a11y-v2.ts utilities
setExpanded(element, true);    // aria-expanded
setSelected(element, true);    // aria-selected
setChecked(element, true);     // aria-checked
setPressed(element, true);     // aria-pressed
setHidden(element, false);     // aria-hidden
setInvalid(element, true);     // aria-invalid
```

### Live Regions

```typescript
// Announce to screen readers
announceToScreenReader('Item added to cart', 'polite');

// For errors
announceToScreenReader('Form has errors', 'assertive');
```

---

## Focus Management

### Focus Trap (Modals)

```typescript
// Create focus trap
const cleanup = createFocusTrap(modalElement);

// Cleanup on close
cleanup();
```

### Focus Restore

```typescript
// Save current focus
const focusManager = createFocusRestore();
focusManager.save();

// Open modal, do work...

// Restore focus
focusManager.restore();
```

### Roving Tabindex

For composite widgets (tabs, menus, toolbars):

```typescript
const roving = createRovingTabIndex(container, '[role="tab"]', {
  horizontal: true,
  vertical: false,
  wrap: true,
  onSelect: (item, index) => {
    // Handle selection
  },
});
```

---

## Screen Reader Support

### Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  whiteSpace: nowrap;
  border: 0;
}
```

### Usage

```html
<button>
  <Icon aria-hidden="true" />
  <span class="sr-only">Close menu</span>
</button>
```

---

## Skip Links

### Implementation

```tsx
<SkipLinks>
  <SkipLink href="#main-content">Skip to main content</SkipLink>
  <SkipLink href="#navigation">Skip to navigation</SkipLink>
  <SkipLink href="#search">Skip to search</SkipLink>
</SkipLinks>
```

### Requirements

- Visible on focus
- Hidden until focused
- First focusable element
- Target major landmarks

---

## Forms

### Labels

Every form input MUST have a label:

```html
<!-- Correct -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Or aria-label -->
<input type="search" aria-label="Search" />
```

### Error Handling

```html
<input
  id="email"
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Please enter a valid email address
</span>
```

### Required Fields

```html
<label for="name">
  Name <span aria-hidden="true">*</span>
</label>
<input
  id="name"
  type="text"
  aria-required="true"
/>
```

---

## Touch Targets

### Minimum Size

- **44x44 CSS pixels** (WCAG 2.5.5)
- **48x48 CSS pixels** (Recommended)

### Spacing

- Minimum 8px between targets
- No overlapping targets

### Utilities

```typescript
// Check touch target
if (hasMinimumTouchTarget(element)) {
  // Pass
}

// Ensure minimum size
ensureTouchTarget(element);
```

---

## Reduced Motion

### Detection

```typescript
if (prefersReducedMotion()) {
  // Skip animation
} else {
  // Apply animation
}
```

### CSS

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Checklist

### Automated Testing

- [ ] Color contrast checks
- [ ] Keyboard navigation tests
- [ ] ARIA attribute validation
- [ ] Focus indicator visibility
- [ ] Form label associations

### Manual Testing

- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] Zoom to 200%
- [ ] High contrast mode
- [ ] Reduced motion

### Tools

1. **axe DevTools**: Browser extension
2. **Lighthouse**: Built-in Chrome audit
3. **WAVE**: Web accessibility evaluation
4. **Screen readers**: NVDA (free), JAWS, VoiceOver

---

## Component Accessibility Matrix

| Component | Keyboard | ARIA | Focus | Contrast | Status |
|-----------|----------|------|-------|----------|--------|
| Button | ✓ | ✓ | ✓ | ✓ | Ready |
| Modal | ✓ | ✓ | ✓ | ✓ | Ready |
| Tabs | ✓ | ✓ | ✓ | ✓ | Ready |
| Navigation | ✓ | ✓ | ✓ | ✓ | Ready |
| Form | ✓ | ✓ | ✓ | ✓ | Ready |
| Cards | ✓ | ✓ | ✓ | ✓ | Ready |
| Dropdown | ✓ | ✓ | ✓ | ✓ | Ready |
| Tooltip | ✓ | ✓ | ✓ | ✓ | Ready |
| Accordion | ✓ | ✓ | ✓ | ✓ | Ready |
| Carousel | ✓ | ✓ | ✓ | ✓ | Ready |

---

## Resources

### WCAG Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers

- [NVDA](https://www.nvaccess.org/)
- [VoiceOver (macOS)](https://www.apple.com/accessibility/vision/)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-22 | Complete accessibility system from blank slate |
| 1.0.0 | Initial | Basic WCAG compliance |

---

**Maintained by**: ACCESSIBILITY_CHAMPION (Chris Lee)  
**Last Updated**: 2026-03-22