# DevPrep API Integration Specification

**Version**: 1.0.0  
**Last Updated**: 2026-03-22  
**Author**: API_INTEGRATION_ARCHITECT

---

## Table of Contents

1. [API Endpoints Documentation](#1-api-endpoints-documentation)
2. [Frontend API Client](#2-frontend-api-client)
3. [Data Hooks Specification](#3-data-hooks-specification)
4. [Data Transformation Layer](#4-data-transformation-layer)
5. [Offline/Error Handling](#5-offlineerror-handling)

---

## 1. API Endpoints Documentation

### Base URL Configuration

| Environment | Base URL                                   |
| ----------- | ------------------------------------------ |
| Development | `http://localhost:3001`                    |
| Production  | Configured via `VITE_API_URL` env variable |
| Vite Proxy  | `/api` → `http://localhost:3001`           |

---

### 1.1 GET `/api/content`

**Description**: List all content with optional filtering.

**Request Parameters** (Query String):

| Parameter | Type   | Required | Default | Description                                                                 |
| --------- | ------ | -------- | ------- | --------------------------------------------------------------------------- |
| `channel` | string | No       | -       | Filter by channel ID (e.g., `devops`, `javascript`)                         |
| `type`    | string | No       | -       | Filter by content type (`question`, `flashcard`, `exam`, `voice`, `coding`) |
| `status`  | string | No       | -       | Filter by status (`pending`, `approved`, `published`, `rejected`)           |
| `quality` | number | No       | -       | Minimum quality score (0-1)                                                 |
| `limit`   | number | No       | 100     | Maximum records to return                                                   |
| `offset`  | number | No       | 0       | Number of records to skip                                                   |
| `since`   | number | No       | -       | Unix timestamp - only return records created after this time                |

**Response Format** (HTTP 200):

```typescript
interface ContentResponse {
  ok: true;
  data: ContentRecord[];
  count: number;
}
```

**ContentRecord Structure**:

```typescript
interface ContentRecord {
  id: string; // Unique identifier (e.g., "devops-questions-001")
  channel_id: string; // Channel identifier (e.g., "devops")
  content_type: ContentType; // Type of content
  difficulty: string; // Difficulty level: "beginner" | "intermediate" | "advanced" | "easy" | "medium" | "hard"
  tags: string[]; // Array of tags (max 5, first = channel slug)
  data: Record<string, unknown>; // Full JSON payload (type-specific)
  quality_score: number; // Quality score (0-1)
  embedding_id: string | null; // Vector embedding ID
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  status: ContentStatus; // "pending" | "approved" | "published" | "rejected"
  generated_by: string | null; // Generator identifier
  generation_time_ms: number | null; // Generation time in milliseconds
}
```

**Error Responses**:

| Status | Body                                              | Cause                    |
| ------ | ------------------------------------------------- | ------------------------ |
| 500    | `{ ok: false, error: "Failed to fetch content" }` | Database or server error |

**Caching Strategy**:

- **Redis TTL**: 300 seconds (5 minutes)
- **Cache Key Pattern**: `devprep:content:channel={channel}&type={type}&...`
- **Invalidation**: On any content mutation (POST /api/generate, database changes)
- **Fallback**: Falls back to direct DB query if Redis unavailable

**Example Request**:

```bash
# Get all DevOps content with quality >= 0.8
GET /api/content?channel=devops&quality=0.8&limit=50

# Get all questions from JavaScript channel
GET /api/content?type=question&channel=javascript
```

---

### 1.2 GET `/api/content/:type`

**Description**: List content filtered by specific type.

**Path Parameters**:

| Parameter | Type   | Required | Description                                                      |
| --------- | ------ | -------- | ---------------------------------------------------------------- |
| `type`    | string | Yes      | Content type: `question`, `flashcard`, `exam`, `voice`, `coding` |

**Query Parameters**: Same as `/api/content`

**Response Format** (HTTP 200):

```typescript
interface TypedContentResponse {
  ok: true;
  data: ContentRecord[];
  count: number;
}
```

**Error Responses**:

| Status | Body                                              | Cause                  |
| ------ | ------------------------------------------------- | ---------------------- |
| 400    | `{ ok: false, error: "Invalid content type" }`    | Type not in valid list |
| 500    | `{ ok: false, error: "Failed to fetch content" }` | Server error           |

**Caching Strategy**: Same as `/api/content`

**Example Request**:

```bash
GET /api/content/question?channel=devops&status=approved
GET /api/content/flashcard?limit=25&quality=0.9
```

---

### 1.3 GET `/api/content/stats`

**Description**: Get aggregated content statistics.

**Response Format** (HTTP 200):

```typescript
interface StatsResponse {
  ok: true;
  stats: {
    total: number;
    question: number;
    flashcard: number;
    exam: number;
    voice: number;
    coding: number;
  };
}
```

**Caching Strategy**:

- **Redis TTL**: 300 seconds
- **Cache Key**: `devprep:stats`
- **Invalidation**: On content count changes

---

### 1.4 GET `/api/content/tagged/:tag`

**Description**: Get content filtered by specific tag.

**Path Parameters**:

| Parameter | Type   | Required | Description                                |
| --------- | ------ | -------- | ------------------------------------------ |
| `tag`     | string | Yes      | Tag to filter by (e.g., `docker`, `ci-cd`) |

**Query Parameters**:

| Parameter | Type   | Required | Default | Description     |
| --------- | ------ | -------- | ------- | --------------- |
| `limit`   | number | No       | 50      | Max records     |
| `offset`  | number | No       | 0       | Records to skip |

**Response Format** (HTTP 200):

```typescript
interface TaggedContentResponse {
  ok: true;
  data: ContentRecord[];
  count: number;
  tag: string;
}
```

**Caching Strategy**:

- **Redis TTL**: 300 seconds
- **Cache Key Pattern**: `devprep:tagged:{tag}:limit={limit}&offset={offset}`
- **Invalidation**: On tagged content changes

---

### 1.5 GET `/api/channels`

**Description**: List all available channels.

**Response Format** (HTTP 200):

```typescript
interface ChannelsResponse {
  ok: true;
  data: Channel[];
}

interface Channel {
  id: string; // Channel slug (e.g., "devops")
  name: string; // Display name (e.g., "DevOps")
}
```

**Pre-configured Channels**:

| ID            | Name                               |
| ------------- | ---------------------------------- |
| javascript    | JavaScript                         |
| typescript    | TypeScript                         |
| react         | React                              |
| algorithms    | Algorithms                         |
| system-design | System Design                      |
| devops        | DevOps                             |
| networking    | Networking                         |
| terraform     | Terraform                          |
| aws-saa       | AWS Solutions Architect            |
| aws-dev       | AWS Developer                      |
| cka           | Certified Kubernetes Administrator |

**Caching Strategy**: No Redis caching (static data)

---

### 1.6 GET `/api/channels/:channelId/content`

**Description**: Get all content for a specific channel.

**Path Parameters**:

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `channelId` | string | Yes      | Channel identifier |

**Query Parameters**: Same as `/api/content`

**Response Format** (HTTP 200):

```typescript
interface ChannelContentResponse {
  ok: true;
  data: ContentRecord[];
  count: number;
}
```

**Caching Strategy**:

- **Redis TTL**: 300 seconds
- **Cache Key Pattern**: `devprep:channel:{channelId}:type={type}&...`
- **Invalidation**: On channel content changes

**Example Request**:

```bash
GET /api/channels/devops/content?type=question&status=approved
```

---

### 1.7 POST `/api/generate`

**Description**: Generate new content programmatically.

**Request Body**:

```typescript
interface GenerateRequest {
  channel: string; // Required: Channel ID
  type: ContentType; // Required: Content type to generate
  count?: number; // Optional: Number to generate (1-10, default: 1)
  difficulty?: string; // Optional: "beginner" | "intermediate" | "advanced"
}
```

**Response Format** (HTTP 201):

```typescript
interface GenerateResponse {
  ok: true;
  message: string;
  data: Array<{
    id: string;
    channel_id: string;
    content_type: string;
  }>;
  generation_time_ms: number;
}
```

**Error Responses**:

| Status | Body                                                                | Cause          |
| ------ | ------------------------------------------------------------------- | -------------- |
| 400    | `{ ok: false, error: "Missing required fields: channel and type" }` | Missing fields |
| 400    | `{ ok: false, error: "Invalid content type..." }`                   | Invalid type   |
| 500    | `{ ok: false, error: "Failed to generate content" }`                | Server error   |

**Rate Limiting**: 5 requests per minute per IP

**Side Effects**:

- Invalidates all content caches
- Broadcasts `db_updated` WebSocket event

---

### 1.8 GET `/api/health`

**Description**: Health check endpoint.

**Response Format** (HTTP 200):

```typescript
interface HealthResponse {
  ok: true;
  timestamp: number;
  dbPath: string;
  redis: "InMemoryRedis" | "disabled";
}
```

---

## 2. Frontend API Client

### 2.1 Base Configuration

**File**: `src/services/contentApi.ts`

```typescript
// Environment-based configuration
const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Auto-detects HTTP vs proxy based on environment
const baseUrl = API_BASE.startsWith("http")
  ? API_BASE
  : `${window.location.origin}${API_BASE}`;
```

### 2.2 Request/Response Interceptors

**Request Interceptor Pattern** (recommended implementation):

```typescript
interface RequestInterceptor {
  beforeRequest?: (config: RequestInit) => RequestInit;
  headers?: Record<string, string>;
}

const defaultHeaders = {
  "Content-Type": "application/json",
};
```

**Response Interceptor Pattern**:

```typescript
interface ResponseInterceptor {
  onSuccess?: <T>(data: T) => T;
  onError?: (error: Error) => void;
  retry?: boolean;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  count?: number;
  stats?: ContentStats;
  error?: string;
}
```

### 2.3 Error Handling Pattern

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Unified error handling
function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new ApiError("Network error - check connection", 0, "NETWORK_ERROR");
  }

  return new ApiError(
    error instanceof Error ? error.message : "Unknown error",
    500,
    "UNKNOWN",
  );
}
```

**Error Codes**:

| Code             | HTTP Status | Description             |
| ---------------- | ----------- | ----------------------- |
| `NETWORK_ERROR`  | 0           | Connection failed       |
| `INVALID_TYPE`   | 400         | Invalid content type    |
| `MISSING_FIELDS` | 400         | Missing required fields |
| `RATE_LIMITED`   | 429         | Too many requests       |
| `SERVER_ERROR`   | 500         | Internal server error   |
| `PARSE_ERROR`    | 500         | JSON parse failure      |

### 2.4 Retry Logic

**Configuration** (from `queryClient.ts`):

```typescript
// React Query default retry config
{
  retry: 1,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
}

// Mutation retry config
{
  retry: 2,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000),
}
```

**Custom Retry Hook** (`useRetry.ts`):

```typescript
interface RetryOptions {
  maxAttempts?: number; // Default: 3
  delayMs?: number; // Default: 1000
  backoff?: boolean; // Default: true (exponential)
  onRetry?: (attempt: number, error: Error) => void;
  onError?: (error: Error, attempts: number) => void;
}

// Usage
const { execute, attempts, isRetrying, lastError } = useRetry(fetchData, {
  maxAttempts: 3,
  backoff: true,
  onRetry: (attempt, error) =>
    console.log(`Retry ${attempt}: ${error.message}`),
});
```

### 2.5 Timeout Configuration

```typescript
// Default fetch timeout (recommended)
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Per-endpoint timeouts
const TIMEOUTS = {
  health: 5000, // 5s - health checks should be fast
  content: 30000, // 30s - content fetches
  generate: 60000, // 60s - generation can take longer
};

// Fetch with timeout helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
```

---

## 3. Data Hooks Specification

### 3.1 `useContent(options)`

**File**: `src/hooks/useContent.ts`

**Parameters**:

```typescript
interface UseContentOptions {
  channelId?: string; // Filter by channel
  type?: ContentType; // Filter by content type
  status?: ContentStatus; // Filter by status
  minQuality?: number; // Minimum quality score
  limit?: number; // Limit results
  enabled?: boolean; // Enable/disable query (default: true)
}
```

**Return Type**:

```typescript
interface UseContentResult {
  items: ContentItem[]; // Filtered content items
  stats: ContentStats | null; // Content statistics
  isLoading: boolean; // Loading state
  isError: boolean; // Error state
  error: Error | null; // Error object
  refetch: () => Promise<unknown>; // Manual refetch function
}
```

**ContentItem Structure**:

```typescript
interface ContentItem {
  id: string;
  channelId: string;
  contentType: ContentType;
  data: unknown;
  qualityScore: number;
  createdAt: number;
  updatedAt: number;
  status: "pending" | "approved" | "rejected";
}
```

**Usage Example**:

```typescript
// Basic usage
const { items, isLoading, error } = useContent();

// Filter by channel and type
const { items: devopsQuestions } = useContent({
  channelId: "devops",
  type: "question",
  status: "approved",
});

// Conditional fetching
const { items } = useContent({
  channelId: selectedChannel,
  enabled: !!selectedChannel,
});
```

**Caching**: React Query with `staleTime: 30_000` (30 seconds)

---

### 3.2 `useContentByChannel(channelId, enabled)`

**Description**: Convenience wrapper for fetching content by channel.

**Parameters**:

| Parameter   | Type           | Required | Default | Description          |
| ----------- | -------------- | -------- | ------- | -------------------- |
| `channelId` | string \| null | Yes      | -       | Channel ID to filter |
| `enabled`   | boolean        | No       | true    | Enable/disable query |

**Return Type**: Same as `useContent`

**Usage**:

```typescript
const { items, isLoading } = useContentByChannel("devops");
```

---

### 3.3 `useContentByType(type, enabled)`

**Description**: Convenience wrapper for fetching content by type.

**Parameters**:

| Parameter | Type                | Required | Default | Description            |
| --------- | ------------------- | -------- | ------- | ---------------------- |
| `type`    | ContentType \| null | Yes      | -       | Content type to filter |
| `enabled` | boolean             | No       | true    | Enable/disable query   |

**Return Type**: Same as `useContent`

**Usage**:

```typescript
const { items: questions } = useContentByType("question");
```

---

### 3.4 `useContentStats()`

**Description**: Fetch aggregated content statistics.

**Return Type**:

```typescript
interface UseStatsResult {
  stats: ContentStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

interface ContentStats {
  totalItems: number;
  byType: Record<ContentType, number>;
  byChannel: Record<string, number>;
  lastFetched: number | null;
}
```

**Caching**: React Query with `staleTime: 60_000` (60 seconds)

**Usage**:

```typescript
const { stats, isLoading } = useContentStats();

// Access individual stats
console.log(stats.totalItems);
console.log(stats.byType.question);
```

---

### 3.5 `useChannels()`

**File**: `src/hooks/useChannels.ts`

**Description**: Fetch available channels with DB sync.

**Return Type**:

```typescript
interface Channel {
  id: string;
  name: string;
  shortName?: string;
  emoji?: string;
  color?: string;
  type?: string;
  certCode?: string;
  description?: string;
  tagFilter?: string[];
}

function useChannels(): Channel[];
```

**Behavior**:

- Returns static channels initially (fallback)
- Syncs with SQLite DB when available
- Re-renders when DB channels load

**Usage**:

```typescript
const channels = useChannels();
```

---

### 3.6 `useGeneratedContent()`

**File**: `src/hooks/useGeneratedContent.ts`

**Description**: Fetch and cache all generated content with offline support.

**Return Type**:

```typescript
interface UseGeneratedContentResult {
  generated: GeneratedContentMap;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  parseErrors?: Array<{ type: string; message: string }>;
}

interface GeneratedContentMap {
  question?: Question[];
  flashcard?: Flashcard[];
  exam?: ExamQuestion[];
  voice?: VoicePrompt[];
  coding?: CodingChallenge[];
}
```

**Caching Strategy**:

- Memory cache (Map)
- LocalStorage cache with 2-minute TTL
- Automatic fallback to cache on API failure

**Usage**:

```typescript
const { generated, loading, error, refresh } = useGeneratedContent();

// Access by type
const questions = generated.question;
const flashcards = generated.flashcard;
```

---

### 3.7 `useOptimisticContent()`

**Description**: Optimistic updates for content mutations.

**Return Type**:

```typescript
interface UseOptimisticContentResult {
  pendingUpdates: ContentItem[];
  addContent: (item: ContentItem) => Promise<void>;
  updateContent: (id: string, updates: Partial<ContentItem>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
}
```

**Usage**:

```typescript
const { addContent, updateContent, deleteContent, pendingUpdates } =
  useOptimisticContent();

// Optimistically add content
await addContent({
  id: "new-item-id",
  channelId: "devops",
  contentType: "question",
  // ...other fields
});
```

---

## 4. Data Transformation Layer

### 4.1 API to Frontend Mapping

**Server Record** (`ContentRecord`):

```typescript
interface ContentRecord {
  id: string;
  channel_id: string; // snake_case
  content_type: string; // snake_case
  difficulty: string;
  tags: string[];
  data: Record<string, unknown>; // Type-specific payload
  quality_score: number; // snake_case
  created_at: number; // snake_case
  updated_at: number; // snake_case
  status: string;
  // ...
}
```

**Frontend Item** (`ContentItem`):

```typescript
interface ContentItem {
  id: string;
  channelId: string; // camelCase
  contentType: ContentType; // camelCase
  difficulty: string;
  tags: string[];
  data: unknown;
  qualityScore: number; // camelCase
  createdAt: number; // camelCase
  updatedAt: number; // camelCase
  status: ContentStatus;
  // ...
}
```

### 4.2 Transformation Functions

**Record to Item** (`useContent.ts`):

```typescript
function transformRecord(record: ContentRecord): ContentItem {
  return {
    id: record.id,
    channelId: record.channel_id,
    contentType: record.content_type as ContentType,
    difficulty: record.difficulty,
    tags: Array.isArray(record.tags) ? record.tags : JSON.parse(record.tags),
    data:
      typeof record.data === "string" ? JSON.parse(record.data) : record.data,
    qualityScore: record.quality_score,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    status: mapStatus(record.status),
  };
}

function mapStatus(status: string): ContentItem["status"] {
  if (status === "published" || status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}
```

**Server Transformation** (`server/src/index.ts`):

```typescript
function transformRecord(record: ContentRecord): Record<string, unknown> {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(record.data);
  } catch {
    // Keep empty on parse failure
  }
  return {
    ...record,
    difficulty: record.difficulty,
    tags:
      typeof record.tags === "string" ? JSON.parse(record.tags) : record.tags,
    data: parsed,
  };
}
```

### 4.3 Normalization Strategies

**Content Type Normalization**:

```typescript
const VALID_CONTENT_TYPES = [
  "question",
  "flashcard",
  "exam",
  "voice",
  "coding",
] as const;

function normalizeContentType(type: string): ContentType | null {
  const normalized = type.toLowerCase().trim();
  if (VALID_CONTENT_TYPES.includes(normalized as ContentType)) {
    return normalized as ContentType;
  }
  return null;
}
```

**Difficulty Normalization**:

```typescript
const VALID_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced", // Tech channels
  "easy",
  "medium",
  "hard", // Cert/coding channels
] as const;

function normalizeDifficulty(difficulty: string): string {
  const normalized = difficulty?.toLowerCase().trim();
  return VALID_DIFFICULTIES.includes(normalized as any)
    ? normalized
    : "intermediate";
}
```

**Status Normalization**:

```typescript
function normalizeStatus(status: string): ContentStatus {
  switch (status) {
    case "published":
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "pending";
  }
}
```

### 4.4 Cache Invalidation Patterns

**Pattern 1: Full Invalidation on Write**

```typescript
// POST /api/generate
if (isRedisAvailable()) {
  await invalidateContentCache();
}
broadcastUpdate({ type: "db_updated" });
```

**Pattern 2: Pattern-Based Invalidation**

```typescript
// Cache key patterns
`devprep:content:*` // All content
`devprep:channel:*` // Channel content
`devprep:tagged:*` // Tagged content
`devprep:stats`; // Stats only

// Invalidation functions
invalidateContentCache(); // Deletes devprep:content:*
invalidateChannelCache(); // Deletes devprep:channel:*
invalidateTaggedCache(); // Deletes devprep:tagged:*
invalidateAllCache(); // Deletes all devprep:* keys
```

**Pattern 3: Database Watcher Invalidation**

```typescript
// Automatic invalidation on DB changes
dbWatcher = new DatabaseWatcher({
  dbPath: DB_PATH,
  pollInterval: 2000,
  onChange: async () => {
    if (isRedisAvailable()) {
      await invalidateContentCache();
    }
    broadcastUpdate({ type: "db_updated" });
  },
});
```

---

## 5. Offline/Error Handling

### 5.1 Optimistic Updates Pattern

**Implementation Flow**:

```
1. User initiates action
       ↓
2. Update local state immediately (optimistic)
       ↓
3. Send request to server
       ↓
4. On success: Keep local state
   On failure: Rollback to previous state
```

**Code Example** (`useOptimisticContent`):

```typescript
const updateContent = useCallback(
  async (id: string, updates: Partial<ContentItem>) => {
    // 1. Get existing item
    const existing = useContentStore.getState().getItem(id);
    if (!existing) return;

    // 2. Create optimistic item
    const optimisticItem = { ...existing, ...updates };

    // 3. Update store optimistically
    useContentStore.getState().setPendingOptimistic(id, optimisticItem);

    // 4. Update React Query cache
    queryClient.setQueryData<ContentItem[]>(QUERY_KEYS.lists(), (old) =>
      old ? old.map((item) => (item.id === id ? optimisticItem : item)) : [],
    );

    // 5. Confirm (in real implementation, would await server response)
    useContentStore.getState().confirmOptimisticUpdate(id);
  },
  [queryClient],
);
```

### 5.2 Error Recovery Strategies

**Strategy 1: Automatic Retry with Backoff**

```typescript
// From useRetry.ts
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < maxAttempts) {
        const delay = backoff
          ? delayMs * Math.pow(2, attempt - 1) // Exponential: 1s, 2s, 4s
          : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
```

**Strategy 2: Cache Fallback**

```typescript
// useGeneratedContent.ts pattern
async function fetchContent(): Promise<void> {
  // 1. Check memory cache first
  if (memoryCache.has(CACHE_KEY)) {
    setGenerated(memoryCache.get(CACHE_KEY));
    return;
  }

  // 2. Check localStorage cache
  const cached = loadCache();
  if (cached) {
    setGenerated(cached);
    memoryCache.set(CACHE_KEY, cached);
  }

  // 3. Fetch from API
  try {
    const data = await fetchFromApi();
    setGenerated(data);
    saveCache(data);
    memoryCache.set(CACHE_KEY, data);
  } catch (error) {
    // If API fails, keep cached data and show error
    if (cached) {
      setError("Using cached data - refresh when online");
    } else {
      setError("Failed to load content");
    }
  }
}
```

**Strategy 3: Offline Queue**

```typescript
interface QueuedAction {
  id: string;
  type: "ADD" | "UPDATE" | "DELETE";
  payload: unknown;
  timestamp: number;
  retries: number;
}

// Queue actions when offline, process when online
const offlineQueue: QueuedAction[] = [];

async function processOfflineQueue(): Promise<void> {
  while (offlineQueue.length > 0) {
    const action = offlineQueue[0];
    try {
      await executeAction(action);
      offlineQueue.shift();
    } catch (error) {
      if (action.retries >= MAX_RETRIES) {
        offlineQueue.shift();
        notifyUser(`Failed to sync: ${action.type}`);
      } else {
        action.retries++;
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }
    }
  }
}
```

### 5.3 Error State Management

**User-Friendly Error Messages** (`useGeneratedContent.ts`):

```typescript
function getUserFriendlyErrorMessage(errors: ParseError[]): string {
  if (errors.length === 0) return "";

  const uniqueTypes = [...new Set(errors.map((e) => e.type))];

  if (errors.length > 5) {
    return `${errors.length} records failed to load. Content may be incomplete.`;
  }

  if (uniqueTypes.length > 2) {
    return `Some ${uniqueTypes.length} content types failed to load.`;
  }

  return `Unable to load ${uniqueTypes.join(", ")} content. Refresh to retry.`;
}
```

**Error Categories**:

| Category    | User Message                              | Action                       |
| ----------- | ----------------------------------------- | ---------------------------- |
| Network     | "Connection failed. Check your internet." | Retry button                 |
| Server 500  | "Server error. Please try again."         | Retry with backoff           |
| Parse Error | "Some content failed to load."            | Partial display with warning |
| Rate Limit  | "Too many requests. Please wait."         | Disable buttons, countdown   |
| Auth Error  | "Session expired. Please login."          | Redirect to login            |

### 5.4 WebSocket Real-time Updates

**Connection Management**:

```typescript
const WEBSOCKET_CONFIG = {
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  reconnectMultiplier: 2,
  pingInterval: 30000,
  pongTimeout: 5000,
};
```

**Message Types**:

```typescript
type WebSocketMessageType =
  | "CONTENT_ADDED"
  | "CONTENT_UPDATED"
  | "CONTENT_DELETED"
  | "CONNECTION_STATUS"
  | "PING"
  | "PONG";
```

**Integration with React Query**:

```typescript
// On receiving WebSocket update
wss.on("message", (data) => {
  const message = JSON.parse(data);

  switch (message.type) {
    case "db_updated":
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["content"] });
      break;
    case "CONTENT_ADDED":
      queryClient.setQueryData(["content", "list"], (old) => [
        ...(old || []),
        message.payload,
      ]);
      break;
  }
});
```

---

## Appendix A: Quick Reference

### API Base URLs

| Environment | URL                           |
| ----------- | ----------------------------- |
| Development | `http://localhost:3001/api`   |
| Production  | Configured via `VITE_API_URL` |

### Common Content Types

```typescript
type ContentType = "question" | "flashcard" | "exam" | "voice" | "coding";
```

### Common Status Values

```typescript
type ContentStatus = "pending" | "approved" | "rejected" | "published";
```

### Query Parameters Quick Reference

| Param     | Applies To            | Description                |
| --------- | --------------------- | -------------------------- |
| `channel` | All content endpoints | Channel ID filter          |
| `type`    | `/api/content`        | Content type filter        |
| `status`  | All content endpoints | Status filter              |
| `quality` | All content endpoints | Min quality score          |
| `limit`   | All content endpoints | Max results (default: 100) |
| `offset`  | All content endpoints | Skip N results             |

### Cache TTLs

| Cache Type            | TTL   |
| --------------------- | ----- |
| Content               | 300s  |
| Stats                 | 300s  |
| LocalStorage          | 120s  |
| React Query staleTime | 30s   |
| React Query gcTime    | 1800s |

---

## Appendix B: TypeScript Interfaces

### Complete Type Definitions

```typescript
// Content Types
type ContentType = "question" | "flashcard" | "exam" | "voice" | "coding";
type ContentStatus = "pending" | "approved" | "rejected";

interface ContentRecord {
  id: string;
  channel_id: string;
  content_type: ContentType;
  difficulty: string;
  tags: string[];
  data: Record<string, unknown>;
  quality_score: number;
  embedding_id: string | null;
  created_at: number;
  updated_at: number;
  status: ContentStatus;
  generated_by: string | null;
  generation_time_ms: number | null;
}

interface ContentItem {
  id: string;
  channelId: string;
  contentType: ContentType;
  data: unknown;
  qualityScore: number;
  createdAt: number;
  updatedAt: number;
  status: ContentStatus;
}

interface ContentStats {
  totalItems: number;
  byType: Record<ContentType, number>;
  byChannel: Record<string, number>;
  lastFetched: number | null;
}

// API Response Types
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  count?: number;
  stats?: ContentStats;
  error?: string;
}

interface GenerateRequest {
  channel: string;
  type: ContentType;
  count?: number;
  difficulty?: string;
}

interface GenerateResponse {
  ok: boolean;
  message: string;
  data: Array<{ id: string; channel_id: string; content_type: string }>;
  generation_time_ms: number;
}
```

---

**Document Version**: 1.0.0  
**Last Modified**: 2026-03-22  
**Author**: API_INTEGRATION_ARCHITECT
