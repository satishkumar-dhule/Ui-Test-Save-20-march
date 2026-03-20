# DevPrep Content Generator - Architecture v2.0

> **Goal**: 100x improvement over current monolithic `generate-pollination-content.mjs`

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   WebApp    │  │   CLI Tool  │  │   API       │  │   WebSocket │              │
│  │  (React)    │  │  (Node.js)  │  │   Clients   │  │   Client    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                 │ REST/WebSocket
┌────────────────────────────────┼────────────────────────────────────────────────┐
│                         GATEWAY LAYER                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                          API Gateway                                     │     │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │     │
│  │  │ Rate      │  │ Auth      │  │ Validation│  │ Proxy     │            │     │
│  │  │ Limiter   │  │ Middleware│  │           │  │           │            │     │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘            │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┬──────────────────┘
                                                                  │
┌─────────────────────────────────────────────────────────────────┼──────────────────┐
│                         ORCHESTRATION LAYER                      │                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │                  │
│  │   Job Queue     │  │  Scheduler      │  │  Worker Pool    │◄─┼── HTTP/WS        │
│  │   (BullMQ)      │  │  (Priority)      │  │  (Worker Threads│  │                  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │                  │
│           │                   │                   │          │                  │
│  ┌────────┴───────────────────┴───────────────────┴────────┐  │                  │
│  │                   JOB PROCESSOR                         │  │                  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │                  │
│  │  │ Retry    │  │ Circuit  │  │ Batch    │  │ Quality  │ │  │                  │
│  │  │ Manager  │  │ Breaker  │  │ Manager  │  │ Validator│ │  │                  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │                  │
│  └───────────────────────────────────────────────────────────┘  │                  │
└───────────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────┴─────────┐ ┌────────────┴──────────┐ ┌────────────┴──────────┐
│   AI PROVIDER      │ │    STORAGE LAYER      │ │   INTELLIGENCE LAYER   │
│   LAYER             │ │                       │ │                        │
│  ┌───────────────┐  │ │  ┌─────────────────┐  │ │  ┌──────────────────┐ │
│  │ Pollinations  │  │ │  │ SQLite + WAL    │  │ │  │ Vector Store     │ │
│  │ API Client    │  │ │  │                  │  │ │  │ (Embeddings)     │ │
│  └───────┬───────┘  │ │  │  Content Table   │  │ │  │                  │ │
│          │         │ │  │  Versions Table  │  │ │  │ Semantic Search  │ │
│  ┌───────┴───────┐  │ │  │  Analytics Table │  │ │  │ Similarity Check │ │
│  │ Rate Limiter  │  │ │  │  Jobs Table      │  │ │  └──────────────────┘ │
│  │ (Token Bucket)│  │ │  └─────────────────┘  │ │                        │
│  └───────────────┘  │ │                        │ │  ┌──────────────────┐ │
│                     │ │  ┌─────────────────┐  │ │  │ Gap Analyzer    │ │
│  ┌───────────────┐  │ │  │ File Cache      │  │ │  │                  │ │
│  │ Model Router  │  │ │  │ (LRU + TTL)     │  │ │  │ Content Planning │ │
│  │ (Fallback)    │  │ │  └─────────────────┘  │ │  │ Priority Queue   │ │
│  └───────────────┘  │ │                        │ │  └──────────────────┘ │
└─────────────────────┘ └────────────────────────┘ └────────────────────────┘
```

---

## Core Components

### 1. Job Queue System (`src/queue/`)

```typescript
// Priority levels
enum Priority {
  CRITICAL = 1, // Immediate retry failures
  HIGH = 2, // User-requested
  NORMAL = 3, // Scheduled generation
  LOW = 4, // Background enrichment
  BATCH = 5, // Bulk operations
}

// Job structure
interface ContentJob {
  id: string;
  type: ContentType;
  channelId: string;
  priority: Priority;
  attempts: number;
  maxAttempts: number;
  payload: {
    content: Partial<ContentSpec>;
    constraints: GenerationConstraints;
  };
  status: JobStatus;
  createdAt: Date;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: GeneratedContent;
  error?: JobError;
}
```

**Features:**

- Redis-backed queue (BullMQ)
- Priority-based scheduling
- Delayed job support
- Job deduplication (by hash)
- Backpressure handling

### 2. Retry Engine (`src/retry/`)

```typescript
interface RetryConfig {
  maxAttempts: number; // Default: 5
  baseDelay: number; // Default: 1000ms
  maxDelay: number; // Default: 60000ms
  backoffMultiplier: number; // Default: 2
  jitter: number; // Default: 0.1 (10%)
  retryableErrors: ErrorType[]; // Configurable
}

// Exponential backoff with jitter
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponential =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  const capped = Math.min(exponential, config.maxDelay);
  const jittered = capped * (1 + (Math.random() - 0.5) * 2 * config.jitter);
  return Math.floor(jittered);
}
```

**Circuit Breaker States:**

```
CLOSED (Normal) → OPEN (Failing) → HALF-OPEN (Testing)
     │                │                 │
     │ 5 failures      │ 60 seconds      │ 1 success
     │ threshold       │ timeout         │ test succeeds
     ▼                 ▼                 ▼
  ┌─────────────────────────────────────────┐
  │  Circuit Breaker State Machine          │
  │  - Failure tracking with sliding window │
  │  - Success threshold to close          │
  │  - Automatic recovery                   │
  └─────────────────────────────────────────┘
