/**
 * Typed timeout abstractions to address Primitive Obsession anti-pattern.
 * Provides type-safe wrappers around setTimeout/setInterval.
 */

// Type aliases for timeout IDs - addresses primitive obsession
export type TimeoutId = ReturnType<typeof globalThis.setTimeout>;
export type IntervalId = ReturnType<typeof globalThis.setInterval>;

/**
 * Wrapper for managing typed timeouts with automatic cleanup
 */
export class TypedTimeout {
  private id: TimeoutId | null = null;
  private readonly callback: () => void;
  private readonly delayMs: number;

  constructor(delayMs: number, callback: () => void) {
    this.delayMs = delayMs;
    this.callback = callback;
  }

  start(): void {
    if (this.id !== null) {
      this.clear();
    }
    this.id = globalThis.setTimeout(this.callback, this.delayMs);
  }

  clear(): void {
    if (this.id !== null) {
      globalThis.clearTimeout(this.id);
      this.id = null;
    }
  }

  restart(): void {
    this.clear();
    this.start();
  }

  isActive(): boolean {
    return this.id !== null;
  }
}

/**
 * Wrapper for managing typed intervals with automatic cleanup
 */
export class TypedInterval {
  private id: IntervalId | null = null;
  private readonly callback: () => void;
  private readonly intervalMs: number;

  constructor(intervalMs: number, callback: () => void) {
    this.intervalMs = intervalMs;
    this.callback = callback;
  }

  start(): void {
    this.clear();
    this.id = globalThis.setInterval(this.callback, this.intervalMs);
  }

  clear(): void {
    if (this.id !== null) {
      globalThis.clearInterval(this.id);
      this.id = null;
    }
  }

  isActive(): boolean {
    return this.id !== null;
  }
}

/**
 * Debounce function with typed timeout
 */
export function debounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delayMs: number,
): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: TimeoutId | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId);
    }
    timeoutId = globalThis.setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delayMs);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return [debouncedFn, cancel];
}

/**
 * Throttle function with typed timeout
 */
export function throttle<T extends (...args: unknown[]) => void>(
  callback: T,
  limitMs: number,
): T {
  let lastRun = 0;
  let timeoutId: TimeoutId | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limitMs - (now - lastRun);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastRun = now;
      callback(...args);
    } else if (timeoutId === null) {
      timeoutId = globalThis.setTimeout(() => {
        lastRun = Date.now();
        timeoutId = null;
        callback(...args);
      }, remaining);
    }
  }) as T;
}

export { TIMEOUT_DURATIONS } from "./constants";
export type { TimeoutDuration } from "./constants";
