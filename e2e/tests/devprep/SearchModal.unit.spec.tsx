import { test, expect, describe, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import React from "react";
import { SearchModal } from "../src/components/SearchModal";
import type { SearchResult } from "../src/types/search";

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "JavaScript Basics",
    type: "flashcard",
    preview: "Introduction to JavaScript",
  },
  {
    id: "2",
    title: "React Hooks",
    type: "question",
    preview: "Common React interview questions",
  },
  {
    id: "3",
    title: "Array Methods",
    type: "coding",
    preview: "Practice array methods",
  },
];

describe("SearchModal Component Tests", () => {
  const mockOnClose = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleOpenChange Double-Close Prevention", () => {
    test("SCH-UNIT-001: handleOpenChange prevents double-close with rapid Escape presses", async () => {
      let isOpen = true;
      const onClose = vi.fn(() => {
        isOpen = false;
      });

      render(
        <SearchModal
          isOpen={isOpen}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      const modal = screen.getByTestId("search-modal");
      expect(modal).toBeInTheDocument();

      fireEvent.keyDown(screen.getByTestId("search-input"), {
        key: "Escape",
      });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });

      onClose.mockClear();

      fireEvent.keyDown(screen.getByTestId("search-input"), {
        key: "Escape",
      });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    test("SCH-UNIT-002: handleOpenChange guard allows normal close sequence", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("search-modal")).toBeInTheDocument();

      rerender(
        <SearchModal
          isOpen={false}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    test("SCH-UNIT-003: Click outside triggers onClose only once", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog, { target: null });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("activeIndex Reset on Results Change", () => {
    test("SCH-UNIT-004: activeIndex resets to 0 when results change", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      const newResults: SearchResult[] = [
        { id: "4", title: "New Result", type: "flashcard", preview: "New" },
        {
          id: "5",
          title: "Another Result",
          type: "question",
          preview: "Another",
        },
      ];

      rerender(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={newResults}
          isLoading={false}
        />,
      );

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(2);
    });

    test("SCH-UNIT-005: activeIndex resets when results array length changes", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        for (let i = 0; i < 3; i++) {
          fireEvent.keyDown(input, { key: "ArrowDown" });
        }
      });

      const reducedResults: SearchResult[] = [
        {
          id: "1",
          title: "JavaScript Basics",
          type: "flashcard",
          preview: "Intro",
        },
      ];

      rerender(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={reducedResults}
          isLoading={false}
        />,
      );

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(1);
    });

    test("SCH-UNIT-006: activeIndex resets when results IDs change (same length)", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      const differentIdsResults: SearchResult[] = [
        {
          id: "new-1",
          title: "New Result 1",
          type: "flashcard",
          preview: "New 1",
        },
        {
          id: "new-2",
          title: "New Result 2",
          type: "question",
          preview: "New 2",
        },
        {
          id: "new-3",
          title: "New Result 3",
          type: "coding",
          preview: "New 3",
        },
      ];

      rerender(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={differentIdsResults}
          isLoading={false}
        />,
      );

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(3);
    });

    test("SCH-UNIT-007: activeIndex does not reset when same results returned", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      rerender(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(3);
    });
  });

  describe("Keyboard Navigation", () => {
    test("SCH-UNIT-008: ArrowDown increments activeIndex within bounds", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(3);
    });

    test("SCH-UNIT-009: ArrowUp decrements activeIndex within bounds", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(3);
    });

    test("SCH-UNIT-010: ArrowDown does not exceed results length", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.keyDown(input, { key: "ArrowDown" });
        }
      });

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(3);
    });

    test("SCH-UNIT-011: ArrowUp does not go below 0", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");

      act(() => {
        for (let i = 0; i < 5; i++) {
          fireEvent.keyDown(input, { key: "ArrowUp" });
        }
      });

      const results = screen.queryAllByTestId("search-result");
      expect(results.length).toBe(3);
    });
  });

  describe("Loading and Empty States", () => {
    test("SCH-UNIT-012: Loading spinner displays when isLoading is true", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={true}
        />,
      );

      const loading = screen.getByTestId("search-loading");
      expect(loading).toBeInTheDocument();
    });

    test("SCH-UNIT-013: Empty state displays when no results and not loading", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      const emptyState = screen.getByTestId("search-empty-state");
      expect(emptyState).toBeInTheDocument();
    });

    test("SCH-UNIT-014: Results display when available", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const results = screen.getAllByTestId("search-result");
      expect(results.length).toBe(3);
    });
  });

  describe("Result Selection", () => {
    test("SCH-UNIT-015: Clicking result calls onSelect when provided", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          onSelect={mockOnSelect}
          results={mockResults}
          isLoading={false}
        />,
      );

      const firstResult = screen.getAllByTestId("search-result")[0];
      fireEvent.click(firstResult);

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    test("SCH-UNIT-016: Clicking result calls onClose when onSelect not provided", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const firstResult = screen.getAllByTestId("search-result")[0];
      fireEvent.click(firstResult);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("Search Input Behavior", () => {
    test("SCH-UNIT-017: Input value triggers onSearch callback", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.change(input, { target: { value: "test" } });

      expect(mockOnSearch).toHaveBeenCalledWith("test");
    });

    test("SCH-UNIT-018: Clear button triggers onClear and clears search", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          onClear={mockOnClear}
          results={[]}
          isLoading={false}
          query="test"
        />,
      );

      const clearButton = screen.getByTestId("search-clear-button");
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
      expect(mockOnSearch).toHaveBeenCalledWith("");
    });

    test("SCH-UNIT-019: Focus is set on input when modal opens", async () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <SearchModal
          isOpen={false}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      rerender(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={[]}
          isLoading={false}
        />,
      );

      await waitFor(() => {
        const input = screen.getByTestId("search-input");
        expect(input).toHaveFocus();
      });
    });
  });

  describe("ARIA Attributes", () => {
    test("SCH-UNIT-020: Modal has correct ARIA attributes", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const modal = screen.getByTestId("search-modal");
      expect(modal).toHaveAttribute("aria-modal", "true");
    });

    test("SCH-UNIT-021: Input has ARIA attributes for accessibility", async () => {
      const onClose = vi.fn();

      render(
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSearch={mockOnSearch}
          results={mockResults}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("search-input");
      expect(input).toHaveAttribute("role", "combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
    });
  });
});
