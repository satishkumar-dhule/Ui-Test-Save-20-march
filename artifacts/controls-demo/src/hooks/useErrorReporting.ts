/**
 * Client-Side Error Reporting Hook
 * 
 * Provides integration with external error tracking services.
 * Currently supports Sentry configuration (can be extended for others).
 */

import { useEffect, useRef, useCallback, useState } from "react";

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
  };
  tags?: Record<string, string>;
}

export interface UseErrorReportingOptions {
  /** Enable error reporting */
  enabled?: boolean;
  /** Sentry DSN (if using Sentry) */
  sentryDsn?: string;
  /** Application version */
  release?: string;
  /** Environment */
  environment?: string;
  /** User ID (if authenticated) */
  userId?: string;
  /** User email (if authenticated) */
  userEmail?: string;
  /** Additional tags to include with every error */
  tags?: Record<string, string>;
  /** Maximum number of errors to keep in memory */
  maxErrors?: number;
  /** Callback when error is reported */
  onError?: (error: ErrorReport) => void;
}

export interface UseErrorReportingReturn {
  /** Report a custom error */
  reportError: (error: Error | string, context?: Record<string, unknown>) => string;
  /** Get list of reported errors */
  getErrors: () => ErrorReport[];
  /** Clear error history */
  clearErrors: () => void;
  /** Set user context */
  setUser: (userId: string, email?: string) => void;
  /** Add a tag to all future errors */
  addTag: (key: string, value: string) => void;
  /** Whether Sentry is configured */
  isSentryConfigured: boolean;
}

// In-memory error storage
const errorStorage: ErrorReport[] = [];
let maxStorageSize = 100;

class ErrorReporter {
  private options: Required<UseErrorReportingOptions>;
  private tags: Record<string, string> = {};
  private user: { id?: string; email?: string } = {};
  private sentry: unknown = null;
  private isSentryLoaded = false;

  constructor(options: UseErrorReportingOptions) {
    this.options = {
      enabled: options.enabled ?? true,
      sentryDsn: options.sentryDsn ?? "",
      release: options.release ?? "1.0.0",
      environment: options.environment ?? (typeof import.meta !== "undefined" && import.meta.env?.MODE) || "development",
      userId: options.userId ?? "",
      userEmail: options.userEmail ?? "",
      tags: options.tags ?? {},
      maxErrors: options.maxErrors ?? 100,
      onError: options.onError ?? (() => {}),
    };
    maxStorageSize = this.options.maxErrors;

    // Set initial user
    if (this.options.userId) {
      this.user = { id: this.options.userId, email: this.options.userEmail };
    }

    // Merge initial tags
    this.tags = { ...this.options.tags };

    // Initialize Sentry if DSN is provided
    if (this.options.sentryDsn && typeof window !== "undefined") {
      this.initializeSentry();
    }
  }

  private async initializeSentry(): Promise<void> {
    try {
      // Dynamic import to avoid bundling if not used
      const Sentry = await import("@sentry/browser");
      
      Sentry.init({
        dsn: this.options.sentryDsn,
        release: this.options.release,
        environment: this.options.environment,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1, // 10% of transactions
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of errors
      });

      this.sentry = Sentry;
      this.isSentryLoaded = true;

      // Set user if available
      if (this.user.id) {
        Sentry.setUser({ id: this.user.id, email: this.user.email });
      }

      // Set tags
      if (Object.keys(this.tags).length > 0) {
        Sentry.setTags(this.tags);
      }
    } catch (error) {
      console.warn("[ErrorReporter] Failed to initialize Sentry:", error);
    }
  }

