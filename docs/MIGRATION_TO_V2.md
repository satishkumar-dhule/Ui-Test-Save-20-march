# Migration Guide: V1 to V2

> **Purpose:** Step-by-step guide for migrating from DevPrep V1 to V2  
> **Date:** March 22, 2026  
> **Version:** 2.0.0

## Overview

DevPrep V2 represents a complete architectural redesign with modern React patterns, improved performance, and enhanced accessibility. This guide will help you migrate your codebase step by step.

## Prerequisites

- Node.js 18+
- npm 9+
- Basic understanding of React 19
- Familiarity with TypeScript

## Migration Steps

### Phase 1: Setup and Preparation

#### 1.1 Backup Your Current Code

```bash
# Create a backup branch
git checkout -b v1-backup
git push origin v1-backup

# Create migration branch
git checkout -b migration-to-v2
```

#### 1.2 Install New Dependencies

```bash
# Remove old dependencies
npm uninstall @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs

# Install new dependencies
npm install react@19 react-dom@19 @tanstack/react-query zustand tailwindcss@4
npm install -D @types/react @types/react-dom typescript
```

#### 1.3 Update TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Phase 2: Component Migration

#### 2.1 Identify V1 Components to Migrate

```bash
# List current components
find src/components -name "*.tsx" | head -20
```

#### 2.2 Create New Component Structure

```bash
# Create new directory structure
mkdir -p src/components/atoms-v2
mkdir -p src/components/molecules
mkdir -p src/components/organisms
```

#### 2.3 Migrate Button Component

**V1 Button** (`src/components/atoms/Button.tsx`):
```tsx
// Old V1 implementation
export const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**V2 Button** (`src/components/atoms-v2/Button/index.tsx`):
```tsx
// New V2 implementation with TypeScript and variants
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-error text-error-foreground hover:bg-error/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, asChild = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### 2.4 Migration Pattern

For each component:

1. **Copy the V1 component** to a temporary file
2. **Create V2 component** with proper TypeScript types
3. **Add accessibility attributes** (ARIA, roles, etc.)
4. **Add theme support** using CSS variables
5. **Write tests** for the new component
6. **Update imports** in consuming components

### Phase 3: Styling System Migration

#### 3.1 Remove Glass Morphism

```bash
# Find and remove glass morphism classes
grep -r "glass" src/components --include="*.tsx" --include="*.ts" | head -20

# Replace glass classes with semantic alternatives
# glass-bg → bg-background
# glass-border → border-border
# glass-shadow → shadow-md
```

#### 3.2 Update CSS Variables

**V1** (Tailwind config):
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#14b8a6',
      }
    }
  }
}
```

**V2** (CSS variables):
```css
/* src/styles/new-variables.css */
:root {
  --color-primary: #6366f1;
  --color-secondary: #14b8a6;
  --color-accent: #f97316;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}
```

#### 3.3 Update Component Styling

**V1** (Direct Tailwind):
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
  {/* content */}
</div>
```

**V2** (Semantic classes):
```tsx
<div className="bg-card rounded-lg shadow-md p-6 border border-border">
  {/* content */}
</div>
```

### Phase 4: State Management Migration

#### 4.1 Replace Context with Zustand

**V1** (Context API):
```tsx
// contexts/ThemeContext.tsx
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

**V2** (Zustand):
```tsx
// stores/theme.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'light' | 'dark' | 'high-contrast';
  setTheme: (theme: ThemeStore['theme']) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      }))
    }),
    { name: 'devprep-theme' }
  )
);
```

#### 4.2 Update Data Fetching

**V1** (SWR/Custom hooks):
```tsx
// hooks/useContent.ts
export const useContent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);
  
  return { data, loading };
};
```

**V2** (TanStack Query):
```tsx
// features/content/hooks/useContent.ts
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../services/contentApi';

export const useContent = () => {
  return useQuery({
    queryKey: ['content'],
    queryFn: () => contentApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};
```

### Phase 5: Routing Migration

#### 5.1 Update Router

**V1** (React Router):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/channel/:id" element={<Channel />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**V2** (Wouter):
```tsx
import { Router, Route, Switch } from 'wouter';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/channel/:id" component={Channel} />
      </Switch>
    </Router>
  );
}
```

### Phase 6: Testing Migration

#### 6.1 Update Test Setup

```bash
# Install new testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest jsdom
```

#### 6.2 Update Test Files

**V1** (Jest):
```tsx
// __tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';

