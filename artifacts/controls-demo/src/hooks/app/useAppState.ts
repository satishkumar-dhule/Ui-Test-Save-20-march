import { useCallback, useMemo } from "react";
import { channels } from "@/data/channels";
import type { Channel } from "@/data/channels";
import { useLocalStorage } from "../useLocalStorage";
import type { SearchResult } from "@/types/search";

export type Section = "qa" | "flashcards" | "exam" | "voice" | "coding";

// ============================================================================
// LocalStorage Keys
// ============================================================================
const LS_KEYS = {
  selectedIds: "devprep:selectedIds",
  channelId: "devprep:channelId",
  theme: "devprep:theme",
  section: "devprep:section",
  channelTypeFilter: "devprep:channelTypeFilter",
} as const;

// ============================================================================
// App State Hook
// ============================================================================
export interface AppState {
  // Theme
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;

  // Channel selection
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  channelId: string;
  setChannelId: (id: string) => void;

  // Channel type filter
  channelTypeFilter: "tech" | "cert";
  setChannelTypeFilter: (filter: "tech" | "cert") => void;

  // Current section
  section: Section;
  setSection: (section: Section) => void;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;

  // Derived data
  currentChannel: Channel;
  selectedChannels: Channel[];
  selectedTechChannels: Channel[];
  selectedCertChannels: Channel[];

  // Channel switching with fallback logic
  handleChannelSwitch: (id: string) => void;

  // Onboarding completion
  handleOnboardingDone: (ids: Set<string>) => void;
}

export function useAppState(): AppState {
  // -------------------------------------------------------------------------
  // Persisted State (localStorage)
  // -------------------------------------------------------------------------
  const [theme, setTheme] = useLocalStorage<"dark" | "light">(
    LS_KEYS.theme,
    "dark",
  );
  const [channelId, setChannelId] = useLocalStorage<string>(
    LS_KEYS.channelId,
    "javascript",
  );
  const [section, setSection] = useLocalStorage<Section>(
    LS_KEYS.section,
    "qa",
  );
  const [selectedIdsArr, setSelectedIdsArr] = useLocalStorage<string[]>(
    LS_KEYS.selectedIds,
    [],
  );
  const [channelTypeFilter, setChannelTypeFilter] = useLocalStorage<
    "tech" | "cert"
  >(LS_KEYS.channelTypeFilter, "tech");

  // Convert selectedIds array to Set for internal use
  const selectedIds = useMemo(
    () => (selectedIdsArr.length > 0 ? new Set(selectedIdsArr) : new Set<string>()),
    [selectedIdsArr],
  );

  // -------------------------------------------------------------------------
  // Local State (not persisted - determined by selectedIds)
  // -------------------------------------------------------------------------
  const showOnboarding = selectedIdsArr.length === 0;

  // -------------------------------------------------------------------------
  // Derived Data
  // -------------------------------------------------------------------------
  const currentChannel = useMemo(
    () => channels.find((c) => c.id === channelId) || channels[0],
    [channelId],
  );

  const selectedChannels = useMemo(
    () => channels.filter((c) => selectedIds.has(c.id)),
    [selectedIds],
  );

  const selectedTechChannels = useMemo(
    () => selectedChannels.filter((c) => c.type === "tech"),
    [selectedChannels],
  );

  const selectedCertChannels = useMemo(
    () => selectedChannels.filter((c) => c.type === "cert"),
    [selectedChannels],
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const handleChannelSwitch = useCallback(
    (id: string) => {
      const newCh = channels.find((c) => c.id === id);
      if (!newCh) return;
      setChannelId(id);
    },
    [setChannelId],
  );

  const handleOnboardingDone = useCallback(
    (ids: Set<string>) => {
      setSelectedIdsArr([...ids]);
      const firstId = [...ids][0];
      if (firstId) {
        handleChannelSwitch(firstId);
      }
    },
    [setSelectedIdsArr, handleChannelSwitch],
  );

  return {
    // Theme
    theme,
    setTheme,
    toggleTheme,

    // Channel selection
    selectedIds,
    setSelectedIds: (ids) => setSelectedIdsArr([...ids]),
    channelId,
    setChannelId,

    // Channel type filter
    channelTypeFilter,
    setChannelTypeFilter,

    // Current section
    section,
    setSection,

    // Onboarding
    showOnboarding,
    setShowOnboarding: (show) => {
      // Only manage this through onboarding completion
      // showOnboarding is derived from selectedIds.length === 0
    },

    // Derived data
    currentChannel,
    selectedChannels,
    selectedTechChannels,
    selectedCertChannels,

    // Actions
    handleChannelSwitch,
    handleOnboardingDone,
  };
}

// ============================================================================
// Search State Hook
// ============================================================================
export interface SearchState {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  searchLoading: boolean;
  setSearchLoading: (loading: boolean) => void;
  openSearch: () => void;
}

export function useSearchState(): SearchState {
  const [isSearchOpen, setIsSearchOpen] = useLocalStorage<boolean>(
    "devprep:isSearchOpen",
    false,
  );
  const [searchQuery, setSearchQuery] = useLocalStorage<string>(
    "devprep:searchQuery",
    "",
  );
  const [searchResults, setSearchResults] = useLocalStorage<SearchResult[]>(
    "devprep:searchResults",
    [],
  );
  const [searchLoading, setSearchLoading] = useLocalStorage<boolean>(
    "devprep:searchLoading",
    false,
  );

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, [setIsSearchOpen]);

  return {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searchLoading,
    setSearchLoading,
    openSearch,
  };
}
