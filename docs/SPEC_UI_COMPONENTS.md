# DevPrep UI Component Specifications

**Version**: 1.1.0  
**Last Updated**: 2026-03-22  
**Author**: UI_COMPONENT_ARCHITECT, TYPOGRAPHY_CALIGRAPHY_EXPERT

This document provides detailed specifications for all UI components in the DevPrep application, designed to work with the new styling system and theming architecture.

---

## Table of Contents

1. [Design Tokens Reference](#design-tokens-reference)
2. [Atoms](#atoms)
   - [Button](#button)
   - [Input](#input)
   - [Badge](#badge)
   - [Icon Wrapper](#icon-wrapper)
   - [Typography](#typography)
     - [Font System](#font-system)
     - [Typography Hierarchy](#typography-hierarchy)
     - [Text Utilities](#text-utilities)
     - [Accessibility](#accessibility)
3. [Molecules](#molecules)
   - [Card](#card)
   - [FormField](#formfield)
   - [Tag/Chip](#tagchip)
   - [Avatar](#avatar)
   - [ProgressBar](#progressbar)
4. [Organisms](#organisms)
   - [Navigation](#navigation)
   - [DataTable](#datatable)
   - [Modal/Dialog](#modaldialog)
   - [Toast/Notification](#toastnotification)

---

## Design Tokens Reference

### CSS Variables Available

```css
/* Colors */
--brand-primary, --brand-secondary, --brand-accent
--semantic-success, --semantic-warning, --semantic-error, --semantic-info
--text-primary, --text-secondary, --text-tertiary, --text-disabled
--surface-primary, --surface-secondary, --surface-hover, --surface-active
--border-primary, --border-focus, --border-error
--bg-primary, --bg-secondary, --bg-overlay

/* Typography */
--font-sans, --font-mono
--text-xs (0.75rem), --text-sm (0.875rem), --text-base (1rem)
--text-lg (1.125rem), --text-xl (1.25rem), --text-2xl (1.5rem)
--font-normal (400), --font-medium (500), --font-semibold (600), --font-bold (700)
--leading-normal (1.5), --leading-tight (1.25)

/* Spacing */
--space-1 (0.25rem), --space-2 (0.5rem), --space-3 (0.75rem), --space-4 (1rem)
--space-5 (1.25rem), --space-6 (1.5rem), --space-8 (2rem)

/* Border Radius */
--radius-sm (0.125rem), --radius-md (0.375rem), --radius-lg (0.5rem)
--radius-xl (0.75rem), --radius-2xl (1rem), --radius-full (9999px)

/* Shadows */
--shadow-sm, --shadow, --shadow-md, --shadow-lg, --shadow-xl

/* Transitions */
--transition-fast (150ms), --transition-normal (250ms), --transition-slow (350ms)
```

### Utility Classes Pattern

Components use Tailwind utility classes following this pattern:

- Display: `block`, `flex`, `inline-flex`, `grid`, `hidden`
- Spacing: `p-{n}`, `px-{n}`, `py-{n}`, `m-{n}`, `mx-auto`
- Colors: `bg-{color}`, `text-{color}`, `border-{color}`
- Typography: `text-sm`, `font-medium`, `leading-tight`
- Effects: `rounded-lg`, `shadow-md`, `transition`

---

## Atoms

### Button

**Location**: `src/components/ui/button.tsx`

#### Props Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### CSS Class Naming (CVA Variants)

| Variant     | Class                                        | Description            |
| ----------- | -------------------------------------------- | ---------------------- |
| default     | `bg-primary text-primary-foreground`         | Primary brand action   |
| destructive | `bg-destructive text-destructive-foreground` | Dangerous actions      |
| outline     | `border border-primary text-primary`         | Secondary with border  |
| secondary   | `bg-secondary text-secondary-foreground`     | Less prominent actions |
| ghost       | `hover:bg-accent`                            | Minimal visual weight  |
| link        | `text-primary underline-offset-4`            | Inline text action     |

#### Visual States

| State    | Visual Treatment                                    |
| -------- | --------------------------------------------------- |
| Default  | Base styling per variant                            |
| Hover    | `hover:opacity-90` or `hover:bg-*` from theme       |
| Active   | `active:scale-95` transform                         |
| Focus    | `focus-visible:ring-2 focus-visible:ring-ring`      |
| Disabled | `opacity-50 cursor-not-allowed pointer-events-none` |
| Loading  | Spinner icon replaces content, `disabled` state     |

#### Size Specifications

| Size    | Height   | Padding   | Use Case          |
| ------- | -------- | --------- | ----------------- |
| sm      | 44px min | px-3 py-2 | Compact actions   |
| default | 44px min | px-4 py-3 | Standard buttons  |
| lg      | 48px min | px-6 py-3 | Primary CTAs      |
| icon    | 44x44px  | -         | Icon-only buttons |

#### Accessibility Requirements

- Minimum touch target: 44x44px
- `aria-disabled="true"` when disabled
- `aria-busy="true"` when loading
- Focus visible ring: 2px solid `--focus-ring-color`
- Keyboard: Enter/Space to activate

#### Responsive Behavior

- Mobile: Full-width on small screens (`w-full`)
- Desktop: Auto-width with icon spacing (`gap-2`)

---

### Input

**Location**: `src/components/ui/input.tsx`

#### Props Interface

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

type InputType =
  | "text"
  | "password"
  | "email"
  | "search"
  | "number"
  | "tel"
  | "url";
```

#### CSS Class Naming

```css
.input-base {
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  transition: border-color var(--transition-fast);
}

.input-field {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
}

.input-element {
  padding: var(--space-3);
  color: var(--text-tertiary);
}
```

#### Visual States

| State    | Border Color       | Background           | Additional               |
| -------- | ------------------ | -------------------- | ------------------------ |
| Default  | `--border-primary` | `--surface-primary`  | -                        |
| Focus    | `--border-focus`   | `--surface-primary`  | `ring-2 ring-ring/20`    |
| Error    | `--border-error`   | `--surface-primary`  | Red border + helper text |
| Disabled | `--border-primary` | `--surface-disabled` | `opacity-50`             |

#### Accessibility Requirements

- `id` attribute for label association
- `aria-describedby` for helper/error text
- `aria-invalid="true"` in error state
- `autocomplete` attribute when applicable
- Focus visible ring on keyboard focus

#### Usage Example

```tsx
<div className="relative">
  {leftElement && <span className="input-element">{leftElement}</span>}
  <input className={cn("input-base", error && "border-error", className)} />
  {rightElement && <span className="input-element">{rightElement}</span>}
</div>
```

---

### Badge

**Location**: `src/components/ui/badge.tsx`

#### Props Interface

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  size?: "sm" | "default";
  dot?: boolean;
}
```

#### CSS Class Naming

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-0-5) var(--space-2-5);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-full);
  white-space: nowrap;
  transition: background-color var(--transition-fast);
}
```

#### Variant Specifications

| Variant     | Background                  | Text Color                        | Use Case         |
| ----------- | --------------------------- | --------------------------------- | ---------------- |
| default     | `--brand-primary`           | `--brand-primary-text` (inverted) | Primary labels   |
| secondary   | `--surface-tertiary`        | `--text-secondary`                | Secondary labels |
| destructive | `--semantic-error-subtle`   | `--semantic-error`                | Errors, delete   |
| success     | `--semantic-success-subtle` | `--semantic-success`              | Success states   |
| warning     | `--semantic-warning-subtle` | `--semantic-warning`              | Warnings         |
| outline     | transparent                 | `--text-primary` + border         | Neutral labels   |

#### Dot Indicator

```css
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
```

#### Accessibility Requirements

- Semantic color combinations (4.5:1 contrast ratio)
- Screen reader: Use `aria-label` if dot indicates status

---

### Icon Wrapper

**Location**: `src/components/ui/icon.tsx` (to be created)

#### Props Interface

```typescript
interface IconWrapperProps {
  icon: React.ComponentType<{ className?: string }>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "muted" | "danger";
  label?: string;
}
```

#### Size Specifications

| Size | Dimensions | Font Size Class |
| ---- | ---------- | --------------- |
| xs   | 16x16px    | -               |
| sm   | 20x20px    | -               |
| md   | 24x24px    | default         |
| lg   | 32x32px    | -               |
| xl   | 48x48px    | -               |

#### Color Variants

| Variant | Color              | Use Case           |
| ------- | ------------------ | ------------------ |
| default | `--text-primary`   | Standard icons     |
| primary | `--brand-primary`  | Featured icons     |
| muted   | `--text-tertiary`  | Secondary icons    |
| danger  | `--semantic-error` | Error/danger icons |

#### Accessibility Requirements

- Provide `aria-label` for decorative icons
- Icon-only buttons must have `aria-label`

---

### Typography

**Location**: `src/styles/new-typography.css`, `src/styles/new-base.css`

#### Font System

**Primary Font Stack**:

```css
:root {
  --font-sans:
    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", "Consolas", monospace;
}
```

**Font Scale (rem-based)**:

| Token | rem   | px  | Usage                   |
| ----- | ----- | --- | ----------------------- |
| xs    | 0.75  | 12  | Captions, timestamps    |
| sm    | 0.875 | 14  | Secondary text, labels  |
| base  | 1     | 16  | Body text               |
| lg    | 1.125 | 18  | Large body, subheadings |
| xl    | 1.25  | 20  | H4, prominent labels    |
| 2xl   | 1.5   | 24  | H3, section titles      |
| 3xl   | 1.875 | 30  | H2, page titles         |
| 4xl   | 2.25  | 36  | H1, major headings      |
| 5xl   | 3     | 48  | Display, hero text      |

**Line Height Ratios Per Size**:

```css
:root {
  /* Headings */
  --leading-none: 1; /* Tight - Display */
  --leading-tight: 1.25; /* Tight - H1, H2 */
  --leading-snug: 1.375; /* Snug - H3, H4 */
  --leading-normal: 1.5; /* Normal - Body, H5, H6 */

  /* Body */
  --leading-relaxed: 1.625; /* Relaxed - Long-form content */
  --leading-loose: 2; /* Loose - Accessibility/Captions */
}
```

**Letter Spacing Guidelines**:

```css
:root {
  --tracking-tighter: -0.05em; /* H1, H2 - Large display */
  --tracking-tight: -0.025em; /* H3, H4 */
  --tracking-normal: 0em; /* Body text */
  --tracking-wide: 0.025em; /* Small caps, captions */
  --tracking-wider: 0.05em; /* Labels, badges */
  --tracking-widest: 0.1em; /* Overlines, ALL CAPS */
}
```

#### Typography Hierarchy

**Heading Components**:

```typescript
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  tracking?: "tighter" | "tight" | "normal" | "wide";
}
```

**Detailed Scale Specifications**:

| Element  | Size          | Weight | Line Height | Letter Spacing | Use Case                    |
| -------- | ------------- | ------ | ----------- | -------------- | --------------------------- |
| Display  | 3rem/48px     | 700    | 1.1         | -0.05em        | Hero sections, splash pages |
| H1       | 2.25rem/36px  | 700    | 1.2         | -0.05em        | Page titles                 |
| H2       | 1.875rem/30px | 600    | 1.25        | -0.025em       | Section headers             |
| H3       | 1.5rem/24px   | 600    | 1.35        | -0.025em       | Subsection titles           |
| H4       | 1.25rem/20px  | 500    | 1.4         | 0              | Card titles, labels         |
| H5       | 1rem/16px     | 500    | 1.5         | 0              | Small headings              |
| H6       | 0.875rem/14px | 500    | 1.5         | 0              | Subtle labels               |
| Body     | 1rem/16px     | 400    | 1.5-1.75    | 0              | Paragraph text              |
| Body Sm  | 0.875rem/14px | 400    | 1.5         | 0              | Secondary text              |
| Caption  | 0.75rem/12px  | 400    | 1.4         | 0.025em        | Footnotes, timestamps       |
| Overline | 0.75rem/12px  | 600    | 1.5         | 0.1em          | Category labels (ALL CAPS)  |
| Code     | 0.875rem/14px | 400    | 1.6         | 0              | Inline code                 |

**CSS Variable Usage**:

```css
/* Display Text */
.text-display {
  font-family: var(--font-sans);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tighter);
}

/* Heading 1 */
.text-h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
}

/* Heading 2 */
.text-h2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

/* Heading 3 */
.text-h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

/* Heading 4 */
.text-h4 {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-normal);
}

/* Body Text */
.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
}

/* Small Text */
.text-small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Caption */
.text-caption {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-tertiary);
  letter-spacing: var(--tracking-wide);
}

/* Overline */
.text-overline {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
}

/* Code Inline */
.text-code {
  font-family: var(--font-mono);
  font-size: 0.875em; /* Slightly smaller than parent */
  font-weight: var(--font-normal);
  background: var(--surface-tertiary);
  padding: 0.125em 0.375em;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
}
```

#### Text Utilities

**Truncation Classes**:

```css
/* Single line truncation */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Two line truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Three line truncation */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Four+ line truncation (custom) */
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Text Alignment Variants**:

```css
/* Alignment */
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.text-justify {
  text-align: justify;
}

/* Vertical alignment */
.align-baseline {
  vertical-align: baseline;
}
.align-top {
  vertical-align: top;
}
.align-middle {
  vertical-align: middle;
}
.align-bottom {
  vertical-align: bottom;
}
```

**Responsive Text Sizes**:

```css
/* Fluid typography with clamp */
.text-fluid-sm {
  font-size: clamp(0.75rem, 1.5vw, 0.875rem);
}

.text-fluid-base {
  font-size: clamp(0.875rem, 2vw, 1rem);
}

.text-fluid-lg {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
}

.text-fluid-xl {
  font-size: clamp(1.125rem, 3vw, 1.5rem);
}

/* Heading collapse on mobile */
@media (max-width: 768px) {
  .text-display {
    font-size: 2.5rem;
  }
  .text-h1 {
    font-size: 2rem;
  }
  .text-h2 {
    font-size: 1.75rem;
  }
  .text-h3 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .text-display {
    font-size: 2rem;
  }
  .text-h1 {
    font-size: 1.75rem;
  }
  .text-h2 {
    font-size: 1.5rem;
  }
  .text-h3 {
    font-size: 1.25rem;
  }
}
```

**Code Blocks with Syntax Highlighting**:

```css
/* Code block container */
.code-block {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-tertiary);
  border-bottom: 1px solid var(--border-primary);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.code-block-content {
  padding: var(--space-4);
  overflow-x: auto;
}

.code-block-content pre {
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.6;
}

/* Syntax highlighting tokens */
.token-keyword {
  color: var(--syntax-keyword, #c678dd);
}
.token-string {
  color: var(--syntax-string, #98c379);
}
.token-number {
  color: var(--syntax-number, #d19a66);
}
.token-comment {
  color: var(--syntax-comment, #5c6370);
  font-style: italic;
}
.token-function {
  color: var(--syntax-function, #61afef);
}
.token-variable {
  color: var(--syntax-variable, #e06c75);
}
.token-operator {
  color: var(--syntax-operator, #56b6c2);
}
```

#### Accessibility

**Contrast Ratio Requirements**:

```css
:root {
  /* WCAG 2.1 Level AA - Normal Text */
  /* Minimum 4.5:1 contrast ratio */
  --text-primary: #1f2937; /* on white: 15.3:1 */
  --text-secondary: #6b7280; /* on white: 4.7:1 ✓ */
  --text-tertiary: #9ca3af; /* on white: 3.1:1 ✓ */

  /* WCAG 2.1 Level AA - Large Text (18pt+ or 14pt bold) */
  /* Minimum 3:1 contrast ratio */
  --text-on-dark: #ffffff; /* on brand: 4.6:1 ✓ */
  --text-muted-light: #d1d5db; /* on dark: 7.4:1 ✓ */
}

/* Dark theme adjustments */
[data-theme="dark"] {
  --text-primary: #f9fafb; /* on dark: 20.5:1 */
  --text-secondary: #d1d5db; /* on dark: 7.4:1 ✓ */
  --text-tertiary: #9ca3af; /* on dark: 4.5:1 ✓ */
}
```

**Minimum Contrast Ratio Matrix**:

| Text Color | Background | Ratio | WCAG Level | Usage           |
| ---------- | ---------- | ----- | ---------- | --------------- |
| Primary    | White      | 15:1  | AAA        | Body text       |
| Secondary  | White      | 4.5:1 | AA         | Secondary text  |
| Tertiary   | White      | 3:1   | AA Large   | Captions, hints |
| On Primary | Brand      | 4.5:1 | AA         | Button text     |
| On Dark    | Dark BG    | 7:1   | AAA        | Dark theme text |

**Text Scaling Support**:

```css
/* Respect user font size preferences */
html {
  font-size: 100%; /* Respects user's browser setting */
}

/* Optional larger base for accessibility */
[data-accessibility-scale="large"] {
  font-size: 112.5%; /* 18px base instead of 16px */
}

[data-accessibility-scale="xlarge"] {
  font-size: 125%; /* 20px base */
}

/* Minimum text size enforcement */
.text-body,
.text-small,
.text-caption {
  min-font-size: 12px; /* Never shrink below 12px */
}
```

**Dyslexia-Friendly Options**:

```css
/* OpenDyslexic font for dyslexia support */
@font-face {
  font-family: "OpenDyslexic";
  src: url("/fonts/OpenDyslexic-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "OpenDyslexic";
  src: url("/fonts/OpenDyslexic-Bold.otf") format("opentype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Dyslexia-friendly theme */
[data-font-dyslexia="true"] {
  --font-sans: "OpenDyslexic", var(--font-sans-fallback);
  --leading-normal: 1.8; /* Increased line spacing */
  --leading-relaxed: 2;
  --tracking-normal: 0.05em; /* Increased letter spacing */
  --word-spacing: 0.16em; /* Increased word spacing */
}

/* Additional dyslexia-friendly styles */
[data-font-dyslexia="true"] .text-body {
  font-family: var(--font-sans);
  line-height: var(--leading-relaxed);
  letter-spacing: var(--tracking-normal);
  word-spacing: var(--word-spacing);
  font-weight: 500; /* Slightly bolder improves readability */
}
```

**Accessibility Hook Implementation**:

```typescript
// src/hooks/useAccessibility.ts
interface AccessibilitySettings {
  fontScale: "normal" | "large" | "xlarge";
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontScale: "normal",
    dyslexiaFont: false,
    reducedMotion: false,
    highContrast: false,
  });

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Apply to document root
    const root = document.documentElement;
    root.setAttribute("data-accessibility-scale", settings.fontScale);
    root.setAttribute("data-font-dyslexia", String(settings.dyslexiaFont));
    root.setAttribute(
      "data-theme",
      settings.highContrast ? "high-contrast" : "default",
    );

    if (settings.reducedMotion) {
      root.style.setProperty("--transition-fast", "0ms");
      root.style.setProperty("--transition-normal", "0ms");
      root.style.setProperty("--transition-slow", "0ms");
    }

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}
```

**Reduced Motion Support**:

```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Functional motion (non-decorative) */
.motion-safe {
  /* Only animate if motion is allowed */
}

.motion-reduce {
  /* Reduced motion alternatives */
  transform: none !important;
}
```

**Focus Visibility**:

```css
/* Enhanced focus indicators for accessibility */
:focus-visible {
  outline: 2px solid var(--focus-ring-color, #3b82f6);
  outline-offset: 2px;
}

/* Focus on dark backgrounds */
:focus-visible.dark {
  outline-color: var(--focus-ring-dark, #60a5fa);
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  padding: var(--space-2) var(--space-4);
  background: var(--brand-primary);
  color: var(--brand-primary-text);
  z-index: 9999;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
```

**Screen Reader Optimizations**:

```css
/* Visually hidden but accessible */
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

/* Visible on focus */
.sr-only-focusable:focus,
.sr-only-focusable:focus-within {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Molecules

### Card

**Location**: `src/components/ui/card.tsx`

#### Props Interface

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

interface CardSubComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
```

#### CSS Class Naming

```css
.card-base {
  background: var(--surface-primary);
  border-radius: var(--radius-2xl);
  transition: all var(--transition-normal);
}

.card-default {
  box-shadow: var(--shadow-sm);
}

.card-elevated {
  box-shadow: var(--shadow-lg);
}

.card-bordered {
  border: 1px solid var(--border-primary);
  box-shadow: none;
}

.card-interactive {
  cursor: pointer;
  border: 1px solid var(--border-primary);
}

.card-interactive:hover {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-interactive:active {
  transform: translateY(0);
}

/* Sub-components */
.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-secondary);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.card-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.card-content {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
```

#### Padding Specifications

| Size | Padding Value  |
| ---- | -------------- |
| none | 0              |
| sm   | var(--space-4) |
| md   | var(--space-6) |
| lg   | var(--space-8) |

#### Interactive State Behaviors

```css
/* Hover lift effect */
.card-interactive {
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-primary);
}

/* Press effect */
.card-interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

#### Accessibility Requirements

- Interactive cards must be focusable (`tabindex="0"`)
- `aria-label` if card has no visible text
- Keyboard: Enter/Space to activate if clickable

---

### FormField

**Location**: `src/components/ui/form.tsx` / `src/components/ui/field.tsx`

#### Props Interface

```typescript
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface FormFieldMeta {
  error?: boolean;
  disabled?: boolean;
  loading?: boolean;
}
```

#### CSS Class Naming

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.form-label-required::after {
  content: " *";
  color: var(--semantic-error);
}

.form-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-helper-text {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-1);
}

.form-error-text {
  font-size: var(--text-xs);
  color: var(--semantic-error);
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.form-error-text::before {
  content: "";
  width: 4px;
  height: 4px;
  background: var(--semantic-error);
  border-radius: 50%;
}
```

#### Visual States

| State    | Label Color        | Input Border       | Helper/Error        |
| -------- | ------------------ | ------------------ | ------------------- |
| Default  | `--text-primary`   | `--border-primary` | Helper text         |
| Focus    | `--text-primary`   | `--border-focus`   | -                   |
| Error    | `--semantic-error` | `--border-error`   | Error message       |
| Disabled | `--text-disabled`  | `--border-primary` | Helper text (muted) |

#### Accessibility Requirements

- `id` on input matches `htmlFor` on label
- `aria-describedby` for helper/error text
- `aria-invalid="true"` when error present
- `aria-required="true"` when required
- Error icon with `aria-label="Error"`

---

### Tag/Chip

**Location**: `src/components/ui/chip.tsx` (to be created)

#### Props Interface

```typescript
interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "filled" | "outlined";
  color?: "primary" | "secondary" | "neutral" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: () => void;
  clickable?: boolean;
  onClick?: () => void;
  avatar?: React.ReactNode;
  icon?: React.ReactNode;
}
```

#### CSS Class Naming

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  cursor: default;
}

/* Sizes */
.chip-sm {
  padding: var(--space-0-5) var(--space-3);
  font-size: var(--text-xs);
}

.chip-md {
  padding: var(--space-1) var(--space-3);
}

.chip-lg {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
}

/* Variants */
.chip-filled-primary {
  background: var(--brand-primary);
  color: var(--brand-primary-text);
}

.chip-outlined-primary {
  background: transparent;
  border: 1px solid var(--brand-primary);
  color: var(--brand-primary);
}

/* Clickable */
.chip-clickable {
  cursor: pointer;
}

.chip-clickable:hover {
  filter: brightness(0.95);
}

.chip-clickable:active {
  filter: brightness(0.9);
}

/* Removable */
.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: var(--space-1);
  border-radius: 50%;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.chip-remove:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Avatar/Icon */
.chip-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.chip-icon {
  width: 16px;
  height: 16px;
}
```

#### Accessibility Requirements

- `role="button"` when clickable
- `aria-label` on remove button (e.g., "Remove tag: javascript")
- Keyboard: Delete/Backspace to remove when focused (with onRemove)

---

### Avatar

**Location**: `src/components/ui/avatar.tsx`

#### Props Interface

```typescript
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square" | "rounded";
  status?: "online" | "offline" | "busy" | "away";
  showStatus?: boolean;
}
```

#### CSS Class Naming

```css
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--surface-tertiary);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

/* Sizes */
.avatar-xs {
  width: 24px;
  height: 24px;
  font-size: 10px;
}
.avatar-sm {
  width: 32px;
  height: 32px;
  font-size: 12px;
}
.avatar-md {
  width: 40px;
  height: 40px;
  font-size: 14px;
}
.avatar-lg {
  width: 56px;
  height: 56px;
  font-size: 18px;
}
.avatar-xl {
  width: 80px;
  height: 80px;
  font-size: 24px;
}

/* Shapes */
.avatar-circle {
  border-radius: 50%;
}
.avatar-square {
  border-radius: var(--radius-sm);
}
.avatar-rounded {
  border-radius: var(--radius-lg);
}

/* Image */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Fallback */
.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
}

/* Status Indicator */
.avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25% of avatar;
  height: 25% of avatar;
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
}

.avatar-status-online {
  background: var(--semantic-success);
}
.avatar-status-offline {
  background: var(--text-tertiary);
}
.avatar-status-busy {
  background: var(--semantic-error);
}
.avatar-status-away {
  background: var(--semantic-warning);
}
```

#### Accessibility Requirements

- `alt` text for avatar image
- Fallback text for missing images
- `aria-label` on status indicator
- Decorative avatars should have `aria-hidden="true"`

---

### ProgressBar

**Location**: `src/components/ui/progress.tsx`

#### Props Interface

```typescript
interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
  showValue?: boolean;
  label?: string;
}
```

#### CSS Class Naming

```css
.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.progress-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.progress-value {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.progress-track {
  width: 100%;
  background: var(--surface-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

/* Sizes */
.progress-sm .progress-track {
  height: 4px;
}
.progress-md .progress-track {
  height: 8px;
}
.progress-lg .progress-track {
  height: 12px;
}

.progress-indicator {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

/* Variants */
.progress-indicator-default {
  background: var(--brand-primary);
}
.progress-indicator-success {
  background: var(--semantic-success);
}
.progress-indicator-warning {
  background: var(--semantic-warning);
}
.progress-indicator-error {
  background: var(--semantic-error);
}

/* Indeterminate */
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

#### Accessibility Requirements

- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes
- `aria-label` if no visible label
- Pulsing animation must respect `prefers-reduced-motion`

---

## Organisms

### Navigation

**Location**: `src/components/navigation/Sidebar.tsx`, `src/components/navigation/Header.tsx`

#### Props Interface

```typescript
interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  activeItem?: string;
  onItemClick?: (item: SidebarItem) => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: SidebarItem[];
  badge?: string | number;
  badgeVariant?: "default" | "primary" | "secondary" | "destructive";
  disabled?: boolean;
}

interface HeaderProps {
  logo?: React.ReactNode;
  title?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}
```

#### CSS Class Naming

```css
/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width, 280px);
  height: 100vh;
  background: var(--sidebar, var(--bg-secondary));
  border-right: 1px solid var(--border-primary);
  transition: width var(--transition-normal);
}

.sidebar-collapsed {
  width: var(--sidebar-collapsed-width, 72px);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-secondary);
  min-height: 64px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.sidebar-section {
  margin-bottom: var(--space-6);
}

.sidebar-section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
}

/* Sidebar Item */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.sidebar-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.sidebar-item-active {
  background: var(--brand-primary-subtle);
  color: var(--brand-primary);
}

.sidebar-item-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.sidebar-item-label {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-collapsed .sidebar-item-label {
  display: none;
}

.sidebar-item-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--brand-primary);
  color: var(--brand-primary-text);
}

.sidebar-collapsed .sidebar-item-badge {
  display: none;
}

/* Submenu */
.sidebar-submenu {
  margin-left: var(--space-8);
  padding-left: var(--space-3);
  border-left: 1px solid var(--border-secondary);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 var(--space-4);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-menu-button {
  display: none;
}

@media (max-width: 1024px) {
  .header-menu-button {
    display: flex;
  }
}

/* Breadcrumbs */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-tertiary);
}

.breadcrumb-item-current {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.breadcrumb-link:hover {
  color: var(--text-primary);
}
```

#### Responsive Behavior

| Breakpoint      | Sidebar                   | Header            |
| --------------- | ------------------------- | ----------------- |
| < 1024px        | Hidden, toggle to overlay | Shows menu button |
| 1024px - 1280px | Collapsed by default      |
| > 1280px        | Full width                |

#### Accessibility Requirements

- `nav` element with `aria-label`
- Active item has `aria-current="page"`
- Keyboard navigation: Arrow keys between items
- Mobile: Focus trap when open
- `aria-expanded` on collapse button
- Skip to main content link

---

### DataTable

**Location**: `src/components/ui/table.tsx`

#### Props Interface

```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  selectable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: PaginationConfig;
  emptyState?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  cell?: (value: unknown, row: T) => React.ReactNode;
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}
```

#### CSS Class Naming

```css
/* Table Container */
.table-container {
  width: 100%;
  overflow-x: auto;
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
}

/* Table */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

/* Header */
.table-header {
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.table-header-cell {
  padding: var(--space-4);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  white-space: nowrap;
}

.table-header-cell-sortable {
  cursor: pointer;
  user-select: none;
}

.table-header-cell-sortable:hover {
  background: var(--surface-hover);
}

.table-sort-icon {
  display: inline-flex;
  margin-left: var(--space-1);
  opacity: 0.5;
}

.table-header-cell-sorted .table-sort-icon {
  opacity: 1;
  color: var(--brand-primary);
}

/* Body */
.table-row {
  border-bottom: 1px solid var(--border-secondary);
  transition: background-color var(--transition-fast);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--surface-secondary);
}

.table-row-clickable {
  cursor: pointer;
}

.table-row-selected {
  background: var(--brand-primary-subtle);
}

.table-cell {
  padding: var(--space-4);
  color: var(--text-primary);
  vertical-align: middle;
}

/* Checkbox Column */
.table-checkbox {
  width: 48px;
  padding: var(--space-4);
}

/* Pagination */
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-top: 1px solid var(--border-primary);
  background: var(--surface-secondary);
}

.table-pagination-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.table-pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Loading State */
.table-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

/* Empty State */
.table-empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--text-tertiary);
}

/* Filter Row */
.table-filter-row {
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.table-filter-cell {
  padding: var(--space-3) var(--space-4);
}
```

#### Accessibility Requirements

- `role="grid"` on table
- `role="row"` on rows
- `role="columnheader"` on headers
- `role="gridcell"` on cells
- Sortable columns: `aria-sort` attribute
- Selection: `aria-selected` on rows
- Keyboard: Arrow keys for cell navigation
- Focus visible on cells

---

### Modal/Dialog

**Location**: `src/components/ui/dialog.tsx`

#### Props Interface

```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  hideCloseButton?: boolean;
}

interface AlertDialogProps extends DialogProps {
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  variant?: "default" | "danger";
}
```

#### CSS Class Naming

```css
/* Overlay */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: var(--bg-overlay);
  animation: overlay-show 150ms ease-out;
}

@keyframes overlay-show {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Content */
.dialog-content {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: var(--z-modal);
  transform: translate(-50%, -50%);
  background: var(--surface-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  animation: content-show 200ms ease-out;
}

@keyframes content-show {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Sizes */
.dialog-sm {
  max-width: 24rem;
  width: calc(100% - 2rem);
}
.dialog-md {
  max-width: 32rem;
  width: calc(100% - 2rem);
}
.dialog-lg {
  max-width: 48rem;
  width: calc(100% - 2rem);
}
.dialog-xl {
  max-width: 64rem;
  width: calc(100% - 2rem);
}
.dialog-full {
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  width: calc(100% - 2rem);
  height: calc(100% - 2rem);
}

/* Header */
.dialog-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-secondary);
}

.dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.dialog-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

/* Body */
.dialog-body {
  padding: var(--space-6);
  overflow-y: auto;
  max-height: calc(100vh - 16rem);
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-6);
  border-top: 1px solid var(--border-secondary);
}

/* Close Button */
.dialog-close {
  position: absolute;
  right: var(--space-4);
  top: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.dialog-close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Alert Dialog Variant */
.dialog-danger .dialog-footer .btn-confirm {
  background: var(--semantic-error);
  color: white;
}
```

#### Animation Specifications

```css
/* Enter animation */
.dialog-enter {
  animation: dialog-enter 200ms ease-out;
}

/* Exit animation */
.dialog-exit {
  animation: dialog-exit 150ms ease-in;
}

@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translate(-50%, -50%);
  }
  to {
    opacity: 1;
    transform: scale(1) translate(-50%, -50%);
  }
}

@keyframes dialog-exit {
  from {
    opacity: 1;
    transform: scale(1) translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translate(-50%, -50%);
  }
}
```

#### Accessibility Requirements

- `role="dialog"` on content
- `aria-modal="true"`
- `aria-labelledby` pointing to title
- `aria-describedby` pointing to description (if present)
- Focus trap when open
- Escape key closes dialog
- Return focus to trigger element on close

---

### Toast/Notification

**Location**: `src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`

#### Props Interface

```typescript
interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
}

interface ToastAction {
  type: "success" | "error" | "warning" | "info" | "default";
  title: string;
  description?: string;
  duration?: number;
}

interface ToasterProps {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  expand?: boolean;
}
```

#### CSS Class Naming

```css
/* Toaster Container */
.toaster {
  position: fixed;
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.toaster-position-top-left {
  top: var(--space-4);
  left: var(--space-4);
}
.toaster-position-top-center {
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
}
.toaster-position-top-right {
  top: var(--space-4);
  right: var(--space-4);
}
.toaster-position-bottom-left {
  bottom: var(--space-4);
  left: var(--space-4);
}
.toaster-position-bottom-center {
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
}
.toaster-position-bottom-right {
  bottom: var(--space-4);
  right: var(--space-4);
}

/* Toast */
.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  animation: toast-in 200ms ease-out;
}

.toast-exit {
  animation: toast-out 150ms ease-in;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
}

/* Toast Icon */
.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast-icon-success {
  color: var(--semantic-success);
}
.toast-icon-error {
  color: var(--semantic-error);
}
.toast-icon-warning {
  color: var(--semantic-warning);
}
.toast-icon-info {
  color: var(--semantic-info);
}

/* Toast Content */
.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.toast-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

/* Toast Action */
.toast-action {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toast-action:hover {
  background: var(--brand-primary-subtle);
}

/* Toast Close */
.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toast-close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Progress Bar */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--brand-primary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  animation: toast-progress linear forwards;
}
```

#### Accessibility Requirements

- `role="alert"` for important notifications
- `role="status"` for informational toasts
- `aria-live="polite"` for auto-dismiss toasts
- Close button must have `aria-label="Close notification"`
- Keyboard: Tab to focus, Enter to activate action

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── progress.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── table.tsx
│   │   ├── form.tsx
│   │   └── chip.tsx
│   └── navigation/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── Breadcrumb.tsx
└── styles/
    ├── new-variables.css
    ├── new-themes.css
    ├── new-base.css
    ├── new-utilities.css
    └── new-typography.css
```

### Dependencies

- **Radix UI**: Dialog, Popover, DropdownMenu, etc.
- **Class Variance Authority (CVA)**: Component variant management
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility classes
- **clsx**: Conditional className merging

### CSS-in-JS vs Utility Classes

The new design system uses **utility-first CSS with Tailwind** rather than CSS-in-JS. All component styles should be defined using:

1. Tailwind utility classes directly in components
2. CSS variables from `new-variables.css` for theming
3. CVA for managing variant combinations

### Migration Checklist

- [ ] Implement missing components (IconWrapper, Chip)
- [ ] Update existing components to use new CSS variable naming
- [ ] Ensure all components support three themes (light, dark, high-contrast)
- [ ] Add ARIA attributes to all interactive components
- [ ] Test keyboard navigation
- [ ] Verify color contrast ratios (WCAG 2.1 AA)

---

_Document Version: 1.1.0_  
_Last Updated: 2026-03-22_  
_Generated by: UI_COMPONENT_ARCHITECT, TYPOGRAPHY_CALIGRAPHY_EXPERT_
