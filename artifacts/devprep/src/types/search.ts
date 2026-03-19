export type SearchResultType =
  | "flashcard"
  | "question"
  | "coding"
  | "voice"
  | "exam";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  preview: string;
}

export interface SearchGroup {
  title: string;
  results: SearchResult[];
}