  report(error: Error | string, context?: Record<string, unknown>): string {
    if (!this.options.enabled) return "";

    const errorId = crypto.randomUUID();
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorStack = typeof error === "string" ? undefined : error.stack;

    const report: ErrorReport = {
      id: errorId,
      message: errorMessage,
      stack: errorStack,
      timestamp: Date.now(),
      context,
      user: this.user.id ? this.user : undefined,
      tags: { ...this.tags },
    };

    // Store locally
    errorStorage.push(report);
    if (errorStorage.length > maxStorageSize) {
      errorStorage.shift();
    }

    // Report to Sentry if configured
    if (this.isSentryLoaded && this.sentry) {
      const Sentry = this.sentry as {
        captureException: (error: Error, options?: Record<string, unknown>) => string;
        setContext: (key: string, context: Record<string, unknown>) => void;
        setTag: (key: string, value: string) => void;
      };
      
      Sentry.captureException(
        typeof error === "string" ? new Error(error) : error,
        {
          extra: {
            errorId,
            ...context,
          },
        }
      );

      if (context) {
        Sentry.setContext("custom", context);
      }

      // Add tags
      for (const [key, value] of Object.entries(this.tags)) {
        Sentry.setTag(key, value);
      }
    }

    // Console log in development
    if (this.options.environment === "development") {
      console.error(`[ErrorReporter] Error ${errorId}:`, {
        message: errorMessage,
        stack: errorStack,
        context,
      });
    }

    // Call callback
    this.options.onError(report);

    return errorId;
  }

  getErrors(): ErrorReport[] {
    return [...errorStorage];
  }

  clearErrors(): void {
    errorStorage.length = 0;
  }

  setUser(userId: string, email?: string): void {
    this.user = { id: userId, email };
    
    if (this.isSentryLoaded && this.sentry) {
      const Sentry = this.sentry as { setUser: (user: { id: string; email?: string }) => void };
      Sentry.setUser({ id: userId, email });
    }
  }

  addTag(key: string, value: string): void {
    this.tags[key] = value;
    
    if (this.isSentryLoaded && this.sentry) {
      const Sentry = this.sentry as { setTag: (key: string, value: string) => void };
      Sentry.setTag(key, value);
    }
  }

  updateOptions(options: Partial<UseErrorReportingOptions>): void {
    Object.assign(this.options, options);
  }

  get isConfigured(): boolean {
    return this.options.sentryDsn !== "";
  }
}

// Singleton instance
let reporterInstance: ErrorReporter | null = null;

export function useErrorReporting(options: UseErrorReportingOptions = {}): UseErrorReportingReturn {
  // Initialize reporter on first use
  if (!reporterInstance) {
    reporterInstance = new ErrorReporter(options);
  }

  const [, forceUpdate] = useState({});
  const optionsRef = useRef(options);
  
  // Update options if they change
  useEffect(() => {
    if (JSON.stringify(options) !== JSON.stringify(optionsRef.current)) {
      optionsRef.current = options;
      reporterInstance?.updateOptions(options);
    }
  }, [options]);

  const reportError = useCallback((error: Error | string, context?: Record<string, unknown>): string => {
    const errorId = reporterInstance?.report(error, context) ?? "";
    forceUpdate({}); // Trigger re-render to update error list
    return errorId;
  }, []);

  const getErrors = useCallback((): ErrorReport[] => {
    return reporterInstance?.getErrors() ?? [];
  }, []);

  const clearErrors = useCallback((): void => {
    reporterInstance?.clearErrors();
    forceUpdate({});
  }, []);

  const setUser = useCallback((userId: string, email?: string): void => {
    reporterInstance?.setUser(userId, email);
  }, []);

  const addTag = useCallback((key: string, value: string): void => {
    reporterInstance?.addTag(key, value);
  }, []);

  return {
    reportError,
    getErrors,
    clearErrors,
    setUser,
    addTag,
    isSentryConfigured: reporterInstance?.isConfigured ?? false,
  };
}

// Export singleton for non-hook usage
export function getErrorReporter(): ErrorReporter | null {
  return reporterInstance;
}

export function initializeErrorReporter(options: UseErrorReportingOptions): ErrorReporter {
  reporterInstance = new ErrorReporter(options);
  return reporterInstance;
}
