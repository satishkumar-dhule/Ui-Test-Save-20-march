# DevPrep Visual Design System

**Version**: 1.0.0  
**Last Updated**: 2026-03-22  
**Author**: VISUAL_CREATIVITY_EXPERT (David Kim)

This document provides comprehensive visual design specifications for the DevPrep application, establishing a cohesive visual language across all platforms and interfaces.

---

## Table of Contents

1. [Visual Identity System](#1-visual-identity-system)
2. [Animation & Motion Design](#2-animation--motion-design)
3. [Spacing & Layout System](#3-spacing--layout-system)
4. [Creative Visual Elements](#4-creative-visual-elements)
5. [Illustrations & Empty States](#5-illustrations--empty-states)
6. [Responsive Visual Strategy](#6-responsive-visual-strategy)
7. [Statistics Page Design](#7-statistics-page-design)

---

## 1. Visual Identity System

### 1.1 Logo Usage Guidelines

#### Primary Logo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌──────┐                                                 │
│    │  DP  │  DevPrep                                        │
│    └──────┘                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Logo Specifications

| Element       | Value          | Description                      |
| ------------- | -------------- | -------------------------------- |
| Primary Mark  | `DP` monogram  | 32x32px minimum, scalable vector |
| Wordmark      | "DevPrep"      | Inter Bold, 24px at 1x           |
| Clear Space   | 1x logo height | Minimum padding on all sides     |
| Minimum Size  | 24px height    | Below this, use icon only        |
| Maximum Width | 200px          | Full-width containers            |

#### Logo SVG Placeholder

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" fill="currentColor">
  <!-- Primary Mark -->
  <rect x="0" y="0" width="32" height="32" rx="6" fill="currentColor"/>
  <text x="16" y="22" text-anchor="middle" font-family="Inter" font-weight="700" font-size="14" fill="white">DP</text>
  <!-- Wordmark -->
  <text x="40" y="22" font-family="Inter" font-weight="700" font-size="18">DevPrep</text>
</svg>
```

#### Logo Color Applications

| Theme              | Logo Color                  | Background        |
| ------------------ | --------------------------- | ----------------- |
| Light              | `--brand-primary` (#4f46e5) | `--bg-primary`    |
| Dark               | `--brand-primary` (#818cf8) | `--bg-primary`    |
| High Contrast      | `--brand-primary` (#a5b4fc) | `--bg-primary`    |
| Inverted (dark bg) | White (#ffffff)             | `--brand-primary` |

#### Logo Misuse

- Do not stretch or distort
- Do not change colors outside brand palette
- Do not add effects (shadows, gradients)
- Do not place on busy backgrounds without container

---

### 1.2 Brand Color Application Rules

#### Primary Color Usage

| Application     | Color Variable           | Hex Value | Usage                        |
| --------------- | ------------------------ | --------- | ---------------------------- |
| Primary Actions | `--brand-primary`        | #4f46e5   | CTAs, primary buttons, links |
| Primary Hover   | `--brand-primary-hover`  | #4338ca   | Button hover states          |
| Primary Active  | `--brand-primary-active` | #3730a3   | Button press states          |
| Primary Subtle  | `--brand-primary-subtle` | #eef2ff   | Backgrounds, badges          |

#### Secondary Color Usage

| Application       | Color Variable             | Hex Value | Usage                 |
| ----------------- | -------------------------- | --------- | --------------------- |
| Secondary Actions | `--brand-secondary`        | #0d9488   | Secondary CTAs, icons |
| Category Tags     | `--brand-secondary-subtle` | #f0fdfa   | Tag backgrounds       |
| Success States    | `--semantic-success`       | #16a34a   | Success messages      |

#### Accent Color Usage

| Application | Color Variable       | Hex Value | Usage                               |
| ----------- | -------------------- | --------- | ----------------------------------- |
| Highlights  | `--brand-accent`     | #f97316   | Promotional elements, notifications |
| Progress    | `--brand-accent`     | #f97316   | Progress indicators                 |
| Warnings    | `--semantic-warning` | #d97706   | Warning messages                    |

#### Color Hierarchy Rules

1. **Primary > Secondary > Accent**: Use primary for main actions, secondary for supporting, accent for highlights
2. **Maximum 3 colors per view**: Limit active palette to prevent visual clutter
3. **Contrast ratio 4.5:1 minimum**: WCAG AA compliance for all text
4. **Semantic consistency**: Success = green, Error = red, Warning = amber, Info = blue

---

### 1.3 Icon Set Guidelines (Lucide React)

#### Icon Sizing Scale

| Size | Pixels | Use Case                         |
| ---- | ------ | -------------------------------- |
| xs   | 16x16  | Inline text, badges              |
| sm   | 20x20  | Toolbar, compact UI              |
| md   | 24x24  | Standard navigation, buttons     |
| lg   | 32x32  | Feature highlights, empty states |
| xl   | 48x48  | Large CTAs, hero sections        |

#### Icon Stroke Weight

| Weight  | Pixels | Usage                   |
| ------- | ------ | ----------------------- |
| Light   | 1.5px  | High contrast themes    |
| Default | 2px    | Standard usage          |
| Bold    | 2.5px  | Emphasis, active states |

#### Icon Color Tokens

```css
.icon-default {
  color: var(--text-primary);
}

.icon-muted {
  color: var(--text-tertiary);
}

.icon-primary {
  color: var(--brand-primary);
}

.icon-success {
  color: var(--semantic-success);
}

.icon-error {
  color: var(--semantic-error);
}

.icon-warning {
  color: var(--semantic-warning);
}
```

#### Icon Usage Rules

1. **Consistent padding**: 8px around icon in buttons
2. **Meaningful icons**: Icons must convey meaning, not just decoration
3. **Accessible labels**: `aria-label` required for icon-only buttons
4. **No mixing styles**: Stick to outlined OR filled, not both

#### Common Icons by Context

| Context         | Primary Icon    | Alternative       |
| --------------- | --------------- | ----------------- |
| Navigation Home | `Home`          | `House`           |
| Settings        | `Settings`      | `Gear`            |
| User Profile    | `User`          | `UserCircle`      |
| Search          | `Search`        | `MagnifyingGlass` |
| Notifications   | `Bell`          | `BellRing`        |
| Help            | `HelpCircle`    | `CircleHelp`      |
| Add/Create      | `Plus`          | `Add`             |
| Edit            | `Pencil`        | `Edit`            |
| Delete          | `Trash2`        | `Trash`           |
| Success         | `CheckCircle`   | `Check`           |
| Error           | `XCircle`       | `AlertCircle`     |
| Warning         | `AlertTriangle` | `Warning`         |
| Loading         | `Loader2`       | `Spinner`         |

---

### 1.4 Illustration Style Guide

#### Illustration Principles

1. **Minimalist**: Clean lines, simple shapes
2. **Purposeful**: Each illustration communicates one concept
3. **Cohesive**: Unified style across all illustrations
4. **Accessible**: Meaningful without color

#### Color Palette for Illustrations

| Color         | Hex     | Usage                      |
| ------------- | ------- | -------------------------- |
| Primary       | #4f46e5 | Main elements, CTAs        |
| Secondary     | #14b8a6 | Supporting elements        |
| Accent        | #f97316 | Highlights, call-to-action |
| Neutral Dark  | #171717 | Outlines, details          |
| Neutral Light | #737373 | Shadows, secondary lines   |

#### Illustration Specifications

| Element       | Specification      |
| ------------- | ------------------ |
| Stroke Width  | 2px default        |
| Border Radius | 4px on shapes      |
| Viewbox       | 200x200px standard |
| File Format   | SVG, optimized     |
| Max File Size | 15KB               |

#### Illustration Compositions

```
┌─────────────────────────────────────────┐
│                                         │
│           [Illustration]               │
│              120x120px                  │
│                                         │
│    ┌─────────────────────────┐         │
│    │     Title Text           │         │
│    └─────────────────────────┘         │
│                                         │
│    ┌─────────────────────────┐         │
│    │   Description Text      │         │
│    │   max-width: 280px      │         │
│    └─────────────────────────┘         │
│                                         │
│         [Action Button]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

### 1.5 Image Photography Style

#### Image Guidelines

| Aspect         | Specification                |
| -------------- | ---------------------------- |
| Aspect Ratios  | 16:9, 4:3, 1:1, 3:2          |
| Min Resolution | 640x360px                    |
| Max File Size  | 200KB                        |
| Format         | WebP (primary), PNG fallback |

#### Image Treatment

| Element        | Specification             |
| -------------- | ------------------------- |
| Border Radius  | `--radius-lg` (8px)       |
| Shadow         | `--shadow-md` optional    |
| Overlay (text) | 40% black gradient bottom |
| Lazy Loading   | Native `loading="lazy"`   |

#### Image Placeholder Colors

```css
.image-placeholder {
  background: linear-gradient(
    135deg,
    var(--surface-secondary) 0%,
    var(--surface-tertiary) 100%
  );
}
```

---

## 2. Animation & Motion Design

### 2.1 Easing Curves

#### Primary Easing

```css
:root {
  /* Primary ease - smooth, natural deceleration */
  --ease-primary: cubic-bezier(0.4, 0, 0.2, 1);

  /* Enter ease - quick start, smooth end */
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);

  /* Exit ease - smooth start, quick end */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* Bounce ease - for playful interactions */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Spring feel - for draggable elements */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

#### Easing Usage Matrix

| Interaction      | Easing           | Description       |
| ---------------- | ---------------- | ----------------- |
| Hover states     | `--ease-primary` | Natural response  |
| Page transitions | `--ease-enter`   | Content entering  |
| Modals/dialogs   | `--ease-primary` | Smooth reveal     |
| Notifications    | `--ease-bounce`  | Playful arrival   |
| Drag/drop        | `--ease-spring`  | Physical feel     |
| Loading          | `linear`         | Continuous motion |

---

### 2.2 Duration Scale

| Token                | Duration | Usage                |
| -------------------- | -------- | -------------------- |
| `--duration-instant` | 0ms      | No animation         |
| `--duration-fast`    | 100ms    | Micro-interactions   |
| `--duration-normal`  | 200ms    | Standard transitions |
| `--duration-slow`    | 300ms    | Page transitions     |
| `--duration-slower`  | 500ms    | Complex animations   |

#### CSS Duration Variables

```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Transition shorthand */
  --transition-fast: var(--duration-fast) var(--ease-primary);
  --transition-normal: var(--duration-normal) var(--ease-primary);
  --transition-slow: var(--duration-slow) var(--ease-primary);
}
```

#### Duration Guidelines

| Category      | Duration | Examples             |
| ------------- | -------- | -------------------- |
| Instantaneous | 0ms      | State changes, focus |
| Micro         | 100ms    | Hover, tooltip       |
| Standard      | 200ms    | Buttons, toggles     |
| Medium        | 300ms    | Cards, dropdowns     |
| Slow          | 500ms    | Page loads, modals   |
| Celebration   | 800ms    | Success animations   |

---

### 2.3 Page Transitions

#### Transition Types

##### Fade Transition

```css
.page-fade-enter {
  opacity: 0;
}

.page-fade-enter-active {
  opacity: 1;
  transition: opacity var(--duration-normal) var(--ease-enter);
}

.page-fade-exit {
  opacity: 1;
}

.page-fade-exit-active {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-exit);
}
```

##### Slide Transition

```css
.page-slide-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-slide-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all var(--duration-normal) var(--ease-primary);
}

.page-slide-exit {
  opacity: 1;
  transform: translateX(0);
}

.page-slide-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: all var(--duration-fast) var(--ease-exit);
}
```

##### Scale Transition

```css
.page-scale-enter {
  opacity: 0;
  transform: scale(0.95);
}

.page-scale-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: all var(--duration-normal) var(--ease-spring);
}
```

#### Default Page Transition

```css
.page-transition {
  animation: page-enter var(--duration-slow) var(--ease-enter);
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 2.4 Micro-interactions

#### Button Press

```css
.btn {
  transition: all var(--duration-fast) var(--ease-primary);
}

.btn:active {
  transform: scale(0.97);
}

.btn:hover {
  filter: brightness(0.95);
}
```

#### Toggle Switch

```css
.switch {
  transition: background-color var(--duration-fast) var(--ease-primary);
}

.switch-thumb {
  transition: transform var(--duration-fast) var(--ease-spring);
}

.switch[data-state="checked"] .switch-thumb {
  transform: translateX(1.25rem);
}
```

#### Checkbox

```css
.checkbox {
  transition: all var(--duration-fast) var(--ease-primary);
}

.checkbox[data-state="checked"] {
  background-color: var(--brand-primary);
  border-color: var(--brand-primary);
  animation: check-bounce var(--duration-normal) var(--ease-bounce);
}

@keyframes check-bounce {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
```

#### Hover Card Lift

```css
.card-interactive {
  transition: all var(--duration-normal) var(--ease-primary);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-interactive:active {
  transform: translateY(0);
}
```

#### Input Focus

```css
.input {
  transition: all var(--duration-fast) var(--ease-primary);
}

.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--brand-primary-subtle);
}
```

#### Dropdown Open

```css
.dropdown-content {
  animation: dropdown-enter var(--duration-normal) var(--ease-spring);
  transform-origin: top;
}

@keyframes dropdown-enter {
  from {
    opacity: 0;
    transform: scaleY(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
}
```

---

### 2.5 Loading States

#### Skeleton Loader

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-secondary) 0%,
    var(--surface-tertiary) 50%,
    var(--surface-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

#### Spinner

```css
.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--surface-tertiary);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Sizes */
.spinner-sm {
  width: 1rem;
  height: 1rem;
  border-width: 1.5px;
}
.spinner-lg {
  width: 2rem;
  height: 2rem;
  border-width: 3px;
}
```

#### Progress Bar

```css
.progress-bar {
  transition: width var(--duration-slow) var(--ease-primary);
}

/* Indeterminate state */
.progress-indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
```

#### Content Placeholder

```css
.skeleton-line {
  height: 1rem;
  border-radius: var(--radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line-title {
  height: 1.5rem;
  width: 60%;
}

.skeleton-line-text {
  height: 0.875rem;
  width: 100%;
  margin-top: var(--space-2);
}
```

---

### 2.6 List Stagger Animations

#### Stagger Implementation

```css
.list-item {
  opacity: 0;
  transform: translateY(10px);
  animation: list-item-enter var(--duration-normal) var(--ease-enter) forwards;
}

.list-item:nth-child(1) {
  animation-delay: 0ms;
}
.list-item:nth-child(2) {
  animation-delay: 50ms;
}
.list-item:nth-child(3) {
  animation-delay: 100ms;
}
.list-item:nth-child(4) {
  animation-delay: 150ms;
}
.list-item:nth-child(5) {
  animation-delay: 200ms;
}
.list-item:nth-child(6) {
  animation-delay: 250ms;
}
.list-item:nth-child(7) {
  animation-delay: 300ms;
}
.list-item:nth-child(8) {
  animation-delay: 350ms;
}

@keyframes list-item-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Dynamic Stagger (CSS)

```css
.list-container {
  --stagger-delay: 50ms;
  --stagger-index: 0;
}

.list-item {
  animation-delay: calc(var(--stagger-index) * var(--stagger-delay));
  counter-increment: stagger-index;
}
```

---

### 2.7 Reduced Motion

#### Respecting User Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Keep opacity transitions for state changes */
  .btn:focus-visible,
  .card-interactive:focus-visible {
    transition: opacity var(--duration-fast);
  }
}
```

#### JavaScript Motion Check

```typescript
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const getAnimationDuration = (baseDuration: number) => {
  return prefersReducedMotion ? 0 : baseDuration;
};
```

---

## 3. Spacing & Layout System

### 3.1 Base Grid

#### 4px Grid System

```
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │
│4px │8px │12px│16px│20px│24px│28px│32px│
└────┴────┴────┴────┴────┴────┴────┴────┘
```

All spacing values must be multiples of 4px.

---

### 3.2 Spacing Scale

#### CSS Variables

```css
:root {
  /* Spacing Scale - 4px base */
  --space-0: 0px;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */
}
```

#### Spacing Usage Guidelines

| Token        | Pixels | Usage                    |
| ------------ | ------ | ------------------------ |
| `--space-0`  | 0px    | Reset, no spacing        |
| `--space-1`  | 4px    | Tight spacing, icon gaps |
| `--space-2`  | 8px    | Default element gaps     |
| `--space-3`  | 12px   | Compact padding          |
| `--space-4`  | 16px   | Standard padding         |
| `--space-5`  | 20px   | Comfortable padding      |
| `--space-6`  | 24px   | Section padding          |
| `--space-8`  | 32px   | Card padding             |
| `--space-10` | 40px   | Section gaps             |
| `--space-12` | 48px   | Large section gaps       |
| `--space-16` | 64px   | Page section padding     |
| `--space-20` | 80px   | Hero sections            |
| `--space-24` | 96px   | Major section breaks     |
| `--space-32` | 128px  | Page-level spacing       |

---

### 3.3 Container Max-Widths

#### Container Width Scale

```css
:root {
  --container-xs: 20rem; /* 320px */
  --container-sm: 24rem; /* 384px */
  --container-md: 28rem; /* 448px */
  --container-lg: 32rem; /* 512px */
  --container-xl: 36rem; /* 576px */
  --container-2xl: 42rem; /* 672px */
  --container-3xl: 48rem; /* 768px */
  --container-4xl: 56rem; /* 896px */
  --container-5xl: 64rem; /* 1024px */
  --container-6xl: 72rem; /* 1152px */
  --container-7xl: 80rem; /* 1280px */
}
```

#### Container Usage

| Container         | Width  | Usage                        |
| ----------------- | ------ | ---------------------------- |
| `--container-xs`  | 320px  | Narrow cards, inline content |
| `--container-sm`  | 384px  | Form containers              |
| `--container-md`  | 448px  | Alert containers             |
| `--container-lg`  | 512px  | Sidebar content              |
| `--container-xl`  | 576px  | Card content                 |
| `--container-2xl` | 672px  | Medium content areas         |
| `--container-3xl` | 768px  | Content columns              |
| `--container-4xl` | 896px  | Wide content                 |
| `--container-5xl` | 1024px | Main content                 |
| `--container-6xl` | 1152px | Dashboard layout             |
| `--container-7xl` | 1280px | Max-width container          |

---

### 3.4 Section Padding Guidelines

#### Page Section Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Hero Section                                           │
│  padding-top: var(--space-16)                          │
│  padding-bottom: var(--space-16)                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Content Section                                        │
│  padding-top: var(--space-12)                           │
│  padding-bottom: var(--space-12)                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Secondary Section                                      │
│  padding-top: var(--space-8)                            │
│  padding-bottom: var(--space-8)                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Section Spacing Rules

| Section Type      | Vertical Padding             | Background              |
| ----------------- | ---------------------------- | ----------------------- |
| Hero              | `--space-16` to `--space-20` | Gradient or brand color |
| Primary Content   | `--space-12`                 | Default                 |
| Secondary Content | `--space-8`                  | `--surface-secondary`   |
| Compact Section   | `--space-6`                  | Default                 |
| Footer            | `--space-12`                 | `--surface-secondary`   |

---

### 3.5 Card Padding Standards

#### Card Padding Scale

| Size    | Padding     | Usage                   |
| ------- | ----------- | ----------------------- |
| Compact | `--space-3` | Tags, badges            |
| Small   | `--space-4` | List items, small cards |
| Default | `--space-6` | Standard cards          |
| Large   | `--space-8` | Feature cards           |
| None    | 0           | Full-bleed cards        |

#### Card Internal Spacing

```
┌─────────────────────────────────────┐
│                                     │
│  Card Header                        │
│  padding: var(--space-6)            │
│  border-bottom: 1px solid border    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Card Content                       │
│  padding: var(--space-6)            │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Card Footer                        │
│  padding: var(--space-6)            │
│  border-top: 1px solid border       │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Creative Visual Elements

### 4.1 Gradient Usage

#### Gradient Principles

1. **Subtle, not overwhelming**: Max 15% opacity
2. **Directional**: Use linear gradients with clear direction
3. **Limited colors**: Max 2-3 colors per gradient
4. **Meaningful**: Gradients should guide attention

#### Gradient Tokens

```css
:root {
  /* Subtle Background Gradients */
  --gradient-subtle: linear-gradient(
    to bottom,
    var(--surface-primary),
    var(--surface-secondary)
  );

  /* Brand Gradient - Subtle */
  --gradient-brand: linear-gradient(
    135deg,
    var(--brand-primary-subtle) 0%,
    var(--brand-secondary-subtle) 100%
  );

  /* Surface Gradient */
  --gradient-surface: linear-gradient(
    180deg,
    var(--surface-primary) 0%,
    var(--surface-tertiary) 100%
  );

  /* Overlay Gradient */
  --gradient-overlay: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.5) 0%,
    transparent 100%
  );
}
```

#### Gradient Usage Examples

| Element         | Gradient             | Opacity |
| --------------- | -------------------- | ------- |
| Hero Background | `--gradient-brand`   | 100%    |
| Card Hover      | `--gradient-surface` | 50%     |
| Image Overlay   | `--gradient-overlay` | 40%     |
| Skeleton        | `--gradient-shimmer` | 15%     |

---

### 4.2 Shadow Elevation System

#### Shadow Levels

```css
:root {
  /* Elevation 0 - Flat */
  --elevation-0: none;

  /* Elevation 1 - Subtle lift */
  --elevation-1: 0 1px 2px 0 rgb(0 0 0 / 0.05);

  /* Elevation 2 - Card default */
  --elevation-2: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

  /* Elevation 3 - Hover state */
  --elevation-3:
    0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  /* Elevation 4 - Dropdown, popover */
  --elevation-4:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Elevation 5 - Modal */
  --elevation-5:
    0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Elevation 6 - Full overlay */
  --elevation-6: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
```

#### Shadow Usage Matrix

| Elevation | Level    | Use Case         | Example             |
| --------- | -------- | ---------------- | ------------------- |
| 0         | Flat     | Default elements | Buttons, inputs     |
| 1         | Subtle   | Text containers  | Paragraphs          |
| 2         | Default  | Cards            | Content cards       |
| 3         | Lifted   | Interactive      | Hover cards         |
| 4         | Elevated | Floating         | Dropdowns, tooltips |
| 5         | Floating | Overlay          | Modals, dialogs     |
| 6         | High     | Full overlay     | Toast notifications |

#### Dark Mode Shadows

```css
:root[data-theme="dark"] {
  --elevation-1: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --elevation-2: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  --elevation-3:
    0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --elevation-4:
    0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3);
  --elevation-5:
    0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4);
  --elevation-6: 0 25px 50px -12px rgb(0 0 0 / 0.6);
}
```

---

### 4.3 Border Radius Scale

#### Radius Tokens

```css
:root {
  /* Border Radius Scale */
  --radius-sm: 0.125rem; /* 2px - Micro elements */
  --radius-md: 0.375rem; /* 6px - Buttons, inputs */
  --radius-lg: 0.5rem; /* 8px - Cards, containers */
  --radius-xl: 0.75rem; /* 12px - Modals */
  --radius-2xl: 1rem; /* 16px - Large cards */
  --radius-3xl: 1.5rem; /* 24px - Hero elements */
  --radius-full: 9999px; /* Pill shapes */
}
```

#### Radius Usage

| Token           | Value  | Usage                    |
| --------------- | ------ | ------------------------ |
| `--radius-sm`   | 2px    | Checkboxes, badges       |
| `--radius-md`   | 6px    | Buttons, inputs, chips   |
| `--radius-lg`   | 8px    | Cards, panels            |
| `--radius-xl`   | 12px   | Modals, large containers |
| `--radius-2xl`  | 16px   | Feature cards, images    |
| `--radius-3xl`  | 24px   | Hero sections            |
| `--radius-full` | 9999px | Pills, avatars, toggles  |

#### Component Radius Guidelines

```
┌─────────────────────────────────────────────┐
│                                             │
│  Component       Border Radius              │
│  ────────────────────────────────────────   │
│                                             │
│  Badge/Chip      --radius-full              │
│  Button          --radius-md                 │
│  Input           --radius-md                 │
│  Card            --radius-lg                 │
│  Modal           --radius-xl                 │
│  Feature Card    --radius-2xl                │
│  Avatar          --radius-full               │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4.4 Backdrop Blur Guidelines

