# DevPrep Redis Architecture

## Overview

This document describes the comprehensive Redis architecture implemented for the DevPrep project, covering caching, pub/sub messaging, streams, transactions, Lua scripts, rate limiting, and cluster support.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DevPrep Server                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │   Express   │───▶│    Redis    │───▶│   SQLite    │                │
│  │    API      │    │   Client    │    │  Database   │                │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                            │                                          │
│         ┌──────────────────┼──────────────────┐                       │
│         ▼                  ▼                  ▼                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │    Cache    │    │   Pub/Sub   │    │  Streams    │                │
│  │   Service   │    │   Service   │    │   Service   │                │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                            │                                          │
│         ┌──────────────────┼──────────────────┐                       │
│         ▼                  ▼                  ▼                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │ Transactions│    │Lua Scripts  │    │Rate Limiter │                │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Redis Server  │
                    │  (Single/Cluster)│
                    └─────────────────┘
```

## Core Components

### 1. Client (`client.ts`)

The foundation layer providing connection management with automatic reconnection.

**Features:**
- Lazy connection with automatic retry
- Exponential backoff retry strategy (max 3 retries)
- Connection state tracking (`connect`, `error`, `close`, `ready`)
- Graceful degradation when Redis is unavailable

**Usage:**
```typescript
import { initializeRedis, closeRedis, getRedisClient, isRedisAvailable } from './services/redis'

// Initialize on startup
await initializeRedis()

// Use throughout application
if (isRedisAvailable()) {
  const client = getRedisClient()
  await client.set('key', 'value')
}

// Cleanup on shutdown
await closeRedis()
```

### 2. Cache Service (`cache.ts`)

Cache-aside pattern implementation for API responses.

**Features:**
- Content caching with configurable TTL
- Channel-specific caching
- Tag-based caching for filtered content
- Statistics caching
- Pattern-based cache invalidation

**Key Prefixes:**
- `devprep:content:*` - General content
- `devprep:channel:*` - Channel-specific content
- `devprep:tagged:*` - Tag-filtered content
- `devprep:stats` - Statistics data

**Usage:**
```typescript
import { getCachedContent, setCachedContent } from './services/redis'

// Try cache first
const cached = await getCachedContent<ContentData>({ type: 'question' })
if (cached) {
  return cached
}

// Cache miss - fetch from DB
const data = await fetchFromDatabase()

// Store in cache
await setCachedContent({ type: 'question' }, data)
return data
```

### 3. Pub/Sub Patterns (`patterns/pub-sub.ts`)

Publisher/Subscriber for real-time event distribution.

**Features:**
- Channel-based message broadcasting
- Pattern-based subscriptions
- Separate subscriber client (doesn't block main operations)
- Automatic subscription management

**Channels:**
```typescript
import { publish, subscribe, CHANNELS } from './services/redis'

// Publisher
await publish(CHANNELS.CONTENT_UPDATED, {
  type: 'question',
  id: '123',
  action: 'created'
})

// Subscriber
await subscribe(CHANNELS.CONTENT_UPDATED, (message) => {
  console.log('Content updated:', message.message)
})
```

**Architecture:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Publisher  │────▶│    Redis    │────▶│ Subscriber  │
│   Client    │     │   Pub/Sub   │     │   Client    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 4. Redis Streams (`patterns/streams.ts`)

Event sourcing and message queue patterns.

**Features:**
- Event sourcing with stream IDs
- Consumer groups for distributed processing
- Message acknowledgment and retry
- Automatic stream trimming
- Pending message recovery

**Streams:**
```typescript
import { addToStream, readFromConsumerGroup, acknowledgeMessage, STREAMS } from './services/redis'

// Producer - Add event to stream
const messageId = await addToStream(STREAMS.CONTENT_EVENTS, {
  type: 'question',
  action: 'create',
  data: JSON.stringify({ ... })
})

// Consumer - Read from consumer group
const { messages } = await readFromConsumerGroup(
  STREAMS.CONTENT_EVENTS,
  'content-processors',
  'worker-1',
  10,
  5000 // block 5s
)

for (const msg of messages) {
  await processEvent(msg)
  await acknowledgeMessage(STREAMS.CONTENT_EVENTS, 'content-processors', msg.id!)
}
```

**Architecture:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Producer   │────▶│   Stream    │────▶│  Consumer   │
│             │     │             │     │    Group    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌──────────────────────────┘
                    ▼
              ┌─────────────┐
              │  Pending    │───▶ Auto-recovery
              │  Messages   │
              └─────────────┘
```

### 5. Transactions (`patterns/transactions.ts`)

Atomic operations and distributed locking.

**Features:**
- MULTI/EXEC transactions
- Watch-based optimistic locking
- Distributed locks with automatic expiry
- Atomic counters

**Usage:**
```typescript
import { executeTransaction, withLock, AtomicCounter } from './services/redis'

// Transaction
const result = await executeTransaction(async (tx) => {
  tx.incr('counter')
  tx.get('counter')
  tx.set('last_update', Date.now().toString())
})

// Distributed lock
const result = await withLock('resource-key', async () => {
  // Critical section
  return await processResource()
})

// Atomic counter
const counter = new AtomicCounter('daily-requests')
await counter.increment()
const count = await counter.get()
```

### 6. Lua Scripts (`patterns/lua-scripts.ts`)

Atomic operations with server-side execution.

