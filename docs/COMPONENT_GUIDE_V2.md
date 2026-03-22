# Component Guide V2

> **Purpose:** Comprehensive guide to the DevPrep V2 component library  
> **Date:** March 22, 2026  
> **Version:** 2.0.0  
> **Architecture:** Atomic Design + TypeScript + Tailwind CSS 4

## Overview

The V2 component library is built with accessibility, performance, and theming as core principles. It follows atomic design methodology with atoms, molecules, and organisms.

### Design Principles

1. **Accessibility First**: Full ARIA support, keyboard navigation, screen reader compatibility
2. **Themeable**: Dark/light theme support via CSS variables
3. **Responsive**: Mobile-first design with responsive breakpoints
4. **Type Safety**: TypeScript strict mode with comprehensive type definitions
5. **Performance**: Optimized for bundle size and runtime performance
6. **No Glass Morphism**: Clean, semantic design without glass effects

## Directory Structure

```
src/components/
├── atoms-v2/           # Basic building blocks
│   ├── Button/         # Button with multiple variants
│   ├── Input/          # Text input with validation
│   ├── Card/           # Content containers
│   ├── Badge/          # Status indicators
│   ├── Icon/           # Icon wrapper
│   ├── Text/           # Typography components
│   └── index.ts        # Barrel exports
├── molecules/          # Simple compositions
│   ├── Modal/          # Dialog windows
│   ├── Toast/          # Notification system
│   ├── Tabs/           # Tabbed interfaces
│   └── index.ts        # Barrel exports
└── organisms/          # Complex UI patterns
    ├── Header/         # Application header
    ├── Sidebar/        # Navigation sidebar
    ├── ContentList/    # Content display
    └── index.ts        # Barrel exports
```

## Getting Started

### Installation

```bash
# Required dependencies
npm install clsx tailwind-merge class-variance-authority

# For icons (optional)
npm install react-icons

# For animations (optional)
npm install framer-motion
```

### Basic Usage

```tsx
import { Button } from '@/components/atoms-v2/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms-v2/Card';
import { Input } from '@/components/atoms-v2/Input';

function Example() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input 
            label="Email" 
            placeholder="Enter your email"
            type="email"
          />
          <Button variant="default" className="w-full">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Atoms

Atoms are the basic building blocks of the interface.

### Button

A versatile button component with multiple variants and sizes.

**File:** `src/components/atoms-v2/Button/index.tsx`

```tsx
import { Button } from '@/components/atoms-v2/Button';

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// States
<Button disabled>Disabled</Button>
<Button isLoading>Loading</Button>
```

**Props:**
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  disabled?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}
```

**Accessibility:**
- Proper focus states
- Disabled state handling
- Loading state with `aria-busy`
- Keyboard support (Enter/Space)

### Input

Text input component with validation and helper text.

**File:** `src/components/atoms-v2/Input/index.tsx`

```tsx
import { Input } from '@/components/atoms-v2/Input';

// Basic usage
<Input placeholder="Enter text" />

// With label
<Input label="Email" placeholder="Enter email" />

// With validation
<Input 
  label="Password"
  error="Password must be at least 8 characters"
  type="password"
/>

// With helper text
<Input 
  label="Username"
  helperText="Your public display name"
/>

// With icons
<Input 
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>
```

**Props:**
```typescript
interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // All standard input attributes
}
```

**Accessibility:**
- Proper label association
- Error message linking
- Required field indication
- Invalid state announcement

### Card

Content container with multiple variants and interactive states.

**File:** `src/components/atoms-v2/Card/index.tsx`

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/atoms-v2/Card';

// Basic usage
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Interactive card
<Card className="cursor-pointer hover:shadow-lg transition-shadow">
  <CardContent>Clickable card</CardContent>
</Card>

// With custom styling
<Card className="border-primary">
  <CardContent>Custom border</CardContent>
</Card>
```

**Props:**
```typescript
interface CardProps {
  className?: string;
  children: React.ReactNode;
  // All standard div attributes
}
```

### Badge

Status indicator component with semantic colors.

**File:** `src/components/atoms-v2/Badge/index.tsx`

```tsx
import { Badge } from '@/components/atoms-v2/Badge';

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>

// Outline variant
<Badge variant="outline">Outline</Badge>

// With custom content
<Badge>
  <CheckIcon className="w-3 h-3 mr-1" />
  Verified
</Badge>
```

**Props:**
```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  className?: string;
  children: React.ReactNode;
}
```

## Molecules

Molecules are combinations of atoms that form more complex components.

### Modal

Dialog window component with accessibility features.

**File:** `src/components/molecules/Modal/index.tsx`

```tsx
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '@/components/molecules/Modal';

// Basic usage
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalHeader>
    <ModalTitle>Confirm Action</ModalTitle>
    <ModalDescription>
      Are you sure you want to proceed?
    </ModalDescription>
  </ModalHeader>
  <ModalContent>
    <p>This action cannot be undone.</p>
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>

// With custom trigger
<Modal>
  <ModalTrigger asChild>
    <Button>Open Modal</Button>
  </ModalTrigger>
  <ModalContent>
    {/* modal content */}
  </ModalContent>
</Modal>
```

**Props:**
```typescript
interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
```

**Accessibility:**
- Focus trap
- Escape key to close
- Proper ARIA attributes
- Screen reader announcements

### Toast

Notification system with multiple variants and auto-dismiss.

**File:** `src/components/molecules/Toast/index.tsx`

```tsx
import { useToast } from '@/components/molecules/Toast';

