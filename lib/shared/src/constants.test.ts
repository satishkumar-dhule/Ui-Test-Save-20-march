import { describe, it, expect } from "vitest";
import {
  TIMEOUT_DURATIONS,
  ANALYTICS_LIMITS,
  UI_CONSTANTS,
  KEYBOARD_SHORTCUTS,
  STORAGE_KEYS,
  FLASHCARD_STATUS,
  CODING_STATUS,
  SEARCH_EVENT_TYPES,
} from "../src/constants";

describe("TIMEOUT_DURATIONS", () => {
  it("should have all required timeout values", () => {
    expect(TIMEOUT_DURATIONS.DEBOUNCE_SHORT).toBe(150);
    expect(TIMEOUT_DURATIONS.DEBOUNCE_MEDIUM).toBe(300);
    expect(TIMEOUT_DURATIONS.DEBOUNCE_LONG).toBe(500);
    expect(TIMEOUT_DURATIONS.SEARCH_DELAY).toBe(300);
  });

  it("should have valid cache TTL values", () => {
    expect(TIMEOUT_DURATIONS.CACHE_TTL_SHORT).toBe(2 * 60 * 1000);
    expect(TIMEOUT_DURATIONS.CACHE_TTL_MEDIUM).toBe(15 * 60 * 1000);
    expect(TIMEOUT_DURATIONS.CACHE_TTL_LONG).toBe(60 * 60 * 1000);
  });
});

describe("ANALYTICS_LIMITS", () => {
  it("should have reasonable limits", () => {
    expect(ANALYTICS_LIMITS.MAX_SEARCH_EVENTS).toBeGreaterThan(0);
    expect(ANALYTICS_LIMITS.MAX_VOICE_PRACTICE_ENTRIES).toBeGreaterThan(0);
  });

  it("should have valid retention period", () => {
    expect(ANALYTICS_LIMITS.DATA_RETENTION_PERIOD_MS).toBe(
      90 * 24 * 60 * 60 * 1000,
    );
  });
});

describe("UI_CONSTANTS", () => {
  it("should have valid breakpoint", () => {
    expect(UI_CONSTANTS.MOBILE_BREAKPOINT).toBe(768);
  });

  it("should have valid dimensions", () => {
    expect(UI_CONSTANTS.SIDEBAR_WIDTH).toBeGreaterThan(0);
    expect(UI_CONSTANTS.HEADER_HEIGHT).toBeGreaterThan(0);
  });
});

describe("KEYBOARD_SHORTCUTS", () => {
  it("should have search modal shortcut", () => {
    expect(KEYBOARD_SHORTCUTS.SEARCH_MODAL.key).toBe("k");
    expect(KEYBOARD_SHORTCUTS.SEARCH_MODAL.metaKey).toBe(true);
  });

  it("should have flashcard navigation shortcuts", () => {
    expect(KEYBOARD_SHORTCUTS.NEXT.key).toBe("ArrowRight");
    expect(KEYBOARD_SHORTCUTS.PREVIOUS.key).toBe("ArrowLeft");
    expect(KEYBOARD_SHORTCUTS.FLIP.key).toBe(" ");
  });
});

describe("STORAGE_KEYS", () => {
  it("should have devprep prefix", () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      expect(key.startsWith("devprep:")).toBe(true);
    });
  });
});

describe("FLASHCARD_STATUS", () => {
  it("should have all required statuses", () => {
    expect(FLASHCARD_STATUS.UNSEEN).toBe("unseen");
    expect(FLASHCARD_STATUS.REVIEWING).toBe("reviewing");
    expect(FLASHCARD_STATUS.KNOWN).toBe("known");
    expect(FLASHCARD_STATUS.HARD).toBe("hard");
  });
});

describe("CODING_STATUS", () => {
  it("should have all required statuses", () => {
    expect(CODING_STATUS.NOT_STARTED).toBe("not_started");
    expect(CODING_STATUS.IN_PROGRESS).toBe("in_progress");
    expect(CODING_STATUS.COMPLETED).toBe("completed");
  });
});

describe("SEARCH_EVENT_TYPES", () => {
  it("should have all required event types", () => {
    expect(SEARCH_EVENT_TYPES.OPENED).toBe("opened");
    expect(SEARCH_EVENT_TYPES.QUERY).toBe("query");
    expect(SEARCH_EVENT_TYPES.RESULT_SELECTED).toBe("result_selected");
  });
});
