import { Sun, Moon, Search } from "lucide-react";
import type { Channel } from "@/data/channels";

interface AppHeaderProps {
  currentChannel: Channel;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  onSearchOpen: () => void;
}

/**
 * Application header with logo, current channel indicator, and controls
 */
export function AppHeader({
  currentChannel: ch,
  theme,
  onThemeToggle,
  onSearchOpen,
}: AppHeaderProps) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-4 border-b border-border"
      style={{
        height: 52,
        background: theme === "dark" ? "#010409" : "#f6f8fa",
      }}
      data-testid="header"
    >
      {/* Logo and channel info */}
      <div className="flex items-center gap-2">
        <OctocatLogo className="text-foreground" />
        <span className="text-base font-bold text-foreground">DevPrep</span>
        <span className="text-border text-xl font-light mx-0.5">/</span>
        {ch && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-foreground">
              {ch.emoji} {ch.name}
            </span>
            {ch.certCode && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  color: ch.color,
                  background: ch.color + "20",
                  border: `1px solid ${ch.color}44`,
                }}
              >
                {ch.certCode}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          data-testid="search-button"
          onClick={onSearchOpen}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Search (Cmd+K)"
        >
          <Search size={16} />
        </button>
        <button
          data-testid="theme-toggle"
          onClick={onThemeToggle}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * GitHub Octocat logo component
 */
function OctocatLogo({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
