# DevPrep State Architecture

> **Version:** 1.0.0  
> **Last Updated:** 2026-03-22  
> **Author:** Marcus Johnson (STATE_INTEGRATION)  
> **Experience:** 22 years in frontend state management

## Overview

This document defines the comprehensive state architecture for the DevPrep application. The architecture follows a layered approach with clear separation of concerns between global, server, local, and real-time state.

## Architecture Principles

1. **Single Source of Truth**: Each piece of state has exactly one authoritative source
2. **Immutability**: All state updates are immutable to prevent side effects
3. **Predictability**: State transitions are deterministic and testable
4. **Performance**: State updates are optimized to minimize re-renders
5. **Developer Experience**: State is debuggable with DevTools integration

## State Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION STATE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │   GLOBAL STATE  │  │  SERVER STATE   │  │      LOCAL STATE            │   │
│  │   (Zustand)     │  │  (React Query)  │  │  (Component/Context)        │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘   │
│           │                     │                     │                       │
│           ▼                     ▼                     ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ Content Store   │  │  Query Cache    │  │  Component State            │   │
│  │ Realtime Store  │  │  Mutations      │  │  UI State                   │   │
│  │ Filter Store    │  │  Infinite Query │  │  Form State                 │   │
│  │ Agent Store     │  │  Prefetching    │  │  Animation State            │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘   │
│           │                     │                     │                       │
│           └─────────────────────┼─────────────────────┘                       │
│                                 ▼                                             │
│                    ┌─────────────────────────────┐                            │
│                    │    REAL-TIME SYNC LAYER     │                            │
│                    │    (WebSocket Integration)  │                            │
│                    └─────────────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Global State (Zustand Stores)

### Content Store (`contentStore.ts`)

- **Purpose**: Manages all content data with optimistic updates
- **State Shape**: `ContentStoreState`
- **Key Features**:
  - Immutable updates with proper merging
  - Optimistic update queue for offline-first experience
  - Batch operations for performance
  - Selective subscriptions to minimize re-renders

### Realtime Store (`realtimeStore.ts`)

- **Purpose**: Manages WebSocket connection state and message queue
- **State Shape**: `RealtimeState`
- **Key Features**:
  - Connection status tracking (connecting/connected/disconnected/reconnecting)
  - Retry logic with exponential backoff
  - Message queue for offline message handling
  - Heartbeat monitoring

### Filter Store (`filterStore.ts`)

- **Purpose**: Manages UI filter state for content display
- **State Shape**: `FilterState`
- **Key Features**:
  - URL synchronization support
  - Reset functionality
  - Multiple filter combinations
  - Sort order management

### Agent Store (`agentStore.ts`)

- **Purpose**: Tracks AI agent execution state and progress
- **State Shape**: `AgentStoreState`
- **Key Features**:
  - Agent lifecycle management
  - Progress tracking
  - Log aggregation
  - Time tracking

## 2. Server State (React Query)

### Query Configuration

```typescript
// Configuration from queryClient.ts
{
  staleTime: 30 * 1000,      // 30 seconds
  gcTime: 5 * 60 * 1000,     // 5 minutes
  retry: 3,                   // 3 retries with exponential backoff
  refetchOnWindowFocus: true, // Auto-refetch on focus
  refetchOnReconnect: true,   // Auto-refetch on network reconnect
}
```

### Query Keys Structure

```typescript
QUERY_KEYS = {
  all: ["content"],
  lists: () => ["content", "list"],
  list: (filters) => ["content", "list", filters],
  details: () => ["content", "detail"],
  detail: (id) => ["content", "detail", id],
  byChannel: (channelId) => ["content", "channel", channelId],
  byType: (type) => ["content", "type", type],
  stats: () => ["content", "stats"],
  search: (query) => ["content", "search", query],
};
```

### Server State Patterns

1. **Optimistic Updates**: UI updates immediately, server sync in background
2. **Stale-While-Revalidate**: Show cached data while fetching fresh data
3. **Background Refetch**: Keep data fresh without user interaction
4. **Prefetching**: Anticipate user navigation for instant loading

## 3. Local State (Component/Context)

### Component State

- **Form inputs**: Controlled components with local state
- **UI interactions**: Modals, dropdowns, tooltips
- **Animation state**: Framer Motion variants and controls
- **Viewport state**: Responsive breakpoints, scroll position

### Context Providers

1. **Theme Context**: Light/dark mode switching
2. **User Preferences**: Saved settings and preferences
3. **Localization**: Language and formatting preferences
4. **Error Boundary**: Graceful error handling

## 4. Real-Time State (WebSocket Integration)

### WebSocket Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │────▶│   WebSocket     │────▶│   Frontend      │
│   (Express)     │    │   Server        │    │   Client        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Message       │    │   Zustand       │
│   Watcher       │    │   Broker        │    │   Stores        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Message Types

- **CONTENT_ADDED**: New content generated
- **CONTENT_UPDATED**: Existing content modified
- **CONTENT_DELETED**: Content removed
- **CONNECTION_STATUS**: Connection state changes
- **PING/PONG**: Heartbeat monitoring

### State Synchronization Strategy

1. **Server-Sent Events**: Primary real-time channel
2. **WebSocket Fallback**: Automatic fallback for compatibility
3. **Message Queue**: Store messages during disconnection
4. **Conflict Resolution**: Last-write-wins with timestamp comparison

## 5. State Update Patterns

### Immutable Update Patterns

