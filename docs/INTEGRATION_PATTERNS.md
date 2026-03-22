# Redis Integration Patterns - DevPrep

This document describes the Redis integration patterns implemented in the DevPrep server.

## Overview

The DevPrep server uses Redis for various high-performance data operations including caching, session management, distributed locking, job queues, rate limiting, leaderboards, and search capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DevPrep Server                           │
├─────────────────────────────────────────────────────────────────┤
│  Express API (Rate Limited)                                     │
│    ├── Session Middleware                                       │
│    ├── Cache Layer                                              │
│    ├── Lock Manager                                            │
│    ├── Job Queue                                               │
│    └── Rate Limiter                                            │
├─────────────────────────────────────────────────────────────────┤
│  Redis Services                                                 │
│    ├── client.ts        - Connection management                 │
│    ├── cache.ts         - Content caching                       │
│    ├── sessions.ts      - Session & JWT blacklist              │
│    ├── locks.ts         - Distributed locks (Redlock)          │
│    ├── queue.ts         - Job queue (Lists/Streams)            │
│    ├── rate-limit.ts    - API rate limiting                     │
│    ├── leaderboard.ts   - Ranking system                       │
│    └── search.ts        - Full-text search                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Sessions & Token Management (`sessions.ts`)

### Purpose
Manage user sessions and JWT token blacklisting for secure authentication.

### Features
- Session creation with TTL
- Session retrieval and updates
- Session invalidation (single or all user sessions)
- Token blacklisting for logout/revocation
- Active session counting

### Usage

```typescript
import { 
  createSession, 
  getSession, 
  deleteSession,
  blacklistToken,
  isTokenBlacklisted 
} from './services/redis/sessions.js'

// Create a new session
const session = await createSession('session-123', 'user-456', {
  email: 'user@example.com',
  role: 'admin'
})

// Get session
const existingSession = await getSession('session-123')

// Delete session
await deleteSession('session-123')

// Blacklist JWT token
await blacklistToken('jwt-token-hash', 604800) // 7 days TTL

// Check if token is blacklisted
const isBlacklisted = await isTokenBlacklisted('jwt-token-hash')
```

### Configuration
- `SESSION_TTL`: Session expiration time (default: 86400 seconds / 24 hours)
- `TOKEN_BLACKLIST_TTL`: Token blacklist expiration (default: 604800 seconds / 7 days)

---

## 2. Distributed Locks (`locks.ts`)

### Purpose
Implement distributed locking for resource coordination across multiple server instances.

### Features
- Acquire/release locks with TTL
- Lock extension (renewal)
- Mutex pattern for exclusive access
- Redlock implementation for multiple Redis nodes
- Automatic cleanup of expired locks

### Usage

```typescript
import { 
  acquireLock, 
  releaseLock, 
  createMutex,
  withLock,
  createRedlock 
} from './services/redis/locks.js'

// Basic lock acquisition
const lock = await acquireLock('resource-name', { 
  ttl: 30000,      // 30 seconds
  retryDelay: 100,
  maxRetries: 30
})

if (lock) {
  try {
    // Critical section
    await processResource()
  } finally {
    await lock.release()
  }
}

// Using mutex pattern
const mutex = createMutex('exclusive-resource')
const lock2 = await mutex.acquire()
if (lock2) {
  try {
    await exclusiveOperation()
  } finally {
    await mutex.unlock()
  }
}

// Using withLock helper
const result = await withLock('resource', async () => {
  return await computeResult()
})

// Redlock for multiple Redis instances
const redlock = createRedlock({ retryCount: 3, retryDelay: 200 })
const locks = await redlock.acquire(['resource1', 'resource2'], 30000)
if (locks) {
  try {
    await multiResourceOperation()
  } finally {
    await redlock.release(locks)
  }
}
```

### Lock Options
- `ttl`: Lock expiration in milliseconds (default: 30000)
- `retryDelay`: Delay between retry attempts in ms (default: 100)
- `maxRetries`: Maximum number of retry attempts (default: 30)

---

## 3. Job Queue (`queue.ts`)

### Purpose
Implement reliable job processing with priority support and delayed execution.

### Features
- Priority queues (0-9 priority levels)
- Delayed job scheduling
- Job retry with exponential backoff
- Job completion and failure tracking
- Batch job enqueuing
- Queue statistics

