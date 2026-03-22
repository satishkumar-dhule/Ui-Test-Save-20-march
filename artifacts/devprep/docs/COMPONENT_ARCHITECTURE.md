# DevPrep Component Architecture

## Overview

This document outlines the component architecture for the DevPrep application following the Atomic Design methodology by Brad Frost. The architecture provides clear separation of concerns, reusability, and maintainability.

## Atomic Design Methodology

Our component hierarchy follows the Atomic Design pattern:

```
Atoms → Molecules → Organisms → Templates → Pages
```

### Atoms

**Basic building blocks** - Cannot be broken down further without losing functionality.

- **Examples**: Text, Icon, Badge, Button, Input, Label
- **Location**: `/src/components/atoms/`
- **Characteristics**:
  - Single responsibility
  - Highly reusable
  - No composition dependencies
  - Global styles applied via tokens

### Molecules

**Simple component compositions** - Groups of atoms functioning together.

- **Examples**: StatusIndicator, SearchInput, FormField, CardHeader
- **Location**: `/src/components/molecules/`
- **Characteristics**:
  - 2-5 atoms composed together
  - Specific functional purpose
  - Limited state management
  - Reusable across multiple organisms

### Organisms

**Complex components** - Distinct sections of an interface.

- **Examples**: ContentCard, NavigationHeader, LiveFeed, SearchModal
- **Location**: `/src/components/organisms/`
- **Characteristics**:
  - Composed of molecules and atoms
  - Contains application logic
  - May manage local state
  - Functional section of UI

### Templates

**Page layouts** - Define the structure and layout of pages.

- **Examples**: MainLayout, DashboardLayout, AuthLayout
- **Location**: `/src/components/templates/`
- **Characteristics**:
  - Define layout structure
  - Contain organisms
  - Control page-level state
  - Handle routing logic

### Pages

**Specific instances** - Real content with real data.

- **Examples**: Dashboard, SearchResults, ContentDetail
- **Location**: `/src/pages/`
- **Characteristics**:
  - Connect to data sources
  - Handle business logic
  - Manage application state
  - Route components

## Directory Structure

```
src/components/
├── atoms/           # Basic building blocks
│   ├── Text.tsx
│   ├── Icon.tsx
│   ├── Badge.tsx
│   ├── Button.tsx (existing)
│   └── index.ts
│
├── molecules/       # Simple compositions
│   ├── StatusIndicator.tsx
│   ├── FormField.tsx
│   ├── CardHeader.tsx
│   └── index.ts
│
├── organisms/       # Complex components
│   ├── ContentCard.tsx
│   ├── LiveFeed.tsx
│   ├── SearchModal.tsx
│   ├── NavigationHeader.tsx
│   └── index.ts
│
├── templates/       # Page layouts
│   ├── MainLayout.tsx
│   ├── DashboardLayout.tsx
│   └── index.ts
│
├── ui/             # Reusable UI primitives (Radix/shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
└── app/            # App-specific components
    ├── AppHeader.tsx
    ├── BottomNav.tsx
    └── ...
```

## Component Contracts

All components must define TypeScript interfaces for their props:

### Standard Props Pattern

```typescript
export interface ComponentNameProps extends React.HTMLAttributes<HTMLElement> {
  // Component-specific props
  variant?: 'default' | 'secondary'
  size?: 'sm' | 'md' | 'lg'

  // Optional props
  isLoading?: boolean
  disabled?: boolean

  // Children and content
  children?: React.ReactNode

  // Event handlers
  onClick?: () => void
  onChange?: (value: string) => void
}
```

### Size System

We use a consistent size system across all components:

| Size | Text | Padding   | Height |
| ---- | ---- | --------- | ------ |
| xs   | 12px | 4px 8px   | 28px   |
| sm   | 14px | 6px 12px  | 36px   |
| md   | 16px | 8px 16px  | 44px   |
| lg   | 18px | 12px 24px | 52px   |
| xl   | 20px | 16px 32px | 60px   |

### Color System

Components use semantic color tokens:

```typescript
export type ColorToken =
  | 'default' // Foreground color
  | 'muted' // Muted foreground
  | 'primary' // Primary brand color
  | 'secondary' // Secondary color
  | 'destructive' // Error/destructive actions
  | 'success' // Success states
  | 'warning' // Warning states
  | 'inherit' // Inherit from parent
```

## Composition Patterns

### Pattern 1: Slot-based Composition

Using Radix UI Slot for flexible composition:

```typescript
import { Slot } from '@radix-ui/react-slot'

interface ButtonProps {
  asChild?: boolean
  children: React.ReactNode
}

const Button = ({ asChild, children, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp {...props}>{children}</Comp>
}
```

### Pattern 2: Compound Components

Multiple related components that work together:

```typescript
// Card.tsx
export const Card = ({ children, ...props }) => (
  <div className="card">{children}</div>
)

export const CardHeader = ({ children, ...props }) => (
  <div className="card-header">{children}</div>
)

export const CardContent = ({ children, ...props }) => (
  <div className="card-content">{children}</div>
)

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Pattern 3: Render Props

Flexible rendering with function children:

```typescript
interface DataLoaderProps {
  render: (data: any, isLoading: boolean) => React.ReactNode
}

const DataLoader = ({ render }: DataLoaderProps) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ... data loading logic

  return <>{render(data, isLoading)}</>
}

// Usage
<DataLoader render={(data, isLoading) => (
  isLoading ? <Spinner /> : <Content data={data} />
)} />
```

### Pattern 4: Higher-Order Components

Enhancing components with additional functionality:

```typescript
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { isLoading?: boolean }> {
  return ({ isLoading, ...props }: P & { isLoading?: boolean }) => {
    if (isLoading) return <Spinner />
    return <Component {...(props as P)} />
  }
}

// Usage
const ContentCardWithLoading = withLoading(ContentCard)
```

## Best Practices

### 1. Single Responsibility

Each component should do one thing well.

### 2. Composition over Inheritance

Build complex components by composing simpler ones.

### 3. Controlled vs Uncontrolled

Let parent components control state when needed:

```typescript
interface InputProps {
  value?: string // Controlled
  defaultValue?: string // Uncontrolled
  onChange?: (value: string) => void
}
```

### 4. Accessibility First

All components must:

- Use semantic HTML
- Include ARIA attributes where needed
- Support keyboard navigation
- Meet WCAG 2.1 AA standards

### 5. Performance Considerations

- Use `React.memo` for expensive renders
- Avoid unnecessary re-renders
- Lazy load heavy components
- Use proper key props in lists

## Migration Plan

### Phase 1: Atoms (Completed)

- [x] Text component
- [x] Icon component
- [x] Badge component
- [ ] Button refactor
- [ ] Input component
- [ ] Label component

### Phase 2: Molecules (In Progress)

- [x] StatusIndicator
- [ ] FormField
- [ ] CardHeader
- [ ] Avatar with status

### Phase 3: Organisms (Planned)

- [ ] ContentCard (refactor)
- [ ] LiveFeed (refactor)
- [ ] SearchModal (refactor)
- [ ] NavigationHeader

### Phase 4: Templates (Planned)

- [ ] MainLayout
- [ ] DashboardLayout
- [ ] AuthLayout

## Testing Strategy

### Unit Tests

Each atom and molecule should have comprehensive unit tests:

```typescript
describe('Text Component', () => {
  it('renders with correct variant', () => {})
  it('applies size classes correctly', () => {})
  it('handles color variants', () => {})
  it('supports truncation', () => {})
})
```

### Integration Tests

Test component compositions and interactions:

```typescript
describe('StatusIndicator', () => {
  it('composes Icon and Badge correctly', () => {})
  it('handles all status types', () => {})
  it('maintains accessibility', () => {})
})
```

### Visual Regression Tests

Use Storybook or similar for visual testing.

## Documentation

### Storybook

Each component should have Storybook stories:

```typescript
export default {
  title: 'Atoms/Text',
  component: Text,
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label'],
    },
  },
}
```

### Props Table

Auto-generate props documentation from TypeScript interfaces.

## References

- [Atomic Design by Brad Frost](http://atomicdesign.bradfrost.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
