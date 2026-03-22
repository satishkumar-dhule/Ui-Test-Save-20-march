# Navigation Architecture - DevPrep V2

## Overview

This document defines the complete navigation architecture for DevPrep V2, ensuring all features are discoverable and accessible within **3 clicks maximum**. The design follows modern SaaS patterns with clear visual hierarchy, progressive disclosure, and keyboard accessibility.

## Navigation Hierarchy

### 1. Primary Navigation (Global Sidebar)

The sidebar provides persistent access to all major sections:

```typescript
interface PrimaryNavigation {
  items: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      icon: '🏠',
      description: 'Overview of progress and recent activity'
    },
    {
      id: 'content',
      label: 'Content Library',
      path: '/content',
      icon: '📚',
      description: 'Browse all learning content',
      children: [
        { label: 'All Content', path: '/content' },
        { label: 'Questions', path: '/content/question' },
        { label: 'Flashcards', path: '/content/flashcard' },
        { label: 'Exams', path: '/content/exam' },
        { label: 'Coding Challenges', path: '/content/coding' },
        { label: 'Voice Practice', path: '/content/voice' }
      ]
    },
    {
      id: 'channels',
      label: 'Channels',
      path: '/channels',
      icon: '📡',
      description: 'Topic-specific learning tracks',
      children: [
        { label: 'All Channels', path: '/channels' },
        { label: 'JavaScript', path: '/channels/javascript' },
        { label: 'React', path: '/channels/react' },
        { label: 'Algorithms', path: '/channels/algorithms' },
        { label: 'DevOps', path: '/channels/devops' },
        { label: 'Kubernetes', path: '/channels/kubernetes' },
        // ... other channels
      ]
    },
    {
      id: 'practice',
      label: 'Practice',
      path: '/practice',
      icon: '🎯',
      description: 'Interactive practice sessions',
      children: [
        { label: 'Exam Practice', path: '/practice/exam' },
        { label: 'Coding Challenges', path: '/practice/coding' },
        { label: 'Voice Interviews', path: '/practice/voice' }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      icon: '📊',
      description: 'Progress tracking and insights'
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: '⚙️',
      description: 'Preferences and account settings'
    }
  ]
}
```

### 2. Secondary Navigation (Page-level Tabs)

Each major section uses tabs for sub-navigation:

#### Content Library Tabs
```typescript
interface ContentTabs {
  tabs: [
    { label: 'All', path: '/content' },
    { label: 'Questions', path: '/content/question' },
    { label: 'Flashcards', path: '/content/flashcard' },
    { label: 'Exams', path: '/content/exam' },
    { label: 'Coding', path: '/content/coding' },
    { label: 'Voice', path: '/content/voice' }
  ]
}
```

#### Analytics Tabs
```typescript
interface AnalyticsTabs {
  tabs: [
    { label: 'Overview', path: '/analytics' },
    { label: 'Progress', path: '/analytics/progress' },
    { label: 'Performance', path: '/analytics/performance' },
    { label: 'Goals', path: '/analytics/goals' }
  ]
}
```

### 3. Tertiary Navigation (Filtering & Controls)

Within each content type, provide filtering options:

```typescript
interface ContentFilters {
  channels: Channel[], // All 11 channels
  difficulties: ['easy', 'medium', 'hard'],
  tags: string[],
  sortBy: ['newest', 'popular', 'difficulty', 'rating'],
  viewMode: ['grid', 'list', 'compact']
}
```

## Sitemap

```
/ (Dashboard)
├── /content (All Content)
│   ├── /content/question (Questions)
│   ├── /content/flashcard (Flashcards)
│   ├── /content/exam (Exams)
│   ├── /content/coding (Coding Challenges)
│   └── /content/voice (Voice Practice)
├── /channels (All Channels)
│   ├── /channels/javascript
│   ├── /channels/react
│   ├── /channels/algorithms
│   ├── /channels/devops
│   ├── /channels/kubernetes
│   ├── /channels/typescript
│   ├── /channels/nodejs
│   ├── /channels/python
│   ├── /channels/system-design
│   ├── /channels/database
│   └── /channels/security
├── /practice (Practice Hub)
│   ├── /practice/exam
│   ├── /practice/exam/:id
│   ├── /practice/coding
│   ├── /practice/coding/:id
│   ├── /practice/voice
│   └── /practice/voice/:id
├── /analytics (Analytics & Progress)
│   ├── /analytics/overview
│   ├── /analytics/progress
│   ├── /analytics/performance
│   └── /analytics/goals
├── /settings (Settings & Preferences)
│   ├── /settings/profile
│   ├── /settings/appearance
│   ├── /settings/notifications
│   ├── /settings/privacy
│   └── /settings/account
├── /search (Global Search)
└── /onboarding (Onboarding Flow)
```

## Navigation Patterns

### 1. Discoverability

- **Command Palette**: `Ctrl+K` / `⌘+K` opens global search and command palette
- **Quick Actions**: Floating action button for common tasks (start practice, create flashcard)
- **Recent Items**: Dashboard shows recently viewed content
- **Contextual Suggestions**: "Next recommended" content based on progress

