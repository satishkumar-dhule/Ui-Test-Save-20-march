/**
 * Shared type definitions for the DevPrep application.
 * Addresses Primitive Obsession by providing named type aliases.
 */

// Timeout type aliases - addresses primitive obsession
export type TimeoutId = ReturnType<typeof globalThis.setTimeout>;
export type IntervalId = ReturnType<typeof globalThis.setInterval>;

/**
 * Type-safe wrapper for managing setTimeout with automatic cleanup.
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
    this.clear();
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
 * Debounce function with typed timeout.
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
