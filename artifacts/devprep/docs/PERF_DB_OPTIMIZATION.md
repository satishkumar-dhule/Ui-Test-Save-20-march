# Database Performance Optimization

## Overview

This document describes the database loading optimization strategy for DevPrep, using Web Workers and WASM streaming to eliminate main thread blocking.

## Problem Statement

The original implementation loaded sql.js (SQLite compiled to WASM) directly on the main thread, causing:

1. **Main Thread Blocking** - WASM initialization blocks UI rendering
2. **Large Bundle Impact** - sql.js WASM (~1MB) loaded synchronously
3. **No Parallelization** - DB queries compete with React rendering
4. **Cache Inefficiency** - Repeated queries hit the database each time

## Solution Architecture

### Web Worker for sql.js

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN THREAD                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   React    │    │  UI State   │    │  DbLoader Client    │  │
│  │   App      │    │  (Zustand)  │    │  (API Wrapper)      │  │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘  │
│                                                   │             │
│  ┌───────────────────────────────────────────────┼───────────┐ │
│  │            MessageChannel                       │          │ │
│  └───────────────────────────────────────────────┼───────────┘ │
└──────────────────────────────────────────────────┼─────────────┘
                                                   │
┌──────────────────────────────────────────────────┼─────────────┐
│                        WEB WORKER               │             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  DbWorker                                │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │ │
│  │  │ initSqlJs  │───▶│ WASM Module │    │   Query     │  │ │
│  │  │ (async)    │    │  (loaded    │    │   Cache     │  │ │
│  │  └─────────────┘    │   off main │    │             │  │ │
│  │                    │   thread)   │    │             │  │ │
│  │                    └─────────────┘    └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **db.worker.ts** - Web Worker handling sql.js operations
2. **db-loader.ts** - Lazy initialization with connection pooling
3. **dbClientOptimized.ts** - API wrapper with fallback support

## Performance Improvements

### Expected Metrics

| Metric              | Before   | After            | Improvement      |
| ------------------- | -------- | ---------------- | ---------------- |
| Initial Render      | Blocked  | Non-blocking     | ~300-500ms saved |
| Time to Interactive | 3-5s     | 1-2s             | 50-60% faster    |
| DB Query Latency    | 50-100ms | 10-30ms (cached) | 60-70% faster    |
| Main Thread CPU     | High     | Minimal          | 80%+ reduction   |

### Memory Usage

| Component   | Memory (Before)       | Memory (After)              |
| ----------- | --------------------- | --------------------------- |
| Main Thread | ~50MB (includes WASM) | ~35MB                       |
| Worker      | N/A                   | ~15MB                       |
| Query Cache | In-memory per call    | 60s TTL cache               |
| Total       | ~50MB                 | ~50MB (same, but offloaded) |

## How Web Worker Prevents Main Thread Blocking

### Before (Main Thread Blocking)

```javascript
// Main thread - BLOCKS UI
async function initDatabase() {
  const SQL = await initSqlJs() // ~200-300ms, blocks UI
  const db = new SQL.Database(data) // ~50-100ms
  return db
}
```

### After (Off Main Thread)

```javascript
// Main thread - ZERO blocking
const loader = new DbLoader({ useWorker: true })
loader.initialize() // Non-blocking, runs in worker

// Queries also don't block
const results = await loader.query(sql) // Returns via promise
```

## Implementation Details

### DbLoader Options

```typescript
interface DbLoaderOptions {
  wasmUrl?: string // Custom WASM URL
  dbUrl?: string // Database file URL
  cacheQueries?: boolean // Enable query caching (default: true)
  cacheTtlMs?: number // Cache TTL in ms (default: 60000)
  useWorker?: boolean // Use Web Worker (default: true)
}
```

### Worker Communication Protocol

Messages between main thread and worker:

| Message Type     | Direction     | Payload             |
| ---------------- | ------------- | ------------------- |
| INIT             | Main → Worker | { wasmUrl, dbUrl }  |
| QUERY            | Main → Worker | { sql, params? }    |
| QUERY_ALL        | Main → Worker | { sql, params? }    |
| CLOSE            | Main → Worker | -                   |
| INIT_COMPLETE    | Worker → Main | { error? }          |
| QUERY_RESULT     | Worker → Main | { columns, values } |
| QUERY_ALL_RESULT | Worker → Main | object[]            |
| ERROR            | Worker → Main | { message }         |

### Graceful Degradation

If Web Workers are unavailable (e.g., older browsers), the system falls back to direct sql.js usage:

```typescript
const loader = new DbLoader({ useWorker: false })
await loader.initialize()
```

## Vite Configuration Optimizations

### Compression

The .db file is served with compression headers in production:

```typescript
// vite.config.ts
server.middlewares.use('/devprep.db', (req, res) => {
  // Gzip compression handled by hosting provider
  res.setHeader('Content-Encoding', 'gzip')
  res.setHeader('Cache-Control', 'public, max-age=31536000')
})
```

### Caching Strategy

| Environment | Cache-Control    | Strategy                  |
| ----------- | ---------------- | ------------------------- |
| Development | no-cache         | Always fetch fresh        |
| Production  | max-age=31536000 | Immutable, content-hashed |

### WAL Checkpointing

Before serving the database, we checkpoint the WAL to ensure all changes are flushed:

```typescript
function checkpointDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  db.close()
}
```

## Usage Example

```typescript
import { getDbClientOptimized, initializeDbClient } from '@/services/dbClientOptimized'

// Initialize once at app startup
await initializeDbClient({ useWorker: true })

// Use throughout the app
const client = getDbClientOptimized()

// Subscribe to state changes
const unsubscribe = client.onStateChange(state => {
  console.log('DB ready:', state.isReady)
})

// Query data
const questions = await client.getContentByType('question')
const channels = await client.getChannels()

// Cleanup
await client.close()
```

## Testing

Run the performance tests:

```bash
npm run test:integration
```

## Browser Support

| Feature           | Chrome | Firefox | Safari | Edge |
| ----------------- | ------ | ------- | ------ | ---- |
| Web Workers       | ✓      | ✓       | ✓      | ✓    |
| SharedArrayBuffer | ✓      | ✓       | ✓      | ✓    |
| Module Workers    | ✓      | ✓       | ✓      | ✓    |

## Troubleshooting

### Worker Fails to Load

Check browser console for errors. Common causes:

- Missing `type: 'module'` in Worker constructor
- Incorrect WASM URL
- CORS issues with WASM file

### Queries Timeout

Default timeout is 30 seconds. Increase via:

```typescript
// In db-loader.ts, modify timeout in queryViaWorker
const timeout = setTimeout(..., 60000) // 60 seconds
```

### Cache Not Working

Ensure cache is enabled:

```typescript
const loader = new DbLoader({ cacheQueries: true })
```

## Future Enhancements

1. **IndexedDB Persistence** - Cache database in IndexedDB for offline support
2. **SharedArrayBuffer** - Faster data transfer between threads
3. **WebAssembly SIMD** - Parallel query execution
4. **Connection Pooling** - Multiple database connections in worker
