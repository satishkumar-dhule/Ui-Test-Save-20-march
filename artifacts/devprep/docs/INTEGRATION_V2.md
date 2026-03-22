# DevPrep V2 Integration Documentation

> **Version:** 2.0.0  
> **Author:** INTEGRATION_MASTER (Jennifer Wong)  
> **Date:** 2026-03-22  
> **Status:** COMPLETED

---

## Overview

This document describes the V2 integration layer that connects all V2 systems into a cohesive application. The integration layer provides:

- **Unified Provider Composition** - Single point for all context providers
- **Centralized Routing** - Client-side routing with React 19 features
- **Error Boundaries** - Graceful error handling at multiple levels
- **Loading States** - Consistent loading UI across the application
- **Theme Integration** - Seamless theme switching with localStorage persistence
- **Accessibility** - WCAG 2.1 AA compliance with screen reader support

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           V2 APPLICATION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                         main-v2.tsx                                  │     │
│  │  • React 19 createRoot                                              │     │
│  │  • V2 CSS imports                                                   │     │
│  │  • Global error handling                                            │     │
│  │  • Performance monitoring                                          │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                          App-v2.tsx                                  │     │
│  │  • AppProvidersV2 (ErrorBoundary → Query → Theme → Notifications)  │     │
│  │  • Header with navigation, theme toggle, notifications             │     │
│  │  • Sidebar with responsive mobile support                          │     │
│  │  • Main content area with breadcrumbs                              │     │
│  │  • AppRouter for client-side routing                               │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                        routes-v2/index.tsx                           │     │
│  │  • Lazy-loaded page components                                     │     │
│  │  • Loading spinners for suspense boundaries                        │     │
│  │  • 404 Not Found page                                              │     │
│  │  • Route guards for protected routes                               │     │
│  │  • Breadcrumb generation                                           │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                       providers-v2/index.tsx                         │     │
│  │  • ErrorBoundary (catches rendering errors)                        │     │
│  │  • QueryProviderV2 (React Query for server state)                  │     │
│  │  • ThemeProviderV2 (theme switching with persistence)              │     │
│  │  • NotificationProviderV2 (toast notifications)                    │     │
│  │  • A11yProviderV2 (accessibility features)                         │     │
│  │  • LoadingProviderV2 (global loading states)                       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                      V2 SYSTEMS INTEGRATION                          │     │
│  ├─────────────────────────────────────────────────────────────────────┤     │
│  │                                                                      │     │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │     │
│  │  │   stores-v2/     │  │   hooks-v2/      │  │   pages-v2/      │  │     │
│  │  │  • contentStore  │  │  • useContent    │  │  • HomePage      │  │     │
│  │  │  • userStore     │  │  • useFilters    │  │  • ContentPage   │  │     │
│  │  │  • uiStore       │  │  • useUI         │  │  • ExamPage      │  │     │
│  │  │  • filterStore   │  │  • useUser       │  │  • CodingPage    │  │     │
│  │  └──────────────────┘  └──────────────────┘  │  • VoicePage     │  │     │
│  │                                              │  • OnboardingPage│  │     │
│  │  ┌──────────────────┐  ┌──────────────────┐  └──────────────────┘  │     │
│  │  │   styles/        │  │   atoms-v2/      │                         │     │
│  │  │  • new-themes    │  │  • Button        │                         │     │
│  │  │  • new-base      │  │  • Input         │                         │     │
│  │  │  • new-utilities │  │  • Card          │                         │     │
│  │  │  • new-spacing   │  │  • Badge         │                         │     │
│  │  └──────────────────┘  └──────────────────┘                         │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Files

### 1. Providers V2 (`src/providers-v2/index.tsx`)

**Purpose:** Central provider composition for all context providers.

**Providers:**
- `ErrorBoundary` - Catches rendering errors with user-friendly fallback
- `QueryProviderV2` - React Query client with 5-minute stale time
- `ThemeProviderV2` - Theme switching with localStorage persistence
- `NotificationProviderV2` - Toast notification system
- `A11yProviderV2` - Accessibility features (screen reader, reduced motion)
- `LoadingProviderV2` - Global loading state management

**Usage:**
```tsx
import { AppProvidersV2 } from '@/providers-v2'

function App() {
  return (
    <AppProvidersV2>
      <YourApp />
    </AppProvidersV2>
  )
}
```

### 2. Routes V2 (`src/routes-v2/index.tsx`)

**Purpose:** Central routing configuration with React 19 suspense.

