/**
 * @workspace/shared - Shared utilities for DevPrep
 *
 * This package contains shared constants, types, and utilities that can be used
 * across different packages in the workspace.
 */

// Logger
export {
  default,
  createLogger,
  createCorrelatedLogger,
  analyticsLogger,
  apiLogger,
  appLogger,
  dbLogger,
  authLogger,
  monitoringLogger,
  correlatedLogger,
  LogLevel,
  logSlowOperation,
  logQuery,
  logRequest,
  type RequestLogData,
} from "./logger";
export type {
  LogContext,
  LogEntry,
  LoggerOptions,
  Logger,
  CorrelationContext,
} from "./logger";

// Timeout abstractions
export { TypedTimeout, TypedInterval, debounce, throttle } from "./timeout";
export type { TimeoutId, IntervalId } from "./timeout";

// Constants
export {
  TIMEOUT_DURATIONS,
  ANALYTICS_LIMITS,
  UI_CONSTANTS,
  KEYBOARD_SHORTCUTS,
  STORAGE_KEYS,
  FLASHCARD_STATUS,
  CODING_STATUS,
  SEARCH_EVENT_TYPES,
} from "./constants";

export type {
  TimeoutDuration,
  AnalyticsLimit,
  UIConstant,
  FlashcardStatus,
  CodingStatus,
  SearchEventType,
  StorageKey,
} from "./constants";