### Usage

```typescript
import { Queue } from './services/redis/queue.js'

const queue = new Queue('content-processing', { maxRetries: 3 })

// Enqueue a job
const { jobId, enqueued } = await queue.enqueue('generate-content', {
  channel: 'javascript',
  type: 'question',
  prompt: 'Explain closures'
}, {
  priority: 5,
  scheduledFor: Date.now() + 60000 // 1 minute delay
})

// Dequeue and process jobs
while (true) {
  const job = await queue.dequeue(5) // 5 second timeout
  
  if (job) {
    try {
      const result = await processJob(job)
      await queue.complete(job.id, result)
    } catch (error) {
      await queue.fail(job.id, error.message)
    }
  }
}

// Get queue statistics
const stats = await queue.getStats()
console.log(`Pending: ${stats.pending}, Processing: ${stats.processing}`)

// Retry failed job
await queue.retry('job-id')

// Clear completed jobs
await queue.clearCompleted()
```

### Queue Class Methods
| Method | Description |
|--------|-------------|
| `enqueue()` | Add job to queue |
| `dequeue()` | Get next job (blocking) |
| `complete()` | Mark job as completed |
| `fail()` | Mark job as failed |
| `retry()` | Requeue failed job |
| `getStats()` | Get queue statistics |
| `getPendingJobs()` | Get list of pending jobs |
| `processDelayedJobs()` | Move delayed jobs to pending |

---

## 4. Rate Limiting (`rate-limit.ts`)

### Purpose
Protect API endpoints from abuse using various rate limiting strategies.

### Features
- Fixed window rate limiting
- Sliding window rate limiting
- Token bucket algorithm
- IP-based and user-based limits
- Custom key generators
- Configurable limits per endpoint

### Usage

```typescript
import { 
  rateLimit, 
  createIpRateLimit,
  createUserRateLimit,
  authRateLimit,
  contentRateLimit 
} from './services/redis/rate-limit.js'

// Apply to all API routes
app.use(generalRateLimit)

// Apply to specific routes
app.post('/api/auth/login', authRateLimit, handler)
app.get('/api/content', contentRateLimit, handler)

// Custom rate limiter
const customLimit = rateLimit({
  windowMs: 60000,      // 1 minute window
  maxRequests: 50,
  keyPrefix: 'custom',
  keyGenerator: (req) => req.userId || req.ip,
  skip: (req) => req.path === '/health',
  handler: (req, res) => {
    res.status(429).json({ 
      ok: false, 
      error: 'Custom rate limit exceeded' 
    })
  }
})

app.use('/api/special', customLimit)

// Token bucket rate limiting
import { createTokenBucketLimiter } from './services/redis/rate-limit.js'

const bucketLimiter = createTokenBucketLimiter({
  bucketSize: 100,      // Max tokens
  refillRate: 10,       // Tokens per second
  prefix: 'api'
})
```

### Built-in Rate Limiters

| Limiter | Window | Max Requests | Purpose |
|---------|--------|--------------|---------|
| `apiRateLimit` | 60s | 100 | General API |
| `authRateLimit` | 15min | 5 | Authentication |
| `contentRateLimit` | 60s | 30 | Content fetching |
| `searchRateLimit` | 60s | 20 | Search queries |
| `generateRateLimit` | 60min | 10 | Content generation |

### Response Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## 5. Leaderboard (`leaderboard.ts`)

### Purpose
Implement ranking and scoring systems for gamification features.

### Features
- Add/update member scores
- Rank calculation (ascending/descending)
- Top N and bottom N retrieval
- Percentile calculation
- Score aggregation across multiple leaderboards
- Score filtering by range

### Usage

```typescript
import { createLeaderboard, MultiLeaderboard } from './services/redis/leaderboard.js'

const leaderboard = createLeaderboard('user-points')

// Add/update scores
await leaderboard.addMember('user-123', 100)
await leaderboard.incrementScore('user-123', 50)

// Get rankings
const topUsers = await leaderboard.getTop(10)
const userEntry = await leaderboard.getEntry('user-123')

// Check percentile
const percentile = await leaderboard.getPercentile('user-123')

// Multi-leaderboard with weighted aggregation
const multi = new MultiLeaderboard(['points', 'streak', 'achievements'])

await multi.addScoreToAll('user-123', {
  points: 100,
  streak: 30,
  achievements: 50
})

const avgRank = await multi.getAggregatedRank('user-123', {
  points: 0.5,
  streak: 0.3,
  achievements: 0.2
})
```

