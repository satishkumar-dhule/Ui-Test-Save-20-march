# DevPrep Architecture v2.0 - Blank Slate Redesign

> **Created:** 2026-03-22T11:00:00Z  
> **Author:** ARCHITECT_LEAD (John Anderson)  
> **Status:** DRAFT

## 1. Overview

This document defines the new architecture for the DevPrep application, created from scratch while preserving the existing API endpoints. The design emphasizes scalability, maintainability, and modern React patterns.

### 1.1 Design Philosophy

- **Component Composition over Inheritance** - Build complex UIs from simple, reusable pieces
- **Atomic Design Methodology** - Atoms → Molecules → Organisms → Templates → Pages
- **Type Safety First** - Strict TypeScript throughout, no `any` types
- **Performance by Default** - Lazy loading, code splitting, minimal re-renders
- **Accessibility as Core Feature** - WCAG 2.1 AA compliance built-in
- **Mobile-First Responsive** - Progressive enhancement from mobile base

### 1.2 Preserved API Contracts

| Endpoint                           | Method | Description                                 |
| ---------------------------------- | ------ | ------------------------------------------- |
| `/api/content`                     | GET    | Returns all content (with optional filters) |
| `/api/content/:type`               | GET    | Returns content filtered by type            |
| `/api/channels/:channelId/content` | GET    | Returns channel-specific content            |
| `/api/health`                      | GET    | Health check endpoint                       |

## 2. Core Principles

### 2.1 Separation of Concerns

- **UI Components** - Presentational, receive data via props
- **Business Logic** - Custom hooks, services, stores
- **Data Fetching** - Centralized API client with caching
- **State Management** - Domain-specific stores, global state minimized

### 2.2 React 19 Features

- **Server Components** - For static content, SEO optimization
- **Actions** - Form handling with `useActionState`
- **use() Hook** - Promise unwrapping in components
- **Compiler Optimizations** - Automatic memoization

### 2.3 Modern Vite Configuration

- **Environment-specific Builds** - Separate configs for dev/staging/prod
- **Advanced Code Splitting** - Route-based, component-based
- **Asset Optimization** - Image compression, font subsetting
- **PWA Support** - Service worker, offline capability

## 3. Folder Structure

```
src/
├── app/                    # App-level configuration
│   ├── providers/          # Context providers
│   │   ├── ThemeProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── ErrorBoundary.tsx
│   ├── routes/             # Route definitions
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   └── channels/
│   └── config/             # App configuration
│       ├── constants.ts
│       └── env.ts
│
├── components/             # Atomic design structure
│   ├── atoms/              # Basic UI elements
│   │   ├── Button/
│   │   ├── Text/
│   │   ├── Icon/
│   │   ├── Badge/
│   │   └── index.ts
│   ├── molecules/          # Simple compositions
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Tabs/
│   │   └── index.ts
│   ├── organisms/          # Complex UI sections
│   │   ├── Header/
│   │   ├── ContentList/
│   │   ├── Sidebar/
│   │   └── index.ts
│   ├── templates/          # Page layouts
│   │   ├── MainLayout/
│   │   ├── AuthLayout/
│   │   └── index.ts
│   └── pages/              # Route-specific components
│       ├── Home/
│       ├── Channel/
│       └── index.ts
│
├── features/               # Domain-specific features
│   ├── content/            # Content display
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── channels/           # Channel management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── search/             # Search functionality
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   └── analytics/          # Analytics tracking
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
│
├── lib/                    # Shared utilities
│   ├── api/                # API client
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── hooks/              # Generic hooks
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useDebounce.ts
│   ├── utils/              # Utility functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── storage.ts
│   └── constants/          # Shared constants
│       ├── routes.ts
│       └── storage.ts
│
├── styles/                 # Styling system
│   ├── themes/             # Theme configurations
│   │   ├── light.css
│   │   ├── dark.css
│   │   └── high-contrast.css
│   ├── tokens/             # Design tokens
│   │   ├── colors.css
│   │   ├── spacing.css
│   │   ├── typography.css
│   │   └── index.css
│   ├── utilities/          # Utility classes
│   │   ├── layout.css
│   │   ├── text.css
│   │   └── animations.css
│   └── global.css          # Global styles
│
├── stores/                 # State management
│   ├── channels.ts         # Channel state
│   ├── content.ts          # Content state
│   ├── ui.ts               # UI state
│   └── index.ts
│
├── types/                  # TypeScript definitions
│   ├── api.ts              # API response types
│   ├── content.ts          # Content domain types
│   ├── channels.ts         # Channel domain types
│   └── ui.ts               # UI component types
│
├── assets/                 # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
└── tests/                  # Test files
    ├── unit/
    ├── integration/
    ├── e2e/
    └── __mocks__/
```