```typescript
// Shallow merge (most common)
const newState = { ...state, [id]: { ...state[id], ...updates } };

// Deep merge (for nested objects)
const newState = { ...state, nested: { ...state.nested, ...nestedUpdates } };

// Array operations
const newItems = [...state.items, newItem]; // Add
const newItems = state.items.filter((item) => item.id !== id); // Remove
const newItems = state.items.map(
  (
    item, // Update
  ) => (item.id === id ? { ...item, ...updates } : item),
);
```

### Subscription Patterns

```typescript
// Store subscription
const unsubscribe = contentStore.subscribe(
  (state) => state.items,
  (items, prevItems) => {
    // Handle items change
  },
);

// Selector with equality function
const items = useContentStore(
  (state) => state.items,
  (a, b) => isEqual(a, b),
);
```

### Batch Updates

```typescript
// React 18 automatic batching
setState1(value1);
setState2(value2); // Both updates in single render

// Zustand batch updates
store.setState(
  {
    items: newItems,
    stats: newStats,
    lastSyncedAt: Date.now(),
  },
  true,
); // Replace state instead of merge
```

## 6. WebSocket Integration Optimization

### Connection Management

```typescript
class WebSocketClient {
  private reconnectAttempt = 0;
  private maxRetries = 10;
  private baseDelay = 1000;
  private maxDelay = 30000;

  private scheduleReconnect() {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempt),
      this.maxDelay,
    );
    setTimeout(() => this.connect(), delay);
  }
}
```

### Message Processing Pipeline

1. **Receive**: WebSocket message arrives
2. **Validate**: Check message structure and authenticity
3. **Transform**: Convert to application state format
4. **Update**: Apply to Zustand store
5. **Notify**: Trigger React Query invalidation
6. **Queue**: Store for offline replay if needed

### State Consistency

- **Idempotent Updates**: Same message processed multiple times yields same state
- **Order Preservation**: Messages processed in arrival order
- **Conflict Resolution**: Latest timestamp wins for same entity
- **Rollback Support**: Optimistic updates can be reverted

## 7. DevTools Integration

### Zustand DevTools

```typescript
const useContentStore = create<ContentState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Store implementation
    })),
    { name: "content-store" },
  ),
);
```

### React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// In root component
<ReactQueryDevtools initialIsOpen={false} />
```

### Browser Extension Integration

```typescript
// Redux DevTools extension compatibility
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  window.__REDUX_DEVTOOLS_EXTENSION__.connect({
    name: "DevPrep State",
    features: {
      pause: true,
      lock: true,
      persist: false,
      export: true,
      import: "custom",
      jump: true,
      skip: false,
      reorder: false,
      dispatch: true,
      test: false,
    },
  });
}
```

## 8. Performance Optimizations

### Selective Subscriptions

```typescript
// Only re-render when specific items change
const item = useContentStore((state) => state.items[id]);

// Use shallow equality for arrays/objects
const items = useContentStore((state) => Object.values(state.items), shallow);
```

### Memoization

```typescript
const filteredItems = useMemo(() => {
  return items.filter((item) => {
    // Filter logic
  });
}, [items, filters]);
```

### Virtualization

```typescript
// For large lists
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
});
```

## 9. Error Handling

### State-Level Error Boundaries

```typescript
// Error boundary component
class StateErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    errorReporting.captureException(error, { extra: errorInfo });
  }
}
```

### Retry Strategies

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ClientError) return false;
        // Retry up to 3 times
        return failureCount < 3;
      },
    },
  },
});
```

## 10. Testing Strategies

### Store Testing

```typescript
// Test store actions
test("addItem adds item to store", () => {
  const { result } = renderHook(() => useContentStore());

  act(() => {
    result.current.addItem(mockItem);
  });

  expect(result.current.items[mockItem.id]).toEqual(mockItem);
});
```

### Hook Testing

```typescript
// Test custom hooks
test("useContent returns filtered items", () => {
  const { result } = renderHook(() => useContent({ channelId: "test" }));

  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0].channelId).toBe("test");
});
```

### Integration Testing

```typescript
// Test WebSocket integration
test("WebSocket updates store", async () => {
  const ws = new MockWebSocket();
  ws.simulateMessage(contentAddedMessage);

  await waitFor(() => {
    expect(store.items[newItemId]).toBeDefined();
  });
});
```

## 11. Migration Guide

### From Local State to Global State

1. Identify shared state across components
2. Create appropriate Zustand store
3. Replace useState with store selector
4. Add optimistic updates if needed

### From Redux to Zustand

1. Replace createStore with create
2. Convert reducers to actions
3. Update selector syntax
4. Remove thunk middleware

### From React Query to Zustand

1. Move non-server state to Zustand
2. Keep server cache in React Query
3. Use store for offline-first data
4. Sync between layers as needed

## 12. Best Practices

### Do's

- ✅ Use TypeScript for type safety
- ✅ Keep stores small and focused
- ✅ Use selectors to prevent unnecessary re-renders
- ✅ Implement proper loading and error states
- ✅ Use optimistic updates for better UX
- ✅ Clean up subscriptions on unmount

### Don'ts

- ❌ Don't store derived data in state
- ❌ Don't mutate state directly
- ❌ Don't store non-serializable values
- ❌ Don't over-fetch data
- ❌ Don't ignore cleanup functions

## Conclusion

This state architecture provides a solid foundation for building a performant, maintainable, and scalable application. By following these patterns and principles, we ensure that state management remains predictable, testable, and developer-friendly.

---

**Next Steps:**

1. Review existing stores for compliance
2. Implement missing DevTools integration
3. Add comprehensive testing
4. Create performance benchmarks
5. Document component patterns
