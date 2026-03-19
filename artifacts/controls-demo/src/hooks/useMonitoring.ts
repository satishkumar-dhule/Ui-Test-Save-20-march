/**
 * Frontend Monitoring Hook
 * 
 * Provides comprehensive client-side observability:
 * - Console error interception
 * - Performance metrics (Core Web Vitals)
 * - Navigation tracking
 * - Feature flag usage tracking
 * - API failure tracking with retry attempts
 */

import { useEffect, useRef, useCallback, useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface ClientError {
  id: string;
  message: string;
  stack?: string;
  source: "console" | "unhandled" | "promise" | "resource" | "network";
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

export interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
  duration?: number;
  type: "navigate" | "back_forward" | "reload" | " prerender";
}

export interface ApiFailure {
  url: string;
  method: string;
  statusCode?: number;
  errorMessage?: string;
  retryCount: number;
  timestamp: number;
  correlationId?: string;
}

export interface FeatureFlagEvent {
  flag: string;
  value: unknown;
  source: "default" | "localStorage" | "remote" | "experiment";
  timestamp: number;
}

// =============================================================================
// LOG LEVELS
// =============================================================================

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// =============================================================================
// LOGGER
// =============================================================================

class ClientLogger {
  private minLevel: LogLevel;
  private source: string;
  private errorHistory: ClientError[] = [];
  private readonly maxHistorySize = 100;

  constructor(source: string = "monitoring", minLevel: LogLevel = LogLevel.INFO) {
    this.source = source;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private createErrorEntry(
    message: string,
    source: ClientError["source"],
    stack?: string,
    context?: Record<string, unknown>
  ): ClientError {
    return {
      id: crypto.randomUUID(),
      message,
      stack,
      source,
      timestamp: Date.now(),
      context,
    };
  }

  error(message: string, context?: Record<string, unknown>, stack?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createErrorEntry(message, "console", stack, context);
      this.errorHistory.push(entry);
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory.shift();
      }
      console.error(
        `[${new Date().toISOString()}] [ERROR] [${this.source}] ${message}`,
        context || ""
      );
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(
        `[${new Date().toISOString()}] [WARN] [${this.source}] ${message}`,
        context || ""
      );
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(
        `[${new Date().toISOString()}] [INFO] [${this.source}] ${message}`,
        context || ""
      );
    }
  }

  getErrorHistory(): ClientError[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory.length = 0;
  }
}

const monitoringLogger = new ClientLogger("monitoring");

// =============================================================================
// API FAILURE TRACKER
// =============================================================================

class ApiFailureTracker {
  private failures: ApiFailure[] = [];
  private readonly maxFailures = 100;
  private readonly retryDelay = 1000; // ms

  trackFailure(
    url: string,
    method: string,
    error: Error | Response,
    retryCount: number = 0,
    correlationId?: string
  ): void {
    const failure: ApiFailure = {
      url,
      method,
      statusCode: error instanceof Response ? error.status : undefined,
      errorMessage: error instanceof Error ? error.message : error.statusText,
      retryCount,
      timestamp: Date.now(),
      correlationId,
    };

    this.failures.push(failure);
    if (this.failures.length > this.maxFailures) {
      this.failures.shift();
    }

    monitoringLogger.error(`API request failed: ${method} ${url}`, {
      statusCode: failure.statusCode,
      retryCount: failure.retryCount,
      errorMessage: failure.errorMessage,
      correlationId,
    });
  }

  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      url?: string;
      method?: string;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = this.retryDelay,
      url = "unknown",
      method = "GET",
    } = options;

    let lastError: Error | undefined;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (retryCount < maxRetries) {
          monitoringLogger.info(`Retrying request (attempt ${retryCount + 1}/${maxRetries})`, {
            url,
            error: lastError.message,
          });
          
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (retryCount + 1)));
          retryCount++;
        } else {
          this.trackFailure(url, method, lastError, retryCount);
        }
      }
    }

    throw lastError;
  }

  getFailures(): ApiFailure[] {
    return [...this.failures];
  }

  clearFailures(): void {
    this.failures.length = 0;
  }
}

const apiFailureTracker = new ApiFailureTracker();

// =============================================================================
// PERFORMANCE OBSERVER
// =============================================================================

class PerformanceObserver {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 50;

  observe(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      monitoringLogger.warn("PerformanceObserver not supported");
      return;
    }

    // Observe Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // Observe First Input Delay (FID)
    this.observeFID();
    