#### Blur Scale

```css
:root {
  --blur-none: blur(0);
  --blur-sm: blur(4px);
  --blur-md: blur(8px);
  --blur-lg: blur(16px);
  --blur-xl: blur(24px);
  --blur-2xl: blur(40px);
}
```

#### Blur Usage

| Token       | Blur | Usage                     | Opacity |
| ----------- | ---- | ------------------------- | ------- |
| `--blur-sm` | 4px  | Tooltips, subtle overlays | 70%     |
| `--blur-md` | 8px  | Dropdowns, hover states   | 80%     |
| `--blur-lg` | 16px | Modals, dialogs           | 90%     |
| `--blur-xl` | 24px | Full-screen overlays      | 95%     |

#### Blur Implementation

```css
.backdrop-blur {
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
}

.overlay {
  background: rgba(0, 0, 0, var(--blur-opacity));
  backdrop-filter: blur(var(--blur-lg));
}
```

#### Performance Considerations

1. **Use sparingly**: Blur is GPU-intensive
2. **Test on low-end devices**: May cause jank
3. **Provide fallback**: Solid background for unsupported browsers

---

### 4.5 Visual Hierarchy Through Whitespace

#### Hierarchy Principles

1. **More space = more importance**: Key elements get breathing room
2. **Consistent rhythm**: Follow spacing scale
3. **Group related items**: Tighter spacing within groups
4. **Separate distinct sections**: Larger gaps between sections

