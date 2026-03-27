import { X, Search, Sun, Moon, BookOpen, Layers, Code, FileText, Mic } from 'lucide-react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/hooks/app'
import type { Theme } from '@/hooks/useTheme'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentChannel: Channel | null
  channelId: string
  channelTypeFilter: 'tech' | 'cert'
  selectedTechChannels: Channel[]
  selectedCertChannels: Channel[]
  section: Section
  sectionCounts: Record<Section, number>
  onChannelSwitch: (id: string) => void
  onChannelTypeFilterChange: (filter: 'tech' | 'cert') => void
  onEditChannels: () => void
  onSectionChange: (section: Section) => void
  onSearchOpen: () => void
  onThemeToggle: () => void
  theme: Theme
}

const TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'qa', label: 'Q&A', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'flashcards', label: 'Cards', icon: <Layers className="h-5 w-5" /> },
  { id: 'coding', label: 'Code', icon: <Code className="h-5 w-5" /> },
  { id: 'exam', label: 'Exam', icon: <FileText className="h-5 w-5" /> },
  { id: 'voice', label: 'Voice', icon: <Mic className="h-5 w-5" /> },
]

export function NavigationDrawer({
  isOpen,
  onClose,
  currentChannel,
  channelId,
  channelTypeFilter,
  selectedTechChannels,
  selectedCertChannels,
  section,
  sectionCounts,
  onChannelSwitch,
  onChannelTypeFilterChange,
  onEditChannels,
  onSectionChange,
  onSearchOpen,
  onThemeToggle,
  theme,
}: NavigationDrawerProps) {
  const hasBothTypes = selectedTechChannels.length > 0 && selectedCertChannels.length > 0
  const channels = channelTypeFilter === 'tech' ? selectedTechChannels : selectedCertChannels

  if (!isOpen) return null

  return (
    <>
      {/* Overlay with animation */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer with slide animation */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        className="md:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border shadow-2xl z-50 transform transition-transform duration-300 ease-out will-change-transform pt-[env(safe-area-inset-top,0px)]"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="flex flex-col h-full pb-[env(safe-area-inset-bottom,0px)]">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0">
            <div className="flex items-center gap-2">
              <span className="font-headline text-xl font-bold">
                Dev<span className="text-primary/80">Prep</span>
              </span>
              {currentChannel && (
                <>
                  <span className="text-border text-sm font-light">/</span>
                  <span className="text-sm text-muted-foreground">
                    {currentChannel.emoji} {currentChannel.name}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg touch-manipulation touch-feedback"
              aria-label="Close navigation menu"
            >
              <X
                size={24}
                className="text-secondary opacity-70 hover:opacity-100 transition-opacity drop-shadow-sm"
              />
            </button>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="grid grid-cols-5 gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onSectionChange(tab.id)
                    onClose()
                  }}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg touch-manipulation touch-feedback transition-colors ${
                    section === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  aria-pressed={section === tab.id}
                >
                  <span className="text-primary">{tab.icon}</span>
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {sectionCounts[tab.id] > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {sectionCounts[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Type Filter */}
          {hasBothTypes && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center border border-border/40 rounded-lg overflow-hidden bg-muted/30">
                <button
                  onClick={() => onChannelTypeFilterChange('tech')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation touch-feedback ${
                    channelTypeFilter === 'tech'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={channelTypeFilter === 'tech'}
                >
                  Tech Channels
                </button>
                <button
                  onClick={() => onChannelTypeFilterChange('cert')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation touch-feedback ${
                    channelTypeFilter === 'cert'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={channelTypeFilter === 'cert'}
                >
                  Certifications
                </button>
              </div>
            </div>
          )}

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {channelTypeFilter === 'tech' ? 'Tech Channels' : 'Certifications'}
              </h3>
              <button
                onClick={onEditChannels}
                className="text-sm text-primary hover:underline touch-manipulation touch-feedback px-2 py-1"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => {
                    onChannelSwitch(channel.id)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-colors touch-manipulation touch-feedback ${
                    channelId === channel.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50'
                  }`}
                  aria-pressed={channelId === channel.id}
                >
                  <span className="text-2xl">{channel.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium truncate">{channel.name}</div>
                    {channel.certCode && (
                      <div className="text-sm text-muted-foreground mt-0.5">{channel.certCode}</div>
                    )}
                  </div>
                  {channelId === channel.id && (
                    <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-border bg-background/95 backdrop-blur-md space-y-3">
            <button
              onClick={() => {
                onSearchOpen()
                onClose()
              }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-muted/50 transition-colors touch-manipulation touch-feedback border border-transparent hover:border-border/50"
            >
              <Search className="h-6 w-6 text-primary" />
              <div className="flex-1 text-left">
                <div className="text-base font-medium">Search</div>
                <div className="text-sm text-muted-foreground">Find any content</div>
              </div>
            </button>
            <button
              onClick={onThemeToggle}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-muted/50 transition-colors touch-manipulation touch-feedback border border-transparent hover:border-border/50"
            >
              {theme === 'dark' ? (
                <Sun className="h-6 w-6 text-amber-500" />
              ) : (
                <Moon className="h-6 w-6 text-indigo-500" />
              )}
              <div className="flex-1 text-left">
                <div className="text-base font-medium">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </div>
                <div className="text-sm text-muted-foreground">Switch theme</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
