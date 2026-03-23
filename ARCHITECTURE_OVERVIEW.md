# DevPrep Frontend Architecture Overview

> **Version:** 2.1.0
> **Last Updated:** 2026-03-22
> **Author:** FRONTEND_ARCHITECT_LEAD

## Executive Summary

DevPrep is a **fully client-side** React 19 + TypeScript application for developer interview preparation. There is no backend API server — the database (SQLite) runs entirely in the browser via **sql.js (WASM)**, and all data access is through `src/services/dbApi.ts`.

The UI architecture follows **Atomic Design** principles with **Zustand** for global state, **React Query** (wrapping in-browser DB calls, not HTTP) for async data, and **Wouter** for routing.

> **Agent notice:** Do NOT add Express routes, Redis, or any server-side API calls to the DevPrep artifact. See §4 for the complete data layer specification.

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

## 4. Data Layer (sql.js — Browser-Native SQLite)

> **IMPORTANT FOR ALL AGENTS:** DevPrep is a **fully client-side application** with **no backend API server**. The database runs entirely in the browser via WebAssembly (sql.js). Do NOT introduce Express routes, API server calls, or Redis references — they do not exist in this architecture.

### Architecture

```
Browser
  └── sql.js (SQLite compiled to WASM)
        └── /devprep.db (served as a static file by Vite)
              ├── generated_content table
              └── channels table
```

### Data Layer Files

| File | Purpose |
| ---- | ------- |
| `src/services/dbClient.ts` | Initialises sql.js, fetches `/devprep.db`, falls back to seed data |
| `src/services/dbApi.ts` | SQL query functions against the in-browser DB |
| `src/services/dbLoader.ts` | Lazy WASM loader with progress tracking |
| `src/services/dbClientOptimized.ts` | Optimised query cache layer over dbClient |
| `src/contentApi.ts` | High-level content API using `tryDbFirst` — DB → static fallback |

### Client-Side Query Pattern

```typescript
// src/services/dbApi.ts
export async function getContent(filters?: ContentFilters): Promise<ContentItem[]> {
  const db = await getDb()           // sql.js DB instance
  const rows = db.exec(sql, params)  // synchronous SQL execution in WASM
  return transformRows(rows)
}
```

### Data Flow

```
User Action → React Query Hook → contentApi.ts → dbApi.ts → sql.js (WASM)
                                                                  ↓
                                                         /devprep.db (static)
                                                                  ↓
Response → React Query Cache → Component Re-render
```

### Fallback Chain

```
1. sql.js loads /devprep.db from Vite static assets
2. If DB unavailable → seed data from src/data/ (static TypeScript files)
3. Channels: useChannels() hook → DB → data/channels.ts fallback
```

### Channels Table Schema

```sql
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  emoji TEXT,
  color TEXT,
  type TEXT CHECK(type IN ('tech', 'cert')),
  cert_code TEXT,
  description TEXT,
  tag_filter TEXT,   -- JSON array of tags
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
)
```

### Content Table Schema

```sql
CREATE TABLE generated_content (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  content_type TEXT NOT NULL,  -- 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
  data TEXT NOT NULL,          -- JSON payload matching CONTENT_STANDARDS.md interfaces
  quality_score REAL,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at INTEGER,
  updated_at INTEGER
)
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

> **Source of truth for content data shapes:** `CONTENT_STANDARDS.md`
>
> The interfaces here are the **database row** shapes (what sql.js returns). The `data` column contains a JSON-serialised payload whose shape is defined per `contentType` in `CONTENT_STANDARDS.md`. Always refer to that document for the authoritative field-level specification.

### Content Row (database row from `generated_content` table)

```typescript
interface ContentRow {
  id: string;                    // See CONTENT_STANDARDS.md for format per type
  channel_id: string;            // Channel slug, e.g. "javascript", "aws-saa"
  content_type: "question" | "flashcard" | "exam" | "voice" | "coding";
  data: string;                  // JSON string — parse to get the typed payload below
  quality_score: number;         // 0.0–1.0 (threshold for approval: >= 0.5)
  status: "pending" | "approved" | "rejected";
  created_at: number;            // Unix timestamp ms
  updated_at: number;
}
```

### Parsed Content Payloads (from `data` column)

The JSON inside `data` is one of the following, depending on `content_type`:

| `content_type` | TypeScript interface | Defined in |
| -------------- | -------------------- | ---------- |
| `question`     | `Question`           | `CONTENT_STANDARDS.md` §4 |
| `flashcard`    | `Flashcard`          | `CONTENT_STANDARDS.md` §5 |
| `coding`       | `CodingChallenge`    | `CONTENT_STANDARDS.md` §6 |
| `exam`         | `ExamQuestion`       | `CONTENT_STANDARDS.md` §7 |
| `voice`        | `VoicePrompt`        | `CONTENT_STANDARDS.md` §8 |

### Channel (database row from `channels` table)

```typescript
interface ChannelRow {
  id: string;          // Channel slug, e.g. "javascript", "aws-saa"
  name: string;        // Display name, e.g. "JavaScript"
  short_name: string;  // Abbreviated name
  emoji: string;       // UI emoji
  color: string;       // Hex colour for UI theming
  type: "tech" | "cert";
  cert_code: string | null;    // e.g. "AWS-SAA-C03" — null for tech channels
  description: string;
  tag_filter: string;  // JSON array of concept tags for this channel
  is_active: number;   // 0 or 1
  sort_order: number;
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

1. **DB State** → React Query (data from sql.js via `dbApi.ts` / `contentApi.ts`)
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
