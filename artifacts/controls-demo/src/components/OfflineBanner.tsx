import { useRegisterSW } from "virtual:pwa-register";

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className = "" }: OfflineBannerProps) {
  const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW();

  const handleClose = () => {
    // User dismissed the notification
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400 dark:text-yellow-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12-1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
              {offlineReady
                ? "App is ready for offline use"
                : "New version available!"}
            </p>
            {offlineReady && (
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-200">
                Content has been cached for offline access.
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex gap-2">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker()}
                className="px-3 py-1.5 text-sm font-medium text-yellow-800 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 rounded-md transition-colors"
              >
                Reload
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 text-yellow-600 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-100 rounded-md transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfflineBanner;
