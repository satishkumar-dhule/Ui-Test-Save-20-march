import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGeneratedContent } from "@/hooks/useGeneratedContent";
import type { GeneratedContentMap } from "@/hooks/useGeneratedContent";

const mockFetch = vi.fn();
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

vi.stubGlobal("fetch", mockFetch);
vi.stubGlobal("localStorage", mockLocalStorage);

describe("useGeneratedContent Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockContentData: GeneratedContentMap = {
    question: [{ id: 1, title: "Test Question" }],
    flashcard: [{ id: 1, front: "Test", back: "Answer" }],
    exam: [],
    voice: [],
    coding: [],
  };

  describe("Initial Load", () => {
    it("should fetch content on mount when no cache exists", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockContentData }),
      });

      const { result } = renderHook(() => useGeneratedContent());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/content");
    });

    it("should use cached data when available and not expired", async () => {
      const cachedData = {
        ts: Date.now() - 60000,
        data: mockContentData,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const { result } = renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.generated).toEqual(mockContentData);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should refetch when cache is expired", async () => {
      const expiredCache = {
        ts: Date.now() - 10 * 60 * 1000,
        data: mockContentData,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredCache));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockContentData }),
      });

      const { result } = renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it("should refetch when cache has no content", async () => {
      const emptyCache = {
        ts: Date.now(),
        data: {},
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(emptyCache));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockContentData }),
      });

      const { result } = renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.generated).toEqual({});
    });

    it("should handle non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("API error 500");
    });

    it("should handle JSON parse errors in cache", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json{");

      const { result } = renderHook(() => useGeneratedContent());

      expect(result.current.loading).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe("Refresh Function", () => {
    it("should clear cache and refetch on refresh", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockContentData }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            data: { ...mockContentData, question: [{ id: 2 }] },
          }),
      });

      const { result } = renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.refresh();

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalled();
        expect(result.current.loading).toBe(true);
      });
    });
  });

  describe("Caching Behavior", () => {
    it("should save to localStorage after successful fetch", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockContentData }),
      });

      renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.data).toEqual(mockContentData);
    });

    it("should not cache empty responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} }),
      });

      renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });

    it("should not cache when response ok is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: false, data: mockContentData }),
      });

      renderHook(() => useGeneratedContent());

      await waitFor(() => {
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });
});
