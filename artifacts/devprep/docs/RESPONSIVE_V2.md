# RESPONSIVE_V2 - Mobile-First Responsive Design System

**Author:** RESPONSIVE_EXPERT (Nina Patel)  
**Experience:** 18 years in mobile-first and adaptive design  
**Created:** 2026-03-22  
**Version:** 2.0.0

---

## Overview

A revolutionary mobile-first responsive design system built from scratch, focusing on:

1. **Custom Breakpoint System** - Mobile (320-639px), Tablet (640-1023px), Desktop (1024-1439px), Wide (1440px+)
2. **Container Queries** - Component-level responsiveness
3. **Fluid Typography** - Viewport-based scaling
4. **Touch Optimization** - 44px minimum targets
5. **Viewport Units** - Immersive mobile experiences
6. **Performance-First** - Optimized for mobile devices

---

## Table of Contents

1. [Breakpoint System](#breakpoint-system)
2. [Container Queries](#container-queries)
3. [Fluid Typography](#fluid-typography)
4. [Touch Optimization](#touch-optimization)
5. [Viewport Units](#viewport-units)
6. [Mobile Components](#mobile-components)
7. [Accessibility](#accessibility)
8. [Performance](#performance)
9. [Integration](#integration)

---

## Breakpoint System

### Custom Breakpoints

| Breakpoint | Range | Min Width | Target Devices |
|------------|-------|-----------|----------------|
| Mobile | 320-639px | 320px | Smartphones (portrait) |
| Tablet | 640-1023px | 640px | Tablets, large phones |
| Desktop | 1024-1439px | 1024px | Laptops, desktops |
| Wide | 1440px+ | 1440px | Large monitors |

### CSS Variables

```css
:root {
  --breakpoint-mobile: 320px;
  --breakpoint-tablet: 640px;
  --breakpoint-desktop: 1024px;
  --breakpoint-wide: 1440px;
  
  /* Max values for range queries */
  --bp-mobile-max: 639px;
  --bp-tablet-max: 1023px;
  --bp-desktop-max: 1439px;
}
```

### Media Queries

```css
/* Mobile-first approach */
@media (min-width: 640px) {
  /* Tablet and up */
}

@media (min-width: 1024px) {
  /* Desktop and up */
}

@media (min-width: 1440px) {
  /* Wide and up */
}
```

---

## Container Queries

Container queries enable component-level responsiveness independent of viewport size.

### Setup

```css
.container-query {
  container-type: inline-size;
  container-name: main;
}
```

### Usage Examples

```css
@container main (min-width: 40rem) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container main (min-width: 64rem) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Predefined Containers

| Container Name | Purpose |
|----------------|---------|
| `main` | General component responsiveness |
| `layout` | Layout-level adjustments |
| `card` | Card component variations |
| `nav` | Navigation component |
| `sidebar` | Sidebar component |

---

## Fluid Typography

Typography that scales smoothly between breakpoints using `clamp()`.

### Scale

| Size | Min | Preferred | Max |
|------|-----|-----------|-----|
| xs | 0.75rem | 0.7rem + 0.25vw | 0.875rem |
| sm | 0.875rem | 0.8rem + 0.35vw | 1rem |
| base | 1rem | 0.9rem + 0.5vw | 1.125rem |
| lg | 1.125rem | 1rem + 0.6vw | 1.25rem |
| xl | 1.25rem | 1.1rem + 0.75vw | 1.5rem |
| 2xl | 1.5rem | 1.3rem + 1vw | 2rem |
| 3xl | 1.875rem | 1.6rem + 1.25vw | 2.5rem |
| 4xl | 2.25rem | 1.9rem + 1.5vw | 3rem |
| 5xl | 3rem | 2.5rem + 2vw | 4rem |
| 6xl | 3.75rem | 3rem + 3vw | 5rem |

### Usage

```html
<h1 class="text-fluid-4xl">Responsive Heading</h1>
<p class="text-fluid-base">Body text that scales smoothly.</p>
```

---

## Touch Optimization

### Minimum Touch Target (44px)

WCAG 2.1 requires a minimum touch target size of 44x44px for accessibility.

### CSS Classes

| Class | Min Width | Min Height |
|-------|-----------|------------|
| `.touch-target` | 44px | 44px |
| `.touch-target-sm` | 48px | 48px |
| `.touch-target-lg` | 56px | 56px |
| `.touch-target-xl` | 64px | 64px |

### Touch Feedback

```css
.touch-feedback {
  transition: transform 0.1s ease-out;
  -webkit-tap-highlight-color: transparent;
}

.touch-feedback:active {
  transform: scale(0.97);
}
```

### Touch Utilities (touch-v2.ts)

```typescript
import { touchUtils } from '../utils/touch-v2';

// Validate touch target
const result = touchUtils.validateTouchTarget(element);

// Make element touch-friendly
const cleanup = touchUtils.makeTouchFriendly(element, {
  minSize: 44,
  addFeedback: true,
  addHaptic: true,
});

// Detect swipe gestures
const removeSwipe = touchUtils.createSwipeDetector(
  element,
  (direction) => {
    console.log('Swiped:', direction);
  }
);

// Detect tap gestures
const removeTap = touchUtils.createTapDetector(
  element,
  (point) => {
    console.log('Tapped at:', point);
  }
);
```

---

## Viewport Units

### Modern Viewport Units

| Unit | Description |
|------|-------------|
| `vh` | 1% of viewport height |
| `dvh` | Dynamic viewport height (adapts to browser UI) |
| `svh` | Small viewport height (minimum) |
| `lvh` | Large viewport height (maximum) |

### CSS Classes

| Class | Property |
|-------|----------|
| `.vh-full` | `height: 100vh` |
| `.vh-dynamic` | `height: 100dvh` |
| `.vh-small` | `height: 100svh` |
| `.vh-large` | `height: 100lvh` |
| `.vh-safe` | `height: calc(100dvh - safe-area)` |

### Safe Area Insets

For notched devices (iPhone X+, modern Android):

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}

.safe-area-all {
  padding-top: var(--safe-top);
  padding-right: var(--safe-right);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
}
```

---

## Mobile Components

### Responsive Container

```html
<div class="container-fluid">
  <!-- Content -->
</div>
```

### Responsive Grid

```html
<div class="grid-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Mobile Card

```html
<div class="card-mobile">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Mobile Modal (Bottom Sheet)

```html
<div class="modal-mobile">
  <div class="modal-mobile-content">
    <!-- Modal content -->
  </div>
</div>
```

### Mobile Toast

```html
<div class="toast-mobile">
  <p>Notification message</p>
</div>
```

---

## Accessibility

### Focus Visible

```css
.focus-visible-mobile:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  .card-mobile {
    border-width: 2px;
  }
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Performance

### Content Visibility

```css
.content-visibility-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

### GPU Acceleration

```css
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Lazy Loading

```html
<img class="lazy-load" src="image.jpg" alt="Description" />
```

---

## Integration

### Tailwind CSS Integration

The responsive system exports custom properties to Tailwind CSS:

```css
@theme inline {
  --touch-target-min: var(--touch-min);
  --text-fluid-base: var(--text-base);
  --space-fluid-4: var(--space-4);
  --vh-mobile: var(--vh-mobile);
  --safe-top: var(--safe-top);
}
```

### Import in Main CSS

```css
/* In src/index.css or main entry point */
@import './styles/new-responsive.css';
```

### Use with React

```tsx
import { touchUtils } from '../utils/touch-v2';
import { useEffect, useRef } from 'react';

function TouchButton({ onClick }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (buttonRef.current) {
      const cleanup = touchUtils.makeTouchFriendly(buttonRef.current, {
        addHaptic: true,
        hapticStyle: 'light',
      });
      return cleanup;
    }
  }, []);
  
  return (
    <button ref={buttonRef} onClick={onClick}>
      Touch Me
    </button>
  );
}
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Container Queries | 105+ | 110+ | 16+ | 105+ |
| `clamp()` | 79+ | 75+ | 13.1+ | 79+ |
| `dvh` units | 108+ | 101+ | 15.4+ | 108+ |
| Safe Area Insets | 111+ | 103+ | 15+ | 111+ |

---

## Migration from v1

### What Changed

1. **New Breakpoints**: 320-639px (Mobile), 640-1023px (Tablet), 1024-1439px (Desktop), 1440px+ (Wide)
2. **Container Queries**: Component-level responsiveness
3. **Fluid Typography**: Viewport-based scaling with `clamp()`
4. **Touch Optimization**: 44px minimum targets, gesture detection
5. **Modern Viewport Units**: `dvh`, `svh`, `lvh` support
6. **Safe Area Insets**: Notched device support

### Breaking Changes

- Renamed classes: `.text-responsive-*` → `.text-fluid-*`
- Container queries require explicit setup
- Touch targets now enforce 44px minimum

---

## Files

| File | Description |
|------|-------------|
| `src/styles/new-responsive.css` | Main responsive CSS system |
| `src/utils/touch-v2.ts` | Touch optimization utilities |
| `docs/RESPONSIVE_V2.md` | This documentation |

---

## Best Practices

### 1. Mobile-First Development
Always start with mobile styles and add complexity for larger screens.

```css
/* Mobile (default) */
.component { padding: 1rem; }

/* Tablet and up */
@media (min-width: 640px) {
  .component { padding: 1.5rem; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component { padding: 2rem; }
}
```

### 2. Touch-First Interactions
Design interactions for touch first, then enhance for mouse/keyboard.

```typescript
// Make all buttons touch-friendly
document.querySelectorAll('button').forEach(button => {
  touchUtils.makeTouchFriendly(button);
});
```

### 3. Container Queries for Components
Use container queries for components that need to adapt to their container, not the viewport.

```css
.card {
  container-type: inline-size;
}

@container (min-width: 300px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

### 4. Viewport Units for Full-Screen
Use `dvh` for full-screen layouts that work with mobile browser UI.

```css
.hero {
  height: 100dvh; /* Not 100vh */
}
```

### 5. Safe Area Insets for Notched Devices
Always account for safe areas on modern devices.

```css
.header {
  padding-top: var(--safe-top);
}
```

---

**Created by RESPONSIVE_EXPERT (Nina Patel)**  
**18 years of mobile-first design experience**