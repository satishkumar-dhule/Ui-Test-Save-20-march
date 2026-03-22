import React, { useState } from 'react';
import { cn } from '../../../lib/utils';

export interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      className,
      title,
      subtitle,
      header,
      sidebar,
      footer,
      isLoading = false,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-background',
          className
        )}
        {...props}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
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
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
              <div>
                {title && (
                  <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              {header}
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          {sidebar && (
            <aside
              className={cn(
                'fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div className="h-full overflow-y-auto py-4">
                {sidebar}
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1">
            <div
              className={cn(
                'container mx-auto p-4 md:p-6',
                fullWidth ? 'max-w-full' : 'max-w-7xl'
              )}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        {footer && (
          <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              {footer}
            </div>
          </footer>
        )}

        {/* Overlay for mobile sidebar */}
        {sidebar && sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    );
  }
);

DashboardLayout.displayName = 'DashboardLayout';

export { DashboardLayout };