## 4. Component Hierarchy (Atomic Design)

### 4.1 Atoms (Basic Elements)

| Component | Props                         | Purpose           |
| --------- | ----------------------------- | ----------------- |
| `Button`  | `variant`, `size`, `disabled` | Clickable actions |
| `Text`    | `as`, `variant`, `color`      | Text display      |
| `Icon`    | `name`, `size`, `color`       | Vector icons      |
| `Badge`   | `variant`, `count`            | Status indicators |
| `Spinner` | `size`                        | Loading states    |

### 4.2 Molecules (Simple Compositions)

| Component     | Atoms Used        | Purpose              |
| ------------- | ----------------- | -------------------- |
| `Card`        | Text, Icon, Badge | Content containers   |
| `Modal`       | Button, Text      | Overlay dialogs      |
| `Tabs`        | Button, Text      | Tab navigation       |
| `SearchInput` | Input, Icon       | Search functionality |

### 4.3 Organisms (Complex Sections)

| Component     | Molecules Used    | Purpose            |
| ------------- | ----------------- | ------------------ |
| `Header`      | Tabs, SearchInput | App header         |
| `ContentList` | Card, Badge       | Content display    |
| `Sidebar`     | Tabs, Card        | Navigation sidebar |
| `Footer`      | Text, Icon        | App footer         |

### 4.4 Templates (Page Layouts)

| Template      | Organisms Used           | Purpose              |
| ------------- | ------------------------ | -------------------- |
| `MainLayout`  | Header, Sidebar, Content | Main app layout      |
| `AuthLayout`  | Modal, Card              | Authentication pages |
| `EmptyLayout` | -                        | Minimal pages        |

### 4.5 Pages (Route Components)

| Page             | Templates Used | Purpose         |
| ---------------- | -------------- | --------------- |
| `HomePage`       | MainLayout     | Landing page    |
| `ChannelPage`    | MainLayout     | Channel content |
| `SearchPage`     | MainLayout     | Search results  |
| `OnboardingPage` | AuthLayout     | User setup      |

## 5. State Management

### 5.1 Local State (Component-level)

- **useState** - UI state, form inputs
- **useReducer** - Complex local state
- **useRef** - DOM references, timers

### 5.2 Feature State (Zustand)

- **channelsStore** - Selected channels, filters
- **contentStore** - Content cache, loading states
- **uiStore** - Theme, sidebar state, modals

### 5.3 Server State (React Query)

- **Query Keys** - Hierarchical key structure
- **Caching** - 5-minute stale time, background refetch
- **Optimistic Updates** - For mutations

### 5.4 Global State (Minimal)

- **Theme** - Via ThemeProvider
- **User Preferences** - Local storage with sync

## 6. Routing

### 6.1 Router Choice

- **Wouter** - Lightweight, React-friendly
- **Nested Routes** - Layout-based nesting
- **Route Guards** - Authentication/authorization

### 6.2 Route Structure

```
/                     # Home (all channels)
/channel/:id          # Channel content
/channel/:id/:section # Specific section
/search               # Search results
/settings             # User settings
/onboarding           # New user setup
```

### 6.3 Route Components

- **Lazy Loading** - Code-split by route
- **Preloading** - On hover/focus
- **Error Boundaries** - Per-route error handling

## 7. API Integration

### 7.1 API Client

```typescript
// lib/api/client.ts
class ApiClient {
  private baseUrl: string

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Implementation with error handling
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // Implementation
  }
}
```

### 7.2 React Query Hooks

```typescript
// features/content/hooks/useContent.ts
export function useContent(channelId?: string) {
  return useQuery({
    queryKey: ['content', channelId],
    queryFn: () => fetchContent(channelId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### 7.3 Error Handling

- **Global Error Boundary** - Catches render errors
- **API Error Responses** - Standardized error format
- **Retry Logic** - Exponential backoff for network errors
- **Offline Support** - Cache-first, background sync

## 8. Styling & Theming

### 8.1 Styling Approach

- **CSS Modules** - Scoped component styles
- **Utility Classes** - Tailwind CSS for layout
- **Design Tokens** - CSS custom properties
- **No Runtime CSS** - Build-time optimization

### 8.2 Theme System

```css
/* themes/light.css */
:root {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  --color-text: #1f2937;
}

