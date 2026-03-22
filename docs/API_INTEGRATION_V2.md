# API Integration Guide V2

> **Purpose:** Complete guide to integrating with the DevPrep V2 backend API  
> **Date:** March 22, 2026  
> **Version:** 2.0.0  
> **Backend:** Express.js + SQLite

## Overview

The DevPrep V2 API provides a RESTful interface for accessing content data. This guide covers API architecture, endpoints, authentication, error handling, and frontend integration patterns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     API INTEGRATION ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Frontend (React 19)                      │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │                 TanStack Query Layer                   │  │ │
│  │  │  ┌─────────────────┐  ┌───────────────────────────┐   │  │ │
│  │  │  │  Query Client   │  │  Query Hooks (useQuery,   │   │  │ │
│  │  │  │  (caching)      │  │  useMutation, useInfinite)│   │  │ │
│  │  │  └─────────────────┘  └───────────────────────────┘   │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │                  Service Layer                         │  │ │
│  │  │  ┌─────────────────┐  ┌───────────────────────────┐   │  │ │
│  │  │  │  Content API    │  │  Channel API              │   │  │ │
│  │  │  └─────────────────┘  └───────────────────────────┘   │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │                API Client (Axios)                      │  │ │
│  │  │  • Base URL configuration                             │  │ │
│  │  │  • Request/Response interceptors                       │  │ │
│  │  │  • Error handling                                      │  │ │
│  │  │  • Authentication tokens                               │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                    │                              │
│                                    ▼                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Backend (Express)                       │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │                    API Endpoints                       │  │ │
│  │  │  GET  /api/content            - List all content       │  │ │
│  │  │  GET  /api/content/:type      - Get by type            │  │ │
│  │  │  GET  /api/channels/:id/content - Get channel content  │  │ │
│  │  │  GET  /api/health             - Health check           │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │                    SQLite Database                    │  │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │ │
│  │  │  │ contents │  │ channels │  │  vectors │            │  │ │
│  │  │  └──────────┘  └──────────┘  └──────────┘            │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Base Configuration

### Environment Variables

```bash
# Frontend environment variables
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### API Client Setup

```typescript
// src/lib/api/client.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`[API] Response:`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 429) {
      // Rate limit exceeded - implement retry logic
      console.warn('Rate limit exceeded. Please try again later.');
    }
    
    // Transform error for consistent handling
    const apiError = {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      code: error.response?.data?.code,
      timestamp: new Date().toISOString(),
    };
    
    return Promise.reject(apiError);
  }
);

// Helper function for generating request IDs
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { apiClient };
```

## API Endpoints

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-22T11:30:00Z",
  "version": "2.0.0"
}
```

**Usage:**
```typescript
// Check API health before making requests
async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
}
```

### Content Endpoints

#### Get All Content

```
GET /api/content
```

**Query Parameters:**
- `type` (string, optional): Filter by content type (`question`, `flashcard`, `exam`, `voice`, `coding`)
- `channel` (string, optional): Filter by channel ID
- `limit` (number, optional): Limit results (default: 50)
- `offset` (number, optional): Offset for pagination (default: 0)
- `minQuality` (number, optional): Minimum quality score (0-1)

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "q_20260322_abc123",
      "channel_id": "javascript",
      "content_type": "question",
      "difficulty": "intermediate",
      "tags": ["javascript", "async", "promises"],
      "data": {
        "question": "What is the difference between Promise.all and Promise.allSettled?",
        "options": [
          "Promise.all rejects on first rejection, Promise.allSettled waits for all",
          "Promise.allSettled rejects on first rejection, Promise.all waits for all",
          "Both reject on first rejection",
          "Both wait for all promises to settle"
        ],
        "answer": 0,
        "explanation": "Promise.all rejects immediately when any promise rejects...",
        "hint": "Think about error handling behavior"
      },
      "quality_score": 0.92,
      "created_at": 1647984000,
      "updated_at": 1647984000,
      "status": "published",
      "generated_by": "agent-1",
      "generation_time_ms": 1250
    }
  ]
}
```

#### Get Content by Type

```
GET /api/content/:type
```

**Path Parameters:**
- `type` (string, required): Content type (`question`, `flashcard`, `exam`, `voice`, `coding`)

**Response:** Same as `/api/content` but filtered by type.

#### Get Channel Content

```
GET /api/channels/:channelId/content
```

**Path Parameters:**
- `channelId` (string, required): Channel ID (e.g., `javascript`, `react`, `algorithms`)

**Response:** Same as `/api/content` but filtered by channel.

### Content Types

#### Question

```typescript
interface QuestionData {
  question: string;
  options: string[];
  answer: number; // Index of correct answer (0-3)
  explanation: string;
  hint?: string;
  code_snippet?: string;
  language?: string;
}