```

### 3. Multi-Strategy JSON Parser (`src/parsing/`)

```typescript
const PARSE_STRATEGIES: JsonParseStrategy[] = [
  // Strategy 1: Direct parse
  (raw) => JSON.parse(raw),

  // Strategy 2: Trailing comma removal
  (raw) => JSON.parse(raw.replace(/,(\s*[}\]])/g, "$1")),

  // Strategy 3: Newline escaping
  (raw) => JSON.parse(raw.replace(/(?<!\\)\n(?=[^"]*")/g, "\\n")),

  // Strategy 4: Last brace truncation
  (raw) => JSON.parse(raw.slice(0, raw.lastIndexOf("}") + 1)),

  // Strategy 5: Markdown code fence extraction
  (raw) => JSON.parse(extractCodeFence(raw)),

  // Strategy 6: Remove control characters
  (raw) => JSON.parse(raw.replace(/[\x00-\x1F\x7F]/g, "")),

  // Strategy 7: Fix unescaped quotes
  (raw) => JSON.parse(fixUnescapedQuotes(raw)),

  // Strategy 8: Regex-based field recovery
  (raw) => recoverFields(raw),

  // Strategy 9: LLM-assisted repair
  (raw) => llmRepair(raw),

  // Strategy 10: Partial JSON extraction
  (raw) => extractValidJsonFragments(raw),
];
```

### 4. Worker Thread Pool (`src/workers/`)

```typescript
// Worker pool configuration
const WORKER_CONFIG = {
  minWorkers: 2,
  maxWorkers: navigator.hardwareConcurrency || 8,
  taskTimeout: 60000, // 60 seconds
  idleTimeout: 300000, // 5 minutes
  maxQueueSize: 1000,
};

// Worker message types
type WorkerMessage =
  | { type: "GEN_CONTENT"; payload: GenerationRequest }
  | { type: "VALIDATE"; payload: ValidationRequest }
  | { type: "EMBED"; payload: EmbeddingRequest };

// Main thread pools generation
async function parallelGenerate(
  requests: GenerationRequest[],
): Promise<Results[]> {
  const chunks = chunkArray(requests, WORKER_CONFIG.maxWorkers);
  const results = [];

  for (const chunk of chunks) {
    const promises = chunk.map((req) => workerPool.run(req));
    const chunkResults = await Promise.allSettled(promises);
    results.push(...chunkResults);
  }

  return results;
}
```

### 5. Content Deduplication (`src/dedup/`)

```typescript
interface DeduplicationConfig {
  similarityThreshold: number; // Default: 0.85
  checkMethods: DeduplicationMethod[];
}

enum DeduplicationMethod {
  EXACT_HASH = "exact_hash", // MD5/SHA of normalized content
  SEMANTIC_SIMILARITY = "semantic", // Vector cosine similarity
  NGRAM_OVERLAP = "ngram", // Jaccard similarity of n-grams
  TITLE_SIMILARITY = "title", // Levenshtein distance on titles
}

