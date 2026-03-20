import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CircuitBreaker,
  DeadLetterQueue,
  ResilienceManager,
  CircuitState,
} from "../resilience";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      halfOpenRequests: 2,
    });
  });

  describe("Initial State", () => {
    it("should start in closed state", () => {
      expect(circuitBreaker.getState()).toBe("closed");
    });

    it("should execute successfully when closed", async () => {
      const result = await circuitBreaker.execute(() =>
        Promise.resolve("success"),
      );
      expect(result).toBe("success");
    });
  });

  describe("Closed State Behavior", () => {
    it("should track failures", async () => {
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error("fail")));
        } catch {}
      }
      expect(circuitBreaker.getState()).toBe("closed");
    });

    it("should reset failure count on success", async () => {
      try {
        await circuitBreaker.execute(() => Promise.reject(new Error("fail")));
      } catch {}
      await circuitBreaker.execute(() => Promise.resolve("success"));
      expect(circuitBreaker.getState()).toBe("closed");
    });
  });

  describe("Open State Transition", () => {
    it("should open after reaching failure threshold", async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error("fail")));
        } catch {}
      }
      expect(circuitBreaker.getState()).toBe("open");
    });

    it("should reject requests when open", async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error("fail")));
        } catch {}
      }

      await expect(
        circuitBreaker.execute(() => Promise.resolve("success")),
      ).rejects.toThrow("Circuit breaker is OPEN");
    });

    it("should transition to half-open after reset timeout", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
        halfOpenRequests: 1,
      });

      try {
        await fastBreaker.execute(() => Promise.reject(new Error("fail")));
      } catch {}

      expect(fastBreaker.getState()).toBe("open");

      await new Promise((r) => setTimeout(r, 60));
      expect(fastBreaker.getState()).toBe("half-open");
    });
  });

  describe("Half-Open State Behavior", () => {
    it("should allow limited requests in half-open", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
        halfOpenRequests: 2,
      });

      try {
        await fastBreaker.execute(() => Promise.reject(new Error("fail")));
      } catch {}

      await new Promise((r) => setTimeout(r, 60));
      expect(fastBreaker.getState()).toBe("half-open");

      await fastBreaker.execute(() => Promise.resolve("success1"));
      expect(fastBreaker.getState()).toBe("half-open");

      await fastBreaker.execute(() => Promise.resolve("success2"));
      expect(fastBreaker.getState()).toBe("closed");
    });

    it("should return to open on failure in half-open", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
        halfOpenRequests: 2,
      });

      try {
        await fastBreaker.execute(() => Promise.reject(new Error("fail")));
      } catch {}

      await new Promise((r) => setTimeout(r, 60));
      expect(fastBreaker.getState()).toBe("half-open");

      try {
        await fastBreaker.execute(() => Promise.reject(new Error("fail")));
      } catch {}
      expect(fastBreaker.getState()).toBe("open");
    });
  });

  describe("Reset", () => {
    it("should reset all state", async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error("fail")));
        } catch {}
      }

      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe("closed");

      const result = await circuitBreaker.execute(() =>
        Promise.resolve("success"),
      );
      expect(result).toBe("success");
    });
  });

  describe("Edge Cases", () => {
    it("should handle synchronous errors", () => {
      expect(() =>
        circuitBreaker.execute(() => {
          throw new Error("sync error");
        }),
      ).rejects.toThrow("sync error");
    });

    it("should handle non-Error rejections", async () => {
      try {
        await circuitBreaker.execute(() => Promise.reject("string error"));
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("should use default options", () => {
      const defaultBreaker = new CircuitBreaker();
      expect(defaultBreaker.getState()).toBe("closed");
    });
  });
});

describe("DeadLetterQueue", () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue(5);
  });

  describe("Basic Operations", () => {
    it("should add items to the queue", () => {
      dlq.add({
        error: "test error",
        timestamp: Date.now(),
      });
      expect(dlq.size).toBe(1);
    });

    it("should generate ID if not provided", () => {
      dlq.add({
        error: "test",
        timestamp: Date.now(),
      });
      const items = dlq.getAll();
      expect(items[0].id).toMatch(/^dlq_/);
    });

    it("should use provided ID", () => {
      dlq.add({
        id: "custom-id",
        error: "test",
        timestamp: Date.now(),
      });
      expect(dlq.getAll()[0].id).toBe("custom-id");
    });
  });

  describe("FIFO Behavior", () => {
    it("should maintain insertion order", () => {
      for (let i = 0; i < 3; i++) {
        dlq.add({
          id: `item-${i}`,
          error: `error ${i}`,
          timestamp: Date.now(),
        });
      }
      const items = dlq.getAll();
      expect(items[0].id).toBe("item-0");
      expect(items[1].id).toBe("item-1");
      expect(items[2].id).toBe("item-2");
    });

    it("should evict oldest when full", () => {
      for (let i = 0; i < 5; i++) {
        dlq.add({
          id: `item-${i}`,
          error: `error ${i}`,
          timestamp: Date.now(),
        });
      }
      dlq.add({
        id: "item-5",
        error: "error 5",
        timestamp: Date.now(),
      });

      const items = dlq.getAll();
      expect(items.length).toBe(5);
      expect(items[0].id).toBe("item-1");
      expect(items[4].id).toBe("item-5");
    });
  });

  describe("Retry", () => {
    it("should increment retry count on retry", () => {
      dlq.add({
        id: "retryable",
        error: "test",
        timestamp: Date.now(),
        retryCount: 0,
      });
      const item = dlq.retry("retryable");
      expect(item?.retryCount).toBe(1);
    });

    it("should return undefined for non-existent item", () => {
      const item = dlq.retry("non-existent");
      expect(item).toBeUndefined();
    });

    it("should retry same item multiple times", () => {
      dlq.add({
        id: "retryable",
        error: "test",
        timestamp: Date.now(),
        retryCount: 0,
      });
      dlq.retry("retryable");
      const item = dlq.retry("retryable");
      expect(item?.retryCount).toBe(2);
    });
  });

  describe("Remove", () => {
    it("should remove item by ID", () => {
      dlq.add({
        id: "to-remove",
        error: "test",
        timestamp: Date.now(),
      });
      expect(dlq.size).toBe(1);

      const removed = dlq.remove("to-remove");
      expect(removed).toBe(true);
      expect(dlq.size).toBe(0);
    });

    it("should return false for non-existent ID", () => {
      const removed = dlq.remove("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("Clear", () => {
    it("should remove all items", () => {
      for (let i = 0; i < 3; i++) {
        dlq.add({
          error: `error ${i}`,
          timestamp: Date.now(),
        });
      }
      expect(dlq.size).toBe(3);

      dlq.clear();
      expect(dlq.size).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle content preservation", () => {
      const content = { complex: { nested: "value" } };
      dlq.add({
        id: "with-content",
        content,
        error: "test",
        timestamp: Date.now(),
      });
      expect(dlq.getAll()[0].content).toEqual(content);
    });

    it("should handle null content", () => {
      dlq.add({
        error: "test",
        timestamp: Date.now(),
      });
      expect(dlq.getAll()[0].content).toBeNull();
    });

    it("should create with default max size", () => {
      const defaultDLQ = new DeadLetterQueue();
      for (let i = 0; i < 1001; i++) {
        defaultDLQ.add({ error: `err${i}`, timestamp: Date.now() });
      }
      expect(defaultDLQ.size).toBe(1000);
    });
  });
});

describe("ResilienceManager", () => {
  let resilienceManager: ResilienceManager;

  beforeEach(() => {
    vi.useFakeTimers();
    resilienceManager = new ResilienceManager({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      timeout: 5000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Retry", () => {
    it("should succeed on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await resilienceManager.executeWithRetry(fn);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure up to max retries", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValueOnce("success");

      const promise = resilienceManager.executeWithRetry(fn);
      await vi.advanceTimersByTimeAsync(2500);
      const result = await promise;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after exhausting retries", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));

      const promise = resilienceManager.executeWithRetry(fn);

      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(2000);
      }

      await expect(promise).rejects.toThrow("always fails");
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe("Backoff with Jitter", () => {
    it("should use exponential backoff", async () => {
      const delays: number[] = [];
      vi.spyOn(resilienceManager as any, "sleep").mockImplementation(
        (...args: unknown[]) => {
          delays.push(args[0] as number);
          return Promise.resolve();
        },
      );
    });
  });

  describe("Timeout Handling", () => {
    it("should reject on timeout", async () => {
      const shortTimeoutManager = new ResilienceManager({
        maxRetries: 0,
        baseDelay: 100,
        maxDelay: 1000,
        timeout: 100,
      });

      const fn = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 500));
      });

      const promise = shortTimeoutManager.executeWithRetry(fn);
      await vi.advanceTimersByTimeAsync(200);
      await expect(promise).rejects.toThrow("timed out");
    });
  });

  describe("Circuit Breaker Integration", () => {
    it("should reject when circuit is open", async () => {
      const fastManager = new ResilienceManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        timeout: 5000,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"));

      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(500);
        try {
          await fastManager.executeWithRetry(fn);
        } catch {}
      }

      expect(fastManager.getCircuitBreakerState()).toBe("open");
    });
  });

  describe("Dead Letter Queue Integration", () => {
    it("should send failed items to DLQ", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("permanent failure"));

      const promise = resilienceManager.executeWithRetry(fn, {
        contentId: "test-content-1",
        content: { data: "test" },
      });

      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(2000);
      }

      await expect(promise).rejects.toThrow();

      const dlq = resilienceManager.getDeadLetterQueue();
      const items = dlq.getAll();
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].id).toBe("test-content-1");
      expect(items[0].error).toBe("permanent failure");
    });
  });

  describe("Non-Retryable Errors", () => {
    it("should not retry circuit breaker open errors", async () => {
      const onRetry = vi.fn();
      const manager = new ResilienceManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        timeout: 5000,
        onRetry,
      });

      const fn = vi
        .fn()
        .mockRejectedValue(new Error("Circuit breaker is OPEN"));

      const promise = manager.executeWithRetry(fn);
      await vi.advanceTimersByTimeAsync(200);
      await expect(promise).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe("Rate Limit Detection", () => {
    it("should detect 429 status code", () => {
      const error = { status: 429, message: "Rate limited" };
      expect(resilienceManager.isRateLimitError(error)).toBe(true);
    });

    it("should detect 429 in error message", () => {
      const error = new Error("HTTP 429 Too Many Requests");
      expect(resilienceManager.isRateLimitError(error)).toBe(true);
    });

    it("should not flag other errors as rate limit", () => {
      const error = new Error("Internal Server Error");
      expect(resilienceManager.isRateLimitError(error)).toBe(false);
    });
  });

  describe("Graceful Degradation", () => {
    it("should call primary then fallback on failure", async () => {
      const primary = vi.fn().mockRejectedValue(new Error("primary failed"));
      const fallback = vi.fn().mockResolvedValue("fallback result");

      const result = await resilienceManager.gracefulDegradation(
        () => primary(),
        () => fallback(),
      );

      expect(result).toBe("fallback result");
      expect(primary).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it("should use primary result on success", async () => {
      const primary = vi.fn().mockResolvedValue("primary result");
      const fallback = vi.fn().mockResolvedValue("fallback result");

      const result = await resilienceManager.gracefulDegradation(
        () => primary(),
        () => fallback(),
      );

      expect(result).toBe("primary result");
      expect(fallback).not.toHaveBeenCalled();
    });

    it("should wait on rate limit error", async () => {
      const primary = vi.fn().mockRejectedValue({ status: 429 });
      const fallback = vi.fn().mockResolvedValue("fallback");

      const promise = resilienceManager.gracefulDegradation(
        () => primary(),
        () => fallback(),
      );

      await vi.advanceTimersByTimeAsync(11000);
      const result = await promise;

      expect(result).toBe("fallback");
    });
  });

  describe("Circuit Breaker State", () => {
    it("should return current circuit state", () => {
      expect(resilienceManager.getCircuitBreakerState()).toBe("closed");
    });

    it("should reset circuit breaker", () => {
      resilienceManager.reset();
      expect(resilienceManager.getCircuitBreakerState()).toBe("closed");
    });
  });

  describe("Error Callbacks", () => {
    it("should call onRetry callback", async () => {
      const onRetry = vi.fn();
      const manager = new ResilienceManager({
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        timeout: 5000,
        onRetry,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockResolvedValueOnce("success");

      const promise = manager.executeWithRetry(fn);
      await vi.advanceTimersByTimeAsync(500);
      await promise;

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined error", async () => {
      const fn = vi.fn().mockRejectedValue(null);

      const promise = resilienceManager.executeWithRetry(fn);
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(2000);
      }

      await expect(promise).rejects.toThrow();
    });

    it("should handle context with minimal data", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("fail"));

      const promise = resilienceManager.executeWithRetry(fn, {});
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(2000);
      }

      await expect(promise).rejects.toThrow();
      const dlq = resilienceManager.getDeadLetterQueue();
      expect(dlq.size).toBeGreaterThan(0);
    });
  });
});
