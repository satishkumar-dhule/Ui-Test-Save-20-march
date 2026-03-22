# DevPrep Design System v2.0

## Overview

The DevPrep Design System v2.0 provides a comprehensive foundation for building consistent, accessible, and performant user interfaces. Built with modern design token architecture, it supports Apple Vision Pro-inspired glass morphism effects while maintaining excellent performance.

## Architecture

### Token Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT TOKENS                             │
│                    (--button-*, --card-*, etc.)                  │
├─────────────────────────────────────────────────────────────────┤
│                     SEMANTIC TOKENS                             │
│              (--color-*, --space-*, --radius-*, etc.)           │
├─────────────────────────────────────────────────────────────────┤
│                    PRIMITIVE TOKENS                             │
│              (--primitive-*)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Token Layers

1. **Primitive Tokens** (`--primitive-*`)
   - Raw, theme-agnostic values
   - Never used directly in components
   - Example: `--primitive-space-4: 16px`

2. **Semantic Tokens** (`--color-*`, `--space-*`, etc.)
   - Purpose-based, theme-aware
   - Used by components and utilities
   - Example: `--color-bg-primary: hsl(241 100% 72%)`

3. **Component Tokens** (`--button-*`, `--card-*`, etc.)
   - Specific to component styling
   - Composed from semantic tokens
   - Example: `--button-height-md: 40px`

4. **Glass Tokens** (`--glass-*`)
   - Apple Vision Pro-inspired effects
   - Used for glass morphism styling
   - Example: `--glass-blur-md: 12px`

5. **Depth Tokens** (`--depth-*`, `--spatial-shadow-*`)
   - 3D spatial effects
   - Used for layered UI depth
   - Example: `--depth-layer-2: translateZ(4px)`

## Naming Convention

### Format

```
--{category}-{property}-{variant}-{scale}
```

### Categories

- `color`: Color values
- `space`: Spacing/sizing
- `font`: Typography
- `radius`: Border radius
- `shadow`: Box shadows
- `motion`: Animations
- `glass`: Glass effects
- `depth`: 3D depth

### Properties

- `bg`: Background
- `fg`: Foreground/text
- `border`: Border
- `ring`: Focus ring
- `hover`: Hover state
- `active`: Active state
- `focus`: Focus state

### Variants

- `primary`: Brand primary
- `secondary`: Brand secondary
- `accent`: Accent color
- `muted`: Subtle variant
- `destructive`: Error state
- `success`: Success state
- `warning`: Warning state

### Scale

- `0-100`: Numeric scale
- `xs`, `sm`, `md`, `lg`, `xl`: Size scale

## Usage Guidelines

### Do's

```css
/* Use semantic tokens */
.background {
  background-color: var(--color-bg-primary);
}

/* Use component tokens for component-specific values */
.button {
  height: var(--button-height-md);
  padding: 0 var(--button-padding-x-md);
}

/* Use utility classes for common patterns */
.card {
  @apply glass-card surface-base;
}
```

### Don'ts

```css
/* Don't use primitive tokens directly */
.bad {
  background-color: var(--primitive-space-4); /* ❌ */
}

/* Don't use raw values */
.bad {
  background-color: hsl(241 100% 72%); /* ❌ */
  height: 40px; /* ❌ */
}
```

## Token Reference

### Spacing (4px base)

| Token        | Value | Usage                 |
| ------------ | ----- | --------------------- |
| `--space-0`  | 0px   | Reset                 |
| `--space-1`  | 4px   | Tight spacing         |
| `--space-2`  | 8px   | Small spacing         |
| `--space-3`  | 12px  | Default spacing       |
| `--space-4`  | 16px  | Medium spacing        |
| `--space-5`  | 20px  | Large spacing         |
| `--space-6`  | 24px  | Extra large spacing   |
| `--space-8`  | 32px  | Section spacing       |
| `--space-10` | 40px  | Large section spacing |
| `--space-12` | 48px  | Page spacing          |

### Typography (16px base)

| Token              | Value | Usage            |
| ------------------ | ----- | ---------------- |
| `--font-size-xs`   | 12px  | Captions         |
| `--font-size-sm`   | 14px  | Small text       |
| `--font-size-base` | 16px  | Body text        |
| `--font-size-lg`   | 18px  | Large text       |
| `--font-size-xl`   | 20px  | Headings         |
| `--font-size-2xl`  | 24px  | Large headings   |
| `--font-size-3xl`  | 30px  | Display headings |

### Border Radius

| Token           | Value  | Usage                |
| --------------- | ------ | -------------------- |
| `--radius-sm`   | 2px    | Subtle rounding      |
| `--radius-md`   | 6px    | Default rounding     |
| `--radius-lg`   | 8px    | Card rounding        |
| `--radius-xl`   | 12px   | Large card rounding  |
| `--radius-2xl`  | 16px   | Modal rounding       |
| `--radius-3xl`  | 24px   | Extra large rounding |
| `--radius-full` | 9999px | Pills, circles       |

