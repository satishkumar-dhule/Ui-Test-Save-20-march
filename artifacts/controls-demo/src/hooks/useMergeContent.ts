import { useMemo } from "react";

/**
 * Merges static content with generated content, deduplicating by ID.
 * This pattern is used for all content types (questions, flashcards, exams, etc.)
 */
export function useMergeContent<T extends { id: string }>(
  staticContent: T[],
  generatedContent: T[] | undefined,
): T[] {
  return useMemo(() => {
    if (!generatedContent || generatedContent.length === 0) {
      return staticContent;
    }
    const existingIds = new Set(staticContent.map((item) => item.id));
    const newItems = generatedContent.filter((item) => !existingIds.has(item.id));
    return [...staticContent, ...newItems];
  }, [staticContent, generatedContent]);
}

/**
 * Helper type for content maps from the generated content API
 */
export type GeneratedContentMap = {
  question?: unknown[];
  flashcard?: unknown[];
  exam?: unknown[];
  voice?: unknown[];
  coding?: unknown[];
};
