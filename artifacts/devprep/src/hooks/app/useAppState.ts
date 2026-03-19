export type Section = "qa" | "flashcards" | "coding" | "exam" | "voice";

export interface AppState {
  channelId: string | null;
  selectedIds: string[];
  section: Section;
  searchQuery: string;
  isSearchOpen: boolean;
}

export interface SearchState {
  query: string;
  results: unknown[];
  isLoading: boolean;
  selectedIndex: number;
}

export function useAppState() {
  return {};
}

export function useSearchState() {
  return {};
}
