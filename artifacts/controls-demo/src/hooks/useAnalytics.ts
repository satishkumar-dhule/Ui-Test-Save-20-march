import { useState, useCallback } from "react";
import { STORAGE_KEYS, ANALYTICS_LIMITS } from "@/lib/constants";

// ============================================================================
// LOGGER - Inline implementation to avoid workspace dependency issues
// ============================================================================

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private source: string;

  constructor(source: string = "analytics", minLevel: LogLevel = LogLevel.INFO) {
    this.source = source;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.source}] ${message}`, context ?? "");
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[${new Date().toISOString()}] [INFO] [${this.source}] ${message}`, context ?? "");
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[${new Date().toISOString()}] [WARN] [${this.source}] ${message}`, context ?? "");
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[${new Date().toISOString()}] [ERROR] [${this.source}] ${message}`, context ?? "");
    }
  }
}

const analyticsLogger = new Logger("analytics");

// ============================================================================
// TYPES
// ============================================================================

export interface ExamAttempt {
  id: string;
  channelId: string;
  channelName: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  timestamp: number;
  durationMs: number;
}

export interface FlashcardProgress {
  cardId: string;
  status: "unseen" | "reviewing" | "known" | "hard";
  reviewCount: number;
  lastReviewedAt: number | null;
  updatedAt: number;
}

export interface CodingChallengeProgress {
  challengeId: string;
  channelId: string;
  status: "not_started" | "in_progress" | "completed";
  attempts: number;
  completedAt: number | null;
}

export interface VoicePracticeEntry {
  promptId: string;
  channelId: string;
  rating: number | null;
  practicedAt: number;
}

export interface VisitedQuest {
  channelId: string;
  section: string;
  visitedAt: number;
  durationMs: number;
}

export interface QAProgress {
  questionId: string;
  answered: boolean;
  answeredAt: number | null;
}

export interface SearchEvent {
  id: string;
  type: "opened" | "query" | "result_selected";
  query: string;
  resultType?: string;
  resultId?: string;
  timestamp: number;
}

export interface UserStats {
  totalStudyTimeMs: number;
  totalSessions: number;
  lastSessionAt: number | null;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

export interface AnalyticsData {
  version: number;
  userId: string;
  userStats: UserStats;
  signedUpTechCerts: string[];
  signedUpTechChannels: string[];
  visitedQuests: VisitedQuest[];
  examAttempts: ExamAttempt[];
  flashcardProgress: Record<string, FlashcardProgress>;
  codingProgress: Record<string, CodingChallengeProgress>;
  voicePractice: VoicePracticeEntry[];
  qaProgress: Record<string, QAProgress>;
  searchEvents: SearchEvent[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = STORAGE_KEYS.ANALYTICS;
const CURRENT_VERSION = 1;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUserId(): string {
  const existing = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.USER_ID, newId);
  return newId;
}

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function calculateStreak(
  lastDate: string | null,
  currentStreak: number,
  longestStreak: number,
): { current: number; longest: number } {
  if (!lastDate) return { current: 1, longest: 1 };

  const today = getDateKey();
  const yesterday = getDateKey(new Date(Date.now() - 86400000));

  if (lastDate === today) {
    return {
      current: currentStreak,
      longest: Math.max(currentStreak, longestStreak),
    };
  }
  if (lastDate === yesterday) {
    const newStreak = currentStreak + 1;
    return { current: newStreak, longest: Math.max(newStreak, longestStreak) };
  }
  return { current: 1, longest: Math.max(1, longestStreak) };
}

function pruneOldData<T extends { timestamp?: number; practicedAt?: number; visitedAt?: number }>(
  items: T[],
  maxItems: number,
  retentionPeriodMs: number,
): T[] {
  const now = Date.now();
  const cutoffTime = now - retentionPeriodMs;

  // Filter by retention period and limit size
  const filtered = items.filter((item) => {
    const timestamp = item.timestamp ?? item.practicedAt ?? item.visitedAt ?? now;
    return timestamp > cutoffTime;
  });

  // If still over limit, keep only the most recent
  if (filtered.length > maxItems) {
    return filtered
      .sort((a, b) => {
        const timeA = a.timestamp ?? a.practicedAt ?? a.visitedAt ?? 0;
        const timeB = b.timestamp ?? b.practicedAt ?? b.visitedAt ?? 0;
        return timeB - timeA;
      })
      .slice(0, maxItems);
  }

  return filtered;
}

function loadAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      analyticsLogger.info("No existing analytics, creating new");
      return createInitialData();
    }
    const data = JSON.parse(raw) as AnalyticsData;
    analyticsLogger.debug("Loaded analytics data", {
      signedUpTechCerts: data.signedUpTechCerts.length,
      signedUpTechChannels: data.signedUpTechChannels.length,
    });
    return migrateAnalytics(data);
  } catch (e) {
    analyticsLogger.error("Error loading analytics", { error: e });
    return createInitialData();
  }
}