**Features:**
- Script caching with SHA-based execution
- Automatic script reload on NOSCRIPT errors
- Pre-built scripts for common patterns

**Available Scripts:**
- `rate_limit_sliding` - Sliding window rate limiting
- `set_if_not_exists` - Atomic SETNX with TTL
- `increment_with_limit` - Bounded increment
- `safe_delete` - Token-verified deletion
- `batch_set_expire` - Bulk SET with expiration

**Usage:**
```typescript
import { executeScript, SCRIPTS } from './services/redis'

// Execute pre-built script
const result = await executeScript('rate_limit_sliding', [
  'rate:user:123',  // key
  60000,           // window (ms)
  100,             // limit
  Date.now()       // now
])

// Register custom script
registerScript('my_script', `
  local value = redis.call('GET', KEYS[1])
  return value or 'default'
`, 1)

const result = await executeScript('my_script', ['my-key'])
```

### 7. Rate Limiting (`patterns/rate-limiter.ts`)

Distributed rate limiting with multiple strategies.

**Strategies:**
- Fixed window
- Sliding window
- Token bucket

**Usage:**
```typescript
import { checkRateLimit, RateLimiter, RATE_LIMITS } from './services/redis'

// Simple rate limit check
const result = await checkRateLimit(
  'user-123',
  'api:content',
  RATE_LIMITS.API_CONTENT
)

if (!result.allowed) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    retryAfterMs: result.retryAfterMs
  })
}

// Class-based rate limiter
const limiter = new RateLimiter('api:generate', {
  windowMs: 60000,
  maxRequests: 10
}, 'sliding')

const result = await limiter.check('user-456')
```

### 8. Cluster Support (`cluster.ts`)

Redis Cluster for horizontal scaling.

**Features:**
- Automatic node discovery
- Read/write splitting
- Health monitoring
- Cluster-aware caching
- Resharding support

**Usage:**
```typescript
import { initializeCluster, getClusterHealth, ClusterAwareCache } from './services/redis'

// Initialize cluster
await initializeCluster({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
})

// Health check
const health = await getClusterHealth()
console.log(`Cluster health: ${health.healthy ? 'OK' : 'DEGRADED'}`)
console.log(`Nodes: ${health.connectedNodes}/${health.nodeCount}`)
console.log(`Hit rate: ${health.hitRate}%`)

// Cluster-aware cache
const cache = new ClusterAwareCache('app:')
await cache.set('key', data, 300)
const data = await cache.get('key')
```

## Connection Pooling

All connections use ioredis's built-in connection pooling:

```typescript
// Single client - automatically pools connections
const client = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Cluster - manages connections to all nodes
const cluster = new Redis.Cluster(nodes, options)
```

## Error Handling

All modules implement graceful degradation:

```typescript
// Cache operations silently fail if Redis unavailable
const cached = await getCachedContent(params)
if (!cached) {
  // Fall back to database
  return await fetchFromDB()
}

// Rate limiter allows requests if Redis unavailable
const result = await checkRateLimit(...)
if (!isRedisAvailable()) {
  result.allowed = true // Fail open for availability
}
```

## Retry Logic

Exponential backoff with jitter:

```typescript
retryStrategy: (times) => {
  const base = 200
  const max = 2000
  const delay = Math.min(times * base, max)
  const jitter = Math.random() * 100
  return delay + jitter
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis server host |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | - | Redis password |
| `REDIS_DB` | `0` | Redis database number |
| `CACHE_TTL` | `300` | Default cache TTL (seconds) |
| `REDIS_CLUSTER_STARTUP_NODES` | `localhost:7000` | Cluster seed nodes |

## Performance Considerations

1. **Lazy Connections**: Connections are established on demand
2. **Pipeline Commands**: Use `executeBatch` for bulk operations
3. **Script Caching**: Lua scripts are cached after first load
4. **Cluster Read Scaling**: Use `scaleReads: 'master'` for read-heavy workloads
5. **Stream Trimming**: Enable with `trimStream()` for bounded storage

## Monitoring

```typescript
// Connection status
import { isRedisAvailable } from './services/redis'

if (!isRedisAvailable()) {
  metrics.increment('redis.unavailable')
}

// Cluster health
const health = await getClusterHealth()
metrics.gauge('redis.cluster.nodes', health.connectedNodes)
metrics.gauge('redis.cluster.hit_rate', health.hitRate)
```

## File Structure

```
server/src/services/redis/
├── client.ts              # Core Redis client
├── cache.ts               # Cache-aside implementation
├── cluster.ts             # Redis Cluster support
├── index.ts               # Main exports
└── patterns/
    ├── pub-sub.ts         # Publisher/Subscriber
    ├── streams.ts         # Redis Streams
    ├── transactions.ts     # MULTI/EXEC & locks
    ├── lua-scripts.ts     # Lua script management
    └── rate-limiter.ts    # Distributed rate limiting
```

## Type Exports

```typescript
import type {
  // Cache
  CacheData,
  
  // Pub/Sub
  PubSubMessage,
  PubSubHandler,
  
  // Streams
  StreamEvent,
  StreamReadResult,
  
  // Transactions
  TransactionResult,
  PipelineCommand,
  
  // Rate Limiting
  RateLimitConfig,
  RateLimitResult,
  
  // Cluster
  ClusterHealth,
  ClusterConfig,
  
  // Lua Scripts
  LuaScript,
  ScriptResult,
} from './services/redis'
```

---

_Last Updated: 2026-03-22_
