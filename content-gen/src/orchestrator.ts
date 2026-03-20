import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { EventEmitter } from "events";
import { randomUUID } from "crypto";

export type ContentType =
  | "question"
  | "flashcard"
  | "exam"
  | "voice"
  | "coding";

export interface Channel {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  type: "tech" | "cert";
  certCode?: string;
  description: string;
  tagFilter?: string[];
}

export interface ContentResult {
  id: string;
  type: ContentType;
  channelId: string;
  data: unknown;
  qualityScore: number;
  createdAt: number;
}

export interface Task {
  id: string;
  type: ContentType;
  channel: Channel;
  priority: number;
  retries: number;
  maxRetries?: number;
  createdAt?: number;
}

interface QueuedTask extends Task {
  createdAt: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  workerId?: string;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

interface WorkerStats {
  id: string;
  tasksCompleted: number;
  tasksFailed: number;
  currentTaskId?: string;
  currentTaskStartedAt?: number;
  lastTaskDurationMs?: number;
  status: "idle" | "busy" | "offline";
}

export interface OrchestratorStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  workers: WorkerStats[];
  averageTaskDurationMs: number;
  throughput: number;
  uptime: number;
}

interface ChannelConcurrencyLimit {
  [channelId: string]: number;
}

interface ChannelCoverage {
  [channelId: string]: {
    totalContent: number;
    byType: Record<ContentType, number>;
    lastUpdated: number;
  };
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CONCURRENCY_PER_CHANNEL = 2;
const CONTENT_TYPE_PRIORITY: Record<ContentType, number> = {
  question: 1,
  flashcard: 2,
  exam: 3,
  voice: 4,
  coding: 5,
};

export class PriorityQueue<T> {
  private heap: T[] = [];
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number) {
    this.compareFn = compareFn;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  get length(): number {
    return this.heap.length;
  }

  remove(predicate: (item: T) => boolean): T | undefined {
    const index = this.heap.findIndex(predicate);
    if (index === -1) return undefined;
    const result = this.heap[index];
    const last = this.heap.pop()!;
    if (index < this.heap.length) {
      this.heap[index] = last;
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareFn(this.heap[index], this.heap[parentIndex]) < 0) {
        this.bubbleUp(index);
      } else {
        this.bubbleDown(index);
      }
    }
    return result;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareFn(this.heap[index], this.heap[parentIndex]) >= 0) break;
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < length &&
        this.compareFn(this.heap[leftChild], this.heap[smallest]) < 0
      ) {
        smallest = leftChild;
      }
      if (
        rightChild < length &&
        this.compareFn(this.heap[rightChild], this.heap[smallest]) < 0
      ) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      index = smallest;
    }
  }
}