function createInitialData(): AnalyticsData {
  return {
    version: CURRENT_VERSION,
    userId: generateUserId(),
    userStats: {
      totalStudyTimeMs: 0,
      totalSessions: 0,
      lastSessionAt: null,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    },
    signedUpTechCerts: [],
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
  };
}

function migrateAnalytics(data: AnalyticsData): AnalyticsData {
  return {
    ...data,
    version: CURRENT_VERSION,
    updatedAt: Date.now(),
    userStats: data.userStats
      ? {
          totalStudyTimeMs: data.userStats.totalStudyTimeMs ?? 0,
          totalSessions: data.userStats.totalSessions ?? 0,
          lastSessionAt: data.userStats.lastSessionAt ?? null,
          currentStreak: data.userStats.currentStreak ?? 0,
          longestStreak: data.userStats.longestStreak ?? 0,
          lastStudyDate: data.userStats.lastStudyDate ?? null,
        }
      : {
          totalStudyTimeMs: 0,
          totalSessions: 0,
          lastSessionAt: null,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
        },
    searchEvents: data.searchEvents ?? [],
    signedUpTechCerts: data.signedUpTechCerts ?? [],
    signedUpTechChannels: data.signedUpTechChannels ?? [],
    visitedQuests: data.visitedQuests ?? [],
    examAttempts: data.examAttempts ?? [],
    voicePractice: data.voicePractice ?? [],
    qaProgress: data.qaProgress ?? {},
    flashcardProgress: data.flashcardProgress ?? {},
    codingProgress: data.codingProgress ?? {},
  };
}

