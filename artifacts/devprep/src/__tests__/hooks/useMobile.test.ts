import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMobile } from "@/hooks/useMobile";

describe("useMobile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns boolean value", () => {
    global.innerWidth = 500;
    const { result } = renderHook(() => useMobile());
    vi.runAllTimers();
    expect(typeof result.current).toBe("boolean");
  });

  it("detects mobile viewport", () => {
    global.innerWidth = 500;
    const { result } = renderHook(() => useMobile());
    vi.runAllTimers();
    expect(result.current).toBe(true);
  });

  it("detects desktop viewport", () => {
    global.innerWidth = 1024;
    const { result } = renderHook(() => useMobile());
    vi.runAllTimers();
    expect(result.current).toBe(false);
  });
});
