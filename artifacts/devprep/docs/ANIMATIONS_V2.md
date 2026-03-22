# Animation System v2 Documentation

## Overview

The new animation system is built with **CSS-first** approach for optimal 60fps performance, respecting `prefers-reduced-motion` and providing subtle, professional animations.

## Architecture

### Core Files

1. **`src/styles/new-animations.css`** - CSS animation utilities and keyframes
2. **`src/hooks/useAnimation.ts`** - React hook for CSS-based animations
3. **`src/components/animation/`** - Transition components (FadeIn, SlideIn, ScaleIn, StaggerChildren)

### Key Principles

- **60fps Performance**: Use only `transform` and `opacity` for animations
- **Reduced Motion**: Automatically respect user preferences
- **CSS-First**: Use CSS classes over JavaScript animations where possible
- **Subtle & Professional**: No distracting effects, smooth transitions

## CSS Animation Utilities

### Timing Functions

```css
--anim-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--anim-ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--anim-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration Variables

```css
--anim-duration-fast: 150ms;
--anim-duration-normal: 300ms;
--anim-duration-slow: 500ms;
```

### Utility Classes

#### Entrance Animations

| Class | Description |
|-------|-------------|
| `anim-fade-in` | Simple fade in |
| `anim-slide-in-up` | Slide up from bottom |
| `anim-slide-in-down` | Slide down from top |
| `anim-slide-in-left` | Slide in from left |
| `anim-slide-in-right` | Slide in from right |
| `anim-scale-in` | Scale up with fade |

#### Staggered Animations

```html
<div class="anim-stagger">
  <div>Child 1</div>
  <div>Child 2</div>
  <div>Child 3</div>
</div>
```

Stagger delay can be customized via CSS variable:

```css
--anim-stagger-increment: 50ms;
```

#### Micro-interactions

| Class | Description |
|-------|-------------|
| `anim-button-hover` | Subtle scale on hover |
| `anim-card-hover` | Lift effect on hover |
| `anim-modal-backdrop` | Modal backdrop fade |
| `anim-modal-content` | Modal content scale + fade |
| `anim-loading-pulse` | Loading state pulse |
| `anim-spin` | Spinner rotation |

## React Hook: `useAnimation`

### Basic Usage

```tsx
import { useAnimation } from '@/hooks/useAnimation'

function MyComponent() {
  const { reducedMotion, startAnimation, stopAnimation } = useAnimation()
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (elementRef.current) {
      startAnimation(elementRef.current, 'anim-card-hover')
    }
  }

  return <div ref={elementRef} onMouseEnter={handleMouseEnter}>Hover me</div>
}
```

### API

#### `useAnimation()`

Returns:

- `reducedMotion: boolean` - Whether reduced motion is preferred
- `startAnimation(element, className, options?)` - Add animation class
- `stopAnimation(element, className)` - Remove animation class
- `toggleAnimation(element, className, options?)` - Toggle animation class
- `applyAnimation(element, className, options?)` - Apply and return cleanup function

#### Options

```typescript
interface AnimationOptions {
  duration?: number
  delay?: number
  easing?: string
  respectReducedMotion?: boolean
}
```

## Transition Components

### FadeIn

```tsx
import { FadeIn } from '@/components/animation'

<FadeIn direction="up" delay={100} duration={300}>
  <p>Content fades in from bottom</p>
</FadeIn>
```

**Props:**

- `direction`: 'up' | 'down' | 'left' | 'right' | 'none'
- `delay`: Delay in milliseconds
- `duration`: Duration in milliseconds
- `distance`: Distance in pixels (default: 20)
- `once`: Only animate once (default: true)
- `triggerOnView`: Animate when in viewport (default: true)

### SlideIn

```tsx
<SlideIn direction="left" distance={100}>
  <p>Slides in from left</p>
</SlideIn>
```

### ScaleIn

```tsx
<Scale initialScale={0.9} animateScale={1}>
  <p>Scale animation</p>
</Scale>
```

### StaggerChildren

```tsx
<Stagger staggerDelay={100}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stagger>
```

## Reduced Motion Support

All animations automatically respect `prefers-reduced-motion`:

- Animations are disabled for users who prefer reduced motion
- Elements appear immediately without animation
- Hover effects are simplified

## Performance Optimization

### Do's

- Use `transform` and `opacity` only
- Add `will-change` for complex animations
- Use `contain: layout style paint` for animated containers
- Prefer CSS classes over inline styles

### Don'ts

- Avoid animating `width`, `height`, `margin`, `padding`
- Don't animate `box-shadow` on many elements
- Avoid JavaScript animations for simple effects

## Micro-interaction Examples

### Button with Hover Effect

```tsx
<button className="anim-button-hover">
  Click me
</button>
```

### Card with Lift Effect

```tsx
<div className="anim-card-hover">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Modal with Backdrop

```tsx
<div className="modal-backdrop anim-modal-backdrop">
  <div className="modal-content anim-modal-content">
    {/* Modal content */}
  </div>
</div>
```

## Migration from Framer Motion

The new system replaces Framer Motion with CSS-based animations for better performance. Key changes:

1. **Components**: FadeIn, SlideIn, ScaleIn now use CSS classes
2. **Hooks**: useAnimation hook provides CSS class toggling
3. **Performance**: No JavaScript animation libraries needed

## Testing

All animations should be tested with:

1. **Reduced Motion**: Enable in system preferences
2. **Performance**: Use Chrome DevTools Performance tab
3. **Cross-browser**: Test in Chrome, Firefox, Safari

## Future Enhancements

- [ ] Add more direction variants
- [ ] Create animation playground component
- [ ] Add animation debugging tools
- [ ] Support for scroll-triggered animations