import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("String Utilities", () => {
  describe("cn (classnames merge)", () => {
    it("should merge class names correctly", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toBe("base active");
    });

    it("should handle falsy values", () => {
      const result = cn("base", false as any, null as any, undefined as any);
      expect(result).toBe("base");
    });

    it("should merge Tailwind classes intelligently", () => {
      const result = cn("px-2 px-4", "text-sm text-lg");
      expect(result).toBe("text-lg");
    });

    it("should handle empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle undefined inputs", () => {
      const result = cn("foo", undefined as any, "bar");
      expect(result).toBe("foo bar");
    });
  });
});