interface QuestionContent {
  id: string;
  channel_id: string;
  content_type: 'question';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  data: QuestionData;
  quality_score: number;
  created_at: number;
  updated_at: number;
  status: 'published' | 'draft' | 'archived';
  generated_by: string | null;
  generation_time_ms: number | null;
}
```

#### Flashcard

```typescript
interface FlashcardData {
  front: string;
  back: string;
  code_snippet?: string;
  language?: string;
  image_url?: string;
}

interface FlashcardContent {
  id: string;
  channel_id: string;
  content_type: 'flashcard';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  data: FlashcardData;
  quality_score: number;
  created_at: number;
  updated_at: number;
  status: 'published' | 'draft' | 'archived';
  generated_by: string | null;
  generation_time_ms: number | null;
}
```

#### Exam

```typescript
interface ExamData {
  title: string;
  description: string;
  questions: string[]; // Array of question IDs
  duration_minutes: number;
  passing_score: number; // Percentage (0-100)
  instructions: string;
}

interface ExamContent {
  id: string;
  channel_id: string;
  content_type: 'exam';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  data: ExamData;
  quality_score: number;
  created_at: number;
  updated_at: number;
  status: 'published' | 'draft' | 'archived';
  generated_by: string | null;
  generation_time_ms: number | null;
}
```

#### Voice Content

```typescript
interface VoiceData {
  script: string;
  duration_seconds: number;
  voice_id: string;
  speed: number;
  pitch: number;
}

interface VoiceContent {
  id: string;
  channel_id: string;
  content_type: 'voice';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  data: VoiceData;
  quality_score: number;
  created_at: number;
  updated_at: number;
  status: 'published' | 'draft' | 'archived';
  generated_by: string | null;
  generation_time_ms: number | null;
}
```

#### Coding Challenge

```typescript
interface CodingData {
  title: string;
  description: string;
  starter_code: string;
  solution_code: string;
  test_cases: Array<{
    input: string;
    expected_output: string;
    is_hidden: boolean;
  }>;
  language: string;
  time_limit_ms: number;
  memory_limit_mb: number;
}

interface CodingContent {
  id: string;
  channel_id: string;
  content_type: 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  data: CodingData;
  quality_score: number;
  created_at: number;
  updated_at: number;
  status: 'published' | 'draft' | 'archived';
  generated_by: string | null;
  generation_time_ms: number | null;
}
```

## Frontend Integration

### Service Layer

```typescript
// src/features/content/services/contentService.ts
import { apiClient } from '@/lib/api/client';

export interface ContentQueryParams {
  type?: string;
  channel?: string;
  limit?: number;
  offset?: number;
  minQuality?: number;
}

export interface ContentResponse {
  ok: boolean;
  data: ContentItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export const contentService = {
  /**
   * Get all content with optional filters
   */
  async getAll(params: ContentQueryParams = {}): Promise<ContentResponse> {
    const response = await apiClient.get<ContentResponse>('/content', { params });
    return response.data;
  },

  /**
   * Get content by type
   */
  async getByType(type: string, params: Omit<ContentQueryParams, 'type'> = {}): Promise<ContentResponse> {
    const response = await apiClient.get<ContentResponse>(`/content/${type}`, { params });
    return response.data;
  },

  /**
   * Get content by channel
   */
  async getByChannel(channelId: string, params: Omit<ContentQueryParams, 'channel'> = {}): Promise<ContentResponse> {
    const response = await apiClient.get<ContentResponse>(`/channels/${channelId}/content`, { params });
    return response.data;
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },
};
```

### React Query Hooks

```typescript
// src/features/content/hooks/useContent.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contentService, ContentQueryParams } from '../services/contentService';
import type { ContentItem } from '../types';

export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (params: ContentQueryParams) => [...contentKeys.lists(), params] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
};

