# Google Code Review Guidelines

## Terminology

- **CL**: Changelist - One self-contained change submitted for review
- **LGTM**: Looks Good to Me - Reviewer approval
- **Nit**: Minor issue, non-blocking comment
- **CR**: Code Review

## The Standard of Code Review

### Primary Purpose

The primary purpose of code review is to make sure that the overall code health of Google's code base is improving over time.

### What Matters Most

1. **Code Health**: Is this making the codebase better?
2. **Design**: Is the code well-designed?
3. **Functionality**: Does it behave as intended for users?
4. **Complexity**: Could it be simpler?
5. **Tests**: Are there adequate automated tests?
6. **Naming**: Are names clear?
7. **Comments**: Are they useful?
8. **Style**: Does it follow the style guide?
9. **Documentation**: Is it updated?

## What Reviewers Should Look For

### Design

- Does this code belong in the codebase?
- Is this a good design for the system?
- Will this design scale well?

### Functionality

- Does the code do what the author intended?
- Is the code good for users?
- Are there race conditions or security issues?

### Complexity

- Can this be simplified?
- Is it more complex than needed?
- Could a junior developer understand it?

### Tests

- Are there adequate tests?
- Do tests cover the happy path and edge cases?
- Are tests well-designed?

### Naming

- Are names descriptive?
- Can someone understand from the name what it does?

### Comments

- Are comments explaining why, not what?
- Are comments up-to-date?

### Style

- Does code follow the style guide?
- This is where you should be most strict

### Documentation

- Are related docs updated?
- Is there adequate API documentation?

## Speed Expectations

- **Response Time**: Within 24 hours (one business day)
- **Small CLs** (< 400 lines): Review quickly
- **Large CLs**: Review within 24 hours, estimate full review time

## Writing Good Review Comments

### Be Kind

- Critique the code, not the person
- Explain why something is a problem

### Be Clear

- State what you want changed
- Explain the reasoning

### Be Constructive

- Suggest solutions, not just problems
- Offer to discuss in person if complex

## Handling Disagreements

1. First, discuss the issue in the CL comments
2. If still disagreeing, have a meeting to discuss
3. If still can't agree, escalate to a tech lead
4. Document the decision for future reference

## CL Author Responsibilities

1. Keep CLs small and focused
2. Write a good description
3. Self-review before submitting
4. Respond to comments promptly
5. Don't take feedback personally