#### Whitespace Patterns

```
┌─────────────────────────────────────────┐
│                                         │
│  HEADING (--space-12 bottom margin)    │
│                                         │
│  Subtext (--space-2 bottom margin)      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Component Group]                       │
│  Internal spacing: --space-3           │
│                                         │
│  [Component Group]                      │
│  External spacing: --space-6            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Section 2                              │
│  Margin-top: --space-12                 │
│                                         │
└─────────────────────────────────────────┘
```

#### Content Width Hierarchy

| Content Type | Max Width | Line Height | Usage             |
| ------------ | --------- | ----------- | ----------------- |
| Body text    | 65ch      | 1.6         | Long-form reading |
| Headings     | 35ch      | 1.2         | Section titles    |
| UI text      | 100%      | 1.5         | Buttons, labels   |
| Code         | 100%      | 1.6         | Code blocks       |

---

### 4.6 Dark Mode Visual Considerations

#### Dark Mode Principles

1. **Elevate surfaces**: Lighter backgrounds for raised elements
2. **Reduce contrast**: Softer whites on dark backgrounds
3. **Avoid pure black**: Use `--neutral-950` instead of black
4. **Maintain hierarchy**: Elevated elements should stand out

#### Dark Mode Elevation

```
┌─────────────────────────────────────────┐
│                                         │
│  Background (--bg-primary)              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Card/Surface 1                 │    │
│  │  (--surface-primary)           │    │
│  │                                 │    │
│  │    ┌─────────────────────┐      │    │
│  │    │  Surface 2         │      │    │
│  │    │  (--surface-2)     │      │    │
│  │    └─────────────────────┘      │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

#### Dark Mode Color Adjustments

| Light Mode         | Dark Mode             | Adjustment        |
| ------------------ | --------------------- | ----------------- |
| White (#fff)       | Neutral-950 (#0a0a0a) | Avoid pure black  |
| Gray-100 (#f5f5f5) | Neutral-900 (#171717) | Primary surface   |
| Gray-200 (#e5e5e5) | Neutral-800 (#262626) | Secondary surface |
| Gray-500 (#737373) | Neutral-400 (#a3a3a3) | Muted text        |
| Gray-900 (#171717) | Neutral-50 (#fafafa)  | Primary text      |

#### High Contrast Mode

| Element    | Light   | Dark    | High Contrast |
| ---------- | ------- | ------- | ------------- |
| Background | #ffffff | #0a0a0a | #000000       |
| Text       | #171717 | #fafafa | #ffffff       |
| Border     | #e5e5e5 | #262626 | #525252       |
| Focus Ring | 2px     | 2px     | 3px           |

---

## 5. Illustrations & Empty States

### 5.1 Empty State Illustration Style

#### Illustration Anatomy

```
┌─────────────────────────────────────────┐
│                                         │
│           ┌───────────────┐             │
│           │               │             │
│           │  Illustration  │             │
│           │   120x120px    │             │
│           │               │             │
│           └───────────────┘             │
│                                         │
│           Title (h4)                    │
│           max-width: 280px              │
│                                         │
│           Description (body)             │
│           max-width: 280px              │
│           text-align: center            │
│                                         │
│           ┌─────────────────┐           │
│           │  Action Button   │           │
│           └─────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

