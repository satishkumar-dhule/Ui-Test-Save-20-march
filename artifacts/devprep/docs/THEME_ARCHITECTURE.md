# DevPrep Theme Architecture Documentation

## Overview

The DevPrep theming system is built on a scalable architecture that supports:

- Multiple theme variants (light, dark, high-contrast, blue-light, ocean, forest)
- Seamless theme switching with CSS variables
- Theme customization API
- Theme persistence via localStorage
- Accessibility enhancements

## Architecture Layers

### 1. Theme Core Tokens (`themes.css`)

The foundation of the theme system, defining:

- **Core Theme Tokens**: Base color values for each theme variant
- **Semantic Theme Mapping**: Purpose-based token mapping
- **Theme Variants**: Alternative theme implementations
- **Theme Transitions**: Smooth theme switching
- **Theme Customization API**: JavaScript integration hooks
- **Accessibility Enhancements**: Reduced motion, high contrast, print styles

### 2. Token System (`tokens.css`)

Contains:

- **Primitive Tokens**: Raw, theme-agnostic values
- **Component Tokens**: Component-specific styling tokens
- **Utility Classes**: Common patterns using design tokens

### 3. Theme Management

- **useTheme Hook**: React hook for theme state management
- **AppProviders Component**: Applies theme to document root
- **localStorage Persistence**: Theme preference storage

## Theme Types

### Built-in Themes

| Theme ID        | Description             | Use Case            |
| --------------- | ----------------------- | ------------------- |
| `light`         | Default light theme     | Daytime/general use |
| `dark`          | Default dark theme      | Nighttime/low-light |
| `high-contrast` | High contrast mode      | Accessibility       |
| `blue-light`    | Warm color temperature  | Evening/eye comfort |
| `ocean`         | Blue-green color scheme | Personal preference |
| `forest`        | Green color scheme      | Personal preference |

### Custom Themes

Users can create custom themes via the theme customization API:

```javascript
// Set custom primary color
window.devprepTheme.setCustomization({
  primaryHue: 280,
  primarySaturation: 80,
  primaryLightness: 60,
})

// Adjust spacing scale
window.devprepTheme.setCustomization({
  spacingMultiplier: 1.2,
})

// Reset to default
window.devprepTheme.resetCustomization()
```

## Token Hierarchy

```
1. Theme Core Tokens (--theme-*)
   - Base color values for each theme variant
   - Never used directly in components

2. Semantic Theme Mapping (--color-*, --glass-*, etc.)
   - Purpose-based tokens mapped from theme core tokens
   - Used by components and utilities

3. Component Tokens (--button-*, --card-*, etc.)
   - Component-specific styling values
   - Composed from semantic tokens

4. Primitive Tokens (--primitive-*)
   - Raw, theme-agnostic values
   - Used for spacing, typography, etc.
```

## Theme Switching

### Automatic System Detection

The system respects user's OS theme preference and listens for changes:

```javascript
// System theme detection
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (shouldRespectSystem) {
    setTheme(e.matches ? 'dark' : 'light')
  }
})
```

### Manual Theme Switching

Users can manually switch themes, which overrides system preference for 24 hours:

```javascript
// Toggle between light/dark
const { toggleTheme } = useTheme()

// Set specific theme
const { setThemeWithTransition } = useTheme()
setThemeWithTransition('high-contrast')
```

## Theme Customization API

### Available Methods

| Method                      | Description                       | Parameters                        |
| --------------------------- | --------------------------------- | --------------------------------- |
| `getCurrentTheme()`         | Returns current theme ID          | None                              |
| `setCustomization(options)` | Set custom theme values           | Object with customization options |
| `resetCustomization()`      | Reset to default theme            | None                              |
| `getAvailableThemes()`      | Returns array of available themes | None                              |
| `previewTheme(theme)`       | Preview theme without saving      | Theme ID                          |
| `cancelPreview()`           | Cancel theme preview              | None                              |

### Customization Options

```typescript
interface ThemeOptions {
  primaryHue?: number // 0-360
  primarySaturation?: number // 0-100
  primaryLightness?: number // 0-100
  spacingMultiplier?: number // 0.5-2.0
  fontSizeMultiplier?: number // 0.8-1.5
  radiusMultiplier?: number // 0.5-2.0
}
```

## Accessibility Features

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  :root:not([data-theme]) {
    --theme-border-base: currentColor;
    --theme-fg-base: CanvasText;
    --theme-bg-base: Canvas;
  }
}
```

### Print Styles

```css
@media print {
  :root {
    --theme-bg-base: white;
    --theme-fg-base: black;
    --theme-glass-bg: transparent;
  }
}
```

## Performance Considerations

### Theme Transition Optimization

```javascript
// Disable transitions during theme switch
document.documentElement.classList.add('theme-switching')

// Apply theme change
document.documentElement.setAttribute('data-theme', newTheme)

// Re-enable transitions after brief delay
setTimeout(() => {
  document.documentElement.classList.remove('theme-switching')
}, 50)
```

### CSS Variable Performance

- CSS variables are resolved at render time, not parsed
- Theme switching only updates CSS custom properties
- No reflow/repaint for theme changes on elements with CSS variables

## Migration Guide

### From Old System

The previous system used class-based dark mode (`.dark` class). The new system uses data attributes:

```html
<!-- Old system -->
<html class="dark">
  <!-- New system -->
  <html data-theme="dark"></html>
</html>
```

### Backward Compatibility

The new system maintains backward compatibility by:

- Keeping `.dark` class for existing dark mode utilities
- Mapping semantic tokens to new theme tokens
- Supporting both class and data attribute selectors

## File Structure

```
src/styles/
├── themes.css          # Theme architecture (NEW)
├── tokens.css          # Primitive and component tokens
├── typography.css      # Typography styles
├── glass.css           # Glass morphism effects
├── animations.css      # Animation definitions
└── layout.css          # Layout utilities

src/hooks/
├── useTheme.ts         # Theme management hook (NEW)
└── useLocalStorage.ts  # Local storage hook

src/components/app/
└── AppProviders.tsx    # Theme application provider
```

## Best Practices

### Do's

✅ Use semantic tokens in components
✅ Use theme hooks for theme state
✅ Test with multiple theme variants
✅ Consider accessibility requirements
✅ Use CSS variables for dynamic values

### Don'ts

❌ Don't use hardcoded colors in components
❌ Don't use class-based theme selectors (prefer data attributes)
❌ Don't bypass theme system with !important
❌ Don't ignore system theme preferences
❌ Don't forget to test print styles

## Testing Themes

### Browser Testing

```javascript
// Test all themes
const themes = ['light', 'dark', 'high-contrast', 'blue-light', 'ocean', 'forest']
themes.forEach(theme => {
  document.documentElement.setAttribute('data-theme', theme)
  // Take screenshot
})
```

### Accessibility Testing

- Test with screen readers
- Verify color contrast ratios
- Test keyboard navigation
- Verify reduced motion support

## Future Enhancements

### Planned Features

1. Theme sharing via URL parameters
2. Theme import/export functionality
3. More theme variants (sepia, grayscale, etc.)
4. Time-based automatic theme switching
5. Component-level theme overrides

### API Extensions

```javascript
// Future API additions
window.devprepTheme.exportTheme() // Export current theme
window.devprepTheme.importTheme(themeData) // Import theme
window.devprepTheme.scheduleTheme(schedule) // Time-based switching
```
