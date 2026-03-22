# DevPrep Frontend Architecture Overview

> **Version:** 2.0.0  
> **Last Updated:** 2026-03-22  
> **Author:** FRONTEND_ARCHITECT_LEAD

## Executive Summary

DevPrep is a React 19 + TypeScript application for developer interview preparation. The architecture follows **Atomic Design** principles with **Zustand** for global state, **React Query** for server state, and **Wouter** for routing.

## Tech Stack

| Category       | Technology     | Version |
| -------------- | -------------- | ------- |
| Framework      | React          | 19.1.0  |
| Language       | TypeScript     | 5.9.x   |
| Routing        | Wouter         | 3.3.x   |
| State (Global) | Zustand        | 4.5.x   |
| State (Server) | TanStack Query | 5.90.x  |
| Styling        | Tailwind CSS   | 4.1.x   |
| UI Primitives  | Radix UI       | Latest  |
| Build Tool     | Vite           | 7.3.x   |

---

## 1. Component Architecture (Atomic Design)

### Directory Structure

```
src/
├── components/
│   ├── ui/              # Radix-based primitives (buttons, dialogs, etc.)
│   ├── atoms/            # Basic building blocks (Text, Icon, Badge)
│   ├── molecules/        # Composed components (StatusIndicator, Card)
│   ├── organisms/        # Complex sections (ContentList, NavigationHeader)
│   ├── layouts/          # Layout templates (DashboardLayout, ContentLayout)
│   └── navigation/       # Navigation components (Sidebar, Header, Breadcrumb)
├── pages/               # Legacy V1 pages
├── pages-v2/            # New V2 pages with routing
├── routes/              # Route configuration and lazy loading
├── routes-v2/           # V2 routing with Wouter
├── stores/               # Legacy V1 stores
├── stores-v2/           # V2 Zustand stores
├── hooks/               # Custom React hooks
├── hooks-v2/            # V2 hook compositions
├── providers-v2/         # React context providers
├── lib/                 # Utilities, API clients, constants
└── services/            # External services (API, WebSocket, DB)
```

### Atomic Design Layers

#### Atoms (`src/components/ui/`)

Basic HTML element wrappers with design tokens applied.

| Component | Purpose                 |
| --------- | ----------------------- |
| Button    | Primary action trigger  |
| Input     | User text entry         |
| Badge     | Status/label indicators |
| Card      | Container with shadow   |
| Dialog    | Modal overlay           |
| Toast     | Temporary notifications |
| Spinner   | Loading indicator       |
| Skeleton  | Content placeholder     |
| Progress  | Progress indicator      |
| Tooltip   | Hover information       |

#### Molecules (`src/components/molecules/`)

2-5 atoms composed for specific purposes.

| Component       | Composition           |
| --------------- | --------------------- |
| StatusIndicator | Icon + Badge          |
| SearchInput     | Input + Icon + Button |
| ChannelList     | List + Item + Avatar  |

#### Organisms (`src/components/organisms/`)

Complex sections with application logic.

| Component        | Purpose                             |
| ---------------- | ----------------------------------- |
| ContentList      | Full content display with filtering |
| NavigationHeader | Top navigation with search          |
| LiveFeed         | Real-time content updates           |
| SearchModal      | Command palette (Cmd+K)             |

#### Templates (`src/components/layouts/`)

Page structure definitions.

| Template        | Use Case                     |
| --------------- | ---------------------------- |
| Layout          | Base layout with sidebar     |
| DashboardLayout | Stats widgets + content grid |
| ContentLayout   | Article/content display      |
| AuthLayout      | Login/register flows         |

---

## 2. State Management Architecture

### State Layers

```
┌─────────────────────────────────────────┐
│           URL / Navigation              │  ← Shareable state
├─────────────────────────────────────────┤
│        React Query (Server State)       │  ← API data, caching
├─────────────────────────────────────────┤
│      Zustand Stores (Client State)      │  ← UI, preferences
├─────────────────────────────────────────┤
│     Local State (useState/useReducer)    │  ← Component-specific
└─────────────────────────────────────────┘
```

### Zustand Stores (V2)

| Store           | File                           | Purpose                         |
| --------------- | ------------------------------ | ------------------------------- |
| ContentStore    | `stores-v2/contentStore.ts`    | Content items, stats, selection |
| UserStore       | `stores-v2/userStore.ts`       | Preferences, auth state         |
| UIStore         | `stores-v2/uiStore.ts`         | Theme, modals, notifications    |
| FilterStore     | `stores-v2/filterStore.ts`     | Filter/sort state               |
| NavigationStore | `stores-v2/navigationStore.ts` | Navigation state, breadcrumbs   |

