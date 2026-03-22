# Network Performance Optimization

## Overview

This document describes the caching strategy implemented to reduce API calls by 80%+ after initial load, enable offline support, and provide a seamless user experience.

## Caching Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Caching Layers                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐   │
│  │  Memory Cache │────▶│ localStorage │────▶│  Service Worker Cache    │   │
│  │  (L1 - fastest)│     │  (L2 - persistent)│  (L3 - offline-first)    │   │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘   │
│         │                    │                         │                     │
│         ▼                    ▼                         ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      React Query (Orchestrator)                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    Express API Server (Port 3001)                       ││
│  │                         ┌────────────────┐                               ││
│  │                         │  Redis Cache   │ (when available)              ││
│  │                         └────────────────┘                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     SQLite Database                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Cache Manager (`src/lib/api-cache.ts`)

### Features

1. **Multi-layer caching**: Memory → localStorage → Service Worker
2. **Stale-while-revalidate**: Shows cached data while fetching fresh data in background
3. **Request deduplication**: Prevents multiple concurrent requests for same endpoint
4. **Cache metrics tracking**: Hits, misses, stale hits, storage size
5. **Automatic eviction**: LRU eviction when cache exceeds max size
6. **Background refetch**: Uses `requestIdleCallback` for non-blocking updates

### Configuration

```typescript
const apiCache = new CacheManager<unknown>({
  storageKey: 'devprep:api-cache-v2',
  ttl: 5 * 60 * 1000, // 5 minutes - data is considered fresh
  staleWhileRevalidate: 2 * 60 * 1000, // 2 minutes - show stale, revalidate in background
  maxSize: 50, // Maximum entries in memory cache
})
```

## React Query Configuration (`src/lib/queryClient.ts`)

### Optimized Settings

| Setting                | Value                | Rationale                                   |
| ---------------------- | -------------------- | ------------------------------------------- |
| `staleTime`            | 5 minutes            | Reduce refetch frequency for stable content |
| `gcTime`               | 30 minutes           | Keep unused queries in cache longer         |
| `retry`                | 1                    | Single retry sufficient with cache fallback |
| `retryDelay`           | Exponential, max 10s | Fast recovery without excessive retries     |
| `refetchOnWindowFocus` | false                | Let SWR handle staleness                    |
| `refetchOnReconnect`   | true                 | Refresh when network restored               |
| `refetchOnMount`       | false                | Only fetch when data is stale               |

### Query Keys

```typescript
QUERY_KEYS = {
  all: ['content'],
  byChannel: channelId => ['content', 'channel', channelId],
  byType: type => ['content', 'type', type],
  stats: () => ['content', 'stats'],
  search: query => ['content', 'search', query],
}
```

## Prefetching Strategy (`src/hooks/usePrefetch.ts`)

### Idle-time Prefetching

- Uses `requestIdleCallback` to prefetch during browser idle time
- Prefetches adjacent channels for quick navigation
- Prefetches all content types for current channel
- Prefetches stats on app start

### Prefetch Triggers

1. **On route change**: Prefetch all content types for new channel
2. **On hover**: Prefetch content when user hovers over navigation items
3. **On idle**: Background prefetch of likely next pages
4. **On start**: Warm cache with critical data

### Configuration

```typescript
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  prefetchDelay: 100, // ms after interaction before prefetch
  maxPrefetchItems: 5, // Max concurrent prefetch requests
}
```

## Offline Support (`src/hooks/useOfflineSupport.ts`)

### Features

1. **Network detection**: Monitors `online`/`offline` events
2. **Offline queue**: Stores pending mutations for later sync
3. **Content caching**: Caches viewed content in localStorage
4. **Optimistic updates**: Updates UI immediately, syncs in background
5. **Retry logic**: Automatic retry with exponential backoff

### Cache-First Strategy

```typescript
function useCacheFirstStrategy<T>(contentType: string, fetcher: () => Promise<T>) {
  // 1. Return cached data immediately
  // 2. Fetch fresh data in background
  // 3. Update UI when fresh data arrives
  // 4. Fallback to cache when offline
}
```

### Offline Queue

```typescript
interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  data?: unknown
  timestamp: number
  retries: number // Max 3 retries
}
```

## Service Worker Strategy (`vite.config.ts`)

### Runtime Caching

| Pattern      | Strategy     | Max Entries | Max Age  | Rationale               |
| ------------ | ------------ | ----------- | -------- | ----------------------- |
| Google Fonts | CacheFirst   | 10          | 1 year   | Static, rarely change   |
| Font Files   | CacheFirst   | 10          | 1 year   | Static assets           |
| API Calls    | NetworkFirst | 50          | 24 hours | Dynamic, prefer network |
| Images       | CacheFirst   | 100         | 30 days  | Static assets           |

