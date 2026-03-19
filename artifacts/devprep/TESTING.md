# Testing Infrastructure

Enterprise-grade testing infrastructure for DevPrep.

## Test Types

### Unit Tests

Located in `src/__tests__/`

- Utils: string, validation, transformation functions
- Hooks: useGeneratedContent, useMobile
- Components: ErrorBoundary, OnboardingModal

### Integration Tests

Located in `src/__tests__/integration/` and `api-server/src/__tests__/`

- API routes: /api/content, /api/progress
- End-to-end API flow tests

### E2E Tests (Playwright)

Located in `tests/`

- Smoke tests: Critical user journeys
- Visual regression: Screenshot comparisons
- Page tests: Full application flows

### Mutation Tests (Stryker)

Configured via `stryker.conf.json`

- Tests code survivability
- High mutation score indicates robust tests

## Running Tests

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run tests once with coverage
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run with specific coverage thresholds
pnpm test:coverage

# Run mutation tests
pnpm mutation
```

## Coverage Thresholds

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 80%       |
| Functions  | 80%       |
| Branches   | 80%       |
| Statements | 80%       |

## CI Pipeline

GitHub Actions workflow `.github/workflows/test.yml` runs:

1. **Lint & Typecheck** - ESLint + TypeScript
2. **Unit Tests** - Vitest with coverage
3. **Integration Tests** - API route tests
4. **E2E Smoke Tests** - Critical journeys only
5. **Mutation Tests** - Stryker analysis
6. **Visual Regression** - Playwright screenshots
7. **Coverage Check** - Threshold enforcement
8. **Build** - Production build verification

## Test Fixtures

Use consistent test data via fixtures:

- Channel data: `techChannels`, `certChannels`
- Mock API responses
- Test user IDs

## Best Practices

- Use AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test happy path AND edge cases
- Keep tests deterministic (no flaky tests)
- Single responsibility per test
