import { useState } from 'react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/hooks/app'
import { MobileHeader } from './MobileHeader'
import { NavigationDrawer } from './NavigationDrawer'
import { BottomNav } from './BottomNav'

interface MobileNavProps {
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
  theme: 'dark' | 'light'
}

export function MobileNav({
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
}: MobileNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen)
  const closeDrawer = () => setIsDrawerOpen(false)

  return (
    <>
      {/* Mobile Header with Hamburger Menu */}
      <MobileHeader
        currentChannel={currentChannel}
        onMenuToggle={toggleDrawer}
        onSearchOpen={onSearchOpen}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        section={section}
        sectionCounts={sectionCounts}
        onSectionChange={onSectionChange}
      />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        currentChannel={currentChannel}
        channelId={channelId}
        channelTypeFilter={channelTypeFilter}
        selectedTechChannels={selectedTechChannels}
        selectedCertChannels={selectedCertChannels}
        section={section}
        sectionCounts={sectionCounts}
        onChannelSwitch={onChannelSwitch}
        onChannelTypeFilterChange={onChannelTypeFilterChange}
        onEditChannels={onEditChannels}
        onSectionChange={onSectionChange}
        onSearchOpen={onSearchOpen}
        onThemeToggle={onThemeToggle}
        theme={theme}
      />
    </>
  )
}
