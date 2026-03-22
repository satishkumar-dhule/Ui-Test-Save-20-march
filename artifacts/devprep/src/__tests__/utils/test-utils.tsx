import React, { ReactElement } from "react";
import { render, RenderOptions, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock data generators
export const mockContent = {
  question: {
    id: "q1",
    channel_id: "javascript",
    content_type: "question",
    data: JSON.stringify({
      question: "What is closure in JavaScript?",
      answer: "A closure is...",
      tags: ["javascript", "functions"],
      difficulty: "medium",
      eli5: "Think of closure like a backpack...",
    }),
    quality_score: 0.85,
    created_at: Date.now(),
    status: "approved",
  },
  flashcard: {
    id: "f1",
    channel_id: "react",
    content_type: "flashcard",
    data: JSON.stringify({
      front: "What is useState?",
      back: "A React hook for managing state",
      tags: ["react", "hooks"],
      hint: "Think about component state...",
    }),
    quality_score: 0.92,
    created_at: Date.now(),
    status: "approved",
  },
  exam: {
    id: "e1",
    channel_id: "algorithms",
    content_type: "exam",
    data: JSON.stringify({
      question: "What is the time complexity of quicksort?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      correct_answer: 1,
      explanation: "Quicksort has average case O(n log n)...",
      tags: ["algorithms", "sorting"],
      difficulty: "hard",
    }),
    quality_score: 0.88,
    created_at: Date.now(),
    status: "approved",
  },
  coding: {
    id: "c1",
    channel_id: "javascript",
    content_type: "coding",
    data: JSON.stringify({
      title: "Implement Fibonacci",
      description: "Write a function to calculate the nth Fibonacci number",
      test_cases: [
        { input: 0, expected: 0 },
        { input: 1, expected: 1 },
        { input: 10, expected: 55 },
      ],
      languages: ["javascript", "python"],
      tags: ["algorithms", "dynamic-programming"],
      difficulty: "medium",
      eli5: "Fibonacci is like a family tree where each person is the sum of the two before...",
    }),
    quality_score: 0.9,
    created_at: Date.now(),
    status: "approved",
  },
  voice: {
    id: "v1",
    channel_id: "system-design",
    content_type: "voice",
    data: JSON.stringify({
      prompt: "Explain how you would design a URL shortener",
      key_points: [
        "Generate short unique IDs",
        "Store mapping in database",
        "Handle collisions",
        "Cache popular URLs",
      ],
      follow_up_questions: [
        "How would you handle high traffic?",
        "What about expired URLs?",
      ],
      time_limit_seconds: 120,
      tags: ["system-design", "distributed"],
      difficulty: "hard",
    }),
    quality_score: 0.87,
    created_at: Date.now(),
    status: "approved",
  },
};

// Mock channel data
export const mockChannels = [
  { id: "javascript", name: "JavaScript", type: "tech", tags: ["javascript", "async", "closures"] },
  { id: "react", name: "React", type: "tech", tags: ["react", "hooks", "state"] },
  { id: "algorithms", name: "Algorithms", type: "tech", tags: ["algorithms", "sorting", "dp"] },
  { id: "devops", name: "DevOps", type: "tech", tags: ["devops", "docker", "ci-cd"] },
  { id: "system-design", name: "System Design", type: "tech", tags: ["cs", "distributed"] },
];

// Mock API responses
export const mockApiResponse = {
  ok: true,
  data: Object.values(mockContent),
  pagination: {
    total: 5,
    limit: 20,
    offset: 0,
    hasMore: false,
  },
};

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Create test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Mock fetch for API calls
export function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
    status: 200,
  });
}

// Mock fetch with error
export function mockFetchError(error: string, status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: error,
    json: () => Promise.resolve({ error }),
  });
}

// Wait for loading to finish
export async function waitForLoadingToFinish() {
  await waitFor(() => {
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
}

// Accessibility testing helpers
export const a11y = {
  // Check if element is focusable
  isFocusable: (element: HTMLElement) => {
    return (
      element.tabIndex >= 0 &&
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
    );
  },

  // Check color contrast (simplified)
  hasSufficientContrast: (foreground: string, background: string) => {
    // Simplified check - in real tests use actual contrast calculation
    return foreground !== background;
  },

  // Check ARIA attributes
  hasValidAriaAttributes: (element: HTMLElement) => {
    const ariaAttributes = [
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-hidden",
      "aria-live",
      "aria-atomic",
      "aria-relevant",
    ];
    return ariaAttributes.some((attr) => element.hasAttribute(attr));
  },
};

// Performance testing helpers
export const perf = {
  // Measure render time
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    await waitFor(() => {});
    const end = performance.now();
    return end - start;
  },

  // Check if element renders within time limit
  rendersWithinLimit: async (renderFn: () => void, limitMs = 100) => {
    const time = await perf.measureRenderTime(renderFn);
    return time < limitMs;
  },
};

// Mock WebSocket
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static lastInstance: MockWebSocket | null = null;

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = WebSocket.CONNECTING;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    MockWebSocket.lastInstance = this;

    // Simulate connection opening
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event("open"));
    }, 0);
  }

  send(data: string) {
    // Mock implementation
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  // Test helpers
  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }));
  }

  simulateError() {
    this.onerror?.(new Event("error"));
  }

  static reset() {
    MockWebSocket.instances = [];
    MockWebSocket.lastInstance = null;
  }
}