**Features:**
- Lazy-loaded page components (can be enabled for code splitting)
- Loading spinners during suspense
- 404 Not Found page
- Route guards for protected routes
- Breadcrumb generation
- Navigation helpers

**Routes:**
| Path | Component | Title |
|------|-----------|-------|
| `/` | HomePage | Dashboard |
| `/onboarding` | OnboardingPage | Get Started |
| `/content` | ContentPage | All Content |
| `/content/:type` | ContentPage | Content |
| `/practice/exam` | ExamPage | Exam Practice |
| `/practice/exam/:id` | ExamPage | Take Exam |
| `/practice/coding` | CodingPage | Coding Practice |
| `/practice/coding/:id` | CodingPage | Solve Challenge |
| `/practice/voice` | VoicePage | Voice Practice |
| `/practice/voice/:id` | VoicePage | Voice Interview |
| `/:rest*` | NotFoundPage | 404 Not Found |

**Usage:**
```tsx
import { AppRouter } from '@/routes-v2'

function App() {
  return <AppRouter />
}
```

### 3. App V2 (`src/App-v2.tsx`)

**Purpose:** Main application component integrating all V2 systems.

**Features:**
- Responsive layout with mobile sidebar
- Header with navigation, theme toggle, notifications
- Breadcrumb navigation
- Skip to content link for accessibility
- Theme application on mount

**Usage:**
```tsx
import AppV2 from '@/App-v2'

// In main-v2.tsx
createRoot(rootElement).render(
  <StrictMode>
    <AppV2 />
  </StrictMode>
)
```

### 4. Main V2 (`src/main-v2.tsx`)

**Purpose:** React 19 entry point with all V2 features.

**Features:**
- Creates React 19 root with `createRoot`
- Imports all V2 CSS files
- Global error handling
- Performance monitoring
- Service worker registration (production)
- Hot module replacement support

---

## System Integration

### State Management

The V2 integration uses Zustand stores from `stores-v2/`:

```tsx
import { useUIStore, useContentStore, useFilterStore, useUserStore } from '@/stores-v2'

// In components
const { theme, setTheme } = useUIStore()
const { items, isLoading } = useContentStore()
const { filters, setFilter } = useFilterStore()
const { user, preferences } = useUserStore()
```

### Hooks

V2 hooks from `hooks-v2/` provide typed interfaces:

```tsx
import { 
  useContent, 
  useFilters, 
  useUI, 
  useUser,
  useTheme,
  useNotifications 
} from '@/hooks-v2'
```

### Components

V2 atoms from `components/atoms-v2/`:

```tsx
import { Button } from '@/components/atoms-v2/Button'
import { Input } from '@/components/atoms-v2/Input'
import { Card } from '@/components/atoms-v2/Card'
import { Badge } from '@/components/atoms-v2/Badge'
```

### Styles

V2 styles from `styles/`:

- `new-index.css` - Main entry point
- `new-themes.css` - Theme system with CSS variables
- `new-base.css` - Base component styles
- `new-utilities.css` - Utility classes
- `new-typography.css` - Typography system
- `new-spacing.css` - Spacing scale
- `new-responsive.css` - Responsive utilities
- `new-animations.css` - Animation keyframes and utilities

---

## React 19 Features

### Concurrent Features

1. **`createRoot`** - Enables concurrent rendering
2. **`useTransition`** - Non-blocking updates (can be added to components)
3. **`useDeferredValue`** - Deferred value updates (for search inputs)
4. **`Suspense`** - Declarative loading boundaries

### Automatic Batching

React 19 automatically batches state updates, reducing re-renders:

```tsx
// Multiple state updates batched into one re-render
function handleClick() {
  setCount(c => c + 1)
  setFlag(true)
  // Only one re-render happens
}
```

---

## Error Handling

### Error Boundaries

Two levels of error boundaries:

1. **App Level** - `ErrorBoundary` in providers catches all errors
2. **Page Level** - Page wrapper catches page-specific errors

### Global Error Handling

```tsx
window.addEventListener('error', (event) => {
  console.error('[DevPrep V2] Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[DevPrep V2] Unhandled promise rejection:', event.reason)
})
```

---

## Loading States

### Global Loading

```tsx
import { useLoadingV2 } from '@/providers-v2'

const { global, content, search, setGlobal, setContent, setSearch } = useLoadingV2()
```

### Route Loading

```tsx
import { Suspense } from 'react'
import { LoadingSpinner } from '@/routes-v2'

<Suspense fallback={<LoadingSpinner />}>
  <PageComponent />
</Suspense>
```

