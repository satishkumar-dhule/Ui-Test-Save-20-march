# In-Memory Redis Implementation

A complete in-memory Redis implementation built with Node.js built-in libraries. Drop-in replacement for ioredis without external dependencies.

## Features

- **Full Redis-like API** - Strings, Hashes, Lists, Sets, Sorted Sets, Streams
- **TTL/Expiry Support** - Automatic key expiration with cleanup
- **LRU/LFU Eviction** - Configurable memory-based eviction policies
- **Pub/Sub** - Channel and pattern-based subscriptions
- **Streams** - Consumer groups, message acknowledgment
- **Transactions** - MULTI/EXEC/WATCH support
- **Pipeline** - Batch command execution

## Quick Start

```typescript
import { InMemoryRedis } from "./services/redis/inmemory";

const redis = new InMemoryRedis();

await redis.connect();
await redis.set("key", "value");
const value = await redis.get("key");
```

## Configuration

```typescript
const redis = new InMemoryRedis({
  keyPrefix: "app:", // Key prefix for namespacing
  enableReadyCheck: true, // Enable ready check on connect
  lazyConnect: false, // Connect lazily on first command
  maxRetriesPerRequest: 3, // Retry attempts
});
```

## Data Structures

### Strings

```typescript
await redis.set("key", "value");
await redis.get("key"); // 'value'
await redis.setex("key", 60, "value"); // Set with TTL
await redis.setnx("key", "value"); // Set if not exists
await redis.incr("counter"); // 1
await redis.incrby("counter", 5); // 6
await redis.append("key", "suffix"); // 12
```

### Hashes

```typescript
await redis.hset("user:1", "name", "John", "age", "30");
await redis.hget("user:1", "name"); // 'John'
await redis.hgetall("user:1"); // { name: 'John', age: '30' }
await redis.hincrby("user:1", "age", 1); // 31
await redis.hkeys("user:1"); // ['name', 'age']
await redis.hvals("user:1"); // ['John', '31']
```

### Lists

```typescript
await redis.lpush("queue", "task1", "task2");
await redis.rpush("queue", "task3");
await redis.lrange("queue", 0, -1); // ['task2', 'task1', 'task3']
await redis.lpop("queue"); // 'task2'
await redis.rpop("queue"); // 'task3'
await redis.llen("queue"); // 1
```

### Sets

```typescript
await redis.sadd("tags", "javascript", "typescript", "node");
await redis.smembers("tags"); // ['javascript', 'typescript', 'node']
await redis.sismember("tags", "node"); // 1
await redis.scard("tags"); // 3
await redis.srem("tags", "typescript"); // 1
```

### Sorted Sets

```typescript
await redis.zadd("leaderboard", 100, "alice", 200, "bob", 150, "charlie");
await redis.zrange("leaderboard", 0, -1); // ['alice', 'charlie', 'bob']
await redis.zrevrange("leaderboard", 0, 2, "WITHSCORES");
// ['bob', '200', 'charlie', '150', 'alice', '100']
await redis.zrank("leaderboard", "charlie"); // 1
await redis.zscore("leaderboard", "bob"); // '200'
```

## Pub/Sub

```typescript
const redis = new InMemoryRedis();

// Subscribe to channels
await redis.subscribe("news", (message) => {
  console.log("News:", message);
});

await redis.psubscribe("user:*", (message, channel) => {
  console.log(`${channel}:`, message);
});

// Publish messages
await redis.publish("news", "Breaking news!");
await redis.publish("user:123", "Hello!");
```

## Streams

```typescript
// Add entries
await redis.xadd("mystream", "*", "field1", "value1", "field2", "value2");

// Read from stream
const entries = await redis.xrange("mystream", "-", "+", 10);

// Consumer groups
await redis.xgroupCreate("mystream", "mygroup", "0");
await redis.xreadgroup("mygroup", "consumer1", 1, 0, "mystream", ">");
await redis.xack("mystream", "mygroup", "entry-id");
```

## Transactions

```typescript
const pipeline = redis.multi();

pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key1");

const results = await pipeline.exec();
// [[null, 'OK'], [null, 'OK'], [null, 'value1']]
```

## Key Management

```typescript
await redis.expire("key", 60); // Set TTL
await redis.ttl("key"); // Get remaining TTL
await redis.persist("key"); // Remove TTL
await redis.rename("old", "new"); // Rename key
await redis.type("key"); // Get key type
await redis.keys("user:*"); // Pattern matching
```

## Memory Management

```typescript
const redis = new InMemoryRedis({
  maxMemory: 1000000, // Max bytes
  maxMemoryPolicy: "lru", // Eviction policy
});
```

### Eviction Policies

- `lru` - Least Recently Used (volatile keys)
- `lfu` - Least Frequently Used (volatile keys)
- `allkeys-lru` - LRU across all keys
- `allkeys-lfu` - LFU across all keys
- `volatile-lru` - LRU only for keys with TTL
- `noeviction` - Reject writes (default)

