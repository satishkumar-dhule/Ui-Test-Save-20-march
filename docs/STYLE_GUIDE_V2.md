# Style Guide V2

> **Purpose:** Coding standards, conventions, and best practices for DevPrep V2  
> **Date:** March 22, 2026  
> **Version:** 2.0.0

## Overview

This style guide defines the coding standards and conventions for the DevPrep V2 codebase. Following these guidelines ensures consistency, maintainability, and high code quality across the project.

## Code Organization

### Directory Structure

```
src/
├── app/                    # App-level configuration
│   ├── providers/          # Context providers
│   ├── routes/             # Route definitions
│   └── config/             # App configuration
├── components/             # UI components
│   ├── atoms-v2/           # Basic building blocks
│   ├── molecules/          # Simple compositions
│   └── organisms/          # Complex UI patterns
├── features/               # Domain-specific features
│   ├── content/            # Content display
│   ├── channels/           # Channel management
│   ├── search/             # Search functionality
│   └── analytics/          # Analytics tracking
├── lib/                    # Shared utilities
│   ├── api/                # API client
│   ├── hooks/              # Generic hooks
│   ├── utils/              # Utility functions
│   └── constants/          # Shared constants
├── styles/                 # Styling system
│   ├── themes/             # Theme configurations
│   ├── tokens/             # Design tokens
│   └── utilities/          # Utility classes
└── utils/                  # General utilities
```

### File Naming

#### Components

```
Button/index.tsx          # Component file
Button/__tests__/Button.test.tsx  # Test file
Button/Button.stories.tsx         # Storybook story (optional)
Button/types.ts                   # Type definitions (optional)
```

#### Utilities

```
cn.ts                     # Utility function with descriptive name
format-date.ts            # Utility function with kebab-case
```

#### Features

```
content/
├── components/           # Feature-specific components
├── hooks/                # Feature-specific hooks
├── services/             # Feature-specific services
├── types.ts              # Feature-specific types
└── index.ts              # Feature export
```

## TypeScript Standards

### Type Definitions

```typescript
// ✅ Good: Explicit interface with descriptive names
interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ❌ Bad: Using `any` type
const user: any = { ... };

// ✅ Good: Using proper types
const user: UserProfile = { ... };
```

### Function Types

```typescript
// ✅ Good: Function type with clear parameter and return types
type ContentFilter = (content: ContentItem[]) => ContentItem[];

// ✅ Good: Async function with proper return type
async function fetchContent(id: string): Promise<ContentItem> {
  const response = await api.get(`/content/${id}`);
  return response.data;
}

// ❌ Bad: Missing return type
async function fetchContent(id: string) {
  // ...
}
```

### Generic Types

```typescript
// ✅ Good: Generic type with constraints
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Usage
const response: PaginatedResponse<ContentItem> = await fetchContent();
```

### Union Types

```typescript
// ✅ Good: Union type for specific values
type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

// ✅ Good: Discriminated union
type ContentItem =
  | { type: "question"; data: QuestionData }
  | { type: "flashcard"; data: FlashcardData }
  | { type: "exam"; data: ExamData };
```

## React Components

### Component Structure

```typescript
// ✅ Good: Component with clear structure
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { buttonVariants } from './Button.styles';
import type { ButtonProps } from './Button.types';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
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

### Props Interface

```typescript
// ✅ Good: Props interface with clear naming
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

// ✅ Good: Extending HTML attributes for flexibility
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline";
  interactive?: boolean;
}
```

### Component Composition

```typescript
// ✅ Good: Composition pattern
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms-v2/Card';
import { Button } from '@/components/atoms-v2/Button';
import { Input } from '@/components/atoms-v2/Input';

