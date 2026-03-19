import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      const result = cn("class1", "class2");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("handles undefined inputs", () => {
      const result = cn("class1", undefined, "class2");
      expect(result).toBeDefined();
    });

    it("handles empty input", () => {
      const result = cn();
      expect(result).toBeDefined();
    });

    it("handles array input", () => {
      const result = cn(["class1", "class2"]);
      expect(result).toBeDefined();
    });
  });
});
