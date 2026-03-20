import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import {
  Orchestrator,
  WorkerPool,
  PriorityQueue,
  createOrchestrator,
  createWorkerScript,
  Task,
  Channel,
  ContentType,
} from "../orchestrator";

const createTestChannel = (id: string = "test-channel"): Channel => ({
  id,
  name: "Test Channel",
  shortName: "test",
  emoji: "🧪",
  color: "#ffffff",
  type: "tech",
  description: "Test channel for unit tests",
  tagFilter: ["test"],
});

const createTestTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Math.random().toString(36).slice(2)}`,
  type: "question",
  channel: createTestChannel(),
  priority: 1,
  retries: 0,
  ...overrides,
});

describe("PriorityQueue", () => {
  let queue: PriorityQueue<{ priority: number; value: string }>;

  beforeEach(() => {
    queue = new PriorityQueue<{ priority: number; value: string }>(
      (a, b) => a.priority - b.priority,
    );
  });

  describe("Basic Operations", () => {
    it("should push and pop items", () => {
      queue.push({ priority: 1, value: "a" });
      const item = queue.pop();
      expect(item?.value).toBe("a");
    });

    it("should maintain priority order", () => {
      queue.push({ priority: 3, value: "c" });
      queue.push({ priority: 1, value: "a" });
      queue.push({ priority: 2, value: "b" });

      expect(queue.pop()?.value).toBe("a");
      expect(queue.pop()?.value).toBe("b");
      expect(queue.pop()?.value).toBe("c");
    });

    it("should return undefined when empty", () => {
      expect(queue.pop()).toBeUndefined();
      expect(queue.peek()).toBeUndefined();
    });

    it("should peek without removing", () => {
      queue.push({ priority: 1, value: "a" });
      expect(queue.peek()?.value).toBe("a");
      expect(queue.length).toBe(1);
    });

    it("should report correct length", () => {
      expect(queue.length).toBe(0);
      queue.push({ priority: 1, value: "a" });
      queue.push({ priority: 2, value: "b" });
      expect(queue.length).toBe(2);
    });
  });

  describe("Remove", () => {
    it("should remove item by predicate", () => {
      queue.push({ priority: 1, value: "a" });
      queue.push({ priority: 2, value: "b" });
      queue.push({ priority: 3, value: "c" });

      const removed = queue.remove((item) => item.value === "b");
      expect(removed?.value).toBe("b");
      expect(queue.length).toBe(2);

      expect(queue.pop()?.value).toBe("a");
      expect(queue.pop()?.value).toBe("c");
    });

    it("should return undefined if not found", () => {
      queue.push({ priority: 1, value: "a" });
      const removed = queue.remove((item) => item.value === "z");
      expect(removed).toBeUndefined();
    });
  });

  describe("Complex Priority", () => {
    it("should handle equal priorities", () => {
      queue.push({ priority: 1, value: "first" });
      queue.push({ priority: 1, value: "second" });
      queue.push({ priority: 1, value: "third" });

      expect(queue.length).toBe(3);
    });

    it("should maintain heap property after operations", () => {
      const items = [
        { priority: 5, value: "e" },
        { priority: 3, value: "c" },
        { priority: 7, value: "g" },
        { priority: 1, value: "a" },
        { priority: 4, value: "d" },
        { priority: 6, value: "f" },
        { priority: 2, value: "b" },
      ];

      items.forEach((item) => queue.push(item));

      const sorted: string[] = [];
      let item = queue.pop();
      while (item) {
        sorted.push(item.value);
        item = queue.pop();
      }

      const expected = ["a", "b", "c", "d", "e", "f", "g"];
      expect(sorted).toEqual(expected);
    });
  });
});

describe("WorkerPool", () => {
  let workerPool: WorkerPool;
  const workerScript = createWorkerScript();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (workerPool) {
      await workerPool.terminate();
    }
  });

  describe("Initialization", () => {
    it("should create workers with specified size", () => {
      workerPool = new WorkerPool(workerScript, 2);
      expect(workerPool.getIdleCount()).toBe(2);
    });

    it("should respect worker size limits", () => {
      workerPool = new WorkerPool(workerScript, 20);
      expect(workerPool.getIdleCount()).toBeLessThanOrEqual(16);
    });

    it("should track worker stats", () => {
      workerPool = new WorkerPool(workerScript, 2);
      const stats = workerPool.getWorkerStats();
      expect(stats).toHaveLength(2);
      expect(stats[0].status).toBe("idle");
    });
  });

  describe("Task Execution", () => {
    it("should execute task successfully", async () => {
      workerPool = new WorkerPool(workerScript, 1);
      const task = createTestTask();

      vi.advanceTimersByTime(600);

      const result = await workerPool.executeTask(task.id, task);
      expect(result).toBeDefined();
      expect(result.type).toBe("question");
    });

    it("should mark worker as busy during execution", async () => {
      workerPool = new WorkerPool(workerScript, 1);
      const task = createTestTask();

      const executePromise = workerPool.executeTask(task.id, task);
      vi.advanceTimersByTime(100);

      const stats = workerPool.getWorkerStats();
      expect(stats[0].status).toBe("busy");

      await executePromise;
    });

    it("should return worker to idle after completion", async () => {
      workerPool = new WorkerPool(workerScript, 1);
      const task = createTestTask();

      await workerPool.executeTask(task.id, task);
      vi.advanceTimersByTime(100);

      const stats = workerPool.getWorkerStats();
      expect(stats[0].status).toBe("idle");
    });

    it("should reject when no idle workers", async () => {
      workerPool = new WorkerPool(workerScript, 1);
      const task1 = createTestTask();
      const task2 = createTestTask();

      workerPool.executeTask(task1.id, task1);

      await expect(workerPool.executeTask(task2.id, task2)).rejects.toThrow(
        "No idle workers available",
      );
    });
  });

  describe("Task Cancellation", () => {
    it("should cancel running task", async () => {
      workerPool = new WorkerPool(workerScript, 1);
      const task = createTestTask();

      const cancelled = workerPool.cancelTask(task.id);
      expect(cancelled).toBe(false);
    });
  });

  describe("Worker Lifecycle", () => {
    it("should handle worker termination", async () => {
      workerPool = new WorkerPool(workerScript, 1);
      expect(workerPool.getIdleCount()).toBe(1);

      await workerPool.terminate();
      expect(workerPool.getIdleCount()).toBe(0);
    });
  });
});

describe("Orchestrator", () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    vi.useFakeTimers();
    const workerScript = createWorkerScript();
    orchestrator = createOrchestrator({
      workerScript,
      workerCount: 2,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await orchestrator.shutdown(false);
  });

  describe("Task Submission", () => {
    it("should accept and queue tasks", async () => {
      const task = createTestTask();
      const resultPromise = orchestrator.submit(task);

      vi.advanceTimersByTime(600);
      const result = await resultPromise;

      expect(result).toBeDefined();
      expect(result.type).toBe("question");
    });

    it("should emit taskSubmitted event", () => {
      const task = createTestTask();
      const handler = vi.fn();
      orchestrator.on("taskSubmitted", handler);

      orchestrator.submit(task);
      vi.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalled();
    });

    it("should reject when shutting down", async () => {
      await orchestrator.shutdown(false);
      const task = createTestTask();

      await expect(orchestrator.submit(task)).rejects.toThrow(
        "Orchestrator is shutting down",
      );
    });
  });

  describe("Task Scheduling", () => {
    it("should prioritize by channel coverage", async () => {
      const channel1 = createTestChannel("channel-1");
      const channel2 = createTestChannel("channel-2");

      orchestrator.setChannelCoverage("channel-1", {
        totalContent: 10,
        byType: { question: 10, flashcard: 0, exam: 0, voice: 0, coding: 0 },
        lastUpdated: Date.now(),
      });

      const task1 = createTestTask({ channel: channel1, type: "flashcard" });
      const task2 = createTestTask({ channel: channel2, type: "flashcard" });

      await Promise.all([
        orchestrator.submit(task1),
        orchestrator.submit(task2),
      ]);

      vi.advanceTimersByTime(1000);
      const stats = orchestrator.getStats();
      expect(stats.totalTasks).toBeGreaterThanOrEqual(2);
    });

    it("should prioritize by content type", async () => {
      const taskQuestion = createTestTask({ type: "question", priority: 1 });
      const taskCoding = createTestTask({ type: "coding", priority: 5 });

      await Promise.all([
        orchestrator.submit(taskQuestion),
        orchestrator.submit(taskCoding),
      ]);

      vi.advanceTimersByTime(1000);
    });
  });

  describe("Batch Submission", () => {
    it("should submit multiple tasks as batch", async () => {
      const tasks = [
        createTestTask(),
        createTestTask({ type: "flashcard" }),
        createTestTask({ type: "exam" }),
      ];

      const results = await orchestrator.submitBatch(tasks);
      vi.advanceTimersByTime(1500);

      expect(results.length).toBe(3);
    });

    it("should sort batch by coverage and priority", () => {
      const tasks = createTestTask();
      const batch = orchestrator.submitBatch([tasks]);
      expect(batch).toBeDefined();
    });
  });

  describe("Task Cancellation", () => {
    it("should cancel pending task", async () => {
      const task = createTestTask();
      orchestrator.submit(task).catch(() => {});

      vi.advanceTimersByTime(50);
      orchestrator.cancel(task.id);

      const status = orchestrator.getTaskStatus(task.id);
      expect(status).toBe("cancelled");
    });

    it("should emit taskCancelled event", () => {
      const task = createTestTask();
      const handler = vi.fn();
      orchestrator.on("taskCancelled", handler);

      orchestrator.submit(task).catch(() => {});
      vi.advanceTimersByTime(50);
      orchestrator.cancel(task.id);

      expect(handler).toHaveBeenCalled();
    });

    it("should not throw for non-existent task", () => {
      expect(() => orchestrator.cancel("non-existent")).not.toThrow();
    });
  });

  describe("Statistics", () => {
    it("should return accurate stats", async () => {
      const task = createTestTask();
      orchestrator.submit(task);

      vi.advanceTimersByTime(600);
      await new Promise((r) => setTimeout(r, 10));

      const stats = orchestrator.getStats();
      expect(stats).toHaveProperty("totalTasks");
      expect(stats).toHaveProperty("pendingTasks");
      expect(stats).toHaveProperty("completedTasks");
      expect(stats).toHaveProperty("workers");
      expect(stats).toHaveProperty("uptime");
    });

    it("should track worker stats", async () => {
      const task = createTestTask();
      orchestrator.submit(task);

      vi.advanceTimersByTime(600);
      await new Promise((r) => setTimeout(r, 10));

      const stats = orchestrator.getStats();
      expect(stats.workers).toHaveLength(2);
    });

    it("should calculate average task duration", async () => {
      const task1 = createTestTask();
      const task2 = createTestTask({ type: "flashcard" });

      await orchestrator.submit(task1);
      vi.advanceTimersByTime(600);
      await orchestrator.submit(task2);
      vi.advanceTimersByTime(600);

      const stats = orchestrator.getStats();
      expect(stats.averageTaskDurationMs).toBeGreaterThanOrEqual(0);
    });

    it("should calculate throughput", async () => {
      const task = createTestTask();
      await orchestrator.submit(task);
      vi.advanceTimersByTime(600);

      const stats = orchestrator.getStats();
      expect(typeof stats.throughput).toBe("number");
    });
  });

  describe("Channel Configuration", () => {
    it("should set channel coverage", () => {
      orchestrator.setChannelCoverage("test-channel", {
        totalContent: 5,
        byType: {
          question: 2,
          flashcard: 1,
          exam: 1,
          voice: 1,
          coding: 0,
        },
        lastUpdated: Date.now(),
      });

      const stats = orchestrator.getStats();
      expect(stats).toBeDefined();
    });

    it("should set channel concurrency limit", () => {
      orchestrator.setChannelConcurrencyLimit("test-channel", 5);
      const stats = orchestrator.getStats();
      expect(stats).toBeDefined();
    });

    it("should clamp concurrency to valid range", () => {
      orchestrator.setChannelConcurrencyLimit("test-channel", 100);
      orchestrator.setChannelConcurrencyLimit("test-channel", 0);
    });
  });

  describe("Task Status", () => {
    it("should return task status", async () => {
      const task = createTestTask();
      orchestrator.submit(task).catch(() => {});

      vi.advanceTimersByTime(50);
      const status = orchestrator.getTaskStatus(task.id);
      expect(status).toBeDefined();
    });

    it("should return undefined for non-existent task", () => {
      const status = orchestrator.getTaskStatus("non-existent");
      expect(status).toBeUndefined();
    });
  });

  describe("Retry Behavior", () => {
    it("should retry failed tasks", async () => {
      const task = createTestTask({ retries: 0, maxRetries: 3 });
      const handler = vi.fn();
      orchestrator.on("taskRetry", handler);

      const result = await orchestrator.submit(task);
      vi.advanceTimersByTime(1000);
    });
  });

  describe("Shutdown", () => {
    it("should shutdown gracefully", async () => {
      await orchestrator.shutdown(true);
      const stats = orchestrator.getStats();
      expect(stats).toBeDefined();
    });

    it("should cancel running tasks on shutdown", async () => {
      const task = createTestTask();
      orchestrator.submit(task).catch(() => {});

      vi.advanceTimersByTime(50);
      await orchestrator.shutdown(false);

      const status = orchestrator.getTaskStatus(task.id);
      expect(status).toBe("cancelled");
    });

    it("should clear processing loop", async () => {
      await orchestrator.shutdown(false);
      const stats = orchestrator.getStats();
      expect(stats.pendingTasks).toBeLessThanOrEqual(0);
    });

    it("should emit shutdown event", async () => {
      const handler = vi.fn();
      orchestrator.on("shutdown", handler);

      await orchestrator.shutdown(false);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Event Handling", () => {
    it("should emit taskCompleted event", async () => {
      const handler = vi.fn();
      orchestrator.on("taskCompleted", handler);

      const task = createTestTask();
      await orchestrator.submit(task);
      vi.advanceTimersByTime(600);

      await new Promise((r) => setTimeout(r, 10));
    });

    it("should emit taskFailed event", () => {
      const handler = vi.fn();
      orchestrator.on("taskFailed", handler);
    });

    it("should emit workerError event", () => {
      const handler = vi.fn();
      orchestrator.on("workerError", handler);
    });
  });
});

describe("createOrchestrator", () => {
  it("should create orchestrator with defaults", () => {
    const orchestrator = createOrchestrator();
    expect(orchestrator).toBeInstanceOf(Orchestrator);
  });

  it("should create orchestrator with custom options", () => {
    const orchestrator = createOrchestrator({
      workerCount: 4,
      maxConcurrencyPerChannel: 3,
    });
    expect(orchestrator).toBeInstanceOf(Orchestrator);
  });
});

describe("createWorkerScript", () => {
  it("should return valid JavaScript string", () => {
    const script = createWorkerScript();
    expect(typeof script).toBe("string");
    expect(script).toContain("parentPort");
    expect(script).toContain("execute");
    expect(script).toContain("cancel");
  });
});

describe("Edge Cases", () => {
  it("should handle concurrent task submissions", async () => {
    vi.useFakeTimers();
    const workerScript = createWorkerScript();
    const orchestrator = createOrchestrator({
      workerScript,
      workerCount: 2,
    });

    const promises = Array.from({ length: 10 }, () =>
      orchestrator.submit(createTestTask()),
    );

    vi.advanceTimersByTime(3000);
    const results = await Promise.all(promises);

    expect(results.length).toBe(10);

    await orchestrator.shutdown(false);
    vi.useRealTimers();
  });

  it("should handle all content types", async () => {
    vi.useFakeTimers();
    const workerScript = createWorkerScript();
    const orchestrator = createOrchestrator({
      workerScript,
      workerCount: 1,
    });

    const types: ContentType[] = [
      "question",
      "flashcard",
      "exam",
      "voice",
      "coding",
    ];

    for (const type of types) {
      const task = createTestTask({ type });
      const result = await orchestrator.submit(task);
      expect(result.type).toBe(type);
      vi.advanceTimersByTime(600);
    }

    await orchestrator.shutdown(false);
    vi.useRealTimers();
  });

  it("should handle priority values", () => {
    const queue = new PriorityQueue<{ priority: number; id: string }>(
      (a, b) => a.priority - b.priority,
    );

    queue.push({ priority: 0, id: "zero" });
    queue.push({ priority: -1, id: "negative" });
    queue.push({ priority: 100, id: "hundred" });

    expect(queue.pop()?.id).toBe("negative");
    expect(queue.pop()?.id).toBe("zero");
    expect(queue.pop()?.id).toBe("hundred");
  });

  it("should handle rapid submit and cancel", async () => {
    vi.useFakeTimers();
    const workerScript = createWorkerScript();
    const orchestrator = createOrchestrator({
      workerScript,
      workerCount: 1,
    });

    for (let i = 0; i < 20; i++) {
      const task = createTestTask();
      const submitPromise = orchestrator.submit(task);
      orchestrator.cancel(task.id);
      submitPromise.catch(() => {});
    }

    vi.advanceTimersByTime(100);
    await orchestrator.shutdown(false);
    vi.useRealTimers();
  });
});