    // Observe Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // Observe navigation timing
    this.observeNavigation();
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;
        
        const metric: PerformanceMetric = {
          name: "LCP",
          value: lastEntry.startTime,
          rating: this.getLCPRating(lastEntry.startTime),
          delta: lastEntry.startTime,
          id: crypto.randomUUID(),
          entries: [lastEntry],
        };
        
        this.addMetric(metric);
        this.logMetric(metric);
      });
      
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {
      monitoringLogger.warn("LCP observation failed", { error: String(e) });
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric: PerformanceMetric = {
            name: "FID",
            value: (entry as EventTiming).processingStart - entry.startTime,
            rating: this.getFIDRating((entry as EventTiming).processingStart - entry.startTime),
            delta: (entry as EventTiming).processingStart - entry.startTime,
            id: crypto.randomUUID(),
            entries: [entry],
          };
          
          this.addMetric(metric);
          this.logMetric(metric);
        }
      });
      
      observer.observe({ type: "first-input", buffered: true });
    } catch (e) {
      monitoringLogger.warn("FID observation failed", { error: String(e) });
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      let clsEntries: LayoutShift[] = [];
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as LayoutShift;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
            clsEntries.push(layoutShift);
          }
        }
        
        if (clsEntries.length > 0) {
          const metric: PerformanceMetric = {
            name: "CLS",
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            delta: clsValue,
            id: crypto.randomUUID(),
            entries: clsEntries,
          };
          
          this.addMetric(metric);
          this.logMetric(metric);
        }
      });
      
      observer.observe({ type: "layout-shift", buffered: true });
    } catch (e) {
      monitoringLogger.warn("CLS observation failed", { error: String(e) });
    }
  }

  private observeNavigation(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          const metric: PerformanceMetric = {
            name: "navigation",
            value: navEntry.responseStart - navEntry.requestStart,
            rating: "good",
            delta: navEntry.responseStart - navEntry.requestStart,
            id: crypto.randomUUID(),
            entries: [navEntry],
          };
          
          this.addMetric(metric);
        }
      });
      
      observer.observe({ type: "navigation", buffered: true });
    } catch (e) {
      monitoringLogger.warn("Navigation observation failed", { error: String(e) });
    }
  }

  private getLCPRating(value: number): PerformanceMetric["rating"] {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }

  private getFIDRating(value: number): PerformanceMetric["rating"] {
    if (value <= 100) return "good";
    if (value <= 300) return "needs-improvement";
    return "poor";
  }

  private getCLSRating(value: number): PerformanceMetric["rating"] {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  private logMetric(metric: PerformanceMetric): void {
    monitoringLogger.info(`Performance metric: ${metric.name}`, {
      value: Math.round(metric.value * 100) / 100,
      rating: metric.rating,
    });
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsSummary(): Record<string, { avg: number; count: number; latest: number }> {
    const summary: Record<string, { avg: number; count: number; latest: number }> = {};
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, count: 0, latest: 0 };
      }
      const s = summary[metric.name];
      s.avg = (s.avg * s.count + metric.value) / (s.count + 1);
      s.count++;
      s.latest = metric.value;
    }
    
    return summary;
  }
}

const performanceObserver = new PerformanceObserver();

// =============================================================================
// NAVIGATION TRACKER
// =============================================================================

class NavigationTracker {
  private events: NavigationEvent[] = [];
  private readonly maxEvents = 100;
  private startTime: number = Date.now();
  private lastPath: string = "";