// Mock localStorage
export const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
  reset() {
    this.store = {};
    this.getItem.mockClear();
    this.setItem.mockClear();
    this.removeItem.mockClear();
    this.clear.mockClear();
  },
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mock = vi.fn();
  vi.stubGlobal("IntersectionObserver", mock);
  mock.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  return mock;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mock = vi.fn();
  vi.stubGlobal("ResizeObserver", mock);
  mock.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  return mock;
};

// Re-export testing library
export * from "@testing-library/react";
export { userEvent };
export { vi, describe, it, expect, beforeEach, afterEach };

// Utility to parse mock content data
export function parseMockContent(content: typeof mockContent[keyof typeof mockContent]) {
  return JSON.parse(content.data);
}

// Generate mock content list
export function generateMockContentList(count: number, type: keyof typeof mockContent = "question") {
  return Array.from({ length: count }, (_, i) => ({
    ...mockContent[type],
    id: `${type.charAt(0)}${i + 1}`,
    data: JSON.stringify({
      ...JSON.parse(mockContent[type].data),
      id: `${type.charAt(0)}${i + 1}`,
    }),
  }));
}

// Component test wrapper with all providers
export function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Custom hooks for testing
export function useTestRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    pathname: "/",
    query: {},
  };
}

// Mock stores
export const mockStores = {
  contentStore: {
    contents: Object.values(mockContent),
    isLoading: false,
    error: null,
    fetchContents: vi.fn(),
    getContentById: vi.fn((id: string) => 
      mockContent[Object.keys(mockContent).find(key => 
        mockContent[key as keyof typeof mockContent].id === id
      ) as keyof typeof mockContent]
    ),
  },
  filterStore: {
    filters: {
      channel: null,
      type: null,
      quality: null,
      search: "",
    },
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
  },
  themeStore: {
    theme: "light" as const,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  },
};

// Wait helper for async operations
export async function actAsync(fn: () => void | Promise<void>) {
  const { act } = await import("@testing-library/react");
  await act(async () => {
    await fn();
  });
}

// Mock data for different content types
export const mockContentByType = {
  question: [mockContent.question],
  flashcard: [mockContent.flashcard],
  exam: [mockContent.exam],
  coding: [mockContent.coding],
  voice: [mockContent.voice],
};

// Mock quality scores distribution
export const mockQualityScores = {
  high: 0.95,
  medium: 0.75,
  low: 0.45,
  zero: 0,
};

// Mock tags for filtering
export const mockTags = {
  javascript: ["javascript", "async", "closures", "prototype"],
  react: ["react", "hooks", "state", "performance"],
  algorithms: ["algorithms", "sorting", "big-o", "dp"],
  devops: ["devops", "docker", "ci-cd", "linux"],
};

// Accessibility test data
export const accessibilityTestData = {
  validAriaLabels: [
    "Close dialog",
    "Search content",
    "Filter by channel",
    "Toggle theme",
    "Navigate to home",
  ],
  validRoles: [
    "button",
    "link",
    "dialog",
    "navigation",
    "main",
    "complementary",
    "contentinfo",
    "search",
    "alert",
    "status",
    "timer",
    "progressbar",
  ],
  validLandmarks: [
    "banner",
    "navigation",
    "main",
    "complementary",
    "contentinfo",
    "search",
  ],
};

// Test IDs
export const testIds = {
  app: "app",
  header: "header",
  navigation: "navigation",
  mainContent: "main-content",
  sidebar: "sidebar",
  footer: "footer",
  contentCard: "content-card",
  loading: "loading",
  error: "error",
  emptyState: "empty-state",
  searchInput: "search-input",
  filterButton: "filter-button",
  themeToggle: "theme-toggle",
};

// Keyboard event helpers
export const keyboard = {
  enter: { key: "Enter", code: "Enter", keyCode: 13 },
  escape: { key: "Escape", code: "Escape", keyCode: 27 },
  space: { key: " ", code: "Space", keyCode: 32 },
  tab: { key: "Tab", code: "Tab", keyCode: 9 },
  arrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  arrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  arrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  arrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
};

// Performance thresholds
export const performanceThresholds = {
  componentRender: 100, // ms
  hookExecution: 50, // ms
  apiResponse: 1000, // ms
  animationDuration: 300, // ms
};

// Coverage targets
export const coverageTargets = {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
};