export function LoginForm({ onSubmit }: LoginFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            required
          />
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Hooks

### Custom Hook Structure

```typescript
// ✅ Good: Custom hook with clear return type
import { useState, useEffect } from "react";

interface UseLocalStorageResult<T> {
  value: T;
  setValue: (value: T) => void;
  removeValue: () => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): UseLocalStorageResult<T> {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return { value, setValue, removeValue };
}
```

### Hook Naming

```typescript
// ✅ Good: Hook names start with "use"
useTheme();
useContent();
useLocalStorage();
useMediaQuery();

// ❌ Bad: Hook names without "use" prefix
getTheme();
fetchContent();
```

## State Management

### Zustand Store Structure

```typescript
// ✅ Good: Zustand store with TypeScript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContentState {
  items: ContentItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: ContentItem) => void;
  removeItem: (id: string) => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const items = await contentApi.getAll();
          set({ items, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "devprep-content",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
```

## Styling

### CSS Variables

```css
/* ✅ Good: Organized CSS variables */
:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-secondary: #14b8a6;
  --color-accent: #f97316;

  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Background and foreground */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Border and input */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;

  /* Radius */
  --radius: 0.5rem;
}

/* Dark theme */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

### Tailwind CSS Classes

```typescript
// ✅ Good: Semantic class names
import { cn } from '@/lib/utils/cn';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
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

// ✅ Good: Using class variance authority
function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## API Integration

### API Client Structure

```typescript
// ✅ Good: API client with proper error handling
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export { api };
```

### Service Layer

```typescript
// ✅ Good: Service layer with typed responses
import { api } from "@/lib/api/client";

interface ContentResponse {
  data: ContentItem[];
  total: number;
  page: number;
  limit: number;
}

export const contentService = {
  getAll: async (page = 1, limit = 10): Promise<ContentResponse> => {
    const response = await api.get("/content", { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<ContentItem> => {
    const response = await api.get(`/content/${id}`);
    return response.data;
  },

  create: async (data: CreateContentRequest): Promise<ContentItem> => {
    const response = await api.post("/content", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateContentRequest,
  ): Promise<ContentItem> => {
    const response = await api.put(`/content/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/content/${id}`);
  },
};
```

## Testing

### Test File Structure

```typescript
// ✅ Good: Test file with clear structure
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders with variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      // Add assertions
    });
  });

  describe('interactions', () => {
    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper aria attributes', () => {
      render(<Button disabled>Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });
  });
});
```

## Documentation

### Code Comments

```typescript
// ✅ Good: Descriptive comments for complex logic
/**
 * Custom hook for debouncing value changes
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### JSDoc

````typescript
// ✅ Good: JSDoc for public APIs
/**
 * Creates a lazy-loaded component with suspense fallback
 * @param importFunc - Dynamic import function
 * @param options - Lazy load options
 * @returns Lazy-loaded component
 *
 * @example
 * ```tsx
 * const LazyComponent = createLazyComponent(
 *   () => import('./HeavyComponent'),
 *   { fallback: <div>Loading...</div> }
 * );
 * ```
 */
export function createLazyComponent<T>(
  importFunc: () => Promise<{ default: T }>,
  options?: LazyLoadOptions,
): React.LazyExoticComponent<T> {
  // implementation
}
````

## Accessibility

### ARIA Attributes

```typescript
// ✅ Good: Proper ARIA attributes
function Modal({ open, onClose, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">Modal Title</h2>
      <p id="modal-description">Modal description</p>
      {children}
    </div>
  );
}
```

### Focus Management

```typescript
// ✅ Good: Focus trap for modals
import { useEffect, useRef } from 'react';

function Modal({ open, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Handle tab key for focus trap
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            (lastElement as HTMLElement).focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            (firstElement as HTMLElement).focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [open]);

  return <div ref={modalRef}>Modal content</div>;
}
```

## Performance

### Code Splitting

```typescript
// ✅ Good: Route-based code splitting
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ChannelPage = lazy(() => import('@/pages/ChannelPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const StatsPage = lazy(() => import('@/pages/StatsPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/channel/:id" element={<ChannelPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```typescript
// ✅ Good: Memoization for expensive components
import { memo, useMemo } from 'react';

const ExpensiveList = memo(function ExpensiveList({ items }) {
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      formattedDate: formatDate(item.date),
    }));
  }, [items]);

  return (
    <ul>
      {processedItems.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
});
```

## Git Conventions

### Commit Messages

```bash
# ✅ Good: Conventional commit format
feat: add new content filtering feature
fix: resolve login page crash on invalid credentials
docs: update component library documentation
style: format code with prettier
refactor: extract content logic into custom hook
test: add unit tests for Button component
chore: update dependencies

# ❌ Bad: Unclear commit messages
fixed stuff
updated code
changes
```

### Branch Naming

```bash
# ✅ Good: Descriptive branch names
feature/content-filtering
fix/login-page-crash
docs/component-library
refactor/custom-hooks
test/button-component
```

## Code Review Checklist

### Before Submitting

- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Accessibility checks pass
- [ ] Performance impact considered
- [ ] Documentation updated
- [ ] Tests added for new features
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Responsive design verified
- [ ] Cross-browser testing done

### During Review

- [ ] Code follows style guide
- [ ] Types are properly defined
- [ ] Components are accessible
- [ ] Error boundaries implemented
- [ ] Loading states present
- [ ] Performance optimized
- [ ] Security considerations addressed
- [ ] Test coverage adequate

## Tools and Configuration

### ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      react: react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Husky Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

## Summary

Following this style guide ensures:

1. **Consistency**: Uniform code style across the project
2. **Maintainability**: Clear structure and naming conventions
3. **Quality**: High standards for testing and documentation
4. **Performance**: Optimized React patterns and lazy loading
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Type Safety**: Strict TypeScript usage throughout

Regular reviews and updates to this guide keep our codebase modern and maintainable.
