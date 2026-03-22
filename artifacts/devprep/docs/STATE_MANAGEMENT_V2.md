# State Management V2 - Modern Architecture

> **Version:** 2.0.0  
> **Last Updated:** 2026-03-22  
> **Author:** STATE_ARCHITECT (Maria Garcia)

## Overview

The State Management V2 system provides a modern, scalable architecture for managing application state using:

- **Zustand** for global client state
- **React Query** for server state
- **Local state** for component-specific state
- **TypeScript** strict typing throughout

## Architecture Principles

### 1. Separation of Concerns

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Server State** | React Query | API data, caching, synchronization |
| **Global Client State** | Zustand | UI state, user preferences, filters |
| **Local Component State** | React useState/useReducer | Component-specific, transient state |
| **URL State** | URL params | Shareable, bookmarkable state |

### 2. Single Source of Truth

Each piece of state has one authoritative store. No duplication across stores.

### 3. Immutable Updates

All state updates create new objects, never mutate existing state.

## Store Architecture

### Content Store (`src/stores-v2/contentStore.ts`)

Manages content items from the API with optimistic updates.

```typescript
interface ContentStoreState {
  items: Record<string, ContentItem>  // Normalized by ID
  stats: ContentStats                  // Aggregated statistics
  selectedIds: string[]               // Selected items for batch operations
  lastFetched: number | null          // Timestamp of last fetch
}
```

**Actions:**
- `setItems(items)` - Replace all items
- `addItem(item)` - Add single item
- `updateItem(id, updates)` - Update item fields
- `removeItem(id)` - Delete item
- `select(id)` / `deselect(id)` - Selection management
- `clear()` - Reset store

### User Store (`src/stores-v2/userStore.ts`)

Persistent user preferences and authentication state.

```typescript
interface UserStoreState {
  preferences: UserPreferences
  isAuthenticated: boolean
  lastActive: number
}
```

**Features:**
- Automatic localStorage persistence
- Theme preference management
- Saved channels and recent searches
- Compact mode and quality score display toggles

### UI Store (`src/stores-v2/uiStore.ts`)

Transient UI state (modals, notifications, loading indicators).

```typescript
interface UIStoreState {
  theme: Theme
  sidebar: { open: boolean; width: number }
  modal: { open: boolean; type: ModalType | null; data: unknown }
  notifications: Notification[]
  loading: { global: boolean; content: boolean; search: boolean }
}
```

**Features:**
- Theme application with system preference detection
- Modal management with typed data
- Notification system with auto-expire
- Loading state for different areas

### Filter Store (`src/stores-v2/filterStore.ts`)

Content filtering and sorting state.

```typescript
interface FilterStoreState {
  channel: string | null
  type: ContentType | null
  status: ContentStatus | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  search: string
  sort: { field: 'createdAt' | 'qualityScore' | 'updatedAt'; order: 'asc' | 'desc' }
  tags: string[]
}
```

**Features:**
- URL synchronization support
- Active filter counting
- Query parameter building for API calls

## React Query Integration

### Query Keys

Centralized query key factory for cache management:

```typescript
export const contentKeys = {
  all: ['content'],
  lists: () => [...contentKeys.all, 'list'],
  list: (filters) => [...contentKeys.lists(), filters],
  details: () => [...contentKeys.all, 'detail'],
  detail: (id) => [...contentKeys.details(), id],
  stats: () => [...contentKeys.all, 'stats'],
  search: (query) => [...contentKeys.all, 'search', query],
  byChannel: (channelId) => [...contentKeys.all, 'channel', channelId],
  byType: (type) => [...contentKeys.all, 'type', type],
}
```

### Hooks

#### Data Fetching Hooks

```typescript
// List with filters
const { data, isLoading, error } = useContent({ filters })

// Single item
const { data: item } = useContentById(id)

// By type/channel
const { data: questions } = useContentByType('question')
const { data: devopsContent } = useContentByChannel('devops')

// Stats
const { data: stats } = useContentStats()

// Search
const { data: results } = useContentSearch(query, { enabled: query.length >= 2 })
```

#### Mutation Hooks

```typescript
// Create
const createMutation = useCreateContent()
createMutation.mutate({ channelId: 'devops', contentType: 'question', ... })

// Update
const updateMutation = useUpdateContent()
updateMutation.mutate({ id: '123', updates: { status: 'approved' } })

// Delete
const deleteMutation = useDeleteContent()
deleteMutation.mutate('123')
```

## Custom Hooks

### Content Hooks (`src/hooks-v2/useContent.ts`)

React Query hooks for server state with optimistic updates.

### Filter Hooks (`src/hooks-v2/useFilters.ts`)

- `useFilters()` - Access all filter state
- `useFilteredItems(items)` - Filter array of items
- `useFilterURLSync()` - Sync filters with URL
- `useChannelFilter()` - Channel-specific filter
- `useTypeFilter()` - Type-specific filter
- `useSearchFilter()` - Search input
- `useSortFilter()` - Sort configuration
- `useTagsFilter()` - Tag management

### UI Hooks (`src/hooks-v2/useUI.ts`)

- `useUI()` - Full UI state
- `useTheme()` - Theme management with system detection
- `useSidebar()` - Sidebar state
- `useModal()` - Modal management
- `useNotifications()` - Notification system
- `useLoading()` - Loading states

### User Hooks (`src/hooks-v2/useUser.ts`)

- `useUser()` - Full user state
- `usePreferences()` - Preference management
- `useSavedChannels()` - Saved channels
- `useRecentSearches()` - Recent search history
- `useAuth()` - Authentication state