// Multi-stage deduplication
async function isDuplicate(content: ContentSpec): Promise<DedupResult> {
  // Stage 1: Exact hash check (O(1))
  const exactMatch = await cache.get(hash(normalize(content)));
  if (exactMatch) return { duplicate: true, method: "exact_hash", score: 1.0 };

  // Stage 2: Semantic similarity (vector search)
  const embedding = await generateEmbedding(content);
  const neighbors = await vectorStore.search(embedding, { k: 5 });

  for (const neighbor of neighbors) {
    if (neighbor.similarity >= config.similarityThreshold) {
      return {
        duplicate: true,
        method: "semantic",
        score: neighbor.similarity,
      };
    }
  }

  // Stage 3: Title similarity
  const titleHash = levenshteinSimilarity(
    content.title,
    neighbors.map((n) => n.title),
  );
  if (titleHash > 0.9)
    return { duplicate: true, method: "title", score: titleHash };

  return { duplicate: false, score: 0 };
}
```

### 6. LLM Quality Validator (`src/quality/`)

```typescript
interface QualityCriteria {
  relevance: { weight: 0.3; min: 0.7 };
  accuracy: { weight: 0.3; min: 0.8 };
  completeness: { weight: 0.2; min: 0.6 };
  clarity: { weight: 0.1; min: 0.7 };
  uniqueness: { weight: 0.1; min: 0.5 };
}

interface QualityReport {
  overall: number; // Weighted score 0-1
  passed: boolean;
  criteria: {
    relevance: number;
    accuracy: number;
    completeness: number;
    clarity: number;
    uniqueness: number;
  };
  issues: QualityIssue[];
  suggestions: string[];
}

// LLM-based validation with fallback to heuristics
async function validateQuality(
  content: GeneratedContent,
): Promise<QualityReport> {
  try {
    // Primary: LLM evaluation
    return await llmEvaluate(content);
  } catch (error) {
    // Fallback: Heuristic evaluation
    return heuristicEvaluate(content);
  }
}
```

### 7. Rate Limit Manager (`src/rate-limiter/`)

```typescript
// Token bucket algorithm
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
    await sleep(waitTime);
    this.refill();
    this.tokens -= tokens;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillRate,
    );
    this.lastRefill = now;
  }
}

// Adaptive rate limiting based on API responses
class AdaptiveRateLimiter {
  private currentDelay: number = 1000;
  private readonly minDelay = 500;
  private readonly maxDelay = 10000;

  onSuccess(): void {
    this.currentDelay = Math.max(this.minDelay, this.currentDelay * 0.9);
  }

  onRateLimited(retryAfter: number): void {
    this.currentDelay = Math.min(this.maxDelay, retryAfter * 1000);
  }

  onError(): void {
    this.currentDelay = Math.min(this.maxDelay, this.currentDelay * 1.5);
  }
}
```

### 8. Semantic Uniqueness (`src/semantic/`)

```typescript
// Embedding-based similarity checking
class SemanticChecker {
  async checkUniqueness(
    content: ContentSpec,
    threshold: number = 0.85,
  ): Promise<SemanticResult> {
    const embedding = await this.embed(content);

    // Search in vector store
    const similar = await this.vectorStore.search(embedding, {
      filter: { channelId: content.channelId },
      limit: 10,
    });

    // Calculate similarity scores
    const scores = similar.map((item) => ({
      id: item.id,
      similarity: cosineSimilarity(embedding, item.embedding),
      content: item.content,
    }));

    // Check all scores against threshold
    const duplicates = scores.filter((s) => s.similarity >= threshold);

    return {
      isUnique: duplicates.length === 0,
      maxSimilarity: scores[0]?.similarity ?? 0,
      similarItems: duplicates,
      recommendations: this.generateRecommendations(scores),
    };
  }
}
```

### 9. Batch Request Manager (`src/batching/`)

```typescript
// Intelligent request batching
class BatchManager {
  private queue: QueuedRequest[] = [];
  private readonly maxBatchSize = 10;
  private readonly maxWaitTime = 1000; // ms

  async add(request: GenerationRequest): Promise<ContentResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject, timestamp: Date.now() });
      this.scheduleFlush();
    });
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.maxBatchSize);
    const requests = batch.map((item) => item.request);

    try {
      const results = await this.executeBatch(requests);
      results.forEach((result, i) => {
        batch[i].resolve(result);
      });
    } catch (error) {
      batch.forEach((item) => item.reject(error));
    }
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;

    this.flushScheduled = true;
    setTimeout(() => {
      this.flushScheduled = false;
      this.flush();
    }, this.maxWaitTime);
  }
}
```

### 10. Intelligent Scheduler (`src/scheduler/`)

```typescript
// Gap-based priority scheduling
class IntelligentScheduler {
  async calculatePriorities(): Promise<PriorityMap> {
    const gaps = await this.analyzer.analyzeGaps();
    const contentCounts = await this.db.getContentCounts();
    const recentActivity = await this.db.getRecentGeneration();

    return this.computePriorities(gaps, contentCounts, recentActivity);
  }

