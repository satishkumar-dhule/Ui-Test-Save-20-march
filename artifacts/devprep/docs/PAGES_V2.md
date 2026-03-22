# Pages V2 - New Layout System

## Overview

The Pages V2 system introduces a completely redesigned page layout architecture with mobile-first responsive design, clean modern layouts, and proper content hierarchy. All pages preserve existing API integration while providing an improved user experience.

## Directory Structure

```
src/
├── pages-v2/                    # New page templates
│   ├── HomePage.tsx            # Main dashboard page
│   ├── ContentPage.tsx         # Content browsing page
│   ├── OnboardingPage.tsx      # User onboarding flow
│   ├── ExamPage.tsx            # Mock exam interface
│   ├── CodingPage.tsx          # Coding challenge interface
│   ├── VoicePage.tsx           # Voice practice interface
│   └── index.ts                # Barrel export
├── components/
│   └── layouts/                # Reusable layout components
│       ├── Layout.tsx          # Base layout with header/footer
│       ├── DashboardLayout.tsx # Dashboard-style layout
│       ├── ContentLayout.tsx   # Content browsing layout
│       └── index.ts            # Barrel export
```

## Layout Components

### 1. Layout (Base)
The foundational layout component that provides:
- Sticky header with navigation
- Main content area
- Footer with links
- Responsive container

**Props:**
- `children`: ReactNode
- `title?`: string - Page title
- `description?`: string - Page description
- `showSidebar?`: boolean - Toggle sidebar visibility
- `sidebarContent?`: ReactNode - Sidebar content
- `headerActions?`: ReactNode - Header action buttons

### 2. DashboardLayout
Extends Layout for dashboard-style pages:
- Header with title/description
- Optional sidebar
- Action buttons in header
- Spaced content area

**Props:**
- `children`: ReactNode
- `title?`: string
- `description?`: string
- `sidebar?`: ReactNode - Sidebar content
- `actions?`: ReactNode - Header actions

### 3. ContentLayout
Specialized layout for content browsing:
- Breadcrumb navigation
- Sidebar with filters
- Content area with proper typography

**Props:**
- `children`: ReactNode
- `title?`: string
- `description?`: string
- `breadcrumbs?`: Array<{ label: string; href?: string }>
- `actions?`: ReactNode
- `sidebar?`: ReactNode
- `showSidebar?`: boolean (default: true)

## Page Templates

### 1. HomePage
**Route:** `/`
**Layout:** DashboardLayout
**Features:**
- Channel sidebar with loading states
- Content list with error handling
- API integration with React Query
- Responsive grid layout

### 2. ContentPage
**Route:** `/content`
**Layout:** ContentLayout
**Features:**
- Content type filter (questions, flashcards, exams, etc.)
- Channel filter
- Statistics sidebar
- Card-based content display
- Loading and error states

### 3. OnboardingPage
**Route:** `/onboarding`
**Layout:** Layout (centered)
**Features:**
- Multi-step wizard (welcome → profile → goals → channels → complete)
- Progress indicator
- Form inputs with validation
- Channel selection cards
- Navigation controls

### 4. ExamPage
**Route:** `/exam`
**Layout:** Layout (focused)
**Features:**
- 30-minute timer
- Question navigation
- Progress bar
- Answer selection
- Results review with score calculation
- Explanation display

### 5. CodingPage
**Route:** `/coding`
**Layout:** Layout (split view)
**Features:**
- Challenge list sidebar
- Code editor interface
- Run/Submit functionality
- Examples and hints tabs
- Challenge information panel

### 6. VoicePage
**Route:** `/voice`
**Layout:** Layout (split view)
**Features:**
- Practice prompt list
- Recording interface with timer
- Audio playback
- AI feedback with scores
- Improvement suggestions
- Speaking tips

## API Integration

All pages maintain existing API integration through:
- `@tanstack/react-query` for data fetching
- Existing API endpoints from `@/lib/api/endpoints`
- Proper loading, error, and empty states
- Type-safe data handling

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Collapsible sidebars on mobile
- Touch-friendly interactions
- Optimized spacing and typography

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader friendly

## Migration Guide

To migrate from old pages to new pages:

1. **Update imports:**
```typescript
// Before
import { HomePage } from '@/components/pages/Home'

// After
import { HomePage } from '@/pages-v2'
```

2. **Update routes in App.tsx:**
```typescript
import { HomePage, ContentPage, OnboardingPage } from '@/pages-v2'

// In your router
<Route path="/" component={HomePage} />
<Route path="/content" component={ContentPage} />
<Route path="/onboarding" component={OnboardingPage} />
```

3. **Preserve existing functionality:**
- All API hooks remain unchanged
- Data transformation logic preserved
- Error handling maintained

## Development

### Adding a New Page

1. Create page component in `src/pages-v2/`
2. Choose appropriate layout component
3. Implement data fetching with React Query
4. Add to barrel export in `src/pages-v2/index.ts`
5. Update routing in `App.tsx`
6. Update this documentation

### Best Practices

1. **Use TypeScript** for type safety
2. **Implement loading states** for all async operations
3. **Handle errors gracefully** with user-friendly messages
4. **Maintain accessibility** throughout
5. **Test responsive behavior** across breakpoints
6. **Follow existing patterns** for consistency

## Performance Considerations

- Lazy loading for page components
- Optimized bundle splitting
- Efficient data fetching with React Query
- Minimal re-renders with proper state management
- Image optimization for assets

## Component Dependencies

The new pages are designed to work with existing components where available, and use standard HTML elements where specific components don't exist yet. Here's a breakdown:

### Available Components Used:
- `Layout`, `DashboardLayout`, `ContentLayout` - Custom layouts
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - From molecules
- `Badge` - From atoms
- `ChannelList`, `ContentList` - From existing organisms

### HTML Elements Used (where components don't exist):
- Form inputs: `input`, `select`, `textarea`
- Buttons: `button` with Tailwind classes
- Progress indicators: `div` with width/height styling
- Tabs: Custom button-based tab interface
- Navigation: `nav`, `a` elements

### Future Component Additions:
To fully complete the component system, these should be added:
- `Button` component (currently using HTML buttons with Tailwind)
- `Input` and `Label` components
- `Tabs` component
- `Progress` component
- `Dialog` and `Modal` components

## Future Enhancements

- [ ] Dark mode support
- [ ] Animated transitions
- [ ] Advanced filtering options
- [ ] Offline support
- [ ] Progressive Web App features
- [ ] Advanced analytics integration
- [ ] Add missing UI components (Button, Input, Tabs, Progress)
- [ ] Implement theme switching
- [ ] Add accessibility improvements with ARIA attributes
- [ ] Create storybook for component documentation