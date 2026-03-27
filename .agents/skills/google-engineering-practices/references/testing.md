# Google Testing Practices

## The Google Testing Philosophy

### Core Principles

1. **Testing is a first-class concern**
2. **Write tests before code when appropriate (TDD)**
3. **Tests are documentation**
4. **Keep tests fast and reliable**

## What Makes a Good Test (Testing on the Toilet)

### The F.I.R.S.T. Principles

- **Fast**: Tests should run quickly
- **Independent**: Tests should not depend on each other
- **Repeatable**: Tests should produce the same results
- **Self-Validating**: Clear pass/fail
- **Timely**: Written before code

### Test Structure: AAA Pattern

```javascript
// Arrange - Set up test data and conditions
const user = createTestUser({ name: "Alice" });
const service = new UserService();

// Act - Perform the action being tested
const result = service.getUser(user.id);

// Assert - Verify the expected outcome
expect(result.name).toBe("Alice");
```

### Test Naming

Use descriptive names that explain what is being tested:

```javascript
// Bad
test('test1', () => { ... });

// Good
test('returns user by id', () => { ... });
test('throws error for invalid email', () => { ... });
```

## Test Types

### Unit Tests

- Test a single function or class
- Should be fast
- Mock dependencies
- Test one thing per test

### Integration Tests

- Test how components work together
- Use real dependencies where possible
- More realistic than unit tests

### End-to-End Tests

- Test full user workflows
- Use real browser/server
- Slowest but most realistic

## Mocking Best Practices

### What to Mock

- External services
- Time/date
- Randomness
- Slow operations

### What NOT to Mock

- Business logic
- Things you're actually testing

### Mock Examples

```javascript
// Mocking a service
jest.mock("./apiClient", () => ({
  getUser: jest.fn(),
}));

// Mocking time
jest.useFakeTimers();
jest.setSystemTime(new Date("2024-01-01"));

// Mocking random
Math.random = jest.fn(() => 0.5);
```

## Assertions

### Prefer Narrow Assertions

```javascript
// Narrow (better)
expect(result.user.name).toBe("Alice");
expect(result.count).toBe(5);

// Broad (less informative when failing)
expect(result).toBeTruthy();
```

### Common Assertions

```javascript
// Equality
expect(actual).toBe(expected);
expect(actual).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThanOrEqual(10);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty("name");
expect(object).toMatchObject({ name: "Alice" });

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
```

## Test Coverage

### What Matters

- Critical paths are covered
- Edge cases are covered
- Bug fixes have regression tests

### What Doesn't Matter

- High percentage for its own sake
- Testing trivial code
- Coverage of unused paths

## Testing Anti-Patterns

### Don't Do This

```javascript
// Testing implementation details
expect(wrapper.state("count")).toBe(5);

// Fragile tests
expect(wrapper.find(".btn-xyz").text()).toBe("Click");

// Test pollution
// Don't share mutable state between tests
```

## Test-Driven Development (TDD)

### The Cycle

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### When to Use TDD

- New features with clear requirements
- Bug fixes
- Algorithm implementation

### When NOT to Use TDD

- Exploratory work
- Prototyping
- When requirements are unclear

## Testing in Different Languages

### JavaScript/TypeScript

- Jest, Mocha, Jasmine
- React Testing Library

### Python

- pytest, unittest

### Go

- testing package, testify

### Java

- JUnit, TestNG

## Conclusion

The best tests are:

- Fast to run
- Easy to understand
- Focused on behavior, not implementation
- Well-named
- Independent of each other
