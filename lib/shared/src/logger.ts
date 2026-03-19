/**
 * Centralized logging utility for structured logging across the application.
 * Supports correlation IDs, multiple log levels, and structured JSON output.
 *
 * Features:
 * - Correlation ID tracking for request tracing
 * - Structured JSON logging for easy parsing
 * - Multiple log levels (debug, info, warn, error)
 * - Performance tracking helpers
 * - Console output in development, JSON in production
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export type LogContext = Record<string, unknown>;

export interface LogEntry {
  timestamp: string;
  level: string;
  levelValue: number;
  message: string;
  context?: LogContext;
  source?: string;
  correlationId?: string;
  durationMs?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerOptions {
  source?: string;
  minLevel?: LogLevel;
  enableJson?: boolean;
  enableTimestamp?: boolean;
  enableCorrelationId?: boolean;
}

export interface CorrelationContext {
  correlationId: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

const isProduction =
  typeof process !== "undefined" && process.env?.NODE_ENV === "production";
const DEFAULT_MIN_LEVEL = isProduction ? LogLevel.INFO : LogLevel.DEBUG;

// =============================================================================
// LOG HISTORY (for debugging and testing)
// =============================================================================

const logHistory: LogEntry[] = [];
const MAX_HISTORY_SIZE = 1000;

// =============================================================================
// UUID GENERATOR (browser-compatible)
// =============================================================================

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// LOG ENTRY CREATION
// =============================================================================

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  options?: LoggerOptions,
  correlationId?: string,
  durationMs?: number,
  error?: Error,
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LOG_LEVEL_NAMES[level],
    levelValue: level,
    message,
    source: options?.source || "app",
    correlationId,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (durationMs !== undefined) {
    entry.durationMs = durationMs;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

// =============================================================================
// JSON STRINGIFIER WITH CIRCULAR REFERENCE HANDLING
// =============================================================================

function safeStringify(obj: unknown): string {
  const seen = new WeakSet();

  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (typeof value === "bigint") {
      return value.toString();
    }

    if (typeof value === "symbol") {
      return value.toString();
    }

    if (typeof value === "function") {
      return "[Function]";
    }

    return value;
  });
}

// =============================================================================
// LOG OUTPUT
// =============================================================================

function outputLog(entry: LogEntry, options?: LoggerOptions): void {
  logHistory.push(entry);
  if (logHistory.length > MAX_HISTORY_SIZE) {
    logHistory.shift();
  }

  const jsonOutput =
    options?.enableJson ??
    (typeof process !== "undefined" && process.env?.NODE_ENV === "production");

  if (jsonOutput) {
    console.log(safeStringify(entry));
  } else {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      `[${entry.source || "app"}]`,
    ];

    if (entry.correlationId) {
      parts.push(`[${entry.correlationId}]`);
    }

    parts.push(entry.message);

    if (entry.durationMs !== undefined) {
      parts.push(`(+${entry.durationMs}ms)`);
    }

    const output = parts.join(" ");

    switch (entry.levelValue) {
      case LogLevel.DEBUG:
        console.debug(output, entry.context || "");
        break;
      case LogLevel.INFO:
        console.info(output, entry.context || "");
        break;
      case LogLevel.WARN:
        console.warn(output, entry.context || "");
        break;
      case LogLevel.ERROR:
        console.error(output, entry.context || "");
        break;
    }
  }
}

// =============================================================================
// BASE LOGGER CLASS
// =============================================================================

class BaseLogger {
  protected source: string;
  protected minLevel: LogLevel;
  protected enableJson: boolean;
  protected enableTimestamp: boolean;
  protected enableCorrelationId: boolean;

  constructor(options: LoggerOptions = {}) {
    this.source = options.source || "app";
    this.minLevel = options.minLevel ?? DEFAULT_MIN_LEVEL;
    this.enableJson = options.enableJson ?? false;
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.enableCorrelationId = options.enableCorrelationId ?? true;
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  protected log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    correlationId?: string,
    durationMs?: number,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = createLogEntry(
      level,
      message,
      context,
      {
        source: this.source,
        enableJson: this.enableJson,
        enableTimestamp: this.enableTimestamp,
        enableCorrelationId: this.enableCorrelationId,
      },
      correlationId,
      durationMs,
      error,
    );

    outputLog(entry);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, undefined, undefined, error);
  }

  trackDuration<T>(operation: string, fn: () => T, context?: LogContext): T {
    const start = performance.now();
    try {
      const result = fn();
      const durationMs = performance.now() - start;
      this.debug(`[PERF] ${operation} completed`, {
        ...context,
        durationMs: Math.round(durationMs * 100) / 100,
      });
      return result;
    } catch (err) {
      const durationMs = performance.now() - start;
      this.error(
        `[PERF] ${operation} failed`,
        {
          ...context,
          durationMs: Math.round(durationMs * 100) / 100,
        },
        err instanceof Error ? err : new Error(String(err)),
      );
      throw err;
    }
  }

  async trackDurationAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = performance.now() - start;
      this.debug(`[PERF] ${operation} completed`, {
        ...context,
        durationMs: Math.round(durationMs * 100) / 100,
      });
      return result;
    } catch (err) {
      const durationMs = performance.now() - start;
      this.error(
        `[PERF] ${operation} failed`,
        {
          ...context,
          durationMs: Math.round(durationMs * 100) / 100,
        },
        err instanceof Error ? err : new Error(String(err)),
      );
      throw err;
    }
  }

  getHistory(count: number = 100): LogEntry[] {
    return logHistory.slice(-count);
  }

  clearHistory(): void {
    logHistory.length = 0;
  }
}

// =============================================================================
// CORRELATED LOGGER (for request tracking)
// =============================================================================

class CorrelatedLogger extends BaseLogger {
  constructor(options: LoggerOptions = {}) {
    super({ ...options, enableCorrelationId: true });
  }

  createCorrelationId(): string {
    return generateUUID();
  }

  withCorrelation(correlationId: string): CorrelatedLogger {
    const child = new CorrelatedLogger({
      source: this.source,
      minLevel: this.minLevel,
      enableJson: this.enableJson,
    });

    return child;
  }

  logWithCorrelation(
    level: LogLevel,
    message: string,
    correlationId: string,
    context?: LogContext,
  ): void {
    this.log(level, message, context, correlationId);
  }

  debugWithCorrelation(
    message: string,
    correlationId: string,
    context?: LogContext,
  ): void {
    this.logWithCorrelation(LogLevel.DEBUG, message, correlationId, context);
  }

  infoWithCorrelation(
    message: string,
    correlationId: string,
    context?: LogContext,
  ): void {
    this.logWithCorrelation(LogLevel.INFO, message, correlationId, context);
  }

  warnWithCorrelation(
    message: string,
    correlationId: string,
    context?: LogContext,
  ): void {
    this.logWithCorrelation(LogLevel.WARN, message, correlationId, context);
  }

  errorWithCorrelation(
    message: string,
    correlationId: string,
    context?: LogContext,
    error?: Error,
  ): void {
    if (error) {
      this.log(
        LogLevel.ERROR,
        message,
        context,
        correlationId,
        undefined,
        error,
      );
    } else {
      this.logWithCorrelation(LogLevel.ERROR, message, correlationId, context);
    }
  }
}

// =============================================================================
// LOGGING CATEGORIES
// =============================================================================

export interface Logger {
  setLevel(level: LogLevel): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
  trackDuration<T>(operation: string, fn: () => T, context?: LogContext): T;
  trackDurationAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T>;
  getHistory(count?: number): LogEntry[];
  clearHistory(): void;
}

// =============================================================================
// LOGGER FACTORY
// =============================================================================

export function createLogger(source: string): Logger {
  return new BaseLogger({ source }) as Logger;
}

export function createCorrelatedLogger(source: string): CorrelatedLogger {
  return new CorrelatedLogger({ source });
}

// =============================================================================
// PRE-CONFIGURED LOGGER INSTANCES
// =============================================================================

export const analyticsLogger = createLogger("analytics");
export const apiLogger = createLogger("api");
export const appLogger = createLogger("app");
export const dbLogger = createLogger("database");
export const authLogger = createLogger("auth");
export const monitoringLogger = createLogger("monitoring");

export const correlatedLogger = createCorrelatedLogger("api");

const defaultLogger = createLogger("app");
export default defaultLogger;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function logSlowOperation(
  operation: string,
  thresholdMs: number,
  actualMs: number,
  context?: LogContext,
): void {
  const logger = createLogger("performance");
  logger.warn(`Slow operation detected: ${operation}`, {
    ...context,
    thresholdMs,
    actualMs,
    slowdownMs: actualMs - thresholdMs,
    slowdownPercent: Math.round((actualMs / thresholdMs - 1) * 100),
  });
}

export function logQuery(
  query: string,
  durationMs: number,
  params?: unknown[],
  error?: Error,
): void {
  const isSlow = durationMs > 100;

  const logFn = isSlow
    ? dbLogger.warn.bind(dbLogger)
    : dbLogger.debug.bind(dbLogger);

  logFn("Database query", {
    query: query.substring(0, 200),
    durationMs: Math.round(durationMs * 100) / 100,
    paramCount: params?.length || 0,
    isSlow,
    error: error?.message,
  });
}

export interface RequestLogData {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  correlationId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

export function logRequest(data: RequestLogData): void {
  const { method, path, statusCode, durationMs, correlationId, error } = data;

  let level: LogLevel;
  let logMessage: string;

  if (error || statusCode >= 500) {
    level = LogLevel.ERROR;
    logMessage = `${method} ${path} ${statusCode} - ERROR`;
  } else if (statusCode >= 400) {
    level = LogLevel.WARN;
    logMessage = `${method} ${path} ${statusCode} - WARNING`;
  } else {
    level = LogLevel.INFO;
    logMessage = `${method} ${path} ${statusCode}`;
  }

  const logFn =
    level === LogLevel.ERROR
      ? apiLogger.error.bind(apiLogger)
      : level === LogLevel.WARN
        ? apiLogger.warn.bind(apiLogger)
        : apiLogger.info.bind(apiLogger);

  logFn(logMessage, {
    method,
    path,
    statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
    correlationId,
    userId: data.userId,
    ip: data.ip,
    userAgent: data.userAgent,
    requestSize: data.requestSize,
    responseSize: data.responseSize,
    error: data.error,
  });
}