function saveAnalytics(data: AnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    analyticsLogger.debug("Analytics saved", {
      signedUpTechCerts: data.signedUpTechCerts.length,
      signedUpTechChannels: data.signedUpTechChannels.length,
    });
  } catch (e) {
    analyticsLogger.warn("Failed to save analytics", { error: e });
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => {
    const data = loadAnalytics();
    // Debug helper for development
    if (typeof window !== "undefined") {
      (window as unknown as { analyticsDebug?: () => void }).analyticsDebug = () => {
        analyticsLogger.debug("Analytics debug", { data });
      };
    }
    return data;
  });

  const updateStats = useCallback((addTimeMs: number = 0) => {
    setAnalytics((prev: AnalyticsData) => {
      const today = getDateKey();
      const streak = calculateStreak(
        prev.userStats.lastStudyDate,
        prev.userStats.currentStreak,
        prev.userStats.longestStreak,
      );
      const newData: AnalyticsData = {
        ...prev,
        userStats: {
          totalStudyTimeMs: prev.userStats.totalStudyTimeMs + addTimeMs,
          totalSessions: prev.userStats.totalSessions + (addTimeMs > 0 ? 1 : 0),
          lastSessionAt: addTimeMs > 0 ? Date.now() : prev.userStats.lastSessionAt,
          currentStreak: streak.current,
          longestStreak: streak.longest,
          lastStudyDate: today,
        },
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackSignedUpCerts = useCallback((certIds: string[]) => {
    analyticsLogger.debug("trackSignedUpCerts called", { certIds });
    setAnalytics((prev: AnalyticsData) => {
      const newData: AnalyticsData = {
        ...prev,
        signedUpTechCerts: [...new Set([...(prev.signedUpTechCerts ?? []), ...certIds])],
        updatedAt: Date.now(),
      };
      analyticsLogger.debug("After track, certs", { certs: newData.signedUpTechCerts });
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackSignedUpTechChannels = useCallback((techIds: string[]) => {
    analyticsLogger.debug("trackSignedUpTechChannels called", { techIds });
    setAnalytics((prev: AnalyticsData) => {
      const newData: AnalyticsData = {
        ...prev,
        signedUpTechChannels: [...new Set([...(prev.signedUpTechChannels ?? []), ...techIds])],
        updatedAt: Date.now(),
      };
      analyticsLogger.debug("After track, tech channels", { channels: newData.signedUpTechChannels });
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackVisitedQuest = useCallback((
    channelId: string,
    section: string,
    durationMs: number,
  ) => {
    setAnalytics((prev: AnalyticsData) => {
      const visitedQuests = prev.visitedQuests ?? [];
      const existingIndex = visitedQuests.findIndex(
        (v: VisitedQuest) => v.channelId === channelId && v.section === section,
      );
      let newVisitedQuests: VisitedQuest[];
      if (existingIndex >= 0) {
        newVisitedQuests = [...visitedQuests];
        newVisitedQuests[existingIndex] = {
          ...newVisitedQuests[existingIndex],
          visitedAt: Date.now(),
          durationMs: newVisitedQuests[existingIndex].durationMs + durationMs,
        };
      } else {
        newVisitedQuests = [
          ...visitedQuests,
          { channelId, section, visitedAt: Date.now(), durationMs },
        ];
      }
      const newData: AnalyticsData = {
        ...prev,
        visitedQuests: newVisitedQuests,
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackExamAttempt = useCallback((attempt: Omit<ExamAttempt, "id" | "timestamp">) => {
    setAnalytics((prev: AnalyticsData) => {
      const newAttempt: ExamAttempt = {
        ...attempt,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      const prunedAttempts = pruneOldData(
        [...(prev.examAttempts ?? []), newAttempt],
        ANALYTICS_LIMITS.MAX_EXAM_ATTEMPTS,
        ANALYTICS_LIMITS.DATA_RETENTION_PERIOD_MS,
      );
      const newData: AnalyticsData = {
        ...prev,
        examAttempts: prunedAttempts,
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const updateFlashcardProgress = useCallback((
    cardId: string,
    status: FlashcardProgress["status"],
  ) => {
    setAnalytics((prev: AnalyticsData) => {
      const existing = prev.flashcardProgress[cardId];
      const newProgress: FlashcardProgress = {
        cardId,
        status,
        reviewCount: (existing?.reviewCount ?? 0) + 1,
        lastReviewedAt: Date.now(),
        updatedAt: Date.now(),
      };
      const newData: AnalyticsData = {
        ...prev,
        flashcardProgress: { ...prev.flashcardProgress, [cardId]: newProgress },
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const updateCodingProgress = useCallback((
    challengeId: string,
    channelId: string,
    status: CodingChallengeProgress["status"],
  ) => {
    setAnalytics((prev: AnalyticsData) => {
      const existing = prev.codingProgress[challengeId];
      const newProgress: CodingChallengeProgress = {
        challengeId,
        channelId,
        status,
        attempts: (existing?.attempts ?? 0) + 1,
        completedAt: status === "completed" ? Date.now() : (existing?.completedAt ?? null),
      };
      const newData: AnalyticsData = {
        ...prev,
        codingProgress: { ...prev.codingProgress, [challengeId]: newProgress },
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackVoicePractice = useCallback((
    promptId: string,
    channelId: string,
    rating: number | null,
  ) => {
    setAnalytics((prev: AnalyticsData) => {
      const entry: VoicePracticeEntry = { promptId, channelId, rating, practicedAt: Date.now() };
      const prunedPractice = pruneOldData(
        [...(prev.voicePractice ?? []), entry],
        ANALYTICS_LIMITS.MAX_VOICE_PRACTICE_ENTRIES,
        ANALYTICS_LIMITS.DATA_RETENTION_PERIOD_MS,
      );
      const newData: AnalyticsData = {
        ...prev,
        voicePractice: prunedPractice,
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackQAAnswered = useCallback((questionId: string) => {
    setAnalytics((prev: AnalyticsData) => {
      const newProgress: QAProgress = { questionId, answered: true, answeredAt: Date.now() };
      const newData: AnalyticsData = {
        ...prev,
        qaProgress: { ...prev.qaProgress, [questionId]: newProgress },
        updatedAt: Date.now(),
      };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackSearchOpened = useCallback(() => {
    setAnalytics((prev: AnalyticsData) => {
      const event: SearchEvent = { id: crypto.randomUUID(), type: "opened", query: "", timestamp: Date.now() };
      const newSearchEvents = [...(prev.searchEvents ?? []), event].slice(-ANALYTICS_LIMITS.MAX_SEARCH_EVENTS);
      const newData: AnalyticsData = { ...prev, searchEvents: newSearchEvents, updatedAt: Date.now() };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackSearchQuery = useCallback((query: string) => {
    setAnalytics((prev: AnalyticsData) => {
      const event: SearchEvent = { id: crypto.randomUUID(), type: "query", query, timestamp: Date.now() };
      const newSearchEvents = [...(prev.searchEvents ?? []), event].slice(-ANALYTICS_LIMITS.MAX_SEARCH_EVENTS);
      const newData: AnalyticsData = { ...prev, searchEvents: newSearchEvents, updatedAt: Date.now() };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const trackSearchResultSelected = useCallback((
    query: string,
    resultType: string,
    resultId: string,
  ) => {
    setAnalytics((prev: AnalyticsData) => {
      const event: SearchEvent = { id: crypto.randomUUID(), type: "result_selected", query, resultType, resultId, timestamp: Date.now() };
      const newSearchEvents = [...(prev.searchEvents ?? []), event].slice(-ANALYTICS_LIMITS.MAX_SEARCH_EVENTS);
      const newData: AnalyticsData = { ...prev, searchEvents: newSearchEvents, updatedAt: Date.now() };
      saveAnalytics(newData);
      return newData;
    });
  }, []);

  const getStats = (): UserStats => analytics.userStats;

  const getSignedUpCerts = (): string[] => analytics.signedUpTechCerts;

  const getSignedUpTechChannels = (): string[] =>
    analytics.signedUpTechChannels;

  const getVisitedQuests = (): VisitedQuest[] => analytics.visitedQuests;

  const getExamAttempts = (): ExamAttempt[] => analytics.examAttempts;

  const getFlashcardProgress = (): Record<string, FlashcardProgress> =>
    analytics.flashcardProgress;

  const getCodingProgress = (): Record<string, CodingChallengeProgress> =>
    analytics.codingProgress;

  const getVoicePractice = (): VoicePracticeEntry[] => analytics.voicePractice;

  const getQAProgress = (): Record<string, QAProgress> => analytics.qaProgress;

  const getSearchEvents = (): SearchEvent[] => analytics.searchEvents;

  const getChannelStats = (channelId: string) => {
    const examAttempts = analytics.examAttempts.filter(
      (a: ExamAttempt) => a.channelId === channelId,
    );
    const flashcards = Object.values(analytics.flashcardProgress);
    const coding = Object.values(analytics.codingProgress).filter(
      (c: CodingChallengeProgress) => c.channelId === channelId,
    );
    const voice = analytics.voicePractice.filter(
      (v: VoicePracticeEntry) => v.channelId === channelId,
    );
    const visited = analytics.visitedQuests.filter(
      (v: VisitedQuest) => v.channelId === channelId,
    );

    return {
      examAttempts,
      bestExamScore:
        examAttempts.length > 0
          ? Math.max(...examAttempts.map((a: ExamAttempt) => a.score))
          : null,
      examsPassed: examAttempts.filter((a: ExamAttempt) => a.passed).length,
      flashcardsReviewed: flashcards.length,
      flashcardsMastered: flashcards.filter(
        (f: FlashcardProgress) => f.status === "known",
      ).length,
      codingCompleted: coding.filter(
        (c: CodingChallengeProgress) => c.status === "completed",
      ).length,
      voicePracticed: voice.length,
      totalVisitTime: visited.reduce(
        (acc: number, v: VisitedQuest) => acc + v.durationMs,
        0,
      ),
      lastVisited:
        visited.length > 0
          ? Math.max(...visited.map((v: VisitedQuest) => v.visitedAt))
          : null,
    };
  };

  const clearAnalytics = () => {
    const newData = createInitialData();
    saveAnalytics(newData);
    setAnalytics(newData);
  };

  const exportAnalytics = (): string => {
    return JSON.stringify(analytics, null, 2);
  };

  return {
    analytics,
    updateStats,
    trackSignedUpCerts,
    trackSignedUpTechChannels,
    trackVisitedQuest,
    trackExamAttempt,
    updateFlashcardProgress,
    updateCodingProgress,
    trackVoicePractice,
    trackQAAnswered,
    trackSearchOpened,
    trackSearchQuery,
    trackSearchResultSelected,
    getStats,
    getSignedUpCerts,
    getSignedUpTechChannels,
    getVisitedQuests,
    getExamAttempts,
    getFlashcardProgress,
    getCodingProgress,
    getVoicePractice,
    getQAProgress,
    getSearchEvents,
    getChannelStats,
    clearAnalytics,
    exportAnalytics,
    debug: () => {
      analyticsLogger.debug("Analytics debug", { analytics });
    },
  };
}
