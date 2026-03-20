interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
  onRetry?: (attempt: number, error: Error) => void;
}

type CircuitState = "closed" | "open" | "half-open";

interface DeadLetterItem {
  id: string;
  content: unknown;
  error: string;
  timestamp: number;
  retryCount: number;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenRequests: number;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.halfOpenRequests = options.halfOpenRequests ?? 3;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.state = "half-open";
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN. Request rejected.");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): CircuitState {
    if (this.state === "open" && this.shouldAttemptReset()) {
      this.state = "half-open";
    }
    return this.state;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= this.halfOpenRequests) {
        this.state = "closed";
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === "half-open") {
      this.state = "open";
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
    }
  }

  private shouldAttemptReset(): boolean {
    if (this.lastFailureTime === null) return true;
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

class DeadLetterQueue {
  private items: DeadLetterItem[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  add(item: {
    id?: string;
    content?: unknown;
    error: string;
    timestamp: number;
    retryCount?: number;
  }): void {
    if (this.items.length >= this.maxSize) {
      this.items.shift();
    }
    const fullItem: DeadLetterItem = {
      id: item.id || this.generateId(),
      content: item.content ?? null,
      error: item.error,
      timestamp: item.timestamp,
      retryCount: item.retryCount ?? 0,
    };
    this.items.push(fullItem);
  }

  getAll(): DeadLetterItem[] {
    return [...this.items];
  }

  retry(id: string): DeadLetterItem | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      const item = this.items[index];
      item.retryCount++;
      return item;
    }
    return undefined;
  }

  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.items = [];
  }

  private generateId(): string {
    return `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  get size(): number {
    return this.items.length;
  }
}

class ResilienceManager {
  private circuitBreaker: CircuitBreaker;
  private deadLetterQueue: DeadLetterQueue;
  private readonly retryOptions: Required<RetryOptions>;

  constructor(retryOptions: RetryOptions) {
    this.retryOptions = {
      maxRetries: retryOptions.maxRetries,
      baseDelay: retryOptions.baseDelay,
      maxDelay: retryOptions.maxDelay,
      timeout: retryOptions.timeout,
      onRetry: retryOptions.onRetry ?? (() => {}),
    };
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
    });
    this.deadLetterQueue = new DeadLetterQueue();
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: { contentId?: string; content?: unknown },
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await this.circuitBreaker.execute(() =>
          this.executeWithTimeout(fn),
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isNonRetryableError(lastError)) {
          this.sendToDeadLetter(lastError, context);
          throw lastError;
        }

        if (attempt < this.retryOptions.maxRetries) {
          const delay = this.calculateBackoffWithJitter(attempt);
          this.retryOptions.onRetry(attempt + 1, lastError);
          await this.sleep(delay);
        }
      }
    }

    this.sendToDeadLetter(lastError!, context);
    throw lastError!;
  }

  private executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(`Request timed out after ${this.retryOptions.timeout}ms`),
        );
      }, this.retryOptions.timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private calculateBackoffWithJitter(attempt: number): number {
    const exponentialDelay = this.retryOptions.baseDelay * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.retryOptions.maxDelay);
    const jitter = Math.random() * 0.3 * cappedDelay;
    return Math.floor(cappedDelay + jitter);
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    if (message.includes("circuit breaker is open")) {
      return true;
    }
    if (message.includes("timed out")) {
      return false;
    }
    return false;
  }

  isRateLimitError(error: unknown): boolean {
    if (error instanceof Error && error.message.includes("429")) {
      return true;
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 429
    ) {
      return true;
    }
    return false;
  }

  private sendToDeadLetter(
    error: Error,
    context?: { contentId?: string; content?: unknown },
  ): void {
    this.deadLetterQueue.add({
      id: context?.contentId || this.generateId(),
      content: context?.content || null,
      error: error.message,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  private generateId(): string {
    return `failed_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  getDeadLetterQueue(): DeadLetterQueue {
    return this.deadLetterQueue;
  }

  reset(): void {
    this.circuitBreaker.reset();
  }

  async gracefulDegradation<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    context?: { contentId?: string; content?: unknown },
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryFn, context);
    } catch (error) {
      if (this.isRateLimitError(error)) {
        const delay = this.retryOptions.baseDelay * 10;
        await this.sleep(delay);
        try {
          return await this.executeWithRetry(fallbackFn, context);
        } catch {
          return await fallbackFn();
        }
      }
      return await fallbackFn();
    }
  }
}

export {
  RetryOptions,
  CircuitBreaker,
  CircuitState,
  DeadLetterQueue,
  DeadLetterItem,
  ResilienceManager,
  CircuitBreakerOptions,
};
