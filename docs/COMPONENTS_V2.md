# Component Library V2 Documentation

## Overview

The Component Library V2 is a modern, accessible, and themeable component system built with TypeScript, React, and Tailwind CSS. It follows atomic design principles with atoms, molecules, and organisms.

## Design Principles

- **Accessibility First**: Full ARIA support, keyboard navigation, and screen reader compatibility
- **Themeable**: Dark/light theme support via CSS variables
- **Responsive**: Mobile-first design with responsive breakpoints
- **Type Safety**: TypeScript strict mode with comprehensive type definitions
- **Performance**: Optimized for bundle size and runtime performance
- **No Glass Morphism**: Clean, semantic design without glass effects

## Directory Structure

```
src/components/
├── atoms-v2/           # Basic building blocks
│   ├── Button/         # Button with multiple variants
│   ├── Input/          # Text input with validation
│   ├── Card/           # Content containers
│   └── Badge/          # Status indicators
├── molecules/          # Combinations of atoms
│   ├── Modal/          # Dialog windows
│   └── Toast/          # Notification system
└── organisms/          # Complex UI patterns (coming soon)
```

## Getting Started

### Installation

```bash
npm install clsx tailwind-merge class-variance-authority
```

### Basic Usage

```tsx
import { Button } from '@/components/atoms-v2/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms-v2/Card';

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click Me</Button>
      </CardContent>
    </Card>
  );
}
```

## Atoms

### Button

A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `isLoading`: boolean
- `disabled`: boolean
- `asChild`: boolean (for composition)

**Accessibility:**
- Proper focus states
- Disabled state handling
- Loading state with `aria-busy`
- Keyboard support

### Input

Text input component with validation and helper text.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- All standard input attributes

**Accessibility:**
- Proper label association
- Error message linking
- Required field indication
- Invalid state announcement

### Card

Content container with multiple variants and interactive states.

**Props:**
- `variant`: 'default' | 'outline' | 'filled'
- `size`: 'sm' | 'md' | 'lg'
- `isInteractive`: boolean
- `isLoading`: boolean
- `onClick`: function

**Subcomponents:**
- `CardHeader`, `CardTitle`, `CardDescription`
- `CardContent`, `CardFooter`

### Badge

Status indicator with multiple variants.

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
- `size`: 'default' | 'sm' | 'lg'
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `isRemovable`: boolean
- `onRemove`: function

## Molecules

### Modal

Dialog component with full accessibility support.

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `description`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean
- `closeOnOverlayClick`: boolean
- `closeOnEscape`: boolean
- `footer`: ReactNode

**Accessibility:**
- Proper focus trapping
- Escape key to close
- Overlay click handling
- Screen reader announcements
- Focus restoration

### Toast

Notification system with multiple variants and auto-dismiss.

**Props:**
- `id`: string
- `title`: string
- `description`: string
- `variant`: 'default' | 'success' | 'error' | 'warning' | 'info'
- `duration`: number (ms, 0 for no auto-dismiss)
- `onClose`: function
- `action`: ReactNode

## Theming

### CSS Variables

All components use CSS variables for theming:

```css
:root {
  --primary: #6366f1;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  /* ... more variables */
}

.dark {
  --primary: #818cf8;
  --primary-foreground: #0f172a;
  /* ... dark theme variables */
}
```

### Tailwind Configuration

Components use Tailwind's class-based theming with `cva` (class-variance-authority) for variant management.

## Accessibility Guidelines

### Keyboard Navigation

All interactive components support:
- Tab navigation
- Enter/Space activation
- Escape key dismissal (for modals, dropdowns)
- Arrow key navigation (where applicable)

### Screen Reader Support

- Proper ARIA roles and attributes
- Live region announcements for dynamic content
- Focus management for modals and dialogs
- Descriptive labels and descriptions

### Focus Management

- Visible focus indicators
- Focus trapping in modals
- Focus restoration after modal close
- Skip links for complex UIs

## Migration Guide

### From V1 to V2

1. Update imports from `@/components/atoms` to `@/components/atoms-v2`
2. Update prop names (see individual component docs)
3. Update Tailwind classes if using custom styling
4. Test accessibility features

### Breaking Changes

- Button variants renamed for consistency
- Card subcomponents moved to separate exports
- Badge now uses `cva` for variant management
- Modal focus trapping behavior updated

## Development

### Adding New Components

1. Create component in appropriate directory (atoms/molecules/organisms)
2. Add TypeScript interfaces
3. Implement accessibility features
4. Add to component index files
5. Update this documentation

### Testing

```bash
npm run test:components
npm run test:a11y
```

### Storybook

```bash
npm run storybook
```

## Roadmap

- [ ] Organism components (Navigation, Forms, Data Tables)
- [ ] Advanced form components (Select, Checkbox, Radio)
- [ ] Layout components (Grid, Stack, Container)
- [ ] Data display components (Table, List, Timeline)
- [ ] Animation utilities
- [ ] Internationalization support

---

*Last updated: 2026-03-22*