### React Query Configuration

```typescript
// src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Query Key Factory

```typescript
export const QUERY_KEYS = {
  all: ["content"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (filters) => [...QUERY_KEYS.lists(), filters],
  details: () => [...QUERY_KEYS.all, "detail"] as const,
  detail: (id) => [...QUERY_KEYS.details(), id],
  byChannel: (channelId) => [...QUERY_KEYS.all, "channel", channelId],
  byType: (type) => [...QUERY_KEYS.all, "type", type],
  stats: () => [...QUERY_KEYS.all, "stats"],
  search: (query) => [...QUERY_KEYS.all, "search", query],
};
```

---

## 3. Routing Structure

### V2 Routes (`src/routes-v2/index.tsx`)

Uses Wouter with lazy-loaded pages.

```typescript
export const routes = [
  // Public routes
  { path: "/", component: HomePage, title: "Dashboard" },
  { path: "/onboarding", component: OnboardingPage, title: "Get Started" },

  // Content routes
  { path: "/content", component: ContentPage, title: "All Content" },
  { path: "/content/:type", component: ContentPage },

  // Practice routes
  { path: "/practice/exam", component: ExamPage },
  { path: "/practice/exam/:id", component: ExamPage },
  { path: "/practice/coding", component: CodingPage },
  { path: "/practice/coding/:id", component: CodingPage },
  { path: "/practice/voice", component: VoicePage },
  { path: "/practice/voice/:id", component: VoicePage },
];
```

### Route Hierarchy

```
/                           → Dashboard
├── /onboarding             → First-time user setup
├── /content                → All content list
│   └── /content/:type      → Filtered by type (question, flashcard, etc.)
└── /practice              → Practice modes
    ├── /practice/exam      → Exam mode
    │   └── /practice/exam/:id
    ├── /practice/coding    → Coding challenges
    │   └── /practice/coding/:id
    └── /practice/voice     → Voice interview practice
        └── /practice/voice/:id
```

---

## 4. API Integration

### API Endpoints

| Endpoint                    | Method | Purpose                  |
| --------------------------- | ------ | ------------------------ |
| `/api/content`              | GET    | Fetch all content        |
| `/api/content/:type`        | GET    | Filter by type           |
| `/api/channels`             | GET    | Fetch channels           |
| `/api/channels/:id/content` | GET    | Channel-specific content |
| `/api/generate`             | POST   | Generate new content     |

### API Client (`src/lib/api/client.ts`)

```typescript
const apiClient = {
  get: <T>(endpoint, params?) => Promise<ApiResponse<T>>,
  post: <T>(endpoint, data) => Promise<ApiResponse<T>>,
  put: <T>(endpoint, data) => Promise<ApiResponse<T>>,
  delete: (endpoint) => Promise<void>,
};
```

### Data Flow

```
User Action → React Query Hook → API Client → Server
                                          ↓
                                    SQLite/Redis
                                          ↓
Response → React Query Cache → Component Re-render
```

---

## 5. Provider Composition

### V2 Provider Stack

```typescript
<AppProvidersV2>
  ├── ErrorBoundary          # Global error handling
  ├── QueryProviderV2         # React Query context
  ├── ThemeProviderV2         # Theme (light/dark/high-contrast)
  ├── NotificationProviderV2  # Toast notifications
  ├── A11yProviderV2         # Accessibility features
  └── LoadingProviderV2      # Global loading states
</AppProvidersV2>
```

---

## 6. Page Structure (V2)

| Page             | Component            | Route                  |
| ---------------- | -------------------- | ---------------------- |
| Dashboard        | `HomePage.tsx`       | `/`                    |
| Onboarding       | `OnboardingPage.tsx` | `/onboarding`          |
| Content Browser  | `ContentPage.tsx`    | `/content/:type`       |
| Exam Mode        | `ExamPage.tsx`       | `/practice/exam/:id`   |
| Coding Challenge | `CodingPage.tsx`     | `/practice/coding/:id` |
| Voice Practice   | `VoicePage.tsx`      | `/practice/voice/:id`  |

---

## 7. Performance Optimizations

### Code Splitting

- Pages are lazy-loaded via `React.lazy()`
- Heavy components (SearchModal, ChannelBrowser) are lazy
- Vite handles automatic chunk splitting

### Bundle Strategy

```typescript
// Lazy page loading
const HomePage = React.lazy(() => import("@/pages-v2/HomePage"));

// Lazy component loading
const LazySearchModal = lazy(() =>
  import("@/components/SearchModal").then((m) => ({ default: m.SearchModal })),
);
```

### Image Optimization

- Lazy loading with Intersection Observer
- Responsive images with `srcset`
- Skeleton placeholders during load

---

## 8. Theming System

### Theme Modes

| Mode          | Use Case            |
| ------------- | ------------------- |
| Light         | Default daytime use |
| Dark          | Night/low-light     |
| High Contrast | Accessibility       |

### CSS Variables

```css
:root {
  --color-primary: #6366f1;
  --color-background: #ffffff;
  --color-foreground: #0f172a;
}

[data-theme="dark"] {
  --color-primary: #818cf8;
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
}
```

---

## 9. Data Models

### Content Item

```typescript
interface ContentItem {
  id: string;
  channelId: string;
  contentType: "question" | "flashcard" | "exam" | "voice" | "coding";
  data: Record<string, unknown>; // Type-specific payload
  qualityScore: number; // 0-100
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}
```

### Channel

```typescript
interface Channel {
  id: string;
  name: string;
  type: "tech" | "cert";
  tags: string[];
  tagFilter?: string[];
}
```

---

## 10. Best Practices

### Component Patterns

1. **Single Responsibility** - Each component does one thing
2. **Composition over Inheritance** - Build complex from simple
3. **Prop Types** - All props typed with TypeScript
4. **Memoization** - Use `React.memo()` for expensive renders

### State Patterns

1. **Server State** → React Query (API data)
2. **Global UI State** → Zustand (theme, filters)
3. **Local State** → `useState` (form inputs)
4. **URL State** → Wouter params (current route)

### Performance Rules

1. **Lazy Load** - All pages and heavy components
2. **Select Specific State** - Avoid re-renders
3. **Normalize Data** - O(1) lookups in stores
4. **Virtualize Lists** - For 100+ items

---

## 11. File Naming Conventions

| Type       | Pattern              | Example           |
| ---------- | -------------------- | ----------------- |
| Components | PascalCase           | `ContentCard.tsx` |
| Hooks      | camelCase with `use` | `useContent.ts`   |
| Stores     | camelCase            | `contentStore.ts` |
| Utils      | camelCase            | `queryClient.ts`  |
| Types      | PascalCase           | `types.ts`        |
| Constants  | SCREAMING_SNAKE      | `API_ENDPOINTS`   |

---

## 12. Testing Strategy

### Unit Tests

- All atoms and molecules
- Custom hooks
- Store actions

### Integration Tests

- Component compositions
- API integration
- Routing behavior

### E2E Tests (Playwright)

- Critical user flows
- Cross-browser compatibility

---

## 13. Migration Path (V1 → V2)

### Completed

- [x] Provider composition system
- [x] V2 Zustand stores
- [x] V2 routing with Wouter
- [x] Lazy-loaded pages
- [x] Theming system

### In Progress

- [ ] Component migration to atomic structure
- [ ] Hook consolidation
- [ ] API client refactor

### Planned

- [ ] Full V2 documentation
- [ ] Storybook integration
- [ ] PWA features

---

## 14. Key Files Reference

| File                         | Purpose             |
| ---------------------------- | ------------------- |
| `src/App.tsx`                | Main app entry (V1) |
| `src/main-v2.tsx`            | V2 app entry        |
| `src/routes-v2/index.tsx`    | V2 routing config   |
| `src/providers-v2/index.tsx` | V2 providers        |
| `src/stores-v2/index.ts`     | Store exports       |
| `src/lib/queryClient.ts`     | React Query config  |
| `src/lib/api/endpoints.ts`   | API methods         |
| `src/pages-v2/*.tsx`         | Page components     |
| `vite.config.v2.ts`          | V2 build config     |

---

## Summary

DevPrep's frontend follows modern React architecture with:

- **Atomic Design** for component organization
- **Zustand** for global client state
- **React Query** for server state management
- **Wouter** for routing
- **TypeScript** throughout
- **Lazy loading** for performance
- **Theming** for accessibility

The architecture is scalable, testable, and ready for team collaboration.