### Shadows

| Token           | Elevation          |
| --------------- | ------------------ |
| `--shadow-xs`   | Minimal            |
| `--shadow-sm`   | Small elements     |
| `--shadow-base` | Cards              |
| `--shadow-md`   | Elevated cards     |
| `--shadow-lg`   | Modals, dialogs    |
| `--shadow-xl`   | Popovers, tooltips |
| `--shadow-2xl`  | Maximum elevation  |

### Glass Effects

| Token               | Description             |
| ------------------- | ----------------------- |
| `--glass-blur-sm`   | 6px blur                |
| `--glass-blur-md`   | 12px blur               |
| `--glass-blur-lg`   | 18px blur               |
| `--glass-blur-xl`   | 24px blur               |
| `--glass-bg-light`  | Light glass background  |
| `--glass-bg-medium` | Medium glass background |
| `--glass-bg-dark`   | Dark glass background   |

### Depth (3D)

| Token             | Translation |
| ----------------- | ----------- |
| `--depth-layer-1` | 0px         |
| `--depth-layer-2` | 4px         |
| `--depth-layer-3` | 8px         |
| `--depth-layer-4` | 12px        |
| `--depth-layer-5` | 16px        |

## Utility Classes

### Spacing

```html
<div class="space-flow">...</div>
<!-- Default: 16px gap -->
<div class="space-flow-sm">...</div>
<!-- Small: 8px gap -->
<div class="space-flow-lg">...</div>
<!-- Large: 24px gap -->
```

### Colors

```html
<div class="text-balance">...</div>
<!-- Balanced text wrap -->
<div class="text-pretty">...</div>
<!-- Pretty text wrap -->
```

### Glass Effects

```html
<div class="glass-card">...</div>
<!-- Glass morphism card -->
<div class="glass-card surface-base">...</div>
<!-- With base surface -->
```

### Focus States

```html
<button class="focus-ring">...</button>
<!-- Primary focus ring -->
<button class="focus-ring-subtle">...</button>
<!-- Subtle focus ring -->
```

### Depth Layers

```html
<div class="depth-1">...</div>
<!-- Level 1 elevation -->
<div class="depth-2">...</div>
<!-- Level 2 elevation -->
<div class="depth-3">...</div>
<!-- Level 3 elevation -->
```

### Transitions

```html
<div class="transition-theme">...</div>
<!-- Theme color transitions -->
<div class="transition-transform">...</div>
<!-- Transform transitions -->
<div class="transition-opacity">...</div>
<!-- Opacity transitions -->
```

### Surfaces

```html
<div class="surface-base">...</div>
<!-- Base surface -->
<div class="surface-subtle">...</div>
<!-- Subtle surface -->
<div class="surface-muted">...</div>
<!-- Muted surface -->
<div class="surface-inset">...</div>
<!-- Inset surface -->
```

## Theming

### Light Mode (Default)

```css
:root {
  /* Light mode tokens are defined in tokens.css */
}
```

### Dark Mode

```css
.dark {
  /* Dark mode overrides are defined in tokens.css */
}
```

### Custom Theme Overrides

```css
:root {
  /* Override specific tokens */
  --color-bg-primary: hsl(200 100% 50%);
}
```

## Accessibility

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are automatically reduced */
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  /* Borders become more visible */
}
```

## Performance Considerations

1. **GPU Acceleration**: Glass effects use `transform: translateZ(0)` for GPU acceleration
2. **Will-change Hints**: Frequently animated elements use `will-change`
3. **Containment**: Glass elements use `contain: layout style paint`
4. **Mobile Optimizations**: Reduced blur intensity on mobile devices

## Migration Guide

### From v1.0 to v2.0

1. **Import new tokens**: Add `@import './styles/tokens.css';` to main CSS
2. **Update color references**: Replace HSL values with semantic tokens
3. **Replace spacing values**: Use `--space-*` tokens instead of raw px values
4. **Update glass effects**: Use new glass utility classes

### Example Migration

```css
/* Before (v1.0) */
.card {
  background: hsl(240 10% 96%);
  padding: 16px;
  border-radius: 8px;
}

/* After (v2.0) */
.card {
  background: var(--color-surface-base);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Chrome Android 90+
- Backdrop filter support for glass effects

## File Structure

```
src/styles/
├── tokens.css          # New design token system (v2.0)
├── typography.css      # Apple typography scale
├── glass.css           # Glass morphism utilities
├── animations.css      # Animation utilities
└── layout.css          # Layout utilities
```

## Contributing

When adding new tokens:

1. Follow the naming convention
2. Add to the appropriate layer (primitive, semantic, component)
3. Document in the token reference
4. Consider light/dark mode implications
5. Test across breakpoints

---

**Version**: 2.0.0  
**Last Updated**: 2026-03-22  
**Author**: DESIGN_SYSTEM_LEAD (Alex Chen)
