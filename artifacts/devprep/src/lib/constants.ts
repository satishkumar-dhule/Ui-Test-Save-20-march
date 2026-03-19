/**
 * Shared constants for the DevPrep application.
 * Centralizes magic numbers and configuration values.
 */

// ==================== Timeout Durations ====================
export const TIMEOUT_DURATIONS = {
  DEBOUNCE_SHORT: 150,
  DEBOUNCE_MEDIUM: 300,
  DEBOUNCE_LONG: 500,
  SEARCH_DELAY: 300,
  AUTO_ADVANCE_DELAY: 200,
  TOAST_REMOVE_DELAY: 1000000,
  CACHE_TTL_SHORT: 2 * 60 * 1000,
  CACHE_TTL_MEDIUM: 15 * 60 * 1000,
  CACHE_TTL_LONG: 60 * 60 * 1000,
  SESSION_CHECK: 60 * 1000,
} as const;

export type TimeoutDuration =
  (typeof TIMEOUT_DURATIONS)[keyof typeof TIMEOUT_DURATIONS];

// ==================== Analytics Limits ====================
export const ANALYTICS_LIMITS = {
  MAX_SEARCH_EVENTS: 500,
  MAX_VOICE_PRACTICE_ENTRIES: 1000,
  MAX_VISITED_QUESTS: 100,
  MAX_EXAM_ATTEMPTS: 50,
  DATA_RETENTION_PERIOD_MS: 90 * 24 * 60 * 60 * 1000,
} as const;

export type AnalyticsLimit =
  (typeof ANALYTICS_LIMITS)[keyof typeof ANALYTICS_LIMITS];

// ==================== UI Constants ====================
export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  TOAST_LIMIT: 1,
  TOUCH_TARGET_SIZE: 44,
  SIDEBAR_WIDTH: 260,
  HEADER_HEIGHT: 52,
  CHANNEL_BAR_HEIGHT: 44,
  SECTION_TABS_HEIGHT: 44,
  FLASHCARD_MIN_HEIGHT: 280,
  FLASHCARD_PERSPECTIVE: 1200,
} as const;

export type UIConstant = (typeof UI_CONSTANTS)[keyof typeof UI_CONSTANTS];

// ==================== Keyboard Shortcuts ====================
export const KEYBOARD_SHORTCUTS = {
  SEARCH_MODAL: { key: "k", metaKey: true, ctrlKey: true },
  NEXT: { key: "ArrowRight" },
  PREVIOUS: { key: "ArrowLeft" },
  FLIP: { key: " " },
  MARK_KNOWN: { key: "1" },
  MARK_REVIEW: { key: "2" },
  MARK_HARD: { key: "3" },
} as const;

// ==================== Local Storage Keys ====================
export const STORAGE_KEYS = {
  USER_ID: "devprep:userId",
  ANALYTICS: "devprep:analytics",
  PROGRESS: "devprep:progress",
  GENERATED_CONTENT: "devprep:generated-content",
  SELECTED_IDS: "devprep:selectedIds",
  CHANNEL_ID: "devprep:channelId",
  THEME: "devprep:theme",
  SECTION: "devprep:section",
  CHANNEL_TYPE_FILTER: "devprep:channelTypeFilter",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ==================== Flashcard Status ====================
export const FLASHCARD_STATUS = {
  UNSEEN: "unseen",
  REVIEWING: "reviewing",
  KNOWN: "known",
  HARD: "hard",
} as const;

export type FlashcardStatus =
  (typeof FLASHCARD_STATUS)[keyof typeof FLASHCARD_STATUS];

// ==================== Coding Challenge Status ====================
export const CODING_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type CodingStatus = (typeof CODING_STATUS)[keyof typeof CODING_STATUS];

// ==================== Search Event Types ====================
export const SEARCH_EVENT_TYPES = {
  OPENED: "opened",
  QUERY: "query",
  RESULT_SELECTED: "result_selected",
} as const;

export type SearchEventType =
  (typeof SEARCH_EVENT_TYPES)[keyof typeof SEARCH_EVENT_TYPES];