export class WorkerPool extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private idleWorkers: string[] = [];
  private taskWorkerMap: Map<string, string> = new Map();
  private workerStats: Map<string, WorkerStats> = new Map();
  private workerScript: string;
  private size: number;

  constructor(workerScript: string, size: number = 4) {
    super();
    this.workerScript = workerScript;
    this.size = Math.min(Math.max(1, size), 16);
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.size; i++) {
      const workerId = `worker-${i}-${randomUUID().slice(0, 8)}`;
      const worker = new Worker(this.workerScript, {
        workerData: { workerId },
      });

      worker.on("message", (message) =>
        this.handleWorkerMessage(workerId, message),
      );
      worker.on("error", (error: Error) =>
        this.handleWorkerError(workerId, error),
      );
      worker.on("exit", (code) => this.handleWorkerExit(workerId, code));

      this.workers.set(workerId, worker);
      this.idleWorkers.push(workerId);
      this.workerStats.set(workerId, {
        id: workerId,
        tasksCompleted: 0,
        tasksFailed: 0,
        status: "idle",
      });
    }
  }

  private handleWorkerMessage(workerId: string, message: unknown): void {
    const msg = message as {
      type: string;
      taskId?: string;
      result?: ContentResult;
      error?: string;
    };
    if (msg.type === "result" && msg.taskId) {
      this.taskWorkerMap.delete(msg.taskId);
      const stats = this.workerStats.get(workerId);
      if (stats) {
        stats.tasksCompleted++;
        stats.currentTaskId = undefined;
        stats.status = "idle";
        if (stats.currentTaskStartedAt) {
          stats.lastTaskDurationMs = Date.now() - stats.currentTaskStartedAt;
        }
      }
      this.idleWorkers.push(workerId);
      this.emit("taskComplete", {
        workerId,
        taskId: msg.taskId,
        result: msg.result,
      });
    } else if (msg.type === "error" && msg.taskId) {
      this.taskWorkerMap.delete(msg.taskId);
      const stats = this.workerStats.get(workerId);
      if (stats) {
        stats.tasksFailed++;
        stats.currentTaskId = undefined;
        stats.status = "idle";
      }
      this.idleWorkers.push(workerId);
      this.emit("taskError", {
        workerId,
        taskId: msg.taskId,
        error: msg.error,
      });
    } else if (msg.type === "progress" && msg.taskId) {
      this.emit("progress", { workerId, taskId: msg.taskId });
    }
  }

  private handleWorkerError(workerId: string, error: Error): void {
    this.emit("workerError", { workerId, error });
    this.recycleWorker(workerId);
  }

  private handleWorkerExit(workerId: string, code: number): void {
    this.emit("workerExit", { workerId, code });
    this.workers.delete(workerId);
    const index = this.idleWorkers.indexOf(workerId);
    if (index > -1) this.idleWorkers.splice(index, 1);
    this.recycleWorker(workerId);
  }

  private recycleWorker(workerId: string): void {
    const stats = this.workerStats.get(workerId);
    if (stats && stats.currentTaskId) {
      this.emit("taskError", {
        workerId,
        taskId: stats.currentTaskId,
        error: "Worker crashed",
      });
      this.taskWorkerMap.delete(stats.currentTaskId);
    }

    const newWorkerId = `worker-recycled-${randomUUID().slice(0, 8)}`;
    const worker = new Worker(this.workerScript, {
      workerData: { workerId: newWorkerId },
    });

    worker.on("message", (message) =>
      this.handleWorkerMessage(newWorkerId, message),
    );
    worker.on("error", (error: Error) =>
      this.handleWorkerError(newWorkerId, error),
    );
    worker.on("exit", (code) => this.handleWorkerExit(newWorkerId, code));

    this.workers.set(newWorkerId, worker);
    this.workerStats.delete(workerId);
    this.workerStats.set(newWorkerId, {
      id: newWorkerId,
      tasksCompleted: 0,
      tasksFailed: 0,
      status: "idle",
    });
    this.idleWorkers.push(newWorkerId);
  }

  executeTask(taskId: string, taskData: Task): Promise<ContentResult> {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length === 0) {
        reject(new Error("No idle workers available"));
        return;
      }

      const workerId = this.idleWorkers.shift()!;
      const worker = this.workers.get(workerId);
      if (!worker) {
        this.idleWorkers.push(workerId);
        reject(new Error("Worker not found"));
        return;
      }

      this.taskWorkerMap.set(taskId, workerId);
      const stats = this.workerStats.get(workerId);
      if (stats) {
        stats.currentTaskId = taskId;
        stats.currentTaskStartedAt = Date.now();
        stats.status = "busy";
      }

      const timeout = setTimeout(() => {
        worker.postMessage({ type: "cancel", taskId });
        this.taskWorkerMap.delete(taskId);
        this.idleWorkers.push(workerId);
        reject(new Error("Task timeout"));
      }, 120000);

      const handler = (data: {
        workerId: string;
        taskId: string;
        result?: ContentResult;
        error?: string;
      }) => {
        if (data.taskId === taskId) {
          clearTimeout(timeout);
          this.removeListener("taskComplete", handler);
          this.removeListener("taskError", errorHandler);
          if (data.result) {
            resolve(data.result);
          } else {
            reject(new Error(data.error || "Unknown error"));
          }
        }
      };

      const errorHandler = (data: {
        workerId: string;
        taskId: string;
        error?: string;
      }) => {
        if (data.taskId === taskId) {
          clearTimeout(timeout);
          this.removeListener("taskComplete", handler);
          this.removeListener("taskError", errorHandler);
          reject(new Error(data.error || "Task failed"));
        }
      };

      this.on("taskComplete", handler);
      this.on("taskError", errorHandler);

      worker.postMessage({ type: "execute", taskId, task: taskData });
    });
  }

  cancelTask(taskId: string): boolean {
    const workerId = this.taskWorkerMap.get(taskId);
    if (!workerId) return false;
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.postMessage({ type: "cancel", taskId });
      this.taskWorkerMap.delete(taskId);
      this.idleWorkers.push(workerId);
      const stats = this.workerStats.get(workerId);
      if (stats) {
        stats.currentTaskId = undefined;
        stats.status = "idle";
      }
    }
    return true;
  }

  getIdleCount(): number {
    return this.idleWorkers.length;
  }

  getWorkerStats(): WorkerStats[] {
    return Array.from(this.workerStats.values());
  }

  async terminate(): Promise<void> {
    const terminations = Array.from(this.workers.values()).map((w) =>
      w.terminate(),
    );
    await Promise.all(terminations);
    this.workers.clear();
    this.idleWorkers = [];
    this.taskWorkerMap.clear();
    this.workerStats.clear();
  }
}

