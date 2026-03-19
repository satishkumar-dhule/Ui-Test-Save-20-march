import { describe, it, expect } from "vitest";

function groupByChannel(
  items: Array<{ channelId: string; data: any }>,
): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  for (const item of items) {
    if (!grouped[item.channelId]) {
      grouped[item.channelId] = [];
    }
    grouped[item.channelId].push(item.data);
  }
  return grouped;
}

function paginateArray<T>(arr: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return arr.slice(start, start + pageSize);
}

function sortByKey<T extends Record<string, any>>(
  arr: T[],
  key: keyof T,
  ascending = true,
): T[] {
  return [...arr].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });
}

function filterByDateRange<T extends { createdAt: string }>(
  items: T[],
  startDate?: string,
  endDate?: string,
): T[] {
  return items.filter((item) => {
    const date = new Date(item.createdAt);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate && date > new Date(endDate)) return false;
    return true;
  });
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function mergeObjects<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  return { ...target, ...source };
}

describe("Data Transformation Functions", () => {
  describe("groupByChannel", () => {
    it("should group items by channel ID", () => {
      const items = [
        { channelId: "javascript", data: { id: 1 } },
        { channelId: "react", data: { id: 2 } },
        { channelId: "javascript", data: { id: 3 } },
      ];
      const result = groupByChannel(items);
      expect(result.javascript).toHaveLength(2);
      expect(result.react).toHaveLength(1);
    });

    it("should handle empty array", () => {
      const result = groupByChannel([]);
      expect(result).toEqual({});
    });

    it("should handle single item", () => {
      const items = [{ channelId: "aws", data: { id: 1 } }];
      const result = groupByChannel(items);
      expect(result.aws).toHaveLength(1);
    });
  });

  describe("paginateArray", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it("should return first page", () => {
      expect(paginateArray(items, 1, 3)).toEqual([1, 2, 3]);
    });

    it("should return second page", () => {
      expect(paginateArray(items, 2, 3)).toEqual([4, 5, 6]);
    });

    it("should return partial last page", () => {
      expect(paginateArray(items, 4, 3)).toEqual([10]);
    });

    it("should handle page beyond range", () => {
      expect(paginateArray(items, 10, 3)).toEqual([]);
    });

    it("should handle empty array", () => {
      expect(paginateArray([], 1, 3)).toEqual([]);
    });
  });

  describe("sortByKey", () => {
    const items = [
      { name: "Charlie", score: 30 },
      { name: "Alice", score: 10 },
      { name: "Bob", score: 20 },
    ];

    it("should sort ascending by default", () => {
      const result = sortByKey(items, "score");
      expect(result[0].name).toBe("Alice");
      expect(result[2].name).toBe("Charlie");
    });

    it("should sort descending when specified", () => {
      const result = sortByKey(items, "score", false);
      expect(result[0].name).toBe("Charlie");
      expect(result[2].name).toBe("Alice");
    });

    it("should sort strings alphabetically", () => {
      const result = sortByKey(items, "name");
      expect(result[0].name).toBe("Alice");
      expect(result[2].name).toBe("Charlie");
    });

    it("should not mutate original array", () => {
      sortByKey(items, "score");
      expect(items[0].name).toBe("Charlie");
    });
  });

  describe("filterByDateRange", () => {
    const items = [
      { id: 1, createdAt: "2024-01-01" },
      { id: 2, createdAt: "2024-06-15" },
      { id: 3, createdAt: "2024-12-31" },
    ];

    it("should filter by start date", () => {
      const result = filterByDateRange(items, "2024-06-01");
      expect(result).toHaveLength(2);
    });

    it("should filter by end date", () => {
      const result = filterByDateRange(items, undefined, "2024-06-30");
      expect(result).toHaveLength(2);
    });

    it("should filter by date range", () => {
      const result = filterByDateRange(items, "2024-01-01", "2024-06-30");
      expect(result).toHaveLength(2);
    });

    it("should return all items when no dates provided", () => {
      const result = filterByDateRange(items);
      expect(result).toHaveLength(3);
    });
  });

  describe("deepClone", () => {
    it("should create a deep copy", () => {
      const original = { a: 1, b: { c: 2 } };
      const clone = deepClone(original);
      clone.b.c = 3;
      expect(original.b.c).toBe(2);
    });

    it("should handle arrays", () => {
      const original = [1, [2, 3]];
      const clone = deepClone(original);
      (clone[1] as number[])[0] = 99;
      expect((original[1] as number[])[0]).toBe(2);
    });

    it("should handle primitives", () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone("hello")).toBe("hello");
      expect(deepClone(null)).toBe(null);
    });
  });

  describe("mergeObjects", () => {
    it("should merge objects", () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      expect(mergeObjects(target, source)).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should not mutate target", () => {
      const target = { a: 1 };
      mergeObjects(target, { b: 2 });
      expect(target).toEqual({ a: 1 });
    });

    it("should handle empty source", () => {
      const target = { a: 1, b: 2 };
      expect(mergeObjects(target, {})).toEqual({ a: 1, b: 2 });
    });
  });
});