  observe(): void {
    if (typeof window === "undefined") return;

    this.lastPath = window.location.pathname;
    this.startTime = Date.now();

    // Track page visibility changes
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));

    // Track navigation timing
    window.addEventListener("popstate", this.handlePopState.bind(this));

    // Use Navigation API if available
    if ("navigation" in window && window.navigation) {
      (window.navigation as Navigation).addEventListener("navigate", this.handleNavigate.bind(this));
    }
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === "hidden") {
      const duration = Date.now() - this.startTime;
      this.trackNavigation("hidden", this.lastPath, duration);
    } else if (document.visibilityState === "visible") {
      this.startTime = Date.now();
    }
  }

  private handlePopState(): void {
    const to = window.location.pathname;
    const duration = Date.now() - this.startTime;
    this.trackNavigation(this.lastPath, to, duration, "back_forward");
    this.lastPath = to;
    this.startTime = Date.now();
  }

  private handleNavigate(event: Event): void {
    const navEvent = event as NavigationEvent & { destination: { url: string } };
    const to = new URL(navEvent.destination.url).pathname;
    const duration = Date.now() - this.startTime;
    
    this.trackNavigation(this.lastPath, to, duration, navEvent.navigationType as NavigationEvent["type"]);
    this.lastPath = to;
    this.startTime = Date.now();
  }

  private trackNavigation(
    from: string,
    to: string,
    duration?: number,
    type: NavigationEvent["type"] = "navigate"
  ): void {
    const event: NavigationEvent = {
      from,
      to,
      timestamp: Date.now(),
      duration,
      type,
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    monitoringLogger.info("Navigation", {
      from,
      to,
      type,
      duration,
    });
  }

  getEvents(): NavigationEvent[] {
    return [...this.events];
  }

  getNavigationSummary(): {
    totalNavigations: number;
    avgDuration: number;
    mostVisited: Array<{ path: string; count: number }>;
  } {
    const pathCounts = new Map<string, number>();
    let totalDuration = 0;
    let durationCount = 0;

    for (const event of this.events) {
      pathCounts.set(event.to, (pathCounts.get(event.to) || 0) + 1);
      if (event.duration) {
        totalDuration += event.duration;
        durationCount++;
      }
    }

    const mostVisited = Array.from(pathCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalNavigations: this.events.length,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      mostVisited,
    };
  }
}

const navigationTracker = new NavigationTracker();

// =============================================================================
// FEATURE FLAG TRACKER
// =============================================================================

class FeatureFlagTracker {
  private events: FeatureFlagEvent[] = [];
  private readonly maxEvents = 100;

  trackFlag(flag: string, value: unknown, source: FeatureFlagEvent["source"] = "default"): void {
    const event: FeatureFlagEvent = {
      flag,
      value,
      source,
      timestamp: Date.now(),
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    monitoringLogger.info(`Feature flag: ${flag}`, { value, source });
  }

  getEvents(): FeatureFlagEvent[] {
    return [...this.events];
  }

  getFlagUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    for (const event of this.events) {
      usage[event.flag] = (usage[event.flag] || 0) + 1;
    }
    return usage;
  }
}

const featureFlagTracker = new FeatureFlagTracker();

// =============================================================================
// HOOK
// =============================================================================

export interface UseMonitoringOptions {
  enableErrorTracking?: boolean;
  enablePerformanceMetrics?: boolean;
  enableNavigationTracking?: boolean;
  enableFeatureFlagTracking?: boolean;
  enableApiFailureTracking?: boolean;
  onError?: (error: ClientError) => void;
  onMetric?: (metric: PerformanceMetric) => void;
}

export interface UseMonitoringReturn {
  // Error tracking
  errors: ClientError[];
  clearErrors: () => void;
  
  // Performance metrics
  metrics: PerformanceMetric[];
  metricsSummary: Record<string, { avg: number; count: number; latest: number }>;
  
  // Navigation
  navigationEvents: NavigationEvent[];
  navigationSummary: {
    totalNavigations: number;
    avgDuration: number;
    mostVisited: Array<{ path: string; count: number }>;
  };
  
  // Feature flags
  featureFlagEvents: FeatureFlagEvent[];
  
  // API failures
  apiFailures: ApiFailure[];
  clearApiFailures: () => void;
  
  // Utility
  trackFeatureFlag: (flag: string, value: unknown, source?: FeatureFlagEvent["source"]) => void;
  logError: (message: string, context?: Record<string, unknown>, stack?: string) => void;
  withRetry: <T>(fn: () => Promise<T>, options?: { maxRetries?: number; url?: string; method?: string }) => Promise<T>;
}

