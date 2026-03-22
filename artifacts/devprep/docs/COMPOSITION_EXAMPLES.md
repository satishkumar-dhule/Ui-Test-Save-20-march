# Composition Pattern Examples

This document provides practical examples of component composition patterns used in the DevPrep application.

## Example 1: Atomic Text Composition

The `Text` atom is highly composable and can be used to build various text elements:

```tsx
import { Text, Icon, Badge } from '@/components/atoms'
import { Star } from 'lucide-react'

// Basic usage
<Text variant="h1" size="2xl" weight="bold">
  Welcome to DevPrep
</Text>

// With color and truncation
<Text variant="p" color="muted" truncate>
  This is a very long description that will be truncated...
</Text>

// Composing multiple atoms
<div className="flex items-center gap-2">
  <Icon icon={Star} size="sm" color="warning" decorative />
  <Text variant="span" size="sm" weight="medium">
    4.9/5 Rating
  </Text>
  <Badge variant="success" size="sm">Verified</Badge>
</div>
```

## Example 2: Status Indicator Molecule

The `StatusIndicator` combines `Icon`, `Badge`, and `Text` atoms:

```tsx
import { StatusIndicator } from '@/components/molecules'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

// Success status
<StatusIndicator
  status="success"
  icon={CheckCircle}
  label="API Connected"
  description="All services are running normally"
  showBadge
  size="md"
/>

// Warning status without description
<StatusIndicator
  status="warning"
  icon={AlertTriangle}
  label="High Memory Usage"
  showBadge={false}
/>

// Error status
<StatusIndicator
  status="error"
  icon={XCircle}
  label="Connection Failed"
  description="Unable to reach the server. Please check your connection."
  size="lg"
/>
```

## Example 3: Compound Card Components

Building a compound card component using composition:

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Text, Badge, Icon } from '@/components/atoms'
import { Clock, TrendingUp } from 'lucide-react'

// Compound card with slots
;<Card variant="glass" size="lg">
  <CardHeader className="flex items-center justify-between">
    <Text variant="h4" weight="semibold">
      System Design Interview
    </Text>
    <Badge variant="default" size="sm">
      NEW
    </Badge>
  </CardHeader>

  <CardContent>
    <Text variant="p" color="muted" className="mb-4">
      Learn how to design scalable systems with real-world examples.
    </Text>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <Icon icon={Clock} size="sm" color="muted" decorative />
        <Text variant="span" size="sm" color="muted">
          30 min
        </Text>
      </div>
      <div className="flex items-center gap-1">
        <Icon icon={TrendingUp} size="sm" color="success" decorative />
        <Text variant="span" size="sm" color="success">
          85% quality
        </Text>
      </div>
    </div>
  </CardContent>

  <CardFooter className="flex justify-end gap-2">
    <Button variant="ghost" size="sm">
      Save
    </Button>
    <Button variant="default" size="sm">
      Start
    </Button>
  </CardFooter>
</Card>
```

## Example 4: Render Props Pattern

Using render props for flexible content rendering:

```tsx
import { DataLoader } from '@/components/DataLoader'
import { ContentCard } from '@/components/organisms'
import { Spinner } from '@/components/ui/spinner'

// Flexible data loading with render props
;<DataLoader
  endpoint="/api/content"
  render={(data, isLoading, error) => {
    if (isLoading) return <Spinner />
    if (error) return <ErrorDisplay error={error} />
    if (!data?.length) return <EmptyState />

    return (
      <div className="grid gap-4">
        {data.map(item => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    )
  }}
/>
```

## Example 5: Higher-Order Component (HOC)

Enhancing components with additional functionality:

```tsx
// HOC for adding loading state
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { isLoading?: boolean }> {
  return ({ isLoading, ...props }: P & { isLoading?: boolean }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      )
    }
    return <Component {...(props as P)} />
  }
}

// HOC for adding error boundary
function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return class ErrorBoundaryWrapper extends React.Component<P> {
    state = { hasError: false, error: null }

    static getDerivedStateFromError(error: any) {
      return { hasError: true, error }
    }

    render() {
      if (this.state.hasError) {
        return <ErrorDisplay error={this.state.error} />
      }
      return <Component {...this.props} />
    }
  }
}

// Usage
const ContentCardWithLoading = withLoading(ContentCard)
const SafeContentCard = withErrorBoundary(ContentCardWithLoading)

<SafeContentCard isLoading={true} item={contentItem} />
```

## Example 6: Slot-based Composition

Using Radix UI Slot for flexible composition:

```tsx
import { Slot } from '@radix-ui/react-slot'
import { Button as UIButton } from '@/components/ui/button'

// Flexible button that can render as different elements
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = ({ asChild, children, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : UIButton
  return <Comp {...props}>{children}</Comp>
}

// Usage - button can be a link when needed
<Button asChild variant="outline">
  <a href="/dashboard">
    Go to Dashboard
  </a>
</Button>

// Or a normal button
<Button variant="default" onClick={() => console.log('clicked')}>
  Click me
</Button>
```

## Example 7: Context-based Component Composition

Using React Context for deeply nested component communication:

```tsx
import { createContext, useContext, useState } from 'react'

// Define context
interface FormContextType {
  values: Record<string, any>
  errors: Record<string, string>
  setValue: (name: string, value: any) => void
  setError: (name: string, error: string) => void
}

const FormContext = createContext<FormContextType | null>(null)

// Form component
export function Form({ children, onSubmit }: FormProps) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when value changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const setError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  return (
    <FormContext.Provider value={{ values, errors, setValue, setError }}>
      <form onSubmit={onSubmit}>{children}</form>
    </FormContext.Provider>
  )
}

// FormField molecule that uses context
export function FormField({ name, label, children }: FormFieldProps) {
  const context = useContext(FormContext)
  if (!context) throw new Error('FormField must be used within Form')

  const { values, errors, setValue } = context

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {React.cloneElement(children, {
        id: name,
        value: values[name] || '',
        onChange: (e: any) => setValue(name, e.target.value),
        error: errors[name],
      })}
    </div>
  )
}

// Usage
;<Form onSubmit={e => console.log('submit')}>
  <FormField name="email" label="Email">
    <Input type="email" />
  </FormField>
  <FormField name="password" label="Password">
    <Input type="password" />
  </FormField>
  <Button type="submit">Submit</Button>
</Form>
```

## Example 8: Template Composition

Building page layouts with organisms:

```tsx
import { MainLayout } from '@/components/templates'
import { AppHeader, BottomNav } from '@/components/app'
import { LiveFeed, SearchModal } from '@/components/organisms'

// Page composition using templates
export function DashboardPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <MainLayout
      header={
        <AppHeader
          onSearchOpen={() => setIsSearchOpen(true)}
          // ... other props
        />
      }
      footer={<BottomNav />}
      sidebar={<NavigationSidebar />}
    >
      {/* Page content */}
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">Latest Content</h2>
          <LiveFeed channel="all" limit={10} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
          <ProgressDashboard />
        </section>
      </div>

      {/* Modal overlay */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </MainLayout>
  )
}
```

## Best Practices Summary

1. **Start with atoms** - Build basic, reusable elements first
2. **Compose, don't duplicate** - Combine existing components rather than creating new ones
3. **Use TypeScript contracts** - Define clear props interfaces
4. **Keep components focused** - Each component should have a single responsibility
5. **Leverage composition patterns** - Slots, render props, HOCs, and context
6. **Document usage** - Provide clear examples for each component
7. **Test compositions** - Ensure components work well together
8. **Consider accessibility** - Include ARIA attributes and keyboard navigation