export class Orchestrator extends EventEmitter {
  private workerPool: WorkerPool;
  private taskQueue: PriorityQueue<QueuedTask>;
  private tasks: Map<string, QueuedTask> = new Map();
  private taskResults: Map<string, ContentResult> = new Map();
  private taskPromises: Map<
    string,
    { resolve: (r: ContentResult) => void; reject: (e: Error) => void }
  > = new Map();
  private channelConcurrency: ChannelConcurrencyLimit;
  private channelActiveTasks: Map<string, Set<string>> = new Map();
  private channelCoverage: ChannelCoverage;
  private contentTypeBatches: Map<ContentType, QueuedTask[]> = new Map();
  private maxConcurrencyPerChannel: number;
  private workerScript: string;
  private size: number;
  private startTime: number;
  private isShuttingDown: boolean = false;
  private processingLoop: NodeJS.Timeout | null = null;
  private statsHistory: { timestamp: number; completed: number }[] = [];
  private lastCompletedCount: number = 0;

  constructor(
    options: {
      workerScript?: string;
      workerCount?: number;
      maxConcurrencyPerChannel?: number;
      channelConcurrency?: ChannelConcurrencyLimit;
      channelCoverage?: ChannelCoverage;
    } = {},
  ) {
    super();
    this.workerScript = options.workerScript || "";
    this.size = options.workerCount || 4;
    this.maxConcurrencyPerChannel =
      options.maxConcurrencyPerChannel || DEFAULT_CONCURRENCY_PER_CHANNEL;
    this.channelConcurrency = options.channelConcurrency || {};
    this.channelCoverage = options.channelCoverage || {};
    this.startTime = Date.now();

    this.taskQueue = new PriorityQueue<QueuedTask>((a, b) => {
      const priorityDiff = a.priority - b.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });

    this.workerPool = new WorkerPool(this.workerScript, this.size);
    this.setupWorkerPoolHandlers();
    this.startProcessingLoop();
  }

  private setupWorkerPoolHandlers(): void {
    this.workerPool.on("taskComplete", ({ taskId, result }) => {
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = "completed";
        task.completedAt = Date.now();
        this.taskResults.set(taskId, result);
        this.updateChannelCoverage(task.channel.id, task.type);
        const promise = this.taskPromises.get(taskId);
        if (promise) {
          promise.resolve(result);
          this.taskPromises.delete(taskId);
        }
        this.emit("taskCompleted", { task, result });
      }
      this.recordStats();
    });

    this.workerPool.on("taskError", ({ taskId, error }) => {
      const task = this.tasks.get(taskId);
      if (task && task.status !== "cancelled") {
        if (task.retries < (task.maxRetries || DEFAULT_MAX_RETRIES)) {
          task.retries++;
          task.status = "pending";
          task.workerId = undefined;
          this.taskQueue.push(task);
          this.emit("taskRetry", { task, attempt: task.retries });
        } else {
          task.status = "failed";
          task.error = error;
          task.completedAt = Date.now();
          const promise = this.taskPromises.get(taskId);
          if (promise) {
            promise.reject(new Error(error));
            this.taskPromises.delete(taskId);
          }
          this.emit("taskFailed", { task, error });
        }
      }
      this.recordStats();
    });

