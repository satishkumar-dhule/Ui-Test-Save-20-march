import React, { useState } from 'react';
import { cn } from '../../../lib/utils';

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  (
    {
      className,
      title,
      description,
      header,
      footer,
      variant = 'default',
      size = 'md',
      isLoading = false,
      isError = false,
      errorMessage = 'Something went wrong',
      collapsible = false,
      defaultCollapsed = false,
      children,
      ...props
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const handleToggleCollapse = () => {
      if (collapsible) {
        setIsCollapsed(!isCollapsed);
      }
    };

    const variantClasses = {
      default: 'bg-card text-card-foreground shadow-sm',
      outline: 'border border-input bg-transparent',
      filled: 'bg-muted/50 text-foreground',
    };

    const sizeClasses = {
      sm: 'p-3 rounded-lg',
      md: 'p-4 rounded-xl',
      lg: 'p-6 rounded-2xl',
    };

    if (isError) {
      return (
        <div
          ref={ref}
          className={cn(
            'rounded-xl border border-destructive/50 text-destructive',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div className="mb-2">
            <h3 className="text-lg font-semibold">Error</h3>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <div className="flex items-center justify-center py-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variantClasses[variant],
          sizeClasses[size],
          isLoading && 'opacity-70',
          'relative',
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-inherit">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {(title || description || header || collapsible) && (
          <div
            className={cn(
              'mb-4',
              collapsible && 'cursor-pointer select-none',
              isCollapsed && 'mb-0'
            )}
            onClick={collapsible ? handleToggleCollapse : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {title && (
                  <h3 className="text-xl font-semibold tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {collapsible && (
                <button
                  type="button"
                  className="rounded-md p-1 hover:bg-accent"
                  onClick={handleToggleCollapse}
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                      'transition-transform',
                      isCollapsed ? 'rotate-180' : ''
                    )}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>
            {header && !isCollapsed && <div className="mt-2">{header}</div>}
          </div>
        )}

        {(!collapsible || !isCollapsed) && (
          <div className="flex-1">
            {children}
          </div>
        )}

        {footer && !isCollapsed && (
          <div className="mt-4 pt-4 border-t">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

DashboardCard.displayName = 'DashboardCard';

export { DashboardCard };