#### Empty State Illustration Elements

| Element       | Specification                |
| ------------- | ---------------------------- |
| Size          | 120x120px                    |
| Style         | Line art, minimal detail     |
| Colors        | Neutral grays + brand accent |
| Stroke        | 2px                          |
| Border Radius | 4px                          |

#### Empty State Types

| Type       | Illustration              | Title Pattern          |
| ---------- | ------------------------- | ---------------------- |
| No Data    | Folder with question mark | "No [items] yet"       |
| No Results | Magnifying glass          | "No results found"     |
| No Content | Document with plus        | "Nothing here"         |
| Error      | Cloud with warning        | "Something went wrong" |

---

### 5.2 Error State Visual Language

#### Error State Components

```
┌─────────────────────────────────────────┐
│                                         │
│           ┌───────────────┐             │
│           │   X Circle    │             │
│           │   Error Icon   │             │
│           └───────────────┘             │
│           color: --semantic-error       │
│                                         │
│           Error Title                   │
│           color: --semantic-error       │
│                                         │
│           Error Description             │
│           color: --text-secondary       │
│                                         │
│           ┌─────────────────┐           │
│           │  Try Again      │           │
│           │  Primary Button │           │
│           └─────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

#### Error State Patterns

| Error Type    | Icon        | Color                | Action          |
| ------------- | ----------- | -------------------- | --------------- |
| Network Error | WifiOff     | `--semantic-error`   | Retry           |
| Not Found     | FileX       | `--semantic-warning` | Go back         |
| Server Error  | ServerCrash | `--semantic-error`   | Contact support |
| Permission    | Lock        | `--semantic-warning` | Request access  |

---

### 5.3 Success/Completion Celebrations

#### Success Animation Sequence

```css
.success-animation {
  animation: success-pop var(--duration-slow) var(--ease-spring);
}

