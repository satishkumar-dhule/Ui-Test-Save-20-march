# DevPrep Redis SDK Documentation

A comprehensive, developer-friendly Redis SDK for the DevPrep project with connection management, type-safe commands, hooks, reactive streaming, and caching decorators.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Connection Management](#connection-management)
3. [Type-Safe Commands](#type-safe-commands)
4. [Fluent API](#fluent-api)
5. [Pipeline & Batching](#pipeline--batching)
6. [Hooks System](#hooks-system)
7. [Reactive/Event System](#reactiveevent-system)
8. [Decorators](#decorators)
9. [Examples](#examples)

---

## Quick Start

### Installation

The SDK is already part of the DevPrep project at `artifacts/devprep/server/src/services/redis/sdk/`.

### Basic Usage

```typescript
import { createSDK, getSDK } from './services/redis/sdk/index.js'

// Initialize the SDK
const sdk = await createSDK({
  connection: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
  hooks: {
    enabled: true,
    logLevel: 'info',
  },
})

// Use the fluent API
await sdk.fluentApi.strings.set('user:1', { name: 'John', email: 'john@example.com' })
const user = await sdk.fluentApi.strings.get<User>('user:1', true)

// Get health status
const health = await sdk.healthCheck()
console.log('Redis is healthy:', health.healthy)

// Cleanup
await sdk.destroy()
```

### Using Singleton Instance

```typescript
import { getSDK } from './services/redis/sdk/index.js'

const sdk = getSDK()
await sdk.fluentApi.strings.set('key', 'value')
```

---

## Connection Management

### ConnectionManager

The `ConnectionManager` handles Redis connections with automatic reconnection and connection pooling.

```typescript
import { createConnectionManager, getConnectionManager } from './services/redis/sdk/connection.js'

// Create with custom config
const manager = createConnectionManager(
  {
    host: 'redis.example.com',
    port: 6379,
    password: 'secret',
    db: 0,
    keyPrefix: 'devprep:',
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
  },
  {
    min: 1,
    max: 10,
    acquireTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }
)

// Connect
await manager.connect()

// Check status
console.log('Connected:', manager.isConnected())
console.log('Ready:', manager.isReady())
console.log('State:', manager.getState())

// Health check
const health = await manager.healthCheck()
console.log('Latency:', health.latency, 'ms')

// Reconnect
await manager.reconnect()

// Disconnect
await manager.disconnect()
```

### Events

The ConnectionManager emits events for monitoring:

```typescript
manager.on('connected', () => console.log('Connected!'))
manager.on('disconnected', () => console.log('Disconnected!'))
manager.on('error', (err) => console.error('Error:', err))
manager.on('reconnecting', () => console.log('Reconnecting...'))
manager.on('maxRetriesReached', () => console.log('Max retries reached'))
```

---

## Type-Safe Commands

### CommandsWrapper

The SDK provides type-safe wrappers for all common Redis commands.

```typescript
import { CommandsWrapper } from './services/redis/sdk/commands.js'

const commands = new CommandsWrapper()

// STRING COMMANDS
await commands.set('key', { name: 'John' }, { ttl: 3600 })
const data = await commands.get<{ name: string }>('key', true)
await commands.setNX('lock:1', 'locked')
await commands.setNXEX('lock:2', 'locked', 30)
await commands.mset({ a: 1, b: 2, c: 3 })
const values = await commands.mget(['a', 'b', 'c'])
await commands.incr('counter')
await commands.decr('counter')
await commands.incrByFloat('rate', 1.5)

// HASH COMMANDS
await commands.hset('user:1', 'name', 'John')
await commands.hmset('user:1', { name: 'John', email: 'john@example.com' })
const name = await commands.hget<string>('user:1', 'name')
const user = await commands.hgetall<{ name: string; email: string }>('user:1', true)
const exists = await commands.hexists('user:1', 'name')
await commands.hdel('user:1', 'email')
const count = await commands.hlen('user:1')

// LIST COMMANDS
await commands.rpush('queue', 'task1', 'task2')
await commands.lpush('queue', 'task0')
const task = await commands.rpop<string>('queue')
const tasks = await commands.lrange<string>('queue', 0, -1)
const len = await commands.llen('queue')

// SET COMMANDS
await commands.sadd('tags', 'javascript', 'typescript', 'redis')
const tags = await commands.smembers<string>('tags')
const hasTag = await commands.sismember('tags', 'typescript')
await commands.srem('tags', 'redis')
const tagCount = await commands.scard('tags')

// SORTED SET COMMANDS
await commands.zadd('leaderboard', 100, 'player1')
await commands.zadd('leaderboard', 200, 'player2')
await commands.zaddMultiple('leaderboard', [
  { score: 150, member: 'player3' },
  { score: 250, member: 'player4' },
])
const topPlayers = await commands.zrange<{ member: string; score: number }>('leaderboard', 0, 9, true)
const players = await commands.zrange<string>('leaderboard', 0, -1)
const score = await commands.zscore('leaderboard', 'player1')

// KEY COMMANDS
await commands.expire('key', 3600)
const ttl = await commands.ttl('key')
const type = await commands.type('key')
await commands.rename('oldKey', 'newKey')
const matchingKeys = await commands.scan('user:*')
await commands.del('key1', 'key2', 'key3')
const existsCount = await commands.exists('key1', 'key2')
```

---

## Fluent API

The FluentRedis class provides a chainable interface for accessing commands by category.

```typescript
import { FluentRedis } from './services/redis/sdk/commands.js'

const redis = new FluentRedis()

// String operations
redis.strings.set('key', 'value')
redis.strings.get('key')

// Hash operations
redis.hashes.hset('user:1', 'name', 'John')
redis.hashes.hgetall('user:1')

// List operations
redis.lists.rpush('queue', 'item')
redis.lists.lrange('queue', 0, -1)

// Set operations
redis.sets.sadd('tags', 'js', 'ts')
redis.sets.smembers('tags')

// Sorted set operations
redis.sortedSets.zadd('scores', 100, 'player1')
redis.sortedSets.zrange('scores', 0, -1, true)

// Key operations
redis.keys.del('key')
redis.keys.expire('key', 3600)

// Pipeline access
redis.pipeline.run((pipe) => {
  pipe.set('a', '1')
  pipe.get('a')
  pipe.incr('counter')
})
```

---

## Pipeline & Batching

### PipelineManager

Execute multiple commands efficiently using pipelines.

```typescript
import { PipelineManager } from './services/redis/sdk/commands.js'

const pipeline = new PipelineManager()

// Run multiple commands in a pipeline
const results = await pipeline.run((pipe) => {
  pipe.set('key1', 'value1')
  pipe.get('key1')
  pipe.hset('user:1', 'name', 'John')
  pipe.hgetall('user:1')
  pipe.incr('counter')
  pipe.incr('counter')
})

console.log('Results:', results)

// Get stats
const stats = pipeline.getStats()
console.log('Total commands:', stats.totalCommands)
console.log('Execution time:', stats.executionTime, 'ms')
console.log('Errors:', stats.errors)

// Reset stats
pipeline.resetStats()
```

### Manual Pipeline

```typescript
const pipeline = new PipelineManager()
const pipe = pipeline.createPipeline()

pipe.set('a', '1')
pipe.get('a')
pipe.incr('counter')

const results = await pipeline.execute(pipe)
```

### CommandBatch

Execute commands as a batch with promises.

```typescript
import { CommandBatch } from './services/redis/sdk/commands.js'

const batch = new CommandBatch()

const [setResult, getResult] = await Promise.all([
  batch.add('set', ['key1', 'value1']),
  batch.add('get', ['key1']),
])

await batch.execute()

// Or sequential:
batch.add('set', ['key2', 'value2'])
batch.add('incr', ['counter'])
await batch.execute()
```

---

## Hooks System

The hooks system provides pre/post processing and metrics collection for Redis commands.

### Basic Hooks

```typescript
import { getHooks, createDebugHook, createSlowQueryHook, createErrorLoggingHook } from './services/redis/sdk/hooks.js'

const hooks = getHooks()

// Enable hooks
hooks.setEnabled(true)

// Set log level
hooks.setLogLevel('info')

// Add pre-hook
hooks.registerHook({
  type: 'pre',
  command: ['get', 'set'],
  handler: (ctx) => {
    console.log(`[Pre] ${ctx.command} on ${ctx.key}`)
  },
})

// Add post-hook
hooks.registerHook({
  type: 'post',
  handler: (ctx) => {
    console.log(`[Post] ${ctx.command} completed in ${ctx.duration}ms`)
  },
})

// Add error-hook
hooks.registerHook({
  type: 'error',
  handler: (ctx) => {
    console.error(`[Error] ${ctx.command} failed:`, ctx.error)
  },
})

// Use pre-built hooks
hooks.registerHook(createDebugHook())
hooks.registerHook(createSlowQueryHook(100)) // Log queries > 100ms
hooks.registerHook(createErrorLoggingHook())
```

### Metrics

```typescript
// Get metrics
const metrics = hooks.getMetrics()
console.log('Total calls:', metrics.totalCalls)
console.log('Average duration:', metrics.averageDuration, 'ms')
console.log('Error rate:', metrics.errorRate)
console.log('By command:', metrics.byCommand)

// Get logs
const logs = hooks.getLogs(100)
logs.forEach((log) => {
  console.log(`[${log.level}] ${log.command}:`, log.args, log.duration)
})

// Clear logs
hooks.clearLogs()

// Reset metrics
hooks.resetMetrics()

// Disable hooks temporarily
hooks.setEnabled(false)
```

### Wrapping Commands with Hooks

```typescript
const hooks = getHooks()

const wrappedGet = hooks.wrapWithHooks('get', async (key: string) => {
  const client = getConnectionManager().getClient()
  return client.get(key)
})

// Now every call is automatically wrapped with hooks
const result = await wrappedGet('myKey')
```

---

## Reactive/Event System

The Observable class provides pub/sub and stream capabilities.

### Pub/Sub

```typescript
import { getObservable } from './services/redis/sdk/reactive.js'

const observable = getObservable()

// Subscribe to a channel
const unsubscribe = observable.subscribe('notifications', (message) => {
  console.log('Received:', message)
})

// Publish to a channel
await observable.publish('notifications', JSON.stringify({ type: 'alert', message: 'Hello!' }))

// Unsubscribe when done
unsubscribe()

// Subscribe to patterns
const patternUnsub = observable.psubscribe('user:*', (channel, message) => {
  console.log(`${channel}: ${message}`)
})
```

### Keyspace Notifications

```typescript
// Initialize with keyspace notifications
await observable.initialize()

// Listen for key events
observable.on('key:expired', ({ key, timestamp }) => {
  console.log(`Key expired: ${key} at ${new Date(timestamp)}`)
})

observable.on('key:deleted', ({ key }) => {
  console.log(`Key deleted: ${key}`)
})

observable.on('key:evicted', ({ key }) => {
  console.log(`Key evicted: ${key}`)
})
```

### Streams

```typescript
// Add to stream
const messageId = await observable.streamAdd('myStream', {
  event: 'user:signup',
  userId: '123',
  timestamp: Date.now().toString(),
})

// Read from stream
const messages = await observable.streamRead('myStream', '0', 10)
messages.forEach((msg) => {
  console.log('Stream message:', msg.id, msg.data)
})

// Consumer groups
await observable.streamCreateGroup('myStream', 'processors', '0')

// Read as consumer
const messages = await observable.streamReadGroup(
  'myStream',
  'processors',
  'worker-1',
  10,
  5000 // Block for 5s
)

// Acknowledge messages
await observable.streamAck('myStream', 'processors', ...messageIds)

// Set max length
observable.setStreamMaxLength('myStream', 1000)

// Get stream info
const info = await observable.streamInfo('myStream')
console.log('Stream length:', info.length)
```

### Reactive Subjects

```typescript
import { ReactiveSubject, BehaviorSubject, ReplaySubject } from './services/redis/sdk/reactive.js'

// Basic subject
const subject = new ReactiveSubject<string>()

subject.subscribe({
  next: (value) => console.log('Received:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Completed'),
})

subject.next('Hello')
subject.next('World')
subject.complete()

// Behavior subject (keeps last value)
const behavior = new BehaviorSubject('initial')

behavior.subscribe((value) => console.log('Got:', value)) // prints: "Got: initial"
behavior.next('updated') // prints: "Got: updated"

// Replay subject (replays last N values)
const replay = new ReplaySubject<string>(3)

replay.next('a')
replay.next('b')
replay.next('c')

replay.subscribe((value) => console.log('Got:', value)) // prints: a, b, c
```

---

## Decorators

The SDK provides TypeScript decorators for caching and memoization.

### Cached Decorator

```typescript
import { cached, CacheOptions } from './services/redis/sdk/decorators.js'

class UserService {
  @cached({ ttl: 300, keyPrefix: 'users' })
  async getUser(id: string): Promise<User> {
    // This will be cached for 5 minutes
    return this.fetchUserFromDB(id)
  }

  @cached({
    ttl: 60,
    keyGenerator: (...args) => `${args[0]}:${args[1]}`,
  })
  async searchUsers(query: string, page: number): Promise<User[]> {
    return this.db.search(query, page)
  }
}
```

### Invalidate Decorator

```typescript
import { invalidate } from './services/redis/sdk/decorators.js'

class UserService {
  @invalidate({ pattern: 'users:*' })
  async createUser(data: CreateUserData): Promise<User> {
    // Cache will be invalidated after this runs
    return this.db.create(data)
  }

  @invalidate({ tags: ['posts', 'user-posts'] })
  async createPost(data: CreatePostData): Promise<Post> {
    return this.db.create(data)
  }
}
```

### CacheWarm Decorator

```typescript
import { cacheWarm } from './services/redis/sdk/decorators.js'

class ConfigService {
  @cacheWarm(3600) // Cache for 1 hour
  async getConfig(): Promise<Config> {
    return this.fetchConfig()
  }
}
```

### Memoize Decorator (In-Memory)

```typescript
import { memoize } from './services/redis/sdk/decorators.js'

class Calculator {
  @memoize(60000) // Cache for 1 minute
  computeExpensiveValue(input: string): number {
    // Expensive computation
    return heavyCalculation(input)
  }
}
```

### Tagged Cache

```typescript
import { taggedCache, invalidateByTag } from './services/redis/sdk/decorators.ts'

class ContentService {
  @taggedCache('articles', { ttl: 300 })
  async getArticles(): Promise<Article[]> {
    return this.fetchArticles()
  }

  @taggedCache('articles', { ttl: 600 })
  async getArticle(id: string): Promise<Article> {
    return this.fetchArticle(id)
  }
}

// Later, invalidate all article cache
await invalidateByTag('articles')
```

### Lock Decorator

```typescript
import { withLock } from './services/redis/sdk/decorators.js'

class OrderService {
  @withLock('order', 30)
  async processOrder(orderId: string): Promise<void> {
    // Only one process can run this at a time
    await this.processPayment(orderId)
    await this.updateInventory(orderId)
  }
}
```

### Rate Limit Decorator

```typescript
import { rateLimit } from './services/redis/sdk/decorators.js'

class ApiService {
  @rateLimit(100, 60) // Max 100 calls per minute
  async callExternalApi(endpoint: string): Promise<Response> {
    return fetch(endpoint)
  }
}
```

### Cache Middleware Factory

```typescript
import { createCacheMiddleware } from './services/redis/sdk/decorators.js'

const cacheMiddleware = createCacheMiddleware({
  ttl: 300,
  keyPrefix: 'api',
  onCacheHit: (key) => console.log(`Cache hit: ${key}`),
  onCacheMiss: (key) => console.log(`Cache miss: ${key}`),
})

const getCachedUser = cacheMiddleware('getUser', async (id: string) => {
  return fetchUser(id)
})

// Later
const user = await getCachedUser('123')
```

### Cache Utilities

```typescript
import {
  invalidateByTag,
  invalidateByPattern,
  invalidateAll,
  getCacheStats,
  clearMemoizationCache,
} from './services/redis/sdk/decorators.js'

// Invalidate by tag
const count = await invalidateByTag('articles')

// Invalidate by pattern
const patternCount = await invalidateByPattern('users:*')

// Invalidate everything
const total = await invalidateAll()

// Get cache stats
const stats = getCacheStats()
console.log('Memory cache size:', stats.memoryCacheSize)
console.log('Registered keys:', stats.registeredKeys)

// Clear in-memory memoization only
clearMemoizationCache()
```

---

## Examples

### User Session Management

```typescript
import { getSDK } from './services/redis/sdk/index.js'

class SessionManager {
  private sdk = getSDK()

  async createSession(userId: string, data: SessionData): Promise<string> {
    const sessionId = `sess:${generateId()}`
    
    await this.sdk.fluentApi.strings.set(sessionId, data, { ttl: 86400 })
    await this.sdk.fluentApi.sets.sadd(`user:${userId}:sessions`, sessionId)
    
    return sessionId
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.sdk.fluentApi.strings.get<SessionData>(sessionId, true)
  }

  async deleteSession(sessionId: string): Promise<void> {
    const userId = await this.sdk.fluentApi.strings.get<string>(`${sessionId}:userId`)
    
    if (userId) {
      await this.sdk.fluentApi.sets.srem(`user:${userId}:sessions`, sessionId)
    }
    await this.sdk.fluentApi.keys.del(sessionId, `${sessionId}:userId`)
  }
}
```

### Rate Limiting

```typescript
import { getSDK } from './services/redis/sdk/index.js'

class RateLimiter {
  private sdk = getSDK()

  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `ratelimit:${identifier}`
    const windowMs = windowSeconds * 1000
    
    const current = await this.sdk.fluentApi.strings.get<number>(key)
    
    if (!current) {
      await this.sdk.fluentApi.strings.set(key, 1, { ttl: windowSeconds })
      return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds }
    }
    
    if (current >= maxRequests) {
      const ttl = await this.sdk.fluentApi.keys.ttl(key)
      return { allowed: false, remaining: 0, resetIn: ttl }
    }
    
    await this.sdk.fluentApi.strings.incr(key)
    
    return {
      allowed: true,
      remaining: maxRequests - current - 1,
      resetIn: windowSeconds,
    }
  }
}
```

### Real-time Notifications

```typescript
import { getObservable } from './services/redis/sdk/reactive.js'

class NotificationService {
  private observable = getObservable()

  async sendNotification(userId: string, notification: Notification): Promise<void> {
    const channel = `notifications:${userId}`
    await this.observable.publish(channel, JSON.stringify(notification))
  }

  subscribe(userId: string, handler: (notification: Notification) => void): () => void {
    const channel = `notifications:${userId}`
    return this.observable.subscribe(channel, (message) => {
      const notification = JSON.parse(message)
      handler(notification)
    })
  }
}
```

### Leaderboard

```typescript
import { getSDK } from './services/redis/sdk/index.js'

class LeaderboardService {
  private sdk = getSDK()

  async updateScore(playerId: string, score: number): Promise<void> {
    await this.sdk.fluentApi.sortedSets.zadd('leaderboard', score, playerId)
  }

  async getTopPlayers(count: number = 10): Promise<Array<{ playerId: string; score: number }>> {
    const results = await this.sdk.fluentApi.sortedSets.zrange(
      'leaderboard',
      0,
      count - 1,
      true
    )
    return results as Array<{ member: string; score: number }>
  }

  async getPlayerRank(playerId: string): Promise<number> {
    const rank = await this.sdk.fluentApi.sortedSets.zrange('leaderboard', 0, -1)
    return rank.indexOf(playerId) + 1
  }

  async removePlayer(playerId: string): Promise<void> {
    await this.sdk.fluentApi.keys.del('leaderboard', playerId)
  }
}
```

### Cache-Aside Pattern

```typescript
import { getSDK, cached } from './services/redis/sdk/index.js'

class ContentService {
  private sdk = getSDK()

  async getContent(id: string): Promise<Content | null> {
    const cacheKey = `content:${id}`
    
    // Try cache first
    const cached = await this.sdk.fluentApi.strings.get<Content>(cacheKey, true)
    if (cached) {
      return cached
    }
    
    // Fetch from database
    const content = await this.db.content.findUnique({ where: { id } })
    
    if (content) {
      // Store in cache
      await this.sdk.fluentApi.strings.set(cacheKey, content, { ttl: 300 })
    }
    
    return content
  }

  async invalidateContent(id: string): Promise<void> {
    await this.sdk.fluentApi.keys.del(`content:${id}`)
  }
}
```

### Distributed Lock

```typescript
import { getSDK } from './services/redis/sdk/index.js'

class DistributedLock {
  private sdk = getSDK()

  async acquireLock(
    resource: string,
    ttlSeconds: number = 30
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`
    const lockValue = generateId()
    
    const acquired = await this.sdk.fluentApi.strings.setNX(lockKey, lockValue)
    
    if (acquired) {
      await this.sdk.fluentApi.keys.expire(lockKey, ttlSeconds)
      return lockValue
    }
    
    return null
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`
    const currentValue = await this.sdk.fluentApi.strings.get<string>(lockKey)
    
    if (currentValue === lockValue) {
      await this.sdk.fluentApi.keys.del(lockKey)
      return true
    }
    
    return false
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 30
  ): Promise<T> {
    const lockValue = await this.acquireLock(resource, ttlSeconds)
    
    if (!lockValue) {
      throw new Error(`Failed to acquire lock for ${resource}`)
    }
    
    try {
      return await fn()
    } finally {
      await this.releaseLock(resource, lockValue)
    }
  }
}
```

---

## API Reference

### Connection Types

- `ConnectionConfig` - Configuration for Redis connection
- `PoolConfig` - Configuration for connection pool
- `HealthCheckResult` - Result of health check
- `ConnectionState` - Current connection state

### Command Types

- `JsonValue` - JSON-compatible value type
- `CommandOptions` - Options for command execution
- `BatchItem` - Item in a command batch
- `PipelineStats` - Pipeline execution statistics

### Hook Types

- `HookContext` - Context passed to hooks
- `HookMetrics` - Metrics collected by hooks
- `LogEntry` - Log entry from hooks

### Observable Types

- `StreamMessage` - Message from a stream
- `Subscription` - Active subscription
- `ReactiveOptions` - Options for reactive system

### Decorator Types

- `CacheOptions` - Options for cache decorator
- `InvalidateOptions` - Options for invalidation decorator

---

## Best Practices

1. **Always handle errors** - Redis operations can fail; use try/catch
2. **Use connection pooling** - Don't create new connections for each operation
3. **Set appropriate TTLs** - Don't cache forever unless necessary
4. **Monitor with hooks** - Use hooks for debugging and metrics
5. **Use pipelines for bulk operations** - Much faster than individual commands
6. **Be careful with KEYS/SCAN** - Use SCAN in production, not KEYS
7. **Use appropriate data structures** - Choose the right Redis type for your use case

---

## License

Part of the DevPrep project.
