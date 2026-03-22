# Animation Performance Guide

## Overview

This document outlines best practices for achieving smooth 60fps animations in DevPrep using Framer Motion and CSS.

## Key Principles

### 1. Use Transform and Opacity Only

- **Do**: Animate `transform` (translate, scale, rotate) and `opacity` properties.
- **Avoid**: Animating `width`, `height`, `top`, `left`, `margin`, `padding` (triggers layout/paint).
- **Why**: Transform and opacity are handled by the GPU compositor, avoiding expensive layout recalculations.

### 2. Enable Hardware Acceleration

- **Automatic**: Framer Motion uses `transform` by default.
- **Manual**: Add `will-change: transform, opacity` to animated elements.
- **Caution**: Don't overuse `will-change` (can increase memory usage).

### 3. Use `layout` prop for Layout Animations

- When animating between layouts, use Framer Motion's `layout` prop.
- It automatically optimizes transitions using the FLIP technique.

### 4. Respect `prefers-reduced-motion`

- Check `useReducedMotion()` hook before playing animations.
- Provide alternative, non-motion feedback for users who prefer reduced motion.
- Our animation components (`FadeIn`, `SlideIn`, etc.) respect this via `triggerOnView` and conditional rendering.

### 5. Optimize Animation Duration and Easing

- **Duration**: Keep animations under 500ms for UI feedback.
- **Easing**: Use `easeOutExpo` (`[0.16, 1, 0.3, 1]`) for natural motion.
- **Staggering**: Use `staggerChildren` for sequential element animations.

### 6. Use `AnimatePresence` for Exit Animations

- Wrap conditionally rendered elements with `<AnimatePresence>`.
- Provide `exit` variants for smooth removal.
- Use `mode="wait"` for page transitions.

### 7. Avoid Layout Thrashing

- Batch DOM reads/writes.
- Use `requestAnimationFrame` for scroll-based animations.
- Prefer CSS `scroll-behavior: smooth` for simple scroll animations.

## Performance Monitoring

### Chrome DevTools

1. **Performance tab**: Record animation and check for long tasks (>16ms).
2. **Rendering tab**: Enable "Paint flashing" and "Layer borders".
3. **Layers panel**: Ensure animated elements are promoted to their own layers.

### Lighthouse

- Run performance audits to catch layout shifts (CLS) and main thread blocking.

## CSS vs Framer Motion

| Aspect            | CSS Animations         | Framer Motion         |
| ----------------- | ---------------------- | --------------------- |
| **Setup**         | Keyframes, classes     | Variants, props       |
| **Complexity**    | Limited to CSS         | Powerful JS control   |
| **Performance**   | Good (GPU accelerated) | Excellent (optimized) |
| **Accessibility** | Manual reduced motion  | Built-in support      |
| **Bundle Size**   | Zero JS overhead       | ~30KB gzipped         |

**Recommendation**: Use Framer Motion for complex interactive animations (page transitions, gestures). Use CSS for simple hover/focus states (via Tailwind utilities).

## Checklist for New Animations

- [ ] Animate only `transform` and `opacity`
- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Verify 60fps in Performance tab
- [ ] Ensure `will-change` is applied if needed
- [ ] Keep duration ≤ 500ms
- [ ] Use `easeOutExpo` or `easeInOutQuart` easing
- [ ] For lists, use `staggerChildren`
- [ ] For exit animations, wrap with `AnimatePresence`

## Example: Optimized FadeIn Component

```tsx
import { motion } from 'framer-motion'

export function OptimizedFadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: 'opacity' }}
    >
      {children}
    </motion.div>
  )
}
```

## Common Pitfalls

### 1. Animating `width`/`height`

**Bad**: `animate={{ width: 100 }}`  
**Good**: `animate={{ scaleX: 1 }}` (use transform origin)

### 2. Multiple Animated Elements Without Stagger

**Bad**: All elements animate simultaneously causing visual overload.  
**Good**: Use `staggerChildren` with 50-100ms delay.

### 3. Ignoring Reduced Motion Preferences

**Bad**: Forcing animation on all users.  
**Good**: Check `useReducedMotion()` and disable animations.

## Resources

- [Framer Motion Performance](https://www.framer.com/docs/best-performance/)
- [CSS Triggers](https://csstriggers.com/)
- [High Performance Animations](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)
