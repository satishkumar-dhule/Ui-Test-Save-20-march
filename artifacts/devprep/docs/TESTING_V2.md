# Testing Strategy v2.0

## Overview

Comprehensive testing strategy for the DevPrep UI redesign, implementing modern testing practices with Vitest, React Testing Library, and Playwright for end-to-end testing.

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation** - Focus on what users see and interact with
2. **Accessibility First** - All tests should verify accessibility standards
3. **Performance Conscious** - Tests should run quickly and efficiently
4. **Maintainable** - Tests should be easy to understand and update
5. **Comprehensive Coverage** - Target 80%+ code coverage across all metrics

### Testing Pyramid

```
          E2E Tests (10%)
         /            \
      Integration (30%)
      /                \
  Unit Tests (60%)
```

## Test Categories

### 1. Unit Tests (`src/__tests__/utils/`)

**Purpose:** Test individual utilities, functions, and hooks in isolation

**Coverage:**
- Utility functions (`cn`, `formatDate`, `parseContent`)
- Custom hooks (`useContent`, `useTheme`, `useWebSocket`)
- State management functions
- API client utilities
- Validation helpers

**Example:**
```typescript
describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });
});
```

### 2. Component Tests (`src/__tests__/components/`)

**Purpose:** Test React components in isolation with user interactions

**Coverage:**
- Component rendering
- Props handling
- User interactions (click, input, hover)
- Accessibility (ARIA, keyboard navigation)
- Conditional rendering
- Event handlers

**Example:**
```typescript
describe("Button Component", () => {
  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### 3. Integration Tests (`src/__tests__/integration/`)

**Purpose:** Test how components work together and with external systems

**Coverage:**
- Page-level interactions
- API integration
- State management integration
- Form submissions
- Multi-step workflows
- Error boundaries

**Example:**
```typescript
describe("Content Page Integration", () => {
  it("loads and displays content list", async () => {
    mockApiSuccess(mockContentData);
    render(<ContentPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Content loaded")).toBeInTheDocument();
    });
  });
});
```

### 4. E2E Tests (`e2e/`)

**Purpose:** Test complete user journeys in real browser environment

**Coverage:**
- Critical user paths
- Cross-browser compatibility
- Responsive design
- Performance metrics
- Real API interactions

**Example:**
```typescript
test("user can search and filter content", async ({ page }) => {
  await page.goto("/");
  await page.fill("[data-testid=search-input]", "javascript");
  await page.click("[data-testid=filter-button]");
  
  await expect(page.locator(".content-card")).toHaveCount(3);
});
```

## Test Infrastructure

### Vitest Configuration

**File:** `vitest.config.ts`

**Key Features:**
- **Environment:** jsdom for DOM simulation
- **Coverage:** V8 provider with 80% threshold
- **Setup:** Custom setup file for mocks and utilities
- **Performance:** Thread pool for parallel execution
- **Mocking:** Built-in module mocking

### Test Utilities (`src/__tests__/utils/test-utils.tsx`)

**Includes:**
- Custom render with providers (QueryClient, Theme, Router)
- Mock data generators for all content types
- Accessibility testing helpers
- Performance measurement utilities
- WebSocket mocks
- LocalStorage mocks
- Keyboard event helpers

### Mock Strategy

**Automatic Mocks:**
- `wouter` - Routing library
- `react-router-dom` - Alternative routing
- External API services
- WebSocket connections

**Manual Mocks:**
- Store modules (content, filter, theme)
- API service modules
- Browser APIs (IntersectionObserver, ResizeObserver)

## Test Scripts

### Available Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- Button.test.tsx

# Run integration tests
npm run test:integration

# Run E2E tests
npm run e2e

# Run E2E with UI
npm run e2e:ui
```

### CI/CD Integration

```yaml
# GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v3
```

## Accessibility Testing

### WCAG 2.1 AA Compliance

**Automated Checks:**
- Color contrast verification
- ARIA attribute validation
- Keyboard navigation testing
- Screen reader compatibility
- Focus management

**Manual Testing:**
- Keyboard-only navigation
- Screen reader testing
- High contrast mode
- Reduced motion preferences

### Accessibility Test Helpers

```typescript
// Check if element is focusable
expect(a11y.isFocusable(button)).toBe(true);

// Check ARIA attributes
expect(element).toHaveAttribute("aria-label");

// Check keyboard navigation
await userEvent.tab();
expect(document.activeElement).toBe(button);
```

## Performance Testing

### Metrics to Track