## API Reference

### Connection Methods

| Method      | Description                |
| ----------- | -------------------------- |
| `connect()` | Connect to in-memory store |
| `quit()`    | Disconnect                 |
| `ping()`    | Ping/pong                  |
| `isReady()` | Check connection status    |

### String Methods

| Method                       | Description         |
| ---------------------------- | ------------------- |
| `get(key)`                   | Get string value    |
| `set(key, value, ...opts)`   | Set string value    |
| `setex(key, seconds, value)` | Set with expiration |
| `setnx(key, value)`          | Set if not exists   |
| `incr(key)`                  | Increment by 1      |
| `incrby(key, n)`             | Increment by n      |
| `incrbyfloat(key, n)`        | Increment by float  |
| `decr(key)`                  | Decrement by 1      |
| `decrby(key, n)`             | Decrement by n      |
| `append(key, value)`         | Append to string    |
| `strlen(key)`                | Get string length   |

### Hash Methods

| Method                      | Description        |
| --------------------------- | ------------------ |
| `hget(key, field)`          | Get hash field     |
| `hset(key, ...fieldValues)` | Set hash fields    |
| `hgetall(key)`              | Get all fields     |
| `hdel(key, ...fields)`      | Delete fields      |
| `hexists(key, field)`       | Check field exists |
| `hincrby(key, field, n)`    | Increment field    |
| `hkeys(key)`                | Get all keys       |
| `hvals(key)`                | Get all values     |
| `hlen(key)`                 | Get field count    |

### List Methods

| Method                            | Description         |
| --------------------------------- | ------------------- |
| `lpush(key, ...values)`           | Push to left        |
| `rpush(key, ...values)`           | Push to right       |
| `lpop(key)`                       | Pop from left       |
| `rpop(key)`                       | Pop from right      |
| `lrange(key, start, stop)`        | Get range           |
| `llen(key)`                       | Get length          |
| `lset(key, index, value)`         | Set by index        |
| `ltrim(key, start, stop)`         | Trim list           |
| `linsert(key, pivot, value, dir)` | Insert around pivot |

### Set Methods

| Method                   | Description      |
| ------------------------ | ---------------- |
| `sadd(key, ...members)`  | Add members      |
| `srem(key, ...members)`  | Remove members   |
| `smembers(key)`          | Get all members  |
| `sismember(key, member)` | Check membership |
| `scard(key)`             | Get size         |
| `sinter(...keys)`        | Set intersection |
| `sunion(...keys)`        | Set union        |
| `sdiff(...keys)`         | Set difference   |

### Sorted Set Methods

| Method                        | Description      |
| ----------------------------- | ---------------- |
| `zadd(key, ...scoreMembers)`  | Add with scores  |
| `zrange(key, start, stop)`    | Range by score   |
| `zrevrange(key, start, stop)` | Reverse range    |
| `zrank(key, member)`          | Get rank         |
| `zrevrank(key, member)`       | Get reverse rank |
| `zscore(key, member)`         | Get score        |
| `zrem(key, ...members)`       | Remove members   |
| `zincrby(key, n, member)`     | Increment score  |

### Key Methods

| Method                 | Description        |
| ---------------------- | ------------------ |
| `del(...keys)`         | Delete keys        |
| `exists(...keys)`      | Check existence    |
| `expire(key, seconds)` | Set TTL            |
| `pexpire(key, ms)`     | Set TTL in ms      |
| `ttl(key)`             | Get TTL in seconds |
| `pttl(key)`            | Get TTL in ms      |
| `persist(key)`         | Remove TTL         |
| `rename(key, newKey)`  | Rename key         |
| `type(key)`            | Get value type     |
| `keys(pattern)`        | Pattern match      |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    InMemoryRedis                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Strings   │  │    Hashes   │  │    Lists    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Sets     │  │ Sorted Sets  │  │   Streams   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│                     Pub/Sub Layer                       │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │     Channels          │  │     Patterns          │  │
│  └───────────────────────┘  └───────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│              Storage & Eviction Layer                   │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Map<string, DataValue>              │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │   LRU   │  │   LFU   │  │  FIFO   │  ...        │
│  └─────────┘  └─────────┘  └─────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Performance

- O(1) for most basic operations
- O(log N) for sorted set operations
- O(N) for pattern matching keys
- Automatic expiry cleanup every second

## Use Cases

1. **Development/Testing** - No Redis server needed
2. **Caching** - Fast in-memory caching
3. **Rate Limiting** - Token bucket implementation
4. **Session Storage** - Ephemeral session data
5. **Message Queues** - Pub/sub and streams
6. **Leaderboards** - Sorted sets with scores
7. **Real-time Data** - Live counters and statistics
