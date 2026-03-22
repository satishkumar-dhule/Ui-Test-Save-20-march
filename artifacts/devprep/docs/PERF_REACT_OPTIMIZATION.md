# React Performance Optimization Guide

## Overview

This document outlines the performance optimizations applied to the DevPrep React application to achieve:

- **First Contentful Paint < 1.5s**
- **Time to Interactive < 3s**
- **No unnecessary re-renders in critical path**

## Changes Made

### 1. App.tsx Optimizations

#### Memoized Components

```tsx
const SidebarMemo = memo(Sidebar)
const TopBarMemo = memo(TopBar)
const ChannelBrowserMemo = memo(ChannelBrowser)
const SearchModalWrapperMemo = memo(SearchModalWrapper)
```

**Impact**: Prevents re-renders of child components when parent re-renders unless their props actually change.

#### Stable Function References

All callback functions now use `useCallback` with proper dependency arrays:

```tsx
const handleSwitchChannel = useCallback((id: string) => switchChannel(id), [switchChannel])
```

**Impact**: Prevents creating new function instances on every render, reducing child component re-renders.

#### Memoized Computations

```tsx
const currentChannel = useMemo(
  () => allChannels.find(c => c.id === channelId) ?? allChannels[0],
  [allChannels, channelId]
)

const pinnedChannels = useMemo(() => {
  // expensive computation
}, [allChannels, selectedChannelIds])
```

**Impact**: Avoids recalculating derived values on every render.

#### Keyboard Event Handler Optimization

Moved the keyboard event handler into a `useCallback` to maintain a stable reference:

```tsx
const handleKeyDown = useCallback(
  (e: KeyboardEvent) => {
    // handler logic
  },
  [isSearchOpen, setShowChannelBrowser, closeMobileSidebar]
)
```

### 2. contentStore.ts Optimizations

#### Memoized Filtered Content

The `useFilteredContent` hook now uses `useMemo` to avoid recalculating filtered results:

```tsx
export const useFilteredContent = (tagFilter: string[] | undefined) => {
  const { mergedContent } = useContentStore()

  return useMemo(
    () => ({
      questions: createFilterByTags(mergedContent.questions, tagFilter),
      // ... other types
    }),
    [mergedContent, tagFilter]
  )
}
```

#### Memoized Section Counts

```tsx
export const useSectionCounts = (tagFilter: string[] | undefined) => {
  const filtered = useFilteredContent(tagFilter)
  return useMemo(
    () => ({
      qa: filtered.questions.length,
      // ... other counts
    }),
    [filtered]
  )
}
```

**Impact**: Reduces unnecessary recalculations when store state changes.

### 3. New Performance Utilities

Created `src/utils/perf-utils.ts` with:

#### useDebounce

```tsx
const { value: debouncedSearch, isPending } = useDebounce(searchQuery, 300)
```

#### useThrottle

```tsx
const throttledValue = useThrottle(value, 100)
```

#### useMemoCompare

```tsx
const memoizedValue = useMemoCompare(
  value,
  (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
)
```

#### useStableMemo

```tsx
const expensiveResult = useStableMemo(() => expensiveCalculation(a, b), [a, b])
```

### 4. Virtual List Component

Created `src/components/ui/virtual-list.tsx` for efficient rendering of long lists:

```tsx
<VirtualList items={longArray} height={400} itemHeight={50} overscan={3}>
  {(item, index) => <ListItem item={item} index={index} />}
</VirtualList>
```

**Impact**: Renders only visible items + overscan, critical for 100+ item lists.

### 5. Optimized Content Hook (React Query)

Created `src/hooks/useOptimizedContent.ts` replacing manual caching with React Query:

```tsx
const { generated, loading, error, refresh, prefetch } = useOptimizedContent({
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  prefetchOnMount: true,
})
```

**Benefits**:

- Built-in caching with configurable TTL
- Automatic deduplication of requests
- Background refetching
- Prefetching support
- Infinite query support for pagination

## Best Practices

### 1. Component Memoization

```tsx
// Good: Memoize expensive components
const ExpensiveChart = memo(LazyChart)

// Good: Use React.memo with custom comparator
const ListItem = memo(
  ListItemComponent,
  (prev, next) => prev.item.id === next.item.id && prev.selected === next.selected
)
```

### 2. Stable Callbacks

```tsx
// Good: Define callbacks outside or with useCallback
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// Avoid: Creating functions inline in JSX
<Button onClick={() => doSomething(id)} />
```

### 3. Selective State Updates

```tsx
// Good: Co-locate state with components that need it
const [localState, setLocalState] = useState()

// Avoid: Lifting all state to root
```

### 4. Virtualization for Long Lists

```tsx
// Good: Virtualize lists > 20 items
{
  items.length > 20 ? (
    <VirtualList items={items} height={400} itemHeight={50}>
      {item => <Item item={item} />}
    </VirtualList>
  ) : (
    items.map(item => <Item key={item.id} item={item} />)
  )
}
```

### 5. Code Splitting

```tsx
// Good: Lazy load route components
const QAPage = lazy(() => import('@/pages/QAPage'))

// Good: Lazy load below the fold components
const HeavyChart = lazy(() => import('@/components/HeavyChart'))
```

## Performance Metrics

| Metric                 | Target   | Optimization                     |
| ---------------------- | -------- | -------------------------------- |
| First Contentful Paint | < 1.5s   | Code splitting, lazy loading     |
| Time to Interactive    | < 3s     | Memoization, stable callbacks    |
| Bundle Size            | < 200KB  | Tree shaking, dynamic imports    |
| Re-render Count        | Minimize | React.memo, useMemo, useCallback |

## Debugging Re-renders

Use React DevTools Profiler:

1. Enable "Highlight updates" in settings
2. Interact with the app
3. Yellow/orange highlights indicate unnecessary re-renders

## Future Enhancements

1. **Transition to React Query**: Replace manual caching in `useGeneratedContent` with `useOptimizedContent`
2. **Selective Hydration**: For SSR apps, hydrate only visible content first
3. **Prefetch Routes**: Use `createLazyComponent` preload method for predicted navigation
4. **Service Worker**: Cache static assets for instant loads on repeat visits