1. **Render Time** - Component mount/unmount performance
2. **Re-render Count** - Unnecessary re-renders
3. **Memory Usage** - Memory leak detection
4. **Bundle Size** - Impact on bundle size
5. **Lighthouse Scores** - Overall performance metrics

### Performance Test Helpers

```typescript
// Measure render time
const time = await perf.measureRenderTime(() => {
  render(<Component />);
});
expect(time).toBeLessThan(performanceThresholds.componentRender);
```

## Coverage Targets

### Minimum Requirements

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 80% | - |
| Branches | 80% | - |
| Functions | 80% | - |
| Lines | 80% | - |

### Coverage Exclusions

**Files excluded from coverage:**
- Entry points (`main.tsx`)
- Type definitions (`*.d.ts`)
- Configuration files (`*.config.*`)
- Index files (`index.ts`)
- Test files (`__tests__/**`)

## Test Organization

### Directory Structure

```
src/__tests__/
├── utils/           # Utility function tests
├── components/      # Component tests
├── integration/     # Integration tests
├── mocks/          # Mock modules
└── setup.ts        # Test setup
```

### Naming Conventions

- **Test Files:** `*.test.tsx` or `*.spec.tsx`
- **Test Suites:** `describe("Component Name", ...)`
- **Test Cases:** `it("should do something", ...)`
- **Mock Files:** `mock*.ts` or `*.mock.ts`

## Writing Tests

### Best Practices

1. **Use meaningful test descriptions**
   ```typescript
   // Bad
   it("works", () => {});
   
   // Good
   it("displays error message when API fails", () => {});
   ```

2. **Test one thing per test**
   ```typescript
   // Bad
   it("tests multiple things", () => {
     // Test rendering, clicking, and state
   });
   
   // Good
   it("renders correctly", () => {});
   it("handles click events", () => {});
   it("updates state on interaction", () => {});
   ```

3. **Use user-centric queries**
   ```typescript
   // Bad
   expect(container.querySelector(".button")).toBeInTheDocument();
   
   // Good
   expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
   ```

4. **Clean up after tests**
   ```typescript
   afterEach(() => {
     cleanup();
     vi.clearAllMocks();
   });
   ```

5. **Use async/await for async operations**
   ```typescript
   it("loads data", async () => {
     render(<Component />);
     await waitFor(() => {
       expect(screen.getByText("Loaded")).toBeInTheDocument();
     });
   });
   ```

### Common Patterns

#### Testing Forms
```typescript
it("submits form with correct data", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  render(<Form onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText("Name"), "John");
  await user.type(screen.getByLabelText("Email"), "john@example.com");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: "John",
    email: "john@example.com"
  });
});
```

#### Testing Async Components
```typescript
it("shows loading state then content", async () => {
  render(<AsyncComponent />);
  
  expect(screen.getByTestId("loading")).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
  
  expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
});
```

#### Testing Error States
```typescript
it("displays error message on failure", async () => {
  mockApiError();
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText("Error loading data")).toBeInTheDocument();
  });
});
```

## Debugging Tests

### Common Issues

1. **Act warning**
   ```typescript
   // Wrap state updates in act()
   await act(async () => {
     fireEvent.click(button);
   });
   ```

2. **Async test timeout**
   ```typescript
   // Increase timeout for slow tests
   it("slow test", async () => {
     // test body
   }, 15000);
   ```

3. **Mock not working**
   ```typescript
   // Ensure mock is hoisted
   vi.mock("./module", () => ({
     func: vi.fn()
   }));
   ```

### Debug Tools

```typescript
// Debug rendered output
screen.debug();

// Debug specific element
screen.debug(screen.getByRole("button"));

// Log available queries
screen.logTestingPlaygroundURL();
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run e2e
```

## Future Improvements

### Planned Enhancements

1. **Visual Regression Testing** - Screenshot comparisons
2. **Accessibility Audits** - Automated a11y testing
3. **Performance Monitoring** - Continuous performance tracking
4. **Test Data Generation** - Faker.js integration
5. **Mutation Testing** - Stryker.js integration
6. **Contract Testing** - API contract validation

### Monitoring Metrics

- Test execution time
- Flaky test rate
- Coverage trends
- Test file count
- Mock usage statistics

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

### Tools
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Fake Timers](https://vitest.dev/api/vi.html#vi-faketimers)

---

**Last Updated:** 2026-03-22  
**Maintainer:** TESTING_LEAD (Robert Taylor)  
**Version:** 2.0.0