/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a fallback UI.
 * Includes error tracking and logging for observability.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
  showDetails?: boolean;
  /** Custom error handler for logging/tracking */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Component identifier for tracking */
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

const ERROR_MESSAGES = {
  generic: "Something went wrong",
  network: "Unable to connect. Please check your internet connection.",
  timeout: "The request took too long. Please try again.",
  render: "We encountered an issue displaying this content.",
};

/**
 * Get a user-friendly error message based on the error
 */
function getUserFriendlyMessage(error: Error | null): string {
  if (!error) return ERROR_MESSAGES.generic;

  const message = error.message?.toLowerCase() || "";

  if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
    return ERROR_MESSAGES.network;
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return ERROR_MESSAGES.timeout;
  }
  if (message.includes("render") || message.includes("component") || message.includes("element")) {
    return ERROR_MESSAGES.render;
  }

  // Check for specific error codes
  if (message.includes("401") || message.includes("403") || message.includes("unauthorized")) {
    return "Authentication error. Please refresh and try again.";
  }
  if (message.includes("404") || message.includes("not found")) {
    return "The requested content was not found.";
  }
  if (message.includes("500") || message.includes("internal server")) {
    return "Server error. Please try again later.";
  }

  return ERROR_MESSAGES.generic;
}

/**
 * Format error for logging
 */
function formatErrorForLogging(error: Error, errorInfo: ErrorInfo, componentName?: string): Record<string, unknown> {
  return {
    errorId: crypto.randomUUID(),
    componentName: componentName || "Unknown",
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
  };
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      errorId: crypto.randomUUID(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate error ID for tracking
    const errorId = crypto.randomUUID();
    this.setState({ errorInfo, errorId });

    // Format error details for logging
    const errorDetails = formatErrorForLogging(
      error, 
      errorInfo, 
      this.props.componentName
    );

    // Log to console with structured format
    console.error(
      `[ErrorBoundary] Error caught in ${this.props.componentName || "component"}:`,
      JSON.stringify(errorDetails, null, 2)
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track in monitoring system (if available)
    if (typeof window !== "undefined" && (window as unknown as { __monitoring__?: { trackError: (error: unknown, context?: Record<string, unknown>) => void } }).__monitoring__) {
      (window as unknown as { __monitoring__: { trackError: (error: unknown, context?: Record<string, unknown>) => void } }).__monitoring__.trackError(error, {
        componentName: this.props.componentName,
        errorId,
        errorInfo: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: "",
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userMessage = getUserFriendlyMessage(this.state.error);

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
          role="alert"
          aria-live="assertive"
          data-error-id={this.state.errorId}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform hover:scale-105"
            style={{
              background: "hsl(var(--destructive) / 0.12)",
              border: "2px solid hsl(var(--destructive) / 0.25)",
            }}
          >
            <AlertTriangle
              size={32}
              style={{ color: "hsl(var(--destructive))" }}
              aria-hidden="true"
            />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {this.props.title || ERROR_MESSAGES.render}
          </h2>

          <p className="text-sm text-muted-foreground mb-2 max-w-md">
            {userMessage}
          </p>

          {this.props.showDetails && this.state.error && (
            <details className="mt-4 p-3 rounded-lg bg-muted/50 text-left w-full max-w-md">
              <summary className="text-xs font-semibold text-muted-foreground cursor-pointer">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-destructive overflow-auto max-h-32 whitespace-pre-wrap">
                {this.state.error.name}: {this.state.error.message}
                {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
              </pre>
              {this.state.errorId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </details>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Button
              onClick={this.handleReset}
              variant="default"
              className="btn-micro"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Try Again
            </Button>

            <Button
              onClick={this.handleGoHome}
              variant="outline"
              className="btn-micro"
            >
              <Home size={14} aria-hidden="true" />
              Go Home
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            If this problem persists, please refresh the page or contact
            support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component wrapper for automatic error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    componentName?: string;
  }
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary
      onError={options?.onError}
      componentName={options?.componentName || Component.displayName || Component.name}
    >
      {options?.fallback}
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