---

## Theme Integration

### Theme Switching

```tsx
import { useThemeV2 } from '@/providers-v2'

const { theme, setTheme, cycleTheme, isDark, isHighContrast } = useThemeV2()

// Set specific theme
setTheme('dark')

// Cycle through themes
cycleTheme()

// Check current theme
if (isDark) {
  // Dark mode is active
}
```

### Theme Persistence

Themes are saved to `localStorage` with key `devprep-theme-preference`:

```tsx
localStorage.setItem('devprep-theme-preference', 'dark')
```

### System Theme Detection

```tsx
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
  ? 'dark' 
  : 'light'
```

---

## Accessibility Features

### Screen Reader Support

```tsx
import { useA11yV2 } from '@/providers-v2'

const { announce, skipToContent, reducedMotion, highContrast } = useA11yV2()

// Announce to screen readers
announce('Content loaded successfully')

// Skip to main content
skipToContent()
```

### Skip Link

```tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

### ARIA Live Region

```tsx
<div
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>
```

---

## Performance

### Code Splitting

Pages can be lazy-loaded for code splitting:

```tsx
const HomePage = lazy(() => import('@/pages-v2/HomePage'))

<Suspense fallback={<LoadingSpinner />}>
  <HomePage />
</Suspense>
```

### Bundle Analysis

Vite automatically chunks:
- `vendor` - React, ReactDOM, other libraries
- `pages` - Page components
- `ui` - UI components and utilities

### Metrics

Performance metrics are logged after page load:

```tsx
console.log(`DOM Content Loaded: ${perfData.domContentLoadedEventEnd}ms`)
console.log(`Full Load: ${perfData.loadEventEnd}ms`)
```

---

## Migration from V1

### V1 vs V2 Comparison

| Feature | V1 | V2 |
|---------|----|----|
| **React Version** | 18 | 19 |
| **Entry Point** | `main.tsx` | `main-v2.tsx` |
| **App Component** | `App.tsx` | `App-v2.tsx` |
| **Providers** | `app/providers` | `providers-v2` |
| **Routing** | Manual | `routes-v2` |
| **State** | Mixed | Zustand + React Query |
| **Styles** | Mixed | V2 CSS system |
| **Accessibility** | Basic | WCAG 2.1 AA |

### Migration Steps

1. **Update imports:**
   ```diff
   - import App from './App'
   + import AppV2 from './App-v2'
   ```

2. **Update entry point:**
   ```diff
   - import './index.css'
   + import './styles/new-index.css'
   ```

3. **Update providers:**
   ```diff
   - import { AppProviders } from './app/providers'
   + import { AppProvidersV2 } from '@/providers-v2'
   ```

4. **Update routes:**
   ```diff
   - <Route path="/" component={HomePage} />
   + <AppRouter /> // Handles all routes
   ```

---

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react'
import { AppProvidersV2 } from '@/providers-v2'

test('renders app', () => {
  render(
    <AppProvidersV2>
      <AppV2 />
    </AppProvidersV2>
  )
  expect(screen.getByText('DevPrep')).toBeInTheDocument()
})
```

### Integration Tests

```tsx
test('navigates to content page', async () => {
  render(<AppV2 />)
  
  fireEvent.click(screen.getByText('Content'))
  
  await waitFor(() => {
    expect(screen.getByText('All Content')).toBeInTheDocument()
  })
})
```

---

## Deployment

### Development

```bash
npm run dev:app
```

### Production Build

```bash
npm run build:app
```

### Preview Production Build

```bash
npm run preview
```

---

## Troubleshooting

### Common Issues

1. **Theme not persisting**
   - Check localStorage is enabled
   - Verify key `devprep-theme-preference` exists

2. **Route not found**
   - Ensure route is defined in `routes-v2/index.tsx`
   - Check path matches exactly

3. **Styles not loading**
   - Verify CSS imports in `main-v2.tsx`
   - Check Tailwind is configured correctly

4. **State not updating**
   - Ensure component is wrapped in `AppProvidersV2`
   - Check store subscription is active

---

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Progressive Web App (PWA) support
- [ ] Advanced analytics integration
- [ ] A/B testing framework
- [ ] Feature flags system
- [ ] Internationalization (i18n)
- [ ] Offline support

---

## References

- [React 19 Documentation](https://react.dev/blog/2024/04/25/react-19)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Query Documentation](https://tanstack.com/query)
- [Wouter Documentation](https://github.com/molefrog/wouter)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** 2026-03-22  
**Status:** ✅ COMPLETED