/**
 * Hook to fetch all content with optional filters
 */
export function useContent(params: ContentQueryParams = {}) {
  return useQuery({
    queryKey: contentKeys.list(params),
    queryFn: () => contentService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch content by type
 */
export function useContentByType(type: string, params: Omit<ContentQueryParams, 'type'> = {}) {
  return useQuery({
    queryKey: contentKeys.list({ ...params, type }),
    queryFn: () => contentService.getByType(type, params),
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch content by channel
 */
export function useContentByChannel(channelId: string, params: Omit<ContentQueryParams, 'channel'> = {}) {
  return useQuery({
    queryKey: contentKeys.list({ ...params, channel: channelId }),
    queryFn: () => contentService.getByChannel(channelId, params),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to prefetch content
 */
export function usePrefetchContent() {
  const queryClient = useQueryClient();

  return {
    prefetchContent: (params: ContentQueryParams) => {
      queryClient.prefetchQuery({
        queryKey: contentKeys.list(params),
        queryFn: () => contentService.getAll(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchByType: (type: string) => {
      queryClient.prefetchQuery({
        queryKey: contentKeys.list({ type }),
        queryFn: () => contentService.getByType(type),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}
```

### Data Transformation

```typescript
// src/features/content/utils/contentTransforms.ts
import type { ContentItem, ContentItemWithUI } from '../types';

/**
 * Transform API response for UI consumption
 */
export function transformContentForUI(content: ContentItem): ContentItemWithUI {
  return {
    ...content,
    formattedDate: new Date(content.created_at * 1000).toLocaleDateString(),
    relativeTime: getRelativeTime(content.created_at * 1000),
    qualityPercentage: Math.round(content.quality_score * 100),
    difficultyLabel: getDifficultyLabel(content.difficulty),
    typeLabel: getContentTypeLabel(content.content_type),
  };
}

/**
 * Group content by type
 */
export function groupContentByType(content: ContentItem[]): Record<string, ContentItem[]> {
  return content.reduce((groups, item) => {
    const type = item.content_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {} as Record<string, ContentItem[]>);
}

/**
 * Filter content by minimum quality score
 */
export function filterByQuality(content: ContentItem[], minQuality: number): ContentItem[] {
  return content.filter(item => item.quality_score >= minQuality);
}

/**
 * Sort content by various criteria
 */
export function sortContent(
  content: ContentItem[],
  sortBy: 'date' | 'quality' | 'difficulty',
  order: 'asc' | 'desc' = 'desc'
): ContentItem[] {
  return [...content].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = a.created_at - b.created_at;
        break;
      case 'quality':
        comparison = a.quality_score - b.quality_score;
        break;
      case 'difficulty':
        comparison = difficultyToNumber(a.difficulty) - difficultyToNumber(b.difficulty);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
}

// Helper functions
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return 'just now';
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };
  return labels[difficulty] || difficulty;
}

function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    question: 'Question',
    flashcard: 'Flashcard',
    exam: 'Exam',
    voice: 'Voice Content',
    coding: 'Coding Challenge',
  };
  return labels[type] || type;
}

function difficultyToNumber(difficulty: string): number {
  const map: Record<string, number> = {
    beginner: 1,
    easy: 1,
    intermediate: 2,
    medium: 2,
    advanced: 3,
    hard: 3,
  };
  return map[difficulty] || 0;
}
```

## Error Handling

### Error Types

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public timestamp: string = new Date().toISOString()
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Caching Strategy

### Query Client Configuration

```typescript
// src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});
```

### Cache Invalidation

```typescript
// src/features/content/hooks/useContentMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '../services/contentService';
import { contentKeys } from './useContent';

export function useInvalidateContent() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.all });
    },
    invalidateByType: (type: string) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.list({ type }) });
    },
    invalidateByChannel: (channelId: string) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.list({ channel: channelId }) });
    },
  };
}
```

## Real-time Updates

### WebSocket Integration

```typescript
// src/lib/api/websocket.ts
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'content_updated':
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: contentKeys.all });
        break;
      case 'new_content':
        // Show notification
        toast({
          title: 'New Content Available',
          description: `New ${data.contentType} in ${data.channelId}`,
        });
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const wsClient = new WebSocketClient(import.meta.env.VITE_WS_URL || 'ws://localhost:3001');
wsClient.connect();
```

## Performance Optimization

### Request Deduplication

```typescript
// TanStack Query automatically deduplicates identical requests
// Additional deduplication can be implemented with:
const pendingRequests = new Map<string, Promise<any>>();

async function deduplicatedRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}
```

### Prefetching

```typescript
// Prefetch on hover/focus
function ContentCard({ content }: { content: ContentItem }) {
  const { prefetchContent } = usePrefetchContent();

  const handleMouseEnter = () => {
    // Prefetch related content when user hovers
    prefetchContent({ channel: content.channel_id, limit: 10 });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {/* card content */}
    </div>
  );
}
```

## Testing

### Mock API Client

```typescript
// src/__tests__/mocks/apiClient.ts
import { vi } from 'vitest';