@keyframes success-pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.success-checkmark {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw-check var(--duration-slow) var(--ease-primary) forwards;
}

@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}
```

#### Celebration Elements

| Element        | Animation        | Duration |
| -------------- | ---------------- | -------- |
| Success Icon   | Scale + fade in  | 500ms    |
| Checkmark Draw | Stroke animation | 400ms    |
| Confetti       | Particle system  | 2000ms   |
| Progress Fill  | Width transition | 800ms    |

---

### 5.4 Onboarding Illustration Concepts

#### Onboarding Step Layout

```
┌─────────────────────────────────────────┐
│                                         │
│  Progress Indicator                     │
│  Step 1 of 4                           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │                                 │    │
│  │      Illustration Area          │    │
│  │      240x240px                   │    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Step Title                             │
│                                         │
│  Step Description                       │
│  max-width: 320px                       │
│                                         │
│  ┌─────────────────┐  ┌─────────────┐   │
│  │  Back           │  │  Next       │   │
│  └─────────────────┘  └─────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### Onboarding Illustration Themes

| Step | Theme             | Visual Concept      |
| ---- | ----------------- | ------------------- |
| 1    | Welcome           | Developer workspace |
| 2    | Goal Setting      | Target/bullseye     |
| 3    | Content Discovery | Library/categories  |
| 4    | Practice Mode     | Code terminal       |
| 5    | Completion        | Trophy/celebration  |

