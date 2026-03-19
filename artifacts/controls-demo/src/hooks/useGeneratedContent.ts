import { useState, useEffect, useCallback } from "react";
import type { Question } from "@/data/questions";
import type { Flashcard } from "@/data/flashcards";
import type { ExamQuestion } from "@/data/exam";
import type { VoicePrompt } from "@/data/voicePractice";
import type { CodingChallenge } from "@/data/coding";

/**
 * Type-safe generated content map
 * All arrays are typed to match their corresponding static data types
 */
export interface GeneratedContentMap {
  question?: Question[];
  flashcard?: Flashcard[];
  exam?: ExamQuestion[];
  voice?: VoicePrompt[];
  coding?: CodingChallenge[];
}

const API_URL = "/api/content";
const CACHE_KEY = "devprep:generated-content";
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

type CacheEntry = { ts: number; data: GeneratedContentMap };

function hasContent(data: GeneratedContentMap): boolean {
  return Object.values(data).some((arr) => Array.isArray(arr) && arr.length > 0);
}

function loadCache(): GeneratedContentMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    // Only use cache if it actually has content AND it hasn't expired
    if (hasContent(entry.data) && Date.now() - entry.ts < CACHE_TTL_MS) {
      return entry.data;
    }
    // Expired or empty — drop it so we re-fetch
    localStorage.removeItem(CACHE_KEY);
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
}

function saveCache(data: GeneratedContentMap) {
  if (!hasContent(data)) return; // Never cache empty responses
  try {
    const entry: CacheEntry = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Silently handle storage errors
  }
}

interface UseGeneratedContentResult {
  generated: GeneratedContentMap;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch and cache generated content from the API.
 * Falls back to localStorage cache if available.
 * Silently fails - static data is still shown if API is unavailable.
 */
export function useGeneratedContent(): UseGeneratedContentResult {
  const [generated, setGenerated] = useState<GeneratedContentMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(API_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (json.ok && json.data) {
          // Type the response data - the API returns raw objects
          // that we cast to our typed arrays
          setGenerated(json.data as GeneratedContentMap);
          saveCache(json.data as GeneratedContentMap);
        }
      })
      .catch((e) => {
        // Silently fail — static data still shows
        setError(e instanceof Error ? e.message : "Unknown error");
        console.warn("[DevPrep] Generated content unavailable:", e);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setGenerated(cached);
      return;
    }

    fetchContent();
  }, [fetchContent]);

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    fetchContent();
  }, [fetchContent]);

  return { generated, loading, error, refresh };
}