  private computePriorities(
    gaps: GapAnalysis,
    counts: ContentCounts,
    activity: RecentActivity,
  ): PriorityMap {
    const priorities: PriorityMap = {};

    for (const channel of this.channels) {
      for (const type of this.contentTypes) {
        const score = this.calculateScore(
          gaps.getScore(channel.id, type),
          counts.getRatio(channel.id, type),
          activity.getRecency(channel.id, type),
        );

        priorities[`${channel.id}:${type}`] = {
          channelId: channel.id,
          contentType: type,
          score,
          recommendedCount: this.calculateCount(score),
          reason: this.generateReason(score, gaps, counts),
        };
      }
    }

    return priorities;
  }
}

// Gap analysis dimensions
interface GapAnalysis {
  coverage: Map<string, number>; // Topic coverage percentage
  balance: Map<string, number>; // Content type distribution
  recency: Map<string, number>; // Days since last generation
  quality: Map<string, number>; // Average quality scores
}
```

### 11. WebSocket Streaming (`src/websocket/`)

```typescript
// Server-side WebSocket manager
class StreamingServer {
  private clients: Map<string, WebSocket> = new Map();

  async streamContent(
    clientId: string,
    jobId: string,
    updates: AsyncIterable<GenerationUpdate>,
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error("Client not connected");

    for await (const update of updates) {
      client.send(
        JSON.stringify({
          type: "generation_update",
          jobId,
          ...update,
        }),
      );
    }
  }
}