---

## 6. Responsive Visual Strategy

### 6.1 Mobile-First Breakpoints

#### Breakpoint Scale

```css
:root {
  /* Mobile-first breakpoints */
  --breakpoint-xs: 475px; /* Large phones */
  --breakpoint-sm: 640px; /* Tablets */
  --breakpoint-md: 768px; /* Small laptops */
  --breakpoint-lg: 1024px; /* Laptops */
  --breakpoint-xl: 1280px; /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
  --breakpoint-3xl: 1920px; /* Extra large */
}
```

#### Breakpoint Usage Matrix

| Breakpoint         | Width   | Device        | Layout            |
| ------------------ | ------- | ------------- | ----------------- |
| Default            | 0-639px | Mobile        | Single column     |
| `--breakpoint-xs`  | 475px+  | Large phone   | Compact cards     |
| `--breakpoint-sm`  | 640px+  | Tablet        | 2-column grid     |
| `--breakpoint-md`  | 768px+  | Small laptop  | Sidebar visible   |
| `--breakpoint-lg`  | 1024px+ | Laptop        | Full layout       |
| `--breakpoint-xl`  | 1280px+ | Desktop       | Wide content      |
| `--breakpoint-2xl` | 1536px+ | Large desktop | Max-width content |

#### Responsive Layout Patterns

```css
/* Mobile-first approach */
.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

### 6.2 Touch Target Sizes

#### Minimum Touch Target

| Target Type | Minimum Size | Recommendation      |
| ----------- | ------------ | ------------------- |
| Default     | 44x44px      | Primary requirement |
| Compact     | 36x36px      | Secondary actions   |
| Large       | 48x48px      | Primary CTAs        |
| Icon Only   | 44x44px      | Always              |

#### Touch Target CSS

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-2);
}

.touch-target-compact {
  min-width: 36px;
  min-height: 36px;
}

.touch-target-large {
  min-width: 48px;
  min-height: 48px;
}
```

#### Spacing Between Touch Targets

| Context | Minimum Gap | Usage             |
| ------- | ----------- | ----------------- |
| Tight   | 4px         | Related actions   |
| Default | 8px         | Standard spacing  |
| Relaxed | 16px        | Separated actions |

---

### 6.3 Adaptive Layouts Per Device

#### Layout Adaptations

##### Mobile Layout (< 640px)

```
┌─────────────────────┐
│     Header          │
│     56px height     │
├─────────────────────┤
│                     │
│                     │
│    Content Area     │
│    Single column    │
│    Full width       │
│                     │
│                     │
├─────────────────────┤
│     Bottom Nav      │
│     64px height     │
└─────────────────────┘
```

##### Tablet Layout (640px - 1024px)

```
┌─────────────────────┬─────────────────────┐
│     Header          │                     │
│     64px height     │                     │
├─────────────────────┼─────────────────────┤
│                     │                     │
│     Sidebar         │    Content Area     │
│     240px width     │    Multi-column     │
│     Collapsible     │                     │
│                     │                     │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

##### Desktop Layout (> 1024px)

```
┌──────────┬──────────────────────────────┬──────────┐
│          │     Header 64px              │          │
│          ├──────────────────────────────┤          │
│  Sidebar ├──────────────────────────────┤  Detail  │
│  280px   │                              │  Panel   │
│          │     Content Area             │  320px   │
│          │     Multi-column grid        │          │
│          │                              │          │
│          │                              │          │
└──────────┴──────────────────────────────┴──────────┘
```

#### Component Responsiveness

| Component  | Mobile      | Tablet            | Desktop          |
| ---------- | ----------- | ----------------- | ---------------- |
| Navigation | Bottom bar  | Sidebar collapsed | Sidebar expanded |
| Cards      | 1 column    | 2 columns         | 3-4 columns      |
| Forms      | Stacked     | 2 columns         | Inline labels    |
| Tables     | Card view   | Horizontal scroll | Full table       |
| Modals     | Full screen | Centered          | Centered         |

---

### 6.4 Reduced Motion Preferences

#### Motion Adaptation Strategy

```css
/* Default: Full motion */
:root {
  --motion-enabled: 1;
  --animation-duration: 1;
}

