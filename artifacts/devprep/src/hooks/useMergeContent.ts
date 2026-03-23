import { useMemo } from 'react'

/**
 * DB-first content selector.
 *
 * Rule: the database (devprep.db via sql.js) is the single source of truth for
 * all content. Static data files are a fallback used only when the DB has not
 * yet loaded or is genuinely empty for this content type.
 *
 * - If generatedContent (DB) has items → return DB content exclusively.
 * - If generatedContent is empty / undefined → return staticContent (fallback).
 *
 * This replaces the previous "static + DB unique items" merge strategy to
 * prevent stale or reduced static data from appearing alongside richer DB content.
 */
export function useMergeContent<T extends { id: string }>(
  staticContent: T[],
  generatedContent: T[] | undefined
): T[] {
  return useMemo(() => {
    if (generatedContent && generatedContent.length > 0) {
      return generatedContent
    }
    return staticContent
  }, [staticContent, generatedContent])
}

/**
 * Helper type for content maps from the generated content API
 */
export type GeneratedContentMap = {
  question?: unknown[]
  flashcard?: unknown[]
  exam?: unknown[]
  voice?: unknown[]
  coding?: unknown[]
}