// Client-side hook
function useContentStream(jobId: string) {
  const [updates, setUpdates] = useState<GenerationUpdate[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const ws = new WebSocket(`ws://api/content/stream/${jobId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setUpdates((prev) => [...prev, update]);
    };

    ws.onclose = () => setConnection("disconnected");
    ws.onopen = () => setConnection("connected");

    return () => ws.close();
  }, [jobId]);

  return { updates, connection };
}
```

### 12. Content Versioning (`src/versions/`)

```typescript
interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  data: ContentSpec;
  checksum: string;
  createdAt: Date;
  createdBy: string;
  changeReason: string;
  parentVersionId?: string;
}

class VersionManager {
  async createVersion(
    contentId: string,
    newData: ContentSpec,
    reason: string,
  ): Promise<ContentVersion> {
    const latest = await this.getLatest(contentId);
    const version = latest ? latest.version + 1 : 1;

    const contentVersion: ContentVersion = {
      id: generateId("ver"),
      contentId,
      version,
      data: newData,
      checksum: this.calculateChecksum(newData),
      createdAt: new Date(),
      createdBy: this.currentUser,
      changeReason: reason,
      parentVersionId: latest?.id,
    };

    await this.storage.saveVersion(contentVersion);
    await this.storage.updateLatest(contentId, contentVersion.id);

    return contentVersion;
  }

  async rollback(
    contentId: string,
    targetVersion: number,
  ): Promise<ContentVersion> {
    const target = await this.getVersion(contentId, targetVersion);
    if (!target) throw new Error("Version not found");

    return this.createVersion(
      contentId,
      target.data,
      `Rollback to v${targetVersion}`,
    );
  }
}
```

### 13. Analytics Dashboard (`src/analytics/`)

```typescript
interface DashboardMetrics {
  generationStats: {
    totalGenerated: number;
    successRate: number;
    averageQuality: number;
    averageLatency: number;
    byChannel: Map<string, ChannelStats>;
    byType: Map<string, TypeStats>;
  };
  queueStats: {
    pending: number;
    processing: number;
    failed: number;
    averageWaitTime: number;
  };
  apiHealth: {
    successRate: number;
    rateLimitHits: number;
    circuitBreakerState: CircuitState;
  };
}

// Real-time metrics collection
class MetricsCollector {
  private metrics: MetricsBuffer = new MetricsBuffer(60); // 1-minute window

  recordGeneration(job: ContentJob, result: GenerationResult): void {
    this.metrics.push({
      type: "generation",
      jobType: job.type,
      channelId: job.channelId,
      success: result.success,
      quality: result.quality,
      latency: result.latency,
      timestamp: Date.now(),
    });
  }

  getStats(): DashboardMetrics {
    return {
      generationStats: this.calculateGenerationStats(),
      queueStats: this.calculateQueueStats(),
      apiHealth: this.calculateApiHealth(),
    };
  }
}
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. REQUEST RECEIVED                                                          │
│     ┌─────────────┐                                                          │
│     │   Client    │ ──── POST /api/content/generate                         │
│     └──────┬──────┘                                                          │
│            │                                                                 │
│  2. VALIDATION & QUEUING                                                     │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│     │   Gateway   │ ──► │  Validator  │ ──► │    Queue    │                │
│     │   (Rate)    │     │   (Schema)  │     │   (BullMQ)  │                │
│     └─────────────┘     └─────────────┘     └──────┬──────┘                │
│                                                      │                       │
│  3. SCHEDULING & PRIORITIZATION                                              │
│            │                                                                 │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│     │ Scheduler   │ ──► │ Gap Analyzer│ ──► │  Priority   │                │
│     │ (Cron)      │     │             │     │   Queue     │                │
│     └─────────────┘     └─────────────┘     └──────┬──────┘                │
│                                                      │                       │
│  4. WORKER PROCESSING                                                       │
│            │                                                                 │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│     │   Worker    │ ──► │   Retry     │ ──► │   Circuit   │                │
│     │   Pool      │     │   Manager   │     │   Breaker   │                │
│     └──────┬──────┘     └─────────────┘     └─────────────┘                │
│            │                                                                 │
│  5. AI GENERATION                                                            │
│            │                                                                 │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│     │  API Client │ ──► │Rate Limiter │ ──► │  Pollinations│                │
│     │             │     │             │     │     API      │                │
│     └──────┬──────┘     └─────────────┘     └─────────────┘                │
│            │                                                                 │
│  6. POST-PROCESSING                                                          │
│            │                                                                 │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│     │    JSON     │ ──► │ Dedup Check │ ──► │  Quality    │                │
│     │   Parser    │     │             │     │  Validator  │                │
│     └─────────────┘     └─────────────┘     └──────┬──────┘                │
│                                                       │                       │
│  7. STORAGE & INDEXING                                                        │
│            │                                                                 │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│     │   SQLite    │ ──► │  Vector DB  │ ──► │   Cache     │                │
│     │             │     │  (Embed)    │     │   (LRU)     │                │
│     └─────────────┘     └─────────────┘     └─────────────┘                │
│                                                                               │
│  8. RESPONSE DELIVERY                                                         │
│            │                                                                 │
│            ▼                                                                 │
│     ┌─────────────┐     ┌─────────────┐                                      │
│     │  Versioning │ ──► │  WebSocket  │ ─── Real-time updates                │
│     │             │     │   (Push)    │                                      │
│     └─────────────┘     └─────────────┘                                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## API Design

### REST Endpoints

```typescript
// Content Generation
POST   /api/v1/content/generate     // Queue generation job
POST   /api/v1/content/batch         // Batch generation
GET    /api/v1/content/:id           // Get generated content
GET    /api/v1/content               // List with filters
PUT    /api/v1/content/:id           // Update content
DELETE /api/v1/content/:id           // Soft delete

// Job Management
GET    /api/v1/jobs                  // List jobs
GET    /api/v1/jobs/:id              // Job status
POST   /api/v1/jobs/:id/retry        // Retry failed job
DELETE /api/v1/jobs/:id              // Cancel job

// Scheduler
GET    /api/v1/scheduler/priorities  // Get content priorities
POST   /api/v1/scheduler/trigger     // Trigger scheduled generation

// Analytics
GET    /api/v1/analytics/dashboard   // Dashboard metrics
GET    /api/v1/analytics/quality      // Quality trends
GET    /api/v1/analytics/generation   // Generation stats

// Versioning
GET    /api/v1/content/:id/versions   // List versions
POST   /api/v1/content/:id/rollback   // Rollback to version
GET    /api/v1/content/:id/diff/:v1/:v2  // Compare versions

// Admin
POST   /api/v1/admin/pause            // Pause queue
POST   /api/v1/admin/resume           // Resume queue
GET    /api/v1/admin/health           // System health
POST   /api/v1/admin/cache/clear      // Clear cache
```

### WebSocket Events

```typescript
// Client → Server
interface ClientEvents {
  "subscribe:job": { jobId: string };
  "subscribe:channel": { channelId: string };
  "unsubscribe:job": { jobId: string };
}

// Server → Client
interface ServerEvents {
  "job:started": { jobId: string; type: ContentType };
  "job:progress": { jobId: string; progress: number; phase: string };
  "job:completed": { jobId: string; content: GeneratedContent };
  "job:failed": { jobId: string; error: string; retryable: boolean };
  "job:retrying": { jobId: string; attempt: number; delay: number };
  "quality:score": { jobId: string; score: QualityReport };
  "queue:stats": { pending: number; processing: number };
}
```

---

## Error Handling Strategy

### Error Classification

```typescript
enum ErrorSeverity {
  TRANSIENT = "transient", // Network timeout - retry
  RATE_LIMIT = "rate_limit", // 429 response - backoff
  VALIDATION = "validation", // Bad input - reject
  PARSE = "parse", // JSON parse - try alternate
  QUALITY = "quality", // Low quality - regenerate
  FATAL = "fatal", // System error - escalate
}

interface ErrorHandler {
  classify(error: Error): ErrorSeverity;
  handle(error: Error, context: ErrorContext): RecoveryAction;
}

// Recovery actions
type RecoveryAction =
  | { action: "retry"; delay?: number }
  | { action: "retry_with_backoff"; maxAttempts?: number }
  | { action: "alternate_strategy" }
  | { action: "reject"; reason: string }
  | { action: "escalate"; notification: Alert };
```

### Circuit Breaker Configuration

```typescript
const CIRCUIT_BREAKER = {
  failureThreshold: 5, // Open after 5 failures
  successThreshold: 2, // Close after 2 successes
  timeout: 60000, // Try half-open after 60s
  halfOpenRequests: 3, // Test with 3 requests
};
```

---

## Scaling Considerations

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER                              │
│                   (nginx / HAProxy)                            │
└───────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  API Server   │    │  API Server   │    │  API Server   │
│    (Node.js)  │    │    (Node.js)  │    │    (Node.js)  │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                             │                                   │
▼                             ▼                                   ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    Worker     │    │    Worker     │    │    Worker     │
│   (Thread)    │    │   (Thread)   │    │   (Thread)    │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │  Redis  │    │  Redis  │    │  Redis  │
        │(Queue)  │    │(Queue)  │    │(PubSub) │
        └─────────┘    └─────────┘    └─────────┘
              │               │               │
              └───────────────┴───────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
        ┌─────────┐                    ┌─────────────┐
        │ SQLite  │                    │   Vector    │
        │  (WAL)  │                    │   Store     │
        └─────────┘                    └─────────────┘
```

### Capacity Planning

| Component    | Scaling Trigger      | Action                                |
| ------------ | -------------------- | ------------------------------------- |
| API Servers  | CPU > 70%            | Scale horizontally                    |
| Workers      | Queue depth > 100    | Add workers                           |
| Redis        | Memory > 80%         | Cluster sharding                      |
| SQLite       | Write latency > 50ms | Move to PostgreSQL                    |
| Vector Store | > 1M vectors         | Switch to dedicated (Pinecone/Milvus) |

### Performance Targets

- P50 latency: < 2 seconds
- P95 latency: < 10 seconds
- P99 latency: < 30 seconds
- Success rate: > 98%
- Quality pass rate: > 85%

---

## File Structure

```
content-gen/
├── src/
│   ├── index.ts                    # Entry point
│   ├── cli.ts                      # CLI interface
│   │
│   ├── queue/                      # Job queue system
│   │   ├── manager.ts
│   │   ├── priority.ts
│   │   ├── deduplication.ts
│   │   └── types.ts
│   │
│   ├── retry/                      # Retry & circuit breaker
│   │   ├── engine.ts
│   │   ├── circuit-breaker.ts
│   │   └── backoff.ts
│   │
│   ├── parsing/                    # JSON parsing
│   │   ├── parser.ts
│   │   ├── strategies.ts
│   │   └── validator.ts
│   │
│   ├── workers/                    # Worker thread pool
│   │   ├── pool.ts
│   │   ├── worker.ts
│   │   └── messages.ts
│   │
│   ├── quality/                    # Quality validation
│   │   ├── validator.ts
│   │   ├── criteria.ts
│   │   └── llm-evaluator.ts
│   │
│   ├── rate-limiter/               # Rate limiting
│   │   ├── token-bucket.ts
│   │   ├── adaptive.ts
│   │   └── api-monitor.ts
│   │
│   ├── semantic/                    # Vector similarity
│   │   ├── embedder.ts
│   │   ├── similarity.ts
│   │   └── store.ts
│   │
│   ├── batching/                    # Request batching
│   │   ├── batch-manager.ts
│   │   └── optimizer.ts
│   │
│   ├── scheduler/                  # Intelligent scheduling
│   │   ├── scheduler.ts
│   │   ├── gap-analyzer.ts
│   │   └── priority-queue.ts
│   │
│   ├── websocket/                  # Real-time streaming
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── protocol.ts
│   │
│   ├── versions/                   # Content versioning
│   │   ├── manager.ts
│   │   ├── storage.ts
│   │   └── diff.ts
│   │
│   ├── analytics/                  # Analytics & monitoring
│   │   ├── collector.ts
│   │   ├── dashboard.ts
│   │   └── reporter.ts
│   │
│   ├── providers/                   # AI provider clients
│   │   ├── pollinations.ts
│   │   ├── fallback.ts
│   │   └── router.ts
│   │
│   ├── storage/                     # Data storage
│   │   ├── sqlite.ts
│   │   ├── migrations.ts
│   │   └── cache.ts
│   │
│   ├── api/                         # REST API
│   │   ├── routes.ts
│   │   ├── middleware.ts
│   │   └── controllers/
│   │
│   └── utils/                       # Utilities
│       ├── logger.ts
│       ├── config.ts
│       └── helpers.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│   ├── migrate-v1.ts
│   ├── seed-data.ts
│   └── benchmark.ts
│
├── config/
│   ├── default.yaml
│   ├── production.yaml
│   └── development.yaml
│
├── ARCHITECTURE.md                  # This document
├── todo.md                          # Implementation tracking
└── package.json
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Project scaffolding with TypeScript
- [ ] SQLite schema migration
- [ ] Basic job queue with BullMQ
- [ ] Worker thread pool

### Phase 2: Reliability (Week 2)

- [ ] Retry engine with exponential backoff
- [ ] Circuit breaker implementation
- [ ] Multi-strategy JSON parser
- [ ] Rate limiter with adaptive throttling

### Phase 3: Intelligence (Week 3)

- [ ] Vector store integration
- [ ] Semantic uniqueness checking
- [ ] LLM quality validation
- [ ] Content deduplication

### Phase 4: Optimization (Week 4)

- [ ] Request batching
- [ ] Intelligent scheduling
- [ ] Gap analyzer
- [ ] Priority queue

### Phase 5: Real-time (Week 5)

- [ ] WebSocket streaming
- [ ] Frontend integration
- [ ] Progress notifications
- [ ] Live dashboard

### Phase 6: Polish (Week 6)

- [ ] Content versioning
- [ ] Rollback support
- [ ] Analytics dashboard
- [ ] Performance tuning

---

## Comparison: Current vs Architecture v2.0

| Feature           | Current             | v2.0                                  | Improvement |
| ----------------- | ------------------- | ------------------------------------- | ----------- |
| Retry Logic       | None                | Exponential backoff + circuit breaker | ∞           |
| JSON Parsing      | 3 strategies        | 10+ strategies                        | 3.3x        |
| Parallelism       | Promise.all batches | Worker threads                        | 4-8x        |
| Deduplication     | None                | Semantic + exact                      | ∞           |
| Quality Scoring   | Field presence      | LLM evaluation                        | 10x         |
| Rate Limiting     | None                | Token bucket + adaptive               | ∞           |
| Semantic Check    | None                | Vector similarity                     | ∞           |
| Request Batching  | None                | Intelligent batching                  | 5-10x       |
| Scheduling        | Round-robin         | Gap-based priority                    | 5x          |
| Real-time Updates | None                | WebSocket streaming                   | ∞           |
| Versioning        | None                | Full version control                  | ∞           |
| Analytics         | None                | Comprehensive dashboard               | ∞           |

---

## Next Steps

1. Review this architecture with team
2. Prioritize implementation phases
3. Create detailed technical specs for Phase 1
4. Set up project scaffolding
5. Begin implementation

---

_Document Version: 2.0.0_  
_Last Updated: 2026-03-20_  
_Author: Architecture Team_