/* themes/dark.css */
:root[data-theme='dark'] {
  --color-primary: #60a5fa;
  --color-background: #111827;
  --color-text: #f9fafb;
}
```

### 8.3 Responsive Design

- **Mobile-First** - Base styles for mobile
- **Breakpoints** - sm(640px), md(768px), lg(1024px), xl(1280px)
- **Container Queries** - Component-level responsiveness
- **Fluid Typography** - clamp() for scalable text

## 9. Performance Optimization

### 9.1 Bundle Optimization

- **Code Splitting** - Route-based and component-based
- **Tree Shaking** - ES modules, side-effect free
- **Asset Compression** - WebP images, Brotli text
- **Bundle Analysis** - Webpack Bundle Analyzer

### 9.2 Runtime Performance

- **React.memo** - For expensive components
- **useMemo/useCallback** - For computed values
- **Virtual Lists** - For large content lists
- **Intersection Observer** - Lazy loading images/components

### 9.3 Caching Strategy

- **React Query** - API response caching
- **Service Worker** - Static asset caching
- **localStorage** - User preferences
- **IndexedDB** - Offline content cache

## 10. Testing Strategy

### 10.1 Unit Testing

- **Vitest** - Test runner
- **React Testing Library** - Component tests
- **Mock Service Worker** - API mocking
- **Coverage Target** - 80% line coverage

### 10.2 Integration Testing

- **API Integration** - Real endpoint testing
- **Component Integration** - Multi-component tests
- **State Integration** - Store integration tests

### 10.3 E2E Testing

- **Playwright** - Cross-browser testing
- **Critical Paths** - User journeys
- **Performance Tests** - Lighthouse CI

### 10.4 Accessibility Testing

- **axe-core** - Automated WCAG checks
- **Screen Reader Testing** - Manual NVDA/VoiceOver
- **Keyboard Navigation** - Tab order verification

## 11. Build & Deployment

### 11.1 Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
        },
      },
    },
  },
})
```

### 11.2 Deployment Environments

- **Development** - Local with hot reload
- **Staging** - Preview deployments
- **Production** - Optimized builds
- **PWA** - Installable web app

### 11.3 CI/CD Pipeline

1. **Lint & Type Check** - ESLint, TypeScript
2. **Unit Tests** - Vitest with coverage
3. **Build** - Production bundle
4. **E2E Tests** - Playwright
5. **Deploy** - Static hosting (Vercel/Netlify)

## 12. Future Considerations

### 12.1 Scalability

- **Micro-frontend Ready** - Module federation support
- **Multi-language** - i18n prepared structure
- **Internationalization** - RTL support, locale formatting

### 12.2 Advanced Features

- **Real-time Updates** - WebSocket integration
- **Offline-First** - Service worker enhancements
- **AI Integration** - Content generation hooks

### 12.3 Monitoring & Analytics

- **Error Tracking** - Sentry integration
- **Performance Monitoring** - Web Vitals
- **User Analytics** - Privacy-focused tracking
- **A/B Testing** - Feature flag system

---

## Appendix A: Migration Strategy

### Phase 1: Foundation

1. Set up new folder structure
2. Create base components (atoms)
3. Implement theming system
4. Set up routing

### Phase 2: Core Features

1. Implement channel management
2. Build content display
3. Add search functionality
4. Create user settings

### Phase 3: Polish & Optimization

1. Performance optimization
2. Accessibility audit
3. Testing coverage
4. Documentation

### Phase 4: Deployment

1. CI/CD pipeline
2. Monitoring setup
3. Production deployment
4. User migration

---

## Appendix B: API Response Formats

### Content Response

```typescript
interface ContentResponse {
  ok: boolean
  data: ContentItem[]
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

interface ContentItem {
  id: string
  content_type: 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
  channel_id: string
  data: Record<string, unknown>
  quality_score: number
  created_at: number
}
```

### Channel Response

```typescript
interface ChannelResponse {
  ok: boolean
  data: Channel[]
}

interface Channel {
  id: string
  name: string
  type: 'tech' | 'cert'
  tags: string[]
  tagFilter?: string[]
}
```

---

_This architecture is a living document. Update as requirements evolve._
