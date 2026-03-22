import type { ComponentType } from 'react'
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
  ChevronLeft,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  Wifi,
  Database,
  AlertTriangle,
  Filter,
  Hash,
  Tag,
  Layers,
  Pin,
  PinOff,
  FileText as FileTextIcon,
  ClipboardList,
  Sparkles,
  Zap,
  Bot,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  CreditCard,
  HelpCircle,
  Clock,
  Star,
  PenTool,
  GraduationCap,
  Bell,
  PanelLeft,
  Send,
  Shuffle,
  RotateCcw,
  TrendingUp,
  Circle,
} from 'lucide-react'

export const IconRegistry = {
  navigation: {
    Home,
    LayoutDashboard,
    BookOpen,
    Code,
    FileText,
    Mic,
    Settings,
    User,
    Search,
    Bookmark,
    BarChart,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Plus,
    Menu,
    X,
    Bell,
  },
  actions: {
    Check,
    Plus,
    X,
    RefreshCw,
    AlertTriangle,
    Send,
    Shuffle,
    RotateCcw,
    Pin,
    PinOff,
  },
  status: {
    AlertCircle,
    Wifi,
    Database,
    Loader2,
    Clock,
    Star,
  },
  content: {
    FileText: FileTextIcon,
    ClipboardList,
    Layers,
    Hash,
    Tag,
    Sparkles,
    Zap,
    TrendingUp,
  },
  user: {
    User,
    Settings: SettingsIcon,
    LogOut,
    CreditCard,
    HelpCircle,
    ChevronDown,
  },
  theme: {
    Sun,
    Moon,
    Palette,
  },
  communication: {
    Bot,
    MessageSquare,
    HelpCircle,
  },
  learning: {
    BookOpen,
    PenTool,
    GraduationCap,
    FileText,
  },
  misc: {
    Circle,
    Filter,
    PanelLeft,
  },
} as const

export type IconName = keyof typeof IconRegistry | string
export type IconCategory = keyof typeof IconRegistry

interface DynamicIconProps {
  name: string
  category?: IconCategory
  className?: string
  size?: number
  strokeWidth?: number
}

export function getIcon(name: string, category?: IconCategory) {
  if (category && IconRegistry[category]) {
    const categoryIcons = IconRegistry[category] as Record<string, unknown>
    if (name in categoryIcons) {
      return categoryIcons[name] as ComponentType<{
        className?: string
        size?: number
        strokeWidth?: number
      }>
    }
  }
  for (const cat of Object.values(IconRegistry)) {
    const icons = cat as Record<string, unknown>
    if (name in icons) {
      return icons[name] as ComponentType<{
        className?: string
        size?: number
        strokeWidth?: number
      }>
    }
  }
  return null
}

export async function preloadIcons(iconNames: string[]) {
  const icons = await Promise.all(
    iconNames.map(async name => {
      const Icon = getIcon(name)
      return Icon ? { name, Component: Icon } : null
    })
  )
  return icons.filter(Boolean)
}

export const ICON_BUNDLE_GROUPS = {
  navigation: [
    'Home',
    'LayoutDashboard',
    'BookOpen',
    'Code',
    'FileText',
    'Mic',
    'Settings',
    'User',
    'Search',
    'Bookmark',
    'BarChart',
  ],
  actions: ['Check', 'Plus', 'X', 'RefreshCw', 'AlertTriangle', 'Send', 'Shuffle', 'RotateCcw'],
  status: ['AlertCircle', 'Wifi', 'Database', 'Loader2', 'Clock', 'Star'],
  common: [
    'Sun',
    'Moon',
    'Menu',
    'ChevronRight',
    'ChevronLeft',
    'ChevronDown',
    'Filter',
    'Hash',
    'Tag',
    'Layers',
  ],
} as const

export function getIconBundle(category: keyof typeof ICON_BUNDLE_GROUPS) {
  return ICON_BUNDLE_GROUPS[category]
}

export const ALL_ICONS = Object.values(ICON_BUNDLE_GROUPS).flat()

export { IconRegistry as default }
