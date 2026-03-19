import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

const MOBILE_WIDTH = 767;
const DESKTOP_WIDTH = 1024;
const TABLET_WIDTH = 768;

const mockMatchMedia = vi.fn();

describe("useIsMobile Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should return undefined initially during SSR or before effect", () => {
      Object.defineProperty(window, "innerWidth", {
        value: DESKTOP_WIDTH,
        writable: true,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBeUndefined();
    });

    it("should detect desktop width as not mobile", () => {
      Object.defineProperty(window, "innerWidth", {
        value: DESKTOP_WIDTH,
        writable: true,
      });
      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: "(max-width: 767px)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it("should detect mobile width as mobile", () => {
      Object.defineProperty(window, "innerWidth", {
        value: MOBILE_WIDTH,
        writable: true,
      });
      mockMatchMedia.mockReturnValueOnce({
        matches: true,
        media: "(max-width: 767px)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("should detect tablet width as not mobile (breakpoint is 768)", () => {
      Object.defineProperty(window, "innerWidth", {
        value: TABLET_WIDTH,
        writable: true,
      });
      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: "(max-width: 767px)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe("Media Query Listener", () => {
    it("should add event listener on mount", () => {
      const addEventListener = vi.fn();
      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: "",
        addEventListener,
        removeEventListener: vi.fn(),
      });

      renderHook(() => useIsMobile());

      expect(addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });

    it("should remove event listener on unmount", () => {
      const removeEventListener = vi.fn();
      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener,
      });

      const { unmount } = renderHook(() => useIsMobile());
      unmount();

      expect(removeEventListener).toHaveBeenCalled();
    });

    it("should update state when media query changes", () => {
      let changeCallback: ((e: { matches: boolean }) => void) | null = null;

      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query.includes("767"),
        media: query,
        addEventListener: (_: string, cb: any) => {
          changeCallback = cb;
        },
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        value: MOBILE_WIDTH,
        writable: true,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      act(() => {
        changeCallback?.({ matches: false });
      });

      expect(result.current).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle window resize", () => {
      let changeCallback: ((e: { matches: boolean }) => void) | null = null;

      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query.includes("767"),
        media: query,
        addEventListener: (_: string, cb: any) => {
          changeCallback = cb;
        },
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        value: MOBILE_WIDTH,
        writable: true,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      Object.defineProperty(window, "innerWidth", {
        value: DESKTOP_WIDTH,
        writable: true,
      });

      act(() => {
        changeCallback?.({ matches: false });
      });

      expect(result.current).toBe(false);
    });

    it("should handle rapid state changes", () => {
      let callCount = 0;
      mockMatchMedia.mockImplementation(() => ({
        matches: callCount++ % 2 === 0,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        value: MOBILE_WIDTH,
        writable: true,
      });

      const { result, rerender } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);

      Object.defineProperty(window, "innerWidth", {
        value: DESKTOP_WIDTH,
        writable: true,
      });

      rerender();
      expect(result.current).toBe(false);
    });
  });
});