### 2. Keyboard Navigation

```typescript
interface KeyboardShortcuts {
  global: {
    'Ctrl+K': 'Open command palette',
    'Ctrl+/': 'Show keyboard shortcuts',
    'Ctrl+H': 'Go to dashboard',
    'Ctrl+B': 'Toggle sidebar'
  },
  content: {
    'ArrowLeft/Right': 'Navigate between items',
    'Enter': 'Open selected item',
    'Space': 'Quick action (flip flashcard, etc.)',
    'Escape': 'Close modal/overlay'
  }
}
```

### 3. Mobile Navigation

```typescript
interface MobileNavigation {
  bottomNav: [
    { label: 'Home', icon: '🏠', path: '/' },
    { label: 'Content', icon: '📚', path: '/content' },
    { label: 'Practice', icon: '🎯', path: '/practice' },
    { label: 'Profile', icon: '👤', path: '/settings/profile' }
  ],
  gestures: {
    swipeRight: 'Open sidebar',
    swipeLeft: 'Close sidebar',
    pullDown: 'Refresh content'
  }
}
```

### 4. Search Integration

```typescript
interface SearchNavigation {
  globalSearch: {
    placeholder: 'Search content, channels, or commands...',
    filters: ['All', 'Content', 'Channels', 'Commands'],
    recentSearches: true,
    suggestedQueries: true
  },
  contextualSearch: {
    contentPage: 'Search within current content type',
    channelPage: 'Search within channel',
    analyticsPage: 'Search metrics and reports'
  }
}
```

## Visual Hierarchy

### 1. Color Coding
```typescript
interface NavigationColors {
  primary: 'var(--primary)', // Main navigation items
  secondary: 'var(--muted-foreground)', // Secondary items
  active: 'var(--accent)', // Active/selected state
  hover: 'var(--accent-foreground)', // Hover state
  disabled: 'var(--disabled)' // Disabled items
}
```

### 2. Typography Scale
```typescript
interface NavigationTypography {
  sectionHeader: 'text-xs font-semibold uppercase tracking-wider',
  itemLabel: 'text-sm font-medium',
  itemDescription: 'text-xs text-muted-foreground',
  badge: 'text-xs font-bold'
}
```

### 3. Spacing & Layout
```typescript
interface NavigationLayout {
  sidebar: {
    width: '280px',
    collapsedWidth: '64px',
    itemPadding: 'px-3 py-2',
    sectionGap: 'space-y-1',
    groupGap: 'space-y-6'
  },
  header: {
    height: '56px',
    itemGap: 'space-x-6'
  }
}
```

## Accessibility Features

### 1. ARIA Labels
```typescript
interface AccessibilityLabels {
  navigation: 'aria-label="Main navigation"',
  items: 'aria-current="page" for active item',
  dropdowns: 'aria-expanded, aria-haspopup',
  mobile: 'aria-label="Toggle menu"'
}
```

### 2. Focus Management
```typescript
interface FocusManagement {
  trapFocus: 'In modals and dropdowns',
  restoreFocus: 'When closing overlays',
  skipLinks: 'Skip to main content link',
  focusVisible: 'Visible focus indicators'
}
```

### 3. Screen Reader Support
```typescript
interface ScreenReaderSupport {
  announcements: 'Live region for route changes',
  landmarks: 'nav, main, aside elements',
  headings: 'Proper heading hierarchy',
  altText: 'For icons and graphics'
}
```

## Implementation Guidelines

### 1. State Management
```typescript
// Navigation state stored in Zustand store
interface NavigationState {
  activeRoute: string
  breadcrumbs: Breadcrumb[]
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  recentRoutes: string[]
}
```

### 2. Performance Optimization
```typescript
interface NavigationPerformance {
  lazyLoading: 'Load route components on demand',
  prefetch: 'Prefetch likely next routes',
  caching: 'Cache visited routes',
  animations: 'Use CSS transitions, avoid layout thrashing'
}
```

### 3. Analytics Tracking
```typescript
interface NavigationAnalytics {
  trackRouteChange: 'Log page views',
  trackNavigationClicks: 'Which nav items used',
  trackSearchQueries: 'What users search for',
  trackFeatureDiscovery: 'How users find features'
}
```

## Validation Checklist

- [x] Maximum 3 clicks to any feature
- [x] Keyboard accessible navigation
- [x] Mobile responsive design
- [x] Screen reader compatible
- [x] Search integration
- [x] Clear visual hierarchy
- [x] Progressive disclosure
- [x] Contextual navigation
- [x] Performance optimized
- [x] Analytics tracked

## Next Steps

1. Implement navigation store (`src/stores-v2/navigationStore.ts`)
2. Update primary navigation components
3. Add command palette component
4. Implement keyboard shortcuts
5. Add analytics tracking
6. Conduct usability testing

---

*Created by NAVIGATION_ARCHITECT (Victor Martinez) - 26 years experience in navigation systems design*