## Usage Examples

### Basic Content List

```typescript
import { useContent, useFilters } from '@/hooks-v2'

function ContentList() {
  const filters = useFilters()
  const { data: content, isLoading, error } = useContent({ filters })
  
  if (isLoading) return <Loading />
  if (error) return <Error error={error} />
  
  return (
    <div>
      {content.map(item => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  )
}
```

### Filter Panel

```typescript
import { useFilters, useActiveFilterCount, useResetFilters } from '@/hooks-v2'

function FilterPanel() {
  const { channel, setChannel, type, setType, search, setSearch } = useFilters()
  const activeCount = useActiveFilterCount()
  const reset = useResetFilters()
  
  return (
    <div>
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder="Search..."
      />
      
      <select value={channel || ''} onChange={(e) => setChannel(e.target.value || null)}>
        <option value="">All Channels</option>
        <option value="devops">DevOps</option>
        <option value="react">React</option>
      </select>
      
      {activeCount > 0 && (
        <button onClick={reset}>Clear Filters ({activeCount})</button>
      )}
    </div>
  )
}
```

### Notification System

```typescript
import { useNotifications } from '@/hooks-v2'

function SaveButton() {
  const { success, error } = useNotifications()
  
  const handleSave = async () => {
    try {
      await saveData()
      success('Saved', 'Your changes have been saved successfully')
    } catch (err) {
      error('Save Failed', err.message)
    }
  }
  
  return <button onClick={handleSave}>Save</button>
}
```

## Performance Considerations

### Selectors

Use specific selectors to prevent unnecessary re-renders:

```typescript
// Bad - re-renders on any state change
const items = useContentStore(state => state.items)

// Good - only re-renders when items change
const items = useContentStore(contentSelectors.itemsArray)
```

### Normalized State

Content items are stored normalized by ID for O(1) lookups:

```typescript
// Efficient lookup
const item = useContentStore(state => state.items[id])

// Efficient filtering
const devopsItems = useContentStore(
  useCallback(state => 
    Object.values(state.items).filter(item => item.channelId === 'devops'),
    []
  )
)
```

### React Query Caching

- **Stale Time:** 30 seconds for lists, 60 seconds for details
- **GC Time:** 5 minutes for unused queries
- **Background Refetch:** On window focus for stale data

## TypeScript Integration

All types are defined in `src/stores-v2/types.ts`:

```typescript
// Store types
ContentStoreState, UserStoreState, UIStoreState, FilterStoreState

// Action types
ContentActions, UserActions, UIActions, FilterActions

// Data types
ContentItem, ContentStats, Notification, UserPreferences

// Utility types
DeepPartial<T>, StateSelector<T, R>, StoreSetState<T>
```

## DevTools Support

All stores include DevTools integration in development:

```typescript
// In browser console
window.__ZUSTAND_DEVTOOLS__?.ContentStore
window.__ZUSTAND_DEVTOOLS__?.UserStore
window.__ZUSTAND_DEVTOOLS__?.UIStore
window.__ZUSTAND_DEVTOOLS__?.FilterStore
```

## Migration Guide

### From Legacy State

1. **Replace direct store imports:**
   ```typescript
   // Before
   import { useContentStore } from '@/stores/contentStore'
   
   // After
   import { useContent } from '@/hooks-v2'
   ```

2. **Update filter usage:**
   ```typescript
   // Before
   const filters = useStore(state => state.filters)
   
   // After
   const filters = useFilters()
   ```

3. **Migrate notifications:**
   ```typescript
   // Before
   const addNotification = useStore(state => state.addNotification)
   
   // After
   const { success, error } = useNotifications()
   ```

### API Compatibility

The V2 system maintains full API compatibility with existing endpoints:
- `/api/content` - GET, POST, PATCH, DELETE
- `/api/content/stats`
- `/api/content/search`
- `/api/content/channel/:channelId`
- `/api/content/type/:type`

WebSocket connections for real-time updates remain unchanged.

## Testing

```typescript
// Example test
import { renderHook, act } from '@testing-library/react'
import { useFilters } from '@/hooks-v2'

describe('useFilters', () => {
  it('should set channel filter', () => {
    const { result } = renderHook(() => useFilters())
    
    act(() => {
      result.current.setChannel('devops')
    })
    
    expect(result.current.channel).toBe('devops')
  })
})
```

## File Structure

```
src/
├── stores-v2/           # Zustand stores
│   ├── types.ts         # All type definitions
│   ├── contentStore.ts  # Content state
│   ├── userStore.ts     # User preferences
│   ├── uiStore.ts       # UI state
│   └── filterStore.ts   # Filter state
└── hooks-v2/            # React hooks
    ├── index.ts         # Exports
    ├── useContent.ts    # React Query hooks
    ├── useFilters.ts    # Filter hooks
    ├── useUI.ts         # UI hooks
    └── useUser.ts       # User hooks
```

## Best Practices

1. **Use hooks over direct store access** - Better encapsulation and testing
2. **Leverage selectors** - Prevent unnecessary re-renders
3. **Keep stores focused** - Each store has single responsibility
4. **Use React Query for server state** - Don't duplicate API data in Zustand
5. **Normalize related data** - Use IDs and references, not nested objects
6. **Type everything** - No `any` types in production code

---

**Next Steps:**
- Integrate with existing components
- Add WebSocket integration for real-time updates
- Implement offline support with background sync
- Add state persistence strategies