    this.workerPool.on("workerError", ({ workerId, error }) => {
      this.emit("workerError", { workerId, error });
    });
  }

  private recordStats(): void {
    const now = Date.now();
    const completed = this.getStats().completedTasks;
    if (completed > this.lastCompletedCount) {
      this.statsHistory.push({ timestamp: now, completed });
      this.lastCompletedCount = completed;
      if (this.statsHistory.length > 100) {
        this.statsHistory.shift();
      }
    }
  }

  private startProcessingLoop(): void {
    this.processingLoop = setInterval(() => {
      if (this.isShuttingDown) return;
      this.processTasks();
    }, 100);
  }

  private async processTasks(): Promise<void> {
    if (this.isShuttingDown) return;

    const idleWorkers = this.workerPool.getIdleCount();
    for (let i = 0; i < idleWorkers; i++) {
      const task = this.selectNextTask();
      if (!task) break;
      await this.executeTask(task);
    }
  }

  private selectNextTask(): QueuedTask | undefined {
    const pendingTasks = Array.from(this.tasks.values())
      .filter((t) => t.status === "pending")
      .sort((a, b) => {
        const coverageA = this.getChannelCoverageScore(a.channel.id);
        const coverageB = this.getChannelCoverageScore(b.channel.id);
        if (coverageA !== coverageB) return coverageA - coverageB;

        const priorityDiff = a.priority - b.priority;
        if (priorityDiff !== 0) return priorityDiff;

        const typeDiff =
          CONTENT_TYPE_PRIORITY[a.type] - CONTENT_TYPE_PRIORITY[b.type];
        if (typeDiff !== 0) return typeDiff;

        return a.createdAt - b.createdAt;
      });

    for (const task of pendingTasks) {
      const activeCount =
        this.channelActiveTasks.get(task.channel.id)?.size || 0;
      if (activeCount < this.getChannelConcurrencyLimit(task.channel)) {
        return task;
      }
    }
    return pendingTasks[0];
  }

  private getChannelCoverageScore(channelId: string): number {
    const coverage = this.channelCoverage[channelId];
    if (!coverage) return 1000;
    const totalTypes = Object.keys(CONTENT_TYPE_PRIORITY).length;
    const coveredTypes = Object.values(coverage.byType).filter(
      (c) => c > 0,
    ).length;
    return (totalTypes - coveredTypes) * 100 - coverage.totalContent;
  }

  private getChannelConcurrencyLimit(channel: Channel): number {
    return this.channelConcurrency[channel.id] || this.maxConcurrencyPerChannel;
  }

  private updateChannelCoverage(channelId: string, type: ContentType): void {
    if (!this.channelCoverage[channelId]) {
      this.channelCoverage[channelId] = {
        totalContent: 0,
        byType: { question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 },
        lastUpdated: Date.now(),
      };
    }
    this.channelCoverage[channelId].totalContent++;
    this.channelCoverage[channelId].byType[type]++;
    this.channelCoverage[channelId].lastUpdated = Date.now();
  }

  private async executeTask(task: QueuedTask): Promise<void> {
    task.status = "running";
    task.startedAt = Date.now();

    if (!this.channelActiveTasks.has(task.channel.id)) {
      this.channelActiveTasks.set(task.channel.id, new Set());
    }
    this.channelActiveTasks.get(task.channel.id)!.add(task.id);

    try {
      const result = await this.workerPool.executeTask(task.id, task);
      this.emit("taskExecuted", { task, result });
    } catch (error) {
      this.emit("taskExecutionError", { task, error });
    } finally {
      this.channelActiveTasks.get(task.channel.id)?.delete(task.id);
    }
  }

  async submit(task: Task): Promise<ContentResult> {
    if (this.isShuttingDown) {
      throw new Error("Orchestrator is shutting down");
    }

    const queuedTask: QueuedTask = {
      ...task,
      id: task.id || randomUUID(),
      createdAt: Date.now(),
      status: "pending",
      retries: task.retries || 0,
      maxRetries: task.maxRetries || DEFAULT_MAX_RETRIES,
    };

    this.tasks.set(queuedTask.id, queuedTask);
    this.taskQueue.push(queuedTask);

    return new Promise((resolve, reject) => {
      this.taskPromises.set(queuedTask.id, { resolve, reject });
      this.emit("taskSubmitted", { task: queuedTask });
    });
  }

  async submitBatch(tasks: Task[]): Promise<ContentResult[]> {
    const sortedTasks = [...tasks].sort((a, b) => {
      const coverageDiff =
        this.getChannelCoverageScore(a.channel.id) -
        this.getChannelCoverageScore(b.channel.id);
      if (coverageDiff !== 0) return coverageDiff;
      const priorityDiff = a.priority - b.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return CONTENT_TYPE_PRIORITY[a.type] - CONTENT_TYPE_PRIORITY[b.type];
    });

    const results: ContentResult[] = [];
    for (const task of sortedTasks) {
      const result = await this.submit(task);
      results.push(result);
    }
    return results;
  }

  cancel(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (task.status === "running") {
      this.workerPool.cancelTask(taskId);
      this.channelActiveTasks.get(task.channel.id)?.delete(taskId);
    }

    task.status = "cancelled";
    task.completedAt = Date.now();

    const promise = this.taskPromises.get(taskId);
    if (promise) {
      promise.reject(new Error("Task cancelled"));
      this.taskPromises.delete(taskId);
    }

    this.emit("taskCancelled", { task });
  }

  getStats(): OrchestratorStats {
    const workerStats = this.workerPool.getWorkerStats();
    const now = Date.now();
    const uptime = now - this.startTime;

    let totalDuration = 0;
    let completedCount = 0;
    for (const stat of workerStats) {
      if (stat.lastTaskDurationMs) {
        totalDuration += stat.lastTaskDurationMs;
        completedCount++;
      }
    }

    const averageTaskDurationMs =
      completedCount > 0 ? totalDuration / completedCount : 0;
    const recentHistory = this.statsHistory.slice(-20);
    let throughput = 0;
    if (recentHistory.length >= 2) {
      const timeSpan =
        recentHistory[recentHistory.length - 1].timestamp -
        recentHistory[0].timestamp;
      const tasksDone =
        recentHistory[recentHistory.length - 1].completed -
        recentHistory[0].completed;
      throughput = timeSpan > 0 ? (tasksDone / timeSpan) * 1000 : 0;
    }

    const stats: OrchestratorStats = {
      totalTasks: this.tasks.size,
      pendingTasks: Array.from(this.tasks.values()).filter(
        (t) => t.status === "pending",
      ).length,
      runningTasks: Array.from(this.tasks.values()).filter(
        (t) => t.status === "running",
      ).length,
      completedTasks: Array.from(this.tasks.values()).filter(
        (t) => t.status === "completed",
      ).length,
      failedTasks: Array.from(this.tasks.values()).filter(
        (t) => t.status === "failed",
      ).length,
      cancelledTasks: Array.from(this.tasks.values()).filter(
        (t) => t.status === "cancelled",
      ).length,
      workers: workerStats,
      averageTaskDurationMs,
      throughput,
      uptime,
    };

    return stats;
  }

  setChannelCoverage(
    channelId: string,
    coverage: ChannelCoverage[string],
  ): void {
    this.channelCoverage[channelId] = coverage;
  }

  setChannelConcurrencyLimit(channelId: string, limit: number): void {
    this.channelConcurrency[channelId] = Math.min(Math.max(1, limit), 10);
  }

  getTaskStatus(taskId: string): QueuedTask["status"] | undefined {
    return this.tasks.get(taskId)?.status;
  }

  async shutdown(graceful: boolean = true): Promise<void> {
    this.isShuttingDown = true;

    if (graceful) {
      const timeout = 30000;
      const start = Date.now();
      while (this.tasks.size > 0 && Date.now() - start < timeout) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    for (const task of this.tasks.values()) {
      if (task.status === "running") {
        this.cancel(task.id);
      }
    }

    if (this.processingLoop) {
      clearInterval(this.processingLoop);
    }

    await this.workerPool.terminate();
    this.emit("shutdown");
  }
}

