# Sidebar Navigation

## Overview

The DevPrep sidebar navigation provides a comprehensive, collapsible interface that displays all app features. Built using the existing UI sidebar components, it supports smooth animations, icons, badges, active state highlighting, responsive behavior, keyboard accessibility, and dark/light theme support.

## Architecture

### Components

1. **SidebarNavigation** (`src/components/navigation/Sidebar.tsx`)
   - Main sidebar component that orchestrates all navigation groups
   - Uses `SidebarProvider` from UI components for state management
   - Handles mobile detection and responsive behavior
   - Fetches channels data via `useChannels` hook

2. **SidebarItem** (`src/components/navigation/SidebarItem.tsx`)
   - Individual navigation item with icon, label, badge, and optional children
   - Supports active state highlighting and tooltips
   - Can be nested for submenus

3. **SidebarGroup** (`src/components/navigation/SidebarGroup.tsx`)
   - Groups related sidebar items under a labeled section
   - Uses `SidebarGroupLabel` and `SidebarGroupContent` from UI components

### Navigation Sections

The sidebar is organized into six logical groups:

#### 1. Main Navigation
- **Home**: Return to homepage
- **Dashboard**: View user dashboard (future)

#### 2. Content Types
- **Questions**: Q&A practice (`qa`)
- **Flashcards**: Flashcard study (`flashcards`)
- **Coding**: Coding challenges (`coding`)
- **Exam**: Mock exams (`exam`)
- **Voice**: Voice practice (`voice`)

#### 3. Channels
- **Tech Channels**: All technology channels (JavaScript, React, Python, etc.)
- **Certifications**: Certification channels (AWS, CKA, Terraform, etc.)

#### 4. Learning Tools
- **Search**: Search content (⌘K)
- **Bookmarks**: Saved content
- **Progress**: Learning analytics

#### 5. Settings
- **Profile**: User profile
- **Preferences**: App preferences
- **Theme**: Toggle light/dark mode

## Features

### Collapsible with Smooth Animation
- Uses `SidebarProvider` with `collapsible="icon"` for icon-only collapsed state
- CSS transitions for smooth expand/collapse animations
- Keyboard shortcut: `Ctrl/Cmd + B` (default from UI sidebar)

### Icons and Badges
- Each item can have a custom icon (Lucide React or custom JSX)
- Badges can display counts or notifications
- Channel items show emoji icons

### Active State Highlighting
- Items highlight when active based on `currentSection` or `currentChannelId`
- Uses `isActive` prop on `SidebarMenuButton`

### Responsive Design
- **Desktop**: Visible sidebar with collapse capability
- **Mobile**: Hidden by default, accessible via drawer (integration pending)
- Auto-detects screen size and adjusts behavior

### Keyboard Accessibility
- Built-in keyboard navigation from UI sidebar components
- Focus management and ARIA attributes
- `SidebarTrigger` button for toggling

### Dark/Light Theme Support
- Inherits theme from app's `useTheme` hook
- CSS variables adapt sidebar styling
- Theme toggle item in settings group

## Usage

### Basic Integration

```tsx
import { SidebarNavigation } from '@/components/navigation'

function AppLayout() {
  const [currentSection, setCurrentSection] = useState<Section>('qa')
  const [currentChannelId, setCurrentChannelId] = useState('javascript')
  
  return (
    <div className="flex">
      <SidebarNavigation
        currentSection={currentSection}
        currentChannelId={currentChannelId}
        onSectionChange={setCurrentSection}
        onChannelChange={setCurrentChannelId}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <main className="flex-1">
        {/* Your main content */}
      </main>
    </div>
  )
}
```

### Customizing Items

Items can be customized by passing `SidebarItemProps` arrays to groups:

```tsx
const customItems: SidebarItemProps[] = [
  {
    id: 'custom',
    label: 'Custom Item',
    icon: <Star className="h-4 w-4" />,
    badge: 5,
    onClick: () => console.log('clicked'),
  },
]
```

### Adding Submenus

Items can have nested children for submenus:

```tsx
const itemsWithSubmenu: SidebarItemProps[] = [
  {
    id: 'parent',
    label: 'Parent',
    icon: <Folder />,
    children: [
      { id: 'child1', label: 'Child 1', icon: <File /> },
      { id: 'child2', label: 'Child 2', icon: <File /> },
    ],
  },
]
```

## Implementation Details

### State Management
- Sidebar open/close state managed by `SidebarProvider`
- Active section/channel passed as props from parent component
- Channel data fetched via `useChannels` hook (static + DB)

### Styling
- Uses existing UI sidebar component classes
- Tailwind CSS variables for theming
- Glass morphism effects via `glass-sidebar` class

### Performance
- Lazy loads channel data
- Memoizes filtered groups
- Minimal re-renders with React.memo (if needed)

## Future Enhancements

1. **Mobile Integration**: Connect sidebar with mobile drawer navigation
2. **Drag & Drop**: Allow users to reorder channels
3. **Favorites**: Pin frequently used channels
4. **Search within Sidebar**: Filter navigation items
5. **Section Badges**: Show unread counts per section
6. **Collapsible Groups**: Allow users to collapse individual groups

## Migration from Existing Navigation

The sidebar replaces the need for:
- `SectionTabs` component (integrated into sidebar)
- `ChannelSelector` component (integrated into channels group)
- Mobile bottom navigation (can be synced with sidebar state)

## Accessibility

- ARIA labels and roles from UI sidebar components
- Keyboard navigation support
- Focus trapping in mobile drawer (when integrated)
- Screen reader announcements for state changes

---

*Last Updated: 2026-03-22*
*Author: SIDEBAR_ENGINEER (Rachel Green)*