'use client'

import { useEffect, useState } from 'react'
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Code,
  FileText,
  Mic,
  Settings,
  User,
  Palette,
  Search,
  Bookmark,
  BarChart,
  ChevronRight,
} from 'lucide-react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/hooks/app/useAppState'
import { useChannels } from '@/hooks/useChannels'
import { useTheme } from '@/hooks/useTheme'
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { SidebarItem, SidebarItemProps } from './SidebarItem'
import { SidebarGroup as SidebarGroupComp, SidebarGroupProps } from './SidebarGroup'

export interface SidebarNavigationProps {
  currentSection?: Section
  currentChannelId?: string
  onSectionChange?: (section: Section) => void
  onChannelChange?: (channelId: string) => void
  onSearchOpen?: () => void
  defaultOpen?: boolean
}

export function SidebarNavigation({
  currentSection = 'qa',
  currentChannelId = 'javascript',
  onSectionChange,
  onChannelChange,
  onSearchOpen,
  defaultOpen = true,
}: SidebarNavigationProps) {
  const { channels } = useChannels()
  const { theme, toggleTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Define navigation groups
  const mainNavItems: SidebarItemProps[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
      isActive: false, // TODO: determine based on route
      onClick: () => (window.location.href = '/'),
      tooltip: 'Go to homepage',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      isActive: false,
      onClick: () => (window.location.href = '/dashboard'),
      tooltip: 'View your dashboard',
    },
  ]

  const contentTypeItems: SidebarItemProps[] = [
    {
      id: 'qa',
      label: 'Questions',
      icon: <BookOpen className="h-4 w-4" />,
      isActive: currentSection === 'qa',
      onClick: () => onSectionChange?.('qa'),
      badge: 0,
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: <BookOpen className="h-4 w-4" />, // TODO: change icon
      isActive: currentSection === 'flashcards',
      onClick: () => onSectionChange?.('flashcards'),
      badge: 0,
    },
    {
      id: 'coding',
      label: 'Coding',
      icon: <Code className="h-4 w-4" />,
      isActive: currentSection === 'coding',
      onClick: () => onSectionChange?.('coding'),
      badge: 0,
    },
    {
      id: 'exam',
      label: 'Exam',
      icon: <FileText className="h-4 w-4" />,
      isActive: currentSection === 'exam',
      onClick: () => onSectionChange?.('exam'),
      badge: 0,
    },
    {
      id: 'voice',
      label: 'Voice',
      icon: <Mic className="h-4 w-4" />,
      isActive: currentSection === 'voice',
      onClick: () => onSectionChange?.('voice'),
      badge: 0,
    },
  ]

  // Group channels by type
  const techChannels = channels.filter(c => c.type === 'tech')
  const certChannels = channels.filter(c => c.type === 'cert')

  const channelItems: SidebarItemProps[] = [
    ...techChannels.map(channel => ({
      id: channel.id,
      label: channel.name,
      icon: <span className="text-lg">{channel.emoji}</span>,
      isActive: currentChannelId === channel.id,
      onClick: () => onChannelChange?.(channel.id),
      badge: undefined,
    })),
  ]

  const certChannelItems: SidebarItemProps[] = certChannels.map(channel => ({
    id: channel.id,
    label: channel.name,
    icon: <span className="text-lg">{channel.emoji}</span>,
    isActive: currentChannelId === channel.id,
    onClick: () => onChannelChange?.(channel.id),
    badge: undefined,
  }))

  const learningToolsItems: SidebarItemProps[] = [
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-4 w-4" />,
      onClick: onSearchOpen,
      tooltip: 'Search content (⌘K)',
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      icon: <Bookmark className="h-4 w-4" />,
      onClick: () => (window.location.href = '/bookmarks'),
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <BarChart className="h-4 w-4" />,
      onClick: () => (window.location.href = '/progress'),
    },
  ]

  const settingsItems: SidebarItemProps[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      onClick: () => (window.location.href = '/profile'),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => (window.location.href = '/preferences'),
    },
    {
      id: 'theme',
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: <Palette className="h-4 w-4" />,
      onClick: toggleTheme,
      tooltip: 'Toggle theme',
    },
  ]

  const groups: SidebarGroupProps[] = [
    { id: 'main', label: 'Main', items: mainNavItems },
    { id: 'content', label: 'Content Types', items: contentTypeItems },
    { id: 'channels', label: 'Channels', items: channelItems },
    { id: 'certifications', label: 'Certifications', items: certChannelItems },
    { id: 'tools', label: 'Learning Tools', items: learningToolsItems },
    { id: 'settings', label: 'Settings', items: settingsItems },
  ]

  // Hide certifications if none
  const filteredGroups = groups.filter(g => g.items.length > 0)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarPrimitive side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="font-bold text-lg">
              <span className="text-primary">Dev</span>
              <span className="text-muted-foreground">Prep</span>
            </span>
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {filteredGroups.map(group => (
            <SidebarGroupComp key={group.id} {...group} />
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="text-xs text-muted-foreground">DevPrep v2.0</div>
        </SidebarFooter>
        <SidebarRail />
      </SidebarPrimitive>
    </SidebarProvider>
  )
}
