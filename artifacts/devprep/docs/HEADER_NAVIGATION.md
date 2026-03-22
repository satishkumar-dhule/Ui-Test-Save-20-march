# Header Navigation System

## Overview

A feature-rich, accessible header component with user utilities and quick access to all features.

## Components

### Header Component
**Location**: `src/components/navigation/Header.tsx`

The main header component that provides:
- Sticky positioning with backdrop blur effect
- Responsive design (mobile hamburger menu)
- Global search integration (⌘K shortcut)
- Quick action buttons
- Notification bell with badge
- User avatar and dropdown menu
- Theme toggle

#### Props

```typescript
interface HeaderProps {
  onSearchOpen: () => void
  onCreateNew?: () => void
  notificationCount?: number
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}
```

#### Features

1. **Sticky Header**: Stays fixed at top with backdrop blur effect
2. **Scroll Detection**: Adds shadow when scrolled
3. **Keyboard Shortcuts**: 
   - `⌘K` / `Ctrl+K`: Open search
   - `Escape`: Close mobile menu
4. **Mobile Responsive**: Hamburger menu for smaller screens
5. **Accessibility**: ARIA labels and keyboard navigation support

### UserMenu Component
**Location**: `src/components/navigation/UserMenu.tsx`

User dropdown menu with profile, settings, and logout options.

#### Features

- User avatar with initials fallback
- Profile and settings links
- Theme switching submenu
- Logout functionality
- Keyboard shortcuts for each action
- Accessible dropdown menu

### QuickActions Component
**Location**: `src/components/navigation/QuickActions.tsx`

Dropdown menu for creating new content types.

#### Features

- Multiple content type options (Question, Flashcard, Code Challenge, Exam, Voice Note, Writing Exercise)
- Keyboard shortcuts for each action
- Icon-based navigation
- Responsive design

## Usage

```tsx
import { Header } from '@/components/navigation'

function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  
  return (
    <>
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onCreateNew={() => console.log('Create new')}
        notificationCount={5}
        user={{
          name: 'John Doe',
          email: 'john@example.com',
          avatar: '/avatar.jpg'
        }}
      />
      
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
```

## Styling

The header uses the existing design system:
- **CSS Variables**: Uses theme-based color system
- **Tailwind CSS**: Utility-first styling approach
- **Glass Morphism**: Backdrop blur effects
- **Responsive**: Mobile-first design with breakpoints

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Escape to close menus
- Arrow keys for dropdown navigation

### ARIA Attributes
- `aria-label` on icon buttons
- `aria-expanded` on dropdown triggers
- `aria-haspopup` on menu triggers
- Proper focus management

### Screen Reader Support
- Semantic HTML structure
- Descriptive labels for all interactive elements
- Proper heading hierarchy

## Customization

### Theme Support
The header supports multiple themes via the `useTheme` hook:
- Light mode
- Dark mode  
- High contrast mode
- Blue light mode
- Ocean theme
- Forest theme

### User Data
User information is passed via props. For authentication integration, use the `useAuth` hook from `@/hooks-v2/useUser`.

### Notifications
Notification count is passed as a prop. For real-time notifications, integrate with your notification system.

## Integration Guide

1. **Add to Layout**: Include Header in your main layout component
2. **Search Modal**: Connect the search button to your search modal
3. **User Data**: Provide user data from your auth system
4. **Notifications**: Set up notification polling or websocket connection
5. **Quick Actions**: Connect creation buttons to your content creation flow

## Performance Considerations

- **Lazy Loading**: User avatar images are lazy loaded
- **Debounced Scroll**: Scroll handler is optimized
- **Memoization**: Components use React.memo where appropriate
- **Bundle Size**: Uses tree-shaking for icons

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers

## Testing

### Unit Tests
```bash
npm run test -- Header
```

### Accessibility Tests
```bash
npm run test -- --testNamePattern="accessibility"
```

### Visual Regression
```bash
npm run test:ui
```

## Future Enhancements

1. **Command Palette**: Global command search (⌘K)
2. **Notifications Panel**: Expandable notification dropdown
3. **User Settings Panel**: Quick settings adjustment
4. **Keyboard Shortcuts Help**: Help modal for shortcuts
5. **Breadcrumbs**: Dynamic breadcrumb navigation
6. **Progress Indicators**: Loading states in header
7. **Offline Indicator**: Network status display
8. **Language Selector**: Multi-language support

## Troubleshooting

### Header not sticky
Check CSS for `position: sticky` and ensure parent container has proper overflow settings.

### Theme not switching
Verify `useTheme` hook is properly imported and theme provider is wrapping the app.

### Mobile menu not opening
Check z-index conflicts and ensure mobile breakpoint is correct (default: 768px).

### Search shortcut not working
Verify event listener is attached and not being prevented by other handlers.