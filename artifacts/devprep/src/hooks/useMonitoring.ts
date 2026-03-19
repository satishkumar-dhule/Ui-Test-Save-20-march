/**
 * Frontend Monitoring Hook
 *
 * Provides client-side observability for errors and performance.
 */

import { useEffect, useRef, useCallback, useState } from "react";

export interface ClientError {
  id: string;
  message: string;
  stack?: string;
  source: "console" | "unhandled" | "promise";
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

export interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
  duration?: number;
  type: "navigate" | "back_forward" | "reload";
}

export interface ApiFailure {
  url: string;
  method: string;
  statusCode?: number;
  errorMessage?: string;
  retryCount: number;
  timestamp: number;
}

class Logger {
  private errors: ClientError[] = [];
  private maxErrors = 100;

  error(message: string, context?: Record<string, unknown>, stack?: string): void {
    const entry: ClientError = {
      id: crypto.randomUUID(),
      message,
      stack,
      source: "console",
      timestamp: Date.now(),
      context,
    };
    this.errors.push(entry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    console.error(`[Monitor] ${message}`, context || "");
  }

  getErrors(): ClientError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors.length = 0;
  }
}

const logger = new Logger();

export interface UseMonitoringOptions {
  enableErrorTracking?: boolean;
  onError?: (error: ClientError) => void;
}

export interface UseMonitoringReturn {
  errors: ClientError[];
  clearErrors: () => void;
  logError: (message: string, context?: Record<string, unknown>, stack?: string) => void;
}

export function useMonitoring(options: UseMonitoringOptions = {}): UseMonitoringReturn {
  const { enableErrorTracking = true, onError } = options;
  const [errors, setErrors] = useState<ClientError[]>([]);
  const errorHandlerRef = useRef<((event: ErrorEvent) => void) | null>(null);
  const unhandledRejectionHandlerRef = useRef<((event: PromiseRejectionEvent) => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !enableErrorTracking) return;

    const originalError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const message = args[0] instanceof Error ? args[0].message : String(args[0]);
      const stack = args[0] instanceof Error ? args[0].stack : undefined;
      const context = args.slice(1).length > 0 ? { data: args.slice(1) } : undefined;

      const errorEntry: ClientError = {
        id: crypto.randomUUID(),
        message,
        stack,
        source: "console",
        timestamp: Date.now(),
        context: context as Record<string, unknown> | undefined,
      };

      setErrors((prev) => [...prev, errorEntry].slice(-100));
      onError?.(errorEntry);
      originalError(...args);
    };

    errorHandlerRef.current = (event: ErrorEvent) => {
      const errorEntry: ClientError = {
        id: crypto.randomUUID(),
        message: event.message,
        stack: event.error?.stack,
        source: "unhandled",
        timestamp: Date.now(),
        context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      };
      setErrors((prev) => [...prev, errorEntry].slice(-100));
      onError?.(errorEntry);
    };
    window.addEventListener("error", errorHandlerRef.current);

    unhandledRejectionHandlerRef.current = (event: PromiseRejectionEvent) => {
      const errorEntry: ClientError = {
        id: crypto.randomUUID(),
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        source: "promise",
        timestamp: Date.now(),
        context: { reason: event.reason?.toString() },
      };
      setErrors((prev) => [...prev, errorEntry].slice(-100));
      onError?.(errorEntry);
    };
    window.addEventListener("unhandledrejection", unhandledRejectionHandlerRef.current);

    return () => {
      if (errorHandlerRef.current) window.removeEventListener("error", errorHandlerRef.current);
      if (unhandledRejectionHandlerRef.current) {
        window.removeEventListener("unhandledrejection", unhandledRejectionHandlerRef.current);
      }
    };
  }, [enableErrorTracking, onError]);

  const clearErrors = useCallback(() => {
    logger.clearErrors();
    setErrors([]);
  }, []);

  const logError = useCallback(
    (message: string, context?: Record<string, unknown>, stack?: string) => {
      logger.error(message, context, stack);
    },
    [],
  );

  return { errors, clearErrors, logError };
}
