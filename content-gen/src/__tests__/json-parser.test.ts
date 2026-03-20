import { describe, it, expect } from "vitest";
import { extractAndParse } from "../json-parser";

describe("JSON Parser - Strategy Testing", () => {
  describe("Strategy 1: Code Fence Extraction", () => {
    it("should extract JSON from markdown code fences", () => {
      const input = '```json\n{"key": "value"}\n```';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
      expect(result.strategy).toBe("native_parse");
      expect(result.fixed).toContain("code_fence_extraction");
    });

    it("should extract from typescript fences", () => {
      const input = '```typescript\n{"foo": 123}\n```';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ foo: 123 });
    });

    it("should extract from js fences", () => {
      const input = '```js\n{"test": true}\n```';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ test: true });
    });

    it("should handle fences without language specifier", () => {
      const input = '```\n{"data": "value"}\n```';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ data: "value" });
    });
  });

  describe("Strategy 2: Bracket Matching", () => {
    it("should extract complete JSON using bracket matching", () => {
      const input = 'Here is some text {"key": "value"} and more text';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
      expect(result.fixed).toContain("bracket_matching");
    });

    it("should extract nested objects", () => {
      const input = 'prefix {"nested": {"deep": 123}} suffix';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ nested: { deep: 123 } });
    });

    it("should extract arrays", () => {
      const input = "Items: [1, 2, 3] end";
      const result = extractAndParse(input);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it("should handle multiple JSON objects", () => {
      const input = '{"a": 1}{"b": 2}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ a: 1, b: 2 });
      expect(result.fixed).toContain("multiple_objects_extraction");
    });
  });

  describe("Strategy 3: Basic Cleanup", () => {
    it("should remove BOM characters", () => {
      const input = '\uFEFF{"key": "value"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
    });

    it("should strip fence markers", () => {
      const input = '```json\n{"x": 1}\n```';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ x: 1 });
    });
  });

  describe("Strategy 4: Trailing Commas", () => {
    it("should fix trailing commas in objects", () => {
      const input = '{"key": "value",}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
      expect(result.fixed).toContain("fix_trailing_commas");
    });

    it("should fix trailing commas in arrays", () => {
      const input = "[1, 2, 3,]";
      const result = extractAndParse(input);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it("should handle trailing commas with whitespace", () => {
      const input = '{"items": [1, 2, ], "other": "value", }';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ items: [1, 2], other: "value" });
    });
  });

  describe("Strategy 5: Unquoted Keys", () => {
    it("should fix unquoted keys", () => {
      const input = '{key: "value"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
      expect(result.fixed).toContain("fix_unquoted_keys");
    });

    it("should fix keys with underscores and numbers", () => {
      const input = '{my_key_1: "value", other_key: 42}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ my_key_1: "value", other_key: 42 });
    });

    it("should fix keys with $ and _ prefixes", () => {
      const input = '{$key: "v1", _private: "v2"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ $key: "v1", _private: "v2" });
    });

    it("should handle nested unquoted keys", () => {
      const input = '{outer: {inner: "value"}}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ outer: { inner: "value" } });
    });
  });

  describe("Strategy 6: Single Quotes", () => {
    it("should convert single quotes to double quotes", () => {
      const input = "{'key': 'value'}";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
      expect(result.fixed).toContain("fix_single_quotes");
    });

    it("should handle mixed quotes", () => {
      const input = "{\"key\": 'value'}";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
    });
  });

  describe("Strategy 7: Missing Quotes on Values", () => {
    it("should quote unquoted string values", () => {
      const input = "{key: value}";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
      expect(result.fixed).toContain("fix_missing_quotes");
    });

    it("should handle numbers correctly (not quoted)", () => {
      const input = "{count: 42}";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ count: 42 });
    });

    it("should handle booleans correctly", () => {
      const input = "{active: true, deleted: false}";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ active: true, deleted: false });
    });

    it("should handle null values", () => {
      const input = "{empty: null}";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ empty: null });
    });
  });

  describe("Strategy 8: Newlines in Strings", () => {
    it("should escape newlines in strings", () => {
      const input = '{\n  "key": "line1\nline2"\n}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "line1\nline2" });
      expect(result.fixed).toContain("fix_newlines_in_strings");
    });

    it("should handle carriage returns", () => {
      const input = '{\n  "text": "line1\rline2"\n}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ text: "line1\rline2" });
    });
  });

  describe("Strategy 9: Unicode Escapes", () => {
    it("should handle unicode escape sequences", () => {
      const input = '{"emoji": "\\uD83D\\uDE00"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ emoji: "😀" });
    });

    it("should handle other unicode characters", () => {
      const input = '{"greek": "\\u03B1\\u03B2\\u03B3"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ greek: "αβγ" });
    });

    it("should handle invalid unicode gracefully", () => {
      const input = '{"invalid": "\\uZZZZ"}';
      const result = extractAndParse(input);
      expect(result.data).toHaveProperty("invalid");
    });
  });

  describe("Strategy 10: Control Characters", () => {
    it("should remove or escape control characters", () => {
      const input = '{"text": "hello\x00world"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ text: "helloworld" });
    });

    it("should preserve tabs when appropriate", () => {
      const input = '{"tab": "a\tb"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ tab: "a\tb" });
    });
  });

  describe("Strategy 11: Aggressive Cleanup", () => {
    it("should remove JavaScript comments", () => {
      const input = '{// comment\n"key": "value"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
    });

    it("should remove multi-line comments", () => {
      const input = '{/* comment */"key": "value"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
    });

    it("should handle mixed issues", () => {
      const input = `
        // This is a comment
        {
          'key': 'value',  // inline comment
        }
      `;
      const result = extractAndParse(input);
      expect(result.data).toEqual({ key: "value" });
    });
  });

  describe("Strategy 12: LLM Repair Fallback", () => {
    it("should use aggressive cleanup as LLM fallback", () => {
      const input = "{'very': 'broken', 'json': true,}";
      const result = extractAndParse(input);
      expect(result.data).toBeTruthy();
    });
  });

  describe("Edge Cases and Malformed Input", () => {
    it("should handle completely invalid JSON", () => {
      const input = "this is not json at all";
      const result = extractAndParse(input);
      expect(result.data).toBeNull();
      expect(result.strategy).toBe("none");
      expect(result.confidence).toBe(0);
    });

    it("should handle empty string", () => {
      const result = extractAndParse("");
      expect(result.data).toBeNull();
    });

    it("should handle whitespace only", () => {
      const result = extractAndParse("   \n\t  ");
      expect(result.data).toBeNull();
    });

    it("should handle null input", () => {
      const result = extractAndParse("null");
      expect(result.data).toBeNull();
    });

    it("should handle numbers as root", () => {
      const result = extractAndParse("42");
      expect(result.data).toBe(42);
    });

    it("should handle arrays of primitives", () => {
      const result = extractAndParse("[1, 2, 3, 4, 5]");
      expect(result.data).toEqual([1, 2, 3, 4, 5]);
    });

    it("should handle deeply nested structures", () => {
      const input = '{"a": {"b": {"c": {"d": {"e": "value"}}}}}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({
        a: { b: { c: { d: { e: "value" } } } },
      });
    });

    it("should handle escaped quotes in strings", () => {
      const input = '{"quote": "He said \\"hello\\""}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ quote: 'He said "hello"' });
    });

    it("should handle backslashes in strings", () => {
      const input = '{"path": "C:\\\\Users\\\\test"}';
      const result = extractAndParse(input);
      expect(result.data).toEqual({ path: "C:\\Users\\test" });
    });
  });

  describe("Confidence Scoring", () => {
    it("should assign confidence 1.0 for native parse", () => {
      const input = '{"perfect": true}';
      const result = extractAndParse(input);
      expect(result.confidence).toBe(1.0);
      expect(result.strategy).toBe("native_parse");
    });

    it("should lower confidence for fixed JSON", () => {
      const input = "{'fixed': true}";
      const result = extractAndParse(input);
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should return 0 confidence for unparseable input", () => {
      const input = "definitely not json";
      const result = extractAndParse(input);
      expect(result.confidence).toBe(0);
    });
  });

  describe("Fixed Array Tracking", () => {
    it("should track all fixes applied", () => {
      const input = "```json\n{'key': \"value\",}\n```";
      const result = extractAndParse(input);
      expect(result.fixed).toContain("code_fence_extraction");
      expect(result.fixed).toContain("fix_single_quotes");
      expect(result.fixed).toContain("fix_trailing_commas");
    });

    it("should not duplicate fix names", () => {
      const input = '{"key": "value"}';
      const result = extractAndParse(input);
      const uniqueFixes = new Set(result.fixed);
      expect(uniqueFixes.size).toBe(result.fixed.length);
    });
  });

  describe("Real-world Malformed Examples", () => {
    it("should handle LLM output with extra text", () => {
      const input = `
      Here is the JSON you requested:
      
      \`\`\`json
      {
        "title": "Docker Basics",
        "tags": ["devops", "docker"]
      }
      \`\`\`
      
      Let me know if you need anything else!
      `;
      const result = extractAndParse(input);
      expect(result.data).toEqual({
        title: "Docker Basics",
        tags: ["devops", "docker"],
      });
    });

    it("should handle JavaScript object notation", () => {
      const input = "const config = {timeout: 5000, retries: 3};";
      const result = extractAndParse(input);
      expect(result.data).toEqual({ timeout: 5000, retries: 3 });
    });

    it("should handle YAML-like JSON", () => {
      const input = `
{
  name: Test
  count: 42
  enabled: true
}
`;
      const result = extractAndParse(input);
      expect(result.data).toEqual({
        name: "Test",
        count: 42,
        enabled: true,
      });
    });
  });
});