### API Cache Strategy

```javascript
{
  urlPattern: /\/api\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24, // 24 hours
    },
    networkTimeoutSeconds: 10,
  }
}
```

## Expected Improvements

### API Call Reduction

| Scenario                 | Before    | After     | Reduction |
| ------------------------ | --------- | --------- | --------- |
| Initial load             | 10+ calls | 1-2 calls | 80-90%    |
| Channel switch           | 5 calls   | 0-1 calls | 80%+      |
| Content type switch      | 1 call    | 0 calls   | 100%      |
| Tab return (within 5min) | 5+ calls  | 0 calls   | 100%      |
| Tab return (after 5min)  | 5+ calls  | 1 call    | 80%       |

### Cache Hit Rates

| Metric                 | Target | Measurement                     |
| ---------------------- | ------ | ------------------------------- |
| Memory cache hits      | 60%    | `apiCache.getMetrics().hits`    |
| localStorage hits      | 25%    | localStorage access patterns    |
| Service Worker hits    | 15%    | Network tab for cached requests |
| Stale while revalidate | 10%    | Background refetches            |

### Performance Metrics

| Metric                   | Target  | Current |
| ------------------------ | ------- | ------- |
| Time to Interactive      | < 2s    | ~3s     |
| First Contentful Paint   | < 1s    | ~1.5s   |
| Largest Contentful Paint | < 2.5s  | ~3s     |
| API response (cached)    | < 50ms  | N/A     |
| API response (network)   | < 200ms | ~100ms  |

## Cache Invalidation Strategy

### Server-Side

1. **Database watcher**: Monitors SQLite for changes
2. **Redis invalidation**: Clears Redis cache on DB changes
3. **WebSocket broadcasts**: Notifies clients of updates
4. **ETag/Last-Modified**: Conditional requests for fresh data

### Client-Side

1. **Time-based**: Automatic invalidation after TTL
2. **Event-based**: Invalidate on WebSocket `db_updated` event
3. **Manual**: User-triggered refresh clears all caches
4. **Mutation-based**: Invalidate related queries on mutations

### Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ DB Change   │────▶│ Redis Invalidate│────▶│ SW Cache Clear   │
└──────────────┘     └─────────────────┘     └──────────────────┘
                            │                         │
                            ▼                         ▼
                     ┌─────────────────┐     ┌──────────────────┐
                     │ WebSocket Emit  │────▶│ React Query      │
                     │ db_updated      │     │ Invalidate       │
                     └─────────────────┘     └──────────────────┘
```

## Usage Examples

### Basic Content Fetch

```typescript
import { useContent, useChannelContent, QUERY_KEYS } from '@/hooks/useContentQueries'

// Fetch all content with caching
const { data, isLoading, error } = useContent({
  channelId: 'devops',
  useCache: true,
})

// Fetch channel-specific content
const { data: questions } = useChannelContent('devops', {
  contentType: 'question',
  useCache: true,
})
```

### Prefetching

```typescript
import { usePrefetch } from '@/hooks/usePrefetch'

function Navigation() {
  const { prefetchChannelContent, warmCacheOnStart } = usePrefetch()

  useEffect(() => {
    warmCacheOnStart('devops')
  }, [])

  return (
    <button onMouseEnter={() => prefetchChannelContent('devops')}>
      Hover me
    </button>
  )
}
```

### Offline Support

```typescript
import { useCacheFirstStrategy, useOfflineIndicator } from '@/hooks/useOfflineSupport'

function Content() {
  const { data, isLoading, isFromCache } = useCacheFirstStrategy(
    'question',
    () => fetchQuestions()
  )

  const { isOnline, pendingSync } = useOfflineIndicator()

  return (
    <div>
      {isFromCache && <span>Showing cached content</span>}
      {!isOnline && <span>You are offline</span>}
    </div>
  )
}
```

## Monitoring & Debugging

### Cache Metrics

```typescript
import { apiCache } from '@/lib/api-cache'

const metrics = apiCache.getMetrics()
console.log('Hits:', metrics.hits)
console.log('Misses:', metrics.misses)
console.log('Stale Hits:', metrics.staleHits)
```

### React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

## Best Practices

1. **Always use caching hooks** instead of raw fetch
2. **Prefetch on hover** for instant navigation
3. **Use stale-while-revalidate** for non-critical content
4. **Cache mutations locally** for offline support
5. **Monitor cache metrics** in production
6. **Set appropriate TTLs** based on data volatility
7. **Invalidate on mutations** to maintain consistency

## Future Enhancements

- [ ] Predictive prefetching using ML
- [ ] Background sync with Workbox
- [ ] IndexedDB for large content storage
- [ ] Cache partitioning by user/tenant
- [ ] Progressive cache warming based on user behavior