// Basic usage
const { toast } = useToast();

toast({
  title: "Success",
  description: "Your changes have been saved.",
  variant: "success",
});

// With action
toast({
  title: "File deleted",
  description: "The file has been moved to trash.",
  action: (
    <Button variant="outline" size="sm" onClick={handleUndo}>
      Undo
    </Button>
  ),
});

// Different variants
toast({ title: "Info", variant: "info" });
toast({ title: "Warning", variant: "warning" });
toast({ title: "Error", variant: "error" });
```

**Hook:**
```typescript
const { toast } = useToast();
toast({
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  action?: React.ReactNode;
});
```

### Tabs

Tabbed interface component with keyboard navigation.

**File:** `src/components/molecules/Tabs/index.tsx`

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/molecules/Tabs';

// Basic usage
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Account settings</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Password settings</p>
  </TabsContent>
</Tabs>

// Controlled
<Tabs value={activeTab} onValueChange={setActiveTab}>
  {/* tabs */}
</Tabs>
```

**Props:**
```typescript
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}
```

## Organisms

Organisms are complex UI components composed of molecules and atoms.

### Header

Application header with navigation and user menu.

**File:** `src/components/organisms/Header/index.tsx`

```tsx
import { Header, HeaderLogo, HeaderNav, HeaderUser } from '@/components/organisms/Header';

// Basic usage
<Header>
  <HeaderLogo src="/logo.svg" alt="DevPrep" />
  <HeaderNav>
    <NavLink to="/">Home</NavLink>
    <NavLink to="/channels">Channels</NavLink>
    <NavLink to="/search">Search</NavLink>
  </HeaderNav>
  <HeaderUser user={currentUser} />
</Header>
```

### ContentList

Display list of content items with filtering and sorting.

**File:** `src/components/organisms/ContentList/index.tsx`

```tsx
import { ContentList, ContentItem } from '@/components/organisms/ContentList';

// Basic usage
<ContentList
  items={contentItems}
  onItemSelect={handleSelect}
  filterOptions={filterOptions}
  sortOptions={sortOptions}
/>

// With custom rendering
<ContentList
  items={items}
  renderItem={(item) => (
    <ContentItem
      key={item.id}
      title={item.title}
      description={item.description}
      tags={item.tags}
      onSelect={() => handleSelect(item)}
    />
  )}
/>
```

## Utility Components

### Icon

Wrapper component for icons with consistent sizing.

**File:** `src/components/atoms-v2/Icon/index.tsx`

```tsx
import { Icon } from '@/components/atoms-v2/Icon';
import { FiSearch, FiCheck, FiX } from 'react-icons/fi';

// Basic usage
<Icon>
  <FiSearch />
</Icon>

// Sizes
<Icon size="sm"><FiSearch /></Icon>
<Icon size="md"><FiSearch /></Icon>
<Icon size="lg"><FiSearch /></Icon>

// With color
<Icon className="text-primary"><FiCheck /></Icon>
```

### Text

Typography component with semantic variants.

**File:** `src/components/atoms-v2/Text/index.tsx`

```tsx
import { Text, Heading, Subheading, Caption } from '@/components/atoms-v2/Text';

// Variants
<Text>Body text</Text>
<Heading>Heading 1</Heading>
<Subheading>Heading 2</Subheading>
<Caption>Caption text</Caption>

// With custom styling
<Text className="text-muted-foreground">Muted text</Text>
<Heading className="text-primary">Primary heading</Heading>
```

## Component Composition

### Creating Custom Components

```tsx
import { Button } from '@/components/atoms-v2/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/atoms-v2/Card';
import { Input } from '@/components/atoms-v2/Input';

export function LoginForm({ onSubmit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Slot Pattern

```tsx
// Parent component
export function DashboardCard({ title, children, actions }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Usage
<DashboardCard
  title="Statistics"
  actions={<Button variant="outline">View All</Button>}
>
  <p>Dashboard content</p>
</DashboardCard>
```

## Theming

### CSS Variables

All components use CSS variables for theming:

```css
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  /* ... more variables */
}
```

### Theme Switching

```tsx
import { useTheme } from '@/hooks/useNewTheme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="outline"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </Button>
  );
}
```

## Accessibility

### Keyboard Navigation

All components support keyboard navigation:

- **Tab**: Move between interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dropdowns
- **Arrow keys**: Navigate within components

### Screen Reader Support

Components include proper ARIA attributes:

```tsx
// Button with loading state
<Button aria-busy={isLoading} aria-disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Modal with proper roles
<Modal role="dialog" aria-modal="true" aria-labelledby="modal-title">
  {/* modal content */}
</Modal>
```

## Performance Optimization

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization

```tsx
import { memo } from 'react';

const MemoizedCard = memo(function Card({ title, content }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
});
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Accessibility Tests

```tsx
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Migration from V1

See [Migration Guide](MIGRATION_TO_V2.md) for detailed instructions.

## Additional Resources

- [Component Library V2 Documentation](COMPONENTS_V2.md)
- [Style Guide V2](STYLE_GUIDE_V2.md)
- [Accessibility V2](ACCESSIBILITY_V2.md)
- [Performance V2](PERFORMANCE_V2.md)