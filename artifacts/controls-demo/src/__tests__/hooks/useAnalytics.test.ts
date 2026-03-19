import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ANALYTICS_LIMITS } from "@/lib/constants";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

vi.stubGlobal("localStorage", mockLocalStorage);

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => `test-uuid-${Math.random().toString(36).slice(2)}`);
vi.stubGlobal("crypto", { randomUUID: mockRandomUUID });

describe("useAnalytics Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should create a new user ID when none exists", () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "devprep:userId") return null;
        return null;
      });

      const { result } = renderHook(() => useAnalytics());
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "devprep:userId",
        expect.any(String),
      );
      expect(result.current.analytics.userId).toBeDefined();
    });

    it("should use existing user ID when available", () => {
      const existingUserId = "existing-user-123";
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "devprep:userId") return existingUserId;
        return null;
      });

      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current.analytics.userId).toBe(existingUserId);
    });

    it("should initialize with empty arrays and default stats", () => {
      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current.analytics.userStats).toEqual({
        totalStudyTimeMs: 0,
        totalSessions: 0,
        lastSessionAt: null,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
      });
      expect(result.current.analytics.signedUpTechCerts).toEqual([]);
      expect(result.current.analytics.signedUpTechChannels).toEqual([]);
      expect(result.current.analytics.examAttempts).toEqual([]);
      expect(result.current.analytics.searchEvents).toEqual([]);
      expect(result.current.analytics.voicePractice).toEqual([]);
    });
  });

  describe("updateStats", () => {
    it("should update total study time and session count", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.updateStats(60000); // 1 minute
      });
      
      expect(result.current.analytics.userStats.totalStudyTimeMs).toBe(60000);
      expect(result.current.analytics.userStats.totalSessions).toBe(1);
      expect(result.current.analytics.userStats.lastSessionAt).not.toBeNull();
    });

    it("should not increment session count for zero time", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.updateStats(0);
      });
      
      expect(result.current.analytics.userStats.totalSessions).toBe(0);
    });
  });

  describe("trackSignedUpCerts", () => {
    it("should add new cert IDs to the list", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackSignedUpCerts(["aws-saa", "cka"]);
      });
      
      expect(result.current.analytics.signedUpTechCerts).toContain("aws-saa");
      expect(result.current.analytics.signedUpTechCerts).toContain("cka");
    });

    it("should not duplicate existing cert IDs", () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "devprep:userId") return null;
        if (key === "devprep:analytics") {
          return JSON.stringify({
            version: 1,
            userId: "test",
            userStats: { totalStudyTimeMs: 0, totalSessions: 0, lastSessionAt: null, currentStreak: 0, longestStreak: 0, lastStudyDate: null },
            signedUpTechCerts: ["aws-saa"],
            signedUpTechChannels: [],
            visitedQuests: [],
            examAttempts: [],
            flashcardProgress: {},
            codingProgress: {},
            voicePractice: [],
            qaProgress: {},
            searchEvents: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
        return null;
      });

      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackSignedUpCerts(["aws-saa", "terraform"]);
      });
      
      const certs = result.current.analytics.signedUpTechCerts;
      expect(certs.filter(c => c === "aws-saa").length).toBe(1);
      expect(certs).toContain("terraform");
    });
  });

  describe("trackSignedUpTechChannels", () => {
    it("should add new tech channel IDs to the list", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackSignedUpTechChannels(["javascript", "react"]);
      });
      
      expect(result.current.analytics.signedUpTechChannels).toContain("javascript");
      expect(result.current.analytics.signedUpTechChannels).toContain("react");
    });
  });

  describe("trackExamAttempt", () => {
    it("should add exam attempt with generated ID and timestamp", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackExamAttempt({
          channelId: "aws-saa",
          channelName: "AWS Solutions Architect",
          score: 85,
          totalQuestions: 100,
          passed: true,
          durationMs: 3600000,
        });
      });
      
      expect(result.current.analytics.examAttempts).toHaveLength(1);
      expect(result.current.analytics.examAttempts[0].id).toBeDefined();
      expect(result.current.analytics.examAttempts[0].timestamp).toBeDefined();
      expect(result.current.analytics.examAttempts[0].score).toBe(85);
    });

    it("should respect max exam attempts limit", () => {
      const { result } = renderHook(() => useAnalytics());
      
      // Add more attempts than the limit
      for (let i = 0; i < ANALYTICS_LIMITS.MAX_EXAM_ATTEMPTS + 10; i++) {
        act(() => {
          result.current.trackExamAttempt({
            channelId: "aws-saa",
            channelName: "AWS",
            score: 70 + i,
            totalQuestions: 100,
            passed: i % 2 === 0,
            durationMs: 3600000,
          });
        });
      }
      
      expect(result.current.analytics.examAttempts.length).toBeLessThanOrEqual(
        ANALYTICS_LIMITS.MAX_EXAM_ATTEMPTS,
      );
    });
  });

  describe("updateFlashcardProgress", () => {
    it("should update flashcard progress with review count", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.updateFlashcardProgress("card-1", "known");
      });
      
      expect(result.current.analytics.flashcardProgress["card-1"]).toEqual(
        expect.objectContaining({
          cardId: "card-1",
          status: "known",
          reviewCount: 1,
        }),
      );
    });

    it("should increment review count for existing card", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.updateFlashcardProgress("card-1", "known");
      });
      
      act(() => {
        result.current.updateFlashcardProgress("card-1", "reviewing");
      });
      
      expect(result.current.analytics.flashcardProgress["card-1"].reviewCount).toBe(2);
    });
  });

  describe("updateCodingProgress", () => {
    it("should update coding progress with attempts", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.updateCodingProgress("challenge-1", "javascript", "in_progress");
      });
      
      expect(result.current.analytics.codingProgress["challenge-1"]).toEqual(
        expect.objectContaining({
          challengeId: "challenge-1",
          channelId: "javascript",
          status: "in_progress",
          attempts: 1,
          completedAt: null,
        }),
      );
    });

    it("should set completedAt when status is completed", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.updateCodingProgress("challenge-1", "javascript", "completed");
      });
      
      expect(result.current.analytics.codingProgress["challenge-1"].completedAt).not.toBeNull();
    });
  });

  describe("trackVoicePractice", () => {
    it("should add voice practice entry", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackVoicePractice("prompt-1", "react", 4);
      });
      
      expect(result.current.analytics.voicePractice).toHaveLength(1);
      expect(result.current.analytics.voicePractice[0].promptId).toBe("prompt-1");
      expect(result.current.analytics.voicePractice[0].rating).toBe(4);
    });

    it("should respect max voice practice entries limit", () => {
      const { result } = renderHook(() => useAnalytics());
      
      for (let i = 0; i < ANALYTICS_LIMITS.MAX_VOICE_PRACTICE_ENTRIES + 10; i++) {
        act(() => {
          result.current.trackVoicePractice(`prompt-${i}`, "react", i % 5);
        });
      }
      
      expect(result.current.analytics.voicePractice.length).toBeLessThanOrEqual(
        ANALYTICS_LIMITS.MAX_VOICE_PRACTICE_ENTRIES,
      );
    });
  });

  describe("trackQAAnswered", () => {
    it("should update QA progress for question", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackQAAnswered("question-1");
      });
      
      expect(result.current.analytics.qaProgress["question-1"]).toEqual(
        expect.objectContaining({
          questionId: "question-1",
          answered: true,
          answeredAt: expect.any(Number),
        }),
      );
    });
  });

  describe("Search Event Tracking", () => {
    it("should track search opened event", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackSearchOpened();
      });
      
      expect(result.current.analytics.searchEvents).toHaveLength(1);
      expect(result.current.analytics.searchEvents[0].type).toBe("opened");
    });

    it("should track search query event", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackSearchQuery("typescript generics");
      });
      
      expect(result.current.analytics.searchEvents).toHaveLength(1);
      expect(result.current.analytics.searchEvents[0].type).toBe("query");
      expect(result.current.analytics.searchEvents[0].query).toBe("typescript generics");
    });

    it("should track search result selected event", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackSearchResultSelected("react hooks", "question", "q-123");
      });
      
      expect(result.current.analytics.searchEvents).toHaveLength(1);
      expect(result.current.analytics.searchEvents[0].type).toBe("result_selected");
      expect(result.current.analytics.searchEvents[0].resultType).toBe("question");
      expect(result.current.analytics.searchEvents[0].resultId).toBe("q-123");
    });

    it("should respect max search events limit", () => {
      const { result } = renderHook(() => useAnalytics());
      
      for (let i = 0; i < ANALYTICS_LIMITS.MAX_SEARCH_EVENTS + 10; i++) {
        act(() => {
          result.current.trackSearchQuery(`query-${i}`);
        });
      }
      
      expect(result.current.analytics.searchEvents.length).toBeLessThanOrEqual(
        ANALYTICS_LIMITS.MAX_SEARCH_EVENTS,
      );
    });
  });

  describe("getChannelStats", () => {
    it("should return stats for specific channel", () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackExamAttempt({
          channelId: "aws-saa",
          channelName: "AWS SAA",
          score: 85,
          totalQuestions: 100,
          passed: true,
          durationMs: 3600000,
        });
        result.current.updateFlashcardProgress("card-1", "known");
      });
      
      const stats = result.current.getChannelStats("aws-saa");
      
      expect(stats.examAttempts).toHaveLength(1);
      expect(stats.bestExamScore).toBe(85);
      expect(stats.examsPassed).toBe(1);
      expect(stats.flashcardsReviewed).toBe(1);
      expect(stats.flashcardsMastered).toBe(1);
    });

    it("should return null for best score when no exams", () => {
      const { result } = renderHook(() => useAnalytics());
      
      const stats = result.current.getChannelStats("unknown-channel");
      
      expect(stats.bestExamScore).toBeNull();
      expect(stats.examsPassed).toBe(0);
    });
  });

  describe("clearAnalytics", () => {
    it("should reset analytics to initial state", () => {
      const { result } = renderHook(() => useAnalytics());
      
      // Add some data
      act(() => {
        result.current.trackSignedUpCerts(["aws-saa"]);
        result.current.updateStats(60000);
      });
      
      expect(result.current.analytics.signedUpTechCerts).toContain("aws-saa");
      
      // Clear
      act(() => {
        result.current.clearAnalytics();
      });
      
      expect(result.current.analytics.signedUpTechCerts).toEqual([]);
      expect(result.current.analytics.userStats.totalStudyTimeMs).toBe(0);
    });
  });

  describe("exportAnalytics", () => {
    it("should return JSON string of analytics data", () => {
      const { result } = renderHook(() => useAnalytics());
      
      const exported = result.current.exportAnalytics();
      
      expect(typeof exported).toBe("string");
      const parsed = JSON.parse(exported);
      expect(parsed.userId).toBeDefined();
    });
  });
});