export function createWorkerScript(): string {
  return `
const { parentPort, workerData } = require('worker_threads');
const { randomUUID } = require('crypto');

let currentTask = null;
let cancelled = false;

parentPort.on('message', async (message) => {
  if (message.type === 'execute') {
    const { taskId, task } = message;
    currentTask = { taskId, task };
    cancelled = false;
    
    try {
      const result = await processTask(task);
      if (!cancelled) {
        parentPort.postMessage({ type: 'result', taskId, result });
      }
    } catch (error) {
      if (!cancelled) {
        parentPort.postMessage({ type: 'error', taskId, error: error.message });
      }
    } finally {
      currentTask = null;
    }
  } else if (message.type === 'cancel') {
    cancelled = true;
    parentPort.postMessage({ type: 'cancelled', taskId: message.taskId });
  }
});

async function processTask(task) {
  const { type, channel, priority } = task;
  
  const qualityScore = 0.7 + Math.random() * 0.3;
  
  const templates = {
    question: { title: 'Question for ' + channel.name, content: 'Generated question content' },
    flashcard: { front: 'Question', back: 'Answer' },
    exam: { title: 'Exam - ' + channel.name, duration: 60 },
    voice: { script: 'Voice script for ' + channel.name },
    coding: { title: 'Coding Challenge', difficulty: 'medium' }
  };
  
  const delay = 100 + Math.random() * 400;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    id: randomUUID(),
    type,
    channelId: channel.id,
    data: templates[type] || {},
    qualityScore,
    createdAt: Date.now()
  };
}
`;
}

export function createOrchestrator(
  options?: ConstructorParameters<typeof Orchestrator>[0],
): Orchestrator {
  return new Orchestrator(options);
}