export function useMonitoring(options: UseMonitoringOptions = {}): UseMonitoringReturn {
  const {
    enableErrorTracking = true,
    enablePerformanceMetrics = true,
    enableNavigationTracking = true,
    enableFeatureFlagTracking = true,
    enableApiFailureTracking = true,
    onError,
    onMetric,
  } = options;

  const [errors, setErrors] = useState<ClientError[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [navigationEvents, setNavigationEvents] = useState<NavigationEvent[]>([]);
  const [featureFlagEvents, setFeatureFlagEvents] = useState<FeatureFlagEvent[]>([]);
  const [apiFailures, setApiFailures] = useState<ApiFailure[]>([]);

  const errorHandlerRef = useRef<((event: ErrorEvent) => void) | null>(null);
  const unhandledRejectionHandlerRef = useRef<((event: PromiseRejectionEvent) => void) | null>(null);

  // Initialize monitoring on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Error tracking
    if (enableErrorTracking) {
      // Track console errors
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

        setErrors((prev) => {
          const updated = [...prev, errorEntry].slice(-100);
          return updated;
        });

        onError?.(errorEntry);
        originalError(...args);
      };

      // Track unhandled errors
      errorHandlerRef.current = (event: ErrorEvent) => {
        const errorEntry: ClientError = {
          id: crypto.randomUUID(),
          message: event.message,
          stack: event.error?.stack,
          source: "unhandled",
          timestamp: Date.now(),
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        };

        setErrors((prev) => {
          const updated = [...prev, errorEntry].slice(-100);
          return updated;
        });

        onError?.(errorEntry);
      };
      window.addEventListener("error", errorHandlerRef.current);

      // Track unhandled promise rejections
      unhandledRejectionHandlerRef.current = (event: PromiseRejectionEvent) => {
        const errorEntry: ClientError = {
          id: crypto.randomUUID(),
          message: event.reason?.message || "Unhandled Promise Rejection",
          stack: event.reason?.stack,
          source: "promise",
          timestamp: Date.now(),
          context: {
            reason: event.reason?.toString(),
          },
        };

        setErrors((prev) => {
          const updated = [...prev, errorEntry].slice(-100);
          return updated;
        });

        onError?.(errorEntry);
      };
      window.addEventListener("unhandledrejection", unhandledRejectionHandlerRef.current);
    }

    // Performance metrics
    if (enablePerformanceMetrics) {
      performanceObserver.observe();
    }

    // Navigation tracking
    if (enableNavigationTracking) {
      navigationTracker.observe();
    }

    // Cleanup
    return () => {
      if (errorHandlerRef.current) {
        window.removeEventListener("error", errorHandlerRef.current);
      }
      if (unhandledRejectionHandlerRef.current) {
        window.removeEventListener("unhandledrejection", unhandledRejectionHandlerRef.current);
      }
    };
  }, [enableErrorTracking, enablePerformanceMetrics, enableNavigationTracking, onError]);

  // Update metrics periodically
  useEffect(() => {
    if (!enablePerformanceMetrics) return;

    const interval = setInterval(() => {
      setMetrics(performanceObserver.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [enablePerformanceMetrics]);

  // Update navigation events
  useEffect(() => {
    if (!enableNavigationTracking) return;

    const interval = setInterval(() => {
      setNavigationEvents(navigationTracker.getEvents());
    }, 5000);

    return () => clearInterval(interval);
  }, [enableNavigationTracking]);

  // Track API failures
  useEffect(() => {
    if (!enableApiFailureTracking) return;

    const interval = setInterval(() => {
      setApiFailures(apiFailureTracker.getFailures());
    }, 5000);

    return () => clearInterval(interval);
  }, [enableApiFailureTracking]);

  const clearErrors = useCallback(() => {
    monitoringLogger.clearHistory();
    setErrors([]);
  }, []);

  const clearApiFailures = useCallback(() => {
    apiFailureTracker.clearFailures();
    setApiFailures([]);
  }, []);

  const trackFeatureFlag = useCallback(
    (flag: string, value: unknown, source: FeatureFlagEvent["source"] = "default") => {
      featureFlagTracker.trackFlag(flag, value, source);
      if (enableFeatureFlagTracking) {
        setFeatureFlagEvents(featureFlagTracker.getEvents());
      }
    },
    [enableFeatureFlagTracking]
  );

  const logError = useCallback(
    (message: string, context?: Record<string, unknown>, stack?: string) => {
      monitoringLogger.error(message, context, stack);
    },
    []
  );

  const withRetry = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: { maxRetries?: number; url?: string; method?: string }
    ): Promise<T> => {
      return apiFailureTracker.withRetry(fn, {
        ...options,
        url: options?.url || "unknown",
        method: options?.method || "GET",
      });
    },
    []
  );

  return {
    errors,
    clearErrors,
    metrics,
    metricsSummary: performanceObserver.getMetricsSummary(),
    navigationEvents,
    navigationSummary: navigationTracker.getNavigationSummary(),
    featureFlagEvents,
    apiFailures,
    clearApiFailures,
    trackFeatureFlag,
    logError,
    withRetry,
  };
}

// Export utilities for direct use
export { apiFailureTracker, featureFlagTracker, navigationTracker, performanceObserver };