### Leaderboard Methods
| Method | Description |
|--------|-------------|
| `addMember()` | Add or update member score |
| `incrementScore()` | Add to existing score |
| `getScore()` | Get member's score |
| `getRank()` | Get member's rank (1-indexed) |
| `getTop()` | Get top N members |
| `getBottom()` | Get bottom N members |
| `getPercentile()` | Calculate percentile rank |
| `removeMember()` | Remove from leaderboard |

---

## 6. Search (`search.ts`)

### Purpose
Implement full-text search capabilities for content discovery.

### Features
- Document indexing with multiple fields
- Fuzzy matching
- Tag and channel filtering
- Autocomplete suggestions
- Relevance scoring
- Filter by difficulty/type

### Usage

```typescript
import { SearchIndex } from './services/redis/search.js'

const searchIndex = new SearchIndex('content')

// Index documents
await searchIndex.index({
  id: 'content-123',
  type: 'question',
  title: 'What is a closure in JavaScript?',
  content: 'A closure is a function bundled with its lexical environment...',
  tags: ['javascript', 'functions', 'closures'],
  channel: 'javascript',
  difficulty: 'intermediate'
})

// Search with filters
const results = await searchIndex.search('closure javascript', {
  limit: 20,
  offset: 0,
  fuzzy: true,
  filters: {
    type: 'question',
    difficulty: 'intermediate'
  },
  sortBy: 'relevance'
})

// Autocomplete
const suggestions = await searchIndex.autocomplete('clos', 10)

// Get by tag
const taggedDocs = await searchIndex.getByTag('javascript', 20)

// Get top rated
const topDocs = await searchIndex.getTop(10)

// Get index statistics
const stats = await searchIndex.stats()
console.log(`Documents: ${stats.documentCount}, Tokens: ${stats.tokenCount}`)
```

### Search Options
| Option | Type | Description |
|--------|------|-------------|
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |
| `fuzzy` | boolean | Enable fuzzy matching |
| `filters` | object | Filter by type, channel, tags, etc. |
| `sortBy` | string | 'relevance', 'created', 'score' |
| `sortOrder` | string | 'asc' or 'desc' |

---

## Error Handling

All Redis services implement graceful degradation. If Redis is unavailable:

- `isRedisAvailable()` returns `false`
- Operations return `null`, `false`, or empty arrays
- The application continues to function without Redis features

### Example Error Handling

```typescript
import { getRedisClient, isRedisAvailable } from './services/redis/client.js'

if (!isRedisAvailable()) {
  console.warn('Redis unavailable, falling back to alternative')
  return fallbackResult
}

const client = getRedisClient()
if (!client) {
  return fallbackResult
}

try {
  const result = await client.get(key)
  return result
} catch (error) {
  console.error('Redis operation failed:', error)
  return fallbackResult
}
```

---

## Performance Considerations

1. **Connection Pooling**: Redis connections are reused via the singleton client
2. **Pipeline Operations**: Use `multi()` for batch operations to reduce round trips
3. **TTL Management**: Set appropriate expiration times to prevent memory bloat
4. **Key Prefixing**: All keys are prefixed with `devprep:` for easy identification
5. **Graceful Degradation**: Application continues without Redis if unavailable

---

## Monitoring

The server logs Redis connection status:

```
[Redis] Connected to localhost:6379
[Redis] Ready to serve requests
[Redis] Connection error: Connection refused
[Redis] Failed to connect - running without cache
```

---

## Configuration

Environment variables for Redis:

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | localhost | Redis server host |
| `REDIS_PORT` | 6379 | Redis server port |
| `REDIS_PASSWORD` | - | Redis password (optional) |
| `REDIS_DB` | 0 | Redis database number |
| `CACHE_TTL` | 300 | Default cache TTL in seconds |
| `SESSION_TTL` | 86400 | Session TTL in seconds |
| `LOCK_TTL` | 30000 | Lock TTL in milliseconds |

---

_Last Updated: 2026-03-22_
