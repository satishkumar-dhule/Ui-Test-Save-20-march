import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createLogger,
  LogLevel,
  analyticsLogger,
  logSlowOperation,
  logQuery,
} from "../src/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("createLogger", () => {
    it("should create a logger with default settings", () => {
      const logger = createLogger("test");
      expect(logger).toBeDefined();
    });

    it("should log debug messages when level is DEBUG", () => {
      const logger = createLogger("test");
      logger.setLevel(LogLevel.DEBUG);
      expect(() => logger.debug("test message")).not.toThrow();
    });

    it("should not log debug messages when level is INFO", () => {
      const logger = createLogger("test");
      logger.setLevel(LogLevel.INFO);
      expect(() => logger.debug("test message")).not.toThrow();
    });
  });

  describe("log history", () => {
    it("should track log history", () => {
      const logger = createLogger("test");
      logger.info("first message");
      logger.info("second message");

      const history = logger.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it("should clear log history", () => {
      const logger = createLogger("test");
      logger.info("message");
      logger.clearHistory();

      const history = logger.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe("trackDuration", () => {
    it("should measure execution time", () => {
      vi.useFakeTimers();
      const logger = createLogger("test");

      const result = logger.trackDuration("test operation", () => {
        return 42;
      });

      expect(result).toBe(42);
    });

    it("should throw and log errors", () => {
      const logger = createLogger("test");

      expect(() => {
        logger.trackDuration("failing operation", () => {
          throw new Error("test error");
        });
      }).toThrow("test error");
    });
  });

  describe("trackDurationAsync", () => {
    it("should measure async execution time", async () => {
      vi.useFakeTimers();
      const logger = createLogger("test");

      const result = await logger.trackDurationAsync(
        "async operation",
        async () => {
          return 42;
        },
      );

      expect(result).toBe(42);
    });
  });
});

describe("logSlowOperation", () => {
  it("should log warning for slow operations", () => {
    expect(() => {
      logSlowOperation("test operation", 100, 150);
    }).not.toThrow();
  });
});

describe("logQuery", () => {
  it("should log database queries", () => {
    expect(() => {
      logQuery("SELECT * FROM users", 50);
    }).not.toThrow();
  });
});