test('renders button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

**V2** (Vitest):
```tsx
// src/components/atoms-v2/Button/__tests__/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../index';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Phase 7: Build and Deployment

#### 7.1 Update Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['wouter'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

#### 7.2 Update Package Scripts

```json
{
  "scripts": {
    "dev": "vite --config vite.config.ts",
    "build": "vite build --config vite.config.ts",
    "preview": "vite preview",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint src --ext ts,tsx",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

## Migration Checklist

### Phase 1: Preparation
- [ ] Create backup branch
- [ ] Update package.json dependencies
- [ ] Update TypeScript configuration
- [ ] Remove unused dependencies

### Phase 2: Components
- [ ] Create new component directory structure
- [ ] Migrate Button component
- [ ] Migrate Input component
- [ ] Migrate Card component
- [ ] Migrate Modal component
- [ ] Migrate other components
- [ ] Add accessibility attributes
- [ ] Add theme support

### Phase 3: Styling
- [ ] Remove glass morphism classes
- [ ] Update CSS variables
- [ ] Update component styling
- [ ] Create theme files
- [ ] Add theme switching

### Phase 4: State Management
- [ ] Replace Context API with Zustand
- [ ] Update data fetching hooks
- [ ] Add TanStack Query
- [ ] Update local storage usage

### Phase 5: Routing
- [ ] Replace React Router with Wouter
- [ ] Update route definitions
- [ ] Add route guards
- [ ] Update navigation components

### Phase 6: Testing
- [ ] Update test setup to Vitest
- [ ] Migrate existing tests
- [ ] Add new tests for V2 components
- [ ] Update test utilities

### Phase 7: Build & Deploy
- [ ] Update Vite configuration
- [ ] Add code splitting
- [ ] Optimize bundle size
- [ ] Test production build
- [ ] Deploy to staging

## Common Issues and Solutions

### Issue 1: TypeScript Errors

**Problem:** `Cannot find module 'react' or its corresponding type declarations`

**Solution:**
```bash
npm install -D @types/react @types/react-dom
```

### Issue 2: Theme Not Working

**Problem:** CSS variables not applying

**Solution:**
Check that you've imported the theme CSS:
```tsx
import '@/styles/new-themes.css';
```

### Issue 3: State Not Persisting

**Problem:** LocalStorage not working

**Solution:**
Ensure you're using Zustand persist middleware:
```tsx
import { persist } from 'zustand/middleware';
```

### Issue 4: Build Size Too Large

**Problem:** Bundle size exceeds 200KB

**Solution:**
Check manual chunks in Vite config:
```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],
  // Add more chunks as needed
}
```

## Verification Steps

After migration, verify:

1. **Application runs**: `npm run dev`
2. **Types compile**: `npm run typecheck`
3. **Linting passes**: `npm run lint`
4. **Tests pass**: `npm test`
5. **Build succeeds**: `npm run build`
6. **Performance**: Check Lighthouse score (target: 90+)

## Rollback Plan

If migration fails:

```bash
# Switch back to v1
git checkout v1-backup

# Or revert changes
git reset --hard HEAD~<number-of-commits>
```

## Timeline

- **Week 1-2**: Phase 1-2 (Preparation, Components)
- **Week 3**: Phase 3 (Styling)
- **Week 4**: Phase 4-5 (State, Routing)
- **Week 5**: Phase 6 (Testing)
- **Week 6**: Phase 7 (Build & Deploy)

## Support

For migration issues:

1. Check [Component Library V2](COMPONENTS_V2.md)
2. Review [Architecture V2](../artifacts/devprep/docs/ARCHITECTURE_V2.md)
3. See [Performance V2](PERFORMANCE_V2.md) for optimization tips

## Next Steps

After migration:

1. Review new component documentation
2. Explore theming system
3. Implement new features
4. Optimize performance
5. Add accessibility improvements