/* Reduced motion: Minimal motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-enabled: 0;
    --animation-duration: 0.01;
  }
}
```

#### Animation Fallbacks

| Animation       | Default       | Reduced Motion    |
| --------------- | ------------- | ----------------- |
| Page transition | Slide + fade  | Instant           |
| Card hover      | Lift + shadow | Color change only |
| Modal open      | Scale + fade  | Instant           |
| Loading spinner | Rotate        | Pulse opacity     |
| Skeleton        | Shimmer       | Static gradient   |

#### JavaScript Motion Detection

```typescript
const getMotionPreference = (): "full" | "reduced" => {
  if (typeof window === "undefined") return "full";

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

  return preference.matches ? "reduced" : "full";
};

const getAnimationDuration = (baseDuration: number): number => {
  const preference = getMotionPreference();
  return preference === "reduced" ? 0 : baseDuration;
};
```

#### CSS Motion Utility

```css
.motion-safe {
  transition: all var(--transition-normal);
}

.motion-reduce {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .motion-safe {
    transition: none;
  }

  .motion-reduce {
    transition: all var(--transition-normal);
  }
}
```

---

## 7. Statistics Page Design

### 7. Content Coverage (Why this matters)

- Content availability: shows what content is currently available to the user across all content types: Questions, Flashcards, Exams, Voice, and Coding.
- User data coverage: clarifies which fields are tracked for the user and presented on the Stats page (counts per type, per-day trends, and overall totals).
- Data visibility: the page reflects both previously created content and user-generated content generated via the generator.

### 7.1 Page Layout Structure (Content Coverage)

- Header with page title and time period filter
- Content Inventory (summary counts by type)
- Detailed per-type breakdown with counts
- Visual indicators for data availability (loading states, empty states)

### 7.2 Content Cards (Inventory)

- Card shows total items and per-type counts
- Icons per type and color-coded chips
- Loading skeletons when data is not yet available

### 7.3 Charting & Breakdown

- Line-like proportion charts for daily accuracy
- Bar charts for daily questions
- Channel breakdown tied to content types

### 7.4 Content Availability & User Coverage

- Available content types: Questions, Flashcards, Examinations, Voice prompts, Coding challenges
- User coverage: count of items per type in the user's dataset (static + generated)
- Privacy: only local/visible user data is shown on the UI

### 7.1 Page Layout Structure

#### Page Sections

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  Title: "Statistics"                                        │
│  Subtitle: "Track your learning progress"                  │
│  Time Period Tabs: [7 Days] [30 Days] [90 Days] [All Time] │
├─────────────────────────────────────────────────────────────┤
│  Stat Overview Cards (4 columns)                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ Total  │ │ Avg    │ │ Streak │ │ Best   │              │
│  │Questions│ │Accuracy│ │ Days   │ │ Score  │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
├─────────────────────────────────────────────────────────────┤
│  Charts Section                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐            │
│  │ Accuracy Over Time │ │ Questions Per Day  │            │
│  │     Line Chart     │ │     Bar Chart     │            │
│  └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  Channel Breakdown                                          │
│  Progress bars with channel names and completion %         │
├─────────────────────────────────────────────────────────────┤
│  Achievement Stats                                          │
│  Badge grid showing earned achievements                    │
└─────────────────────────────────────────────────────────────┘
```

#### Header Specifications

| Element     | Style                                        |
| ----------- | -------------------------------------------- |
| Title       | h1, `var(--text-primary)`                    |
| Subtitle    | body-lg, `var(--text-secondary)`             |
| Time Tabs   | Segmented control, `--radius-full`           |
| Tab Padding | `--space-3` horizontal, `--space-2` vertical |
| Active Tab  | `--brand-primary` background, white text     |

---

### 7.2 Stat Card Specifications

#### Card Dimensions & Layout

| Property      | Value                        |
| ------------- | ---------------------------- |
| Min Width     | 200px                        |
| Max Width     | 280px                        |
| Height        | Auto (content-based)         |
| Padding       | `--space-6`                  |
| Border Radius | `--radius-lg`                |
| Background    | `--surface-primary`          |
| Border        | 1px solid `--border-default` |

#### Icon Specifications

| Property   | Value                    |
| ---------- | ------------------------ |
| Icon Size  | 32x32px (lg)             |
| Icon Color | `--brand-primary`        |
| Container  | 48x48px circle           |
| Background | `--brand-primary-subtle` |

#### Value Typography

| Element | Font Size       | Font Weight     | Color              |
| ------- | --------------- | --------------- | ------------------ |
| Value   | 2.5rem (40px)   | `--font-bold`   | `--text-primary`   |
| Label   | 0.875rem (14px) | `--font-medium` | `--text-secondary` |
| Trend   | 0.75rem (12px)  | `--font-medium` | Semantic colors    |

#### Trend Indicator

| State    | Icon           | Color                |
| -------- | -------------- | -------------------- |
| Positive | `TrendingUp`   | `--semantic-success` |
| Negative | `TrendingDown` | `--semantic-error`   |
| Neutral  | `Minus`        | `--text-tertiary`    |

#### Animation Specifications

| Property           | Value                            |
| ------------------ | -------------------------------- |
| Entrance Animation | Fade in + scale from 0.95        |
| Duration           | `--duration-normal` (200ms)      |
| Easing             | `--ease-enter`                   |
| Stagger Delay      | 50ms between cards               |
| Value Counter      | Number count-up animation, 800ms |

---

### 7.3 Chart Specifications

#### Line Chart - Accuracy Over Time

| Property      | Value                           |
| ------------- | ------------------------------- |
| Chart Type    | Line with area fill             |
| Height        | 240px                           |
| Line Width    | 2px                             |
| Area Opacity  | 20%                             |
| Point Radius  | 4px (hover: 6px)                |
| Grid Lines    | Horizontal only, dashed         |
| X-Axis Labels | Date format: "MMM DD"           |
| Y-Axis Labels | Percentage: "0%", "50%", "100%" |

#### Bar Chart - Questions Per Day

| Property          | Value                       |
| ----------------- | --------------------------- |
| Chart Type        | Vertical bar                |
| Height            | 240px                       |
| Bar Width         | Dynamic (gap: 4px)          |
| Bar Border Radius | `--radius-sm` top           |
| Grouping          | 7 bars visible (scrollable) |
| X-Axis Labels     | Day: "Mon", "Tue", etc.     |
| Y-Axis Labels     | Count: "0", "10", "20"...   |

#### Chart Colors by Theme

| Element     | Light Mode          | Dark Mode           |
| ----------- | ------------------- | ------------------- |
| Line Stroke | `--brand-primary`   | `--brand-primary`   |
| Area Fill   | `--brand-primary`   | `--brand-primary`   |
| Bar Fill    | `--brand-secondary` | `--brand-secondary` |
| Grid Lines  | `--border-default`  | `--border-default`  |
| Axis Labels | `--text-tertiary`   | `--text-tertiary`   |

#### Axis Labeling

| Property | Font Size | Color             |
| -------- | --------- | ----------------- |
| X-Axis   | 12px      | `--text-tertiary` |
| Y-Axis   | 12px      | `--text-tertiary` |
| Tooltip  | 14px      | `--text-primary`  |

---

### 7.4 Channel Progress Bars

#### Bar Dimensions

| Property      | Value                |
| ------------- | -------------------- |
| Height        | 12px                 |
| Border Radius | `--radius-full`      |
| Background    | `--surface-tertiary` |
| Padding       | 0 (full-bleed)       |

#### Fill Animation

| Property  | Value                     |
| --------- | ------------------------- |
| Animation | Width transition          |
| Duration  | `--duration-slow` (300ms) |
| Easing    | `--ease-primary`          |
| Direction | Left to right             |

#### Label Positioning

| Element       | Position     | Style              |
| ------------- | ------------ | ------------------ |
| Channel Name  | Above bar    | `--text-primary`   |
| Percentage    | Right of bar | `--text-secondary` |
| Progress Text | Below bar    | "X of Y completed" |

#### Performance Color Coding

| Performance Level | Percentage Range | Color Variable                 |
| ----------------- | ---------------- | ------------------------------ |
| Excellent         | > 80%            | `--semantic-success` (#16a34a) |
| Average           | 50% - 80%        | `--semantic-warning` (#d97706) |
| Needs Work        | < 50%            | `--semantic-error` (#dc2626)   |

---

### 7.5 Empty State Patterns

#### No Data State

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌───────────────┐              │
│         │   Clipboard   │              │
│         │    (lg)       │              │
│         └───────────────┘              │
│                                         │
│         No Statistics Yet              │
│                                         │
│    Start practicing to see your        │
│    progress and achievements here.     │
│                                         │
└─────────────────────────────────────────┘
```

| Element     | Specification               |
| ----------- | --------------------------- |
| Icon        | `ClipboardList`, 48x48px    |
| Icon Color  | `--text-tertiary`           |
| Title       | h3, `--text-primary`        |
| Description | body-md, `--text-secondary` |

#### No Activity State

| Icon     | Title Pattern          | Description Pattern                            |
| -------- | ---------------------- | ---------------------------------------------- |
| `Flame`  | "No activity recently" | "Practice questions to keep your streak alive" |
| `Trophy` | "No achievements yet"  | "Complete practice sessions to earn badges"    |

---

### 7.6 Responsive Behavior

#### Stat Cards Grid

| Breakpoint          | Columns | Gap         |
| ------------------- | ------- | ----------- |
| Mobile (<640px)     | 1       | `--space-4` |
| Tablet (640-1024px) | 2       | `--space-4` |
| Desktop (>1024px)   | 4       | `--space-6` |

#### Charts Responsiveness

| Breakpoint          | Layout                             |
| ------------------- | ---------------------------------- |
| Mobile (<640px)     | Stacked, full-width                |
| Tablet (640-1024px) | Side-by-side                       |
| Desktop (>1024px)   | Side-by-side, max-width 480px each |

#### Channel Progress Responsive

| Breakpoint          | Layout Changes                 |
| ------------------- | ------------------------------ |
| Mobile (<640px)     | Channel name on top, bar below |
| Tablet (640-1024px) | Inline layout                  |
| Desktop (>1024px)   | Inline with percentage         |

---

### 7.7 Component States

#### Loading State

| Element      | State                       |
| ------------ | --------------------------- |
| Stat Card    | Skeleton with shimmer       |
| Chart        | Skeleton with chart outline |
| Progress Bar | Pulsing animation           |

#### Error State

| Element | State                   |
| ------- | ----------------------- |
| Display | Error message with icon |
| Icon    | `AlertCircle`           |
| Action  | "Retry" button          |

---

## Implementation Summary

### Files Reference

| File                           | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `src/styles/new-variables.css` | CSS variables for spacing, colors, shadows     |
| `src/styles/new-base.css`      | Base component styles                          |
| `src/styles/new-themes.css`    | Theme definitions (light, dark, high-contrast) |
| `tailwind.config.ts`           | Tailwind CSS configuration                     |
| `src/hooks/useNewTheme.ts`     | Theme switching hook                           |

### Key Design Tokens

```css
/* Core spacing */
--space-1:
  4px, --space-2: 8px, --space-4: 16px, --space-6: 24px,
  --space-8: 32px /* Elevation */ --elevation-1: subtle, --elevation-2: default,
  --elevation-3: hover, --elevation-4: floating, --elevation-5: modal,
  --elevation-6: overlay /* Motion */ --duration-fast: 100ms,
  --duration-normal: 200ms,
  --duration-slow: 300ms --ease-primary: cubic-bezier(0.4, 0, 0.2, 1)
    /* Border radius */ --radius-sm: 2px,
  --radius-md: 6px, --radius-lg: 8px, --radius-xl: 12px, --radius-full: 9999px;
```

### Next Steps

- [ ] Implement illustration assets
- [ ] Create animation component library
- [ ] Build responsive layout components
- [ ] Add motion preference detection
- [ ] Test across devices and themes

---

_Document Version: 1.0.0_  
_Generated by: VISUAL_CREATIVITY_EXPERT (David Kim)_  
_Last Updated: 2026-03-22_
