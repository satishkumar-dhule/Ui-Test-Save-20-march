# Cache Strategies Documentation

## Overview

This document describes the advanced caching utilities implemented for the DevPrep project, including multi-level caching, serializers, bloom filters, and distributed counters.

## Table of Contents

1. [Multi-Level Cache (cache-advanced.ts)](#multi-level-cache)
2. [Serializers](#serializers)
3. [Bloom Filters](#bloom-filters)
4. [Distributed Counters](#distributed-counters)
5. [Usage Examples](#usage-examples)
6. [Performance Considerations](#performance-considerations)

---

## Multi-Level Cache

### Architecture

The multi-level cache implements a two-tier caching strategy:

```
┌─────────────────────┐
│   L1 (Memory Cache)  │  ← Fast, in-process, LRU eviction
│   Max 100 items      │
│   5 second TTL       │
└──────────┬──────────┘
           │ miss
           ▼
┌─────────────────────┐
│   L2 (Redis Cache)  │  ← Distributed, persistent
│   Configurable TTL  │
└─────────────────────┘
```

### Key Classes

#### `MultiLevelCache<T>`

Main cache class supporting multiple strategies.

**Constructor Options:**
```typescript
interface MultiLevelCacheOptions {
  l1MaxSize?: number      // L1 cache max items (default: 100)
  l1TtlMs?: number        // L1 TTL in milliseconds (default: 5000)
  l2Ttl?: number          // L2 TTL in seconds (default: 300)
  strategy?: CacheStrategy // 'cache-aside' | 'write-through' | 'write-behind'
  writeMode?: WriteMode   // 'sync' | 'async'
  compressThreshold?: number // Bytes before compression (default: 1024)
}
```

**Methods:**
- `get(key: string): Promise<T | null>` - Retrieve from cache
- `set(key: string, data: T, options?: { ttl?, tags?, version? }): Promise<void>`
- `invalidate(key: string): Promise<void>`
- `invalidateByTags(tags: string[]): Promise<void>`
- `invalidateByPattern(pattern: string): Promise<void>`
- `getMetrics(): CacheMetrics` - Get hit/miss statistics

#### `L1MemoryCache<T>`

In-process LRU cache for L1 caching.

**Features:**
- LRU (Least Recently Used) eviction
- Per-item TTL support
- Tag-based invalidation
- Version tracking

#### `VersionedCache<T>`

Cache with automatic version-based invalidation.

**Usage:**
```typescript
const cache = new VersionedCache({
  namespace: 'content',
  currentVersion: 1,
  onVersionMismatch: (key, oldV, newV) => {
    console.log(`Cache invalidated for ${key}: ${oldV} -> ${newV}`);
  }
});
```

### Cache Strategies

#### 1. Cache-Aside (Default)
- Read: Check L1 → Check L2 → Load from source
- Write: Update source → Invalidate cache

#### 2. Write-Through
- Write: Update source → Write to both L1 and L2 synchronously
- Guarantees consistency

#### 3. Write-Behind
- Write: Update source → Queue write to L2
- Best write performance, eventual consistency

### Cache Warming

Pre-populate cache with critical data:

```typescript
await warmCache({
  keys: [
    { key: 'popular-content', loader: fetchPopularContent },
    { key: 'user-stats', loader: fetchUserStats },
  ],
  parallel: true,
  staggerMs: 100,
  ttl: 300,
});
```

---

## Serializers

### Compression Support

The serializer supports automatic compression for large payloads:

```typescript
// Serialize with compression (threshold: 1024 bytes)
const serialized = await serializeWithCompression(data, {
  threshold: 512,
  level: 6, // 1-9, higher = better compression, slower
});

// Deserialize
const data = await deserializeWithCompression(serialized);
```

### Schema Validation

Using Zod for runtime validation:

```typescript
const ContentSchema = z.object({
  id: z.string(),
  type: z.enum(['question', 'flashcard', 'exam', 'voice', 'coding']),
  channelId: z.string(),
  data: z.unknown(),
  tags: z.array(z.string()).optional(),
});

// Create validator
const validator = createSchemaValidator(ContentSchema);
const result = validator.validate(data);

if (result.valid) {
  console.log(result.data);
} else {
  console.log(result.errors);
}
```

### Cached Serializer

Combines compression + validation:

```typescript
const serializer = createCachedSerializer(ContentSchema, {
  schemaVersion: 'v1',
  compression: true,
  compressionOptions: { threshold: 512 },
  strict: false,
});

// Serialize and validate
const { valid, serialized } = await serializer.serializeAndValidate(data);

// Deserialize with validation
const data = await serializer.deserialize(serialized);
```

### Pre-built Serializers

```typescript
import { ContentSerializer, ChannelSerializer, StatsSerializer } from './serializers';

const contentData = await ContentSerializer.deserialize(cachedContent);
const serialized = await ContentSerializer.serialize(contentData);
```

---

## Bloom Filters

### Overview

Bloom filters provide O(1) probabilistic membership testing with configurable false positive rates.

### Types

#### `BloomFilter`

Standard bloom filter with fixed capacity.

```typescript
const filter = new BloomFilter({
  name: 'content-existence',
  expectedElements: 10000,
  falsePositiveRate: 0.001, // 0.1%
});

// Add items
await filter.add('content-123');
await filter.addMany(['content-1', 'content-2', 'content-3']);

// Check membership (may have false positives, never false negatives)
const exists = await filter.mightContain('content-123');

// Get statistics
const stats = await filter.getStats();
console.log(stats.insertedElements, stats.falsePositiveRate);
```

#### `ScalableBloomFilter`

Automatically scales as elements increase.

```typescript
const filter = new ScalableBloomFilter({
  name: 'user-activity',
  initialCapacity: 1000,
  errorRate: 0.01,
  scaleThreshold: 0.8, // Add new filter at 80% capacity
});
```

#### `CountingBloomFilter`

Supports removal of elements with counter arrays.

```typescript
const filter = new CountingBloomFilter({
  name: 'rate-limiting',
  expectedElements: 5000,
});

// Add
await filter.add('user-123');
await filter.add('user-123'); // Count = 2

// Check
const count = await filter.getCount('user-123'); // Returns 2

// Remove
await filter.remove('user-123');
```

### Use Cases

1. **Content Deduplication**: Check if content exists before expensive DB queries
2. **User Activity**: Track unique users without storing IDs
3. **Rate Limiting**: Quick check if user has exceeded limits
4. **Cache Pre-warming**: Identify popular content

---

## Distributed Counters

### Types

#### `DistributedCounter`

Atomic counter with bounds and step support.

```typescript
const counter = new DistributedCounter({
  name: 'api-requests',
  initialValue: 0,
  min: 0,
  max: 10000,
  step: 1,
});

// Get current value
const value = await counter.get();

// Atomic increment/decrement
await counter.increment();
await counter.increment(5);
await counter.decrement();

// Set value
await counter.set(100);

// Reset
await counter.reset();
```

#### `SlidingWindowRateLimiter`

Rate limiting using sorted sets.

```typescript
const limiter = new SlidingWindowRateLimiter({
  windowMs: 60000,      // 1 minute window
  maxRequests: 100,     // Max 100 requests
  keyPrefix: 'api',      // Redis key prefix
});

// Check limit
const result = await limiter.checkLimit('user-123');
if (!result.allowed) {
  console.log(`Retry after ${result.retryAfterMs}ms`);
}

// Get current usage
const usage = await limiter.getUsage('user-123');

// Reset limit
await limiter.resetLimit('user-123');
```

#### `TokenBucketRateLimiter`

Smooth rate limiting with token refill.

```typescript
const limiter = new TokenBucketRateLimiter({
  maxTokens: 100,
  refillRatePerSecond: 10,
  tokensPerRequest: 1,
});

// Consume tokens
const result = await limiter.consume('user-123');
if (!result.allowed) {
  console.log(`Retry after ${result.retryAfterMs}ms`);
}
```

#### `HitCounter`

Simple increment counter with TTL.

```typescript
const counter = new HitCounter('page-views', 3600); // 1 hour window

await counter.hit('page-home');
const { count, ttl } = await counter.getHitsWithTTL('page-home');
```

#### `SlidingWindowCounter`

Multi-bucket sliding window counter.

```typescript
const counter = new SlidingWindowCounter(60, 6); // 60s window, 6 buckets

await counter.increment('api-calls');
const count = await counter.getCount('api-calls');
```

---

## Usage Examples

### API Response Caching

```typescript
import { MultiLevelCache } from './services/redis/cache-advanced';
import { ContentSerializer } from './services/redis/serializers';

const cache = new MultiLevelCache({
  strategy: 'write-through',
  l1TtlMs: 10000,
});

app.get('/api/content/:id', async (req, res) => {
  const { id } = req.params;
  
  // Try cache
  const cached = await cache.get(`content:${id}`);
  if (cached) {
    return res.json(cached);
  }
  
  // Load from DB
  const content = await db.getContent(id);
  
  // Validate and cache
  const validated = await ContentSerializer.deserialize(JSON.stringify(content));
  if (validated) {
    await cache.set(`content:${id}`, validated);
  }
  
  res.json(content);
});
```

### Rate Limiting Middleware

```typescript
import { ApiRateLimiter } from './services/redis/counter';

app.use(async (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const result = await ApiRateLimiter.checkLimit(userId);
  
  res.set({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  });
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfterMs: result.retryAfterMs,
    });
  }
  
  next();
});
```

### Content Existence Check

```typescript
import { ContentExistenceFilter } from './services/redis/bloom-filter';

async function createContent(data: CreateContentInput) {
  const contentId = generateId();
  
  // Quick existence check (before expensive operations)
  const mightExist = await ContentExistenceFilter.mightContain(contentId);
  if (mightExist) {
    // Double-check in DB (bloom filters can have false positives)
    const exists = await db.contentExists(contentId);
    if (exists) {
      throw new Error('Content already exists');
    }
  }
  
  await db.createContent({ id: contentId, ...data });
  await ContentExistenceFilter.add(contentId);
  
  return contentId;
}
```

### Cache Warming on Startup

```typescript
import { warmCache } from './services/redis/cache-advanced';

async function startup() {
  console.log('Warming cache...');
  
  await warmCache({
    keys: [
      { key: 'channels', loader: () => db.getAllChannels() },
      { key: 'stats', loader: () => db.getStats() },
      { key: 'popular:questions', loader: () => db.getPopularQuestions() },
      { key: 'popular:flashcards', loader: () => db.getPopularFlashcards() },
    ],
    parallel: true,
    staggerMs: 50,
    ttl: 300,
  });
  
  console.log('Cache warmed successfully');
}
```

---

## Performance Considerations

### Cache Tuning

| Scenario | L1 Size | L1 TTL | L2 TTL | Strategy |
|----------|---------|--------|--------|----------|
| High read | 200 | 10s | 5min | write-through |
| High write | 50 | 1s | 1min | write-behind |
| Balanced | 100 | 5s | 5min | cache-aside |
| Real-time | 500 | 30s | 1hour | write-through |

### Serialization

- **Threshold**: 512-1024 bytes for compression
- **Level**: 6 (balanced speed/compression)
- **Small data**: Skip compression (faster)

### Bloom Filter Tuning

| Expected Elements | FPR | Memory |
|------------------|-----|--------|
| 1,000 | 1% | ~1.2 KB |
| 10,000 | 1% | ~12 KB |
| 100,000 | 1% | ~119 KB |
| 1,000,000 | 1% | ~1.2 MB |

### Rate Limiting

| Window | Max Requests | Use Case |
|--------|-------------|----------|
| 1 minute | 100 | Standard API |
| 1 hour | 1000 | Bulk operations |
| 1 day | 10000 | User quotas |

---

## Error Handling

All cache operations are fail-safe:

```typescript
// Redis unavailable? Operations gracefully degrade
const cached = await cache.get('key'); // Returns null
await cache.set('key', data);           // Silent failure
```

Monitor cache health:

```typescript
const metrics = cache.getMetrics();
console.log({
  l1HitRate: metrics.l1HitRate,
  l2HitRate: metrics.l2HitRate,
  writes: metrics.writes,
  invalidations: metrics.invalidations,
});
```

---

## Dependencies

```json
{
  "dependencies": {
    "ioredis": "^5.0.0",
    "zod": "^3.22.0"
  }
}
```

---

## File Structure

```
server/src/services/redis/
├── client.ts           # Redis connection management
├── cache.ts            # Basic cache functions
├── cache-advanced.ts   # Multi-level cache, versioning, warming
├── serializers.ts      # Compression, validation, schemas
├── bloom-filter.ts     # Bloom filter implementations
└── counter.ts          # Distributed counters, rate limiting
```
