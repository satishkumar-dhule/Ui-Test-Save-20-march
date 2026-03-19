/**
 * Shared constants for the DevPrep application.
 * Centralizes magic numbers and configuration values.
 */

// ==================== Timeout Durations ====================
export const TIMEOUT_DURATIONS = {
  /** Short debounce for rapid inputs */
  DEBOUNCE_SHORT: 150,
  /** Medium debounce for search inputs */
  DEBOUNCE_MEDIUM: 300,
  /** Long debounce for less urgent updates */
  DEBOUNCE_LONG: 500,
  /** Search API delay */
  SEARCH_DELAY: 300,
  /** Auto-advance to next flashcard after marking */
  AUTO_ADVANCE_DELAY: 200,
  /** Toast notification remove delay */
  TOAST_REMOVE_DELAY: 1000000,
  /** Cache TTL - short (2 minutes) */
  CACHE_TTL_SHORT: 2 * 60 * 1000,
  /** Cache TTL - medium (15 minutes) */
  CACHE_TTL_MEDIUM: 15 * 60 * 1000,
  /** Cache TTL - long (1 hour) */
  CACHE_TTL_LONG: 60 * 60 * 1000,
  /** Session check interval */
  SESSION_CHECK: 60 * 1000,
} as const;

export type TimeoutDuration = (typeof TIMEOUT_DURATIONS)[keyof typeof TIMEOUT_DURATIONS];

// ==================== Analytics Limits ====================
export const ANALYTICS_LIMITS = {
  /** Maximum number of search events to keep */
  MAX_SEARCH_EVENTS: 500,
  /** Maximum number of voice practice entries */
  MAX_VOICE_PRACTICE_ENTRIES: 1000,
  /** Maximum number of visited quests to track */
  MAX_VISITED_QUESTS: 100,
  /** Maximum number of exam attempts to keep */
  MAX_EXAM_ATTEMPTS: 50,
  /** Data retention period in milliseconds (90 days) */
  DATA_RETENTION_PERIOD_MS: 90 * 24 * 60 * 60 * 1000,
} as const;

export type AnalyticsLimit = (typeof ANALYTICS_LIMITS)[keyof typeof ANALYTICS_LIMITS];

// ==================== UI Constants ====================
export const UI_CONSTANTS = {
  /** Mobile breakpoint in pixels */
  MOBILE_BREAKPOINT: 768,
  /** Toast limit */
  TOAST_LIMIT: 1,
  /** Touch target minimum size in pixels */
  TOUCH_TARGET_SIZE: 44,
  /** Sidebar width in pixels */
  SIDEBAR_WIDTH: 260,
  /** Header height in pixels */
  HEADER_HEIGHT: 52,
  /** Channel bar height in pixels */
  CHANNEL_BAR_HEIGHT: 44,
  /** Section tabs height in pixels */
  SECTION_TABS_HEIGHT: 44,
  /** Flashcard minimum height */
  FLASHCARD_MIN_HEIGHT: 280,
  /** Flashcard perspective for 3D effect */
  FLASHCARD_PERSPECTIVE: 1200,
} as const;

export type UIConstant = (typeof UI_CONSTANTS)[keyof typeof UI_CONSTANTS];

// ==================== Keyboard Shortcuts ====================
export const KEYBOARD_SHORTCUTS = {
  /** Search modal shortcut */
  SEARCH_MODAL: { key: "k", metaKey: true, ctrlKey: true },
  /** Navigate to next item */
  NEXT: { key: "ArrowRight" },
  /** Navigate to previous item */
  PREVIOUS: { key: "ArrowLeft" },
  /** Flip flashcard */
  FLIP: { key: " " },
  /** Mark as known (flashcard) */
  MARK_KNOWN: { key: "1" },
  /** Mark for review (flashcard) */
  MARK_REVIEW: { key: "2" },
  /** Mark as hard (flashcard) */
  MARK_HARD: { key: "3" },
} as const;

// ==================== Local Storage Keys ====================
export const STORAGE_KEYS = {
  /** User ID for analytics */
  USER_ID: "devprep:userId",
  /** Analytics data */
  ANALYTICS: "devprep:analytics",
  /** Progress data */
  PROGRESS: "devprep:progress",
  /** Generated content cache */
  GENERATED_CONTENT: "devprep:generated-content",
  /** Selected channel IDs */
  SELECTED_IDS: "devprep:selectedIds",
  /** Current channel ID */
  CHANNEL_ID: "devprep:channelId",
  /** Theme preference */
  THEME: "devprep:theme",
  /** Current section */
  SECTION: "devprep:section",
  /** Channel type filter */
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

export type FlashcardStatus = (typeof FLASHCARD_STATUS)[keyof typeof FLASHCARD_STATUS];

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

export type SearchEventType = (typeof SEARCH_EVENT_TYPES)[keyof typeof SEARCH_EVENT_TYPES];
