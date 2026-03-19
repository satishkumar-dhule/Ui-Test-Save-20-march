import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

vi.stubGlobal("localStorage", mockLocalStorage);

describe("useLocalStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial value when localStorage is empty", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
    expect(result.current[0]).toBe("initial");
  });

  it("parses and returns stored value", () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
    expect(result.current[0]).toBe("stored");
  });

  it("setValue updates state and localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify("updated"),
    );
  });

  it("handles invalid JSON in localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue("invalid-json{{{");
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "fallback"),
    );
    expect(result.current[0]).toBe("fallback");
  });

  it("handles setValue function variant", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage("test-key", 10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
  });

  it("handles setItem error gracefully", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error("Storage full");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
