# Apple Vision Pro Glass Themed Design Plan for DevPrep Frontend

## Current State Analysis

The DevPrep frontend uses Tailwind CSS with a custom design system defined in `/artifacts/devprep/src/index.css`. Key characteristics:

- Custom CSS variables for colors, shadows, radii, and fonts
- Light/dark mode support via `:root` and `.dark`
- Extensive utility layers for mobile-first responsive design
- Existing elevation/shadow system (`--shadow-xs` through `--shadow-2xl`)
- Mobile-optimized touch targets and spacing

## Vision Pro Design Principles

Apple Vision Pro interface features:

- **Glassmorphism**: Translucent frosted glass surfaces with background blur
- **Depth & Layering**: Multiple UI layers with subtle elevation and parallax
- **Lighting & Materials**: Realistic light reflection, soft shadows, and luminous edges
- **Spatial Awareness**: Elements appear to float in 3D space with environmental lighting adaptation
- **Transparency**: Variable opacity based on background content and focus state
- **Rounded Corners**: Consistent, soft curvature across all surfaces

## Implementation Plan

### 1. Design Token Updates

Modify CSS variables in `:root` and `.dark` to support glass effects:

```css
/* Add to :root and .dark */
--glass-bg: hsl(var(--background) / 0.25);
--glass-bg-hover: hsl(var(--background) / 0.35);
--glass-border: hsl(var(--border) / 0.15);
--glass-border-hover: hsl(var(--border) / 0.25);
--glass-shadow:
  0 1px 3px hsl(var(--background) / 0.1),
  0 4px 6px -1px hsl(var(--background) / 0.15),
  0 8px 24px -4px hsl(var(--background) / 0.2);
--glass-shadow-hover:
  0 1px 3px hsl(var(--background) / 0.15),
  0 6px 8px -1px hsl(var(--background) / 0.2),
  0 12px 28px -4px hsl(var(--background) / 0.25);
--luminous-edge: hsl(var(--primary) / 0.3);
--depth-layer-1: translateZ(10px);
--depth-layer-2: translateZ(20px);
--depth-layer-3: translateZ(30px);
```

### 2. New Utility Classes

Add to `@layer utilities` in index.css:

```css
/* Glassmorphism surfaces */
.glass {
  @apply bg-glass-bg backdrop-blur-lg border-glass-border shadow-glass;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass:hover {
  @apply bg-glass-bg-hover border-glass-border-hover shadow-glass-hover;
}

/* Elevated layers with depth */
.layer-1 {
  @apply depth-layer-1;
}
.layer-2 {
  @apply depth-layer-2;
}
.layer-3 {
  @apply depth-layer-3;
}

/* Luminous edge lighting (for active/focused states) */
.luminous {
  box-shadow:
    0 0 0 1px var(--luminous-edge),
    0 0 8px 2px var(--luminous-edge);
}

/* Floating card with parallax */
.floating-card {
  @apply glass layer-2 hover:layer-3;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.floating-card:hover {
  transform: translateY -4px;
  @apply shadow-xl;
}

/* Subtle ambient shadow for depth perception */
.ambient-shadow {
  box-shadow: inset 0 0 20px -5px hsl(var(--background) / 0.1);
}

/* Focus ring with glass effect */
.focus-glass {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2;
}
```

### 3. Component-Specific Applications

- **Cards & Panels**: Apply `.glass` base class with `.hover-elevate` for interactive elements
- **Navigation Sidebar**: Use `.glass` + `.layer-1` with right-edge luminous effect
- **Modals & Overlays**: Multiple glass layers with increasing blur (`backdrop-blur-xl` for background)
- **Buttons**: Glass base with `.luminous` on hover/press, `--glass-bg` transition
- **Input Fields**: Glass background with subtle inner shadow and luminous focus ring
- **Badges & Tags**: Mini glass surfaces with elevated positioning

### 4. Performance Considerations

- Use `will-change: transform, opacity` for animated elements
- Limit `backdrop-filter` to essential surfaces (avoid on large repeating elements)
- Provide fallback for non-supporting browsers:
  ```css
  @supports not (backdrop-filter: blur(10px)) {
    .glass {
      @apply bg-glass-bg/75 border-glass-border;
    }
  }
  ```
- Use `contain: strict` on glass components where possible
- Prefer CSS properties that don't trigger layout shifts

### 5. Mobile Adaptation

- Reduce blur intensity on mobile (`backdrop-filter: blur(8px)`)
- Increase touch targets to 48px minimum
- Simplify layering on small screens (max 2 depth layers)
- Reduce animation duration for better perceived performance

### 6. Testing & Validation

- Verify glass appearance on both light and dark modes
- Check contrast ratios meet WCAG AA for text on glass surfaces
- Test on actual Vision Pro simulator if available
- Validate performance with Chrome DevTools rendering tab
- Ensure animations respect `prefers-reduced-motion`

### 7. Implementation Priority

1. Update design tokens and add utility classes
2. Convert core components (Header, Sidebar, Card)
3. Update interactive elements (Buttons, Inputs)
4. Apply to modals, dropdowns, and overlays
5. Refine animations and interactions
6. Performance optimization and testing

## Expected Outcome

A frontend interface that embodies Vision Pro's spatial computing paradigm:

- UI elements appear as floating glass panels with realistic depth
- Subtle animations and lighting respond to user interaction
- Maintains accessibility and performance standards
- Provides familiar DevPrep functionality with futuristic aesthetic
- Seamless transition between light and dark environmental adaptations

This plan leverages existing Tailwind infrastructure while introducing Vision Pro-specific design patterns through carefully scoped utility classes and CSS variables.
