import type { Question } from "@/data/questions";
import type { Flashcard } from "@/data/flashcards";
import type { ExamQuestion } from "@/data/exam";
import type { VoicePrompt } from "@/data/voicePractice";
import type { CodingChallenge } from "@/data/coding";
import type { SearchResult } from "@/types/search";

export interface SearchableContent {
  questions: Question[];
  flashcards: Flashcard[];
  exam: ExamQuestion[];
  voice: VoicePrompt[];
  coding: CodingChallenge[];
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function searchContent(
  query: string,
  content: SearchableContent,
  limit = 20,
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const q of content.questions) {
    if (results.length >= limit) break;
    if (matchesQuery(q.question, query) || matchesQuery(q.answer, query)) {
      results.push({
        id: q.id,
        type: "question",
        title: q.question.length > 80 ? q.question.slice(0, 80) + "…" : q.question,
        preview: q.answer.length > 120 ? q.answer.slice(0, 120) + "…" : q.answer,
      });
    }
  }

  for (const f of content.flashcards) {
    if (results.length >= limit) break;
    if (matchesQuery(f.front, query) || matchesQuery(f.back, query)) {
      results.push({
        id: f.id,
        type: "flashcard",
        title: f.front.length > 80 ? f.front.slice(0, 80) + "…" : f.front,
        preview: f.back.length > 120 ? f.back.slice(0, 120) + "…" : f.back,
      });
    }
  }

  for (const c of content.coding) {
    if (results.length >= limit) break;
    if (matchesQuery(c.title, query) || matchesQuery(c.description, query)) {
      results.push({
        id: c.id,
        type: "coding",
        title: c.title,
        preview: c.description.length > 120 ? c.description.slice(0, 120) + "…" : c.description,
      });
    }
  }

  for (const e of content.exam) {
    if (results.length >= limit) break;
    if (matchesQuery(e.question, query) || e.options.some((o) => matchesQuery(o, query))) {
      results.push({
        id: e.id,
        type: "exam",
        title: e.question.length > 80 ? e.question.slice(0, 80) + "…" : e.question,
        preview: `Options: ${e.options.slice(0, 2).join(", ")}…`,
      });
    }
  }

  for (const v of content.voice) {
    if (results.length >= limit) break;
    if (matchesQuery(v.prompt, query) || v.keyPoints.some((t) => matchesQuery(t, query))) {
      results.push({
        id: v.id,
        type: "voice",
        title: v.prompt.length > 80 ? v.prompt.slice(0, 80) + "…" : v.prompt,
        preview: v.keyPoints.length > 0 ? v.keyPoints[0] : "",
      });
    }
  }

  return results;
}
