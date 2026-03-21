import { Menu } from 'lucide-react'
import type { Channel } from '@/data/channels'

interface MobileHeaderProps {
  currentChannel: Channel | null
  onMenuToggle: () => void
  onSearchOpen: () => void
}

export function MobileHeader({ currentChannel, onMenuToggle, onSearchOpen }: MobileHeaderProps) {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg touch-manipulation"
          aria-label="Open navigation menu"
        >
          <Menu
            size={24}
            className="text-secondary opacity-70 hover:opacity-100 transition-opacity drop-shadow-sm"
          />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-headline text-lg font-bold tracking-tight">
            Dev<span className="text-primary/80">Prep</span>
          </span>
          {currentChannel && (
            <>
              <span className="text-border text-sm font-light">/</span>
              <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                {currentChannel.emoji} {currentChannel.shortName || currentChannel.name}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={onSearchOpen}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg touch-manipulation"
        aria-label="Search"
      >
        <span className="text-xl">🔍</span>
      </button>
    </div>
  )
}
