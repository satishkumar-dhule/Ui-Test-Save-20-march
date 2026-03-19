import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ErrorComponent = () => {
  throw new Error("Test error");
};

const FallbackComponent = () => (
  <div data-testid="custom-fallback">Custom Fallback</div>
);

describe("ErrorBoundary Component", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Content</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should render children as React nodes", () => {
      render(
        <ErrorBoundary>
          <span>Text content</span>
        </ErrorBoundary>,
      );

      expect(screen.getByText("Text content")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should catch errors from children", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should display error message", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("should show default error message for unknown errors", () => {
      const UnknownErrorComponent = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <UnknownErrorComponent />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("An unexpected error occurred."),
      ).toBeInTheDocument();
    });

    it("should log error to console", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Fallback Component", () => {
    it("should render custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={<FallbackComponent />}>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    });

    it("should not render default error UI when custom fallback is provided", () => {
      render(
        <ErrorBoundary fallback={<FallbackComponent />}>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(
        screen.queryByText("Something went wrong"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("should have a Try again button", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Try again")).toBeInTheDocument();
    });

    it("should reset state when Try again is clicked", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Try again"));

      rerender(
        <ErrorBoundary>
          <div data-testid="reset-content">Reset successful</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("reset-content")).toBeInTheDocument();
    });

    it("should allow recovery after error", () => {
      let shouldThrow = true;

      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error("Initial error");
        }
        return <div data-testid="recovered">Recovered!</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      shouldThrow = false;
      fireEvent.click(screen.getByText("Try again"));

      rerender(
        <ErrorBoundary>
          <ConditionalComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("recovered")).toBeInTheDocument();
    });
  });

  describe("Visual Elements", () => {
    it("should render warning icon", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      const icon = document.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render refresh icon in button", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      const button = screen.getByRole("button", { name: /try again/i });
      expect(button).toBeInTheDocument();
    });

    it("should have correct button styling classes", () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      const button = screen.getByRole("button", { name: /try again/i });
      expect(button).toHaveClass("flex", "items-center", "gap-2");
    });
  });
});
