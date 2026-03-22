# Breadcrumb Navigation

Comprehensive breadcrumb navigation system for DevPrep V2. Provides clear wayfinding through the app hierarchy with auto-generation from routes, collapsible paths, and accessibility features.

## Overview

The breadcrumb system consists of two main components:

1. **`Breadcrumb`** - Main container component with auto-generation and custom patterns
2. **`BreadcrumbItem`** - Individual breadcrumb item with link or current page indicator

## Features

- **Auto-generated from route** - Automatically builds breadcrumbs from current path
- **Collapsible on long paths** - Uses ellipsis for paths longer than 4 items
- **Click to navigate** - Each breadcrumb is a clickable link
- **Schema.org structured data** - Includes JSON-LD for SEO
- **Accessible with ARIA labels** - Proper screen reader support
- **Mobile responsive** - Truncates middle items on small screens

## Usage

### Auto-generated Breadcrumb (Recommended)

```tsx
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

function MyPage() {
  return (
    <div>
      <Breadcrumb />
      {/* Page content */}
    </div>
  )
}
```

The breadcrumb will automatically generate based on the current route:
- `/` → Home
- `/content` → Home > Content
- `/practice/exam` → Home > Practice > Exam
- `/practice/coding/react-hooks` → Home > Practice > Coding Challenge > React Hooks

### Custom Breadcrumb

```tsx
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

function MyCustomPage() {
  return (
    <Breadcrumb
      items={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Reports', path: '/dashboard/reports' },
        { label: 'Monthly Summary', path: '/dashboard/reports/monthly' },
      ]}
    />
  )
}
```

### Collapsible Breadcrumb

```tsx
// Collapses middle items when path is longer than 4 items
<Breadcrumb
  items={[
    { label: 'Home', path: '/' },
    { label: 'Level 1', path: '/level-1' },
    { label: 'Level 2', path: '/level-1/level-2' },
    { label: 'Level 3', path: '/level-1/level-2/level-3' },
    { label: 'Level 4', path: '/level-1/level-2/level-3/level-4' },
    { label: 'Current Page', path: '/level-1/level-2/level-3/level-4/current' },
  ]}
  maxItems={4}
  collapsed={true}
/>
// Renders: Home > ... > Level 4 > Current Page
```

## Preset Patterns

### Home > Channel > Content Type > Content

```tsx
import { HomeChannelContentTypeContentBreadcrumb } from '@/components/navigation/Breadcrumb'

function ContentDetailPage() {
  return (
    <HomeChannelContentTypeContentBreadcrumb
      channel="javascript"
      contentType="question"
      contentTitle="What is a closure?"
    />
  )
}
// Renders: Home > JavaScript > Question > What is a closure?
```

### Home > Settings > Section

```tsx
import { SettingsSectionBreadcrumb } from '@/components/navigation/Breadcrumb'

function SettingsPage() {
  return (
    <SettingsSectionBreadcrumb section="profile" />
  )
}
// Renders: Home > Settings > Profile
```

### Home > Analytics > Report

```tsx
import { AnalyticsReportBreadcrumb } from '@/components/navigation/Breadcrumb'

function AnalyticsReportPage() {
  return (
    <AnalyticsReportBreadcrumb
      reportType="performance"
      reportName="User Engagement Q4 2025"
    />
  )
}
// Renders: Home > Analytics > Performance > User Engagement Q4 2025
```

## Props

### Breadcrumb Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItemData[]` | - | Custom breadcrumb items. If provided, auto-generation is disabled |
| `autoGenerate` | `boolean` | `true` | Automatically generate breadcrumbs from current route |
| `maxItems` | `number` | `4` | Maximum items to show before collapsing |
| `collapsed` | `boolean` | `true` | Enable collapsing for long paths |
| `showHome` | `boolean` | `true` | Show Home item in auto-generated breadcrumbs |
| `separator` | `React.ReactNode` | `<ChevronRight />` | Custom separator between items |
| `onItemClick` | `(item: BreadcrumbItemData) => void` | - | Callback when a breadcrumb item is clicked |
| `className` | `string` | - | Additional CSS classes |

### BreadcrumbItemData

```typescript
interface BreadcrumbItemData {
  label: string  // Display text
  path: string   // Navigation path
}
```

### BreadcrumbItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Display text for the item |
| `path` | `string` | - | Navigation path |
| `isCurrent` | `boolean` | `false` | Whether this is the current page |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | - | Additional CSS classes |
| `children` | `React.ReactNode` | - | Custom content (overrides label) |

## Route Mapping

The auto-generation system maps route segments to human-readable labels:

| Route Segment | Label |
|--------------|-------|
| `content` | Content |
| `practice` | Practice |
| `exam` | Exam |
| `coding` | Coding Challenge |
| `voice` | Voice Interview |
| `settings` | Settings |
| `analytics` | Analytics |
| `onboarding` | Get Started |
| `:param` | Details |

Segments not in the map are converted to title case with hyphens replaced by spaces.

## Accessibility

### ARIA Labels

```html
<nav aria-label="Breadcrumb navigation">
  <ol>
    <li><a href="/" aria-label="Navigate to Home">Home</a></li>
    <li><span aria-hidden="true"><svg>...</svg></span></li>
    <li><span aria-current="page" aria-disabled="true">Current Page</span></li>
  </ol>
</nav>
```

### Keyboard Navigation

- Tab to navigate between breadcrumb items
- Enter or Space to activate a link
- Current page item is not focusable (aria-disabled)

## Schema.org Structured Data

The breadcrumb component automatically includes JSON-LD structured data:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Content",
      "item": "/content"
    }
  ]
}
</script>
```

## Mobile Responsive Design

On mobile devices, the breadcrumb automatically adjusts:

- **Long paths**: Middle items collapse with ellipsis
- **Small screens**: Font size and spacing reduce
- **Touch targets**: Minimum 44px touch targets for accessibility

## Styling

The breadcrumb uses Tailwind CSS classes and follows the design system:

```css
/* Default styles */
.nav { py: 0.5rem }
.ol { flex-wrap: items-center; gap: 0.375rem; text-sm }
.li { inline-flex; items-center; gap: 0.375rem }
.a { transition-colors; hover:text-foreground }
.span { font-normal; text-foreground }

/* Separator */
.separator { lucide-chevron-right; w-3.5; h-3.5 }

/* Ellipsis */
.ellipsis { more-horizontal; w-4; h-4 }
```

## Integration with Existing Components

### With Layout Components

```tsx
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

function MyPage() {
  return (
    <DashboardLayout>
      <Breadcrumb />
      {/* Page content */}
    </DashboardLayout>
  )
}
```

### With Sidebar Navigation

```tsx
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Sidebar } from '@/components/navigation/Sidebar'

function MyPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Breadcrumb />
        {/* Page content */}
      </main>
    </div>
  )
}
```

## Custom Patterns

You can create custom breadcrumb patterns for specific page types:

```tsx
// Custom pattern for course pages
export function CourseBreadcrumb({
  course,
  lesson,
  className,
}: {
  course: string
  lesson?: string
  className?: string
}) {
  const items = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: course, path: `/courses/${encodeURIComponent(course)}` },
  ]

  if (lesson) {
    items.push({
      label: lesson,
      path: `/courses/${encodeURIComponent(course)}/${encodeURIComponent(lesson)}`,
    })
  }

  return <Breadcrumb items={items} className={className} />
}
```

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from './Breadcrumb'

describe('Breadcrumb', () => {
  it('renders custom items', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Settings', path: '/settings' },
        ]}
      />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('marks current page correctly', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Current', path: '/current' },
        ]}
      />
    )

    const currentPage = screen.getByText('Current')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })

  it('collapses long paths', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Level 1', path: '/1' },
          { label: 'Level 2', path: '/2' },
          { label: 'Level 3', path: '/3' },
          { label: 'Level 4', path: '/4' },
          { label: 'Level 5', path: '/5' },
        ]}
        maxItems={4}
        collapsed={true}
      />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Level 5')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument() // Ellipsis
  })
})
```

### Accessibility Tests

```tsx
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

describe('Breadcrumb Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Page', path: '/page' },
        ]}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper aria-label on nav', () => {
    render(<Breadcrumb />)

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(nav).toBeInTheDocument()
  })
})
```

## Migration from Radix UI Breadcrumb

The existing Radix UI breadcrumb components in `src/components/ui/breadcrumb.tsx` are still available. The new navigation breadcrumb components provide:

1. **Auto-generation** from routes
2. **Preset patterns** for common page types
3. **Collapsing** for long paths
4. **Schema.org** structured data

To migrate:

```tsx
// Before (Radix UI)
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

// After (Navigation Breadcrumb)
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

<Breadcrumb
  items={[
    { label: 'Home', path: '/' },
    { label: 'Current', path: '/current' },
  ]}
/>
```

## Contributing

When adding new breadcrumb patterns:

1. Add route segment to `formatSegmentLabel()` in `Breadcrumb.tsx`
2. Create preset pattern component if needed
3. Update documentation with examples
4. Add unit tests for new patterns
5. Ensure accessibility compliance

## Related

- [Route Configuration](./ROUTES.md)
- [Navigation Architecture](../../NAVIGATION_ARCHITECTURE.md)
- [Accessibility Guide](./ACCESSIBILITY.md)
- [Design System](./DESIGN_SYSTEM.md)