export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

export const mockContentResponse = {
  ok: true,
  data: [
    {
      id: 'q_123',
      channel_id: 'javascript',
      content_type: 'question',
      difficulty: 'intermediate',
      tags: ['javascript', 'async'],
      data: {
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        answer: 0,
        explanation: 'Test explanation',
      },
      quality_score: 0.9,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000,
      status: 'published',
      generated_by: 'test',
      generation_time_ms: 1000,
    },
  ],
};

// Mock the API client module
vi.mock('@/lib/api/client', () => ({
  apiClient: mockApiClient,
}));
```

### Integration Tests

```typescript
// src/__tests__/integration/contentService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contentService } from '@/features/content/services/contentService';
import { apiClient } from '@/lib/api/client';

describe('Content Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all content', async () => {
    const mockResponse = { data: mockContentResponse };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await contentService.getAll();

    expect(apiClient.get).toHaveBeenCalledWith('/content', { params: {} });
    expect(result).toEqual(mockContentResponse);
  });

  it('handles API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      message: 'Internal Server Error',
      status: 500,
    });

    await expect(contentService.getAll()).rejects.toEqual({
      message: 'Internal Server Error',
      status: 500,
    });
  });
});
```

## Deployment Considerations

### Production Configuration

```typescript
// src/lib/api/config.ts
const config = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    wsUrl: 'ws://localhost:3001',
  },
  staging: {
    apiUrl: 'https://staging-api.devprep.com/api',
    wsUrl: 'wss://staging-api.devprep.com',
  },
  production: {
    apiUrl: 'https://api.devprep.com/api',
    wsUrl: 'wss://api.devprep.com',
  },
};

const environment = import.meta.env.MODE as keyof typeof config;
export const apiConfig = config[environment] || config.development;
```

### Rate Limiting

```typescript
// Implement client-side rate limiting
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 100; // per minute
  private timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  async throttleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    if (!this.canMakeRequest()) {
      const waitTime = this.timeWindow - (Date.now() - this.requests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.recordRequest();
    return requestFn();
  }
}
```

## Summary

The API integration layer provides:

1. **Type-safe API client** with comprehensive error handling
2. **React Query hooks** for efficient data fetching and caching
3. **Real-time updates** via WebSocket
4. **Performance optimizations** with deduplication and prefetching
5. **Comprehensive testing** with mocks and integration tests
6. **Production-ready** configuration and error handling

This architecture ensures a robust, maintainable, and performant integration with the DevPrep V2 backend.