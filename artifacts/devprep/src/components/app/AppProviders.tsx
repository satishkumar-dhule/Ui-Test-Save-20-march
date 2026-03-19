import { useEffect } from "react";

interface AppProvidersProps {
  theme: "dark" | "light";
  children: React.ReactNode;
}

/**
 * Context providers and global effects for the app.
 * Currently handles theme application to document root.
 * 
 * NOTE: This is designed for future provider additions like:
 * - React Query Client
 * - Auth context
 * - Feature flags
 * - etc.
 */
export function AppProviders({ theme, children }: AppProvidersProps) {
  // Apply theme class to document root
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
